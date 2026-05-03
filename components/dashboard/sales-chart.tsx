'use client';

import { useMemo } from 'react';
import { Area, AreaChart, Bar, CartesianGrid, XAxis, YAxis } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import type { Transaction } from '@/lib/types';
import { useI18n } from '@/lib/i18n/use-i18n';

interface SalesChartProps {
  transactions: Transaction[];
  currencySymbol?: string;
}

export function SalesChart({ transactions, currencySymbol = 'Tsh' }: SalesChartProps) {
  const { t } = useI18n();
  
  // Dynamic chart config based on translations
  const chartConfig = useMemo(() => ({
    revenue: { label: t('dashboard.revenue'), color: 'hsl(160 84% 39%)' },
    orders: { label: t('dashboard.orders'), color: 'hsl(224 76% 48%)' },
  }), [t]);
  
  const chartData = useMemo(() => {
    const today = new Date();
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date(today);
      date.setDate(date.getDate() - (6 - i));
      return {
        date: date.toISOString().split('T')[0],
        label: t(`dashboard.${date.toLocaleDateString('en-US', { weekday: 'short' }).toLowerCase()}`),
        revenue: 0,
        orders: 0,
      };
    });

    transactions.forEach(tx => {
      const txDate = new Date(tx.createdAt).toISOString().split('T')[0];
      const day = last7Days.find(d => d.date === txDate);
      if (day && tx.status === 'completed') {
        day.revenue += Number(tx.total) || 0;
        day.orders += 1;
      }
    });

    return last7Days;
  }, [transactions]);

  const totals = useMemo(() => {
    return chartData.reduce(
      (acc, day) => {
        acc.revenue += day.revenue;
        acc.orders += day.orders;
        return acc;
      },
      { revenue: 0, orders: 0 }
    );
  }, [chartData]);

  return (
    <Card className="border-border/60 shadow-sm">
      <CardHeader className="space-y-4">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
        <CardTitle>{t('dashboard.salesOverview')}</CardTitle>
            <CardDescription>{t('dashboard.liveSalesPerformance')}</CardDescription>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full md:w-auto md:min-w-[400px]">
            <div className="rounded-2xl border border-border/60 bg-muted/20 px-4 py-3 shadow-sm">
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground/80">{t('dashboard.revenue')}</p>
              <p className="mt-2 text-2xl font-black tracking-tight text-primary">
                {currencySymbol}{totals.revenue.toLocaleString()}
              </p>
            </div>
            <div className="rounded-2xl border border-border/60 bg-muted/20 px-4 py-3 shadow-sm">
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground/80">{t('dashboard.orders')}</p>
              <p className="mt-2 text-2xl font-black tracking-tight text-primary">
                {totals.orders.toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[330px] w-full">
          <AreaChart data={chartData} margin={{ top: 12, right: 12, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="fillRevenue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-revenue)" stopOpacity={0.35} />
                <stop offset="95%" stopColor="var(--color-revenue)" stopOpacity={0.05} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-muted/60" />
            <XAxis
              dataKey="label"
              tickLine={false}
              axisLine={false}
              tickMargin={10}
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              width={72}
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
              tickFormatter={v => `${currencySymbol}${Number(v).toLocaleString()}`}
            />
            <ChartTooltip
              cursor={{ stroke: 'hsl(var(--border))', strokeDasharray: '4 4' }}
              content={
                <ChartTooltipContent
                  formatter={(value, name) => (
                    <div className="flex min-w-[140px] items-center justify-between gap-4">
                      <span className="text-muted-foreground">{name}</span>
                      <span className="font-semibold text-foreground">
                        {name === t('dashboard.revenue')
                          ? `${currencySymbol}${Number(value).toLocaleString()}`
                          : Number(value).toLocaleString()}
                      </span>
                    </div>
                  )}
                />
              }
            />
            <ChartLegend content={<ChartLegendContent />} />
            <Area
              type="monotone"
              dataKey="revenue"
              name={t('dashboard.revenue')}
              stroke="var(--color-revenue)"
              fill="url(#fillRevenue)"
              strokeWidth={3}
              dot={{ r: 4, fill: 'var(--color-revenue)', strokeWidth: 0 }}
              activeDot={{ r: 6 }}
            />
            <Bar
              dataKey="orders"
              name={t('dashboard.orders')}
              fill="var(--color-orders)"
              radius={[8, 8, 0, 0]}
              barSize={18}
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
