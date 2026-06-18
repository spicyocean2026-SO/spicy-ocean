"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { toast } from 'sonner';

export interface MenuItem {
  id: string;
  name: string;
  price: number;
  category: string;
  image?: string;
}

export interface OrderItem {
  menuItem: MenuItem;
  quantity: number;
  status: 'added' | 'cooking' | 'ready' | 'completed';
}

export interface TableOrder {
  tableNumber: number;
  items: OrderItem[];
  paymentStatus: 'pending' | 'paid';
  createdAt: Date;
  type: 'DINE_IN' | 'TAKE_AWAY' | 'TEA_SNACKS';
  orderId?: string;
}

export interface OrderHistoryEntry {
  orderId: string;
  type: 'DINE_IN' | 'TAKE_AWAY' | 'TEA_SNACKS';
  items: { name: string; quantity: number; price: number }[];
  total: number;
  timestamp: string;
  tableNumber?: number;
}

export interface RestaurantSettings {
  taxPercent: number;
  gstNumber: string;
  soundEnabled: boolean;
}

interface RestaurantContextType {
  menuItems: MenuItem[];
  addMenuItem: (item: Omit<MenuItem, 'id'>) => void;
  updateMenuItem: (id: string, updates: Partial<Omit<MenuItem, 'id'>>) => void;
  deleteMenuItem: (id: string) => void;
  tables: number[];
  orders: Record<string, TableOrder>;
  addItemToTable: (tableNumber: number, item: MenuItem) => void;
  removeItemFromTable: (tableKey: string, itemId: string) => void;
  updateItemQuantity: (tableKey: string, itemId: string, quantity: number) => void;
  updateItemStatus: (tableKey: string, itemId: string, status: OrderItem['status']) => void;
  clearTable: (tableKey: string) => void;
  markTablePaid: (tableKey: string) => void;
  getActiveOrders: () => TableOrder[];
  isCounterAuthenticated: boolean;
  authenticateCounter: (pin: string) => boolean;
  logoutCounter: () => void;
  changePin: (currentPin: string, newPin: string) => boolean;
  // Take Away
  takeAwayOrders: Record<string, TableOrder>;
  createTakeAwayOrder: () => string;
  addItemToTakeAway: (orderId: string, item: MenuItem) => void;
  removeItemFromTakeAway: (orderId: string, itemId: string) => void;
  updateTakeAwayItemQuantity: (orderId: string, itemId: string, quantity: number) => void;
  // Tea & Snacks
  teaSnacksItems: MenuItem[];
  teaSnacksOrders: Record<string, TableOrder>;
  createTeaSnacksOrder: () => string;
  addItemToTeaSnacks: (orderId: string, item: MenuItem) => void;
  removeItemFromTeaSnacks: (orderId: string, itemId: string) => void;
  updateTeaSnacksItemQuantity: (orderId: string, itemId: string, quantity: number) => void;
  // Settings
  settings: RestaurantSettings;
  updateSettings: (s: Partial<RestaurantSettings>) => void;
  // Sounds
  playOrderSound: () => void;
  playReadySound: () => void;
  // Invoice
  nextInvoiceNumber: number;
  getNextInvoice: () => string;
  // Order history
  orderHistory: OrderHistoryEntry[];
  addToHistory: (entry: OrderHistoryEntry) => void;
}

const defaultMenuItems: MenuItem[] = [
  { id: '1', name: 'Tomato Soup', price: 120, category: 'Soups' },
  { id: '2', name: 'Sweet Corn Soup', price: 130, category: 'Soups' },
  { id: '3', name: 'Manchow Soup', price: 140, category: 'Soups' },
  { id: '4', name: 'Hot & Sour Soup', price: 130, category: 'Soups' },
  { id: '5', name: 'Paneer Tikka', price: 220, category: 'Starters' },
  { id: '6', name: 'Chicken 65', price: 250, category: 'Starters' },
  { id: '7', name: 'Gobi Manchurian', price: 180, category: 'Starters' },
  { id: '8', name: 'Fish Fry', price: 280, category: 'Starters' },
  { id: '9', name: 'Prawns Fry', price: 320, category: 'Starters' },
  { id: '10', name: 'Chicken Dum Biriyani', price: 280, category: 'Biriyani' },
  { id: '11', name: 'Mutton Biriyani', price: 350, category: 'Biriyani' },
  { id: '12', name: 'Prawns Biriyani', price: 380, category: 'Biriyani' },
  { id: '13', name: 'Veg Biriyani', price: 200, category: 'Biriyani' },
  { id: '14', name: 'Egg Biriyani', price: 220, category: 'Biriyani' },
  { id: '15', name: 'Mango Lassi', price: 100, category: 'Cocktails' },
  { id: '16', name: 'Blue Lagoon', price: 150, category: 'Cocktails' },
  { id: '17', name: 'Mojito', price: 140, category: 'Cocktails' },
  { id: '18', name: 'Watermelon Cooler', price: 120, category: 'Cocktails' },
];

