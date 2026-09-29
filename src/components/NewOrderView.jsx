import React, { useState, useMemo, useRef, useEffect } from 'react';
import confetti from 'canvas-confetti';
import {
  Plus,
  Minus,
  Trash2,
  CheckCircle2,
  Banknote,
  Smartphone,
  User,
  Phone,
  MessageSquare,
  Sparkles,
  ShoppingBag,
  RotateCcw,
  Check,
  Bell,
  Send,
  Clock,
  ChefHat
} from 'lucide-react';
import { MENU_ITEMS, PAYMENT_METHODS, ORDER_STATUS } from '../constants/menu';
import { useOrders } from '../context/OrdersContext';
import { soundEffects } from '../utils/audio';

const QUICK_NOTES = [
  'Less Sweet',
  'No Ice',
  'Extra Spicy Chutney',
  'Mild Chutney',
  'Extra Dip',
  'Separate Pack',
];

export default function NewOrderView({ onOrderPlacedSuccess }) {
  const { orders, createOrder, updateStatus } = useOrders();

  // State for quantities of each item
  const [quantities, setQuantities] = useState({
    'green-apple-boba': 0,
    'orange-boba': 0,
    'strawberry-boba': 0,
    'blueberry-boba': 0,
    'steamed-momos': 0,
  });

  const [customerName, setCustomerName] = useState('');
  const [contact, setContact] = useState('');
  const [paymentMethod, setPaymentMethod] = useState(PAYMENT_METHODS.ONLINE);
  const [remarks, setRemarks] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastPlacedOrder, setLastPlacedOrder] = useState(null);

  // Increment item quantity
  const handleIncrement = (id) => {
    setQuantities((prev) => ({
      ...prev,
      [id]: (prev[id] || 0) + 1,
    }));
  };

  // Decrement item quantity
  const handleDecrement = (id) => {
    setQuantities((prev) => ({
      ...prev,
      [id]: Math.max(0, (prev[id] || 0) - 1),
    }));
  };

  // Reset entire form
  const handleReset = () => {
    setQuantities({
      'green-apple-boba': 0,
      'orange-boba': 0,
      'strawberry-boba': 0,
      'blueberry-boba': 0,
      'steamed-momos': 0,
    });
    setCustomerName('');
    setContact('');
    setRemarks('');
    setPaymentMethod(PAYMENT_METHODS.ONLINE);
  };

  // Calculate cart items and totals
  const selectedItems = MENU_ITEMS.map((item) => ({
    ...item,
    quantity: quantities[item.id] || 0,
  })).filter((item) => item.quantity > 0);

  const totalItemsCount = selectedItems.reduce((acc, curr) => acc + curr.quantity, 0);
  const grandTotal = selectedItems.reduce(
    (acc, curr) => acc + curr.price * curr.quantity,
    0
  );

  const handleAddQuickNote = (note) => {
    setRemarks((prev) => {
      if (!prev) return note;
      if (prev.includes(note)) return prev;
      return `${prev}, ${note}`;
    });
  };

  // Live orders tracking for front desk
  const readyOrders = useMemo(() => {
    return orders.filter((o) => o.status === ORDER_STATUS.READY);
  }, [orders]);

  const preparingOrders = useMemo(() => {
    return orders.filter((o) => o.status === ORDER_STATUS.PREPARING);
  }, [orders]);

  // Audio chime alert when a new order becomes ready in the kitchen
  const prevReadyCountRef = useRef(readyOrders.length);
  useEffect(() => {
    if (readyOrders.length > prevReadyCountRef.current) {
      soundEffects.playBell();
    }
    prevReadyCountRef.current = readyOrders.length;
  }, [readyOrders.length]);

  // 1-Click Complete & Hand Over from front desk
  const handleCompleteOrder = (order) => {
    soundEffects.playSuccess();
    updateStatus(order.id, ORDER_STATUS.COMPLETED);
  };

  // WhatsApp Ping helper
  const getWhatsAppLink = (order) => {
    if (!order.contact) return '#';
    const cleanPhone = order.contact.replace(/\D/g, '');
    const phoneWithCountry = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
    const itemsList = order.items.map((i) => `${i.quantity}x ${i.name}`).join(', ');
    const msg = encodeURIComponent(
      `Hi ${order.customerName}! 🥟🧋 Your order #${order.tokenNumber} (${itemsList}) is READY for pickup at MoBa Stall!`
    );
    return `https://wa.me/${phoneWithCountry}?text=${msg}`;
  };

  // Handle Order Submit
  const handleSubmitOrder = async (e) => {
    e.preventDefault();
    if (selectedItems.length === 0) {
      alert('Please add at least one item to the order!');
      return;
    }

    if (!customerName.trim()) {
      alert('Please enter the customer name!');
      return;
    }

    setIsSubmitting(true);
    try {
      const orderPayload = {
        customerName: customerName.trim(),
        contact: contact.trim(),
        items: selectedItems.map((item) => ({
          id: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          category: item.category,
        })),
        totalAmount: grandTotal,
        paymentMethod,
        remarks: remarks.trim(),
      };

      const result = await createOrder(orderPayload);

      // Play chime & confetti
      soundEffects.playOrderPlaced();
      confetti({
        particleCount: 60,
        spread: 60,
        origin: { y: 0.6 },
        colors: ['#f43f5e', '#10b981', '#f59e0b', '#3b82f6'],
      });

      setLastPlacedOrder(result.order);
      handleReset();
    } catch (err) {
      console.error('Error placing order:', err);
      alert('Failed to place order. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Success Modal / Banner */}
      {lastPlacedOrder && (
        <div className="mb-6 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-2xl p-5 text-white shadow-lg shadow-emerald-200 animate-in fade-in zoom-in-95 duration-200 relative overflow-hidden">
          <div className="absolute right-0 top-0 translate-x-4 -translate-y-4 opacity-10 text-9xl font-black">
            #{lastPlacedOrder.tokenNumber}
          </div>
          <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center shrink-0">
                <Check className="w-7 h-7 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs uppercase font-extrabold tracking-wider bg-white/20 px-2 py-0.5 rounded-full">
                    Order Confirmed
                  </span>
                  <span className="text-xs font-semibold text-emerald-100">
                    Sent to Kitchen
                  </span>
                </div>
                <h3 className="text-xl sm:text-2xl font-black tracking-tight mt-0.5">
                  Token #{lastPlacedOrder.tokenNumber} — {lastPlacedOrder.customerName}
                </h3>
                <p className="text-xs sm:text-sm text-emerald-100 mt-0.5">
                  ₹{lastPlacedOrder.totalAmount} paid via {lastPlacedOrder.paymentMethod}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                onClick={() => setLastPlacedOrder(null)}
                className="flex-1 sm:flex-initial px-4 py-2 bg-white text-emerald-800 rounded-xl font-bold text-sm shadow hover:bg-emerald-50 transition-colors"
              >
                Done (Take Next)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Ready for Pickup Live Alert Bar (Visible to Front Desk) */}
      {readyOrders.length > 0 ? (
        <div className="mb-6 rounded-3xl border-2 border-emerald-400 bg-gradient-to-r from-emerald-50 via-teal-50/60 to-emerald-50 p-5 shadow-lg shadow-emerald-500/10 animate-in slide-in-from-top-4 duration-300">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-emerald-200/80">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shadow-md shadow-emerald-200 animate-bounce shrink-0">
                <Bell className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base sm:text-lg font-black text-emerald-950 tracking-tight">
                    🔔 Ready for Pickup ({readyOrders.length})
                  </h2>
                  <span className="text-[10px] uppercase font-black bg-emerald-200 text-emerald-900 px-2 py-0.5 rounded-full animate-pulse">
                    Kitchen Ready
                  </span>
                </div>
                <p className="text-xs text-emerald-700 font-medium">
                  Prepared in kitchen. Hand over to customer and click "Complete & Hand Over".
                </p>
              </div>
            </div>

            {preparingOrders.length > 0 && (
              <div className="text-xs font-bold text-slate-600 bg-white/90 border border-emerald-200 px-3 py-1.5 rounded-xl self-start sm:self-auto flex items-center gap-2 shadow-sm">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping"></span>
                <span>{preparingOrders.length} order{preparingOrders.length > 1 ? 's' : ''} in kitchen prep</span>
              </div>
            )}
          </div>

          {/* Ready Orders Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 pt-4">
            {readyOrders.map((order) => (
              <div
                key={order.id}
                className="bg-white rounded-2xl border-2 border-emerald-400/80 p-4 shadow-sm flex flex-col justify-between hover:shadow-md transition-all relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 bg-emerald-500 text-white font-black text-[10px] uppercase px-2.5 py-0.5 rounded-bl-xl shadow-sm tracking-wider">
                  Pickup Ready
                </div>

                <div>
                  <div className="flex items-center gap-2.5 mb-2.5">
                    <span className="text-base font-black text-emerald-950 bg-emerald-100/80 border border-emerald-300 px-2.5 py-1 rounded-xl">
                      #{order.tokenNumber}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="font-extrabold text-slate-900 text-sm truncate">
                        {order.customerName}
                      </div>
                      {order.contact ? (
                        <div className="text-[11px] text-slate-500 flex items-center gap-1">
                          <Phone className="w-3 h-3 text-slate-400" />
                          <span>{order.contact}</span>
                        </div>
                      ) : (
                        <div className="text-[11px] text-slate-400">Walk-in</div>
                      )}
                    </div>
                  </div>

                  {/* Items list */}
                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-xs mb-3">
                    <div className="font-semibold text-slate-700 flex flex-wrap gap-1.5">
                      {order.items.map((item, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center gap-1 bg-white px-2 py-0.5 rounded-md border border-slate-200 text-[11px]"
                        >
                          <strong className="text-emerald-700">{item.quantity}x</strong>
                          <span>{item.name}</span>
                        </span>
                      ))}
                    </div>
                    {order.remarks && (
                      <div className="text-[10px] text-amber-800 font-medium pt-1.5 flex items-center gap-1">
                        <span className="font-bold">Note:</span>
                        <span>{order.remarks}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Handover & WhatsApp Buttons */}
                <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                  {order.contact && (
                    <a
                      href={getWhatsAppLink(order)}
                      target="_blank"
                      rel="noreferrer"
                      className="p-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 transition-colors flex items-center justify-center shrink-0"
                      title="Ping Customer on WhatsApp: Order is ready"
                    >
                      <Send className="w-4 h-4" />
                    </a>
                  )}
                  <button
                    type="button"
                    onClick={() => handleCompleteOrder(order)}
                    className="flex-1 py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-black text-xs flex items-center justify-center gap-1.5 shadow-md shadow-emerald-200 transition-all"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Complete & Hand Over</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : preparingOrders.length > 0 ? (
        /* Subtle kitchen status bar when no orders are ready yet but kitchen is actively cooking */
        <div className="mb-6 p-3 rounded-2xl bg-amber-50/70 border border-amber-200/80 flex items-center justify-between text-xs text-amber-900">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
              <ChefHat className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold">Kitchen Queue Active: </span>
              <span>
                {preparingOrders.length} order{preparingOrders.length > 1 ? 's' : ''} currently being prepared in the back.
              </span>
            </div>
          </div>
          <span className="text-[11px] text-amber-700 font-medium hidden sm:inline">
            When kitchen taps "Mark Ready", order will pop up here with a chime 🔔
          </span>
        </div>
      ) : null}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Menu Selection (8 cols on lg) */}
        <div className="lg:col-span-7 xl:col-span-8 space-y-6">
          <div>
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                  <span>Menu & Items</span>
                  <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-rose-100 text-rose-700">
                    5 Items Available
                  </span>
                </h1>
                <p className="text-sm text-slate-500 mt-1">
                  Tap to add Boba & Momos to the current customer order
                </p>
              </div>

              {totalItemsCount > 0 && (
                <button
                  type="button"
                  onClick={handleReset}
                  className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-rose-600 transition-colors bg-slate-100 hover:bg-rose-50 px-3 py-1.5 rounded-lg"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset All</span>
                </button>
              )}
            </div>
          </div>

          {/* Menu Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {MENU_ITEMS.map((item) => {
              const qty = quantities[item.id] || 0;
              const isSelected = qty > 0;

              return (
                <div
                  key={item.id}
                  className={`group relative rounded-2xl border transition-all duration-200 overflow-hidden flex flex-col justify-between ${
                    isSelected
                      ? `border-rose-400 bg-white ring-2 ring-rose-400/20 shadow-md`
                      : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm'
                  }`}
                >
                  {/* Card Header with Top Gradient stripe */}
                  <div
                    className="p-4 cursor-pointer"
                    onClick={() => handleIncrement(item.id)}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shadow-inner ${item.lightBg} border ${item.border}`}
                        >
                          {item.emoji}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-extrabold text-slate-900 text-base leading-snug">
                              {item.name}
                            </span>
                          </div>
                          <span
                            className={`inline-block text-[11px] font-bold px-2 py-0.5 rounded-full mt-1 ${item.tagBg}`}
                          >
                            {item.badge}
                          </span>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-lg font-black text-slate-900">
                          ₹{item.price}
                        </span>
                        <div className="text-[10px] text-slate-400 font-medium">per serving</div>
                      </div>
                    </div>

                    <p className="text-xs text-slate-500 mt-3 line-clamp-2">
                      {item.description}
                    </p>
                  </div>

                  {/* Quantity Stepper Bar */}
                  <div
                    className={`px-4 py-3 border-t flex items-center justify-between transition-colors ${
                      isSelected
                        ? 'bg-rose-50/50 border-rose-100'
                        : 'bg-slate-50/60 border-slate-100'
                    }`}
                  >
                    <span className="text-xs font-semibold text-slate-600">
                      {qty > 0 ? (
                        <span className="text-rose-700 font-bold">
                          Subtotal: ₹{qty * item.price}
                        </span>
                      ) : (
                        'Tap to add'
                      )}
                    </span>

                    <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        onClick={() => handleDecrement(item.id)}
                        disabled={qty === 0}
                        className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
                          qty > 0
                            ? 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 active:scale-95 shadow-sm'
                            : 'opacity-30 cursor-not-allowed bg-slate-100 text-slate-400'
                        }`}
                        title="Remove 1"
                      >
                        <Minus className="w-4 h-4" />
                      </button>

                      <div className="w-9 text-center font-black text-slate-900 text-base">
                        {qty}
                      </div>

                      <button
                        type="button"
                        onClick={() => handleIncrement(item.id)}
                        className="w-8 h-8 rounded-lg bg-rose-500 hover:bg-rose-600 text-white flex items-center justify-center active:scale-95 shadow-sm transition-all"
                        title="Add 1"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Customer Details & Order Confirmation (4-5 cols) */}
        <div className="lg:col-span-5 xl:col-span-4">
          <form
            onSubmit={handleSubmitOrder}
            className="sticky top-20 bg-white rounded-3xl border border-slate-200/90 shadow-sm p-5 sm:p-6 space-y-5"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-rose-500" />
                <h2 className="font-extrabold text-slate-900 text-lg">
                  Order Details
                </h2>
              </div>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                {totalItemsCount} {totalItemsCount === 1 ? 'item' : 'items'}
              </span>
            </div>

            {/* Customer Name (Required) */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-rose-500" />
                <span>Customer Name <span className="text-rose-500">*</span></span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Priya / Rohan"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-900 placeholder:text-slate-400 font-medium text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all"
              />
            </div>

            {/* Customer Contact (Optional) */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                <span>Contact Number <span className="text-slate-400 font-normal lowercase">(optional)</span></span>
              </label>
              <input
                type="tel"
                placeholder="e.g. 9876543210"
                value={contact}
                onChange={(e) => setContact(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-900 placeholder:text-slate-400 font-medium text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all"
              />
            </div>

            {/* Payment Method Selector */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Payment Mode <span className="text-rose-500">*</span>
              </label>
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => setPaymentMethod(PAYMENT_METHODS.ONLINE)}
                  className={`flex items-center justify-center gap-2 py-3 px-3 rounded-xl border font-bold text-sm transition-all ${
                    paymentMethod === PAYMENT_METHODS.ONLINE
                      ? 'border-indigo-500 bg-indigo-50/80 text-indigo-700 ring-2 ring-indigo-500/20 shadow-sm'
                      : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Smartphone className="w-4 h-4 text-indigo-500" />
                  <span>Online / UPI</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod(PAYMENT_METHODS.CASH)}
                  className={`flex items-center justify-center gap-2 py-3 px-3 rounded-xl border font-bold text-sm transition-all ${
                    paymentMethod === PAYMENT_METHODS.CASH
                      ? 'border-emerald-500 bg-emerald-50/80 text-emerald-700 ring-2 ring-emerald-500/20 shadow-sm'
                      : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Banknote className="w-4 h-4 text-emerald-500" />
                  <span>Cash</span>
                </button>
              </div>
            </div>

            {/* Remarks / Custom Notes (Optional) */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-slate-400" />
                <span>Special Instructions <span className="text-slate-400 font-normal lowercase">(optional)</span></span>
              </label>
              <input
                type="text"
                placeholder="e.g. Less sugar, extra spicy, etc."
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-slate-900 placeholder:text-slate-400 font-medium text-xs focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all mb-2"
              />

              {/* Quick tags */}
              <div className="flex flex-wrap gap-1.5">
                {QUICK_NOTES.map((qn) => (
                  <button
                    key={qn}
                    type="button"
                    onClick={() => handleAddQuickNote(qn)}
                    className="text-[11px] font-medium px-2 py-1 rounded-md bg-slate-100 hover:bg-rose-100 hover:text-rose-700 text-slate-600 transition-colors"
                  >
                    + {qn}
                  </button>
                ))}
              </div>
            </div>

            {/* Live Cart Itemized Breakdown */}
            <div className="pt-2 border-t border-slate-100 space-y-2">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Current Order Summary
              </div>

              {selectedItems.length === 0 ? (
                <div className="py-4 text-center text-xs text-slate-400 font-medium bg-slate-50 rounded-xl border border-dashed border-slate-200">
                  No items selected yet. Tap items from the menu.
                </div>
              ) : (
                <div className="max-h-40 overflow-y-auto divide-y divide-slate-100 text-xs">
                  {selectedItems.map((item) => (
                    <div key={item.id} className="py-1.5 flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-rose-600">{item.quantity}x</span>
                        <span className="font-medium text-slate-800">{item.name}</span>
                      </div>
                      <span className="font-bold text-slate-900">
                        ₹{item.price * item.quantity}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Total & Submit Button */}
            <div className="pt-3 border-t border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-slate-600">Total Amount:</span>
                <span className="text-2xl font-black text-slate-900 tracking-tight">
                  ₹{grandTotal}
                </span>
              </div>

              <button
                type="submit"
                disabled={isSubmitting || selectedItems.length === 0 || !customerName.trim()}
                className={`w-full py-3.5 px-4 rounded-2xl font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg transition-all active:scale-[0.98] ${
                  selectedItems.length === 0 || !customerName.trim()
                    ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                    : 'bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-600 hover:to-amber-600 text-white shadow-rose-200 hover:shadow-xl'
                }`}
              >
                <Sparkles className="w-4 h-4" />
                <span>
                  {isSubmitting ? 'Placing Order...' : `Confirm & Place Order (₹${grandTotal})`}
                </span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
