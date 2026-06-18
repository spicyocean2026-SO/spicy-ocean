"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from 'react';
import { toast } from 'sonner';

export interface MenuItem {
  id: string;
  name: string;
  price: number;
  category: string;
  kind?: 'FOOD' | 'TEA_SNACKS';
  image?: string;
}

export interface OrderItem {
  menuItem: MenuItem;
  quantity: number;
  status: 'added' | 'cooking' | 'ready' | 'completed';
}

export interface TableOrder {
  orderId?: string;
  orderNo?: string;
  tableNumber: number;
  items: OrderItem[];
  paymentStatus: 'pending' | 'paid';
  createdAt: string | Date;
  type: 'DINE_IN' | 'TAKE_AWAY' | 'TEA_SNACKS';
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

export interface CartLine {
  menuItem: MenuItem;
  quantity: number;
}

interface RestaurantContextType {
  // Menu
  menuItems: MenuItem[];
  teaSnacksItems: MenuItem[];
  menuLoading: boolean;
  addMenuItem: (item: { name: string; price: number; category: string; kind?: 'FOOD' | 'TEA_SNACKS' }) => Promise<void>;
  updateMenuItem: (id: string, updates: Partial<Pick<MenuItem, 'name' | 'price' | 'category'>>) => Promise<void>;
  deleteMenuItem: (id: string) => Promise<void>;

  tables: number[];

  // Orders (live)
  activeOrders: TableOrder[];
  ordersLoading: boolean;
  getTableOrder: (tableNumber: number) => TableOrder | undefined;
  refreshOrders: () => Promise<void>;
  placeOrder: (input: { type: TableOrder['type']; tableNumber?: number; items: CartLine[] }) => Promise<TableOrder | null>;
  updateItemStatus: (orderId: string, menuItemId: string, status: OrderItem['status']) => Promise<void>;
  updateItemQuantity: (orderId: string, menuItemId: string, quantity: number) => Promise<void>;
  markPaid: (orderId: string) => Promise<void>;
  clearOrder: (order: TableOrder) => Promise<void>;

  // Counter auth
  isCounterAuthenticated: boolean;
  authenticateCounter: (pin: string) => boolean;
  logoutCounter: () => void;
  changePin: (currentPin: string, newPin: string) => boolean;

  // Settings
  settings: RestaurantSettings;
  updateSettings: (s: Partial<RestaurantSettings>) => void;

  // Sounds
  playOrderSound: () => void;
  playReadySound: () => void;

  // Invoice
  nextInvoiceNumber: number;
  getNextInvoice: () => string;

  // Order history (local)
  orderHistory: OrderHistoryEntry[];
  addToHistory: (entry: OrderHistoryEntry) => void;
}

const RestaurantContext = createContext<RestaurantContextType | undefined>(undefined);

const POLL_MS = 4000;

// Map an API order into the UI TableOrder shape.
function mapOrder(o: any): TableOrder {
  return {
    orderId: o.orderId,
    orderNo: o.orderNo,
    tableNumber: o.tableNumber,
    paymentStatus: o.paymentStatus,
    createdAt: o.createdAt,
    type: o.type,
    items: (o.items ?? []).map((i: any) => ({
      menuItem: i.menuItem,
      quantity: i.quantity,
      status: i.status,
    })),
  };
}

const isOrderReady = (o: TableOrder) =>
  o.items.length > 0 && o.items.every((i) => i.status === 'ready' || i.status === 'completed');

export const RestaurantProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [teaSnacksItems, setTeaSnacksItems] = useState<MenuItem[]>([]);
  const [menuLoading, setMenuLoading] = useState(true);

  const [activeOrders, setActiveOrders] = useState<TableOrder[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);

  const tables = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

