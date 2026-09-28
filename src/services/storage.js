import {
  initFirebase,
  collection,
  addDoc,
  updateDoc,
  doc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy
} from './firebase';

const LOCAL_STORAGE_ORDERS_KEY = 'helcy_orders_store_v1';
const LOCAL_STORAGE_TOKEN_KEY = 'helcy_daily_token_counter_v1';

// Initial sample orders so the user can immediately see what the kitchen & history looks like
const INITIAL_DEMO_ORDERS = [
  {
    id: 'demo-101',
    tokenNumber: 101,
    customerName: 'Aarav Sharma',
    contact: '9876543210',
    items: [
      { id: 'strawberry-boba', name: 'Strawberry Boba', quantity: 2, price: 150 },
      { id: 'steamed-momos', name: 'Steamed Momos', quantity: 1, price: 120 },
    ],
    totalAmount: 420,
    paymentMethod: 'Online',
    remarks: 'Less sweet boba, extra spicy momo chutney',
    status: 'preparing', // active on kitchen screen
    createdAt: new Date(Date.now() - 6 * 60 * 1000).toISOString(),
    completedAt: null,
  },
  {
    id: 'demo-102',
    tokenNumber: 102,
    customerName: 'Ananya Roy',
    contact: '9812345678',
    items: [
      { id: 'green-apple-boba', name: 'Green Apple Boba', quantity: 1, price: 150 },
      { id: 'blueberry-boba', name: 'Blueberry Boba', quantity: 1, price: 150 },
    ],
    totalAmount: 300,
    paymentMethod: 'Cash',
    remarks: 'Extra ice please',
    status: 'ready', // ready for pickup
    createdAt: new Date(Date.now() - 14 * 60 * 1000).toISOString(),
    completedAt: null,
  },
  {
    id: 'demo-100',
    tokenNumber: 100,
    customerName: 'Vikram Mehta',
    contact: '',
    items: [
      { id: 'orange-boba', name: 'Orange Boba', quantity: 1, price: 150 },
      { id: 'steamed-momos', name: 'Steamed Momos', quantity: 2, price: 120 },
    ],
    totalAmount: 390,
    paymentMethod: 'Online',
    remarks: '',
    status: 'completed',
    createdAt: new Date(Date.now() - 35 * 60 * 1000).toISOString(),
    completedAt: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
  }
];

export function getLocalOrders() {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_ORDERS_KEY);
    if (!raw) {
      localStorage.setItem(LOCAL_STORAGE_ORDERS_KEY, JSON.stringify(INITIAL_DEMO_ORDERS));
      return INITIAL_DEMO_ORDERS;
    }
    return JSON.parse(raw);
  } catch (err) {
    console.error('Failed to read local orders:', err);
    return [];
  }
}

export function saveLocalOrders(orders) {
  try {
    localStorage.setItem(LOCAL_STORAGE_ORDERS_KEY, JSON.stringify(orders));
    window.dispatchEvent(new Event('helcy_orders_updated'));
  } catch (err) {
    console.error('Failed to save local orders:', err);
  }
}

export function getNextTokenNumber() {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_TOKEN_KEY);
    const lastNum = raw ? parseInt(raw, 10) : 102;
    const nextNum = lastNum + 1;
    localStorage.setItem(LOCAL_STORAGE_TOKEN_KEY, nextNum.toString());
    return nextNum;
  } catch {
    return Math.floor(100 + Math.random() * 900);
  }
}

export function resetAllOrders() {
  localStorage.setItem(LOCAL_STORAGE_ORDERS_KEY, JSON.stringify([]));
  localStorage.setItem(LOCAL_STORAGE_TOKEN_KEY, '100');
  window.dispatchEvent(new Event('helcy_orders_updated'));
}

export function exportOrdersToCSV(orders) {
  const headers = [
    'Token #',
    'Order ID',
    'Date & Time',
    'Customer Name',
    'Contact',
    'Items Ordered',
    'Total Boba Units',
    'Total Momo Units',
    'Payment Method',
    'Total Amount (Rs)',
    'Status',
    'Remarks'
  ];

  const rows = orders.map(order => {
    const formattedDate = new Date(order.createdAt).toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata',
      dateStyle: 'medium',
      timeStyle: 'short'
    });

    const itemsSummary = order.items
      .map(item => `${item.quantity}x ${item.name} (Rs. ${item.price * item.quantity})`)
      .join('; ');

    const bobaCount = order.items
      .filter(i => i.id.includes('boba'))
      .reduce((sum, i) => sum + i.quantity, 0);

    const momoCount = order.items
      .filter(i => i.id.includes('momo'))
      .reduce((sum, i) => sum + i.quantity, 0);

    const escapeCSV = (str) => `"${String(str || '').replace(/"/g, '""')}"`;

    return [
      `#${order.tokenNumber || ''}`,
      order.id,
      escapeCSV(formattedDate),
      escapeCSV(order.customerName || 'Walk-in'),
      escapeCSV(order.contact || ''),
      escapeCSV(itemsSummary),
      bobaCount,
      momoCount,
      order.paymentMethod,
      order.totalAmount,
      order.status,
      escapeCSV(order.remarks || '')
    ].join(',');
  });

  const csvContent = [headers.join(','), ...rows].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `helcy_stall_sales_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
