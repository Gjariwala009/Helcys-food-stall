import React, { useState } from 'react';
import { OrdersProvider } from './context/OrdersContext';
import Navbar from './components/Navbar';
import NewOrderView from './components/NewOrderView';
import LiveOrdersView from './components/LiveOrdersView';
import PastOrdersView from './components/PastOrdersView';
import SettingsModal from './components/SettingsModal';
import ReceiptModal from './components/ReceiptModal';

function AppContent() {
  const [activeTab, setActiveTab] = useState('new-order'); // 'new-order' | 'live-orders' | 'past-orders'
  const [selectedReceiptOrder, setSelectedReceiptOrder] = useState(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-b from-rose-50/40 via-slate-50 to-slate-100 flex flex-col">
      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />

      {/* Main Views */}
      <main className="flex-1 pb-16">
        {activeTab === 'new-order' && (
          <NewOrderView
            onOrderPlacedSuccess={() => {
              // Option to stay on order taker for rapid order entry
            }}
          />
        )}

        {activeTab === 'live-orders' && (
          <LiveOrdersView
            onSwitchToNewOrder={() => setActiveTab('new-order')}
          />
        )}

        {activeTab === 'past-orders' && (
          <PastOrdersView
            onOpenReceipt={(order) => setSelectedReceiptOrder(order)}
          />
        )}
      </main>

      {/* Receipt Modal */}
      {selectedReceiptOrder && (
        <ReceiptModal
          order={selectedReceiptOrder}
          onClose={() => setSelectedReceiptOrder(null)}
        />
      )}

      {/* Settings & Firebase Cloud Sync Modal */}
      {isSettingsOpen && (
        <SettingsModal onClose={() => setIsSettingsOpen(false)} />
      )}

      {/* Footer */}
      <footer className="border-t border-slate-200/60 bg-white/60 py-4 text-center text-xs text-slate-400">
        <p>
          MoBa Stall (Momo + Boba) • College Event Order Management System • Made with 🥟 & 🧋
        </p>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <OrdersProvider>
      <AppContent />
    </OrdersProvider>
  );
}