const defaultTeaSnacksItems: MenuItem[] = [
  { id: 'ts1', name: 'Special Tea', price: 30, category: 'Tea' },
  { id: 'ts2', name: 'Ginger Tea', price: 35, category: 'Tea' },
  { id: 'ts3', name: 'Lemon Tea', price: 35, category: 'Tea' },
  { id: 'ts4', name: 'Coffee', price: 40, category: 'Tea' },
  { id: 'ts5', name: 'Milk', price: 25, category: 'Tea' },
  { id: 'ts6', name: 'Samosa', price: 20, category: 'Veg Snacks' },
  { id: 'ts7', name: 'Corn Samosa', price: 25, category: 'Veg Snacks' },
  { id: 'ts8', name: 'Veg Rolls', price: 40, category: 'Veg Snacks' },
  { id: 'ts9', name: 'French Fries', price: 80, category: 'Veg Snacks' },
  { id: 'ts10', name: 'Chicken Popcorn', price: 120, category: 'Non-Veg Snacks' },
  { id: 'ts11', name: 'Chicken Nuggets', price: 130, category: 'Non-Veg Snacks' },
  { id: 'ts12', name: 'Chicken Rolls', price: 100, category: 'Non-Veg Snacks' },
];

const generateOrderId = (prefix: string, counter: number) => {
  const d = new Date();
  const dateStr = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
  return `${prefix}-${dateStr}-${String(counter).padStart(3, '0')}`;
};

const RestaurantContext = createContext<RestaurantContextType | undefined>(undefined);

