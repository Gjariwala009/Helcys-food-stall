import React from 'react';
import {
  UtensilsCrossed,
  ClipboardList,
  Clock,
  BarChart3,
  Settings,
  Cloud,
  CloudOff,
  Sparkles,
  Layers
} from 'lucide-react';
import { useOrders } from '../context/OrdersContext';

export default function Navbar({ activeTab, setActiveTab, onOpenSettings }) {
  const { orders, syncStatus } = useOrders();

  const activeOrdersCount = orders.filter(
    (o) => o.status === 'preparing' || o.status === 'ready'
  ).length;

  const totalSales = orders
    .filter((o) => o.status !== 'cancelled')
    .reduce((sum, o) => sum + (o.totalAmount || 0), 0);

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-rose-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab('new-order')}>
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-rose-500 to-amber-500 flex items-center justify-center shadow-md shadow-rose-200 text-white font-bold text-xl">
              🧋
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-slate-900 text-lg tracking-tight">
                  Helcy's Stall
                </span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded-full bg-rose-100 text-rose-700">
                  College Fest
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">Boba & Momos Order Tracker</p>
            </div>
          </div>

          {/* Navigation Tabs - Desktop */}
          <nav className="hidden md:flex items-center space-x-1 bg-slate-100/80 p-1.5 rounded-2xl border border-slate-200/60">
            <button
              onClick={() => setActiveTab('new-order')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                activeTab === 'new-order'
                  ? 'bg-white text-rose-600 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              <ClipboardList className="w-4 h-4" />
              <span>Take Order</span>
            </button>

            <button
              onClick={() => setActiveTab('live-orders')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all relative ${
                activeTab === 'live-orders'
                  ? 'bg-white text-rose-600 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              <Clock className="w-4 h-4" />
              <span>Live Kitchen</span>
              {activeOrdersCount > 0 && (
                <span className="ml-1 inline-flex items-center justify-center px-2 py-0.5 text-xs font-bold leading-none text-white bg-rose-500 rounded-full animate-pulse">
                  {activeOrdersCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('past-orders')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                activeTab === 'past-orders'
                  ? 'bg-white text-rose-600 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>Sales & Past Orders</span>
            </button>
          </nav>

          {/* Right utility buttons */}
          <div className="flex items-center gap-2">
            {/* Quick revenue pill */}
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold">
              <span className="text-[10px] text-emerald-600 font-medium">Sales:</span>
              <span>₹{totalSales.toLocaleString('en-IN')}</span>
            </div>

            {/* Sync status indicator */}
            <button
              onClick={onOpenSettings}
              title={
                syncStatus === 'synced'
                  ? 'Firebase Cloud Sync Connected'
                  : syncStatus === 'connecting'
                  ? 'Connecting to Cloud...'
                  : 'Local Storage Mode (Click to setup Cloud Sync)'
              }
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                syncStatus === 'synced'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                  : syncStatus === 'connecting'
                  ? 'bg-amber-50 border-amber-200 text-amber-700 animate-pulse'
                  : 'bg-slate-100 border-slate-200 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {syncStatus === 'synced' ? (
                <>
                  <Cloud className="w-3.5 h-3.5 text-emerald-500" />
                  <span className="hidden sm:inline">Cloud Synced</span>
                </>
              ) : (
                <>
                  <CloudOff className="w-3.5 h-3.5 text-slate-400" />
                  <span className="hidden sm:inline">Offline / Local</span>
                </>
              )}
            </button>

            {/* Settings button */}
            <button
              onClick={onOpenSettings}
              className="p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors border border-transparent hover:border-slate-200"
              title="Settings & Firebase Config"
            >
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile bottom-like quick tabs */}
      <div className="flex md:hidden border-t border-slate-100 px-2 py-1.5 bg-slate-50/90 gap-1 justify-around">
        <button
          onClick={() => setActiveTab('new-order')}
          className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold flex flex-col items-center gap-0.5 ${
            activeTab === 'new-order'
              ? 'bg-rose-500 text-white shadow-sm'
              : 'text-slate-600'
          }`}
        >
          <ClipboardList className="w-4 h-4" />
          <span>Take Order</span>
        </button>

        <button
          onClick={() => setActiveTab('live-orders')}
          className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold flex flex-col items-center gap-0.5 relative ${
            activeTab === 'live-orders'
              ? 'bg-rose-500 text-white shadow-sm'
              : 'text-slate-600'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Live Kitchen</span>
          {activeOrdersCount > 0 && (
            <span className="absolute top-1 right-3 inline-flex items-center justify-center px-1.5 py-0.2 text-[10px] font-extrabold text-white bg-amber-500 rounded-full">
              {activeOrdersCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('past-orders')}
          className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold flex flex-col items-center gap-0.5 ${
            activeTab === 'past-orders'
              ? 'bg-rose-500 text-white shadow-sm'
              : 'text-slate-600'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>Sales</span>
        </button>
      </div>
    </header>
  );
}