  // ---- Local-only state (settings, auth, invoice, history) ----
  const [nextInvoiceNumber, setNextInvoiceNumber] = useState(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem('kadali_invoice') : null;
    return saved ? parseInt(saved) : 1;
  });
  const [settings, setSettings] = useState<RestaurantSettings>(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem('kadali_settings') : null;
    return saved ? JSON.parse(saved) : { taxPercent: 5, gstNumber: '', soundEnabled: true };
  });
  const [counterPin, setCounterPin] = useState(() =>
    (typeof window !== 'undefined' ? localStorage.getItem('kadali_pin') : null) || '1234'
  );
  const [isCounterAuthenticated, setIsCounterAuthenticated] = useState(() =>
    typeof window !== 'undefined' ? sessionStorage.getItem('kadali_counter_auth') === 'true' : false
  );
  const [orderHistory, setOrderHistory] = useState<OrderHistoryEntry[]>(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem('kadali_history') : null;
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => { localStorage.setItem('kadali_invoice', nextInvoiceNumber.toString()); }, [nextInvoiceNumber]);
  useEffect(() => { localStorage.setItem('kadali_settings', JSON.stringify(settings)); }, [settings]);
  useEffect(() => { localStorage.setItem('kadali_pin', counterPin); }, [counterPin]);
  useEffect(() => { localStorage.setItem('kadali_history', JSON.stringify(orderHistory)); }, [orderHistory]);

  // ---- Sounds ----
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

  // ---- Menu (from API) ----
  const refreshMenu = useCallback(async () => {
    try {
      const res = await fetch('/api/menu', { cache: 'no-store' });
      const data: MenuItem[] = await res.json();
      if (!res.ok) throw new Error((data as any)?.error || 'Failed to load menu');
      setMenuItems(data.filter((m) => m.kind !== 'TEA_SNACKS'));
      setTeaSnacksItems(data.filter((m) => m.kind === 'TEA_SNACKS'));
    } catch (e) {
      console.error(e);
    } finally {
      setMenuLoading(false);
    }
  }, []);

  useEffect(() => { refreshMenu(); }, [refreshMenu]);

  const addMenuItem = async (item: { name: string; price: number; category: string; kind?: 'FOOD' | 'TEA_SNACKS' }) => {
    const res = await fetch('/api/menu', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ kind: 'FOOD', ...item }),
    });
    const data = await res.json();
    if (!res.ok) { toast.error(data?.error || 'Could not add item'); return; }
    await refreshMenu();
    toast.success(`${item.name} added to menu!`);
  };

  const updateMenuItem = async (id: string, updates: Partial<Pick<MenuItem, 'name' | 'price' | 'category'>>) => {
    const res = await fetch(`/api/menu/${id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    const data = await res.json();
    if (!res.ok) { toast.error(data?.error || 'Could not update item'); return; }
    await refreshMenu();
    toast.success('Item updated');
  };

  const deleteMenuItem = async (id: string) => {
    const res = await fetch(`/api/menu/${id}`, { method: 'DELETE' });
    const data = await res.json();
    if (!res.ok) { toast.error(data?.error || 'Could not remove item'); return; }
    await refreshMenu();
    toast.success('Item removed');
  };

  // ---- Orders (from API, polled) ----
  const readyNotified = useRef<Set<string>>(new Set());

  const refreshOrders = useCallback(async () => {
    try {
      const res = await fetch('/api/orders?active=1', { cache: 'no-store' });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Failed to load orders');
      const mapped: TableOrder[] = data.map(mapOrder);
      setActiveOrders(mapped);

      // Notify when an order becomes fully ready (kitchen done -> inform table).
      const currentReady = new Set<string>();
      mapped.forEach((o) => {
        if (o.orderId && isOrderReady(o)) {
          currentReady.add(o.orderId);
          if (!readyNotified.current.has(o.orderId)) {
            readyNotified.current.add(o.orderId);
            const label = o.type === 'DINE_IN' ? `Table ${o.tableNumber}` : (o.orderNo || o.orderId);
            playReadySound();
            toast.success('Order ready to serve!', { description: label });
          }
        }
      });
      readyNotified.current.forEach((id) => { if (!currentReady.has(id)) readyNotified.current.delete(id); });
    } catch (e) {
      console.error(e);
    } finally {
      setOrdersLoading(false);
    }
  }, [playReadySound]);

  useEffect(() => {
    refreshOrders();
    const t = setInterval(refreshOrders, POLL_MS);
    return () => clearInterval(t);
  }, [refreshOrders]);

  const getTableOrder = useCallback(
    (tableNumber: number) =>
      activeOrders.find((o) => o.type === 'DINE_IN' && o.tableNumber === tableNumber),
    [activeOrders]
  );

  const placeOrder: RestaurantContextType['placeOrder'] = async ({ type, tableNumber = 0, items }) => {
    if (items.length === 0) { toast.error('Add at least one item'); return null; }
    const res = await fetch('/api/orders', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type, tableNumber,
        items: items.map((c) => ({
          menuItemId: c.menuItem.id, name: c.menuItem.name, price: c.menuItem.price,
          category: c.menuItem.category, quantity: c.quantity,
        })),
      }),
    });
    const data = await res.json();
    if (!res.ok) { toast.error(data?.error || 'Could not send order'); return null; }
    playOrderSound();
    const label = type === 'DINE_IN' ? `Table ${tableNumber}` : (data.orderNo || 'order');
    toast.success(`Sent to kitchen — ${label}`);
    await refreshOrders();
    return mapOrder(data);
  };

  const updateItemStatus = async (orderId: string, menuItemId: string, status: OrderItem['status']) => {
    const res = await fetch(`/api/orders/${orderId}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ itemStatuses: [{ menuItemId, status }] }),
    });
    if (!res.ok) { const d = await res.json().catch(() => ({})); toast.error(d?.error || 'Update failed'); return; }
    await refreshOrders();
  };

  const updateItemQuantity = async (orderId: string, menuItemId: string, quantity: number) => {
    const res = await fetch(`/api/orders/${orderId}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ itemQuantities: [{ menuItemId, quantity }] }),
    });
    if (!res.ok) { const d = await res.json().catch(() => ({})); toast.error(d?.error || 'Update failed'); return; }
    await refreshOrders();
  };

  const markPaid = async (orderId: string) => {
    const res = await fetch(`/api/orders/${orderId}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ paymentStatus: 'paid' }),
    });
    if (!res.ok) { const d = await res.json().catch(() => ({})); toast.error(d?.error || 'Update failed'); return; }
    toast.success('Payment received!');
    await refreshOrders();
  };

  const addToHistory = (entry: OrderHistoryEntry) => setOrderHistory((prev) => [entry, ...prev]);

  const clearOrder = async (order: TableOrder) => {
    if (!order.orderId) return;
    if (order.items.length > 0) {
      const total = order.items.reduce((s, i) => s + i.menuItem.price * i.quantity, 0);
      addToHistory({
        orderId: order.orderNo || order.orderId,
        type: order.type,
        items: order.items.map((i) => ({ name: i.menuItem.name, quantity: i.quantity, price: i.menuItem.price })),
        total,
        timestamp: new Date().toISOString(),
        tableNumber: order.tableNumber || undefined,
      });
    }
    const res = await fetch(`/api/orders/${order.orderId}`, { method: 'DELETE' });
    if (!res.ok) { const d = await res.json().catch(() => ({})); toast.error(d?.error || 'Could not clear'); return; }
    await refreshOrders();
  };

  // ---- Auth / settings / invoice ----
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
    if (currentPin !== counterPin) { toast.error('Current PIN is incorrect'); return false; }
    if (!/^\d{4}$/.test(newPin)) { toast.error('PIN must be 4 digits'); return false; }
    setCounterPin(newPin);
    toast.success('PIN changed successfully!');
    return true;
  };
  const updateSettings = (s: Partial<RestaurantSettings>) => {
    setSettings((prev) => ({ ...prev, ...s }));
    toast.success('Settings updated!');
  };
  const getNextInvoice = () => {
    const inv = `INV-${String(nextInvoiceNumber).padStart(4, '0')}`;
    setNextInvoiceNumber((prev) => prev + 1);
    return inv;
  };

  return (
    <RestaurantContext.Provider value={{
      menuItems, teaSnacksItems, menuLoading, addMenuItem, updateMenuItem, deleteMenuItem,
      tables,
      activeOrders, ordersLoading, getTableOrder, refreshOrders, placeOrder,
      updateItemStatus, updateItemQuantity, markPaid, clearOrder,
      isCounterAuthenticated, authenticateCounter, logoutCounter, changePin,
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
