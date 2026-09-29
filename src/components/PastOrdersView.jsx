import React, { useState, useMemo } from 'react';
import {
  BarChart3,
  TrendingUp,
  Download,
  Search,
  Filter,
  Receipt,
  RotateCcw,
  Banknote,
  Smartphone,
  Calendar,
  CheckCircle2,
  Clock,
  ChevronDown,
  ShoppingBag,
  Info,
  Trash2,
  AlertTriangle,
  X
} from 'lucide-react';
import { useOrders } from '../context/OrdersContext';
import { MENU_ITEMS, ORDER_STATUS } from '../constants/menu';
import { exportOrdersToCSV } from '../services/storage';

export default function PastOrdersView({ onOpenReceipt }) {
  const { orders, updateStatus, removeOrder } = useOrders();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPayment, setSelectedPayment] = useState('all'); // 'all' | 'Cash' | 'Online'
  const [selectedStatus, setSelectedStatus] = useState('all'); // 'all' | 'completed' | 'preparing' | 'ready'
  const [orderToDelete, setOrderToDelete] = useState(null);
  const [confirmTokenInput, setConfirmTokenInput] = useState('');

  // Analytics Computations
  const analytics = useMemo(() => {
    // Only calculate earnings on valid orders (completed or preparing, not cancelled)
    const validOrders = orders.filter((o) => o.status !== ORDER_STATUS.CANCELLED);

    const totalRevenue = validOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
    const totalCount = orders.length;
    const completedCount = orders.filter((o) => o.status === ORDER_STATUS.COMPLETED).length;

    // Payment breakdown
    const cashOrders = validOrders.filter((o) => o.paymentMethod === 'Cash');
    const cashTotal = cashOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);

    const onlineOrders = validOrders.filter((o) => o.paymentMethod === 'Online');
    const onlineTotal = onlineOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);

    // Items sales breakdown
    const itemMap = {};
    MENU_ITEMS.forEach((mi) => {
      itemMap[mi.id] = {
        ...mi,
        unitsSold: 0,
        totalSales: 0,
      };
    });

    validOrders.forEach((o) => {
      (o.items || []).forEach((item) => {
        if (itemMap[item.id]) {
          itemMap[item.id].unitsSold += item.quantity;
          itemMap[item.id].totalSales += item.quantity * item.price;
        } else {
          // Fallback if item was modified
          itemMap[item.id] = {
            id: item.id,
            name: item.name,
            price: item.price,
            unitsSold: item.quantity,
            totalSales: item.quantity * item.price,
            emoji: '🍴',
          };
        }
      });
    });

    const itemBreakdown = Object.values(itemMap);
    const totalUnitsSold = itemBreakdown.reduce((sum, i) => sum + i.unitsSold, 0);

    // Calculate total boba vs momos
    const totalBobaUnits = itemBreakdown
      .filter((i) => i.category === 'boba')
      .reduce((sum, i) => sum + i.unitsSold, 0);

    const totalMomoUnits = itemBreakdown
      .filter((i) => i.category === 'momos')
      .reduce((sum, i) => sum + i.unitsSold, 0);

    return {
      totalRevenue,
      totalCount,
      completedCount,
      cashTotal,
      cashCount: cashOrders.length,
      onlineTotal,
      onlineCount: onlineOrders.length,
      itemBreakdown,
      totalUnitsSold,
      totalBobaUnits,
      totalMomoUnits,
      avgOrderValue: validOrders.length > 0 ? Math.round(totalRevenue / validOrders.length) : 0,
    };
  }, [orders]);

  // Filtered orders list
  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      if (selectedPayment !== 'all' && order.paymentMethod !== selectedPayment) return false;
      if (selectedStatus !== 'all' && order.status !== selectedStatus) return false;

      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matchName = (order.customerName || '').toLowerCase().includes(q);
        const matchToken = (order.tokenNumber || '').toString().includes(q);
        const matchContact = (order.contact || '').toLowerCase().includes(q);
        const matchItems = (order.items || []).some((item) =>
          item.name.toLowerCase().includes(q)
        );
        return matchName || matchToken || matchContact || matchItems;
      }

      return true;
    });
  }, [orders, selectedPayment, selectedStatus, searchTerm]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <BarChart3 className="w-7 h-7 text-rose-500" />
            <span>Sales & Past Orders</span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Complete breakdown of sales revenue, items sold, and customer order history
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => exportOrdersToCSV(orders)}
            disabled={orders.length === 0}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Download full report as CSV (compatible with Excel & Sheets)"
          >
            <Download className="w-4 h-4" />
            <span>Export Sales CSV</span>
          </button>
        </div>
      </div>

      {/* Top 4 KPI Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Revenue */}
        <div className="bg-gradient-to-br from-rose-500 to-amber-600 rounded-3xl p-5 text-white shadow-lg shadow-rose-200">
          <div className="flex items-center justify-between opacity-90 text-xs font-bold uppercase tracking-wider">
            <span>Total Sales Revenue</span>
            <TrendingUp className="w-4 h-4" />
          </div>
          <div className="text-3xl font-black mt-2 tracking-tight">
            ₹{analytics.totalRevenue.toLocaleString('en-IN')}
          </div>
          <div className="text-xs text-rose-100 font-medium mt-1">
            Across {analytics.completedCount} completed orders
          </div>
        </div>

        {/* Online / UPI Collection */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-400">
            <span className="flex items-center gap-1.5 text-indigo-700">
              <Smartphone className="w-4 h-4" />
              <span>Online / UPI</span>
            </span>
            <span className="text-slate-500 font-medium">{analytics.onlineCount} orders</span>
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2 tracking-tight">
            ₹{analytics.onlineTotal.toLocaleString('en-IN')}
          </div>
          <div className="text-xs text-slate-500 font-medium mt-1">
            {analytics.totalRevenue > 0
              ? `${Math.round((analytics.onlineTotal / analytics.totalRevenue) * 100)}% of total revenue`
              : 'No sales yet'}
          </div>
        </div>

        {/* Cash Collection */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-400">
            <span className="flex items-center gap-1.5 text-emerald-700">
              <Banknote className="w-4 h-4" />
              <span>Cash in Hand</span>
            </span>
            <span className="text-slate-500 font-medium">{analytics.cashCount} orders</span>
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2 tracking-tight">
            ₹{analytics.cashTotal.toLocaleString('en-IN')}
          </div>
          <div className="text-xs text-slate-500 font-medium mt-1">
            {analytics.totalRevenue > 0
              ? `${Math.round((analytics.cashTotal / analytics.totalRevenue) * 100)}% of total revenue`
              : 'No sales yet'}
          </div>
        </div>

        {/* Total Quantities: Boba & Momos */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
            <span>Items Prepared</span>
            <ShoppingBag className="w-4 h-4 text-slate-400" />
          </div>
          <div className="grid grid-cols-2 gap-2 mt-2">
            <div className="bg-rose-50 rounded-xl p-2 text-center border border-rose-100">
              <div className="text-lg font-black text-rose-700">
                {analytics.totalBobaUnits}
              </div>
              <div className="text-[10px] font-bold text-rose-600 uppercase">🧋 Boba Cups</div>
            </div>
            <div className="bg-amber-50 rounded-xl p-2 text-center border border-amber-100">
              <div className="text-lg font-black text-amber-700">
                {analytics.totalMomoUnits}
              </div>
              <div className="text-[10px] font-bold text-amber-600 uppercase">🥟 Momo Plates</div>
            </div>
          </div>
        </div>
      </div>

      {/* Item-by-Item Breakdown Cards */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-5 sm:p-6 space-y-4">
        <div>
          <h3 className="text-base font-extrabold text-slate-900">
            Menu Items Sales Breakdown
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Quantity sold and earnings for each of MoBa Stall's items
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
          {analytics.itemBreakdown.map((item) => {
            const revenuePercent =
              analytics.totalRevenue > 0
                ? Math.round((item.totalSales / analytics.totalRevenue) * 100)
                : 0;

            return (
              <div
                key={item.id}
                className="rounded-2xl border border-slate-200/80 p-3.5 bg-slate-50/50 hover:bg-slate-50 transition-colors flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{item.emoji}</span>
                    <span className="font-bold text-slate-900 text-xs truncate">
                      {item.name}
                    </span>
                  </div>
                  <div className="mt-2 text-xl font-black text-slate-900">
                    {item.unitsSold}{' '}
                    <span className="text-xs font-semibold text-slate-500">sold</span>
                  </div>
                </div>

                <div className="mt-3 pt-2 border-t border-slate-200/60 flex items-center justify-between text-xs">
                  <span className="font-extrabold text-rose-600">
                    ₹{item.totalSales}
                  </span>
                  <span className="font-semibold text-slate-400 text-[11px]">
                    {revenuePercent}% share
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Past Orders History List with Filters */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden space-y-4 p-5 sm:p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-100">
          <div>
            <h3 className="text-base font-extrabold text-slate-900">
              Customer Order History
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Showing {filteredOrders.length} of {orders.length} total orders
            </p>
          </div>

          {/* Search and Filters */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Search */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search name / token..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 pr-3 py-1.5 text-xs font-medium rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-400 w-44"
              />
            </div>

            {/* Payment Filter */}
            <select
              value={selectedPayment}
              onChange={(e) => setSelectedPayment(e.target.value)}
              className="text-xs font-bold px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-rose-500/20"
            >
              <option value="all">All Payments</option>
              <option value="Cash">Cash Only</option>
              <option value="Online">Online UPI Only</option>
            </select>

            {/* Status Filter */}
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="text-xs font-bold px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-rose-500/20"
            >
              <option value="all">All Statuses</option>
              <option value="completed">Completed</option>
              <option value="preparing">Preparing</option>
              <option value="ready">Ready</option>
            </select>
          </div>
        </div>

        {/* Orders Table (Responsive) */}
        {filteredOrders.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-sm">
            No orders match the selected filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 uppercase font-bold text-[10px] tracking-wider">
                  <th className="py-3 px-3">Token</th>
                  <th className="py-3 px-3">Customer</th>
                  <th className="py-3 px-3">Items Ordered</th>
                  <th className="py-3 px-3">Payment</th>
                  <th className="py-3 px-3">Total</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3">Time</th>
                  <th className="py-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredOrders.map((order) => {
                  const formattedTime = new Date(order.createdAt).toLocaleTimeString('en-IN', {
                    hour: '2-digit',
                    minute: '2-digit',
                  });

                  return (
                    <tr key={order.id} className="hover:bg-slate-50/70 transition-colors">
                      {/* Token */}
                      <td className="py-3 px-3 font-black text-slate-900 text-sm">
                        #{order.tokenNumber}
                      </td>

                      {/* Customer & phone */}
                      <td className="py-3 px-3">
                        <div className="font-extrabold text-slate-900">{order.customerName}</div>
                        {order.contact && (
                          <div className="text-[11px] text-slate-400">{order.contact}</div>
                        )}
                        {order.remarks && (
                          <div className="text-[10px] text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded inline-block mt-0.5 font-medium">
                            Note: {order.remarks}
                          </div>
                        )}
                      </td>

                      {/* Items */}
                      <td className="py-3 px-3 max-w-xs">
                        <div className="flex flex-wrap gap-1">
                          {order.items.map((item, idx) => (
                            <span
                              key={idx}
                              className="inline-flex items-center px-2 py-0.5 rounded-md bg-slate-100 text-slate-800 font-semibold text-[11px]"
                            >
                              <strong className="text-rose-600 mr-1">{item.quantity}x</strong>
                              {item.name}
                            </span>
                          ))}
                        </div>
                      </td>

                      {/* Payment */}
                      <td className="py-3 px-3">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full font-bold text-[11px] ${
                            order.paymentMethod === 'Online'
                              ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                              : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          }`}
                        >
                          {order.paymentMethod === 'Online' ? (
                            <Smartphone className="w-3 h-3" />
                          ) : (
                            <Banknote className="w-3 h-3" />
                          )}
                          {order.paymentMethod}
                        </span>
                      </td>

                      {/* Total Amount */}
                      <td className="py-3 px-3 font-black text-slate-900 text-sm">
                        ₹{order.totalAmount}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-3">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full font-extrabold uppercase text-[10px] ${
                            order.status === 'completed'
                              ? 'bg-slate-100 text-slate-700'
                              : order.status === 'ready'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {order.status}
                        </span>
                      </td>

                      {/* Time */}
                      <td className="py-3 px-3 text-slate-500 font-medium">
                        {formattedTime}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {/* View Receipt */}
                          <button
                            onClick={() => onOpenReceipt(order)}
                            className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-200 rounded-lg transition-colors"
                            title="View / Print Receipt"
                          >
                            <Receipt className="w-3.5 h-3.5" />
                          </button>

                          {/* Reopen if completed */}
                          {order.status === 'completed' && (
                            <button
                              onClick={() => updateStatus(order.id, 'preparing')}
                              className="p-1.5 text-amber-600 hover:text-amber-700 hover:bg-amber-50 rounded-lg transition-colors"
                              title="Re-open to active kitchen queue"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {/* Protected Delete Order */}
                          <button
                            onClick={() => {
                              setOrderToDelete(order);
                              setConfirmTokenInput('');
                            }}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            title="Delete Order (Protected)"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Mistake-Proof Protected Delete Confirmation Modal */}
      {orderToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-4 bg-rose-600 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center">
                  <Trash2 className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="font-black text-sm">Delete Order #{orderToDelete.tokenNumber}?</h3>
                  <p className="text-[11px] text-rose-100">Permanent Record Deletion</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setOrderToDelete(null);
                  setConfirmTokenInput('');
                }}
                className="p-1.5 rounded-lg text-rose-100 hover:text-white hover:bg-rose-700 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4 text-xs text-slate-700">
              <div className="p-3.5 rounded-2xl bg-rose-50/70 border border-rose-200 text-rose-900 space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-xs text-rose-800">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>Warning: This cannot be undone</span>
                </div>
                <p className="text-[11px] text-rose-700 leading-relaxed">
                  This order will be permanently erased from sales history and the live database.
                </p>
              </div>

              {/* Order Details Preview */}
              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-500">Order:</span>
                  <span className="font-black text-slate-900 text-sm">#{orderToDelete.tokenNumber}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-500">Customer:</span>
                  <span className="font-extrabold text-slate-900">{orderToDelete.customerName || 'Walk-in'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-500">Total:</span>
                  <span className="font-black text-slate-900">₹{orderToDelete.totalAmount} ({orderToDelete.paymentMethod})</span>
                </div>
                <div className="pt-1 border-t border-slate-200/70 text-[11px] text-slate-600">
                  <span className="font-bold">Items: </span>
                  <span>{orderToDelete.items.map(i => `${i.quantity}x ${i.name}`).join(', ')}</span>
                </div>
              </div>

              {/* Fail-Safe Input Requirement */}
              <div className="space-y-2">
                <label className="block text-[11px] font-bold text-slate-700">
                  To prevent accidental deletion, type the token number <strong className="text-rose-600 font-black">"{orderToDelete.tokenNumber}"</strong> below:
                </label>
                <input
                  type="text"
                  placeholder={`Type ${orderToDelete.tokenNumber}`}
                  value={confirmTokenInput}
                  onChange={(e) => setConfirmTokenInput(e.target.value)}
                  autoFocus
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-white font-mono text-center font-bold text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-400"
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setOrderToDelete(null);
                  setConfirmTokenInput('');
                }}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-100 transition-colors"
              >
                Cancel (Keep Order)
              </button>
              <button
                type="button"
                disabled={confirmTokenInput.trim() !== String(orderToDelete.tokenNumber)}
                onClick={() => {
                  if (confirmTokenInput.trim() === String(orderToDelete.tokenNumber)) {
                    removeOrder(orderToDelete.id);
                    setOrderToDelete(null);
                    setConfirmTokenInput('');
                  }
                }}
                className={`px-4 py-2 rounded-xl text-white font-black text-xs flex items-center gap-1.5 transition-all shadow-sm ${
                  confirmTokenInput.trim() === String(orderToDelete.tokenNumber)
                    ? 'bg-rose-600 hover:bg-rose-700 active:scale-95 shadow-rose-200 cursor-pointer'
                    : 'bg-rose-300 opacity-60 cursor-not-allowed'
                }`}
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Permanently Delete</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
