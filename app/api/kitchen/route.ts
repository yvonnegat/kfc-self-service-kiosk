import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';

export async function GET() {
  try {
    // Get active orders (new, in_progress)
    const [orders] = await pool.query<RowDataPacket[]>(
      `SELECT * FROM orders 
       WHERE order_status IN ('new', 'in_progress')
       ORDER BY 
         CASE order_status 
           WHEN 'new' THEN 1 
           WHEN 'in_progress' THEN 2 
         END,
         created_at ASC`
    );

    // Get items for each order
    const ordersWithItems = await Promise.all(
      orders.map(async (order) => {
        const [items] = await pool.query<RowDataPacket[]>(
          `SELECT 
            oi.*,
            mi.name as menu_item_name
          FROM order_items oi
          JOIN menu_items mi ON oi.menu_item_id = mi.id
          WHERE oi.order_id = ?`,
          [order.id]
        );

        // Get customizations for each item
        const itemsWithCustomizations = await Promise.all(
          items.map(async (item) => {
            const [customizations] = await pool.query<RowDataPacket[]>(
              `SELECT co.option_name, co.option_type
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

        return {
          ...order,
          items: itemsWithCustomizations,
        };
      })
    );

    // Calculate queue metrics
    const queueLength = orders.length;
    const oldestOrder = orders.length > 0 ? orders[0] : null;
    const oldestWaitTime = oldestOrder
      ? Math.floor((Date.now() - new Date(oldestOrder.created_at).getTime()) / 60000)
      : 0;

    return NextResponse.json({
      success: true,
      data: {
        orders: ordersWithItems,
        queue_length: queueLength,
        oldest_wait_time: oldestWaitTime,
      },
    });
  } catch (error) {
    console.error('Kitchen orders fetch error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch kitchen orders' },
      { status: 500 }
    );
  }
}