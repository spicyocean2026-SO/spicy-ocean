"use client";

import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Wallet, TrendingUp, TrendingDown, Calendar, CalendarDays, CalendarRange,
  Package, ShoppingBag, PiggyBank, Plus, Search, Download, Pencil, Trash2,
  Eye, AlertTriangle, Receipt, Filter, X,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { toast } from 'sonner';

interface Expense {
  id: string;
  date: string; // ISO
  category: string;
  vendor: string;
  invoiceNumber: string;
  paymentMethod: string;
  notes: string;
  itemName: string;
  itemCategory: string;
  unit: string;
  quantity: number;
  costPerUnit: number;
  totalCost: number;
  paymentStatus: 'paid' | 'pending';
}

const CATEGORIES = {
  Inventory: ['Chicken', 'Prawns', 'Fish', 'Rice', 'Oil', 'Vegetables', 'Spices', 'Dairy Products', 'Beverages'],
  Operations: ['Electricity', 'Water', 'Gas', 'Internet'],
  Staff: ['Salaries', 'Incentives'],
  Maintenance: ['Repairs', 'Cleaning', 'Equipment Maintenance'],
  Marketing: ['Ads', 'Social Media Promotions'],
  Other: ['Other Expenses'],
};

const UNITS = ['Kg', 'Gram', 'Litre', 'Packet', 'Piece', 'Box', 'Dozen', 'Bag', 'Unit'];
const PAYMENT_METHODS = ['Cash', 'UPI', 'Card', 'Bank Transfer', 'Cheque'];

const SEED: Expense[] = [
  { id: 's1', date: new Date().toISOString(), category: 'Inventory', vendor: 'Coastal Meats', invoiceNumber: 'INV-3201', paymentMethod: 'UPI', notes: 'Fresh stock', itemName: 'Chicken', itemCategory: 'Chicken', unit: 'Kg', quantity: 25, costPerUnit: 240, totalCost: 6000, paymentStatus: 'paid' },
  { id: 's2', date: new Date(Date.now() - 86400000).toISOString(), category: 'Inventory', vendor: 'Ocean Catch', invoiceNumber: 'INV-3202', paymentMethod: 'Cash', notes: '', itemName: 'Prawns', itemCategory: 'Prawns', unit: 'Kg', quantity: 10, costPerUnit: 450, totalCost: 4500, paymentStatus: 'paid' },
  { id: 's3', date: new Date(Date.now() - 2 * 86400000).toISOString(), category: 'Inventory', vendor: 'Annapurna Traders', invoiceNumber: 'INV-3203', paymentMethod: 'Bank Transfer', notes: 'Sona Masoori', itemName: 'Rice', itemCategory: 'Rice', unit: 'Kg', quantity: 50, costPerUnit: 70, totalCost: 3500, paymentStatus: 'paid' },
  { id: 's4', date: new Date(Date.now() - 3 * 86400000).toISOString(), category: 'Inventory', vendor: 'Green Oils', invoiceNumber: 'INV-3204', paymentMethod: 'UPI', notes: '', itemName: 'Oil', itemCategory: 'Oil', unit: 'Litre', quantity: 20, costPerUnit: 160, totalCost: 3200, paymentStatus: 'paid' },
  { id: 's5', date: new Date(Date.now() - 5 * 86400000).toISOString(), category: 'Operations', vendor: 'TSSPDCL', invoiceNumber: 'BILL-552', paymentMethod: 'Bank Transfer', notes: 'Monthly', itemName: 'Electricity', itemCategory: 'Electricity', unit: 'Unit', quantity: 1, costPerUnit: 8500, totalCost: 8500, paymentStatus: 'paid' },
  { id: 's6', date: new Date(Date.now() - 10 * 86400000).toISOString(), category: 'Inventory', vendor: 'Sea Harvest', invoiceNumber: 'INV-3205', paymentMethod: 'Cash', notes: '', itemName: 'Fish', itemCategory: 'Fish', unit: 'Kg', quantity: 15, costPerUnit: 320, totalCost: 4800, paymentStatus: 'pending' },
];

const STORAGE_KEY = 'kadali_expenses';
const BUDGET_KEY = 'kadali_expense_budget';

