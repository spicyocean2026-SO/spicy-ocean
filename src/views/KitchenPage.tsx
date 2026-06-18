"use client";

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Printer, ChefHat, PackageOpen, Coffee, CheckCheck } from 'lucide-react';
import { useRestaurant, TableOrder } from '@/context/RestaurantContext';
import OrderCard from '@/components/OrderCard';
import { Badge } from '@/components/ui/badge';

const KitchenPage: React.FC = () => {
  const { activeOrders, updateItemStatus } = useRestaurant();

  // Show orders that still have something to cook/serve.
  const orders = activeOrders.filter((o) => o.items.some((i) => i.status !== 'completed'));

  const handlePrint = (order: TableOrder) => {
    const printContent = order.items
      .map((i) => `${i.menuItem.name} x${i.quantity} - ₹${i.menuItem.price * i.quantity}`)
      .join('\n');
    const label = order.type === 'DINE_IN' ? `Table ${order.tableNumber}` : (order.orderNo || order.orderId || '');
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

  const markAllDone = (order: TableOrder) => {
    if (!order.orderId) return;
    order.items.forEach((i) => {
      if (i.status !== 'ready' && i.status !== 'completed') updateItemStatus(order.orderId!, i.menuItem.id, 'ready');
    });
  };

  const getTypeInfo = (type: string) => {
    if (type === 'TAKE_AWAY') return { icon: <PackageOpen className="w-4 h-4" />, label: '🥡 Take Away', badgeClass: 'bg-highlight text-highlight-foreground' };
    if (type === 'TEA_SNACKS') return { icon: <Coffee className="w-4 h-4" />, label: '☕ Tea & Snacks', badgeClass: 'bg-accent text-accent-foreground' };
    return { icon: null, label: '🍽 Dine-In', badgeClass: 'bg-primary-foreground/20 text-primary-foreground' };
  };

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <ChefHat className="w-7 h-7 text-primary" /> Kitchen Dashboard
        </h2>
        <p className="text-sm text-muted-foreground mt-1">Live incoming orders · updates every few seconds</p>
      </div>

      {orders.length === 0 ? (
        <div className="text-center py-20">
          <ChefHat className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
          <p className="text-muted-foreground">No active orders</p>
        </div>
      ) : (
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
                      <h3 className="font-semibold">
                        {order.type === 'DINE_IN' ? `Table ${order.tableNumber}` : (order.orderNo || order.orderId)}
                      </h3>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={`text-xs ${typeInfo.badgeClass}`}>{typeInfo.label}</Badge>
                      <button onClick={() => handlePrint(order)} className="p-2 rounded-lg bg-primary-foreground/10 hover:bg-primary-foreground/20 transition-colors">
                        <Printer className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <div className="px-4 py-2">
                    {order.items.map((item) => (
                      <OrderCard key={item.menuItem.id} item={item} showStatusButtons
                        onStatusChange={(itemId, status) => order.orderId && updateItemStatus(order.orderId, itemId, status)} />
                    ))}
                  </div>
                  <div className="px-4 pb-3">
                    <button onClick={() => markAllDone(order)}
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
