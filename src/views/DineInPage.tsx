"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, ArrowLeft, Minus, Plus, ShoppingCart, Trash2 } from 'lucide-react';
import { useRestaurant } from '@/context/RestaurantContext';
import TableCard from '@/components/TableCard';
import FoodItemCard from '@/components/FoodItemCard';

const categories = ['All', 'Soups', 'Starters', 'Biriyani', 'Cocktails'];

const DineInPage: React.FC = () => {
  const { tables, orders, menuItems, addItemToTable, removeItemFromTable, updateItemQuantity, settings } = useRestaurant();
  const [selectedTable, setSelectedTable] = useState<number | null>(null);
  const [activeCategory, setActiveCategory] = useState('All');
  const [search, setSearch] = useState('');
  const [showCart, setShowCart] = useState(false);

  const filteredItems = menuItems.filter(item => {
    const matchCategory = activeCategory === 'All' || item.category === activeCategory;
    const matchSearch = item.name.toLowerCase().includes(search.toLowerCase());
    return matchCategory && matchSearch;
  });

  const tableKey = selectedTable ? `table_${selectedTable}` : null;
  const currentOrder = tableKey ? orders[tableKey] : null;
  const cartItems = currentOrder?.items || [];
  const cartTotal = cartItems.reduce((sum, i) => sum + i.menuItem.price * i.quantity, 0);

  if (!selectedTable) {
    return (
      <div className="p-4 md:p-6 max-w-6xl mx-auto">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-foreground">Select a Table</h2>
          <p className="text-sm text-muted-foreground mt-1">Choose a table to start taking orders</p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {tables.map(t => (
            <TableCard key={t} tableNumber={t} hasOrder={!!(orders[`table_${t}`]?.items.length)} itemCount={orders[`table_${t}`]?.items.length || 0} onClick={() => setSelectedTable(t)} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-48px)]">
      <div className="flex items-center gap-3 px-4 py-3 bg-card border-b border-border">
        <button onClick={() => setSelectedTable(null)} className="p-2 rounded-lg hover:bg-muted"><ArrowLeft className="w-5 h-5 text-foreground" /></button>
        <div className="flex-1">
          <h2 className="font-semibold text-foreground">Table {selectedTable}</h2>
          <p className="text-xs text-muted-foreground">{cartItems.length} items</p>
        </div>
        <button onClick={() => setShowCart(!showCart)} className="relative p-2 rounded-lg gradient-primary text-primary-foreground">
          <ShoppingCart className="w-5 h-5" />
          {cartItems.length > 0 && <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-destructive text-destructive-foreground text-xs flex items-center justify-center font-bold">{cartItems.length}</span>}
        </button>
      </div>

      <div className="flex-1 flex overflow-hidden">
        <div className={`flex-1 flex flex-col overflow-hidden ${showCart ? 'hidden md:flex' : ''}`}>
          <div className="px-4 pt-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input type="text" placeholder="Search menu..." value={search} onChange={e => setSearch(e.target.value)}
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
                  <FoodItemCard key={item.id} item={item} onAdd={(i) => addItemToTable(selectedTable, i)} />
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
                    <button onClick={() => updateItemQuantity(tableKey!, item.menuItem.id, item.quantity - 1)} className="w-7 h-7 rounded-full bg-muted flex items-center justify-center"><Minus className="w-3 h-3" /></button>
                    <span className="text-sm font-medium w-5 text-center">{item.quantity}</span>
                    <button onClick={() => updateItemQuantity(tableKey!, item.menuItem.id, item.quantity + 1)} className="w-7 h-7 rounded-full gradient-primary text-primary-foreground flex items-center justify-center"><Plus className="w-3 h-3" /></button>
                  </div>
                  <p className="text-sm font-semibold text-foreground w-14 text-right">₹{item.menuItem.price * item.quantity}</p>
                  <button onClick={() => removeItemFromTable(tableKey!, item.menuItem.id)} className="text-destructive p-1"><Trash2 className="w-4 h-4" /></button>
                </div>
              ))}
            </div>
            {cartItems.length > 0 && (
              <div className="p-4 border-t border-border space-y-2">
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">Subtotal</span><span className="font-medium text-foreground">₹{cartTotal}</span></div>
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">Tax ({settings.taxPercent}%)</span><span className="font-medium text-foreground">₹{(cartTotal * settings.taxPercent / 100).toFixed(1)}</span></div>
                <div className="flex justify-between text-base font-bold pt-2 border-t border-border"><span className="text-foreground">Total</span><span className="text-primary">₹{(cartTotal * (1 + settings.taxPercent / 100)).toFixed(1)}</span></div>
                <button onClick={() => { setShowCart(false); setSelectedTable(null); }} className="w-full mt-3 py-3 rounded-xl gradient-primary text-primary-foreground font-semibold text-sm">Send to Kitchen</button>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default DineInPage;
