import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';

export const dynamic = 'force-dynamic';
export async function GET() {
  try {
    // Daily sales totals
    const [salesData] = await pool.query<RowDataPacket[]>(
      `SELECT 
        COUNT(*) as total_orders,
        COALESCE(SUM(total_amount), 0) as total_revenue,
        COALESCE(AVG(total_amount), 0) as avg_order_value
      FROM orders
      WHERE created_at >= NOW()
      AND payment_status = 'completed'`
    );

   
const [topItems] = await pool.query<RowDataPacket[]>(
  `SELECT 
    mi.id as menu_item_id,
    mi.name,
    SUM(oi.quantity) as total_quantity,
    SUM(oi.subtotal) as total_revenue
  FROM order_items oi
  JOIN menu_items mi ON oi.menu_item_id = mi.id
  JOIN orders o ON oi.order_id = o.id
  WHERE o.created_at >= NOW() - INTERVAL 24 HOUR -- 👈 Changes here
  AND o.payment_status = 'completed'
  GROUP BY mi.id, mi.name
  ORDER BY total_quantity DESC
  LIMIT 5`
);

    // Peak order times (hourly breakdown for today)
    const [hourlyOrders] = await pool.query<RowDataPacket[]>(
      `SELECT 
        HOUR(created_at) as hour,
        COUNT(*) as order_count
      FROM orders
      WHERE DATE(created_at) = CURDATE()
      AND payment_status = 'completed'
      GROUP BY HOUR(created_at)
      ORDER BY hour`
    );

    // Low stock items
    const [lowStockItems] = await pool.query<RowDataPacket[]>(
      `SELECT 
        id,
        name,
        stock_quantity,
        low_stock_threshold
      FROM menu_items
      WHERE stock_quantity <= low_stock_threshold
      AND is_available = TRUE
      ORDER BY stock_quantity ASC`
    );

    return NextResponse.json({
      success: true,
      data: {
        daily_sales: salesData[0] || { total_orders: 0, total_revenue: 0, avg_order_value: 0 },
        top_selling_items: topItems,
        hourly_orders: hourlyOrders,
        low_stock_items: lowStockItems,
      },
    });
  } catch (error) {
    console.error('Analytics fetch error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch analytics data' },
      { status: 500 }
    );
  }
}