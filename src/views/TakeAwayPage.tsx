"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, ArrowLeft, Minus, Plus, ShoppingCart, Trash2, PackageOpen, Send, Loader2 } from 'lucide-react';
import { useRestaurant, CartLine, MenuItem } from '@/context/RestaurantContext';
import FoodItemCard from '@/components/FoodItemCard';
import OrderCard from '@/components/OrderCard';

const categories = ['All', 'Soups', 'Starters', 'Biriyani', 'Cocktails'];

const TakeAwayPage: React.FC = () => {
  const { menuItems, menuLoading, activeOrders, placeOrder, settings } = useRestaurant();
  const [mode, setMode] = useState<'list' | 'new'>('list');
  const [viewOrderId, setViewOrderId] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState('All');
  const [search, setSearch] = useState('');
  const [showCart, setShowCart] = useState(false);
  const [cart, setCart] = useState<CartLine[]>([]);
  const [sending, setSending] = useState(false);

  const takeAwayOrders = activeOrders.filter((o) => o.type === 'TAKE_AWAY');

  const filteredItems = menuItems.filter((item) => {
    const matchCategory = activeCategory === 'All' || item.category === activeCategory;
    const matchSearch = item.name.toLowerCase().includes(search.toLowerCase());
    return matchCategory && matchSearch;
  });

  const addToCart = (item: MenuItem) => setCart((prev) => {
    const ex = prev.find((c) => c.menuItem.id === item.id);
    if (ex) return prev.map((c) => (c.menuItem.id === item.id ? { ...c, quantity: c.quantity + 1 } : c));
    return [...prev, { menuItem: item, quantity: 1 }];
  });
  const setQty = (id: string, qty: number) => setCart((prev) =>
    qty <= 0 ? prev.filter((c) => c.menuItem.id !== id) : prev.map((c) => (c.menuItem.id === id ? { ...c, quantity: qty } : c)));
  const removeFromCart = (id: string) => setCart((prev) => prev.filter((c) => c.menuItem.id !== id));
  const cartTotal = cart.reduce((s, c) => s + c.menuItem.price * c.quantity, 0);

  const startNew = () => { setCart([]); setShowCart(false); setMode('new'); };

  const handleSend = async () => {
    if (cart.length === 0) return;
    setSending(true);
    const res = await placeOrder({ type: 'TAKE_AWAY', items: cart });
    setSending(false);
    if (res) { setCart([]); setMode('list'); }
  };

  // ---- View a single existing take-away order (read-only status) ----
  const viewed = viewOrderId ? takeAwayOrders.find((o) => o.orderId === viewOrderId) : null;
  if (viewed) {
    const total = viewed.items.reduce((s, i) => s + i.menuItem.price * i.quantity, 0);
    return (
      <div className="p-4 md:p-6 max-w-2xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => setViewOrderId(null)} className="p-2 rounded-lg hover:bg-muted"><ArrowLeft className="w-5 h-5" /></button>
          <div>
            <h2 className="text-xl font-bold text-foreground">{viewed.orderNo}</h2>
            <p className="text-sm text-muted-foreground">Take Away · {viewed.paymentStatus}</p>
          </div>
        </div>
        <div className="bg-card rounded-xl border border-border p-4 shadow-sm">
          {viewed.items.map((item) => <OrderCard key={item.menuItem.id} item={item} />)}
          <div className="flex justify-between pt-3 mt-2 border-t border-border font-bold">
            <span>Total</span><span className="text-primary">₹{(total * (1 + settings.taxPercent / 100)).toFixed(0)}</span>
          </div>
        </div>
      </div>
    );
  }

  // ---- New order (cart builder) ----
  if (mode === 'new') {
    return (
      <div className="flex flex-col h-[calc(100vh-48px)]">
        <div className="flex items-center gap-3 px-4 py-3 bg-card border-b border-border">
          <button onClick={() => setMode('list')} className="p-2 rounded-lg hover:bg-muted"><ArrowLeft className="w-5 h-5 text-foreground" /></button>
          <div className="flex-1">
            <h2 className="font-semibold text-foreground">New Take Away</h2>
            <p className="text-xs text-muted-foreground">{cart.length} items</p>
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
            </div>
          </div>

          <div className={`${showCart ? 'flex' : 'hidden md:flex'} flex-col w-full md:w-80 lg:w-96 border-l border-border bg-card`}>
            <div className="p-4 border-b border-border flex items-center justify-between">
              <h3 className="font-semibold text-foreground">Invoice</h3>
              <button onClick={() => setShowCart(false)} className="md:hidden text-muted-foreground text-sm">Close</button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {cart.length === 0 ? (
                <p className="text-center text-muted-foreground py-10 text-sm">No items added yet</p>
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
            {cart.length > 0 && (
              <div className="p-4 border-t border-border space-y-2">
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">Subtotal</span><span className="font-medium text-foreground">₹{cartTotal}</span></div>
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">Tax ({settings.taxPercent}%)</span><span className="font-medium text-foreground">₹{(cartTotal * settings.taxPercent / 100).toFixed(1)}</span></div>
                <div className="flex justify-between text-base font-bold pt-2 border-t border-border"><span className="text-foreground">Total</span><span className="text-primary">₹{(cartTotal * (1 + settings.taxPercent / 100)).toFixed(1)}</span></div>
                <button onClick={handleSend} disabled={sending} className="w-full mt-3 py-3 rounded-xl gradient-primary text-primary-foreground font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-60">
                  {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />} Send to Kitchen
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ---- List of active take-away orders ----
  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-foreground flex items-center gap-2"><PackageOpen className="w-7 h-7 text-primary" /> Take Away</h2>
          <p className="text-sm text-muted-foreground mt-1">Create and track take away orders</p>
        </div>
        <button onClick={startNew} className="px-5 py-2.5 rounded-xl gradient-primary text-primary-foreground font-semibold text-sm">+ New Order</button>
      </div>

      {takeAwayOrders.length === 0 ? (
        <div className="text-center py-20">
          <PackageOpen className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
          <p className="text-muted-foreground">No take away orders yet</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {takeAwayOrders.map((order) => {
            const ready = order.items.every((i) => i.status === 'ready' || i.status === 'completed');
            return (
              <motion.button key={order.orderId} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                onClick={() => setViewOrderId(order.orderId!)}
                className={`p-4 rounded-xl border shadow-sm text-left transition-colors ${ready ? 'border-success/50 bg-success/5' : 'bg-card border-border hover:border-primary/50'}`}>
                <p className="font-semibold text-foreground text-sm truncate">{order.orderNo}</p>
                <p className="text-xs text-muted-foreground mt-1">{order.items.length} items</p>
                <p className={`text-xs font-medium mt-1 ${ready ? 'text-success' : 'text-primary'}`}>{ready ? 'Ready to serve' : 'Preparing…'}</p>
                <p className="text-sm font-bold text-primary mt-1">₹{order.items.reduce((s, i) => s + i.menuItem.price * i.quantity, 0)}</p>
              </motion.button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default TakeAwayPage;
