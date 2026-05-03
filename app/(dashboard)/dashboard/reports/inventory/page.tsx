'use client';

import { useLiveQuery } from 'dexie-react-hooks';
import { Download, Package, AlertTriangle, TrendingDown, Banknote } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { useAuthStore } from '@/lib/stores/auth-store';
import { db } from '@/lib/db/dexie';
import { ResponsiveContainer, PieChart, Pie, Tooltip, Cell } from 'recharts';
import { useI18n } from '@/lib/i18n/use-i18n';

export default function InventoryReportPage() {
  const { company } = useAuthStore();
  const { t } = useI18n();
  const currency = company?.currencySymbol || 'TSH';

  const products = useLiveQuery(
    async () => {
      if (!company?.id) return [];
      return db.products.where('companyId').equals(company.id).filter(p => p.isActive).toArray();
    },
    [company?.id], []
  );

  const categories = useLiveQuery(
    async () => {
      if (!company?.id) return [];
      return db.categories.where('companyId').equals(company.id).toArray();
    },
    [company?.id], []
  );

  const getCategoryName = (id: string) => (categories || []).find(c => c.id === id)?.name || t('reports.uncategorized');

  const totalValue = (products || []).reduce((s, p) => s + p.costPrice * p.quantity, 0);
  const totalRetailValue = (products || []).reduce((s, p) => s + p.sellingPrice * p.quantity, 0);
  const lowStock = (products || []).filter(p => p.quantity <= p.minStock && p.quantity > 0);
  const outOfStock = (products || []).filter(p => p.quantity === 0);
  const expiring = (products || []).filter(p => {
    if (!p.expiryDate) return false;
    const days = Math.ceil((new Date(p.expiryDate).getTime() - Date.now()) / 86400000);
    return days <= 30 && days > 0;
  });

  // By category
  const byCat: Record<string, { name: string; count: number; value: number }> = {};
  (products || []).forEach(p => {
    const name = getCategoryName(p.categoryId);
    if (!byCat[p.categoryId]) byCat[p.categoryId] = { name, count: 0, value: 0 };
    byCat[p.categoryId].count++;
    byCat[p.categoryId].value += p.costPrice * p.quantity;
  });
  const catList = Object.values(byCat).sort((a, b) => b.value - a.value);
  const categoryChart = catList.slice(0, 6).map((c) => ({ name: c.name, value: c.value }));
  const colors = ['#2563eb', '#0891b2', '#f59e0b', '#16a34a', '#7c3aed', '#dc2626'];

  return (
    <div className="p-6 space-y-6">
      <div className="rounded-xl border bg-gradient-to-r from-primary to-primary/80 px-5 py-4 text-primary-foreground shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t('reports.inventoryReportTitle')}</h1>
          <p className="text-primary-foreground/80">{t('reports.inventoryReportSubtitle')}</p>
        </div>
        <Button variant="secondary"><Download className="mr-2 size-4" />{t('reports.export')}</Button>
      </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">{t('reports.totalProducts')}</CardTitle><Package className="size-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{(products || []).length}</div></CardContent></Card>
        <Card><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">{t('reports.stockValueCost')}</CardTitle><Banknote className="size-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{currency}{totalValue.toFixed(2)}</div></CardContent></Card>
        <Card><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">{t('reports.lowStockItems')}</CardTitle><AlertTriangle className="size-4 text-warning" /></CardHeader><CardContent><div className="text-2xl font-bold text-warning">{lowStock.length}</div></CardContent></Card>
        <Card><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">{t('reports.outOfStock')}</CardTitle><TrendingDown className="size-4 text-destructive" /></CardHeader><CardContent><div className="text-2xl font-bold text-destructive">{outOfStock.length}</div></CardContent></Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>{t('reports.inventoryValueMix')}</CardTitle><CardDescription>{t('reports.topCategoriesByValue')}</CardDescription></CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={categoryChart} dataKey="value" nameKey="name" outerRadius={96} label>
                  {categoryChart.map((_, i) => <Cell key={i} fill={colors[i % colors.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>{t('reports.stockByCategory')}</CardTitle><CardDescription>{t('reports.valueDistributionByCategory')}</CardDescription></CardHeader>
          <CardContent className="space-y-4">
            {catList.length === 0 ? <p className="text-center py-6 text-muted-foreground">{t('reports.noData')}</p> : catList.map((cat, i) => (
              <div key={i} className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="font-medium">{cat.name}</span>
                  <span className="text-muted-foreground">{cat.count} products · {currency}{cat.value.toFixed(2)}</span>
                </div>
                <Progress value={totalValue > 0 ? (cat.value / totalValue) * 100 : 0} className="h-2" />
              </div>
            ))}
          </CardContent>
        </Card>

        {expiring.length > 0 && (
          <Card>
            <CardHeader><CardTitle>{t('reports.expiringSoon')}</CardTitle><CardDescription>{t('reports.expiringWithin30')}</CardDescription></CardHeader>
            <CardContent>
              <Table>
                <TableHeader><TableRow><TableHead>{t('reports.product')}</TableHead><TableHead className="text-right">{t('reports.stock')}</TableHead><TableHead>{t('reports.expires')}</TableHead></TableRow></TableHeader>
                <TableBody>
                  {expiring.map(p => {
                    const days = Math.ceil((new Date(p.expiryDate!).getTime() - Date.now()) / 86400000);
                    return (
                      <TableRow key={p.id}>
                        <TableCell className="font-medium">{p.name}</TableCell>
                        <TableCell className="text-right">{p.quantity} {p.unit}</TableCell>
                        <TableCell><Badge className={days <= 7 ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}>{days} {t('reports.daysLeft')}</Badge></TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>

      <Card>
        <CardHeader><CardTitle>{t('reports.lowStockAlert')}</CardTitle><CardDescription>{t('reports.productsNeedRestocking')}</CardDescription></CardHeader>
        <CardContent>
          <Table>
            <TableHeader><TableRow><TableHead>{t('reports.product')}</TableHead><TableHead>SKU</TableHead><TableHead>{t('reports.category')}</TableHead><TableHead className="text-right">{t('reports.currentStock')}</TableHead><TableHead className="text-right">{t('reports.minStock')}</TableHead><TableHead>{t('reports.status')}</TableHead></TableRow></TableHeader>
            <TableBody>
              {[...outOfStock, ...lowStock].length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">{t('reports.allWellStocked')}</TableCell></TableRow>
              ) : [...outOfStock, ...lowStock].map(p => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">{p.name}</TableCell>
                  <TableCell className="font-mono text-sm">{p.sku}</TableCell>
                  <TableCell>{getCategoryName(p.categoryId)}</TableCell>
                  <TableCell className="text-right font-medium text-destructive">{p.quantity} {p.unit}</TableCell>
                  <TableCell className="text-right text-muted-foreground">{p.minStock}</TableCell>
                  <TableCell><Badge variant="destructive">{p.quantity === 0 ? t('reports.outOfStock') : t('reports.lowStockItems')}</Badge></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
