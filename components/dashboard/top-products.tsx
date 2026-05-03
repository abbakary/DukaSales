'use client';

import { useMemo } from 'react';
import { Pie, PieChart, Cell, Tooltip, Legend } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltipContent } from '@/components/ui/chart';
import type { Transaction } from '@/lib/types';
import { useI18n } from '@/lib/i18n/use-i18n';

interface TopProductsProps {
  transactions: Transaction[];
}

const COLORS = [
  'var(--color-chart-1)',
  'var(--color-chart-2)',
  'var(--color-chart-3)',
  'var(--color-chart-4)',
  'var(--color-chart-5)',
];

const chartConfig = {
  quantity: { label: 'Quantity Sold' },
};

export function TopProducts({ transactions }: TopProductsProps) {
  const { t } = useI18n();
  const topProductsData = useMemo(() => {
    const map: Record<string, { name: string; quantity: number; revenue: number }> = {};
    transactions.forEach(tx => {
      if (tx.status !== 'completed') return;
      tx.items.forEach(item => {
        if (!map[item.productId]) map[item.productId] = { name: item.productName, quantity: 0, revenue: 0 };
        map[item.productId].quantity += item.quantity;
        map[item.productId].revenue += item.total;
      });
    });
    return Object.values(map)
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5)
      .map((p, i) => ({ ...p, fill: COLORS[i % COLORS.length] }));
  }, [transactions]);

  if (topProductsData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t('dashboard.topSellingProducts')}</CardTitle>
          <CardDescription>{t('dashboard.bestPerformingProducts')}</CardDescription>
        </CardHeader>
        <CardContent className="flex h-[300px] items-center justify-center">
          <p className="text-sm text-muted-foreground">{t('dashboard.noSalesDataAvailable')}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('dashboard.topSellingProducts')}</CardTitle>
        <CardDescription>{t('dashboard.bestPerformingProducts')}</CardDescription>
      </CardHeader>
      <CardContent>
        {/* ChartContainer handles sizing — no ResponsiveContainer needed */}
        <ChartContainer config={chartConfig} className="h-[300px] w-full">
          <PieChart>
            <Pie
              data={topProductsData}
              cx="50%"
              cy="50%"
              labelLine={false}
              outerRadius={90}
              innerRadius={45}
              paddingAngle={2}
              dataKey="quantity"
              nameKey="name"
            >
              {topProductsData.map((entry, i) => (
                <Cell key={`cell-${i}`} fill={entry.fill} />
              ))}
            </Pie>
            <Tooltip content={<ChartTooltipContent />} />
            <Legend
              layout="vertical"
              align="right"
              verticalAlign="middle"
              formatter={value => <span className="text-xs text-foreground">{value}</span>}
            />
          </PieChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
