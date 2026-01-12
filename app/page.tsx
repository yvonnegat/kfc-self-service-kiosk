'use client';

import Link from 'next/link';
import { ShoppingCart, ChefHat, BarChart3 } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center p-8">
      <div className="max-w-6xl w-full">
        <div className="text-center mb-12">
          <h1 className="text-7xl font-bold text-white mb-4">🍗 KFC Kiosk</h1>
          <p className="text-2xl text-white opacity-90">Self-Ordering System</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Customer Kiosk */}
          <Link href="/customer">
            <div className="bg-white rounded-2xl shadow-2xl p-8 hover:scale-105 transition-transform cursor-pointer">
              <div className="flex justify-center mb-6">
                <div className="bg-red-100 p-6 rounded-full">
                  <ShoppingCart size={64} className="text-red-600" />
                </div>
              </div>
              <h2 className="text-3xl font-bold text-gray-800 text-center mb-4">
                Customer Kiosk
              </h2>
              <p className="text-gray-600 text-center mb-6">
                Browse menu, customize orders, and place your order
              </p>
              <div className="bg-red-600 text-white py-3 rounded-lg font-bold text-center">
                Start Ordering
              </div>
            </div>
          </Link>

          {/* Kitchen Display */}
          <Link href="/kitchen">
            <div className="bg-white rounded-2xl shadow-2xl p-8 hover:scale-105 transition-transform cursor-pointer">
              <div className="flex justify-center mb-6">
                <div className="bg-blue-100 p-6 rounded-full">
                  <ChefHat size={64} className="text-blue-600" />
                </div>
              </div>
              <h2 className="text-3xl font-bold text-gray-800 text-center mb-4">
                Kitchen Display
              </h2>
              <p className="text-gray-600 text-center mb-6">
                View incoming orders and update order status
              </p>
              <div className="bg-blue-600 text-white py-3 rounded-lg font-bold text-center">
                Open Kitchen
              </div>
            </div>
          </Link>

          {/* Manager Dashboard */}
          <Link href="/manager">
            <div className="bg-white rounded-2xl shadow-2xl p-8 hover:scale-105 transition-transform cursor-pointer">
              <div className="flex justify-center mb-6">
                <div className="bg-green-100 p-6 rounded-full">
                  <BarChart3 size={64} className="text-green-600" />
                </div>
              </div>
              <h2 className="text-3xl font-bold text-gray-800 text-center mb-4">
                Manager Dashboard
              </h2>
              <p className="text-gray-600 text-center mb-6">
                View analytics and manage menu items
              </p>
              <div className="bg-green-600 text-white py-3 rounded-lg font-bold text-center">
                View Dashboard
              </div>
            </div>
          </Link>
        </div>

      </div>
    </div>
  );
}