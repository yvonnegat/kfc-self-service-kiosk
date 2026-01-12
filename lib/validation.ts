import { z } from 'zod';

export const loginSchema = z.object({
  username: z.string().min(3).max(50),
  password: z.string().min(6),
});

export const menuItemSchema = z.object({
  category_id: z.number().int().positive(),
  name: z.string().min(1).max(200),
  description: z.string().optional(),
  base_price: z.number().positive(),
  image_url: z.string().optional(),
  is_available: z.boolean().optional(),
  stock_quantity: z.number().int().nonnegative().optional(),
});

export const updateMenuItemSchema = z.object({
  base_price: z.number().positive().optional(),
  is_available: z.boolean().optional(),
  stock_quantity: z.number().int().nonnegative().optional(),
});

export const customizationSchema = z.object({
  option_type: z.enum(['size', 'spice', 'addon']),
  option_name: z.string().min(1).max(100),
  price_modifier: z.number(),
});

export const orderItemSchema = z.object({
  menu_item_id: z.number().int().positive(),
  quantity: z.number().int().positive().max(99),
  selected_customizations: z.array(z.number().int().positive()),
  special_instructions: z.string().max(500).optional(),
});

export const createOrderSchema = z.object({
  items: z.array(orderItemSchema).min(1),
  payment_method: z.enum(['card', 'mobile_money']),
});

export const updateOrderStatusSchema = z.object({
  order_id: z.number().int().positive(),
  new_status: z.enum(['new', 'in_progress', 'ready', 'completed', 'cancelled']),
});