// User types
export type UserRole = 'manager' | 'kitchen' | 'customer';

export interface User {
  id: number;
  username: string;
  role: UserRole;
}

// Menu types
export interface Category {
  id: number;
  name: string;
  display_order: number;
  is_active: boolean;
}

export interface MenuItem {
  id: number;
  category_id: number;
  name: string;
  description: string;
  base_price: number;
  image_url: string;
  is_available: boolean;
  stock_quantity: number;
  low_stock_threshold: number;
  customizations?: CustomizationOption[];
}

export interface CustomizationOption {
  id: number;
  menu_item_id: number;
  option_type: 'size' | 'spice' | 'addon';
  option_name: string;
  price_modifier: number;
  is_available: boolean;
}

// Cart types
export interface CartItem {
  menu_item: MenuItem;
  quantity: number;
  selected_customizations: CustomizationOption[];
  special_instructions?: string;
  item_total: number;
}

// Order types
export type OrderStatus = 'new' | 'in_progress' | 'ready' | 'completed' | 'cancelled';
export type PaymentMethod = 'card' | 'mobile_money';

export interface Order {
  id: number;
  order_number: string;
  total_amount: number;
  payment_method: PaymentMethod;
  payment_status: 'pending' | 'completed' | 'failed';
  order_status: OrderStatus;
  estimated_wait_time: number;
  created_at: string;
  updated_at: string;
  completed_at?: string;
  items?: OrderItem[];
}

export interface OrderItem {
  id: number;
  order_id: number;
  menu_item_id: number;
  menu_item_name: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
  special_instructions?: string;
  customizations?: CustomizationOption[];
}

// Analytics types
export interface DailySales {
  total_orders: number;
  total_revenue: number;
  avg_order_value: number;
}

export interface TopSellingItem {
  menu_item_id: number;
  name: string;
  total_quantity: number;
  total_revenue: number;
}

export interface HourlyOrders {
  hour: number;
  order_count: number;
}

export interface LowStockItem {
  id: number;
  name: string;
  stock_quantity: number;
  low_stock_threshold: number;
}