// app/api/orders/[id]/route.ts
import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { handleApiError, successResponse } from '@/lib/utils';

// GET - Fetch single order details
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const [orders] = await pool.execute(
      `SELECT 
        o.id,
        o.order_number,
        o.total_amount,
        o.payment_method,
        o.payment_status,
        o.order_status,
        o.estimated_wait_time,
        o.created_at,
        o.updated_at,
        TIMESTAMPDIFF(MINUTE, o.created_at, NOW()) as wait_time_minutes
      FROM orders o
      WHERE o.id = ?`,
      [params.id]
    );

    if ((orders as any[]).length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'NOT_FOUND',
          message: 'Order not found',
        },
        { status: 404 }
      );
    }

    const order = (orders as any[])[0];

    // Fetch order items with customizations
    const [items] = await pool.execute(
      `SELECT 
        oi.id,
        oi.quantity,
        oi.unit_price,
        oi.subtotal,
        oi.special_instructions,
        mi.name as menu_item_name,
        mi.image_url,
        GROUP_CONCAT(
          CONCAT(co.option_type, ':', co.option_name)
          SEPARATOR '|'
        ) as customizations
      FROM order_items oi
      JOIN menu_items mi ON oi.menu_item_id = mi.id
      LEFT JOIN order_item_customizations oic ON oi.id = oic.order_item_id
      LEFT JOIN customization_options co ON oic.customization_option_id = co.id
      WHERE oi.order_id = ?
      GROUP BY oi.id`,
      [params.id]
    );

    return NextResponse.json(
      successResponse({
        ...order,
        items,
      })
    );
  } catch (error) {
    return NextResponse.json(handleApiError(error), { status: 500 });
  }
}

// PATCH - Update order status
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { order_status } = body;

    const validStatuses = ['new', 'in_progress', 'ready', 'completed', 'cancelled'];
    
    if (!validStatuses.includes(order_status)) {
      return NextResponse.json(
        {
          success: false,
          error: 'INVALID_STATUS',
          message: `Status must be one of: ${validStatuses.join(', ')}`,
        },
        { status: 400 }
      );
    }

    // Update order status
    const [result] = await pool.execute(
      `UPDATE orders 
       SET order_status = ?,
           updated_at = CURRENT_TIMESTAMP,
           completed_at = CASE 
             WHEN ? = 'completed' THEN CURRENT_TIMESTAMP 
             ELSE completed_at 
           END
       WHERE id = ?`,
      [order_status, order_status, params.id]
    );

    if ((result as any).affectedRows === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'NOT_FOUND',
          message: 'Order not found',
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      successResponse(null, `Order status updated to ${order_status}`)
    );
  } catch (error) {
    return NextResponse.json(handleApiError(error), { status: 500 });
  }
}