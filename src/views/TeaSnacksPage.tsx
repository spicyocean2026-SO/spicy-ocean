"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Coffee, Minus, Plus, ShoppingCart, Trash2 } from 'lucide-react';
import { useRestaurant } from '@/context/RestaurantContext';
import FoodItemCard from '@/components/FoodItemCard';

const categories = ['All', 'Tea', 'Veg Snacks', 'Non-Veg Snacks'];

const TeaSnacksPage: React.FC = () => {
  const {
    teaSnacksItems, teaSnacksOrders, createTeaSnacksOrder,
    addItemToTeaSnacks, removeItemFromTeaSnacks, updateTeaSnacksItemQuantity, settings,
  } = useRestaurant();
  const [activeOrderId, setActiveOrderId] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState('All');
  const [search, setSearch] = useState('');
  const [showCart, setShowCart] = useState(false);

  const filteredItems = teaSnacksItems.filter(item => {
    const matchCategory = activeCategory === 'All' || item.category === activeCategory;
    const matchSearch = item.name.toLowerCase().includes(search.toLowerCase());
    return matchCategory && matchSearch;
  });

  const currentOrder = activeOrderId ? teaSnacksOrders[activeOrderId] : null;
  const cartItems = currentOrder?.items || [];
  const cartTotal = cartItems.reduce((sum, i) => sum + i.menuItem.price * i.quantity, 0);

  const activeList = Object.entries(teaSnacksOrders).filter(([, o]) => o.items.length > 0 || o.paymentStatus === 'pending');

  if (!activeOrderId) {
    return (
      <div className="p-4 md:p-6 max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Coffee className="w-7 h-7 text-primary" /> Tea & Snacks
            </h2>
            <p className="text-sm text-muted-foreground mt-1">Quick bites & beverages</p>
          </div>
          <button onClick={() => { const id = createTeaSnacksOrder(); setActiveOrderId(id); }}
            className="px-5 py-2.5 rounded-xl gradient-primary text-primary-foreground font-semibold text-sm">
            + New Order
          </button>
        </div>

        {activeList.length === 0 ? (
          <div className="text-center py-20">
            <Coffee className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-muted-foreground">No tea & snacks orders yet</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {activeList.map(([id, order]) => (
              <motion.button key={id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                onClick={() => setActiveOrderId(id)}
                className="p-4 rounded-xl bg-card border border-border shadow-sm text-left hover:border-primary/50 transition-colors">
                <p className="font-semibold text-foreground text-sm">{id}</p>
                <p className="text-xs text-muted-foreground mt-1">{order.items.length} items</p>
                <p className="text-sm font-bold text-primary mt-2">
                  ₹{order.items.reduce((s, i) => s + i.menuItem.price * i.quantity, 0)}
                </p>
              </motion.button>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-48px)]">
      <div className="flex items-center gap-3 px-4 py-3 bg-card border-b border-border">
        <button onClick={() => setActiveOrderId(null)} className="p-2 rounded-lg hover:bg-muted">
          <Coffee className="w-5 h-5 text-foreground" />
        </button>
        <div className="flex-1">
          <h2 className="font-semibold text-foreground">{activeOrderId}</h2>
          <p className="text-xs text-muted-foreground">{cartItems.length} items • Tea & Snacks</p>
        </div>
        <button onClick={() => setShowCart(!showCart)} className="relative p-2 rounded-lg gradient-primary text-primary-foreground">
          <ShoppingCart className="w-5 h-5" />
          {cartItems.length > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-destructive text-destructive-foreground text-xs flex items-center justify-center font-bold">
              {cartItems.length}
            </span>
          )}
        </button>
      </div>

      <div className="flex-1 flex overflow-hidden">
        <div className={`flex-1 flex flex-col overflow-hidden ${showCart ? 'hidden md:flex' : ''}`}>
          <div className="px-4 pt-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input type="text" placeholder="Search tea & snacks..." value={search} onChange={e => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-muted border-0 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" />
            </div>
          </div>
          <div className="flex gap-2 px-4 py-3 overflow-x-auto no-scrollbar">
            {categories.map(cat => (
              <button key={cat} onClick={() => setActiveCategory(cat)}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${activeCategory === cat ? 'gradient-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:text-foreground'}`}>
                {cat}
              </button>
            ))}
          </div>
          <div className="flex-1 overflow-y-auto px-4 pb-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <AnimatePresence mode="popLayout">
                {filteredItems.map(item => (
                  <FoodItemCard key={item.id} item={item} onAdd={(i) => addItemToTeaSnacks(activeOrderId, i)} />
                ))}
              </AnimatePresence>
            </div>
            {filteredItems.length === 0 && <p className="text-center text-muted-foreground mt-10">No items found</p>}
          </div>
        </div>

        <AnimatePresence>
          <motion.div initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }}
            className={`${showCart ? 'flex' : 'hidden md:flex'} flex-col w-full md:w-80 lg:w-96 border-l border-border bg-card`}>
            <div className="p-4 border-b border-border">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-foreground">Invoice</h3>
                <button onClick={() => setShowCart(false)} className="md:hidden text-muted-foreground text-sm">Close</button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {cartItems.length === 0 ? (
                <p className="text-center text-muted-foreground py-10 text-sm">No items added yet</p>
              ) : cartItems.map(item => (
                <div key={item.menuItem.id} className="flex items-center gap-3 py-2 border-b border-border last:border-0">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{item.menuItem.name}</p>
                    <p className="text-xs text-muted-foreground">₹{item.menuItem.price} each</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => updateTeaSnacksItemQuantity(activeOrderId, item.menuItem.id, item.quantity - 1)}
                      className="w-7 h-7 rounded-full bg-muted flex items-center justify-center"><Minus className="w-3 h-3" /></button>
                    <span className="text-sm font-medium w-5 text-center">{item.quantity}</span>
                    <button onClick={() => updateTeaSnacksItemQuantity(activeOrderId, item.menuItem.id, item.quantity + 1)}
                      className="w-7 h-7 rounded-full gradient-primary text-primary-foreground flex items-center justify-center"><Plus className="w-3 h-3" /></button>
                  </div>
                  <p className="text-sm font-semibold text-foreground w-14 text-right">₹{item.menuItem.price * item.quantity}</p>
                  <button onClick={() => removeItemFromTeaSnacks(activeOrderId, item.menuItem.id)} className="text-destructive p-1">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
            {cartItems.length > 0 && (
              <div className="p-4 border-t border-border space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-medium text-foreground">₹{cartTotal}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Tax ({settings.taxPercent}%)</span>
                  <span className="font-medium text-foreground">₹{(cartTotal * settings.taxPercent / 100).toFixed(1)}</span>
                </div>
                <div className="flex justify-between text-base font-bold pt-2 border-t border-border">
                  <span className="text-foreground">Total</span>
                  <span className="text-primary">₹{(cartTotal * (1 + settings.taxPercent / 100)).toFixed(1)}</span>
                </div>
                <button onClick={() => { setShowCart(false); setActiveOrderId(null); }}
                  className="w-full mt-3 py-3 rounded-xl gradient-primary text-primary-foreground font-semibold text-sm">
                  Send to Kitchen
                </button>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default TeaSnacksPage;