export const RestaurantProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [menuItems, setMenuItems] = useState<MenuItem[]>(() => {
    const saved = localStorage.getItem('kadali_menu');
    return saved ? JSON.parse(saved) : defaultMenuItems;
  });

  const [orders, setOrders] = useState<Record<string, TableOrder>>(() => {
    const saved = localStorage.getItem('kadali_orders');
    return saved ? JSON.parse(saved) : {};
  });

  const [takeAwayOrders, setTakeAwayOrders] = useState<Record<string, TableOrder>>(() => {
    const saved = localStorage.getItem('kadali_takeaway');
    return saved ? JSON.parse(saved) : {};
  });

  const [teaSnacksOrders, setTeaSnacksOrders] = useState<Record<string, TableOrder>>(() => {
    const saved = localStorage.getItem('kadali_teasnacks');
    return saved ? JSON.parse(saved) : {};
  });

  const [takeAwayCounter, setTakeAwayCounter] = useState(() => {
    const saved = localStorage.getItem('kadali_ta_counter');
    return saved ? parseInt(saved) : 0;
  });

  const [teaSnacksCounter, setTeaSnacksCounter] = useState(() => {
    const saved = localStorage.getItem('kadali_ts_counter');
    return saved ? parseInt(saved) : 0;
  });

  const [nextInvoiceNumber, setNextInvoiceNumber] = useState(() => {
    const saved = localStorage.getItem('kadali_invoice');
    return saved ? parseInt(saved) : 1;
  });

  const [settings, setSettings] = useState<RestaurantSettings>(() => {
    const saved = localStorage.getItem('kadali_settings');
    return saved ? JSON.parse(saved) : { taxPercent: 5, gstNumber: '', soundEnabled: true };
  });

  const [counterPin, setCounterPin] = useState(() => {
    return localStorage.getItem('kadali_pin') || '1234';
  });

  const [isCounterAuthenticated, setIsCounterAuthenticated] = useState(() => {
    return sessionStorage.getItem('kadali_counter_auth') === 'true';
  });

  const [orderHistory, setOrderHistory] = useState<OrderHistoryEntry[]>(() => {
    const saved = localStorage.getItem('kadali_history');
    return saved ? JSON.parse(saved) : [];
  });

  const tables = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

  // Persistence
  useEffect(() => { localStorage.setItem('kadali_menu', JSON.stringify(menuItems)); }, [menuItems]);
  useEffect(() => { localStorage.setItem('kadali_orders', JSON.stringify(orders)); }, [orders]);
  useEffect(() => { localStorage.setItem('kadali_takeaway', JSON.stringify(takeAwayOrders)); }, [takeAwayOrders]);
  useEffect(() => { localStorage.setItem('kadali_teasnacks', JSON.stringify(teaSnacksOrders)); }, [teaSnacksOrders]);
  useEffect(() => { localStorage.setItem('kadali_ta_counter', takeAwayCounter.toString()); }, [takeAwayCounter]);
  useEffect(() => { localStorage.setItem('kadali_ts_counter', teaSnacksCounter.toString()); }, [teaSnacksCounter]);
  useEffect(() => { localStorage.setItem('kadali_invoice', nextInvoiceNumber.toString()); }, [nextInvoiceNumber]);
  useEffect(() => { localStorage.setItem('kadali_settings', JSON.stringify(settings)); }, [settings]);
  useEffect(() => { localStorage.setItem('kadali_pin', counterPin); }, [counterPin]);
  useEffect(() => { localStorage.setItem('kadali_history', JSON.stringify(orderHistory)); }, [orderHistory]);

  // Daily auto-reset: clear active orders at midnight
  useEffect(() => {
    const checkDayChange = () => {
      const lastDate = localStorage.getItem('kadali_last_active_date');
      const today = new Date().toDateString();
      if (lastDate && lastDate !== today) {
        // Day changed — clear all active orders and counters
        setOrders({});
        setTakeAwayOrders({});
        setTeaSnacksOrders({});
        setTakeAwayCounter(0);
        setTeaSnacksCounter(0);
        setNextInvoiceNumber(1);
        toast.info('New day started — active orders have been reset.');
      }
      localStorage.setItem('kadali_last_active_date', today);
    };

    checkDayChange();
    const interval = setInterval(checkDayChange, 60000); // check every minute
    return () => clearInterval(interval);
  }, []);

  const playOrderSound = useCallback(() => {
    if (!settings.soundEnabled) return;
    try {
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.frequency.value = 830; osc.type = 'sine'; gain.gain.value = 0.3;
      osc.start();
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
      osc.stop(ctx.currentTime + 0.3);
      setTimeout(() => {
        const o2 = ctx.createOscillator(); const g2 = ctx.createGain();
        o2.connect(g2); g2.connect(ctx.destination);
        o2.frequency.value = 1100; o2.type = 'sine'; g2.gain.value = 0.3;
        o2.start();
        g2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
        o2.stop(ctx.currentTime + 0.6);
      }, 150);
    } catch {}
  }, [settings.soundEnabled]);

  const playReadySound = useCallback(() => {
    if (!settings.soundEnabled) return;
    try {
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.frequency.value = 587; osc.type = 'triangle'; gain.gain.value = 0.3;
      osc.start();
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
      osc.stop(ctx.currentTime + 0.5);
      setTimeout(() => {
        const o2 = ctx.createOscillator(); const g2 = ctx.createGain();
        o2.connect(g2); g2.connect(ctx.destination);
        o2.frequency.value = 784; o2.type = 'triangle'; g2.gain.value = 0.3;
        o2.start();
        g2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);
        o2.stop(ctx.currentTime + 0.8);
      }, 200);
    } catch {}
  }, [settings.soundEnabled]);

  const addMenuItem = (item: Omit<MenuItem, 'id'>) => {
    const newItem = { ...item, id: Date.now().toString() };
    setMenuItems(prev => [...prev, newItem]);
    toast.success(`${item.name} added to menu!`);
  };

  const updateMenuItem = (id: string, updates: Partial<Omit<MenuItem, 'id'>>) => {
    setMenuItems(prev => prev.map(m => m.id === id ? { ...m, ...updates } : m));
    toast.success('Item updated');
  };

  const deleteMenuItem = (id: string) => {
    setMenuItems(prev => prev.filter(m => m.id !== id));
    toast.success('Item removed');
  };

  const addToHistory = (entry: OrderHistoryEntry) => {
    setOrderHistory(prev => [entry, ...prev]);
  };

  // Generic order helpers
  const getSetterForKey = (key: string) => {
    if (key.startsWith('TAKE-')) return setTakeAwayOrders;
    if (key.startsWith('TS-')) return setTeaSnacksOrders;
    return setOrders;
  };

  const addItemToTable = (tableNumber: number, item: MenuItem) => {
    const key = `table_${tableNumber}`;
    setOrders(prev => {
      const existing = prev[key];
      if (existing) {
        const existingItem = existing.items.find(i => i.menuItem.id === item.id);
        if (existingItem) {
          return { ...prev, [key]: { ...existing, items: existing.items.map(i => i.menuItem.id === item.id ? { ...i, quantity: i.quantity + 1 } : i) } };
        }
        return { ...prev, [key]: { ...existing, items: [...existing.items, { menuItem: item, quantity: 1, status: 'added' }] } };
      }
      return { ...prev, [key]: { tableNumber, items: [{ menuItem: item, quantity: 1, status: 'added' }], paymentStatus: 'pending', createdAt: new Date(), type: 'DINE_IN' } };
    });
    playOrderSound();
    toast.success(`${item.name} added to Table ${tableNumber}`);
  };

  const removeItemFromTable = (tableKey: string, itemId: string) => {
    const setter = getSetterForKey(tableKey);
    setter(prev => {
      const existing = prev[tableKey];
      if (!existing) return prev;
      const filtered = existing.items.filter(i => i.menuItem.id !== itemId);
      if (filtered.length === 0) { const { [tableKey]: _, ...rest } = prev; return rest; }
      return { ...prev, [tableKey]: { ...existing, items: filtered } };
    });
  };

  const updateItemQuantity = (tableKey: string, itemId: string, quantity: number) => {
    if (quantity <= 0) { removeItemFromTable(tableKey, itemId); return; }
    const setter = getSetterForKey(tableKey);
    setter(prev => {
      const existing = prev[tableKey];
      if (!existing) return prev;
      return { ...prev, [tableKey]: { ...existing, items: existing.items.map(i => i.menuItem.id === itemId ? { ...i, quantity } : i) } };
    });
  };

  const updateItemStatus = (tableKey: string, itemId: string, status: OrderItem['status']) => {
    const setter = getSetterForKey(tableKey);
    setter(prev => {
      const existing = prev[tableKey];
      if (!existing) return prev;
      return { ...prev, [tableKey]: { ...existing, items: existing.items.map(i => i.menuItem.id === itemId ? { ...i, status } : i) } };
    });
    if (status === 'ready' || status === 'completed') {
      playReadySound();
      toast.success(`Order is ${status}!`, { description: tableKey.startsWith('TAKE-') ? tableKey : tableKey.startsWith('TS-') ? tableKey : `Table ${tableKey.replace('table_', '')}` });
    }
  };

  const clearTable = (tableKey: string) => {
    const setter = getSetterForKey(tableKey);
    // Save to history before clearing
    const allOrderSources = { ...orders, ...takeAwayOrders, ...teaSnacksOrders };
    const order = allOrderSources[tableKey];
    if (order && order.items.length > 0) {
      const total = order.items.reduce((s, i) => s + i.menuItem.price * i.quantity, 0);
      addToHistory({
        orderId: order.orderId || tableKey,
        type: order.type,
        items: order.items.map(i => ({ name: i.menuItem.name, quantity: i.quantity, price: i.menuItem.price })),
        total,
        timestamp: new Date().toISOString(),
        tableNumber: order.tableNumber || undefined,
      });
    }
    setter(prev => { const { [tableKey]: _, ...rest } = prev; return rest; });
  };

  const markTablePaid = (tableKey: string) => {
    const setter = getSetterForKey(tableKey);
    setter(prev => {
      const existing = prev[tableKey];
      if (!existing) return prev;
      return { ...prev, [tableKey]: { ...existing, paymentStatus: 'paid' } };
    });
    toast.success('Payment received!');
  };

  const getActiveOrders = () => {
    return [...Object.values(orders), ...Object.values(takeAwayOrders), ...Object.values(teaSnacksOrders)].filter(o => o.items.length > 0);
  };

  // Take Away
  const createTakeAwayOrder = () => {
    const num = takeAwayCounter + 1;
    setTakeAwayCounter(num);
    const orderId = generateOrderId('TAKE', num);
    setTakeAwayOrders(prev => ({
      ...prev,
      [orderId]: { tableNumber: 0, orderId, items: [], paymentStatus: 'pending', createdAt: new Date(), type: 'TAKE_AWAY' },
    }));
    return orderId;
  };

  const addItemToTakeAway = (orderId: string, item: MenuItem) => {
    setTakeAwayOrders(prev => {
      const existing = prev[orderId];
      if (!existing) return prev;
      const existingItem = existing.items.find(i => i.menuItem.id === item.id);
      if (existingItem) {
        return { ...prev, [orderId]: { ...existing, items: existing.items.map(i => i.menuItem.id === item.id ? { ...i, quantity: i.quantity + 1 } : i) } };
      }
      return { ...prev, [orderId]: { ...existing, items: [...existing.items, { menuItem: item, quantity: 1, status: 'added' }] } };
    });
    playOrderSound();
    toast.success(`${item.name} added to ${orderId}`);
  };

  const removeItemFromTakeAway = (orderId: string, itemId: string) => removeItemFromTable(orderId, itemId);
  const updateTakeAwayItemQuantity = (orderId: string, itemId: string, quantity: number) => updateItemQuantity(orderId, itemId, quantity);

  // Tea & Snacks
  const createTeaSnacksOrder = () => {
    const num = teaSnacksCounter + 1;
    setTeaSnacksCounter(num);
    const orderId = generateOrderId('TS', num);
    setTeaSnacksOrders(prev => ({
      ...prev,
      [orderId]: { tableNumber: 0, orderId, items: [], paymentStatus: 'pending', createdAt: new Date(), type: 'TEA_SNACKS' },
    }));
    return orderId;
  };

  const addItemToTeaSnacks = (orderId: string, item: MenuItem) => {
    setTeaSnacksOrders(prev => {
      const existing = prev[orderId];
      if (!existing) return prev;
      const existingItem = existing.items.find(i => i.menuItem.id === item.id);
      if (existingItem) {
        return { ...prev, [orderId]: { ...existing, items: existing.items.map(i => i.menuItem.id === item.id ? { ...i, quantity: i.quantity + 1 } : i) } };
      }
      return { ...prev, [orderId]: { ...existing, items: [...existing.items, { menuItem: item, quantity: 1, status: 'added' }] } };
    });
    playOrderSound();
    toast.success(`${item.name} added to ${orderId}`);
  };

  const removeItemFromTeaSnacks = (orderId: string, itemId: string) => removeItemFromTable(orderId, itemId);
  const updateTeaSnacksItemQuantity = (orderId: string, itemId: string, quantity: number) => updateItemQuantity(orderId, itemId, quantity);

  // Auth
  const authenticateCounter = (pin: string) => {
    if (pin === counterPin) {
      setIsCounterAuthenticated(true);
      sessionStorage.setItem('kadali_counter_auth', 'true');
      toast.success('Welcome, Admin!');
      return true;
    }
    toast.error('Invalid PIN');
    return false;
  };

  const logoutCounter = () => {
    setIsCounterAuthenticated(false);
    sessionStorage.removeItem('kadali_counter_auth');
  };

  const changePin = (currentPin: string, newPin: string) => {
    if (currentPin !== counterPin) {
      toast.error('Current PIN is incorrect');
      return false;
    }
    if (newPin.length !== 4 || !/^\d{4}$/.test(newPin)) {
      toast.error('PIN must be 4 digits');
      return false;
    }
    setCounterPin(newPin);
    toast.success('PIN changed successfully!');
    return true;
  };

  const updateSettings = (s: Partial<RestaurantSettings>) => {
    setSettings(prev => ({ ...prev, ...s }));
    toast.success('Settings updated!');
  };

  const getNextInvoice = () => {
    const inv = `INV-${String(nextInvoiceNumber).padStart(4, '0')}`;
    setNextInvoiceNumber(prev => prev + 1);
    return inv;
  };

  return (
    <RestaurantContext.Provider value={{
      menuItems, addMenuItem, updateMenuItem, deleteMenuItem, tables, orders,
      addItemToTable, removeItemFromTable, updateItemQuantity,
      updateItemStatus, clearTable, markTablePaid,
      getActiveOrders, isCounterAuthenticated, authenticateCounter, logoutCounter, changePin,
      takeAwayOrders, createTakeAwayOrder, addItemToTakeAway, removeItemFromTakeAway, updateTakeAwayItemQuantity,
      teaSnacksItems: defaultTeaSnacksItems, teaSnacksOrders, createTeaSnacksOrder, addItemToTeaSnacks, removeItemFromTeaSnacks, updateTeaSnacksItemQuantity,
      settings, updateSettings, playOrderSound, playReadySound,
      nextInvoiceNumber, getNextInvoice,
      orderHistory, addToHistory,
    }}>
      {children}
    </RestaurantContext.Provider>
  );
};

export const useRestaurant = () => {
  const ctx = useContext(RestaurantContext);
  if (!ctx) throw new Error('useRestaurant must be used within RestaurantProvider');
  return ctx;
};
