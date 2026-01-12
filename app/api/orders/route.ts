import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { createOrderSchema } from '@/lib/validation';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

function generateOrderNumber(): string {
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `KFC${timestamp}${random}`;
}

export async function POST(request: NextRequest) {
  const connection = await pool.getConnection();
  
  try {
    const body = await request.json();
    const validation = createOrderSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error.errors },
        { status: 400 }
      );
    }

    const { items, payment_method } = validation.data;

    await connection.beginTransaction();

    // Calculate total and validate items
    let totalAmount = 0;
    const orderItems = [];

    for (const item of items) {
      const [menuItems] = await connection.query<RowDataPacket[]>(
        'SELECT * FROM menu_items WHERE id = ? AND is_available = TRUE',
        [item.menu_item_id]
      );

      if (menuItems.length === 0) {
        throw new Error(`Menu item ${item.menu_item_id} not available`);
      }

      const menuItem = menuItems[0];
      let itemPrice = menuItem.base_price;

      // Add customization prices
      if (item.selected_customizations.length > 0) {
        const [customizations] = await connection.query<RowDataPacket[]>(
          'SELECT * FROM customization_options WHERE id IN (?)',
          [item.selected_customizations]
        );

        customizations.forEach((custom: any) => {
          itemPrice += custom.price_modifier;
        });
      }

      const subtotal = itemPrice * item.quantity;
      totalAmount += subtotal;

      orderItems.push({
        menu_item_id: item.menu_item_id,
        quantity: item.quantity,
        unit_price: itemPrice,
        subtotal,
        special_instructions: item.special_instructions || null,
        selected_customizations: item.selected_customizations,
      });
    }

    // Create order
    const orderNumber = generateOrderNumber();
    const [orderResult] = await connection.query<ResultSetHeader>(
      `INSERT INTO orders (order_number, total_amount, payment_method, payment_status, order_status, estimated_wait_time)
       VALUES (?, ?, ?, 'completed', 'new', 15)`,
      [orderNumber, totalAmount, payment_method]
    );

    const orderId = orderResult.insertId;

    // Insert order items
    for (const item of orderItems) {
      const [itemResult] = await connection.query<ResultSetHeader>(
        `INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, subtotal, special_instructions)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [orderId, item.menu_item_id, item.quantity, item.unit_price, item.subtotal, item.special_instructions]
      );

      // Insert customizations
      if (item.selected_customizations.length > 0) {
        const customizationValues = item.selected_customizations.map((customId: number) => [
          itemResult.insertId,
          customId,
        ]);

        await connection.query(
          'INSERT INTO order_item_customizations (order_item_id, customization_option_id) VALUES ?',
          [customizationValues]
        );
      }

      // Update stock
      await connection.query(
        'UPDATE menu_items SET stock_quantity = stock_quantity - ? WHERE id = ?',
        [item.quantity, item.menu_item_id]
      );
    }

    await connection.commit();

    return NextResponse.json({
      success: true,
      data: {
        order_id: orderId,
        order_number: orderNumber,
        total_amount: totalAmount,
        estimated_wait_time: 15,
      },
    });
  } catch (error) {
    await connection.rollback();
    console.error('Order creation error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create order' },
      { status: 500 }
    );
  } finally {
    connection.release();
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const orderId = searchParams.get('order_id');

    let query = 'SELECT * FROM orders';
    const params: any[] = [];

    if (orderId) {
      query += ' WHERE id = ?';
      params.push(orderId);
    } else if (status) {
      query += ' WHERE order_status = ?';
      params.push(status);
    }

    query += ' ORDER BY created_at DESC LIMIT 100';

    const [orders] = await pool.query<RowDataPacket[]>(query, params);

    return NextResponse.json({
      success: true,
      data: orders,
    });
  } catch (error) {
    console.error('Orders fetch error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch orders' },
      { status: 500 }
    );
  }
}