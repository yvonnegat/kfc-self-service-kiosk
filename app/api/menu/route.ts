// app/api/menu/route.ts
import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { handleApiError, successResponse } from '@/lib/utils';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get('category_id');

    let query = `
      SELECT 
        mi.id,
        mi.name,
        mi.description,
        mi.base_price,
        mi.image_url,
        mi.is_available,
        mi.stock_quantity,
        c.id as category_id,
        c.name as category_name
      FROM menu_items mi
      JOIN categories c ON mi.category_id = c.id
      WHERE mi.is_available = TRUE
      AND c.is_active = TRUE
    `;

    const params: any[] = [];

    if (categoryId) {
      query += ` AND mi.category_id = ?`;
      params.push(categoryId);
    }

    query += ` ORDER BY c.display_order, mi.name`;

    const [items] = await pool.execute(query, params);

    const itemsWithCustomizations = await Promise.all(
      (items as any[]).map(async (item) => {
        const [customizations] = await pool.execute(
          `SELECT 
            id,
            option_type,
            option_name,
            price_modifier,
            is_available
          FROM customization_options
          WHERE menu_item_id = ?
          AND is_available = TRUE
          ORDER BY option_type, option_name`,
          [item.id]
        );

        return {
          ...item,
          customizations,
        };
      })
    );

    return NextResponse.json(
      successResponse(itemsWithCustomizations, 'Menu loaded successfully')
    );
  } catch (error) {
    return NextResponse.json(handleApiError(error), { status: 500 });
  }
}
