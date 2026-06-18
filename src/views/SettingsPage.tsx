"use client";

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Settings, Plus, ArrowLeft, Volume2, VolumeX, KeyRound, Pencil, Trash2, Check, X } from 'lucide-react';
import { toast } from 'sonner';
import { useRestaurant } from '@/context/RestaurantContext';
import { useRouter } from 'next/navigation';

const categories = ['Soups', 'Starters', 'Biriyani', 'Cocktails'];

const SettingsPage: React.FC = () => {
  const { isCounterAuthenticated, menuItems, addMenuItem, updateMenuItem, deleteMenuItem, settings, updateSettings, playOrderSound, changePin } = useRestaurant();
  const router = useRouter();
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState(categories[0]);
  const [showPinChange, setShowPinChange] = useState(false);
  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editPrice, setEditPrice] = useState('');

  const startEdit = (item: typeof menuItems[number]) => {
    setEditingId(item.id);
    setEditName(item.name);
    setEditPrice(String(item.price));
  };
  const cancelEdit = () => { setEditingId(null); setEditName(''); setEditPrice(''); };
  const saveEdit = (id: string) => {
    const p = parseFloat(editPrice);
    if (!editName.trim() || isNaN(p) || p < 0) { toast.error('Enter a valid name and price'); return; }
    updateMenuItem(id, { name: editName.trim(), price: p });
    cancelEdit();
  };

  if (!isCounterAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-[80vh] p-4">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Please login via Counter Dashboard first</p>
          <button onClick={() => router.push('/counter')} className="px-4 py-2 rounded-lg gradient-primary text-primary-foreground font-medium text-sm">Go to Counter</button>
        </div>
      </div>
    );
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !price.trim()) return;
    addMenuItem({ name: name.trim(), price: parseFloat(price), category });
    setName('');
    setPrice('');
  };

  const handlePinChange = () => {
    if (newPin !== confirmPin) {
      toast.error('New PINs do not match');
      return;
    }
    const success = changePin(currentPin, newPin);
    if (success) {
      setCurrentPin('');
      setNewPin('');
      setConfirmPin('');
      setShowPinChange(false);
    }
  };

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => router.push('/counter')} className="p-2 rounded-lg hover:bg-muted">
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <div>
          <h2 className="text-2xl font-bold text-foreground flex items-center gap-2"><Settings className="w-7 h-7 text-primary" /> Settings</h2>
          <p className="text-sm text-muted-foreground">Manage your menu & preferences</p>
        </div>
      </div>

      {/* General Settings */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        className="bg-card rounded-xl border border-border p-6 shadow-sm mb-6 space-y-4">
        <h3 className="font-semibold text-foreground">General Settings</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-foreground mb-1 block">Tax Rate (%)</label>
            <input type="number" value={settings.taxPercent} onChange={e => updateSettings({ taxPercent: parseFloat(e.target.value) || 0 })}
              className="w-full px-4 py-2.5 rounded-xl bg-muted border-0 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground mb-1 block">GST Number</label>
            <input type="text" value={settings.gstNumber} onChange={e => updateSettings({ gstNumber: e.target.value })} placeholder="e.g. 29ABCDE1234F1Z5"
              className="w-full px-4 py-2.5 rounded-xl bg-muted border-0 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" />
          </div>
        </div>
        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center gap-2">
            {settings.soundEnabled ? <Volume2 className="w-5 h-5 text-primary" /> : <VolumeX className="w-5 h-5 text-muted-foreground" />}
            <span className="text-sm font-medium text-foreground">Notification Sounds</span>
          </div>
          <button onClick={() => { updateSettings({ soundEnabled: !settings.soundEnabled }); if (!settings.soundEnabled) playOrderSound(); }}
            className={`w-12 h-7 rounded-full transition-colors relative ${settings.soundEnabled ? 'bg-primary' : 'bg-muted'}`}>
            <span className={`block w-5 h-5 rounded-full bg-white shadow-sm absolute top-1 transition-transform ${settings.soundEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
          </button>
        </div>
      </motion.div>

      {/* Change PIN */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
        className="bg-card rounded-xl border border-border p-6 shadow-sm mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-foreground flex items-center gap-2"><KeyRound className="w-5 h-5 text-primary" /> Security</h3>
          <button onClick={() => setShowPinChange(!showPinChange)}
            className="px-4 py-2 rounded-lg bg-muted text-sm font-medium text-foreground hover:bg-muted/70 transition-colors">
            {showPinChange ? 'Cancel' : 'Change PIN'}
          </button>
        </div>
        {showPinChange && (
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">Current PIN</label>
              <input type="password" maxLength={4} value={currentPin} onChange={e => setCurrentPin(e.target.value.replace(/\D/g, ''))}
                className="w-full px-4 py-2.5 rounded-xl bg-muted border-0 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" placeholder="••••" />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">New PIN</label>
              <input type="password" maxLength={4} value={newPin} onChange={e => setNewPin(e.target.value.replace(/\D/g, ''))}
                className="w-full px-4 py-2.5 rounded-xl bg-muted border-0 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" placeholder="••••" />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">Confirm New PIN</label>
              <input type="password" maxLength={4} value={confirmPin} onChange={e => setConfirmPin(e.target.value.replace(/\D/g, ''))}
                className="w-full px-4 py-2.5 rounded-xl bg-muted border-0 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" placeholder="••••" />
            </div>
            <button onClick={handlePinChange} className="w-full py-2.5 rounded-xl gradient-primary text-primary-foreground font-semibold text-sm">
              Update PIN
            </button>
          </div>
        )}
      </motion.div>

      {/* Add Item Form */}
      <motion.form onSubmit={handleSubmit} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="bg-card rounded-xl border border-border p-6 shadow-sm mb-6">
        <h3 className="font-semibold text-foreground mb-4">Add New Item</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-foreground mb-1 block">Item Name</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Chicken Curry"
              className="w-full px-4 py-2.5 rounded-xl bg-muted border-0 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground mb-1 block">Price (₹)</label>
            <input type="number" value={price} onChange={e => setPrice(e.target.value)} placeholder="e.g. 250"
              className="w-full px-4 py-2.5 rounded-xl bg-muted border-0 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground mb-1 block">Category</label>
            <select value={category} onChange={e => setCategory(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-muted border-0 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30">
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="flex items-end">
            <button type="submit" className="w-full py-2.5 rounded-xl gradient-primary text-primary-foreground font-semibold text-sm flex items-center justify-center gap-2">
              <Plus className="w-4 h-4" /> Add Item
            </button>
          </div>
        </div>
      </motion.form>

      {/* Current Menu */}
      <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-border">
          <h3 className="font-semibold text-foreground">Current Menu ({menuItems.length} items)</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Tap the pencil icon to edit price or name</p>
        </div>
        <div className="divide-y divide-border max-h-[28rem] overflow-y-auto">
          {menuItems.map(item => (
            <div key={item.id} className="flex items-center justify-between gap-3 px-4 py-3">
              {editingId === item.id ? (
                <>
                  <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <input value={editName} onChange={e => setEditName(e.target.value)}
                      className="px-3 py-2 rounded-lg bg-muted text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" />
                    <input type="number" value={editPrice} onChange={e => setEditPrice(e.target.value)}
                      className="px-3 py-2 rounded-lg bg-muted text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" />
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => saveEdit(item.id)} className="p-2 rounded-lg bg-primary/10 text-primary hover:bg-primary/20"><Check className="w-4 h-4" /></button>
                    <button onClick={cancelEdit} className="p-2 rounded-lg bg-muted text-muted-foreground hover:bg-muted/70"><X className="w-4 h-4" /></button>
                  </div>
                </>
              ) : (
                <>
                  <div className="min-w-0">
                    <p className="font-medium text-foreground text-sm truncate">{item.name}</p>
                    <p className="text-xs text-muted-foreground">{item.category}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-primary text-sm">₹{item.price}</p>
                    <button onClick={() => startEdit(item)} className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground"><Pencil className="w-4 h-4" /></button>
                    <button onClick={() => { if (confirm(`Remove ${item.name}?`)) deleteMenuItem(item.id); }}
                      className="p-2 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
