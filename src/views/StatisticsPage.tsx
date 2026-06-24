"use client";

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { BarChart3, TrendingUp, ShoppingCart, DollarSign, Award, Download, Loader2 } from 'lucide-react';
import { useRestaurant } from '@/context/RestaurantContext';
import { useRouter } from 'next/navigation';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

type FilterPeriod = 'today' | 'week' | 'month';

interface ItemSold { name: string; quantity: number; revenue: number }
interface Stats {
  totalOrders: number;
  revenue: number;
  topItem: ItemSold | null;
  itemsSold: ItemSold[];
  points: { t: string; revenue: number }[];
}

const periodLabel: Record<FilterPeriod, string> = { today: 'Today', week: 'This Week', month: 'This Month' };

function startFor(period: FilterPeriod): Date {
  const now = new Date();
  const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (period === 'today') return startToday;
  if (period === 'week') { const d = new Date(startToday); d.setDate(d.getDate() - d.getDay()); return d; }
  return new Date(now.getFullYear(), now.getMonth(), 1);
}

const csvCell = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;

const StatisticsPage: React.FC = () => {
  const { isCounterAuthenticated, settings } = useRestaurant();
  const router = useRouter();
  const [period, setPeriod] = useState<FilterPeriod>('today');
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const tax = settings.taxPercent;
  const withTax = (n: number) => n * (1 + tax / 100);

  const load = useCallback(async (p: FilterPeriod) => {
    setLoading(true);
    setError(null);
    try {
      const from = startFor(p).toISOString();
      const res = await fetch(`/api/stats?from=${encodeURIComponent(from)}`, { cache: 'no-store' });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Failed to load statistics');
      setStats(data);
    } catch (e: any) {
      setError(e.message || 'Failed to load statistics');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { if (isCounterAuthenticated) load(period); }, [period, isCounterAuthenticated, load]);

  const trend = useMemo(() => {
    if (!stats) return [] as { label: string; orders: number; revenue: number }[];
    const buckets: Record<string, { label: string; orders: number; revenue: number }> = {};
    stats.points.forEach((pt) => {
      const d = new Date(pt.t);
      const key = period === 'today' ? `${d.getHours()}:00` : `${d.getMonth() + 1}/${d.getDate()}`;
      if (!buckets[key]) buckets[key] = { label: key, orders: 0, revenue: 0 };
      buckets[key].orders++;
      buckets[key].revenue += withTax(pt.revenue);
    });
    return Object.values(buckets);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stats, period, tax]);

  const itemChartData = useMemo(() => {
    if (!stats) return [] as { name: string; count: number }[];
    return stats.itemsSold.slice(0, 8).map((i) => ({
      name: i.name.length > 12 ? i.name.slice(0, 12) + '…' : i.name,
      count: i.quantity,
    }));
  }, [stats]);

  const handleExport = () => {
    if (!stats) return;
    const lines: string[] = [];
    lines.push(csvCell(`Spicy Ocean — Statistics (${periodLabel[period]})`));
    lines.push([csvCell('Total Orders'), csvCell(stats.totalOrders)].join(','));
    lines.push([csvCell('Total Revenue (incl tax)'), csvCell(withTax(stats.revenue).toFixed(2))].join(','));
    lines.push('');
    lines.push(['Item', 'Quantity', 'Revenue (incl tax)'].map(csvCell).join(','));
    stats.itemsSold.forEach((i) =>
      lines.push([csvCell(i.name), csvCell(i.quantity), csvCell(withTax(i.revenue).toFixed(2))].join(','))
    );
    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `spicy-ocean-stats-${period}.csv`;
    a.click();
    URL.revokeObjectURL(url);
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

  const totalRevenue = stats ? withTax(stats.revenue) : 0;
  const hasData = !!stats && stats.totalOrders > 0;

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <BarChart3 className="w-7 h-7 text-primary" /> Statistics
          </h2>
          <p className="text-sm text-muted-foreground mt-1">Business analytics &amp; insights</p>
        </div>
        <div className="flex gap-2 items-center">
          {(['today', 'week', 'month'] as FilterPeriod[]).map((p) => (
            <button key={p} onClick={() => setPeriod(p)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${period === p ? 'gradient-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
              {periodLabel[p]}
            </button>
          ))}
          <button onClick={handleExport} disabled={!hasData}
            className="px-4 py-2 rounded-lg text-sm font-medium bg-card border border-border text-foreground flex items-center gap-2 hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed">
            <Download className="w-4 h-4" /> Export
          </button>
        </div>
      </div>

      {error ? (
        <div className="text-center py-16 bg-card rounded-xl border border-border">
          <p className="text-destructive font-medium mb-1">{error}</p>
          <button onClick={() => load(period)} className="mt-3 px-4 py-2 rounded-lg gradient-primary text-primary-foreground text-sm font-medium">Retry</button>
        </div>
      ) : loading ? (
        <div className="flex items-center justify-center py-24 text-muted-foreground"><Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading…</div>
      ) : (
        <>
          {/* Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-card rounded-xl border border-border p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-lg gradient-primary flex items-center justify-center"><ShoppingCart className="w-5 h-5 text-primary-foreground" /></div>
                <p className="text-sm text-muted-foreground">Total Orders</p>
              </div>
              <p className="text-3xl font-bold text-foreground">{stats?.totalOrders ?? 0}</p>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="bg-card rounded-xl border border-border p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-lg gradient-accent flex items-center justify-center"><DollarSign className="w-5 h-5 text-accent-foreground" /></div>
                <p className="text-sm text-muted-foreground">Total Revenue</p>
              </div>
              <p className="text-3xl font-bold text-primary">₹{totalRevenue.toFixed(0)}</p>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-card rounded-xl border border-border p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-lg bg-highlight flex items-center justify-center"><Award className="w-5 h-5 text-highlight-foreground" /></div>
                <p className="text-sm text-muted-foreground">Most Ordered</p>
              </div>
              <p className="text-lg font-bold text-foreground truncate">{stats?.topItem ? `${stats.topItem.name} (${stats.topItem.quantity})` : 'N/A'}</p>
            </motion.div>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="bg-card rounded-xl border border-border p-4 shadow-sm">
              <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2"><TrendingUp className="w-5 h-5 text-primary" /> Revenue Trend</h3>
              {trend.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={trend}>
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

            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-card rounded-xl border border-border p-4 shadow-sm">
              <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2"><BarChart3 className="w-5 h-5 text-secondary" /> Top Selling Items</h3>
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

          {/* Most selling table */}
          {hasData && (
            <div className="bg-card rounded-xl border border-border shadow-sm mt-4 overflow-hidden">
              <div className="px-4 py-3 border-b border-border">
                <h3 className="font-semibold text-foreground">Most Selling — {periodLabel[period]}</h3>
              </div>
              <div className="divide-y divide-border max-h-80 overflow-y-auto">
                {stats!.itemsSold.map((i, idx) => (
                  <div key={i.name} className="flex items-center justify-between px-4 py-2.5">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="w-6 h-6 rounded-md bg-muted text-xs font-bold flex items-center justify-center flex-shrink-0">{idx + 1}</span>
                      <span className="text-sm text-foreground truncate">{i.name}</span>
                    </div>
                    <div className="flex items-center gap-4 flex-shrink-0">
                      <span className="text-sm text-muted-foreground">×{i.quantity}</span>
                      <span className="text-sm font-semibold text-primary w-20 text-right">₹{withTax(i.revenue).toFixed(0)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default StatisticsPage;