const inr = (n: number) => `₹${n.toLocaleString('en-IN')}`;
const PIE_COLORS = ['#EA6113', '#F88F22', '#F88931', '#FFE383', '#FFB562', '#C94A0B', '#FFD27A', '#FF7A3D'];

const emptyForm: Omit<Expense, 'id' | 'totalCost'> = {
  date: new Date().toISOString().slice(0, 10),
  category: 'Inventory',
  vendor: '',
  invoiceNumber: '',
  paymentMethod: 'Cash',
  notes: '',
  itemName: '',
  itemCategory: 'Chicken',
  unit: 'Kg',
  quantity: 0,
  costPerUnit: 0,
  paymentStatus: 'paid',
};

const ExpensesPage: React.FC = () => {
  const [expenses, setExpenses] = useState<Expense[]>(() => {
    const s = localStorage.getItem(STORAGE_KEY);
    return s ? JSON.parse(s) : SEED;
  });
  const [budget, setBudget] = useState<number>(() => {
    const s = localStorage.getItem(BUDGET_KEY);
    return s ? parseFloat(s) : 100000;
  });
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState<string>('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 8;

  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [viewing, setViewing] = useState<Expense | null>(null);
  const [form, setForm] = useState({ ...emptyForm });

  useEffect(() => { localStorage.setItem(STORAGE_KEY, JSON.stringify(expenses)); }, [expenses]);
  useEffect(() => { localStorage.setItem(BUDGET_KEY, String(budget)); }, [budget]);

  const totalCost = useMemo(() => form.quantity * form.costPerUnit, [form.quantity, form.costPerUnit]);

  // ---- KPIs
  const now = new Date();
  const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const startWeek = startToday - 6 * 86400000;
  const startMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
  const startPrevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).getTime();

  const sumWhere = (predicate: (e: Expense) => boolean) =>
    expenses.filter(predicate).reduce((s, e) => s + e.totalCost, 0);

  const todayTotal = sumWhere(e => new Date(e.date).getTime() >= startToday);
  const weekTotal = sumWhere(e => new Date(e.date).getTime() >= startWeek);
  const monthTotal = sumWhere(e => new Date(e.date).getTime() >= startMonth);
  const prevMonthTotal = sumWhere(e => {
    const t = new Date(e.date).getTime();
    return t >= startPrevMonth && t < startMonth;
  });
  const monthChange = prevMonthTotal > 0 ? ((monthTotal - prevMonthTotal) / prevMonthTotal) * 100 : 0;
  const inventoryCost = sumWhere(e => e.category === 'Inventory');
  const totalItems = expenses.reduce((s, e) => s + (e.category === 'Inventory' ? e.quantity : 0), 0);
  const remaining = Math.max(0, budget - monthTotal);

  // ---- Filtering
  const filtered = useMemo(() => {
    return expenses
      .filter(e => filterCat === 'all' || e.category === filterCat)
      .filter(e => !search ||
        e.itemName.toLowerCase().includes(search.toLowerCase()) ||
        e.vendor.toLowerCase().includes(search.toLowerCase()) ||
        e.invoiceNumber.toLowerCase().includes(search.toLowerCase()))
      .filter(e => !dateFrom || new Date(e.date) >= new Date(dateFrom))
      .filter(e => !dateTo || new Date(e.date) <= new Date(dateTo + 'T23:59:59'))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [expenses, filterCat, search, dateFrom, dateTo]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paged = filtered.slice((page - 1) * pageSize, page * pageSize);
  useEffect(() => { if (page > totalPages) setPage(1); }, [totalPages, page]);

  // ---- Charts
  const monthlyTrend = useMemo(() => {
    const buckets: Record<string, number> = {};
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const k = d.toLocaleString('en', { month: 'short' });
      buckets[k] = 0;
    }
    expenses.forEach(e => {
      const d = new Date(e.date);
      const k = d.toLocaleString('en', { month: 'short' });
      if (k in buckets && d.getFullYear() === now.getFullYear()) buckets[k] += e.totalCost;
    });
    return Object.entries(buckets).map(([month, total]) => ({ month, total }));
  }, [expenses]);

  const categoryBreakdown = useMemo(() => {
    const map: Record<string, number> = {};
    expenses.forEach(e => { map[e.category] = (map[e.category] || 0) + e.totalCost; });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [expenses]);

  const topItems = useMemo(() => {
    const map: Record<string, { qty: number; cost: number; unit: string; count: number }> = {};
    expenses.filter(e => e.category === 'Inventory').forEach(e => {
      if (!map[e.itemName]) map[e.itemName] = { qty: 0, cost: 0, unit: e.unit, count: 0 };
      map[e.itemName].qty += e.quantity;
      map[e.itemName].cost += e.totalCost;
      map[e.itemName].count += 1;
    });
    return Object.entries(map)
      .map(([name, v]) => ({ name, ...v, avg: v.cost / v.count }))
      .sort((a, b) => b.cost - a.cost)
      .slice(0, 6);
  }, [expenses]);

  const mostPurchased = topItems.slice(0, 5).map(i => ({ name: i.name, qty: i.qty }));

  // ---- Alerts
  const alerts: { type: 'warning' | 'danger' | 'info'; message: string }[] = [];
  if (monthTotal > budget) alerts.push({ type: 'danger', message: `Monthly budget exceeded by ${inr(monthTotal - budget)}` });
  else if (monthTotal > budget * 0.85) alerts.push({ type: 'warning', message: `You've used ${Math.round((monthTotal / budget) * 100)}% of monthly budget` });
  // Sudden price increase detection
  const priceMap: Record<string, number[]> = {};
  expenses.filter(e => e.category === 'Inventory').forEach(e => {
    priceMap[e.itemName] = priceMap[e.itemName] || [];
    priceMap[e.itemName].push(e.costPerUnit);
  });
  Object.entries(priceMap).forEach(([name, prices]) => {
    if (prices.length >= 2) {
      const latest = prices[0]; const prev = prices[1];
      if (latest > prev * 1.15) alerts.push({ type: 'warning', message: `${name} price increased ${Math.round(((latest - prev) / prev) * 100)}%` });
    }
  });
  if (expenses.some(e => e.paymentStatus === 'pending')) {
    alerts.push({ type: 'info', message: `${expenses.filter(e => e.paymentStatus === 'pending').length} invoice(s) pending payment` });
  }

  // ---- Form handlers
  const openAdd = () => {
    setEditingId(null);
    setForm({ ...emptyForm, date: new Date().toISOString().slice(0, 10) });
    setFormOpen(true);
  };
  const openEdit = (e: Expense) => {
    setEditingId(e.id);
    setForm({
      date: e.date.slice(0, 10), category: e.category, vendor: e.vendor,
      invoiceNumber: e.invoiceNumber, paymentMethod: e.paymentMethod, notes: e.notes,
      itemName: e.itemName, itemCategory: e.itemCategory, unit: e.unit,
      quantity: e.quantity, costPerUnit: e.costPerUnit, paymentStatus: e.paymentStatus,
    });
    setFormOpen(true);
  };
  const save = () => {
    if (!form.itemName || !form.vendor || form.quantity <= 0 || form.costPerUnit <= 0) {
      toast.error('Please fill all required fields'); return;
    }
    const record: Expense = {
      id: editingId || Date.now().toString(),
      ...form,
      date: new Date(form.date).toISOString(),
      totalCost: form.quantity * form.costPerUnit,
    };
    if (editingId) {
      setExpenses(prev => prev.map(e => e.id === editingId ? record : e));
      toast.success('Expense updated');
    } else {
      setExpenses(prev => [record, ...prev]);
      toast.success('Expense added');
    }
    setFormOpen(false);
  };
  const remove = (id: string) => {
    setExpenses(prev => prev.filter(e => e.id !== id));
    toast.success('Expense deleted');
  };

  const exportCSV = () => {
    const headers = ['Date', 'Item', 'Category', 'Quantity', 'Unit', 'Cost/Unit', 'Total', 'Vendor', 'Invoice', 'Payment', 'Status'];
    const rows = filtered.map(e => [
      new Date(e.date).toLocaleDateString(), e.itemName, e.category, e.quantity, e.unit,
      e.costPerUnit, e.totalCost, e.vendor, e.invoiceNumber, e.paymentMethod, e.paymentStatus,
    ]);
    const csv = [headers, ...rows].map(r => r.map(c => `"${c}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `expenses-${Date.now()}.csv`; a.click();
    URL.revokeObjectURL(url);
    toast.success('CSV exported');
  };

  const kpis = [
    { label: 'This Month', value: inr(monthTotal), icon: Wallet, change: monthChange, accent: 'from-primary to-orange-400' },
    { label: "Today's Expense", value: inr(todayTotal), icon: Calendar, change: 0, accent: 'from-orange-400 to-amber-300' },
    { label: "This Week", value: inr(weekTotal), icon: CalendarDays, change: 0, accent: 'from-amber-400 to-yellow-300' },
    { label: "Last Month", value: inr(prevMonthTotal), icon: CalendarRange, change: 0, accent: 'from-yellow-400 to-orange-300' },
    { label: 'Inventory Cost', value: inr(inventoryCost), icon: Package, change: 0, accent: 'from-primary to-amber-400' },
    { label: 'Items Purchased', value: `${totalItems}`, icon: ShoppingBag, change: 0, accent: 'from-orange-500 to-yellow-300' },
    { label: 'Remaining Budget', value: inr(remaining), icon: PiggyBank, change: 0, accent: 'from-amber-300 to-yellow-200' },
  ];

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-[1600px] mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gradient">Expense Management</h1>
          <p className="text-sm text-muted-foreground mt-1">Track, manage and analyze restaurant expenditure</p>
        </div>
        <div className="flex gap-2">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm"><PiggyBank className="h-4 w-4 mr-2" />Budget</Button>
            </DialogTrigger>
            <DialogContent className="max-w-sm">
              <DialogHeader><DialogTitle>Monthly Budget</DialogTitle></DialogHeader>
              <Input type="number" value={budget} onChange={e => setBudget(parseFloat(e.target.value) || 0)} />
              <DialogFooter>
                <Button onClick={() => toast.success('Budget saved')}>Save</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <Button onClick={openAdd} className="gradient-primary text-primary-foreground shadow-md">
            <Plus className="h-4 w-4 mr-2" />Add Expense
          </Button>
        </div>
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="grid gap-2">
          {alerts.map((a, i) => (
            <motion.div
              key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
              className={`flex items-center gap-3 p-3 rounded-lg border text-sm ${
                a.type === 'danger' ? 'bg-destructive/10 border-destructive/30 text-destructive' :
                a.type === 'warning' ? 'bg-amber-50 border-amber-300 text-amber-900 dark:bg-amber-950/30 dark:text-amber-200' :
                'bg-primary/5 border-primary/20'
              }`}>
              <AlertTriangle className="h-4 w-4 flex-shrink-0" />
              <span>{a.message}</span>
            </motion.div>
          ))}
        </div>
      )}

      {/* KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-3">
        {kpis.map((k, i) => (
          <motion.div key={k.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
            <Card className="overflow-hidden border-border/60 hover:shadow-lg transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className={`p-2 rounded-lg bg-gradient-to-br ${k.accent} shadow-sm`}>
                    <k.icon className="h-4 w-4 text-white" />
                  </div>
                  {k.change !== 0 && (
                    <span className={`text-[10px] font-semibold flex items-center gap-0.5 ${k.change > 0 ? 'text-destructive' : 'text-green-600'}`}>
                      {k.change > 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                      {Math.abs(k.change).toFixed(1)}%
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-muted-foreground uppercase tracking-wide">{k.label}</p>
                <p className="text-lg md:text-xl font-bold mt-1 truncate">{k.value}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <Tabs defaultValue="records" className="space-y-4">
        <TabsList>
          <TabsTrigger value="records">Records</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="inventory">Inventory Insights</TabsTrigger>
        </TabsList>

        {/* RECORDS */}
        <TabsContent value="records" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex flex-col lg:flex-row lg:items-center gap-3">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Search item, vendor, invoice…" value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
                </div>
                <div className="flex flex-wrap gap-2">
                  <Select value={filterCat} onValueChange={setFilterCat}>
                    <SelectTrigger className="w-40"><Filter className="h-3.5 w-3.5 mr-1" /><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      {Object.keys(CATEGORIES).map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <Input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="w-36" />
                  <Input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="w-36" />
                  <Button variant="outline" size="sm" onClick={exportCSV}><Download className="h-4 w-4 mr-1" />Export</Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto rounded-lg border border-border/60">
                <table className="w-full text-sm">
                  <thead className="bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
                    <tr>
                      <th className="text-left p-3">Date</th>
                      <th className="text-left p-3">Item</th>
                      <th className="text-left p-3">Category</th>
                      <th className="text-right p-3">Qty</th>
                      <th className="text-left p-3">Unit</th>
                      <th className="text-right p-3">Cost/Unit</th>
                      <th className="text-right p-3">Total</th>
                      <th className="text-left p-3">Supplier</th>
                      <th className="text-center p-3">Status</th>
                      <th className="text-center p-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paged.length === 0 ? (
                      <tr><td colSpan={10} className="text-center p-8 text-muted-foreground">No expenses found</td></tr>
                    ) : paged.map(e => (
                      <tr key={e.id} className="border-t border-border/40 hover:bg-muted/30 transition-colors">
                        <td className="p-3 whitespace-nowrap">{new Date(e.date).toLocaleDateString()}</td>
                        <td className="p-3 font-medium">{e.itemName}</td>
                        <td className="p-3"><Badge variant="secondary" className="text-[10px]">{e.category}</Badge></td>
                        <td className="p-3 text-right">{e.quantity}</td>
                        <td className="p-3">{e.unit}</td>
                        <td className="p-3 text-right">{inr(e.costPerUnit)}</td>
                        <td className="p-3 text-right font-semibold text-primary">{inr(e.totalCost)}</td>
                        <td className="p-3">{e.vendor}</td>
                        <td className="p-3 text-center">
                          <Badge variant={e.paymentStatus === 'paid' ? 'default' : 'outline'} className={e.paymentStatus === 'paid' ? 'bg-green-500/15 text-green-700 hover:bg-green-500/20 border-0' : 'border-amber-400 text-amber-700'}>
                            {e.paymentStatus}
                          </Badge>
                        </td>
                        <td className="p-3">
                          <div className="flex items-center justify-center gap-1">
                            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setViewing(e)}><Eye className="h-3.5 w-3.5" /></Button>
                            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEdit(e)}><Pencil className="h-3.5 w-3.5" /></Button>
                            <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => remove(e.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {/* Pagination */}
              <div className="flex items-center justify-between mt-4 text-xs text-muted-foreground">
                <span>Showing {paged.length} of {filtered.length}</span>
                <div className="flex gap-1">
                  <Button size="sm" variant="outline" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>Prev</Button>
                  <span className="px-3 py-1.5 rounded-md bg-muted">{page} / {totalPages}</span>
                  <Button size="sm" variant="outline" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>Next</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ANALYTICS */}
        <TabsContent value="analytics" className="space-y-4">
          <div className="grid lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader><CardTitle className="text-base">Monthly Expense Trend</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={260}>
                  <LineChart data={monthlyTrend}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                    <XAxis dataKey="month" fontSize={12} />
                    <YAxis fontSize={12} />
                    <Tooltip formatter={(v: number) => inr(v)} />
                    <Line type="monotone" dataKey="total" stroke="#EA6113" strokeWidth={2.5} dot={{ r: 4, fill: '#EA6113' }} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-base">Category Breakdown</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie data={categoryBreakdown} dataKey="value" nameKey="name" outerRadius={90} label={(p: any) => `${p.name}`}>
                      {categoryBreakdown.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                    </Pie>
                    <Tooltip formatter={(v: number) => inr(v)} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            <Card className="lg:col-span-2">
              <CardHeader><CardTitle className="text-base">Most Purchased Items (Qty)</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={mostPurchased}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                    <XAxis dataKey="name" fontSize={12} />
                    <YAxis fontSize={12} />
                    <Tooltip />
                    <Bar dataKey="qty" fill="#F88F22" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* INVENTORY INSIGHTS */}
        <TabsContent value="inventory" className="space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Top Consumed Items</CardTitle></CardHeader>
            <CardContent>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {topItems.map(item => (
                  <div key={item.name} className="p-4 rounded-lg border border-border/60 bg-card hover:shadow-md transition-all">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold">{item.name}</h4>
                      <Badge variant="secondary">{item.count} buys</Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <p className="text-muted-foreground">Total Qty</p>
                        <p className="font-semibold text-sm">{item.qty} {item.unit}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Avg Cost</p>
                        <p className="font-semibold text-sm">{inr(Math.round(item.avg))}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Total Spend</p>
                        <p className="font-semibold text-sm text-primary">{inr(item.cost)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Est. Stock</p>
                        <p className="font-semibold text-sm">~{Math.max(0, Math.round(item.qty * 0.3))} {item.unit}</p>
                      </div>
                    </div>
                  </div>
                ))}
                {topItems.length === 0 && <p className="text-sm text-muted-foreground p-4">No inventory data yet</p>}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add / Edit Dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Edit Expense' : 'Add Expense'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-3">
              <div><Label>Purchase Date *</Label><Input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} /></div>
              <div>
                <Label>Category *</Label>
                <Select value={form.category} onValueChange={v => setForm({ ...form, category: v, itemCategory: CATEGORIES[v as keyof typeof CATEGORIES]?.[0] || '' })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{Object.keys(CATEGORIES).map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Vendor/Supplier *</Label><Input value={form.vendor} onChange={e => setForm({ ...form, vendor: e.target.value })} placeholder="e.g. Ocean Catch" /></div>
              <div><Label>Invoice Number</Label><Input value={form.invoiceNumber} onChange={e => setForm({ ...form, invoiceNumber: e.target.value })} placeholder="INV-1234" /></div>
              <div>
                <Label>Payment Method</Label>
                <Select value={form.paymentMethod} onValueChange={v => setForm({ ...form, paymentMethod: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{PAYMENT_METHODS.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Payment Status</Label>
                <Select value={form.paymentStatus} onValueChange={(v: 'paid' | 'pending') => setForm({ ...form, paymentStatus: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="paid">Paid</SelectItem><SelectItem value="pending">Pending</SelectItem></SelectContent>
                </Select>
              </div>
            </div>

            <div className="border-t pt-4">
              <h4 className="text-sm font-semibold mb-3 text-primary">Item Details</h4>
              <div className="grid sm:grid-cols-2 gap-3">
                <div><Label>Item Name *</Label><Input value={form.itemName} onChange={e => setForm({ ...form, itemName: e.target.value })} placeholder="e.g. Chicken" /></div>
                <div>
                  <Label>Item Category</Label>
                  <Select value={form.itemCategory} onValueChange={v => setForm({ ...form, itemCategory: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {(CATEGORIES[form.category as keyof typeof CATEGORIES] || []).map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Unit Type</Label>
                  <Select value={form.unit} onValueChange={v => setForm({ ...form, unit: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{UNITS.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div><Label>Quantity *</Label><Input type="number" value={form.quantity || ''} onChange={e => setForm({ ...form, quantity: parseFloat(e.target.value) || 0 })} /></div>
                <div><Label>Cost Per Unit (₹) *</Label><Input type="number" value={form.costPerUnit || ''} onChange={e => setForm({ ...form, costPerUnit: parseFloat(e.target.value) || 0 })} /></div>
                <div>
                  <Label>Total Cost</Label>
                  <div className="h-10 flex items-center px-3 rounded-md border border-border bg-muted/40 font-semibold text-primary">{inr(totalCost)}</div>
                </div>
              </div>
            </div>

            <div>
              <Label>Notes</Label>
              <Textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={2} placeholder="Optional notes…" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFormOpen(false)}>Cancel</Button>
            <Button onClick={save} className="gradient-primary text-primary-foreground">{editingId ? 'Update' : 'Add'} Expense</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={!!viewing} onOpenChange={() => setViewing(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><Receipt className="h-4 w-4" />Expense Details</DialogTitle></DialogHeader>
          {viewing && (
            <div className="space-y-2 text-sm">
              {[
                ['Date', new Date(viewing.date).toLocaleDateString()],
                ['Item', viewing.itemName],
                ['Category', viewing.category],
                ['Quantity', `${viewing.quantity} ${viewing.unit}`],
                ['Cost / Unit', inr(viewing.costPerUnit)],
                ['Total', inr(viewing.totalCost)],
                ['Vendor', viewing.vendor],
                ['Invoice', viewing.invoiceNumber || '—'],
                ['Payment', `${viewing.paymentMethod} (${viewing.paymentStatus})`],
                ['Notes', viewing.notes || '—'],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between py-2 border-b border-border/40">
                  <span className="text-muted-foreground">{k}</span>
                  <span className="font-medium text-right">{v}</span>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ExpensesPage;
