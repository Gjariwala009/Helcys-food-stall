import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  getLocalOrders,
  saveLocalOrders,
  getNextTokenNumber,
  resetAllOrders as clearLocalStorageOrders
} from '../services/storage';
import {
  initFirebase,
  resetFirebaseApp,
  getSavedFirebaseConfig,
  saveFirebaseConfig,
  collection,
  addDoc,
  updateDoc,
  doc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy
} from '../services/firebase';

export const OrdersContext = createContext(null);

export function OrdersProvider({ children }) {
  const [orders, setOrders] = useState(() => getLocalOrders());
  const [isFirebaseEnabled, setIsFirebaseEnabled] = useState(false);
  const [firebaseError, setFirebaseError] = useState(null);
  const [firestoreDb, setFirestoreDb] = useState(null);
  const [syncStatus, setSyncStatus] = useState('offline'); // 'synced' | 'connecting' | 'offline' | 'error'

  // Initialize Firebase if config exists
  useEffect(() => {
    const config = getSavedFirebaseConfig();
    if (config) {
      setSyncStatus('connecting');
      const { isConfigured, db, error } = initFirebase(config);
      if (isConfigured && db) {
        setIsFirebaseEnabled(true);
        setFirestoreDb(db);
        setFirebaseError(null);
      } else {
        setIsFirebaseEnabled(false);
        setFirebaseError(error || 'Failed to initialize Firebase');
        setSyncStatus('error');
      }
    } else {
      setIsFirebaseEnabled(false);
      setSyncStatus('offline');
    }
  }, []);

  // Listen to Firestore updates if enabled, else listen to local storage events
  useEffect(() => {
    if (isFirebaseEnabled && firestoreDb) {
      setSyncStatus('connecting');
      try {
        const q = query(collection(firestoreDb, 'orders'), orderBy('createdAt', 'desc'));
        const unsubscribe = onSnapshot(
          q,
          (snapshot) => {
            const fetched = snapshot.docs.map((docSnap) => ({
              id: docSnap.id,
              ...docSnap.data(),
            }));
            setOrders(fetched);
            // backup to local storage
            saveLocalOrders(fetched);
            setSyncStatus('synced');
          },
          (err) => {
            console.error('Firestore snapshot error:', err);
            setFirebaseError(err.message);
            setSyncStatus('error');
          }
        );
        return () => unsubscribe();
      } catch (err) {
        console.error('Failed to set up Firestore listener:', err);
        setFirebaseError(err.message);
        setSyncStatus('error');
      }
    } else {
      // Offline / Local storage mode
      const handleLocalUpdate = () => {
        setOrders(getLocalOrders());
      };
      window.addEventListener('helcy_orders_updated', handleLocalUpdate);
      window.addEventListener('storage', handleLocalUpdate);
      return () => {
        window.removeEventListener('helcy_orders_updated', handleLocalUpdate);
        window.removeEventListener('storage', handleLocalUpdate);
      };
    }
  }, [isFirebaseEnabled, firestoreDb]);

  // Create new order
  const createOrder = async (orderPayload) => {
    // Determine token: highest token in existing orders + 1, or local storage counter
    const highestExistingToken = orders.reduce(
      (max, o) => Math.max(max, Number(o.tokenNumber) || 0),
      100
    );
    const tokenNumber = Math.max(highestExistingToken + 1, getNextTokenNumber());

    const newOrder = {
      ...orderPayload,
      tokenNumber,
      status: 'preparing',
      createdAt: new Date().toISOString(),
      completedAt: null,
    };

    if (isFirebaseEnabled && firestoreDb) {
      try {
        const docRef = await addDoc(collection(firestoreDb, 'orders'), newOrder);
        return { success: true, order: { ...newOrder, id: docRef.id } };
      } catch (err) {
        console.error('Failed to add order to Firestore, falling back to local:', err);
        // Fallback to local
        const localOrder = { ...newOrder, id: 'local-' + Date.now() };
        const updated = [localOrder, ...orders];
        setOrders(updated);
        saveLocalOrders(updated);
        return { success: true, order: localOrder };
      }
    } else {
      const localOrder = { ...newOrder, id: 'local-' + Date.now() };
      const updated = [localOrder, ...orders];
      setOrders(updated);
      saveLocalOrders(updated);
      return { success: true, order: localOrder };
    }
  };

  // Update order status (preparing -> ready -> completed / cancelled)
  const updateStatus = async (orderId, newStatus) => {
    const completedAt = newStatus === 'completed' ? new Date().toISOString() : null;

    if (isFirebaseEnabled && firestoreDb) {
      try {
        await updateDoc(doc(firestoreDb, 'orders', orderId), {
          status: newStatus,
          ...(completedAt ? { completedAt } : {}),
          updatedAt: new Date().toISOString()
        });
      } catch (err) {
        console.error('Firestore update status failed, updating locally:', err);
      }
    }

    // Always update local state immediately for responsive feel
    const updated = orders.map((ord) => {
      if (ord.id === orderId) {
        return {
          ...ord,
          status: newStatus,
          ...(completedAt ? { completedAt } : {}),
        };
      }
      return ord;
    });
    setOrders(updated);
    saveLocalOrders(updated);
  };

  // Delete an order
  const removeOrder = async (orderId) => {
    if (isFirebaseEnabled && firestoreDb) {
      try {
        await deleteDoc(doc(firestoreDb, 'orders', orderId));
      } catch (err) {
        console.error('Firestore delete failed:', err);
      }
    }
    const updated = orders.filter((o) => o.id !== orderId);
    setOrders(updated);
    saveLocalOrders(updated);
  };

  // Reconfigure Firebase
  const applyFirebaseConfig = async (config) => {
    if (!config) {
      await resetFirebaseApp();
      saveFirebaseConfig(null);
      setIsFirebaseEnabled(false);
      setFirestoreDb(null);
      setSyncStatus('offline');
      return { success: true };
    }
    try {
      await resetFirebaseApp();
      const { isConfigured, db, error } = initFirebase(config);
      if (isConfigured && db) {
        saveFirebaseConfig(config);
        setIsFirebaseEnabled(true);
        setFirestoreDb(db);
        setFirebaseError(null);
        setSyncStatus('synced');
        return { success: true };
      } else {
        setFirebaseError(error || 'Configuration is invalid');
        setSyncStatus('error');
        return { success: false, error: error || 'Failed to initialize' };
      }
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  const clearAllData = async () => {
    if (isFirebaseEnabled && firestoreDb) {
      try {
        const deletePromises = orders.map((o) => deleteDoc(doc(firestoreDb, 'orders', o.id)));
        await Promise.all(deletePromises);
      } catch (err) {
        console.error('Failed to clear Firestore collection:', err);
      }
    }
    clearLocalStorageOrders();
    setOrders([]);
  };

  return (
    <OrdersContext.Provider
      value={{
        orders,
        createOrder,
        updateStatus,
        removeOrder,
        clearAllData,
        isFirebaseEnabled,
        syncStatus,
        firebaseError,
        applyFirebaseConfig,
      }}
    >
      {children}
    </OrdersContext.Provider>
  );
}

export { useOrders } from './useOrders';
