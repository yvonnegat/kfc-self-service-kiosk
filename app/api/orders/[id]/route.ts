import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const orderId = params.id;

    // Get order details
    const [orders] = await pool.query<RowDataPacket[]>(
      'SELECT * FROM orders WHERE id = ?',
      [orderId]
    );

    if (orders.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Order not found' },
        { status: 404 }
      );
    }

    const order = orders[0];

    // Get order items with menu item details
    const [items] = await pool.query<RowDataPacket[]>(
      `SELECT 
        oi.*,
        mi.name as menu_item_name,
        mi.image_url
      FROM order_items oi
      JOIN menu_items mi ON oi.menu_item_id = mi.id
      WHERE oi.order_id = ?`,
      [orderId]
    );

    // Get customizations for each item
    const itemsWithCustomizations = await Promise.all(
      items.map(async (item) => {
        const [customizations] = await pool.query<RowDataPacket[]>(
          `SELECT co.* 
           FROM order_item_customizations oic
           JOIN customization_options co ON oic.customization_option_id = co.id
           WHERE oic.order_item_id = ?`,
          [item.id]
        );

        return {
          ...item,
          customizations,
        };
      })
    );

    return NextResponse.json({
      success: true,
      data: {
        ...order,
        items: itemsWithCustomizations,
      },
    });
  } catch (error) {
    console.error('Order detail fetch error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch order details' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const orderId = params.id;
    const body = await request.json();
    const { order_status } = body;

    if (!order_status) {
      return NextResponse.json(
        { success: false, error: 'order_status is required' },
        { status: 400 }
      );
    }

    const validStatuses = ['new', 'in_progress', 'ready', 'completed', 'cancelled'];
    if (!validStatuses.includes(order_status)) {
      return NextResponse.json(
        { success: false, error: 'Invalid order status' },
        { status: 400 }
      );
    }

    await pool.query(
      'UPDATE orders SET order_status = ?, updated_at = NOW() WHERE id = ?',
      [order_status, orderId]
    );

    if (order_status === 'completed') {
      await pool.query(
        'UPDATE orders SET completed_at = NOW() WHERE id = ?',
        [orderId]
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Order status updated successfully',
    });
  } catch (error) {
    console.error('Order update error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update order status' },
      { status: 500 }
    );
  }
}