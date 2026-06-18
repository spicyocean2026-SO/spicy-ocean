"use client";

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Printer, ChefHat, PackageOpen, Coffee } from 'lucide-react';
import { useRestaurant } from '@/context/RestaurantContext';
import OrderCard from '@/components/OrderCard';
import { Badge } from '@/components/ui/badge';

const KitchenPage: React.FC = () => {
  const { orders, takeAwayOrders, teaSnacksOrders, updateItemStatus } = useRestaurant();

  const allOrders = [
    ...Object.entries(orders).map(([key, o]) => ({ key, order: { ...o, type: 'DINE_IN' as const } })),
    ...Object.entries(takeAwayOrders).map(([key, o]) => ({ key, order: { ...o, type: 'TAKE_AWAY' as const } })),
    ...Object.entries(teaSnacksOrders).map(([key, o]) => ({ key, order: { ...o, type: 'TEA_SNACKS' as const } })),
  ].filter(({ order }) => order.items.some(i => i.status !== 'completed'));

  const handlePrint = (key: string, order: any) => {
    const printContent = order.items
      .map((i: any) => `${i.menuItem.name} x${i.quantity} - ₹${i.menuItem.price * i.quantity}`)
      .join('\n');
    const label = order.type === 'DINE_IN' ? `Table ${order.tableNumber}` : (order.orderId || key);
    const w = window.open('', '_blank');
    if (w) {
      w.document.write(`<pre style="font-family:monospace;font-size:14px;">
<strong>Kadali - Kitchen Order</strong>
${label} ${order.type === 'TAKE_AWAY' ? '🥡 Take Away' : order.type === 'TEA_SNACKS' ? '☕ Tea & Snacks' : '🍽 Dine-In'}
${'─'.repeat(30)}
${printContent}
${'─'.repeat(30)}
</pre>`);
      w.print();
      w.close();
    }
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
        <p className="text-sm text-muted-foreground mt-1">Manage incoming orders</p>
      </div>

      {allOrders.length === 0 ? (
        <div className="text-center py-20">
          <ChefHat className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
          <p className="text-muted-foreground">No active orders</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence>
            {allOrders.map(({ key, order }) => {
              const typeInfo = getTypeInfo(order.type);
              return (
                <motion.div key={key} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-3 gradient-primary text-primary-foreground">
                    <div className="flex items-center gap-2">
                      {typeInfo.icon}
                      <h3 className="font-semibold">
                        {order.type === 'DINE_IN' ? `Table ${order.tableNumber}` : (order.orderId || key)}
                      </h3>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={`text-xs ${typeInfo.badgeClass}`}>{typeInfo.label}</Badge>
                      <button onClick={() => handlePrint(key, order)}
                        className="p-2 rounded-lg bg-primary-foreground/10 hover:bg-primary-foreground/20 transition-colors">
                        <Printer className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <div className="px-4 py-2">
                    {order.items.map(item => (
                      <OrderCard key={item.menuItem.id} item={item} showStatusButtons
                        onStatusChange={(itemId, status) => updateItemStatus(key, itemId, status)} />
                    ))}
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
