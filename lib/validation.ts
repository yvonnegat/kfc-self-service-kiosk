import { z } from 'zod';

// Login validation
export const loginSchema = z.object({
  username: z.string().min(3).max(50),
  password: z.string().min(6),
});

// Signup validation
export const signupSchema = z.object({
  username: z.string()
    .min(3, 'Username must be at least 3 characters')
    .max(50, 'Username must be less than 50 characters')
    .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .max(100, 'Password is too long')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  confirmPassword: z.string(),
  role: z.enum(['kitchen', 'manager'], {
    errorMap: () => ({ message: 'Role must be either kitchen or manager' })
  }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

// Menu item validation
export const menuItemSchema = z.object({
  category_id: z.number().int().positive(),
  name: z.string().min(1).max(200),
  description: z.string().optional(),
  base_price: z.number().positive(),
  image_url: z.string().optional(),
  is_available: z.boolean().optional(),
  stock_quantity: z.number().int().nonnegative().optional(),
});

// Update menu item validation
export const updateMenuItemSchema = z.object({
  base_price: z.number().positive().optional(),
  is_available: z.boolean().optional(),
  stock_quantity: z.number().int().nonnegative().optional(),
});

// Customization validation
export const customizationSchema = z.object({
  option_type: z.enum(['size', 'spice', 'addon']),
  option_name: z.string().min(1).max(100),
  price_modifier: z.number(),
});

// Order item validation
export const orderItemSchema = z.object({
  menu_item_id: z.number().int().positive(),
  quantity: z.number().int().positive().max(99),
  selected_customizations: z.array(z.number().int().positive()),
  special_instructions: z.string().max(500).optional(),
});

// Create order validation
export const createOrderSchema = z.object({
  items: z.array(orderItemSchema).min(1),
  payment_method: z.enum(['card', 'mobile_money']),
});

// Update order status validation
export const updateOrderStatusSchema = z.object({
  order_id: z.number().int().positive(),
  new_status: z.enum(['new', 'in_progress', 'ready', 'completed', 'cancelled']),
});