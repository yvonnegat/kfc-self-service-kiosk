'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  CreditCard,
  Smartphone,
  X,
} from 'lucide-react';

/* ================= TYPES (UNCHANGED) ================= */
interface Category {
  id: number;
  name: string;
  display_order: number;
  item_count: number;
}

interface CustomizationOption {
  id: number;
  option_type: string;
  option_name: string;
  price_modifier: number;
}

interface MenuItem {
  id: number;
  name: string;
  description: string;
  base_price: number;
  image_url: string | null;
  is_available: boolean;
  stock_quantity: number;
  low_stock_threshold: number;
  category_id: number;
  category_name: string;
  customizations: CustomizationOption[];
}

interface CartItem {
  menu_item: MenuItem;
  quantity: number;
  selected_customizations: CustomizationOption[];
  special_instructions: string;
  item_total: number;
}

/* ================= COMPONENT ================= */
export default function CustomerKiosk() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [allMenuItems, setAllMenuItems] = useState<MenuItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [customizations, setCustomizations] = useState<CustomizationOption[]>([]);
  const [quantity, setQuantity] = useState(1);
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [orderComplete, setOrderComplete] = useState(false);
  const [orderNumber, setOrderNumber] = useState('');
  const [loading, setLoading] = useState(true);

  /* ================= DATA LOAD (UNCHANGED) ================= */
  useEffect(() => {
    const loadData = async () => {
      try {
        const [categoriesRes, menuRes] = await Promise.all([
          fetch('/api/categories'),
          fetch('/api/menu'),
        ]);

        const categoriesData = await categoriesRes.json();
        const menuData = await menuRes.json();

        if (categoriesData.success) {
          setCategories(categoriesData.data);
          setSelectedCategory(categoriesData.data[0]?.id ?? null);
        }

        if (menuData.success) {
          setAllMenuItems(menuData.data);
        }
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const filteredMenuItems = useMemo(() => {
    if (!selectedCategory) return allMenuItems;
    return allMenuItems.filter(i => i.category_id === selectedCategory);
  }, [selectedCategory, allMenuItems]);

  /* ================= CART LOGIC (UNCHANGED) ================= */
  const addToCart = () => {
    if (!selectedItem) return;

    const customPrice = customizations.reduce((s, c) => s + c.price_modifier, 0);
    const total = (selectedItem.base_price + customPrice) * quantity;

    setCart([
      ...cart,
      {
        menu_item: selectedItem,
        quantity,
        selected_customizations: customizations,
        special_instructions: specialInstructions,
        item_total: total,
      },
    ]);

    setSelectedItem(null);
  };

  const updateQty = (i: number, qty: number) => {
    if (qty < 1) return;
    const updated = [...cart];
    const item = updated[i];
    const customPrice = item.selected_customizations.reduce(
      (s, c) => s + c.price_modifier,
      0
    );
    item.quantity = qty;
    item.item_total = (item.menu_item.base_price + customPrice) * qty;
    setCart(updated);
  };

  const getTotal = () => cart.reduce((s, i) => s + i.item_total, 0);

  const checkout = async (method: 'card' | 'mobile_money') => {
    const res = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        items: cart.map(i => ({
          menu_item_id: i.menu_item.id,
          quantity: i.quantity,
          unit_price:
            i.menu_item.base_price +
            i.selected_customizations.reduce((s, c) => s + c.price_modifier, 0),
          customizations: i.selected_customizations.map(c => c.id),
          special_instructions: i.special_instructions,
        })),
        payment_method: method,
        total_amount: getTotal(),
      }),
    });

    const data = await res.json();
    if (data.success) {
      setOrderNumber(data.data.order_number);
      setOrderComplete(true);
      setTimeout(() => window.location.reload(), 10000);
    }
  };

  /* ================= LOADING ================= */
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-xl">
        Loading menu...
      </div>
    );
  }

  /* ================= ORDER COMPLETE ================= */
  if (orderComplete) {
    return (
      <div className="min-h-screen bg-red-600 flex items-center justify-center">
        <div className="bg-white p-12 rounded-3xl text-center shadow-2xl">
          <h1 className="text-4xl font-bold mb-4">Order Placed!</h1>
          <p className="text-5xl font-extrabold text-red-600">
            {orderNumber}
          </p>
          <p className="mt-4 text-lg text-gray-600">
            Please wait for your number
          </p>
        </div>
      </div>
    );
  }

  /* ================= MAIN UI ================= */
  return (
    <div className="min-h-screen flex bg-gray-100 font-sans">
      {/* LEFT SIDE */}
      <div className="flex-1 flex flex-col">
        {/* HEADER */}
        <div className="bg-red-600 text-white px-10g py-2">
          <h1 className="text-3xl font-bold">Welcome to KFC</h1>
          <p className="opacity-90">Touch to start your order</p>
        </div>

        {/* CATEGORIES */}
        <div className="bg-white px-6 py-4 shadow">
          <div className="flex gap-4 overflow-x-auto">
            {categories.map(c => (
              <button
                key={c.id}
                onClick={() => setSelectedCategory(c.id)}
                className={`px-8 py-4 rounded-full text-lg font-semibold ${
                  selectedCategory === c.id
                    ? 'bg-red-600 text-white'
                    : 'bg-gray-200'
                }`}
              >
                {c.name}
              </button>
            ))}
          </div>
        </div>

        {/* ITEMS GRID */}
        <div className="flex-1 p-8 overflow-y-auto">
          <div className="grid grid-cols-3 gap-8">
            {filteredMenuItems.map(item => (
              <div
                key={item.id}
                onClick={() => {
                  setSelectedItem(item);
                  setQuantity(1);
                  setCustomizations([]);
                }}
                className="bg-white rounded-2xl shadow hover:shadow-xl cursor-pointer"
              >
                <div className="h-44 bg-gray-200 flex items-center justify-center rounded-t-2xl">
                  🍗
                </div>
                <div className="p-6">
                  <h3 className="text-lg font-bold">{item.name}</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    {item.description}
                  </p>
                  <p className="text-2xl font-extrabold text-red-600">
                    {Number(item.base_price).toFixed(2)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* RIGHT CART */}
      <div className="w-[380px] bg-white shadow-xl flex flex-col p-6">
        <h2 className="text-2xl font-bold mb-4">Your Order</h2>

        {cart.length === 0 ? (
          <div className="flex-1 flex items-center justify-center text-gray-400">
            Cart is empty
          </div>
        ) : (
          <>
            <div className="flex-1 space-y-4 overflow-y-auto">
              {cart.map((i, idx) => (
                <div key={idx} className="border rounded-xl p-4">
                  <h3 className="font-bold">{i.menu_item.name}</h3>
                  <div className="flex justify-between mt-3">
                    <div className="flex gap-2">
                      <button onClick={() => updateQty(idx, i.quantity - 1)}>
                        <Minus />
                      </button>
                      <span className="text-lg">{i.quantity}</span>
                      <button onClick={() => updateQty(idx, i.quantity + 1)}>
                        <Plus />
                      </button>
                    </div>
                    <span className="font-bold">
                      KSh {i.item_total.toFixed(2)}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t pt-6 mt-6">
              <div className="flex justify-between text-2xl font-bold mb-4">
                <span>Total</span>
                <span className="text-red-600">
                  KSh {getTotal().toFixed(2)}
                </span>
              </div>

              <button
                onClick={() => checkout('card')}
                className="w-full bg-blue-600 text-white py-4 rounded-xl text-lg font-bold mb-3"
              >
                Pay by Card
              </button>

              <button
                onClick={() => checkout('mobile_money')}
                className="w-full bg-green-600 text-white py-4 rounded-xl text-lg font-bold"
              >
                M-Pesa
              </button>
            </div>
          </>
        )}
      </div>

      {/* MODAL */}
      {selectedItem && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
          <div className="bg-white rounded-2xl p-8 w-[520px]">
            <h2 className="text-2xl font-bold mb-4">{selectedItem.name}</h2>

            <div className="flex items-center gap-6 mb-6">
              <button onClick={() => setQuantity(q => Math.max(1, q - 1))}>
                <Minus />
              </button>
              <span className="text-3xl font-bold">{quantity}</span>
              <button onClick={() => setQuantity(q => q + 1)}>
                <Plus />
              </button>
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => setSelectedItem(null)}
                className="flex-1 bg-gray-200 py-3 rounded-xl text-lg"
              >
                Cancel
              </button>
              <button
                onClick={addToCart}
                className="flex-1 bg-red-600 text-white py-3 rounded-xl text-lg font-bold"
              >
                Add to Order
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
