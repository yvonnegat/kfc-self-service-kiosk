'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Clock, AlertCircle, LogOut } from 'lucide-react';
import { Order, OrderStatus } from '@/types';

export default function KitchenDisplay() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [queueLength, setQueueLength] = useState(0);
  const [oldestWaitTime, setOldestWaitTime] = useState(0);
  const [currentTime, setCurrentTime] = useState('');
  const [user, setUser] = useState<any>(null);


useEffect(() => {
  const userStr = localStorage.getItem('user');
  
  console.log('🔍 Kitchen Auth Check - localStorage:', userStr);
  
  if (!userStr) {
    console.log('❌ No user in localStorage, redirecting to login');
    router.push('/login');
    return;
  }
  
  try {
    const userData = JSON.parse(userStr);
    console.log('✅ Parsed user data:', userData);
    
    // Check if user has correct role
    if (userData.role !== 'kitchen' && userData.role !== 'manager') {
      console.log('❌ Wrong role:', userData.role);
      router.push('/unauthorized');
      return;
    }
    
    console.log('✅ Auth check passed, setting user');
    setUser(userData);
  } catch (error) {
    console.error('❌ Invalid user data:', error);
    localStorage.removeItem('user');
    router.push('/login');
  }
}, [router]);

  useEffect(() => {
    const updateTime = () => {
      setCurrentTime(
        new Date().toLocaleTimeString('en-GB', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })
      );
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (user) {
      fetchOrders();
      const interval = setInterval(fetchOrders, 5000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const fetchOrders = async () => {
    try {
      const token = document.cookie
        .split('; ')
        .find(row => row.startsWith('auth_token='))
        ?.split('=')[1];

      const res = await fetch('/api/kitchen', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (res.status === 401) {
        handleLogout();
        return;
      }

      const data = await res.json();
      if (data.success) {
        setOrders(data.data.orders);
        setQueueLength(data.data.queue_length);
        setOldestWaitTime(data.data.oldest_wait_time);
      }
    } catch (error) {
      console.error('Failed to fetch orders:', error);
    }
  };

  const updateOrderStatus = async (orderId: number, newStatus: OrderStatus) => {
    try {
      const token = document.cookie
        .split('; ')
        .find(row => row.startsWith('auth_token='))
        ?.split('=')[1];

      const res = await fetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ order_status: newStatus }),
      });

      if (res.ok) {
        fetchOrders();
      }
    } catch (error) {
      console.error('Failed to update order:', error);
    }
  };

  const handleLogout = () => {
    document.cookie = 'auth_token=; path=/; max-age=0';
    localStorage.removeItem('user');
    router.push('/login');
  };

  const getWaitTime = (createdAt: string) => {
    const created = new Date(createdAt);
    const now = new Date();
    const diffMinutes = Math.floor((now.getTime() - created.getTime()) / 60000);
    return diffMinutes;
  };

  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case 'new':
        return 'bg-yellow-500';
      case 'in_progress':
        return 'bg-blue-500';
      case 'ready':
        return 'bg-green-500';
      default:
        return 'bg-gray-500';
    }
  };

  if (!user) {
    return <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <div className="text-white text-2xl">Loading...</div>
    </div>;
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      {/* Header */}
      <header className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-4">
            <h1 className="text-5xl font-bold">🍗 Kitchen Display System</h1>
            <div className="bg-gray-800 px-4 py-2 rounded-lg">
              <span className="text-gray-400 text-sm">Logged in as: </span>
              <span className="font-semibold">{user.username}</span>
              <span className="text-gray-400 text-sm ml-2">({user.role})</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-sm text-gray-400">Current Time</div>
              <div className="text-3xl font-mono">{currentTime}</div>
            </div>
            <button
              onClick={handleLogout}
              className="bg-red-600 hover:bg-red-700 px-6 py-3 rounded-lg font-semibold flex items-center gap-2 transition"
            >
              <LogOut size={20} />
              Logout
            </button>
          </div>
        </div>

        {/* Queue Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-gray-800 rounded-lg p-4">
            <div className="text-gray-400 text-sm mb-1">Orders in Queue</div>
            <div className="text-4xl font-bold">{queueLength}</div>
          </div>
          <div className="bg-gray-800 rounded-lg p-4">
            <div className="text-gray-400 text-sm mb-1">Oldest Wait Time</div>
            <div className="text-4xl font-bold flex items-center gap-2">
              <Clock size={32} />
              {oldestWaitTime} min
            </div>
          </div>
          <div className="bg-gray-800 rounded-lg p-4">
            <div className="text-gray-400 text-sm mb-1">Status</div>
            <div className={`text-2xl font-bold ${oldestWaitTime > 20 ? 'text-red-500' : 'text-green-500'}`}>
              {oldestWaitTime > 20 ? 'Behind Schedule' : 'On Track'}
            </div>
          </div>
        </div>
      </header>

      {/* Orders Grid */}
      {orders.length === 0 ? (
        <div className="text-center py-20">
          <div className="text-6xl mb-4">✓</div>
          <div className="text-3xl text-gray-400">All caught up! No pending orders.</div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {orders.map(order => {
            const waitTime = getWaitTime(order.created_at);
            const isUrgent = waitTime > 15;

            return (
              <div
                key={order.id}
                className={`bg-gray-800 rounded-lg p-6 border-4 ${
                  isUrgent ? 'border-red-500 animate-pulse' : 'border-gray-700'
                }`}
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <div className="text-sm text-gray-400">Order Number</div>
                    <div className="text-4xl font-bold">{order.order_number}</div>
                  </div>
                  <div className="text-right">
                    <div className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(order.order_status)} inline-block mb-2`}>
                      {order.order_status.toUpperCase()}
                    </div>
                    <div className="flex items-center gap-2 text-lg">
                      <Clock size={20} />
                      <span className={waitTime > 15 ? 'text-red-500 font-bold' : ''}>
                        {waitTime} min
                      </span>
                    </div>
                  </div>
                </div>

                {isUrgent && (
                  <div className="bg-red-600 rounded-lg p-3 mb-4 flex items-center gap-2">
                    <AlertCircle size={24} />
                    <span className="font-bold">URGENT - Customer waiting!</span>
                  </div>
                )}

                <div className="space-y-3 mb-6">
                  {order.items?.map((item, index) => (
                    <div key={index} className="bg-gray-700 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div className="text-xl font-bold">
                          {item.quantity}x {item.menu_item_name}
                        </div>
                      </div>
                      
                      {item.customizations && item.customizations.length > 0 && (
                        <div className="text-yellow-400 text-sm mb-2">
                          ⚡ {item.customizations.map(c => c.option_name).join(', ')}
                        </div>
                      )}
                      
                      {item.special_instructions && (
                        <div className="bg-yellow-900 bg-opacity-50 border-l-4 border-yellow-500 p-2 text-sm">
                          <span className="font-semibold">Note:</span> {item.special_instructions}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-1 gap-3">
                  {order.order_status === 'new' && (
                    <button
                      onClick={() => updateOrderStatus(order.id, 'in_progress')}
                      className="bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-lg font-bold text-xl transition"
                    >
                      Start Preparing
                    </button>
                  )}
                  
                  {order.order_status === 'in_progress' && (
                    <button
                      onClick={() => updateOrderStatus(order.id, 'ready')}
                      className="bg-green-600 hover:bg-green-700 text-white py-4 rounded-lg font-bold text-xl transition"
                    >
                      Mark as Ready
                    </button>
                  )}
                  
                  {order.order_status === 'ready' && (
                    <button
                      onClick={() => updateOrderStatus(order.id, 'completed')}
                      className="bg-gray-600 hover:bg-gray-700 text-white py-4 rounded-lg font-bold text-xl transition"
                    >
                      Complete Order
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}