// app/lib/utils.ts

// Standard API response type
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Error handler for API routes
export function handleApiError(error: any): ApiResponse {
  console.error('API Error:', error);

  // Database connection errors
  if (error.code === 'ECONNREFUSED') {
    return {
      success: false,
      error: 'DATABASE_CONNECTION_FAILED',
      message: 'Unable to connect to database. Please try again.',
    };
  }

  // Duplicate entry errors
  if (error.code === 'ER_DUP_ENTRY') {
    return {
      success: false,
      error: 'DUPLICATE_ENTRY',
      message: 'This record already exists.',
    };
  }

  // Foreign key constraint errors
  if (error.code === 'ER_NO_REFERENCED_ROW_2') {
    return {
      success: false,
      error: 'INVALID_REFERENCE',
      message: 'Referenced item does not exist.',
    };
  }

  // Stock validation errors
  if (error.sqlState === '45000') {
    return {
      success: false,
      error: 'VALIDATION_ERROR',
      message: error.sqlMessage || 'Validation failed.',
    };
  }

  // Generic error
  return {
    success: false,
    error: 'INTERNAL_SERVER_ERROR',
    message: 'An unexpected error occurred. Please try again.',
  };
}

// Success response helper
export function successResponse<T>(data: T, message?: string): ApiResponse<T> {
  return {
    success: true,
    data,
    message,
  };
}

// Generate unique order number
export function generateOrderNumber(): string {
  const date = new Date();
  const year = date.getFullYear().toString().slice(-2);
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const random = Math.floor(Math.random() * 9999).toString().padStart(4, '0');
  
  return `KFC${year}${month}${day}${random}`;
}

// Validate order items
export function validateOrderItems(items: any[]): { valid: boolean; error?: string } {
  if (!items || !Array.isArray(items) || items.length === 0) {
    return { valid: false, error: 'Order must contain at least one item' };
  }

  for (const item of items) {
    if (!item.menu_item_id || !item.quantity || !item.unit_price) {
      return { valid: false, error: 'Invalid item data' };
    }

    if (item.quantity <= 0) {
      return { valid: false, error: 'Quantity must be greater than 0' };
    }

    if (item.unit_price <= 0) {
      return { valid: false, error: 'Invalid price' };
    }
  }

  return { valid: true };
}