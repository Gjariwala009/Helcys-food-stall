import React from 'react';
import { X, Printer, CheckCircle, Smartphone, Banknote } from 'lucide-react';

export default function ReceiptModal({ order, onClose }) {
  if (!order) return null;

  const handlePrint = () => {
    window.print();
  };

  const formattedDate = new Date(order.createdAt).toLocaleString('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-sm w-full shadow-2xl overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-200">
        {/* Header Bar */}
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">🧋</span>
            <div>
              <h3 className="font-extrabold text-sm leading-tight">Order Receipt</h3>
              <p className="text-[10px] text-slate-400">Helcy's Boba & Momos</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Printable Receipt Body */}
        <div className="p-6 space-y-4 text-xs font-mono text-slate-700 receipt-print-area">
          <div className="text-center border-b border-dashed border-slate-300 pb-3">
            <div className="text-2xl font-black font-sans text-slate-900">
              #{order.tokenNumber}
            </div>
            <div className="text-[11px] text-slate-500 font-sans mt-0.5">
              Token Number
            </div>
            <div className="mt-2 text-[11px] text-slate-600 font-sans font-semibold">
              Customer: {order.customerName}
            </div>
            {order.contact && (
              <div className="text-[10px] text-slate-400 font-sans">
                Contact: {order.contact}
              </div>
            )}
            <div className="text-[10px] text-slate-400 mt-1 font-sans">
              {formattedDate}
            </div>
          </div>

          {/* Items breakdown */}
          <div className="space-y-1.5 border-b border-dashed border-slate-300 pb-3">
            <div className="flex justify-between font-bold text-slate-900 uppercase text-[10px]">
              <span>Item & Qty</span>
              <span>Amount</span>
            </div>
            {order.items.map((item, idx) => (
              <div key={idx} className="flex justify-between text-slate-800">
                <span>
                  {item.quantity}x {item.name}
                </span>
                <span>₹{item.price * item.quantity}</span>
              </div>
            ))}
          </div>

          {/* Total & Payment */}
          <div className="space-y-1 border-b border-dashed border-slate-300 pb-3 font-sans">
            <div className="flex justify-between items-center text-sm font-black text-slate-900">
              <span>Grand Total:</span>
              <span className="text-base text-rose-600">₹{order.totalAmount}</span>
            </div>
            <div className="flex justify-between text-xs text-slate-600 font-medium">
              <span>Payment Mode:</span>
              <span className="font-bold flex items-center gap-1">
                {order.paymentMethod === 'Online' ? (
                  <Smartphone className="w-3 h-3 text-indigo-600" />
                ) : (
                  <Banknote className="w-3 h-3 text-emerald-600" />
                )}
                {order.paymentMethod} (PAID)
              </span>
            </div>
            {order.remarks && (
              <div className="text-[11px] text-amber-700 bg-amber-50 p-1.5 rounded mt-2">
                <strong>Note:</strong> {order.remarks}
              </div>
            )}
          </div>

          <div className="text-center text-[10px] text-slate-400 pt-1 font-sans">
            Thank you for visiting Helcy's Stall! ❤️
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center gap-2">
          <button
            onClick={handlePrint}
            className="flex-1 py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center justify-center gap-2 transition-colors"
          >
            <Printer className="w-4 h-4" />
            <span>Print Receipt</span>
          </button>
          <button
            onClick={onClose}
            className="py-2.5 px-4 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 font-bold text-xs transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
