"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, ArrowLeft, Minus, Plus, ShoppingCart, Trash2, Send, Loader2, DoorOpen, Check } from 'lucide-react';
import { toast } from 'sonner';
import { useRestaurant, CartLine, MenuItem, TableOrder } from '@/context/RestaurantContext';
import TableCard from '@/components/TableCard';
import FoodItemCard from '@/components/FoodItemCard';

const categories = ['All', 'Soups', 'Starters', 'Biriyani', 'Cocktails'];

const orderReady = (o?: TableOrder) =>
  !!o && o.items.length > 0 && o.items.every((i) => i.status === 'ready' || i.status === 'completed');

const SENT_STATUS: Record<string, { label: string; cls: string }> = {
  added: { label: 'Pending', cls: 'bg-highlight text-highlight-foreground' },
  cooking: { label: 'Cooking', cls: 'bg-primary text-primary-foreground' },
  ready: { label: 'Ready', cls: 'bg-success text-success-foreground' },
  completed: { label: 'Served', cls: 'bg-muted text-muted-foreground' },
};

const DineInPage: React.FC = () => {
  const { tables, menuItems, menuLoading, getTableOrder, placeOrder, freeTable, updateItemStatus, settings } = useRestaurant();
  const [selectedTable, setSelectedTable] = useState<number | null>(null);
  const [activeCategory, setActiveCategory] = useState('All');
  const [search, setSearch] = useState('');
  const [showCart, setShowCart] = useState(false);
  const [cart, setCart] = useState<CartLine[]>([]);
  const [sending, setSending] = useState(false);
  const [closing, setClosing] = useState(false);

  const filteredItems = menuItems.filter((item) => {
    const matchCategory = activeCategory === 'All' || item.category === activeCategory;
    const matchSearch = item.name.toLowerCase().includes(search.toLowerCase());
    return matchCategory && matchSearch;
  });

  const addToCart = (item: MenuItem) => {
    setCart((prev) => {
      const ex = prev.find((c) => c.menuItem.id === item.id);
      if (ex) return prev.map((c) => (c.menuItem.id === item.id ? { ...c, quantity: c.quantity + 1 } : c));
      return [...prev, { menuItem: item, quantity: 1 }];
    });
  };
  const setQty = (id: string, qty: number) => {
    setCart((prev) =>
      qty <= 0 ? prev.filter((c) => c.menuItem.id !== id) : prev.map((c) => (c.menuItem.id === id ? { ...c, quantity: qty } : c))
    );
  };
  const removeFromCart = (id: string) => setCart((prev) => prev.filter((c) => c.menuItem.id !== id));

  const cartTotal = cart.reduce((s, c) => s + c.menuItem.price * c.quantity, 0);

  const openTable = (t: number) => { setSelectedTable(t); setCart([]); setShowCart(false); };

  const handleSend = async () => {
    if (!selectedTable || cart.length === 0) return;
    setSending(true);
    const res = await placeOrder({ type: 'DINE_IN', tableNumber: selectedTable, items: cart });
    setSending(false);
    if (res) { setCart([]); setShowCart(false); }
  };

  const handleClose = async (order: TableOrder) => {
    const beingPrepared = order.items.some((i) => i.status === 'added' || i.status === 'cooking');
    const notServed = order.items.some((i) => i.status === 'ready');
    if (beingPrepared) {
      toast.error('Cannot close — some items are still being prepared in the kitchen.');
      return;
    }
    if (notServed) {
      toast.error('Cannot close — mark all ready items as Served first.');
      return;
    }
    if (!window.confirm(`Free Table ${selectedTable} for new customers? The bill stays open for the cashier to settle.`)) return;
    setClosing(true);
    await freeTable(order);
    setClosing(false);
    setCart([]);
    setSelectedTable(null);
  };

  const serveItem = (order: TableOrder, menuItemId: string) => {
    if (order.orderId) updateItemStatus(order.orderId, menuItemId, 'completed');
  };

  // ---- Table selection screen ----
  if (!selectedTable) {
    return (
      <div className="p-4 md:p-6 max-w-6xl mx-auto">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-foreground">Select a Table</h2>
          <p className="text-sm text-muted-foreground mt-1">Choose a table to start taking orders</p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {tables.map((t) => {
            const order = getTableOrder(t);
            const ready = orderReady(order);
            const count = order?.items.reduce((s, i) => s + i.quantity, 0) || 0;
            const label = ready
              ? 'Ready to serve'
              : order
              ? order.items.some((i) => i.status === 'cooking') ? 'Preparing…' : `${count} item${count !== 1 ? 's' : ''}`
              : undefined;
            return (
              <TableCard key={t} tableNumber={t} hasOrder={!!order} itemCount={count} ready={ready} statusLabel={label} onClick={() => openTable(t)} />
            );
          })}
        </div>
      </div>
    );
  }

  const sentOrder = getTableOrder(selectedTable);

  return (
    <div className="flex flex-col h-[calc(100vh-48px)]">
      <div className="flex items-center gap-3 px-4 py-3 bg-card border-b border-border">
        <button onClick={() => setSelectedTable(null)} className="p-2 rounded-lg hover:bg-muted"><ArrowLeft className="w-5 h-5 text-foreground" /></button>
        <div className="flex-1">
          <h2 className="font-semibold text-foreground">Table {selectedTable}</h2>
          <p className="text-xs text-muted-foreground">{cart.length} new • {sentOrder?.items.length || 0} sent</p>
        </div>
        <button onClick={() => setShowCart(!showCart)} className="relative p-2 rounded-lg gradient-primary text-primary-foreground">
          <ShoppingCart className="w-5 h-5" />
          {cart.length > 0 && <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-destructive text-destructive-foreground text-xs flex items-center justify-center font-bold">{cart.length}</span>}
        </button>
      </div>

      <div className="flex-1 flex overflow-hidden">
        <div className={`flex-1 flex flex-col overflow-hidden ${showCart ? 'hidden md:flex' : ''}`}>
          <div className="px-4 pt-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input type="text" placeholder="Search menu..." value={search} onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-muted border-0 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" />
            </div>
          </div>
          <div className="flex gap-2 px-4 py-3 overflow-x-auto no-scrollbar">
            {categories.map((cat) => (
              <button key={cat} onClick={() => setActiveCategory(cat)}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${activeCategory === cat ? 'gradient-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:text-foreground'}`}>
                {cat}
              </button>
            ))}
          </div>
          <div className="flex-1 overflow-y-auto px-4 pb-4">
            {menuLoading ? (
              <div className="flex items-center justify-center py-16 text-muted-foreground"><Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading menu…</div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <AnimatePresence mode="popLayout">
                  {filteredItems.map((item) => <FoodItemCard key={item.id} item={item} onAdd={addToCart} />)}
                </AnimatePresence>
              </div>
            )}
            {!menuLoading && filteredItems.length === 0 && <p className="text-center text-muted-foreground mt-10">No items found</p>}
          </div>
        </div>

        <div className={`${showCart ? 'flex' : 'hidden md:flex'} flex-col w-full md:w-80 lg:w-96 border-l border-border bg-card`}>
          <div className="p-4 border-b border-border flex items-center justify-between">
            <h3 className="font-semibold text-foreground">Invoice</h3>
            <button onClick={() => setShowCart(false)} className="md:hidden text-muted-foreground text-sm">Close</button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* Already sent to kitchen */}
            {sentOrder && sentOrder.items.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Sent to kitchen</p>
                  {sentOrder.items.some((i) => i.status === 'ready') && (
                    <button
                      onClick={() => sentOrder.items.forEach((i) => i.status === 'ready' && serveItem(sentOrder, i.menuItem.id))}
                      className="text-[11px] font-medium text-success hover:underline">
                      Serve all ready
                    </button>
                  )}
                </div>
                {sentOrder.items.map((item) => {
                  const st = SENT_STATUS[item.status] ?? SENT_STATUS.added;
                  return (
                    <div key={item.menuItem.id} className="flex items-center justify-between gap-3 py-2 border-b border-border last:border-0">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{item.menuItem.name}</p>
                        <p className="text-xs text-muted-foreground">×{item.quantity} · ₹{item.menuItem.price * item.quantity}</p>
                      </div>
                      {item.status === 'ready' ? (
                        <button onClick={() => serveItem(sentOrder, item.menuItem.id)}
                          className="px-3 py-1.5 rounded-lg bg-success text-success-foreground text-xs font-medium flex items-center gap-1 flex-shrink-0">
                          <Check className="w-3.5 h-3.5" /> Serve
                        </button>
                      ) : (
                        <span className={`text-[10px] px-2 py-1 rounded-md font-medium capitalize flex-shrink-0 ${st.cls}`}>{st.label}</span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* New items (local cart) */}
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">New items</p>
              {cart.length === 0 ? (
                <p className="text-center text-muted-foreground py-6 text-sm">Tap + on a dish to add it</p>
              ) : cart.map((item) => (
                <div key={item.menuItem.id} className="flex items-center gap-3 py-2 border-b border-border last:border-0">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{item.menuItem.name}</p>
                    <p className="text-xs text-muted-foreground">₹{item.menuItem.price} each</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => setQty(item.menuItem.id, item.quantity - 1)} className="w-7 h-7 rounded-full bg-muted flex items-center justify-center"><Minus className="w-3 h-3" /></button>
                    <span className="text-sm font-medium w-5 text-center">{item.quantity}</span>
                    <button onClick={() => setQty(item.menuItem.id, item.quantity + 1)} className="w-7 h-7 rounded-full gradient-primary text-primary-foreground flex items-center justify-center"><Plus className="w-3 h-3" /></button>
                  </div>
                  <p className="text-sm font-semibold text-foreground w-14 text-right">₹{item.menuItem.price * item.quantity}</p>
                  <button onClick={() => removeFromCart(item.menuItem.id)} className="text-destructive p-1"><Trash2 className="w-4 h-4" /></button>
                </div>
              ))}
            </div>
          </div>

          {cart.length > 0 && (
            <div className="p-4 border-t border-border space-y-2">
              <div className="flex justify-between text-sm"><span className="text-muted-foreground">Subtotal (new)</span><span className="font-medium text-foreground">₹{cartTotal}</span></div>
              <div className="flex justify-between text-sm"><span className="text-muted-foreground">Tax ({settings.taxPercent}%)</span><span className="font-medium text-foreground">₹{(cartTotal * settings.taxPercent / 100).toFixed(1)}</span></div>
              <div className="flex justify-between text-base font-bold pt-2 border-t border-border"><span className="text-foreground">Total</span><span className="text-primary">₹{(cartTotal * (1 + settings.taxPercent / 100)).toFixed(1)}</span></div>
              <button onClick={handleSend} disabled={sending}
                className="w-full mt-3 py-3 rounded-xl gradient-primary text-primary-foreground font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-60">
                {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />} Send to Kitchen
              </button>
            </div>
          )}

          {/* Checkout / free the table once customers are done */}
          {sentOrder && sentOrder.items.length > 0 && (
            <div className="p-4 border-t border-border space-y-3">
              <div className="flex justify-between text-base font-bold">
                <span className="text-foreground">Order Total</span>
                <span className="text-primary">
                  ₹{(sentOrder.items.reduce((s, i) => s + i.menuItem.price * i.quantity, 0) * (1 + settings.taxPercent / 100)).toFixed(0)}
                </span>
              </div>
              <button onClick={() => handleClose(sentOrder)} disabled={closing}
                className="w-full py-2.5 rounded-xl bg-destructive/10 text-destructive font-medium text-sm flex items-center justify-center gap-2 hover:bg-destructive/20 transition-colors disabled:opacity-60">
                {closing ? <Loader2 className="w-4 h-4 animate-spin" /> : <DoorOpen className="w-4 h-4" />} Close &amp; Free Table
              </button>
              <p className="text-[11px] text-muted-foreground text-center">Frees the table · cashier settles the bill</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DineInPage;
