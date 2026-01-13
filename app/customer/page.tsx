'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import { ShoppingCart, Plus, Minus, Trash2, CreditCard, Smartphone, X, Check, Clock, LogOut, AlertCircle } from 'lucide-react';

// Types
interface MenuItem {
  id: number;
  name: string;
  description: string;
  base_price: number;
  stock_quantity: number;
  low_stock_threshold: number;
  customizations?: CustomizationOption[];
}

interface Category {
  id: number;
  name: string;
}

interface CartItem {
  menu_item: MenuItem;
  quantity: number;
  selected_customizations: CustomizationOption[];
  special_instructions: string;
  item_total: number;
}

interface CustomizationOption {
  id: number;
  option_name: string;
  option_type: string;
  price_modifier: number;
}

interface SessionState {
  sessionId: string;
  startTime: number;
  lastActivity: number;
  cart: CartItem[];
  selectedCategory: number | null;
}

// Extend Window interface for TypeScript
declare global {
  interface Window {
    sessionData?: SessionState;
  }
}

// Session Manager Hook
const useSessionManager = () => {
  const [sessionId, setSessionId] = useState<string>('');
  const [showWarning, setShowWarning] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(60);
  const inactivityTimerRef = useRef<NodeJS.Timeout | null>(null);
  const warningTimerRef = useRef<NodeJS.Timeout | null>(null);
  const countdownRef = useRef<NodeJS.Timeout | null>(null);

  const INACTIVITY_TIMEOUT = 60000; // 60 seconds
  const WARNING_TIME = 15000; // Show warning 15 seconds before timeout

  // Generate unique session ID
  const generateSessionId = useCallback(() => {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }, []);

  // Initialize session
  const initSession = useCallback(() => {
    const newSessionId = generateSessionId();
    setSessionId(newSessionId);
    
    const sessionState: SessionState = {
      sessionId: newSessionId,
      startTime: Date.now(),
      lastActivity: Date.now(),
      cart: [],
      selectedCategory: null,
    };
    
    // Store in memory (not localStorage as it's not supported)
    window.sessionData = sessionState;
    
    console.log('Session initialized:', newSessionId);
    return newSessionId;
  }, [generateSessionId]);

  // Update last activity
  const updateActivity = useCallback(() => {
    if (window.sessionData) {
      window.sessionData.lastActivity = Date.now();
    }
    setShowWarning(false);
    setTimeRemaining(60);
  }, []);

  // End session
  const endSession = useCallback(() => {
    console.log('Session ended:', sessionId);
    delete window.sessionData;
    window.location.reload();
  }, [sessionId]);

  // Reset all timers
  const resetTimers = useCallback(() => {
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
    }
    if (warningTimerRef.current) {
      clearTimeout(warningTimerRef.current);
    }
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
    }

    // Show warning 15 seconds before timeout
    warningTimerRef.current = setTimeout(() => {
      setShowWarning(true);
      setTimeRemaining(15);
      
      // Start countdown
      countdownRef.current = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            if (countdownRef.current) clearInterval(countdownRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }, INACTIVITY_TIMEOUT - WARNING_TIME);

    // Set main inactivity timeout
    inactivityTimerRef.current = setTimeout(() => {
      endSession();
    }, INACTIVITY_TIMEOUT);
  }, [endSession]);

  // Handle user activity
  const handleActivity = useCallback(() => {
    updateActivity();
    resetTimers();
  }, [updateActivity, resetTimers]);

  // Continue session (from warning)
  const continueSession = useCallback(() => {
    handleActivity();
  }, [handleActivity]);

  // Setup activity listeners
  useEffect(() => {
    const events = ['mousedown', 'keydown', 'touchstart', 'scroll'];
    
    events.forEach(event => {
      window.addEventListener(event, handleActivity);
    });

    return () => {
      events.forEach(event => {
        window.removeEventListener(event, handleActivity);
      });
      if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
      if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, [handleActivity]);

  return {
    sessionId,
    showWarning,
    timeRemaining,
    initSession,
    endSession,
    continueSession,
    handleActivity,
  };
};

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

  const {
    sessionId,
    showWarning,
    timeRemaining,
    initSession,
    endSession,
    continueSession,
  } = useSessionManager();

  // Initialize session on mount
  useEffect(() => {
    initSession();
  }, [initSession]);

  // Fetch categories from API
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await fetch('/api/categories');
        const data = await res.json();
        if (data.success && data.data) {
          setCategories(data.data);
          if (!selectedCategory && data.data.length > 0) {
            setSelectedCategory(data.data[0].id);
          }
        }
      } catch (error) {
        console.error('Error fetching categories:', error);
      }
    };

    fetchCategories();
  }, [selectedCategory]);

  // Fetch menu items from API
  useEffect(() => {
    const fetchMenuItems = async () => {
      try {
        const url = selectedCategory
          ? `/api/menu?category_id=${selectedCategory}`
          : '/api/menu';
        const res = await fetch(url);
        const data = await res.json();
        if (data.success && data.data) {
          setMenuItems(data.data);
        }
      } catch (error) {
        console.error('Error fetching menu items:', error);
      }
    };

    if (selectedCategory) {
      fetchMenuItems();
    }
  }, [selectedCategory]);

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

    const newCart = [...cart, cartItem];
    setCart(newCart);
    
    // Update session cart
    if (window.sessionData) {
      window.sessionData.cart = newCart;
    }
    
    setSelectedItem(null);
  };

  const removeFromCart = (index: number) => {
    const newCart = cart.filter((_, i) => i !== index);
    setCart(newCart);
    
    if (window.sessionData) {
      window.sessionData.cart = newCart;
    }
  };

  const updateCartQuantity = (index: number, newQty: number) => {
    if (newQty < 1) return;
    const updated = [...cart];
    const item = updated[index];
    const customPrice = item.selected_customizations.reduce((sum, c) => sum + c.price_modifier, 0);
    item.quantity = newQty;
    item.item_total = (item.menu_item.base_price + customPrice) * newQty;
    setCart(updated);
    
    if (window.sessionData) {
      window.sessionData.cart = updated;
    }
  };

  const getCartTotal = () => {
    return cart.reduce((sum, item) => sum + item.item_total, 0);
  };

  const checkout = async (paymentMethod: 'card' | 'mobile_money') => {
    try {
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
      if (data.success && data.data) {
        setOrderNumber(data.data.order_number);
        setOrderComplete(true);
        setCart([]);
        setShowCart(false);
        
        // Clear session cart
        if (window.sessionData) {
          window.sessionData.cart = [];
        }
        
        // Auto-restart after 10 seconds
        setTimeout(() => {
          setOrderComplete(false);
          endSession();
        }, 10000);
      } else {
        console.error('Order creation failed:', data.error);
        alert('Failed to create order. Please try again.');
      }
    } catch (error) {
      console.error('Error creating order:', error);
      alert('An error occurred. Please try again.');
    }
  };

  if (orderComplete) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-600 via-red-500 to-red-700 flex items-center justify-center p-8">
        <div className="bg-white rounded-3xl shadow-2xl p-12 max-w-2xl text-center">
          <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Check className="text-green-600" size={48} strokeWidth={3} />
          </div>
          <h1 className="text-5xl font-bold text-gray-800 mb-3">Order Confirmed!</h1>
          <p className="text-gray-600 mb-8 text-lg">Thank you for choosing KFC</p>
          
          <div className="bg-gradient-to-r from-red-50 to-orange-50 rounded-2xl p-8 mb-8 border-2 border-red-100">
            <p className="text-gray-600 mb-3 text-sm uppercase tracking-wider font-semibold">Your Order Number</p>
            <p className="text-6xl font-black text-red-600 tracking-tight">{orderNumber}</p>
          </div>
          
          <div className="flex items-center justify-center gap-3 text-gray-700 mb-2">
            <Clock className="text-red-600" size={24} />
            <p className="text-xl font-semibold">Estimated Wait: 15 minutes</p>
          </div>
          <p className="text-gray-500 text-lg">We'll call your number when ready</p>
          
          <div className="mt-8 text-sm text-gray-400">
            Session ID: {sessionId}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      {/* Inactivity Warning Modal */}
      {showWarning && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-md w-full p-8 shadow-2xl animate-bounce-in">
            <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertCircle className="text-orange-600" size={40} strokeWidth={2.5} />
            </div>
            <h2 className="text-3xl font-bold text-gray-800 mb-4 text-center">Still there?</h2>
            <p className="text-gray-600 text-center mb-6 text-lg">
              Your session will end in <span className="font-black text-red-600 text-2xl">{timeRemaining}</span> seconds
            </p>
            <button
              onClick={continueSession}
              className="w-full bg-gradient-to-r from-red-600 to-red-500 text-white py-4 rounded-2xl font-bold text-xl hover:from-red-700 hover:to-red-600 transition-all transform hover:scale-105 shadow-lg"
            >
              Continue Shopping
            </button>
            <button
              onClick={endSession}
              className="w-full mt-3 bg-gray-100 text-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-200 transition"
            >
              End Session
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="bg-gradient-to-r from-red-600 via-red-500 to-red-600 text-white p-6 shadow-xl sticky top-0 z-40">
        <div className="container mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-5xl font-black tracking-tight">KFC</h1>
            <p className="text-red-100 text-sm mt-1">Self-Service Kiosk</p>
            <p className="text-red-200 text-xs mt-1 font-mono">Session: {sessionId.slice(-8)}</p>
          </div>
          <div className="flex gap-4 items-center">
            <button
              onClick={endSession}
              className="bg-white/20 hover:bg-white/30 text-white px-4 py-3 rounded-xl font-semibold flex items-center gap-2 transition"
            >
              <LogOut size={20} />
              End Session
            </button>
            <button
              onClick={() => setShowCart(true)}
              className="bg-white text-red-600 px-8 py-4 rounded-2xl font-bold flex items-center gap-3 hover:bg-red-50 transition-all transform hover:scale-105 shadow-lg relative"
            >
              <div className="relative">
                <ShoppingCart size={28} />
                {cart.length > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-600 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
                    {cart.length}
                  </span>
                )}
              </div>
              <div className="text-left">
                <div className="text-xs text-red-400 uppercase tracking-wide">Total</div>
                <div className="text-xl font-black">KSh {getCartTotal().toFixed(2)}</div>
              </div>
            </button>
          </div>
        </div>
      </header>

      {/* Categories */}
      <div className="bg-white shadow-lg border-b-4 border-red-100 sticky top-24 z-30">
        <div className="container mx-auto px-6 py-6">
          <div className="flex gap-3 overflow-x-auto pb-2">
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-8 py-4 rounded-xl font-bold whitespace-nowrap transition-all transform hover:scale-105 ${
                  selectedCategory === cat.id
                    ? 'bg-gradient-to-r from-red-600 to-red-500 text-white shadow-lg scale-105'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 shadow-md'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Menu Items */}
      <div className="container mx-auto px-6 py-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {menuItems.map(item => (
            <div
              key={item.id}
              onClick={() => openItemCustomization(item)}
              className="bg-white rounded-2xl shadow-lg overflow-hidden cursor-pointer hover:shadow-2xl transition-all transform hover:-translate-y-2 duration-300 border-2 border-transparent hover:border-red-200"
            >
              <div className="h-56 bg-gradient-to-br from-orange-100 via-red-50 to-yellow-50 flex items-center justify-center relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent"></div>
                <span className="text-7xl transform transition-transform hover:scale-110 duration-300 relative z-10">🍗</span>
                {item.stock_quantity <= item.low_stock_threshold && (
                  <div className="absolute top-3 right-3 bg-orange-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg animate-pulse">
                    Low Stock
                  </div>
                )}
              </div>
              <div className="p-6">
                <h3 className="font-bold text-xl mb-2 text-gray-800">{item.name}</h3>
                <p className="text-gray-500 text-sm mb-4">{item.description}</p>
                <div className="flex justify-between items-center pt-2 border-t border-gray-100">
                  <span className="text-3xl font-black text-red-600">
                    KSh {Number(item.base_price).toFixed(2)}
                  </span>
                  <div className="bg-red-600 text-white p-3 rounded-full">
                    <Plus size={24} />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Item Customization Modal */}
      {selectedItem && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="sticky top-0 bg-gradient-to-r from-red-600 to-red-500 text-white p-6 rounded-t-3xl flex justify-between items-center z-10">
              <h2 className="text-3xl font-bold">{selectedItem.name}</h2>
              <button
                onClick={() => setSelectedItem(null)}
                className="bg-white/20 hover:bg-white/30 p-2 rounded-full transition"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-8">
              <p className="text-gray-600 mb-8 text-lg">{selectedItem.description}</p>

              {selectedItem.customizations && selectedItem.customizations.length > 0 && (
                <div className="mb-8">
                  <h3 className="font-bold text-2xl mb-6 text-gray-800">Customize Your Order</h3>
                  {['size', 'spice', 'addon'].map(type => {
                    const options = selectedItem.customizations!.filter(c => c.option_type === type);
                    if (options.length === 0) return null;

                    return (
                      <div key={type} className="mb-6">
                        <h4 className="font-bold text-gray-700 mb-4 capitalize text-lg">{type}</h4>
                        <div className="grid grid-cols-2 gap-4">
                          {options.map(option => {
                            const isSelected = customizations.find(c => c.id === option.id);
                            return (
                              <button
                                key={option.id}
                                onClick={() => toggleCustomization(option)}
                                className={`p-5 rounded-xl border-2 transition-all ${
                                  isSelected
                                    ? 'border-red-600 bg-red-50 shadow-lg'
                                    : 'border-gray-200 hover:border-gray-300 bg-white'
                                }`}
                              >
                                <div className="flex items-center justify-between">
                                  <div className="font-bold">{option.option_name}</div>
                                  {isSelected && <Check className="text-red-600" size={20} />}
                                </div>
                                {option.price_modifier > 0 && (
                                  <div className="text-sm text-gray-600">
                                    +KSh {Number(option.price_modifier).toFixed(2)}
                                  </div>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="mb-8">
                <h3 className="font-bold text-2xl mb-6 text-gray-800">Quantity</h3>
                <div className="flex items-center justify-center gap-6 bg-gray-50 rounded-2xl p-6">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="bg-white shadow-lg p-4 rounded-xl hover:bg-gray-100 transition"
                  >
                    <Minus size={28} className="text-red-600" />
                  </button>
                  <span className="text-5xl font-black w-24 text-center text-red-600">{quantity}</span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="bg-white shadow-lg p-4 rounded-xl hover:bg-gray-100 transition"
                  >
                    <Plus size={28} className="text-red-600" />
                  </button>
                </div>
              </div>

              <div className="flex gap-4 pt-6">
                <button
                  onClick={() => setSelectedItem(null)}
                  className="flex-1 bg-gray-100 text-gray-700 py-5 rounded-2xl font-bold text-xl hover:bg-gray-200 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={addToCart}
                  className="flex-1 bg-gradient-to-r from-red-600 to-red-500 text-white py-5 rounded-2xl font-bold text-xl hover:from-red-700 hover:to-red-600 transition shadow-lg"
                >
                  Add - KSh {((selectedItem.base_price + customizations.reduce((s, c) => s + c.price_modifier, 0)) * quantity).toFixed(2)}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cart Modal */}
      {showCart && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="sticky top-0 bg-gradient-to-r from-red-600 to-red-500 text-white p-6 rounded-t-3xl flex justify-between items-center z-10">
              <h2 className="text-3xl font-bold">Your Cart</h2>
              <button
                onClick={() => setShowCart(false)}
                className="bg-white/20 hover:bg-white/30 p-2 rounded-full transition"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-8">
              {cart.length === 0 ? (
                <div className="text-center py-20">
                  <ShoppingCart size={64} className="text-gray-300 mx-auto mb-4" />
                  <p className="text-2xl text-gray-400 font-semibold">Your cart is empty</p>
                </div>
              ) : (
                <>
                  <div className="space-y-4 mb-8">
                    {cart.map((item, index) => (
                      <div key={index} className="bg-gray-50 rounded-2xl p-6 shadow-md">
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex-1">
                            <h3 className="font-bold text-xl text-gray-800">{item.menu_item.name}</h3>
                            {item.selected_customizations.length > 0 && (
                              <div className="flex flex-wrap gap-2 mt-2">
                                {item.selected_customizations.map(c => (
                                  <span key={c.id} className="bg-white px-3 py-1 rounded-full text-sm text-gray-600">
                                    {c.option_name}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                          <button
                            onClick={() => removeFromCart(index)}
                            className="text-red-600 hover:text-red-800 p-2"
                          >
                            <Trash2 size={20} />
                          </button>
                        </div>
                        <div className="flex justify-between items-center pt-4 border-t border-gray-200">
                          <div className="flex items-center gap-3">
                            <button
                              onClick={() => updateCartQuantity(index, item.quantity - 1)}
                              className="p-2 hover:bg-gray-200 rounded-lg"
                            >
                              <Minus size={18} />
                            </button>
                            <span className="w-12 text-center font-bold">{item.quantity}</span>
                            <button
                              onClick={() => updateCartQuantity(index, item.quantity + 1)}
                              className="p-2 hover:bg-gray-200 rounded-lg"
                            >
                              <Plus size={18} />
                            </button>
                          </div>
                          <span className="font-black text-2xl text-red-600">
                            KSh {item.item_total.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="bg-gradient-to-r from-gray-50 to-red-50 rounded-2xl p-6 mb-8">
                    <div className="flex justify-between items-center">
                      <span className="text-2xl font-bold text-gray-700">Total:</span>
                      <span className="text-4xl font-black text-red-600">
                        KSh {getCartTotal().toFixed(2)}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <button
                      onClick={() => checkout('card')}
                      className="bg-gradient-to-r from-blue-600 to-blue-500 text-white py-5 rounded-2xl font-bold text-xl flex items-center justify-center gap-3 hover:from-blue-700 hover:to-blue-600 transition shadow-lg"
                    >
                      <CreditCard size={28} />
                      Pay by Card
                    </button>
                    <button
                      onClick={() => checkout('mobile_money')}
                      className="bg-gradient-to-r from-green-600 to-green-500 text-white py-5 rounded-2xl font-bold text-xl flex items-center justify-center gap-3 hover:from-green-700 hover:to-green-600 transition shadow-lg"
                    >
                      <Smartphone size={28} />
                      M-Pesa
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes bounce-in {
          0% { transform: scale(0.3); opacity: 0; }
          50% { transform: scale(1.05); }
          70% { transform: scale(0.9); }
          100% { transform: scale(1); opacity: 1; }
        }
        .animate-bounce-in {
          animation: bounce-in 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55);
        }
      `}</style>
    </div>
  );
}