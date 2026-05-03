'use client';

import { Banknote, ShoppingCart, Package, TrendingUp, Users, AlertTriangle, Target, Undo2, Percent } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { DashboardStats } from '@/lib/types';
import { useAuthStore } from '@/lib/stores/auth-store';
import { useI18n } from '@/lib/i18n/use-i18n';

interface StatsCardsProps {
  stats: DashboardStats;
  currencySymbol?: string;
}

export function StatsCards({ stats, currencySymbol = 'Tsh' }: StatsCardsProps) {
  const { user } = useAuthStore();
  const { t } = useI18n();
  const isCashier = user?.role === 'cashier';
  const isManager = user?.role === 'manager';
  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';

  const formatCurrency = (value: number) => {
    return `${currencySymbol}${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const allCards = [
    {
      title: t('dashboard.totalRevenue'),
      value: formatCurrency(stats.netRevenue || stats.totalRevenue),
      icon: Banknote,
      description: stats.totalRefunds > 0 ? `Net (Gross: ${formatCurrency(stats.grossRevenue || stats.totalRevenue)} - Refunds: ${formatCurrency(stats.totalRefunds)})` : t('dashboard.totalSalesThisMonth'),
      trend: stats.returnRate > 0 ? `${stats.returnRate.toFixed(1)}% returns` : '+12.5%',
      trendUp: stats.returnRate < 5,
      color: 'text-chart-1',
      bgColor: 'bg-chart-1/10',
      roles: ['admin', 'manager'],
      showWhen: isAdmin || isManager,
    },
    {
      title: isCashier ? t('dashboard.mySales') : t('dashboard.salesCount'),
      value: stats.salesCount.toString(),
      icon: ShoppingCart,
      description: isCashier ? t('dashboard.yourTransactions') : t('dashboard.transactionsThisMonth'),
      trend: '+8.2%',
      trendUp: true,
      color: 'text-chart-2',
      bgColor: 'bg-chart-2/10',
      roles: ['admin', 'manager', 'cashier'],
      showWhen: true,
    },
    {
      title: t('sidebar.purchases'),
      value: formatCurrency(stats.totalPurchases),
      icon: Package,
      description: t('dashboard.transactionsThisMonth'),
      trend: '-3.1%',
      trendUp: false,
      color: 'text-chart-3',
      bgColor: 'bg-chart-3/10',
      roles: ['admin', 'manager'],
      showWhen: isAdmin || isManager,
    },
    {
      title: t('dashboard.grossProfit'),
      value: formatCurrency(stats.totalProfit),
      icon: TrendingUp,
      description: t('dashboard.salesMinusCost'),
      trend: `${stats.profitMargin.toFixed(1)}% ${t('dashboard.margin')}`,
      trendUp: stats.profitMargin > 20,
      color: 'text-success',
      bgColor: 'bg-success/10',
      roles: ['admin', 'manager'],
      showWhen: isAdmin || isManager,
    },
    {
      title: isCashier ? t('dashboard.myTopItem') : t('dashboard.topCustomer'),
      value: isCashier ? (stats.topProduct || 'N/A') : stats.topCustomer,
      icon: isCashier ? Target : Users,
      description: isCashier ? t('dashboard.yourMostSoldItem') : t('dashboard.highestSpendingCustomer'),
      trend: isCashier ? t('dashboard.popular') : t('dashboard.topCustomerTag'),
      trendUp: true,
      color: 'text-chart-4',
      bgColor: 'bg-chart-4/10',
      roles: ['admin', 'manager', 'cashier'],
      showWhen: true,
    },
    {
      title: t('dashboard.lowStock'),
      value: stats.lowStockCount.toString(),
      icon: AlertTriangle,
      description: t('dashboard.itemsNeedRestocking'),
      trend: stats.lowStockCount > 0 ? t('dashboard.attention') : t('dashboard.allGood'),
      trendUp: stats.lowStockCount === 0,
      color: stats.lowStockCount > 0 ? 'text-warning' : 'text-success',
      bgColor: stats.lowStockCount > 0 ? 'bg-warning/10' : 'bg-success/10',
      roles: ['admin', 'manager', 'cashier'],
      showWhen: true,
    },
    // Return-specific cards for admin/manager
    {
      title: t('dashboard.totalRefunds'),
      value: formatCurrency(stats.totalRefunds || 0),
      icon: Undo2,
      description: t('dashboard.returnsProcessed'),
      trend: stats.returnRate > 0 ? `${stats.returnRate.toFixed(1)}% ${t('dashboard.returnRate')}` : t('dashboard.noReturns'),
      trendUp: stats.returnRate < 3,
      color: stats.totalRefunds > 0 ? 'text-destructive' : 'text-muted-foreground',
      bgColor: stats.totalRefunds > 0 ? 'bg-destructive/10' : 'bg-muted/10',
      roles: ['admin', 'manager'],
      showWhen: isAdmin || isManager,
    },
    {
      title: t('dashboard.returnRate'),
      value: `${(stats.returnRate || 0).toFixed(1)}%`,
      icon: Percent,
      description: t('dashboard.refundsAsPercentage'),
      trend: stats.returnRate < 5 ? t('dashboard.healthy') : 'Inahitaji usikilizwaji',
      trendUp: stats.returnRate < 5,
      color: stats.returnRate < 5 ? 'text-success' : 'text-warning',
      bgColor: stats.returnRate < 5 ? 'bg-success/10' : 'bg-warning/10',
      roles: ['admin', 'manager'],
      showWhen: isAdmin || isManager,
    },
  ];

  const cards = allCards.filter(card => card.showWhen && (!card.roles || (user && card.roles.includes(user.role))));

  return (
    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
      {cards.map((card) => (
        <Card key={card.title} className="relative overflow-hidden flex flex-col min-w-[200px]">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground mr-2 flex-1 truncate">
              {card.title}
            </CardTitle>
            <div className={`shrink-0 rounded-lg p-2 ${card.bgColor}`}>
              <card.icon className={`size-4 ${card.color}`} />
            </div>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col justify-between">
            <div className="text-xl font-bold tracking-tight sm:text-2xl break-all">
              {card.value}
            </div>
            <div className="flex flex-col mt-2 sm:flex-row sm:items-center sm:gap-2">
              <span
                className={`text-xs font-medium ${
                  card.trendUp ? 'text-success' : 'text-destructive'
                }`}
              >
                {card.trend}
              </span>
              <span className="text-xs text-muted-foreground break-all">
                {card.description}
              </span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
