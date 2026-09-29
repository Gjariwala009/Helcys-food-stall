import { useContext } from 'react';
import { OrdersContext } from './OrdersContext';

export function useOrders() {
  const ctx = useContext(OrdersContext);
  if (!ctx) {
    throw new Error('useOrders must be used inside an OrdersProvider');
  }
  return ctx;
}
