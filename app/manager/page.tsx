'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { DollarSign, ShoppingBag, TrendingUp, AlertTriangle, Edit2, Check, X, LogOut } from 'lucide-react';
import { DailySales, TopSellingItem, HourlyOrders, LowStockItem, MenuItem } from '@/types';

export default function ManagerDashboard() {
  const router = useRouter();
  const [dailySales, setDailySales] = useState<DailySales | null>(null);
  const [topItems, setTopItems] = useState<TopSellingItem[]>([]);
  const [hourlyOrders, setHourlyOrders] = useState<HourlyOrders[]>([]);
  const [lowStockItems, setLowStockItems] = useState<LowStockItem[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [editingItem, setEditingItem] = useState<number | null>(null);
  const [editForm, setEditForm] = useState({ price: '', stock: '', available: true });
  const [user, setUser] = useState<any>(null);

  // Check authentication on mount
 // FIXED MANAGER AUTH CHECK - Replace BOTH useEffect blocks with this SINGLE one:

useEffect(() => {
  const userStr = localStorage.getItem('user');
  
  if (!userStr) {
    // No user data, redirect to login
    router.push('/login');
    return;
  }
  
  try {
      const userData = JSON.parse(userStr);
      if (userData.role !== 'manager') {
        router.push('/unauthorized');
        return;
      }
      setUser(userData); // Set the user
      fetchAnalytics();
      fetchMenuItems();

      // 2. Refresh every 15 seconds
      const interval = setInterval(() => {
        console.log("📊 Manager: Updating analytics...");
        fetchAnalytics();
        // We generally don't auto-refresh menu items to avoid flickering while editing
        // fetchMenuItems(); 
      }, 15000);

      return () => clearInterval(interval);
      // 🟢 END REAL-TIME UPDATES

    
  } catch (error) {
    // Invalid data in localStorage
    console.error('Invalid user data:', error);
    localStorage.removeItem('user');
    router.push('/login');
  }
}, [router]);


  const getAuthHeaders = () => {
    const token = document.cookie
      .split('; ')
      .find(row => row.startsWith('auth_token='))
      ?.split('=')[1];
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
  };

  const fetchAnalytics = async () => {
    try {
      const res = await fetch('/api/analytics', {
        headers: getAuthHeaders(),
      });

      if (res.status === 401) {
        handleLogout();
        return;
      }

      const data = await res.json();
      if (data.success) {
        setDailySales(data.data.daily_sales);
        setTopItems(data.data.top_selling_items);
        setHourlyOrders(data.data.hourly_orders);
        setLowStockItems(data.data.low_stock_items);
      }
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    }
  };

  const fetchMenuItems = async () => {
    try {
      const res = await fetch('/api/menu', {
        headers: getAuthHeaders(),
      });

      if (res.status === 401) {
        handleLogout();
        return;
      }
      
      const data = await res.json();
      if (data.success) {
        setMenuItems(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch menu items:', error);
    }
  };
  // ... existing fetchMenuItems function ...

  // ✅ ADD THIS NEW USE EFFECT
  // This triggers the data fetch once the user is logged in
  useEffect(() => {
    if (user) {
      // 1. Fetch data immediately
      fetchAnalytics();
      fetchMenuItems();

      // 2. Set up a "Real-time" interval (refreshes every 30 seconds)
      const interval = setInterval(() => {
        console.log("📊 Manager: Updating analytics...");
        fetchAnalytics();
        // We generally don't auto-refresh menu items to avoid flickering while editing
        // fetchMenuItems(); 
      }, 15000);

      return () => clearInterval(interval);
    }
  }, [user]);

  // ... existing startEdit function ...

  const startEdit = (item: MenuItem) => {
    setEditingItem(item.id);
    setEditForm({
      price: item.base_price.toString(),
      stock: item.stock_quantity.toString(),
      available: item.is_available,
    });
  };

  const cancelEdit = () => {
    setEditingItem(null);
    setEditForm({ price: '', stock: '', available: true });
  };

  const saveEdit = async (itemId: number) => {
    try {
      const res = await fetch('/api/menu', {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          id: itemId,
          base_price: parseFloat(editForm.price),
          stock_quantity: parseInt(editForm.stock),
          is_available: editForm.available,
        }),
      });

      if (res.ok) {
        fetchMenuItems();
        cancelEdit();
      }
    } catch (error) {
      console.error('Failed to update menu item:', error);
    }
  };

  const handleLogout = () => {
    document.cookie = 'auth_token=; path=/; max-age=0';
    localStorage.removeItem('user');
    router.push('/login');
  };

  if (!user) {
    return <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="text-2xl">Loading...</div>
    </div>;
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      {/* Header */}
      <header className="mb-8">
        <div className="flex justify-between items-center mb-2">
          <h1 className="text-4xl font-bold text-gray-800">Manager Dashboard</h1>
          <div className="flex items-center gap-4">
            <div className="bg-white px-4 py-2 rounded-lg shadow">
              <span className="text-gray-600 text-sm">Logged in as: </span>
              <span className="font-semibold">{user.username}</span>
            </div>
            <button
              onClick={handleLogout}
              className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-semibold flex items-center gap-2 transition"
            >
              <LogOut size={20} />
              Logout
            </button>
          </div>
        </div>
        <p className="text-gray-600">
          {new Date().toLocaleDateString('en-US', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}
        </p>
      </header>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="text-gray-600 font-semibold">Today's Revenue</div>
            <DollarSign className="text-green-600" size={32} />
          </div>
          <div className="text-4xl font-bold text-gray-800">
            KSh {dailySales?.total_revenue ? Number(dailySales.total_revenue).toFixed(2) : '0.00'}
          </div>
          <div className="text-sm text-gray-500 mt-2">
            {dailySales?.total_orders || 0} orders completed
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="text-gray-600 font-semibold">Average Order Value</div>
            <ShoppingBag className="text-blue-600" size={32} />
          </div>
          <div className="text-4xl font-bold text-gray-800">
            KSh {dailySales?.avg_order_value ? Number(dailySales.avg_order_value).toFixed(2) : '0.00'}
          </div>
          <div className="text-sm text-gray-500 mt-2">
            Per transaction
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="text-gray-600 font-semibold">Low Stock Alerts</div>
            <AlertTriangle className="text-orange-600" size={32} />
          </div>
          <div className="text-4xl font-bold text-gray-800">
            {lowStockItems.length}
          </div>
          <div className="text-sm text-gray-500 mt-2">
            Items need restocking
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Top Selling Items */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <TrendingUp className="text-green-600" />
            Top 5 Selling Items Today
          </h2>
          <div className="space-y-4">
            {topItems.map((item, index) => (
              <div key={item.menu_item_id} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-red-600 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold">
                    {index + 1}
                  </div>
                  <div>
                    <div className="font-semibold">{item.name}</div>
                    <div className="text-sm text-gray-500">
                      {item.total_quantity} sold
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-green-600">
                    KSh {Number(item.total_revenue).toFixed(2)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Hourly Orders Chart */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Peak Order Times</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={hourlyOrders}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="hour" 
                tickFormatter={(hour) => `${hour}:00`}
              />
              <YAxis />
              <Tooltip 
                labelFormatter={(hour) => `${hour}:00 - ${Number(hour) + 1}:00`}
                formatter={(value) => [`${value} orders`, 'Orders']}
              />
              <Bar dataKey="order_count" fill="#dc2626" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Low Stock Alerts */}
      {lowStockItems.length > 0 && (
        <div className="bg-orange-50 border-2 border-orange-400 rounded-lg p-6 mb-8">
          <h2 className="text-2xl font-bold text-orange-800 mb-4 flex items-center gap-2">
            <AlertTriangle className="text-orange-600" />
            Low Stock Alerts
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {lowStockItems.map(item => (
              <div key={item.id} className="bg-white rounded-lg p-4 border-2 border-orange-300">
                <div className="font-bold text-lg mb-2">{item.name}</div>
                <div className="text-sm text-gray-600">
                  Current Stock: <span className="font-bold text-orange-600">{item.stock_quantity}</span>
                </div>
                <div className="text-sm text-gray-600">
                  Threshold: {item.low_stock_threshold}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Menu Management */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Menu Management</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Item</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Price</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stock</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {menuItems.map(item => (
                <tr key={item.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="font-medium text-gray-900">{item.name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {editingItem === item.id ? (
                      <input
                        type="number"
                        value={editForm.price}
                        onChange={(e) => setEditForm({ ...editForm, price: e.target.value })}
                        className="border rounded px-2 py-1 w-24"
                        step="0.01"
                      />
                    ) : (
                      <span>KSh {Number(item.base_price).toFixed(2)}</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {editingItem === item.id ? (
                      <input
                        type="number"
                        value={editForm.stock}
                        onChange={(e) => setEditForm({ ...editForm, stock: e.target.value })}
                        className="border rounded px-2 py-1 w-24"
                      />
                    ) : (
                      <span className={item.stock_quantity <= item.low_stock_threshold ? 'text-orange-600 font-bold' : ''}>
                        {item.stock_quantity}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {editingItem === item.id ? (
                      <select
                        value={editForm.available.toString()}
                        onChange={(e) => setEditForm({ ...editForm, available: e.target.value === 'true' })}
                        className="border rounded px-2 py-1"
                      >
                        <option value="true">Available</option>
                        <option value="false">Unavailable</option>
                      </select>
                    ) : (
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${
                        item.is_available 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {item.is_available ? 'Available' : 'Unavailable'}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {editingItem === item.id ? (
                      <div className="flex gap-2">
                        <button
                          onClick={() => saveEdit(item.id)}
                          className="text-green-600 hover:text-green-800"
                        >
                          <Check size={20} />
                        </button>
                        <button
                          onClick={cancelEdit}
                          className="text-red-600 hover:text-red-800"
                        >
                          <X size={20} />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => startEdit(item)}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        <Edit2 size={20} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}