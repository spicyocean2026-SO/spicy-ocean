"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, ReceiptText, BarChart3, LogOut, FileText, PackageOpen, Coffee, Loader2 } from 'lucide-react';
import { useRestaurant, TableOrder } from '@/context/RestaurantContext';
import OrderCard from '@/components/OrderCard';
import BillModal from '@/components/BillModal';
import { Badge } from '@/components/ui/badge';

// Map an API order to the TableOrder shape (same as context).
function mapOrder(o: any): TableOrder {
  return {
    orderId: o.orderId, orderNo: o.orderNo, tableNumber: o.tableNumber,
    paymentStatus: o.paymentStatus, createdAt: o.createdAt, type: o.type,
    items: (o.items ?? []).map((i: any) => ({ menuItem: i.menuItem, quantity: i.quantity, status: i.status })),
  };
}

const labelFor = (o: TableOrder) => o.type === 'DINE_IN' ? `Table ${o.tableNumber}` : (o.orderNo || o.orderId || '');
const getTypeLabel = (t: string) => t === 'TAKE_AWAY' ? 'Take Away' : t === 'TEA_SNACKS' ? 'Tea & Snacks' : 'Dine-In';

const CounterPage: React.FC = () => {
  const {
    isCounterAuthenticated, authenticateCounter, logoutCounter,
    activeOrders, markPaid, clearOrder, settings, getNextInvoice,
  } = useRestaurant();
  const [pin, setPin] = useState('');
  const [activeTab, setActiveTab] = useState<'orders' | 'closed' | 'summary'>('orders');
  const [bill, setBill] = useState<{ order: TableOrder; invoice: string } | null>(null);
  const [closed, setClosed] = useState<TableOrder[]>([]);
  const [closedLoading, setClosedLoading] = useState(false);

  const tax = settings.taxPercent;

  const fetchClosed = useCallback(async () => {
    setClosedLoading(true);
    try {
      const res = await fetch('/api/orders?status=cleared', { cache: 'no-store' });
      const data = await res.json();
      if (res.ok) setClosed((data as any[]).map(mapOrder).sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt)));
    } finally {
      setClosedLoading(false);
    }
  }, []);

  useEffect(() => { if (isCounterAuthenticated && activeTab === 'closed') fetchClosed(); }, [activeTab, isCounterAuthenticated, fetchClosed]);

  if (!isCounterAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-[80vh] p-4">
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
          className="bg-card rounded-2xl border border-border p-8 w-full max-w-sm shadow-lg">
          <div className="flex flex-col items-center mb-6">
            <div className="w-16 h-16 rounded-full gradient-primary flex items-center justify-center mb-4">
              <Lock className="w-7 h-7 text-primary-foreground" />
            </div>
            <h2 className="text-xl font-bold text-foreground">Counter Login</h2>
            <p className="text-sm text-muted-foreground">Enter 4-digit PIN</p>
          </div>
          <div className="flex justify-center gap-3 mb-6">
            {[0, 1, 2, 3].map(i => (
              <div key={i} className={`w-12 h-14 rounded-xl border-2 flex items-center justify-center text-xl font-bold ${pin.length > i ? 'border-primary bg-primary/5 text-foreground' : 'border-border text-transparent'}`}>
                {pin[i] || '•'}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-3 gap-2 mb-4">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, null, 0, 'del'].map((key, idx) => (
              <button key={idx} onClick={() => {
                if (key === null) return;
                if (key === 'del') { setPin(p => p.slice(0, -1)); return; }
                setPin(prev => {
                  if (prev.length >= 4) return prev;
                  const newPin = prev + key;
                  if (newPin.length === 4) {
                    setTimeout(() => { const ok = authenticateCounter(newPin); if (!ok) setPin(''); }, 120);
                  }
                  return newPin;
                });
              }} className={`h-12 rounded-xl font-semibold text-lg transition-colors ${key === null ? '' : 'bg-muted hover:bg-primary/10 text-foreground active:bg-primary/20'}`}>
                {key === 'del' ? '⌫' : key === null ? '' : key}
              </button>
            ))}
          </div>
        </motion.div>
      </div>
    );
  }

  const orders = activeOrders.filter((o) => o.items.length > 0);
  const totalRevenue = orders.reduce((sum, o) => sum + o.items.reduce((s, i) => s + i.menuItem.price * i.quantity, 0), 0);
  const orderTotal = (o: TableOrder) => o.items.reduce((s, i) => s + i.menuItem.price * i.quantity, 0);

  // Generate Bill = finalize: show the bill, mark paid, and close the order.
  const generateBillAndClose = async (order: TableOrder) => {
    setBill({ order, invoice: getNextInvoice() });
    if (order.orderId) {
      await markPaid(order.orderId);
      await clearOrder(order);
    }
  };

  const tabs: { id: typeof activeTab; label: string }[] = [
    { id: 'orders', label: 'Active Orders' },
    { id: 'closed', label: 'Closed Orders' },
    { id: 'summary', label: 'Summary' },
  ];

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <ReceiptText className="w-7 h-7 text-primary" /> Counter Dashboard
          </h2>
          <p className="text-sm text-muted-foreground mt-1">Admin panel</p>
        </div>
        <button onClick={logoutCounter} className="p-2 rounded-lg bg-muted hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors">
          <LogOut className="w-5 h-5" />
        </button>
      </div>

      <div className="flex gap-2 mb-6">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === t.id ? 'gradient-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {activeTab === 'orders' && (
        <div className="space-y-4">
          {orders.length === 0 ? (
            <p className="text-center text-muted-foreground py-20">No active orders</p>
          ) : (
            orders.map((order) => {
              const total = orderTotal(order);
              return (
                <motion.div key={order.orderId} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="bg-card rounded-xl border border-border p-4 shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      {order.type === 'TAKE_AWAY' && <PackageOpen className="w-4 h-4 text-primary" />}
                      {order.type === 'TEA_SNACKS' && <Coffee className="w-4 h-4 text-primary" />}
                      <h3 className="font-semibold text-foreground">{labelFor(order)}</h3>
                      <Badge className="text-xs bg-muted text-muted-foreground">{getTypeLabel(order.type)}</Badge>
                      {order.tableFreed && <Badge className="text-xs bg-highlight text-highlight-foreground">Awaiting payment</Badge>}
                    </div>
                    <span className="font-bold text-primary">₹{(total * (1 + tax / 100)).toFixed(0)}</span>
                  </div>
                  {order.items.map(item => <OrderCard key={item.menuItem.id} item={item} />)}
                  <div className="flex gap-2 mt-3 pt-3 border-t border-border">
                    <button onClick={() => generateBillAndClose(order)}
                      className="flex items-center gap-1 px-4 py-2 rounded-lg gradient-primary text-primary-foreground text-sm font-medium">
                      <FileText className="w-4 h-4" /> Generate Bill &amp; Close
                    </button>
                  </div>
                </motion.div>
              );
            })
          )}
        </div>
      )}

      {activeTab === 'closed' && (
        <div className="space-y-3">
          {closedLoading ? (
            <div className="flex items-center justify-center py-16 text-muted-foreground"><Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading…</div>
          ) : closed.length === 0 ? (
            <p className="text-center text-muted-foreground py-20">No closed orders yet</p>
          ) : (
            closed.map((order) => {
              const total = orderTotal(order);
              return (
                <div key={order.orderId} className="bg-card rounded-xl border border-border p-4 shadow-sm flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-foreground">{labelFor(order)}</h3>
                      <Badge className="text-xs bg-muted text-muted-foreground">{getTypeLabel(order.type)}</Badge>
                      <Badge className={order.paymentStatus === 'paid' ? 'bg-success text-success-foreground text-xs' : 'bg-highlight text-highlight-foreground text-xs'}>{order.paymentStatus}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {order.items.length} items · {new Date(order.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span className="font-bold text-primary">₹{(total * (1 + tax / 100)).toFixed(0)}</span>
                    <button onClick={() => setBill({ order, invoice: order.orderNo || '' })}
                      className="px-3 py-2 rounded-lg bg-muted text-foreground text-xs font-medium hover:bg-muted/70 transition-colors">
                      View Bill
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {activeTab === 'summary' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-card rounded-xl border border-border p-6 shadow-sm">
              <p className="text-sm text-muted-foreground">Active Orders</p>
              <p className="text-3xl font-bold text-foreground mt-1">{orders.length}</p>
            </div>
            <div className="bg-card rounded-xl border border-border p-6 shadow-sm">
              <p className="text-sm text-muted-foreground">Active Total (with tax)</p>
              <p className="text-3xl font-bold text-primary mt-1">₹{(totalRevenue * (1 + tax / 100)).toFixed(0)}</p>
            </div>
            <div className="bg-card rounded-xl border border-border p-6 shadow-sm">
              <p className="text-sm text-muted-foreground">Tea &amp; Snacks (active)</p>
              <p className="text-3xl font-bold text-foreground mt-1">{orders.filter(o => o.type === 'TEA_SNACKS').length}</p>
            </div>
          </div>
          <div className="bg-card rounded-xl border border-border p-4 shadow-sm">
            <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-primary" /> Active Order Breakdown
            </h3>
            {orders.length === 0 ? (
              <p className="text-sm text-muted-foreground py-2">No active orders</p>
            ) : orders.map((order) => (
              <div key={order.orderId} className="flex justify-between items-center py-2 border-b border-border last:border-0">
                <span className="text-sm text-foreground">{labelFor(order)}</span>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground">{order.items.length} items</span>
                  <span className="font-semibold text-foreground">₹{(orderTotal(order) * (1 + tax / 100)).toFixed(0)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <AnimatePresence>
        {bill && <BillModal order={bill.order} invoiceNumber={bill.invoice} onClose={() => setBill(null)} />}
      </AnimatePresence>
    </div>
  );
};

export default CounterPage;
