"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Printer, ChefHat, PackageOpen, Coffee, CheckCheck, LayoutGrid, ListChecks } from 'lucide-react';
import { useRestaurant, TableOrder } from '@/context/RestaurantContext';
import OrderCard from '@/components/OrderCard';
import { Badge } from '@/components/ui/badge';

// The kitchen only cares about items still waiting to be prepared.
const isPending = (status: string) => status === 'added' || status === 'cooking';

const labelFor = (o: TableOrder) =>
  o.type === 'DINE_IN' ? `Table ${o.tableNumber}` : (o.orderNo || o.orderId || '');

const KitchenPage: React.FC = () => {
  const { activeOrders, updateItemStatus } = useRestaurant();
  const [view, setView] = useState<'tables' | 'items'>('tables');

  // Only orders that still have items to cook.
  const orders = activeOrders.filter((o) => o.items.some((i) => isPending(i.status)));

  // Aggregate pending items across all tables/orders for batch cooking.
  const aggregated = (() => {
    const map = new Map<string, {
      menuItemId: string; name: string; totalQty: number;
      sources: { orderId: string; label: string; qty: number }[];
    }>();
    orders.forEach((o) => {
      o.items.filter((i) => isPending(i.status)).forEach((i) => {
        const key = i.menuItem.id;
        const entry = map.get(key) ?? { menuItemId: key, name: i.menuItem.name, totalQty: 0, sources: [] };
        entry.totalQty += i.quantity;
        if (o.orderId) entry.sources.push({ orderId: o.orderId, label: labelFor(o), qty: i.quantity });
        map.set(key, entry);
      });
    });
    return Array.from(map.values()).sort((a, b) => b.totalQty - a.totalQty);
  })();

  const handlePrint = (order: TableOrder) => {
    const printContent = order.items
      .filter((i) => isPending(i.status))
      .map((i) => `${i.menuItem.name} x${i.quantity} - ₹${i.menuItem.price * i.quantity}`)
      .join('\n');
    const label = labelFor(order);
    const w = window.open('', '_blank');
    if (w) {
      w.document.write(`<pre style="font-family:monospace;font-size:14px;">
<strong>Spicy Ocean - Kitchen Order</strong>
${label} ${order.type === 'TAKE_AWAY' ? '🥡 Take Away' : order.type === 'TEA_SNACKS' ? '☕ Tea & Snacks' : '🍽 Dine-In'}
${'─'.repeat(30)}
${printContent}
${'─'.repeat(30)}
</pre>`);
      w.print();
      w.close();
    }
  };

  const markAllReady = (order: TableOrder) => {
    if (!order.orderId) return;
    order.items.forEach((i) => {
      if (isPending(i.status)) updateItemStatus(order.orderId!, i.menuItem.id, 'ready');
    });
  };

  const markItemReadyEverywhere = (entry: { menuItemId: string; sources: { orderId: string }[] }) => {
    entry.sources.forEach((s) => updateItemStatus(s.orderId, entry.menuItemId, 'ready'));
  };

  const getTypeInfo = (type: string) => {
    if (type === 'TAKE_AWAY') return { icon: <PackageOpen className="w-4 h-4" />, label: '🥡 Take Away', badgeClass: 'bg-highlight text-highlight-foreground' };
    if (type === 'TEA_SNACKS') return { icon: <Coffee className="w-4 h-4" />, label: '☕ Tea & Snacks', badgeClass: 'bg-accent text-accent-foreground' };
    return { icon: null, label: '🍽 Dine-In', badgeClass: 'bg-primary-foreground/20 text-primary-foreground' };
  };

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <ChefHat className="w-7 h-7 text-primary" /> Kitchen Dashboard
          </h2>
          <p className="text-sm text-muted-foreground mt-1">Live incoming orders · updates every few seconds</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setView('tables')}
            className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors ${view === 'tables' ? 'gradient-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
            <LayoutGrid className="w-4 h-4" /> By Table
          </button>
          <button onClick={() => setView('items')}
            className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors ${view === 'items' ? 'gradient-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
            <ListChecks className="w-4 h-4" /> By Item
          </button>
        </div>
      </div>

      {orders.length === 0 ? (
        <div className="text-center py-20">
          <ChefHat className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
          <p className="text-muted-foreground">No active orders</p>
        </div>
      ) : view === 'items' ? (
        // ---- Aggregated prep list ----
        <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden max-w-2xl">
          <div className="px-4 py-3 border-b border-border bg-muted/40">
            <h3 className="font-semibold text-foreground">Prep List · {aggregated.length} dishes</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Total quantity to cook across all tables</p>
          </div>
          <AnimatePresence>
            {aggregated.map((entry) => (
              <motion.div key={entry.menuItemId} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="flex items-center justify-between gap-3 px-4 py-3 border-b border-border last:border-0">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="w-8 h-8 rounded-lg gradient-primary text-primary-foreground text-sm font-bold flex items-center justify-center flex-shrink-0">
                      {entry.totalQty}
                    </span>
                    <p className="font-medium text-foreground truncate">{entry.name}</p>
                  </div>
                  <div className="flex flex-wrap gap-1 mt-1.5 pl-10">
                    {entry.sources.map((s, idx) => (
                      <Badge key={idx} className="text-[10px] bg-muted text-muted-foreground font-normal">{s.label} ×{s.qty}</Badge>
                    ))}
                  </div>
                </div>
                <button onClick={() => markItemReadyEverywhere(entry)}
                  className="px-3 py-2 rounded-lg bg-success/10 text-success text-xs font-medium flex items-center gap-1.5 hover:bg-success/20 transition-colors flex-shrink-0">
                  <CheckCheck className="w-4 h-4" /> Ready
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      ) : (
        // ---- Per-table cards ----
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence>
            {orders.map((order) => {
              const typeInfo = getTypeInfo(order.type);
              return (
                <motion.div key={order.orderId} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-3 gradient-primary text-primary-foreground">
                    <div className="flex items-center gap-2">
                      {typeInfo.icon}
                      <h3 className="font-semibold">{labelFor(order)}</h3>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={`text-xs ${typeInfo.badgeClass}`}>{typeInfo.label}</Badge>
                      <button onClick={() => handlePrint(order)} className="p-2 rounded-lg bg-primary-foreground/10 hover:bg-primary-foreground/20 transition-colors">
                        <Printer className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <div className="px-4 py-2">
                    {order.items.filter((i) => isPending(i.status)).map((item) => (
                      <OrderCard key={item.menuItem.id} item={item} showStatusButtons
                        onStatusChange={(itemId, status) => order.orderId && updateItemStatus(order.orderId, itemId, status)} />
                    ))}
                  </div>
                  <div className="px-4 pb-3">
                    <button onClick={() => markAllReady(order)}
                      className="w-full py-2 rounded-lg bg-success/10 text-success text-sm font-medium flex items-center justify-center gap-2 hover:bg-success/20 transition-colors">
                      <CheckCheck className="w-4 h-4" /> Mark all ready
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};

export default KitchenPage;
