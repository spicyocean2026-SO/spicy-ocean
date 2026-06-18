"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, ReceiptText, BarChart3, CheckCircle, LogOut, FileText, PackageOpen, Coffee } from 'lucide-react';
import { useRestaurant } from '@/context/RestaurantContext';
import OrderCard from '@/components/OrderCard';
import BillModal from '@/components/BillModal';
import { Badge } from '@/components/ui/badge';
import type { TableOrder } from '@/context/RestaurantContext';

const CounterPage: React.FC = () => {
  const {
    isCounterAuthenticated, authenticateCounter, logoutCounter,
    orders, takeAwayOrders, teaSnacksOrders, markTablePaid, clearTable, settings, getNextInvoice,
  } = useRestaurant();
  const [pin, setPin] = useState('');
  const [activeTab, setActiveTab] = useState<'orders' | 'summary'>('orders');
  const [billOrder, setBillOrder] = useState<{ order: TableOrder; invoice: string } | null>(null);

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
                    setTimeout(() => {
                      const ok = authenticateCounter(newPin);
                      if (!ok) setPin('');
                    }, 120);
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

  const allOrders = [
    ...Object.entries(orders).map(([k, o]) => ({ key: k, order: { ...o, type: 'DINE_IN' as const } })),
    ...Object.entries(takeAwayOrders).map(([k, o]) => ({ key: k, order: { ...o, type: 'TAKE_AWAY' as const } })),
    ...Object.entries(teaSnacksOrders).map(([k, o]) => ({ key: k, order: { ...o, type: 'TEA_SNACKS' as const } })),
  ];
  const activeOrders = allOrders.filter(({ order }) => order.items.length > 0);
  const totalRevenue = activeOrders.reduce((sum, { order }) => sum + order.items.reduce((s, i) => s + i.menuItem.price * i.quantity, 0), 0);
  const tax = settings.taxPercent;

  const getTypeLabel = (type: string) => {
    if (type === 'TAKE_AWAY') return 'Take Away';
    if (type === 'TEA_SNACKS') return 'Tea & Snacks';
    return 'Dine-In';
  };
  const getTypeIcon = (type: string) => {
    if (type === 'TAKE_AWAY') return '🥡';
    if (type === 'TEA_SNACKS') return '☕';
    return '🍽';
  };

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
        {(['orders', 'summary'] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors capitalize ${activeTab === tab ? 'gradient-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
            {tab === 'orders' ? 'Active Orders' : 'Summary'}
          </button>
        ))}
      </div>

      {activeTab === 'orders' ? (
        <div className="space-y-4">
          {activeOrders.length === 0 ? (
            <p className="text-center text-muted-foreground py-20">No active orders</p>
          ) : (
            activeOrders.map(({ key, order }) => {
              const total = order.items.reduce((s, i) => s + i.menuItem.price * i.quantity, 0);
              const label = order.type === 'DINE_IN' ? `Table ${order.tableNumber}` : (order.orderId || key);
              return (
                <motion.div key={key} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="bg-card rounded-xl border border-border p-4 shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      {order.type === 'TAKE_AWAY' && <PackageOpen className="w-4 h-4 text-primary" />}
                      {order.type === 'TEA_SNACKS' && <Coffee className="w-4 h-4 text-primary" />}
                      <h3 className="font-semibold text-foreground">{label}</h3>
                      <Badge className="text-xs bg-muted text-muted-foreground">{getTypeLabel(order.type)}</Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={order.paymentStatus === 'paid' ? 'bg-success text-success-foreground' : 'bg-highlight text-highlight-foreground'}>
                        {order.paymentStatus}
                      </Badge>
                      <span className="font-bold text-primary">₹{(total * (1 + tax / 100)).toFixed(0)}</span>
                    </div>
                  </div>
                  {order.items.map(item => <OrderCard key={item.menuItem.id} item={item} />)}
                  <div className="flex gap-2 mt-3 pt-3 border-t border-border flex-wrap">
                    <button onClick={() => setBillOrder({ order: order as TableOrder, invoice: getNextInvoice() })}
                      className="flex items-center gap-1 px-4 py-2 rounded-lg bg-muted text-sm font-medium text-foreground hover:bg-muted/70 transition-colors">
                      <FileText className="w-4 h-4" /> Generate Bill
                    </button>
                    {order.paymentStatus !== 'paid' && (
                      <button onClick={() => markTablePaid(key)}
                        className="flex items-center gap-1 px-4 py-2 rounded-lg gradient-primary text-primary-foreground text-sm font-medium">
                        <CheckCircle className="w-4 h-4" /> Mark Paid
                      </button>
                    )}
                    {order.paymentStatus === 'paid' && (
                      <button onClick={() => clearTable(key)}
                        className="px-4 py-2 rounded-lg bg-muted text-sm font-medium text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors">
                        Clear
                      </button>
                    )}
                  </div>
                </motion.div>
              );
            })
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-card rounded-xl border border-border p-6 shadow-sm">
              <p className="text-sm text-muted-foreground">Total Orders</p>
              <p className="text-3xl font-bold text-foreground mt-1">{activeOrders.length}</p>
            </div>
            <div className="bg-card rounded-xl border border-border p-6 shadow-sm">
              <p className="text-sm text-muted-foreground">Total Revenue</p>
              <p className="text-3xl font-bold text-primary mt-1">₹{(totalRevenue * (1 + tax / 100)).toFixed(0)}</p>
            </div>
            <div className="bg-card rounded-xl border border-border p-6 shadow-sm">
              <p className="text-sm text-muted-foreground">Tea & Snacks Orders</p>
              <p className="text-3xl font-bold text-foreground mt-1">{activeOrders.filter(o => o.order.type === 'TEA_SNACKS').length}</p>
            </div>
          </div>
          <div className="bg-card rounded-xl border border-border p-4 shadow-sm">
            <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-primary" /> Order Breakdown
            </h3>
            {activeOrders.map(({ key, order }) => {
              const total = order.items.reduce((s, i) => s + i.menuItem.price * i.quantity, 0);
              const label = order.type === 'DINE_IN' ? `Table ${order.tableNumber}` : (order.orderId || key);
              return (
                <div key={key} className="flex justify-between items-center py-2 border-b border-border last:border-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-foreground">{label}</span>
                    <Badge className="text-xs bg-muted text-muted-foreground">{getTypeIcon(order.type)}</Badge>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground">{order.items.length} items</span>
                    <span className="font-semibold text-foreground">₹{(total * (1 + tax / 100)).toFixed(0)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <AnimatePresence>
        {billOrder && <BillModal order={billOrder.order} invoiceNumber={billOrder.invoice} onClose={() => setBillOrder(null)} />}
      </AnimatePresence>
    </div>
  );
};

export default CounterPage;
