import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { MenuItem, CustomizationOption } from '@/types';
import { RowDataPacket } from 'mysql2';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get('category_id');

    let query = `
      SELECT 
        mi.*,
        c.name as category_name
      FROM menu_items mi
      JOIN categories c ON mi.category_id = c.id
      WHERE mi.is_available = TRUE
    `;

    const params: any[] = [];

    if (categoryId) {
      query += ' AND mi.category_id = ?';
      params.push(categoryId);
    }

    query += ' ORDER BY c.display_order, mi.name';

    const [items] = await pool.query<RowDataPacket[]>(query, params);

    // Get customizations for each item
    const itemsWithCustomizations = await Promise.all(
      items.map(async (item) => {
        const [customizations] = await pool.query<RowDataPacket[]>(
          `SELECT * FROM customization_options 
           WHERE menu_item_id = ? AND is_available = TRUE
           ORDER BY option_type, option_name`,
          [item.id]
        );

        return {
          ...item,
          customizations: customizations as CustomizationOption[],
        };
      })
    );

    return NextResponse.json({
      success: true,
      data: itemsWithCustomizations,
    });
  } catch (error) {
    console.error('Menu fetch error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch menu items' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, base_price, is_available, stock_quantity } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Menu item ID is required' },
        { status: 400 }
      );
    }

    const updates: string[] = [];
    const params: any[] = [];

    if (base_price !== undefined) {
      updates.push('base_price = ?');
      params.push(base_price);
    }
    if (is_available !== undefined) {
      updates.push('is_available = ?');
      params.push(is_available);
    }
    if (stock_quantity !== undefined) {
      updates.push('stock_quantity = ?');
      params.push(stock_quantity);
    }

    if (updates.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No fields to update' },
        { status: 400 }
      );
    }

    params.push(id);

    const query = `UPDATE menu_items SET ${updates.join(', ')} WHERE id = ?`;
    await pool.query(query, params);

    return NextResponse.json({
      success: true,
      message: 'Menu item updated successfully',
    });
  } catch (error) {
    console.error('Menu update error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update menu item' },
      { status: 500 }
    );
  }
}