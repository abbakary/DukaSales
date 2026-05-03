'use client';

import { useLiveQuery } from 'dexie-react-hooks';
import { useState } from 'react';
import { Download, TrendingUp, ShoppingCart, Banknote, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useAuthStore } from '@/lib/stores/auth-store';
import { db } from '@/lib/db/dexie';
import { ResponsiveContainer, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Bar } from 'recharts';
import { useI18n } from '@/lib/i18n/use-i18n';

export default function SalesReportPage() {
  const { user, company } = useAuthStore();
  const { t } = useI18n();
  const [period, setPeriod] = useState('this_month');
  const currency = company?.currencySymbol || 'TSH';

  const isCashier = user?.role === 'cashier';

  const transactions = useLiveQuery(
    async () => {
      if (!company?.id) return [];
      let query = db.transactions.where('companyId').equals(company.id).filter(t => t.type === 'sale');
      
      const all = await query.reverse().toArray();
      
      if (isCashier && user?.id) {
        return all.filter(t => t.cashierId === user.id);
      }
      return all;
    },
    [company?.id, isCashier, user?.id], []
  );

  const getDateRange = () => {
    const now = new Date();
    const start = new Date();
    if (period === 'today') { start.setHours(0, 0, 0, 0); }
    else if (period === 'this_week') { start.setDate(now.getDate() - now.getDay()); start.setHours(0, 0, 0, 0); }
    else if (period === 'this_month') { start.setDate(1); start.setHours(0, 0, 0, 0); }
    else if (period === 'last_month') { start.setMonth(now.getMonth() - 1, 1); start.setHours(0, 0, 0, 0); now.setDate(0); }
    else if (period === 'this_year') { start.setMonth(0, 1); start.setHours(0, 0, 0, 0); }
    return { start, end: now };
  };

  const { start, end } = getDateRange();
  const filtered = (transactions || []).filter(t => {
    const d = new Date(t.createdAt);
    return d >= start && d <= end;
  });

  const completed = filtered.filter(t => t.status === 'completed');
  const revenue = completed.reduce((s, t) => s + t.total, 0);
  const cost = completed.reduce((s, t) => s + t.items.reduce((is, i) => is + i.costPrice * i.quantity, 0), 0);
  const profit = revenue - cost;

  // Top products
  const productMap: Record<string, { name: string; qty: number; revenue: number }> = {};
  completed.forEach(t => t.items.forEach(item => {
    if (!productMap[item.productId]) productMap[item.productId] = { name: item.productName, qty: 0, revenue: 0 };
    productMap[item.productId].qty += item.quantity;
    productMap[item.productId].revenue += item.total;
  }));
  const topProducts = Object.values(productMap).sort((a, b) => b.revenue - a.revenue).slice(0, 10);

  // By payment method
  const byMethod: Record<string, number> = {};
  completed.forEach(t => { byMethod[t.paymentMethod] = (byMethod[t.paymentMethod] || 0) + t.total; });
  const trend = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const key = d.toISOString().split('T')[0];
    const daySales = completed.filter(t => new Date(t.createdAt).toISOString().split('T')[0] === key);
    return {
      day: d.toLocaleDateString('en-US', { weekday: 'short' }),
      revenue: daySales.reduce((s, t) => s + t.total, 0),
      orders: daySales.length,
    };
  });

  return (
    <div className="p-6 space-y-6">
      <div className="rounded-xl border bg-gradient-to-r from-primary to-primary/80 px-5 py-4 text-primary-foreground shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t('reports.salesReportTitle')}</h1>
          <p className="text-primary-foreground/80">{t('reports.salesReportSubtitle')}</p>
        </div>
        <div className="flex gap-2">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="today">{t('reports.today')}</SelectItem>
              <SelectItem value="this_week">{t('reports.thisWeek')}</SelectItem>
              <SelectItem value="this_month">{t('reports.thisMonth')}</SelectItem>
              <SelectItem value="last_month">{t('reports.lastMonth')}</SelectItem>
              <SelectItem value="this_year">{t('reports.thisYear')}</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="secondary"><Download className="mr-2 size-4" />{t('reports.export')}</Button>
        </div>
      </div>
      </div>

      <div className={`grid gap-4 ${isCashier ? 'sm:grid-cols-2 lg:grid-cols-3' : 'sm:grid-cols-2 lg:grid-cols-4'}`}>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {isCashier ? t('reports.mySalesCount') : t('reports.totalSales')}
            </CardTitle>
            <ShoppingCart className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completed.length}</div>
            <p className="text-xs text-muted-foreground">{filtered.length} {t('reports.totalTransactions')}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {isCashier ? t('reports.myRevenue') : t('reports.totalRevenue')}
            </CardTitle>
            <Banknote className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{currency}{revenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
          </CardContent>
        </Card>

        {!isCashier && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{t('reports.netProfit')}</CardTitle>
              <TrendingUp className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${profit >= 0 ? 'text-green-600' : 'text-destructive'}`}>
                {currency}{profit.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </div>
              <p className="text-xs text-muted-foreground">{revenue > 0 ? ((profit / revenue) * 100).toFixed(1) : 0}% {t('dashboard.margin')}</p>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t('reports.avgOrderValue')}</CardTitle>
            <Users className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {currency}{completed.length > 0 ? (revenue / completed.length).toLocaleString(undefined, { minimumFractionDigits: 2 }) : '0.00'}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>{t('reports.salesTrend7d')}</CardTitle><CardDescription>{t('reports.revenueAndOrders')}</CardDescription></CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={trend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>{t('reports.topProducts')}</CardTitle><CardDescription>{t('reports.bestSellingByRevenue')}</CardDescription></CardHeader>
          <CardContent>
            <Table>
              <TableHeader><TableRow><TableHead>{t('reports.product')}</TableHead><TableHead className="text-right">{t('reports.qtySold')}</TableHead><TableHead className="text-right">{t('reports.totalRevenue')}</TableHead></TableRow></TableHeader>
              <TableBody>
                {topProducts.length === 0 ? (
                  <TableRow><TableCell colSpan={3} className="text-center py-6 text-muted-foreground">{t('reports.noDataPeriod')}</TableCell></TableRow>
                ) : topProducts.map((p, i) => (
                  <TableRow key={i}>
                    <TableCell className="font-medium">{p.name}</TableCell>
                    <TableCell className="text-right">{p.qty}</TableCell>
                    <TableCell className="text-right">{currency}{p.revenue.toFixed(2)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>{t('reports.paymentMethods')}</CardTitle><CardDescription>{t('reports.paymentBreakdown')}</CardDescription></CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(byMethod).length === 0 ? (
                <p className="text-center py-6 text-muted-foreground">{t('reports.noDataPeriod')}</p>
              ) : Object.entries(byMethod).map(([method, amount]) => (
                <div key={method} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="capitalize">{method}</Badge>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{currency}{amount.toFixed(2)}</p>
                    <p className="text-xs text-muted-foreground">{revenue > 0 ? ((amount / revenue) * 100).toFixed(1) : 0}%</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>{t('reports.allTransactions')}</CardTitle><CardDescription>{filtered.length} {t('reports.transactionsInSelected')}</CardDescription></CardHeader>
        <CardContent>
          <Table>
            <TableHeader><TableRow><TableHead>{t('reports.transactionNo')}</TableHead><TableHead>{t('reports.customer')}</TableHead><TableHead>{t('reports.items')}</TableHead><TableHead>{t('reports.payment')}</TableHead><TableHead className="text-right">{t('purchases.total')}</TableHead><TableHead>{t('reports.status')}</TableHead><TableHead>{t('reports.date')}</TableHead></TableRow></TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">{t('reports.noTransactionsPeriod')}</TableCell></TableRow>
              ) : filtered.slice(0, 20).map(tx => (
                <TableRow key={tx.id}>
                  <TableCell className="font-mono text-sm">{tx.transactionNumber}</TableCell>
                  <TableCell>{tx.customerName || t('reports.walkIn')}</TableCell>
                  <TableCell>{tx.items.length}</TableCell>
                  <TableCell><Badge variant="outline" className="capitalize">{tx.paymentMethod}</Badge></TableCell>
                  <TableCell className="text-right font-medium">{currency}{tx.total.toFixed(2)}</TableCell>
                  <TableCell><Badge className={tx.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>{tx.status}</Badge></TableCell>
                  <TableCell className="text-sm text-muted-foreground">{new Date(tx.createdAt).toLocaleDateString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
