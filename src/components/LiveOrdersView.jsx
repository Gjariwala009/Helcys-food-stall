import React, { useState, useEffect } from 'react';
import {
  Clock,
  CheckCircle2,
  Bell,
  Smartphone,
  Banknote,
  Search,
  MessageSquare,
  Phone,
  Send,
  Sparkles,
  ChefHat,
  RotateCcw,
  AlertCircle
} from 'lucide-react';
import { useOrders } from '../context/OrdersContext';
import { ORDER_STATUS } from '../constants/menu';
import { soundEffects } from '../utils/audio';

function formatElapsed(dateString) {
  if (!dateString) return '';
  const now = Date.now();
  const created = new Date(dateString).getTime();
  const diffMinutes = Math.floor((now - created) / 60000);

  if (diffMinutes < 1) return 'Just now';
  if (diffMinutes === 1) return '1 min ago';
  if (diffMinutes < 60) return `${diffMinutes} mins ago`;
  const hours = Math.floor(diffMinutes / 60);
  return `${hours}h ${diffMinutes % 60}m ago`;
}

export default function LiveOrdersView({ onSwitchToNewOrder }) {
  const { orders, updateStatus } = useOrders();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStage, setFilterStage] = useState('preparing'); // 'preparing' (default: only orders to cook) | 'ready' | 'all'
  const [checkedItems, setCheckedItems] = useState({}); // { `${orderId}-${itemIdx}`: boolean }
  const [lastReadyOrder, setLastReadyOrder] = useState(null);
  const [lastCompletedOrder, setLastCompletedOrder] = useState(null);
  const [timerTick, setTimerTick] = useState(0);

  // Re-render every 30s to keep elapsed time accurate
  useEffect(() => {
    const interval = setInterval(() => {
      setTimerTick((t) => t + 1);
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  // Filter only active orders (preparing or ready)
  const activeOrders = orders.filter((order) => {
    const isLive = order.status === ORDER_STATUS.PREPARING || order.status === ORDER_STATUS.READY;
    if (!isLive) return false;

    if (filterStage !== 'all' && order.status !== filterStage) return false;

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const matchName = (order.customerName || '').toLowerCase().includes(q);
      const matchToken = (order.tokenNumber || '').toString().includes(q);
      const matchItems = (order.items || []).some((item) =>
        item.name.toLowerCase().includes(q)
      );
      return matchName || matchToken || matchItems;
    }

    return true;
  });

  // Toggle checklist for individual items inside an order
  const toggleItemCheck = (orderId, idx) => {
    const key = `${orderId}-${idx}`;
    setCheckedItems((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  // Mark as Ready: Clears from cooking view and alerts front desk
  const handleMarkReady = (order) => {
    soundEffects.playSuccess();
    updateStatus(order.id, ORDER_STATUS.READY);
    setLastReadyOrder(order);

    // Auto-dismiss toast after 7s
    setTimeout(() => {
      setLastReadyOrder((prev) => (prev?.id === order.id ? null : prev));
    }, 7000);
  };

  // Mark as Completed (Disappears from screen)
  const handleMarkCompleted = (order) => {
    soundEffects.playSuccess();
    updateStatus(order.id, ORDER_STATUS.COMPLETED);
    setLastCompletedOrder(order);

    // Auto-dismiss undo toast after 8 seconds
    setTimeout(() => {
      setLastCompletedOrder((prev) => (prev?.id === order.id ? null : prev));
    }, 8000);
  };

  // Undo accidental ready mark
  const handleUndoReady = () => {
    if (lastReadyOrder) {
      updateStatus(lastReadyOrder.id, ORDER_STATUS.PREPARING);
      setLastReadyOrder(null);
    }
  };

  // Undo accidental complete
  const handleUndoCompleted = () => {
    if (lastCompletedOrder) {
      updateStatus(lastCompletedOrder.id, ORDER_STATUS.PREPARING);
      setLastCompletedOrder(null);
    }
  };

  // Quick WhatsApp message link
  const getWhatsAppLink = (order) => {
    if (!order.contact) return '#';
    const cleanPhone = order.contact.replace(/\D/g, '');
    const phoneWithCountry = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
    const itemsList = order.items.map((i) => `${i.quantity}x ${i.name}`).join(', ');
    const msg = encodeURIComponent(
      `Hi ${order.customerName}! 🧋🥟 Your order #${order.tokenNumber} (${itemsList}) is READY for pickup at Helcy's Boba & Momos stall! Please come pick it up.`
    );
    return `https://wa.me/${phoneWithCountry}?text=${msg}`;
  };

  const preparingCount = orders.filter((o) => o.status === ORDER_STATUS.PREPARING).length;
  const readyCount = orders.filter((o) => o.status === ORDER_STATUS.READY).length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Ready Notification Toast */}
      {lastReadyOrder && (
        <div className="bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-xl flex items-center justify-between gap-4 animate-in slide-in-from-top duration-300">
          <div className="flex items-center gap-2.5 text-xs sm:text-sm">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <span>
              Order <strong>#{lastReadyOrder.tokenNumber}</strong> for{' '}
              <strong>{lastReadyOrder.customerName}</strong> marked Ready & sent to Front Desk!
            </span>
          </div>
          <button
            onClick={handleUndoReady}
            className="flex items-center gap-1.5 px-3 py-1 bg-white/20 hover:bg-white/30 text-white rounded-lg text-xs font-bold transition-colors shrink-0"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Undo</span>
          </button>
        </div>
      )}

      {/* Undo Completed Toast */}
      {lastCompletedOrder && (
        <div className="bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-xl flex items-center justify-between gap-4 animate-in slide-in-from-top duration-300">
          <div className="flex items-center gap-2.5 text-sm">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            <span>
              Order <strong>#{lastCompletedOrder.tokenNumber}</strong> for{' '}
              <strong>{lastCompletedOrder.customerName}</strong> marked as completed!
            </span>
          </div>
          <button
            onClick={handleUndoCompleted}
            className="flex items-center gap-1.5 px-3 py-1 bg-white/20 hover:bg-white/30 text-white rounded-lg text-xs font-bold transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Undo</span>
          </button>
        </div>
      )}

      {/* Screen Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <ChefHat className="w-7 h-7 text-rose-500" />
              <span>Live Kitchen & Queue</span>
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-rose-100 text-rose-800">
              {activeOrders.length} Active
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Kitchen queue. Cook items, then tap "Food Ready" to clear it and advance to the next order in line.
          </p>
        </div>

        {/* Filter Pills & Search */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-bold text-slate-600">
            <button
              onClick={() => setFilterStage('preparing')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                filterStage === 'preparing'
                  ? 'bg-white text-amber-600 shadow-sm'
                  : 'hover:text-slate-900'
              }`}
            >
              <span>🍳 To Cook</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${filterStage === 'preparing' ? 'bg-amber-100 text-amber-800' : 'bg-slate-200 text-slate-700'}`}>
                {preparingCount}
              </span>
            </button>
            <button
              onClick={() => setFilterStage('ready')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                filterStage === 'ready'
                  ? 'bg-white text-emerald-600 shadow-sm'
                  : 'hover:text-slate-900'
              }`}
            >
              <span>🔔 Ready at Front</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${filterStage === 'ready' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'}`}>
                {readyCount}
              </span>
            </button>
            <button
              onClick={() => setFilterStage('all')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                filterStage === 'all'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'hover:text-slate-900'
              }`}
            >
              All ({preparingCount + readyCount})
            </button>
          </div>

          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search token / name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-3 py-1.5 text-xs font-medium rounded-xl border border-slate-200 bg-white text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-400 w-44"
            />
          </div>
        </div>
      </div>

      {/* Empty State */}
      {activeOrders.length === 0 ? (
        <div className="bg-white rounded-3xl border border-dashed border-slate-200 p-12 text-center max-w-lg mx-auto space-y-4">
          <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto text-3xl">
            🍳
          </div>
          <div>
            <h3 className="text-lg font-extrabold text-slate-900">
              {filterStage === 'preparing'
                ? 'Cooking queue is all clear!'
                : filterStage === 'ready'
                ? 'No orders waiting at front desk'
                : 'Kitchen is all caught up!'}
            </h3>
            <p className="text-sm text-slate-500 mt-1">
              {filterStage === 'preparing'
                ? 'All pending orders have been cooked and sent to the front desk. Great job!'
                : 'There are no active orders matching this filter right now.'}
            </p>
            {filterStage === 'preparing' && readyCount > 0 && (
              <div className="mt-3">
                <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 py-1.5 px-3 rounded-xl inline-block">
                  🔔 {readyCount} order{readyCount > 1 ? 's are' : ' is'} waiting for customer pickup at the front counter.
                </span>
              </div>
            )}
          </div>
          <button
            onClick={onSwitchToNewOrder}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-bold text-sm shadow-md shadow-rose-200 transition-colors"
          >
            <Sparkles className="w-4 h-4" />
            <span>Take Next Order</span>
          </button>
        </div>
      ) : (
        /* Active Orders Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {activeOrders.map((order) => {
            const isReady = order.status === ORDER_STATUS.READY;
            const elapsed = formatElapsed(order.createdAt);

            return (
              <div
                key={order.id}
                className={`bg-white rounded-3xl border transition-all duration-200 shadow-sm flex flex-col justify-between overflow-hidden ${
                  isReady
                    ? 'border-emerald-300 ring-2 ring-emerald-400/20'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                {/* Header */}
                <div
                  className={`p-4 border-b ${
                    isReady
                      ? 'bg-gradient-to-r from-emerald-50 to-teal-50 border-emerald-100'
                      : 'bg-gradient-to-r from-amber-50 to-orange-50 border-amber-100'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-2xl font-black text-slate-900 tracking-tight">
                          #{order.tokenNumber}
                        </span>
                        <span
                          className={`text-[11px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                            isReady
                              ? 'bg-emerald-200 text-emerald-900 animate-pulse'
                              : 'bg-amber-200 text-amber-900'
                          }`}
                        >
                          {isReady ? 'Ready for Pickup' : 'Preparing'}
                        </span>
                      </div>
                      <h4 className="font-extrabold text-slate-900 text-base mt-1">
                        {order.customerName}
                      </h4>
                    </div>

                    <div className="text-right flex flex-col items-end">
                      <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-500">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{elapsed}</span>
                      </div>
                      <div className="mt-1">
                        <span
                          className={`text-xs font-bold px-2 py-0.5 rounded-md inline-flex items-center gap-1 ${
                            order.paymentMethod === 'Online'
                              ? 'bg-indigo-100 text-indigo-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {order.paymentMethod === 'Online' ? (
                            <Smartphone className="w-3 h-3" />
                          ) : (
                            <Banknote className="w-3 h-3" />
                          )}
                          ₹{order.totalAmount}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Customer Contact + WhatsApp shortcut */}
                  {order.contact && (
                    <div className="mt-2.5 pt-2 border-t border-black/5 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1 text-slate-600 font-medium">
                        <Phone className="w-3 h-3 text-slate-400" />
                        <span>{order.contact}</span>
                      </div>
                      <a
                        href={getWhatsAppLink(order)}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-white px-2 py-0.5 rounded-md border border-emerald-200 hover:bg-emerald-50 transition-colors"
                        title="Ping customer on WhatsApp"
                      >
                        <Send className="w-2.5 h-2.5" />
                        <span>Ping Ready</span>
                      </a>
                    </div>
                  )}
                </div>

                {/* Items Checklist for Kitchen */}
                <div className="p-4 space-y-2.5 flex-1">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                    Items to Prepare (Tap to cross off):
                  </div>

                  <div className="space-y-1.5">
                    {order.items.map((item, idx) => {
                      const isChecked = !!checkedItems[`${order.id}-${idx}`];
                      return (
                        <div
                          key={idx}
                          onClick={() => toggleItemCheck(order.id, idx)}
                          className={`flex items-center justify-between p-2 rounded-xl border text-sm cursor-pointer select-none transition-all ${
                            isChecked
                              ? 'bg-slate-50 border-slate-200 text-slate-400 line-through'
                              : 'bg-white border-slate-200 hover:border-slate-300 text-slate-800 font-semibold'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <div
                              className={`w-4 h-4 rounded border flex items-center justify-center ${
                                isChecked
                                  ? 'bg-emerald-500 border-emerald-500 text-white'
                                  : 'border-slate-300 bg-white'
                              }`}
                            >
                              {isChecked && <CheckCircle2 className="w-3.5 h-3.5" />}
                            </div>
                            <span className="font-extrabold text-rose-600">
                              {item.quantity}x
                            </span>
                            <span>{item.name}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Special Remarks / Instructions */}
                  {order.remarks && (
                    <div className="mt-3 p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2">
                      <MessageSquare className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold">Notes: </span>
                        <span>{order.remarks}</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center gap-2">
                  {!isReady ? (
                    <button
                      type="button"
                      onClick={() => handleMarkReady(order)}
                      className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 active:scale-95 text-white font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md shadow-emerald-200 transition-all"
                      title="Food is ready - clears from kitchen screen and alerts front desk"
                    >
                      <CheckCircle2 className="w-4 h-4 text-emerald-100" />
                      <span>Food Ready ➔ Send to Front Desk 🔔</span>
                    </button>
                  ) : (
                    <div className="flex items-center gap-2 w-full">
                      <button
                        type="button"
                        onClick={() => updateStatus(order.id, ORDER_STATUS.PREPARING)}
                        className="py-2.5 px-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
                        title="Move back to cooking queue"
                      >
                        <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                        <span>Back to Cook</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleMarkCompleted(order)}
                        className="flex-1 py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs flex items-center justify-center gap-1.5 transition-all shadow-sm"
                        title="Handed to customer"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Complete & Hand Over</span>
                      </button>
                    </div>
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
