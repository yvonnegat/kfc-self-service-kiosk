'use client';

import Link from 'next/link';
import { ShoppingCart, ChefHat, BarChart3, Lock } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center p-8">
      <div className="max-w-6xl w-full">
        <div className="text-center mb-12">
          <h1 className="text-7xl font-bold text-white mb-4">🍗 KFC Kiosk</h1>
          <p className="text-2xl text-white opacity-90">Self-Ordering System</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Customer Kiosk - Public Access */}
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
              <div className="mt-4 text-center">
                <span className="inline-flex items-center gap-2 text-sm text-green-600 font-semibold">
                  ✓ No Login Required
                </span>
              </div>
            </div>
          </Link>

          {/* Kitchen Display - Requires Auth */}
          <Link href="/login">
            <div className="bg-white rounded-2xl shadow-2xl p-8 hover:scale-105 transition-transform cursor-pointer">
              <div className="flex justify-center mb-6">
                <div className="bg-blue-100 p-6 rounded-full relative">
                  <ChefHat size={64} className="text-blue-600" />
                  <div className="absolute -top-2 -right-2 bg-yellow-500 rounded-full p-2">
                    <Lock size={20} className="text-white" />
                  </div>
                </div>
              </div>
              <h2 className="text-3xl font-bold text-gray-800 text-center mb-4">
                Kitchen Display
              </h2>
              <p className="text-gray-600 text-center mb-6">
                View incoming orders and update order status
              </p>
              <div className="bg-blue-600 text-white py-3 rounded-lg font-bold text-center">
                Staff Login
              </div>
              <div className="mt-4 text-center">
                <span className="inline-flex items-center gap-2 text-sm text-orange-600 font-semibold">
                  <Lock size={16} />
                  Kitchen Staff Only
                </span>
              </div>
            </div>
          </Link>

          {/* Manager Dashboard - Requires Auth */}
          <Link href="/login">
            <div className="bg-white rounded-2xl shadow-2xl p-8 hover:scale-105 transition-transform cursor-pointer">
              <div className="flex justify-center mb-6">
                <div className="bg-green-100 p-6 rounded-full relative">
                  <BarChart3 size={64} className="text-green-600" />
                  <div className="absolute -top-2 -right-2 bg-red-500 rounded-full p-2">
                    <Lock size={20} className="text-white" />
                  </div>
                </div>
              </div>
              <h2 className="text-3xl font-bold text-gray-800 text-center mb-4">
                Manager Dashboard
              </h2>
              <p className="text-gray-600 text-center mb-6">
                View analytics and manage menu items
              </p>
              <div className="bg-green-600 text-white py-3 rounded-lg font-bold text-center">
                Manager Login
              </div>
              <div className="mt-4 text-center">
                <span className="inline-flex items-center gap-2 text-sm text-red-600 font-semibold">
                  <Lock size={16} />
                  Manager Only
                </span>
              </div>
            </div>
          </Link>
        </div>

        {/* Security Features Notice */}
        <div className="mt-12 bg-white bg-opacity-10 backdrop-blur-sm rounded-2xl p-6 text-white">
          <h3 className="text-2xl font-bold mb-4 text-center">🔒 Security Features</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="text-center">
              <div className="font-semibold mb-2">Role-Based Access</div>
              <div className="opacity-90">Kitchen staff and managers need authentication</div>
            </div>
            <div className="text-center">
              <div className="font-semibold mb-2">JWT Authentication</div>
              <div className="opacity-90">Secure token-based session management</div>
            </div>
            <div className="text-center">
              <div className="font-semibold mb-2">Auto-Logout</div>
              <div className="opacity-90">Customer sessions clear after order completion</div>
            </div>
          </div>
        </div>

        <div className="mt-8 text-center text-white">
          <p className="text-lg opacity-75">
            Built with Next.js, React, TypeScript & MySQL
          </p>
        </div>
      </div>
    </div>
  );
}