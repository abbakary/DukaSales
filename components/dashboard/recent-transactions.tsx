'use client';

import Link from 'next/link';
import { ArrowRight, Receipt, CheckCircle, Clock, XCircle, Undo2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { Transaction } from '@/lib/types';
import { useI18n } from '@/lib/i18n/use-i18n';

interface RecentTransactionsProps {
  transactions: Transaction[];
  currencySymbol?: string;
}

export function RecentTransactions({ transactions, currencySymbol = 'Tsh' }: RecentTransactionsProps) {
  const { t } = useI18n();
  const formatCurrency = (value: number) => {
    return `${currencySymbol}${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatDate = (date: Date) => {
    const now = new Date();
    const txDate = new Date(date);
    const diffMs = now.getTime() - txDate.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'Sasa hivi';
    if (diffMins < 60) return `${diffMins}m iliyopita`;
    if (diffHours < 24) return `${diffHours}${t('dashboard.hoursAgo')}`;
    if (diffDays < 7) return `${diffDays}d iliyopita`;
    return txDate.toLocaleDateString();
  };

  const getStatusIcon = (tx: Transaction) => {
    // Check if it's a return transaction
    if (tx.type === 'return') {
      return <Undo2 className="size-4 text-warning" />;
    }
    switch (tx.status) {
      case 'completed':
        return <CheckCircle className="size-4 text-success" />;
      case 'pending':
        return <Clock className="size-4 text-warning" />;
      case 'cancelled':
      case 'refunded':
        return <XCircle className="size-4 text-destructive" />;
      default:
        return <Receipt className="size-4 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (tx: Transaction) => {
    // Handle return type specially
    if (tx.type === 'return') {
      return (
        <Badge variant="outline" className="capitalize bg-warning/10 text-warning border-warning">
          <Undo2 className="size-3 mr-1" />
          Marejesho
        </Badge>
      );
    }
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      completed: 'default',
      pending: 'secondary',
      cancelled: 'destructive',
      refunded: 'outline',
    };
    return (
      <Badge variant={variants[tx.status] || 'secondary'} className="capitalize">
        {tx.status === 'completed' ? t('dashboard.completed') : tx.status}
      </Badge>
    );
  };

  const getTransactionType = (tx: Transaction) => {
    if (tx.type === 'return') {
      return 'Marejesho';
    }
    return tx.transactionNumber;
  };

  const recentTransactions = transactions.slice(0, 10);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>{t('dashboard.recentTransactions')}</CardTitle>
          <CardDescription>{t('dashboard.latestSalesAndRefunds')}</CardDescription>
        </div>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/dashboard/sales">
            {t('dashboard.viewAll')}
            <ArrowRight className="ml-1 size-4" />
          </Link>
        </Button>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[280px] pr-4">
          {recentTransactions.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full py-8 text-center">
              <div className="rounded-full bg-muted p-3 mb-3">
                <Receipt className="size-6 text-muted-foreground" />
              </div>
              <p className="font-medium">Hakuna miamala bado</p>
              <p className="text-sm text-muted-foreground">Anza mauzo kwenye POS</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentTransactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className={`flex items-center justify-between rounded-lg border p-3 hover:bg-muted/50 transition-colors ${
                    transaction.type === 'return' ? 'border-warning/30 bg-warning/5' : ''
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`rounded-full p-2 ${transaction.type === 'return' ? 'bg-warning/20' : 'bg-muted'}`}>
                      {getStatusIcon(transaction)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-sm">
                          {getTransactionType(transaction)}
                        </p>
                        {getStatusBadge(transaction)}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {transaction.type === 'return' 
                          ? `Original: ${(transaction.items?.[0] as any)?.originalTransactionNumber || (transaction as any).originalTransactionNumber || 'N/A'}`
                          : `${transaction.customerName || t('dashboard.walkInCustomer')} • ${transaction.items.length} ${t('dashboard.items')}`
                        }
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-semibold ${transaction.type === 'return' ? 'text-warning' : ''}`}>
                      {transaction.type === 'return' ? '-' : ''}{formatCurrency(transaction.total)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(transaction.createdAt)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
