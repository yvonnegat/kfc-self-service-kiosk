'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  ShoppingCart, Plus, Minus, Trash2, CreditCard, 
  Smartphone, X, Check, Clock, LogOut, AlertCircle, 
  Home as HomeIcon 
} from 'lucide-react';

// --- Types ---
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

declare global {
  interface Window {
    sessionData?: SessionState;
  }
}

// --- Session Manager Hook ---
const useSessionManager = () => {
  const [sessionId, setSessionId] = useState<string>('');
  const [showWarning, setShowWarning] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(60);
  const inactivityTimerRef = useRef<NodeJS.Timeout | null>(null);
  const warningTimerRef = useRef<NodeJS.Timeout | null>(null);
  const countdownRef = useRef<NodeJS.Timeout | null>(null);

  const INACTIVITY_TIMEOUT = 60000; 
  const WARNING_TIME = 15000; 

  const generateSessionId = useCallback(() => {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }, []);

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
    window.sessionData = sessionState;
    return newSessionId;
  }, [generateSessionId]);

  const updateActivity = useCallback(() => {
    if (window.sessionData) {
      window.sessionData.lastActivity = Date.now();
    }
    setShowWarning(false);
    setTimeRemaining(60);
  }, []);

  // --- FIXED ACTION: FORCE REDIRECT TO HOME ---
  const endSession = useCallback(() => {
    console.log("Ending session and returning home...");
    delete window.sessionData;
    // We use href = '/' to ensure the app completely resets
    window.location.href = '/'; 
  }, []);

  const resetTimers = useCallback(() => {
    if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
    if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
    if (countdownRef.current) clearInterval(countdownRef.current);

    warningTimerRef.current = setTimeout(() => {
      setShowWarning(true);
      setTimeRemaining(15);
      countdownRef.current = setInterval(() => {
        setTimeRemaining(prev => (prev <= 1 ? 0 : prev - 1));
      }, 1000);
    }, INACTIVITY_TIMEOUT - WARNING_TIME);

    inactivityTimerRef.current = setTimeout(() => {
      endSession();
    }, INACTIVITY_TIMEOUT);
  }, [endSession]);

  const handleActivity = useCallback(() => {
    updateActivity();
    resetTimers();
  }, [updateActivity, resetTimers]);

  useEffect(() => {
    const events = ['mousedown', 'keydown', 'touchstart', 'scroll'];
    events.forEach(event => window.addEventListener(event, handleActivity));
    return () => {
      events.forEach(event => window.removeEventListener(event, handleActivity));
      if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
      if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, [handleActivity]);

  return { sessionId, showWarning, timeRemaining, initSession, endSession, continueSession: handleActivity };
};

// --- Main Component ---
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

  const { sessionId, showWarning, timeRemaining, initSession, endSession, continueSession } = useSessionManager();

  useEffect(() => {
    if (!window.sessionData) {
      initSession();
    } else {
      setCart(window.sessionData.cart || []);
      setSelectedCategory(window.sessionData.selectedCategory);
    }
  }, [initSession]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await fetch('/api/categories');
        const data = await res.json();
        if (data.success && data.data) {
          setCategories(data.data);
          if (!selectedCategory && data.data.length > 0) setSelectedCategory(data.data[0].id);
        }
      } catch (error) { console.error('Error fetching categories:', error); }
    };
    fetchCategories();
  }, [selectedCategory]);

  useEffect(() => {
    const fetchMenuItems = async () => {
      try {
        const url = selectedCategory ? `/api/menu?category_id=${selectedCategory}` : '/api/menu';
        const res = await fetch(url);
        const data = await res.json();
        if (data.success && data.data) setMenuItems(data.data);
      } catch (error) { console.error('Error fetching menu items:', error); }
    };
    if (selectedCategory) fetchMenuItems();
  }, [selectedCategory]);

  const openItemCustomization = (item: MenuItem) => {
    setSelectedItem(item);
    setCustomizations([]);
    setQuantity(1);
    setSpecialInstructions('');
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
    if (window.sessionData) window.sessionData.cart = newCart;
    setSelectedItem(null);
  };

  const removeFromCart = (index: number) => {
    const newCart = cart.filter((_, i) => i !== index);
    setCart(newCart);
    if (window.sessionData) window.sessionData.cart = newCart;
  };

  const getCartTotal = () => cart.reduce((sum, item) => sum + item.item_total, 0);

  const getItemImage = (itemName: string): string => {
    const name = itemName.toLowerCase();
    if (name.includes('chicken') || name.includes('zinger')) return 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=400&h=300&fit=crop';
    if (name.includes('burger')) return 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&h=300&fit=crop';
    if (name.includes('fries')) return 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=400&h=300&fit=crop';
    if (name.includes('drink') || name.includes('cola')) return 'https://images.unsplash.com/photo-1581006852262-e4307cf6283a?w=400&h=300&fit=crop';
    return 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=400&h=300&fit=crop';
  };

  const checkout = async (paymentMethod: 'card' | 'mobile_money') => {
    try {
      const orderData = {
        items: cart.map(item => ({
          menu_item_id: item.menu_item.id,
          quantity: item.quantity,
          unit_price: item.menu_item.base_price + item.selected_customizations.reduce((s, c) => s + c.price_modifier, 0),
          customizations: item.selected_customizations.map(c => c.id),
          special_instructions: item.special_instructions || '',
        })),
        payment_method: paymentMethod,
        total_amount: getCartTotal(),
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
        if (window.sessionData) window.sessionData.cart = [];
        setTimeout(() => { setOrderComplete(false); endSession(); }, 10000);
      }
    } catch (error) { alert('Order failed. Please try again.'); }
  };

  if (orderComplete) {
    return (
      <div className="min-h-screen bg-red-600 flex items-center justify-center p-8 text-center">
        <div className="bg-white rounded-3xl p-12 max-w-2xl shadow-2xl">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6"><Check className="text-green-600" size={40} /></div>
          <h1 className="text-5xl font-black text-gray-800 mb-2">Ordered!</h1>
          <div className="bg-red-50 rounded-2xl p-8 mb-6 border-2 border-red-100">
            <p className="text-gray-500 uppercase text-xs font-bold mb-2">Order Number</p>
            <p className="text-6xl font-black text-red-600">{orderNumber}</p>
          </div>
          <p className="text-xl font-bold text-gray-700">Please wait for your number</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Session Warning Modal */}
      {showWarning && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-md w-full p-8 animate-bounce-in">
            <AlertCircle className="text-orange-600 mx-auto mb-4" size={48} />
            <h2 className="text-3xl font-bold text-center mb-4">Still there?</h2>
            <p className="text-center text-lg mb-6">Session ends in <span className="font-black text-red-600 text-2xl">{timeRemaining}</span>s</p>
            <button onClick={continueSession} className="w-full bg-red-600 text-white py-4 rounded-2xl font-bold text-xl shadow-lg">Continue</button>
          </div>
        </div>
      )}

      {/* --- RE-CENTERED HEADER SECTION --- */}
      <header className="bg-red-600 text-white px-8 py-4 shadow-xl sticky top-0 z-40 border-b-4 border-red-700">
        <div className="container mx-auto grid grid-cols-3 items-center">
          
          {/* LEFT: BRANDING */}
          <div className="flex flex-col">
            <h1 className="text-5xl font-black tracking-tighter italic leading-none">KFC</h1>
            <span className="text-[10px] font-bold uppercase tracking-widest text-red-200 mt-1">Self-Service</span>
          </div>

          {/* CENTER: THE HOME BUTTON (FIXED ACTION) */}
          <div className="flex justify-center">
            <button
              onClick={() => endSession()}
              className="group relative flex flex-col items-center justify-center bg-white text-red-600 w-28 h-28 rounded-full shadow-[0_10px_0_rgb(153,27,27)] border-4 border-red-100 hover:translate-y-[2px] hover:shadow-[0_8px_0_rgb(153,27,27)] active:translate-y-[10px] active:shadow-none transition-all animate-soft-pulse cursor-pointer"
              type="button"
            >
              <HomeIcon size={36} strokeWidth={3} />
              <span className="text-[12px] font-black uppercase mt-1">Home</span>
            </button>
          </div>

          {/* RIGHT: CART BUTTON */}
          <div className="flex justify-end">
            <button
              onClick={() => setShowCart(true)}
              className="bg-white text-red-600 px-8 py-4 rounded-3xl font-bold flex items-center gap-4 hover:bg-red-50 transition-all shadow-xl border-b-8 border-red-200"
            >
              <div className="relative">
                <ShoppingCart size={32} />
                {cart.length > 0 && (
                  <span className="absolute -top-4 -right-4 bg-black text-white text-xs font-black rounded-full w-8 h-8 flex items-center justify-center border-4 border-white animate-bounce">
                    {cart.length}
                  </span>
                )}
              </div>
              <div className="text-left border-l-2 border-red-100 pl-4">
                <div className="text-[10px] text-red-400 uppercase font-black tracking-widest leading-none mb-1">Total</div>
                <div className="text-2xl font-black tracking-tighter">KSh {getCartTotal().toFixed(0)}</div>
              </div>
            </button>
          </div>
        </div>
      </header>

      {/* --- CATEGORIES & MENU GRID --- */}
      <div className="bg-white shadow-md sticky top-[128px] z-30">
        <div className="container mx-auto px-6 py-5 flex gap-4 overflow-x-auto no-scrollbar">
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-10 py-5 rounded-2xl font-black uppercase text-xs tracking-widest whitespace-nowrap transition-all ${
                selectedCategory === cat.id 
                ? 'bg-red-600 text-white shadow-lg scale-105' 
                : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      <div className="container mx-auto px-6 py-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
        {menuItems.map(item => (
          <div 
            key={item.id} 
            onClick={() => openItemCustomization(item)} 
            className="group bg-white rounded-[2.5rem] shadow-xl overflow-hidden cursor-pointer hover:shadow-2xl transition-all border-4 border-transparent hover:border-red-600"
          >
            <div className="h-56 relative overflow-hidden">
              <img src={getItemImage(item.name)} alt={item.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
              <div className="absolute bottom-4 left-6">
                <span className="bg-red-600 text-white px-4 py-1 rounded-lg text-sm font-black uppercase">KSh {Number(item.base_price).toFixed(0)}</span>
              </div>
            </div>
            <div className="p-8">
              <h3 className="font-black text-2xl mb-2 text-gray-800 uppercase tracking-tight">{item.name}</h3>
              <p className="text-gray-500 text-xs font-medium h-10 overflow-hidden mb-6">{item.description}</p>
              <div className="w-full bg-gray-100 group-hover:bg-red-600 group-hover:text-white text-gray-500 py-3 rounded-2xl flex items-center justify-center gap-2 transition-all font-black uppercase text-xs tracking-widest">
                <Plus size={18} strokeWidth={4} />
                Add to Order
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* --- MODALS --- */}
      {selectedItem && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xl flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-[3rem] max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="p-8 bg-red-600 text-white flex justify-between items-center sticky top-0 z-10">
              <h2 className="text-4xl font-black uppercase italic tracking-tighter">{selectedItem.name}</h2>
              <button onClick={() => setSelectedItem(null)} className="bg-white/20 p-3 rounded-full hover:bg-white/40"><X size={28} strokeWidth={3} /></button>
            </div>
            <div className="p-10 text-center">
              <div className="flex items-center justify-between bg-gray-50 p-8 rounded-3xl mb-10">
                <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="bg-white p-6 rounded-2xl shadow-lg active:scale-95"><Minus size={32} className="text-red-600" strokeWidth={4} /></button>
                <span className="text-8xl font-black text-red-600 tabular-nums">{quantity}</span>
                <button onClick={() => setQuantity(quantity + 1)} className="bg-white p-6 rounded-2xl shadow-lg active:scale-95"><Plus size={32} className="text-red-600" strokeWidth={4} /></button>
              </div>
              <button onClick={addToCart} className="w-full bg-red-600 text-white py-8 rounded-3xl font-black text-3xl shadow-[0_12px_0_rgb(153,27,27)] active:translate-y-2 active:shadow-none transition-all uppercase italic">Confirm & Add</button>
            </div>
          </div>
        </div>
      )}

      {showCart && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-[3rem] max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="p-10 flex justify-between items-center border-b-2 border-gray-100">
              <h2 className="text-5xl font-black uppercase italic tracking-tighter">My Tray</h2>
              <button onClick={() => setShowCart(false)} className="bg-gray-100 p-4 rounded-full text-gray-400"><X size={32} strokeWidth={3} /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-10 space-y-6">
              {cart.length === 0 ? (
                <div className="text-center py-20 opacity-20"><ShoppingCart size={120} className="mx-auto" /><p className="text-3xl font-black mt-4 uppercase">Tray is Empty</p></div>
              ) : (
                cart.map((item, i) => (
                  <div key={i} className="flex justify-between items-center bg-gray-50 p-8 rounded-3xl border-2 border-dashed border-gray-200">
                    <div>
                      <p className="font-black text-2xl uppercase tracking-tighter">{item.quantity}× {item.menu_item.name}</p>
                      <p className="text-red-600 font-bold text-lg">KSh {item.item_total}</p>
                    </div>
                    <button onClick={() => removeFromCart(i)} className="bg-red-50 text-red-600 p-4 rounded-2xl"><Trash2 size={24} /></button>
                  </div>
                ))
              )}
            </div>
            {cart.length > 0 && (
              <div className="p-10 bg-gray-50">
                <div className="flex justify-between items-center mb-8">
                  <span className="text-2xl font-black uppercase text-gray-400">Total</span>
                  <span className="text-5xl font-black text-red-600">KSh {getCartTotal().toFixed(0)}</span>
                </div>
                <div className="grid grid-cols-2 gap-6">
                  <button onClick={() => checkout('card')} className="bg-blue-600 text-white py-6 rounded-3xl font-black text-2xl flex items-center justify-center gap-4 shadow-[0_8px_0_rgb(30,58,138)] active:translate-y-2 active:shadow-none transition-all uppercase italic"><CreditCard size={32} /> Card</button>
                  <button onClick={() => checkout('mobile_money')} className="bg-green-600 text-white py-6 rounded-3xl font-black text-2xl flex items-center justify-center gap-4 shadow-[0_8px_0_rgb(20,83,45)] active:translate-y-2 active:shadow-none transition-all uppercase italic"><Smartphone size={32} /> M-Pesa</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <style jsx>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        
        @keyframes soft-pulse {
          0% { transform: scale(1); box-shadow: 0 10px 0 rgb(153,27,27), 0 0 0 0px rgba(255, 255, 255, 0.4); }
          50% { transform: scale(1.02); box-shadow: 0 10px 0 rgb(153,27,27), 0 0 0 15px rgba(255, 255, 255, 0); }
          100% { transform: scale(1); box-shadow: 0 10px 0 rgb(153,27,27), 0 0 0 0px rgba(255, 255, 255, 0); }
        }
        .animate-soft-pulse { animation: soft-pulse 2.5s infinite ease-in-out; }

        @keyframes bounce-in {
          0% { transform: scale(0.3); opacity: 0; }
          50% { transform: scale(1.05); }
          100% { transform: scale(1); opacity: 1; }
        }
        .animate-bounce-in { animation: bounce-in 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
      `}</style>
    </div>
  );
}