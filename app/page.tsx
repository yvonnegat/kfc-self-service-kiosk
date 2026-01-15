'use client';

import Link from 'next/link';
import { ShoppingCart, ChefHat, BarChart3, Lock, LayoutDashboard, ChevronRight } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-[#1a1a1a] text-slate-200 selection:bg-red-500 selection:text-white font-sans">
      
      {/* Decorative Red Top Bar */}
      <div className="absolute top-0 left-0 w-full h-1.5 bg-red-600 shadow-[0_0_15px_rgba(220,38,38,0.5)]"></div>

      <main className="max-w-7xl mx-auto px-6 py-16 flex flex-col justify-center min-h-screen">
        
        {/* Header Section */}
        <div className="mb-16 space-y-4">
          <div className="flex items-center gap-3 text-red-500 font-bold uppercase text-sm tracking-[0.2em]">
            <LayoutDashboard size={20} />
            <span>System Gateway</span>
          </div>
          <h1 className="text-6xl md:text-7xl font-black tracking-tighter text-white">
            KFC <span className="text-red-600">KIOSK</span>
          </h1>
          <p className="text-slate-400 text-xl max-w-xl font-medium">
            Select a terminal module to begin system operations.
          </p>
        </div>

        {/* Navigation Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Module 1: Customer Kiosk */}
          <Link href="/customer" className="group relative bg-[#242424] border border-white/10 rounded-3xl p-8 hover:bg-red-600 transition-all duration-500 shadow-xl">
            <div className="relative z-10">
              <div className="w-16 h-16 bg-red-600/10 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-white/20 transition-colors">
                <ShoppingCart className="text-red-500 group-hover:text-white" size={32} />
              </div>
              <h2 className="text-3xl font-extrabold text-white mb-3">Customer Interface</h2>
              <p className="text-slate-400 text-lg group-hover:text-white/90 leading-snug mb-8">
                The primary self-service portal for menu browsing, item customization, and order placement.
              </p>
              <div className="inline-flex items-center gap-2 py-3 px-6 bg-red-600 group-hover:bg-white group-hover:text-red-600 rounded-full text-sm font-black uppercase tracking-widest transition-all">
                Open Kiosk <ChevronRight size={18} />
              </div>
            </div>
          </Link>

          {/* Module 2: Kitchen Display */}
          <Link href="/kitchen" className="group relative bg-[#242424] border border-white/10 rounded-3xl p-8 hover:bg-blue-700 transition-all duration-500 shadow-xl">
            <div className="relative z-10">
              <div className="w-16 h-16 bg-blue-600/10 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-white/20">
                <ChefHat className="text-blue-500 group-hover:text-white" size={32} />
              </div>
              <div className="flex items-center gap-3 mb-3">
                <h2 className="text-3xl font-extrabold text-white">Kitchen Display</h2>
                <Lock size={20} className="text-slate-600 group-hover:text-white/50" />
              </div>
              <p className="text-slate-400 text-lg group-hover:text-white/90 leading-snug mb-8">
                Real-time order management system designed for culinary staff to track and fulfill active orders.
              </p>
              <div className="inline-flex items-center gap-2 py-3 px-6 bg-blue-700 group-hover:bg-white group-hover:text-blue-700 rounded-full text-sm font-black uppercase tracking-widest transition-all">
                Staff Access <ChevronRight size={18} />
              </div>
            </div>
          </Link>

          {/* Module 3: Manager Dashboard - UPDATED LINK */}
          <Link href="/manager" className="group relative bg-[#242424] border border-white/10 rounded-3xl p-8 hover:bg-emerald-700 transition-all duration-500 shadow-xl">
            <div className="relative z-10">
              <div className="w-16 h-16 bg-emerald-600/10 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-white/20">
                <BarChart3 className="text-emerald-500 group-hover:text-white" size={32} />
              </div>
              <div className="flex items-center gap-3 mb-3">
                <h2 className="text-3xl font-extrabold text-white">Administration</h2>
                <Lock size={20} className="text-slate-600 group-hover:text-white/50" />
              </div>
              <p className="text-slate-400 text-lg group-hover:text-white/90 leading-snug mb-8">
                Management tools for sales analytics, inventory tracking, and system configuration.
              </p>
              <div className="inline-flex items-center gap-2 py-3 px-6 bg-emerald-700 group-hover:bg-white group-hover:text-emerald-700 rounded-full text-sm font-black uppercase tracking-widest transition-all">
                Control Panel <ChevronRight size={18} />
              </div>
            </div>
          </Link>

        </div>

        {/* Branding Footer */}
        <footer className="mt-20 pt-8 border-t border-white/5 text-center md:text-left">
          <p className="text-slate-500 text-xs font-bold uppercase tracking-[0.4em]">
            KFC Project Architecture &bull; 2026
          </p>
        </footer>
      </main>
    </div>
  );
}