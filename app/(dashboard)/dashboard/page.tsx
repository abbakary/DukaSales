'use client';

import { useEffect, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { useAuthStore } from '@/lib/stores/auth-store';
import { db } from '@/lib/db/dexie';
import { listTenantResource } from '@/lib/api/tenant';
import { StatsCards } from '@/components/dashboard/stats-cards';
import { SalesChart } from '@/components/dashboard/sales-chart';
import { TopProducts } from '@/components/dashboard/top-products';
import { StockAlerts } from '@/components/dashboard/stock-alerts';
import { RecentTransactions } from '@/components/dashboard/recent-transactions';
import { UshauriCard } from '@/components/dashboard/ushauri-card';
import { SendReportDialog } from '@/components/dashboard/send-report-dialog';
import { EventsThisMonth } from '@/components/dashboard/events-this-month';
import type { DashboardStats, Transaction, Product } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useRouter } from 'next/navigation';
import { listEvents } from '@/lib/api/tenant';
import { toast } from 'sonner';
import { Area, AreaChart, Bar, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { BarChart3, TrendingUp } from 'lucide-react';
import { useI18n } from '@/lib/i18n/use-i18n';

export default function DashboardPage() {
  const { user, company, token } = useAuthStore();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [apiTransactions, setApiTransactions] = useState<Transaction[]>([]);
  const [salaries, setSalaries] = useState<any[]>([]);
  const [expenditures, setExpenditures] = useState<any[]>([]);
  const [eventDialogKey, setEventDialogKey] = useState(0);
  const { t } = useI18n();

  const isCashier = user?.role === 'cashier';
  const isManager = user?.role === 'manager';
  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';
  
  const products = useLiveQuery(
    async () => {
      if (!company?.id) return [];
      return db.products.where('companyId').equals(company.id).toArray();
    },
    [company?.id],
    []
  );
  
  const transactions = useLiveQuery(
    async () => {
      if (!company?.id) return [];
      let query = db.transactions.where('companyId').equals(company.id);
      
      const allTx = await query.reverse().limit(500).toArray();
      
      // Filter by cashier if applicable
      if (isCashier && user?.id) {
        return allTx.filter(tx => tx.cashierId === user.id);
      }
      
      return allTx;
    },
    [company?.id, user?.id, user?.role],
    []
  );
  
  const customers = useLiveQuery(
    async () => {
      if (!company?.id) return [];
      return db.customers.where('companyId').equals(company.id).toArray();
    },
    [company?.id],
    []
  );
  
  const suppliers = useLiveQuery(
    async () => {
      if (!company?.id) return [];
      return db.suppliers.where('companyId').equals(company.id).toArray();
    },
    [company?.id],
    []
  );
  
  const debts = useLiveQuery(
    async () => {
      if (!company?.id) return [];
      return db.debts.where('companyId').equals(company.id).toArray();
    },
    [company?.id],
    []
  );
  
  useEffect(() => {
    // Reduce artificial loading delay for faster perceived performance
    const timer = setTimeout(() => setIsLoading(false), 200);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    let cancelled = false;

    const loadTransactions = async () => {
      if (!token) return;

      try {
        const fetchTasks = [listTenantResource<any>('transactions', token)];
        
        // Only fetch sensitive financial data for managers/admins
        if (!isCashier) {
          fetchTasks.push(listTenantResource<any>('staff_salaries', token));
          fetchTasks.push(listTenantResource<any>('expenditures', token));
        }

        const results = await Promise.all(fetchTasks);
        if (cancelled) return;

        const response = results[0];
        const salaryRows = isCashier ? [] : results[1];
        const expenditureRows = isCashier ? [] : results[2];

        const normalized: Transaction[] = response
          .filter((tx: any) => {
            if (isCashier && user?.id) {
              return tx.cashier_id === user.id;
            }
            return true;
          })
          .map((tx: any) => ({
            id: tx.id,
            companyId: tx.company_id,
            transactionNumber: tx.transaction_number,
            type: tx.type ?? 'sale',
            status: tx.status,
            customerId: tx.customer_id,
            customerName: tx.customer_name,
            items: tx.items ?? [],
            subtotal: Number(tx.subtotal) || 0,
            discountAmount: Number(tx.discount_amount) || 0,
            discountPercent: Number(tx.discount_percent) || 0,
            taxAmount: Number(tx.tax_amount) || 0,
            taxPercent: Number(tx.tax_percent) || 0,
            total: Number(tx.total) || 0,
            paymentMethod: tx.payment_method ?? 'cash',
            amountPaid: Number(tx.amount_paid) || 0,
            change: Number(tx.change) || 0,
            amountDue: Number(tx.amount_due) || 0,
            notes: tx.notes,
            cashierId: tx.cashier_id ?? '',
            cashierName: tx.cashier_name ?? 'Unknown',
            syncStatus: 'synced',
            createdAt: new Date(tx.created_at),
            updatedAt: new Date(tx.updated_at),
          }));

        setApiTransactions(normalized);
        setSalaries(salaryRows || []);
        setExpenditures(expenditureRows || []);
      } catch (error) {
        console.error('[dashboard] Failed to load live transactions for chart:', error);
      }
    };

    loadTransactions();

    return () => {
      cancelled = true;
    };
  }, [token]);
  
  // Calculate stats
  const stats: DashboardStats = {
    totalRevenue: (transactions || []).reduce((sum, tx) => 
      tx.status === 'completed' ? sum + (Number(tx.total) || 0) : sum, 0
    ),
    totalSales: (transactions || []).filter(tx => tx.status === 'completed').length,
    totalPurchases: isAdmin || isManager ? (transactions || []).reduce((sum, tx) => 
      tx.status === 'completed' ? sum + (tx.items || []).reduce((itemSum, item) => 
        itemSum + ((Number(item.costPrice) || 0) * (Number(item.quantity) || 0)), 0
      ) : sum, 0
    ) : 0,
    totalProfit: 0,
    salesCount: (transactions || []).filter(tx => tx.status === 'completed').length,
    customersCount: (customers || []).length,
    suppliersCount: (suppliers || []).length,
    productsCount: (products || []).length,
    lowStockCount: (products || []).filter(p => 
      p.isActive && (Number(p.quantity) || 0) <= (Number(p.minStock) || 0)
    ).length,
    expiringCount: (products || []).filter(p => {
      if (!p.expiryDate) return false;
      try {
        const expiryDate = new Date(p.expiryDate);
        if (isNaN(expiryDate.getTime())) return false;
        const daysUntilExpiry = Math.ceil(
          (expiryDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
        );
        return daysUntilExpiry <= 30 && daysUntilExpiry > 0;
      } catch (e) {
        return false;
      }
    }).length,
    pendingDebtsCount: (debts || []).filter(d => d.status === 'pending' || d.status === 'partial').length,
    pendingDebtsAmount: (debts || []).reduce((sum, d) => 
      (d.status === 'pending' || d.status === 'partial') ? sum + (Number(d.remainingAmount) || 0) : sum, 0
    ),
    profitMargin: 0,
    topCustomer: 'N/A',
    // Return/Refund tracking - Net Revenue calculation
    grossRevenue: (transactions || []).filter(tx => tx.type === 'sale' && tx.status === 'completed').reduce((sum, tx) => sum + (Number(tx.total) || 0), 0),
    totalRefunds: (transactions || []).filter(tx => tx.type === 'return').reduce((sum, tx) => sum + (Number(tx.total) || 0), 0),
    netRevenue: 0,
    returnRate: 0,
    refundedItems: (transactions || []).filter(tx => tx.type === 'return').reduce((sum, tx) => sum + (tx.items?.length || 0), 0),
  };
  
  // Calculate net revenue and return rate
  stats.netRevenue = stats.grossRevenue - stats.totalRefunds;
  stats.returnRate = stats.grossRevenue > 0 ? (stats.totalRefunds / stats.grossRevenue) * 100 : 0;
  
  // Calculate profit
  if (isAdmin || isManager) {
    stats.totalProfit = stats.totalRevenue - stats.totalPurchases;
    stats.profitMargin = stats.totalRevenue > 0 ? (stats.totalProfit / stats.totalRevenue) * 100 : 0;
  } else {
    stats.totalProfit = 0;
    stats.profitMargin = 0;
  }

  // Calculate top customer
  const customerSales: Record<string, number> = {};
  const productSales: Record<string, { name: string; quantity: number }> = {};
  
  (transactions || []).forEach(tx => {
    if (tx.status === 'completed') {
      if (tx.customerName && tx.customerName !== 'Walk-in Customer') {
        customerSales[tx.customerName] = (customerSales[tx.customerName] || 0) + (Number(tx.total) || 0);
      }
      tx.items.forEach(item => {
        if (!productSales[item.productId]) {
          productSales[item.productId] = { name: item.productName, quantity: 0 };
        }
        productSales[item.productId].quantity += Number(item.quantity) || 0;
      });
    }
  });

  let topCust = 'N/A';
  let maxSales = 0;
  Object.entries(customerSales).forEach(([name, total]) => {
    if (total > maxSales) {
      maxSales = total;
      topCust = name;
    }
  });
  stats.topCustomer = topCust;

  // Calculate top product for cashier
  let topProd = 'N/A';
  let maxQty = 0;
  Object.entries(productSales).forEach(([id, data]) => {
    if (data.quantity > maxQty) {
      maxQty = data.quantity;
      topProd = data.name;
    }
  });
  stats.topProduct = topProd; // Need to add this to DashboardStats type

  const todayStats = (() => {
    const now = new Date();
    const isSameDay = (d: Date) =>
      d.getFullYear() === now.getFullYear() &&
      d.getMonth() === now.getMonth() &&
      d.getDate() === now.getDate();
    const completed = (transactions || []).filter((t) => t.status === 'completed');
    const todayTx = completed.filter((t) => isSameDay(new Date(t.createdAt)));
    const todaySales = todayTx.reduce((s, t) => s + (Number(t.total) || 0), 0);
    const monthTx = completed.filter((t) => {
      const d = new Date(t.createdAt);
      return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
    });
    const monthSales = monthTx.reduce((s, t) => s + (Number(t.total) || 0), 0);
    return { todaySales, monthSales, todayCount: todayTx.length };
  })();

  const financeSnapshot = (() => {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const sales = (transactions || []).filter((t) => t.type === "sale" && t.status === "completed" && new Date(t.createdAt) >= monthStart);
    const returns = (transactions || []).filter((t) => t.type === "return" && new Date(t.createdAt) >= monthStart);
    const revenue = sales.reduce((sum, t) => sum + (Number(t.total) || 0), 0);
    const returnAmount = returns.reduce((sum, t) => sum + (Number(t.total) || 0), 0);
    const cogs = sales.reduce((sum, t) => sum + (t.items || []).reduce((itemSum, item) => itemSum + (Number(item.costPrice) || 0) * (Number(item.quantity) || 0), 0), 0);
    const salaryTotal = salaries
      .filter((s) => new Date(s.payment_date) >= monthStart)
      .reduce((sum, s) => sum + (Number(s.amount) || 0), 0);
    const expenditureTotal = expenditures
      .filter((e) => new Date(e.date) >= monthStart)
      .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
    const netProfit = revenue - returnAmount - cogs - salaryTotal - expenditureTotal;
    const cashflow = sales.reduce((sum, t) => sum + (Number(t.amountPaid) || 0), 0) - (salaryTotal + expenditureTotal);
    return { revenue, salaryTotal, expenditureTotal, netProfit, cashflow };
  })();

  const trendData = Array.from({ length: 6 }, (_, idx) => {
    const d = new Date();
    d.setMonth(d.getMonth() - (5 - idx));
    const start = new Date(d.getFullYear(), d.getMonth(), 1);
    const end = new Date(d.getFullYear(), d.getMonth() + 1, 1);
    const monthSales = (transactions || []).filter((t) => t.type === "sale" && t.status === "completed" && new Date(t.createdAt) >= start && new Date(t.createdAt) < end);
    const monthSalaries = salaries.filter((s) => new Date(s.payment_date) >= start && new Date(s.payment_date) < end);
    const monthExpenditures = expenditures.filter((e) => new Date(e.date) >= start && new Date(e.date) < end);
    const revenue = monthSales.reduce((sum, t) => sum + (Number(t.total) || 0), 0);
    const expense = monthSalaries.reduce((sum, s) => sum + (Number(s.amount) || 0), 0) + monthExpenditures.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
    return { month: d.toLocaleDateString("en-US", { month: "short" }), revenue, expense };
  });
  
  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        {/* Stats skeleton */}
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
        
        {/* Charts skeleton */}
        <div className="grid gap-6 lg:grid-cols-2">
          <Skeleton className="h-[400px] rounded-xl" />
          <Skeleton className="h-[400px] rounded-xl" />
        </div>
        
        {/* Tables skeleton */}
        <div className="grid gap-6 lg:grid-cols-2">
          <Skeleton className="h-[360px] rounded-xl" />
          <Skeleton className="h-[360px] rounded-xl" />
        </div>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      {/* Header strip (match screenshot vibe) */}
      <div className="border-b bg-gradient-to-r from-primary via-primary to-primary/80 text-primary-foreground">
        <div className="px-6 py-5 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="min-w-0">
            <div className="text-sm font-semibold text-primary-foreground/80">{t('dashboard.appName')}</div>
            <div className="text-xs text-primary-foreground/70">{t('dashboard.overview')}</div>
            <div className="mt-2 text-sm text-primary-foreground/80">{t('dashboard.role')}: {useAuthStore.getState().user?.role || 'user'}</div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              onClick={async () => {
                if (!token) return;
                try {
                  await listEvents(token);
                  toast.success(t('dashboard.refreshed'));
                } catch {
                  toast.error(t('dashboard.failedFetch'));
                }
              }}
            >
              {t('dashboard.refresh')}
            </Button>
            <SendReportDialog />
          </div>
        </div>
      </div>
      
      <div className="px-6 pb-6 space-y-6">
        <UshauriCard />

        {/* Welcome + headline KPIs */}
        <div className={`grid gap-4 ${isCashier ? 'lg:grid-cols-2' : 'lg:grid-cols-3'}`}>
          <div className="rounded-2xl border bg-white p-7 shadow-sm flex flex-col justify-center relative overflow-hidden group hover:shadow-md transition-all">
            <div className="absolute -right-10 -bottom-10 size-40 rounded-full bg-primary/5 blur-3xl group-hover:bg-primary/10 transition-all" />
            <div className="relative">
              <div className="text-xl font-extrabold tracking-tight">
                {t('dashboard.welcomeBack')} <span className="text-primary">{(user?.name || company?.name || 'User').split(' ')[0]}</span>
              </div>
              <div className="mt-2 text-sm text-muted-foreground leading-relaxed">
                {isCashier 
                  ? t('dashboard.trackingCashier')
                  : t('dashboard.trackingAdmin')
                }
              </div>
            </div>
          </div>
          
          <div className={`${isCashier ? '' : 'lg:col-span-2'} grid gap-4 ${isCashier ? 'grid-cols-1' : 'sm:grid-cols-2'}`}>
            <div className="rounded-2xl border bg-gradient-to-br from-orange-400 via-orange-500 to-red-600 p-7 text-white shadow-lg flex flex-col justify-between relative overflow-hidden group">
              {/* Decorative elements */}
              <div className="absolute -right-6 -top-6 size-24 rounded-full bg-white/10 blur-2xl group-hover:bg-white/20 transition-all" />
              <div className="absolute -left-10 -bottom-10 size-32 rounded-full bg-black/10 blur-2xl" />
              
              <div className="relative flex items-center justify-between">
                <div className="text-[10px] font-black uppercase tracking-[0.15em] text-white/90">
                  {isCashier ? t('dashboard.myTodaySales') : t('dashboard.todaysTotalSales')}
                </div>
                <div className="bg-white/20 p-2.5 rounded-xl backdrop-blur-md border border-white/20">
                  <BarChart3 className="size-5 text-white" />
                </div>
              </div>
              <div className="relative mt-6">
                <div className="text-3xl md:text-4xl font-black tracking-tighter leading-none flex flex-wrap items-baseline gap-1">
                  <span className="text-lg opacity-80">{company?.currencySymbol || 'TSH'}</span>
                  <span>{todayStats.todaySales.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="mt-2 text-[11px] text-white/80 font-bold uppercase tracking-wider">
                  {todayStats.todayCount} {t('dashboard.completedTransactionsToday')}
                </div>
              </div>
            </div>
            
            {!isCashier && (
              <div className="rounded-2xl border bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-700 p-7 text-white shadow-lg flex flex-col justify-between relative overflow-hidden group">
                {/* Decorative elements */}
                <div className="absolute -right-6 -top-6 size-24 rounded-full bg-white/10 blur-2xl group-hover:bg-white/20 transition-all" />
                <div className="absolute -left-10 -bottom-10 size-32 rounded-full bg-black/10 blur-2xl" />

                <div className="relative flex items-center justify-between">
                  <div className="text-[10px] font-black uppercase tracking-[0.15em] text-white/90">{t('dashboard.monthToDateSales')}</div>
                  <div className="bg-white/20 p-2.5 rounded-xl backdrop-blur-md border border-white/20">
                    <TrendingUp className="size-5 text-white" />
                  </div>
                </div>
                <div className="relative mt-6">
                  <div className="text-3xl md:text-4xl font-black tracking-tighter leading-none flex flex-wrap items-baseline gap-1">
                    <span className="text-lg opacity-80">{company?.currencySymbol || 'TSH'}</span>
                    <span>{todayStats.monthSales.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="mt-2 text-[11px] text-white/80 font-bold uppercase tracking-wider">{t('dashboard.accumulatedSalesMonth')}</div>
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Stats Cards */}
        <StatsCards stats={stats} currencySymbol={company?.currencySymbol || 'TSH'} />

        {!isCashier && (
          <>
            <div className="grid gap-4 lg:grid-cols-4">
              <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">{t('dashboard.monthlyRevenue')}</CardTitle></CardHeader><CardContent className="text-2xl font-bold">{company?.currencySymbol || "TSH"}{financeSnapshot.revenue.toFixed(2)}</CardContent></Card>
              <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">{t('dashboard.salaries')}</CardTitle></CardHeader><CardContent className="text-2xl font-bold text-amber-600">{company?.currencySymbol || "TSH"}{financeSnapshot.salaryTotal.toFixed(2)}</CardContent></Card>
              <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">{t('dashboard.expenditures')}</CardTitle></CardHeader><CardContent className="text-2xl font-bold text-red-600">{company?.currencySymbol || "TSH"}{financeSnapshot.expenditureTotal.toFixed(2)}</CardContent></Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-muted-foreground">{t('dashboard.netProfitAfterExpenses')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className={`text-2xl font-bold ${financeSnapshot.netProfit >= 0 ? "text-green-600" : "text-destructive"}`}>
                    {company?.currencySymbol || "TSH"}{financeSnapshot.netProfit.toFixed(2)}
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">{t('dashboard.grossMinusExpenses')}</p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>{t('dashboard.revenueVsCosts')}</CardTitle>
              </CardHeader>
              <CardContent className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trendData}>
                    <defs>
                      <linearGradient id="fillRevenueOverview" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.35} />
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0.05} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Area
                      type="monotone"
                      dataKey="revenue"
                      stroke="hsl(var(--primary))"
                      fill="url(#fillRevenueOverview)"
                      strokeWidth={3}
                    />
                    <Bar dataKey="expense" fill="#dc2626" radius={[8, 8, 0, 0]} barSize={18} />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </>
        )}

        {/* Events */}
        <EventsThisMonth
          onOpenCalendar={() => router.push('/dashboard/calendar')}
          onCreate={() => {
            setEventDialogKey((k) => k + 1);
            router.push('/dashboard/calendar');
          }}
        />
        
        {/* Charts Row */}
        {!isCashier ? (
          <div className="grid gap-6 lg:grid-cols-12">
            <div className="lg:col-span-8">
              <SalesChart 
                transactions={apiTransactions.length ? apiTransactions : (transactions || [])} 
                currencySymbol={company?.currencySymbol || 'TSH'} 
              />
            </div>
            <div className="lg:col-span-4">
              <TopProducts transactions={transactions || []} />
            </div>
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-12">
            <div className="lg:col-span-8">
              <RecentTransactions 
                transactions={transactions || []} 
                currencySymbol={company?.currencySymbol || 'TSH'} 
              />
            </div>
            <div className="lg:col-span-4">
              <TopProducts transactions={transactions || []} />
            </div>
          </div>
        )}
        
        {/* Alerts and Transactions Row */}
        {!isCashier && (
          <div className="grid gap-6 lg:grid-cols-2">
            <StockAlerts products={products || []} />
            <RecentTransactions 
              transactions={transactions || []} 
              currencySymbol={company?.currencySymbol || 'TSH'} 
            />
          </div>
        )}
      </div>
    </div>
  );
}
