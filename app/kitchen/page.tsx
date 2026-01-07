'use client';

import { useState, useEffect } from 'react';
import { Clock, AlertCircle } from 'lucide-react';
import { Order, OrderStatus } from '@/types';

export default function KitchenDisplay() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [queueLength, setQueueLength] = useState(0);
  const [oldestWaitTime, setOldestWaitTime] = useState(0);

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 5000); // Refresh every 5 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchOrders = async () => {
    try {
      const res = await fetch('/api/kitchen');
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
      const res = await fetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order_status: newStatus }),
      });

      if (res.ok) {
        fetchOrders();
      }
    } catch (error) {
      console.error('Failed to update order:', error);
    }
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

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      {/* Header */}
      <header className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-5xl font-bold">🍗 Kitchen Display System</h1>
          <div className="text-right">
            <div className="text-sm text-gray-400">Current Time</div>
            <div className="text-3xl font-mono">
              {new Date().toLocaleTimeString()}
            </div>
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
                {/* Order Header */}
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

                {/* Urgent Alert */}
                {isUrgent && (
                  <div className="bg-red-600 rounded-lg p-3 mb-4 flex items-center gap-2">
                    <AlertCircle size={24} />
                    <span className="font-bold">URGENT - Customer waiting!</span>
                  </div>
                )}

                {/* Order Items */}
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

                {/* Action Buttons */}
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