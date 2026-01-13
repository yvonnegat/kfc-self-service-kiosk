// app/api/orders/route.ts
import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import {
  handleApiError,
  successResponse,
  generateOrderNumber,
  validateOrderItems,
} from '@/lib/utils';
import { RowDataPacket } from 'mysql2';

// POST - Create new order (handles multiple items at once)
export async function POST(request: Request) {
  const connection = await pool.getConnection();

  try {
    const body = await request.json();
    const { items, payment_method, total_amount } = body;

    // Validate request
    const validation = validateOrderItems(items);
    if (!validation.valid) {
      return NextResponse.json(
        {
          success: false,
          error: 'VALIDATION_ERROR',
          message: validation.error,
        },
        { status: 400 }
      );
    }

    // Start transaction (ensures all operations succeed or all fail)
    await connection.beginTransaction();

    // Generate unique order number
    const orderNumber = generateOrderNumber();

    // Insert order
    const [orderResult] = await connection.execute(
      `INSERT INTO orders 
       (order_number, total_amount, payment_method, payment_status, order_status, estimated_wait_time)
       VALUES (?, ?, ?, 'pending', 'new', 15)`,
      [orderNumber, total_amount, payment_method]
    );

    const orderId = (orderResult as any).insertId;

    // Check stock availability for all items first
    for (const item of items) {
      const [stockCheck] = await connection.execute<RowDataPacket[]>(
        `SELECT stock_quantity, name FROM menu_items WHERE id = ? FOR UPDATE`,
        [item.menu_item_id]
      );

      if (stockCheck.length === 0) {
        throw new Error(`Item not found: ${item.menu_item_id}`);
      }

      if (stockCheck[0].stock_quantity < item.quantity) {
        throw new Error(
          `Insufficient stock for ${stockCheck[0].name}. Available: ${stockCheck[0].stock_quantity}`
        );
      }
    }

    // Insert all order items and update stock
    for (const item of items) {
      const subtotal = item.quantity * item.unit_price;

      // Insert order item
      const [itemResult] = await connection.execute(
        `INSERT INTO order_items 
         (order_id, menu_item_id, quantity, unit_price, subtotal, special_instructions)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          orderId,
          item.menu_item_id,
          item.quantity,
          item.unit_price,
          subtotal,
          item.special_instructions || null,
        ]
      );

      const orderItemId = (itemResult as any).insertId;

      // Insert customizations if any
      if (item.customizations && item.customizations.length > 0) {
        for (const customizationId of item.customizations) {
          await connection.execute(
            `INSERT INTO order_item_customizations 
             (order_item_id, customization_option_id)
             VALUES (?, ?)`,
            [orderItemId, customizationId]
          );
        }
      }

      // Update stock
      await connection.execute(
        `UPDATE menu_items 
         SET stock_quantity = stock_quantity - ?
         WHERE id = ?`,
        [item.quantity, item.menu_item_id]
      );

      // Log inventory change
      await connection.execute(
        `INSERT INTO inventory_logs 
         (menu_item_id, quantity_change, reason)
         VALUES (?, ?, ?)`,
        [item.menu_item_id, -item.quantity, `Order ${orderNumber}`]
      );
    }

    // Mark payment as completed (in real app, this would be after payment gateway)
    await connection.execute(
      `UPDATE orders SET payment_status = 'completed' WHERE id = ?`,
      [orderId]
    );

    // Commit transaction
    await connection.commit();

    // Fetch complete order details
    const [orderDetails] = await connection.execute<RowDataPacket[]>(
      `SELECT 
        o.*,
        JSON_ARRAYAGG(
          JSON_OBJECT(
            'id', oi.id,
            'menu_item_id', oi.menu_item_id,
            'name', mi.name,
            'quantity', oi.quantity,
            'unit_price', oi.unit_price,
            'subtotal', oi.subtotal,
            'special_instructions', oi.special_instructions
          )
        ) as items
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
      LEFT JOIN menu_items mi ON oi.menu_item_id = mi.id
      WHERE o.id = ?
      GROUP BY o.id`,
      [orderId]
    );

    return NextResponse.json(
      successResponse(orderDetails[0], 'Order created successfully'),
      { status: 201 }
    );
  } catch (error: any) {
    // Rollback on error
    await connection.rollback();
    return NextResponse.json(handleApiError(error), { status: 500 });
  } finally {
    // Always release connection back to pool
    connection.release();
  }
}

// GET - Fetch orders (for kitchen/manager views)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const limit = searchParams.get('limit') || '50';

    let query = `
      SELECT 
        o.id,
        o.order_number,
        o.total_amount,
        o.order_status,
        o.payment_status,
        o.estimated_wait_time,
        o.created_at,
        TIMESTAMPDIFF(MINUTE, o.created_at, NOW()) as wait_time_minutes,
        COUNT(oi.id) as item_count
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
      WHERE 1=1
    `;

    const params: any[] = [];

    if (status) {
      query += ` AND o.order_status = ?`;
      params.push(status);
    }

    query += `
      GROUP BY o.id
      ORDER BY o.created_at DESC
      LIMIT ?
    `;
    params.push(parseInt(limit));

    const [orders] = await pool.execute(query, params);

    return NextResponse.json(successResponse(orders, 'Orders fetched'));
  } catch (error) {
    return NextResponse.json(handleApiError(error), { status: 500 });
  }
}