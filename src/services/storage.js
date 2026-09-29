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

const LOCAL_STORAGE_ORDERS_KEY = 'helcy_orders_store_v2';
const LOCAL_STORAGE_TOKEN_KEY = 'helcy_daily_token_counter_v2';

export function getLocalOrders() {
  try {
    // Clean up legacy v1 key if it had demo orders
    if (localStorage.getItem('helcy_orders_store_v1')) {
      localStorage.removeItem('helcy_orders_store_v1');
      localStorage.removeItem('helcy_daily_token_counter_v1');
    }

    const raw = localStorage.getItem(LOCAL_STORAGE_ORDERS_KEY);
    if (!raw) {
      localStorage.setItem(LOCAL_STORAGE_ORDERS_KEY, JSON.stringify([]));
      return [];
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter(o => !o.id?.startsWith('demo-')) : [];
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
    const lastNum = raw ? parseInt(raw, 10) : 100;
    const nextNum = lastNum + 1;
    localStorage.setItem(LOCAL_STORAGE_TOKEN_KEY, nextNum.toString());
    return nextNum;
  } catch {
    return 101;
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
