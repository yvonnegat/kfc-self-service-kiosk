'use client';

import { useState, useEffect } from 'react';
import { ShoppingCart, Plus, Minus, Trash2, CreditCard, Smartphone } from 'lucide-react';
import { MenuItem, Category, CartItem, CustomizationOption } from '@/types';

export default function CustomerKiosk() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showCart, setShowCart] = useState(false);
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [customizations, setCustomizations] = useState<CustomizationOption[]>([]);
  const [quantity, setQuantity] = useState(1);
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [orderComplete, setOrderComplete] = useState(false);
  const [orderNumber, setOrderNumber] = useState('');
  const [inactivityTimer, setInactivityTimer] = useState<NodeJS.Timeout | null>(null);

  // Auto-logout after 60 seconds of inactivity
  useEffect(() => {
    const resetTimer = () => {
      if (inactivityTimer) clearTimeout(inactivityTimer);
      const timer = setTimeout(() => {
        if (cart.length === 0 && !orderComplete) {
          window.location.reload();
        }
      }, 60000);
      setInactivityTimer(timer);
    };

    window.addEventListener('mousemove', resetTimer);
    window.addEventListener('keypress', resetTimer);
    window.addEventListener('touchstart', resetTimer);

    resetTimer();

    return () => {
      if (inactivityTimer) clearTimeout(inactivityTimer);
      window.removeEventListener('mousemove', resetTimer);
      window.removeEventListener('keypress', resetTimer);
      window.removeEventListener('touchstart', resetTimer);
    };
  }, [cart, orderComplete]);

  useEffect(() => {
    fetchCategories();
    fetchMenuItems();
  }, [selectedCategory]);

  const fetchCategories = async () => {
    const res = await fetch('/api/categories');
    const data = await res.json();
    if (data.success) {
      setCategories(data.data);
      if (!selectedCategory && data.data.length > 0) {
        setSelectedCategory(data.data[0].id);
      }
    }
  };

  const fetchMenuItems = async () => {
    const url = selectedCategory
      ? `/api/menu?category_id=${selectedCategory}`
      : '/api/menu';
    const res = await fetch(url);
    const data = await res.json();
    if (data.success) {
      setMenuItems(data.data);
    }
  };

  const openItemCustomization = (item: MenuItem) => {
    setSelectedItem(item);
    setCustomizations([]);
    setQuantity(1);
    setSpecialInstructions('');
  };

  const toggleCustomization = (option: CustomizationOption) => {
    const exists = customizations.find(c => c.id === option.id);
    if (exists) {
      setCustomizations(customizations.filter(c => c.id !== option.id));
    } else {
      // For size/spice, only allow one selection
      if (option.option_type === 'size' || option.option_type === 'spice') {
        const filtered = customizations.filter(c => c.option_type !== option.option_type);
        setCustomizations([...filtered, option]);
      } else {
        setCustomizations([...customizations, option]);
      }
    }
  };

  const addToCart = () => {
    if (!selectedItem) return;

    const customPrice = customizations.reduce((sum, c) => sum + c.price_modifier, 0);
    const itemTotal = (selectedItem.base_price + customPrice) * quantity;

    const cartItem: CartItem = {
      menu_item: selectedItem,
      quantity,
      selected_customizations: customizations,
      special_instructions: specialInstructions,
      item_total: itemTotal,
    };

    setCart([...cart, cartItem]);
    setSelectedItem(null);
  };

  const removeFromCart = (index: number) => {
    setCart(cart.filter((_, i) => i !== index));
  };

  const updateCartQuantity = (index: number, newQty: number) => {
    if (newQty < 1) return;
    const updated = [...cart];
    const item = updated[index];
    const customPrice = item.selected_customizations.reduce((sum, c) => sum + c.price_modifier, 0);
    item.quantity = newQty;
    item.item_total = (item.menu_item.base_price + customPrice) * newQty;
    setCart(updated);
  };

  const getCartTotal = () => {
    return cart.reduce((sum, item) => sum + item.item_total, 0);
  };

  const checkout = async (paymentMethod: 'card' | 'mobile_money') => {
    const orderData = {
      items: cart.map(item => ({
        menu_item_id: item.menu_item.id,
        quantity: item.quantity,
        selected_customizations: item.selected_customizations.map(c => c.id),
        special_instructions: item.special_instructions,
      })),
      payment_method: paymentMethod,
    };

    const res = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orderData),
    });

    const data = await res.json();
    if (data.success) {
      setOrderNumber(data.data.order_number);
      setOrderComplete(true);
      setCart([]);
      setShowCart(false);
      setTimeout(() => {
        setOrderComplete(false);
        window.location.reload();
      }, 10000);
    }
  };

  if (orderComplete) {
    return (
      <div className="min-h-screen bg-red-600 flex items-center justify-center p-8">
        <div className="bg-white rounded-2xl shadow-2xl p-12 max-w-2xl text-center">
          <div className="text-6xl mb-6">✓</div>
          <h1 className="text-4xl font-bold text-gray-800 mb-4">Order Placed Successfully!</h1>
          <div className="bg-gray-100 rounded-lg p-6 mb-6">
            <p className="text-gray-600 mb-2">Your Order Number</p>
            <p className="text-5xl font-bold text-red-600">{orderNumber}</p>
          </div>
          <p className="text-xl text-gray-600 mb-2">Estimated Wait Time: 15 minutes</p>
          <p className="text-gray-500">Please wait for your number to be called</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-red-600 text-white p-6 shadow-lg">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-4xl font-bold">KFC Self-Service Kiosk</h1>
          <button
            onClick={() => setShowCart(true)}
            className="bg-white text-red-600 px-6 py-3 rounded-lg font-semibold flex items-center gap-2 hover:bg-gray-100 transition"
          >
            <ShoppingCart size={24} />
            <span>Cart ({cart.length})</span>
            <span className="bg-red-600 text-white px-3 py-1 rounded-full">
              KSh {getCartTotal().toFixed(2)}
            </span>
          </button>
        </div>
      </header>

      {/* Categories */}
      <div className="bg-white shadow-md">
        <div className="container mx-auto px-6 py-4">
          <div className="flex gap-4 overflow-x-auto">
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-8 py-3 rounded-lg font-semibold whitespace-nowrap transition ${
                  selectedCategory === cat.id
                    ? 'bg-red-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Menu Items */}
      <div className="container mx-auto px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {menuItems.map(item => (
            <div
              key={item.id}
              onClick={() => openItemCustomization(item)}
              className="bg-white rounded-lg shadow-md overflow-hidden cursor-pointer hover:shadow-xl transition transform hover:scale-105"
            >
              <div className="h-48 bg-gray-200 flex items-center justify-center">
                <span className="text-4xl">🍗</span>
              </div>
              <div className="p-4">
                <h3 className="font-bold text-lg mb-2">{item.name}</h3>
                <p className="text-gray-600 text-sm mb-3">{item.description}</p>
                <div className="flex justify-between items-center">
                  <span className="text-2xl font-bold text-red-600">
                    <span>KSh {Number(item.base_price).toFixed(2)}</span>

                  </span>
                  {item.stock_quantity <= item.low_stock_threshold && (
                    <span className="text-xs text-orange-600 font-semibold">Low Stock</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Item Customization Modal */}
      {selectedItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-3xl font-bold mb-4">{selectedItem.name}</h2>
              <p className="text-gray-600 mb-6">{selectedItem.description}</p>

              {selectedItem.customizations && selectedItem.customizations.length > 0 && (
                <div className="mb-6">
                  <h3 className="font-bold text-xl mb-3">Customize Your Order</h3>
                  {['size', 'spice', 'addon'].map(type => {
                    const options = selectedItem.customizations!.filter(c => c.option_type === type);
                    if (options.length === 0) return null;

                    return (
                      <div key={type} className="mb-4">
                        <h4 className="font-semibold text-gray-700 mb-2 capitalize">{type}</h4>
                        <div className="grid grid-cols-2 gap-2">
                          {options.map(option => (
                            <button
                              key={option.id}
                              onClick={() => toggleCustomization(option)}
                              className={`p-3 rounded-lg border-2 transition ${
                                customizations.find(c => c.id === option.id)
                                  ? 'border-red-600 bg-red-50'
                                  : 'border-gray-300 hover:border-gray-400'
                              }`}
                            >
                              <div className="font-medium">{option.option_name}</div>
                              {option.price_modifier > 0 && (
                                <div className="text-sm text-gray-600">
                                +KSh {option.price_modifier
                                  ? Number(option.price_modifier).toFixed(2)
                                  : '0.00'}
                                </div>
                              )}
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="mb-6">
                <h3 className="font-bold text-xl mb-3">Quantity</h3>
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="bg-gray-200 p-3 rounded-lg hover:bg-gray-300"
                  >
                    <Minus size={24} />
                  </button>
                  <span className="text-3xl font-bold w-16 text-center">{quantity}</span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="bg-gray-200 p-3 rounded-lg hover:bg-gray-300"
                  >
                    <Plus size={24} />
                  </button>
                </div>
              </div>

              <div className="mb-6">
                <h3 className="font-bold text-xl mb-3">Special Instructions (Optional)</h3>
                <textarea
                  value={specialInstructions}
                  onChange={(e) => setSpecialInstructions(e.target.value)}
                  placeholder="e.g., No mayo, extra spicy..."
                  className="w-full border-2 border-gray-300 rounded-lg p-3 resize-none"
                  rows={3}
                />
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => setSelectedItem(null)}
                  className="flex-1 bg-gray-200 text-gray-800 py-4 rounded-lg font-bold text-xl hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button
                  onClick={addToCart}
                  className="flex-1 bg-red-600 text-white py-4 rounded-lg font-bold text-xl hover:bg-red-700"
                >
                  Add to Cart - KSh {((selectedItem.base_price + customizations.reduce((s, c) => s + c.price_modifier, 0)) * quantity).toFixed(2)}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cart Modal */}
      {showCart && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-3xl font-bold mb-6">Your Cart</h2>

              {cart.length === 0 ? (
                <div className="text-center py-12">
                  <ShoppingCart size={64} className="mx-auto text-gray-300 mb-4" />
                  <p className="text-xl text-gray-500">Your cart is empty</p>
                </div>
              ) : (
                <>
                  {cart.map((item, index) => (
                    <div key={index} className="border-b pb-4 mb-4">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1">
                          <h3 className="font-bold text-lg">{item.menu_item.name}</h3>
                          {item.selected_customizations.length > 0 && (
                            <p className="text-sm text-gray-600">
                              {item.selected_customizations.map(c => c.option_name).join(', ')}
                            </p>
                          )}
                          {item.special_instructions && (
                            <p className="text-sm text-gray-500 italic">{item.special_instructions}</p>
                          )}
                        </div>
                        <button
                          onClick={() => removeFromCart(index)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <Trash2 size={20} />
                        </button>
                      </div>
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => updateCartQuantity(index, item.quantity - 1)}
                            className="bg-gray-200 p-1 rounded hover:bg-gray-300"
                          >
                            <Minus size={16} />
                          </button>
                          <span className="w-8 text-center font-semibold">{item.quantity}</span>
                          <button
                            onClick={() => updateCartQuantity(index, item.quantity + 1)}
                            className="bg-gray-200 p-1 rounded hover:bg-gray-300"
                          >
                            <Plus size={16} />
                          </button>
                        </div>
                        <span className="font-bold text-lg">KSh {item.item_total.toFixed(2)}</span>
                      </div>
                    </div>
                  ))}

                  <div className="border-t pt-4 mb-6">
                    <div className="flex justify-between items-center text-2xl font-bold">
                      <span>Total:</span>
                      <span className="text-red-600">KSh {getCartTotal().toFixed(2)}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <button
                      onClick={() => checkout('card')}
                      className="bg-blue-600 text-white py-4 rounded-lg font-bold text-xl flex items-center justify-center gap-2 hover:bg-blue-700"
                    >
                      <CreditCard size={24} />
                      Pay by Card
                    </button>
                    <button
                      onClick={() => checkout('mobile_money')}
                      className="bg-green-600 text-white py-4 rounded-lg font-bold text-xl flex items-center justify-center gap-2 hover:bg-green-700"
                    >
                      <Smartphone size={24} />
                      M-Pesa
                    </button>
                  </div>
                </>
              )}

              <button
                onClick={() => setShowCart(false)}
                className="w-full bg-gray-200 text-gray-800 py-4 rounded-lg font-bold text-xl hover:bg-gray-300"
              >
                Continue Shopping
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}