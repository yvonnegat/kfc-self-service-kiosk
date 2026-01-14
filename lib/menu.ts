// lib/menu.ts
import pool from '@/lib/db';

export async function getCategories() {
  const [categories] = await pool.execute(
    `SELECT id, name, display_order
     FROM categories
     WHERE is_active = TRUE
     ORDER BY display_order`
  );

  return categories;
}
