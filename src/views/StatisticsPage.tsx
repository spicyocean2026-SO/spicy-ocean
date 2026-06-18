"use client";

import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { BarChart3, TrendingUp, ShoppingCart, DollarSign, Award } from 'lucide-react';
import { useRestaurant } from '@/context/RestaurantContext';
import { useRouter } from 'next/navigation';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

type FilterPeriod = 'today' | 'week' | 'month';

const StatisticsPage: React.FC = () => {
  const { isCounterAuthenticated, orderHistory, settings } = useRestaurant();
  const router = useRouter();
  const [period, setPeriod] = useState<FilterPeriod>('today');

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfWeek = new Date(startOfToday);
  startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const filterStart = period === 'today' ? startOfToday : period === 'week' ? startOfWeek : startOfMonth;

  const filteredOrders = useMemo(() => {
    return orderHistory.filter(o => new Date(o.timestamp) >= filterStart);
  }, [orderHistory, filterStart.getTime()]);

  const totalOrders = filteredOrders.length;
  const totalRevenue = filteredOrders.reduce((s, o) => s + o.total * (1 + settings.taxPercent / 100), 0);

  const itemCounts: Record<string, number> = {};
  filteredOrders.forEach(o => o.items.forEach(i => {
    itemCounts[i.name] = (itemCounts[i.name] || 0) + i.quantity;
  }));
  const topItem = Object.entries(itemCounts).sort((a, b) => b[1] - a[1])[0];

  const chartData = useMemo(() => {
    const buckets: Record<string, { label: string; orders: number; revenue: number }> = {};
    filteredOrders.forEach(o => {
      const d = new Date(o.timestamp);
      const key = period === 'today' ? `${d.getHours()}:00` : `${d.getMonth() + 1}/${d.getDate()}`;
      if (!buckets[key]) buckets[key] = { label: key, orders: 0, revenue: 0 };
      buckets[key].orders++;
      buckets[key].revenue += o.total * (1 + settings.taxPercent / 100);
    });
    return Object.values(buckets);
  }, [filteredOrders, period]);

  const itemChartData = useMemo(() => {
    return Object.entries(itemCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([name, count]) => ({ name: name.length > 12 ? name.slice(0, 12) + '…' : name, count }));
  }, [filteredOrders]);

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

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <BarChart3 className="w-7 h-7 text-primary" /> Statistics
          </h2>
          <p className="text-sm text-muted-foreground mt-1">Business analytics & insights</p>
        </div>
        <div className="flex gap-2">
          {(['today', 'week', 'month'] as FilterPeriod[]).map(p => (
            <button key={p} onClick={() => setPeriod(p)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors capitalize ${period === p ? 'gradient-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
              {p === 'today' ? 'Today' : p === 'week' ? 'This Week' : 'This Month'}
            </button>
          ))}
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          className="bg-card rounded-xl border border-border p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg gradient-primary flex items-center justify-center">
              <ShoppingCart className="w-5 h-5 text-primary-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">Total Orders</p>
          </div>
          <p className="text-3xl font-bold text-foreground">{totalOrders}</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
          className="bg-card rounded-xl border border-border p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg gradient-accent flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-accent-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">Total Revenue</p>
          </div>
          <p className="text-3xl font-bold text-primary">₹{totalRevenue.toFixed(0)}</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="bg-card rounded-xl border border-border p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-highlight flex items-center justify-center">
              <Award className="w-5 h-5 text-highlight-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">Most Ordered</p>
          </div>
          <p className="text-lg font-bold text-foreground truncate">{topItem ? `${topItem[0]} (${topItem[1]})` : 'N/A'}</p>
        </motion.div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          className="bg-card rounded-xl border border-border p-4 shadow-sm">
          <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" /> Revenue Trend
          </h3>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="label" tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
                <YAxis tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
                <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8 }} />
                <Line type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ fill: 'hsl(var(--primary))' }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-center text-muted-foreground py-16">No data for this period</p>
          )}
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="bg-card rounded-xl border border-border p-4 shadow-sm">
          <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-secondary" /> Items Sold
          </h3>
          {itemChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={itemChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
                <YAxis tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
                <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8 }} />
                <Bar dataKey="count" fill="hsl(var(--secondary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-center text-muted-foreground py-16">No data for this period</p>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default StatisticsPage;
