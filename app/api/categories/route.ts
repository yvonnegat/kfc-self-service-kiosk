// app/api/categories/route.ts
import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { handleApiError, successResponse } from '@/lib/utils';

// GET - Fetch all active categories with item counts
export async function GET() {
  try {
    const [categories] = await pool.execute(
      `SELECT 
        c.id,
        c.name,
        c.display_order,
        COUNT(mi.id) as item_count,
        SUM(CASE WHEN mi.is_available = TRUE THEN 1 ELSE 0 END) as available_count
      FROM categories c
      LEFT JOIN menu_items mi ON c.id = mi.category_id
      WHERE c.is_active = TRUE
      GROUP BY c.id
      ORDER BY c.display_order`
    );

    return NextResponse.json(
      successResponse(categories, 'Categories loaded')
    );
  } catch (error) {
    return NextResponse.json(handleApiError(error), { status: 500 });
  }
}