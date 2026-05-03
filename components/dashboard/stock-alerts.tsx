'use client';

import Link from 'next/link';
import { AlertTriangle, Clock, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { Product } from '@/lib/types';
import { useBusinessFeatures } from '@/lib/hooks/use-business-features';
import { useI18n } from '@/lib/i18n/use-i18n';

interface StockAlertsProps {
  products: Product[];
}

export function StockAlerts({ products }: StockAlertsProps) {
  const { t } = useI18n();
  const { hasExpiryTracking } = useBusinessFeatures();
  
  const lowStockProducts = products.filter(
    (p) => p.isActive && p.quantity <= p.minStock
  );
  
  const expiringProducts = hasExpiryTracking
    ? products.filter((p) => {
        if (!p.expiryDate || !p.isActive) return false;
        const daysUntilExpiry = Math.ceil(
          (new Date(p.expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
        );
        return daysUntilExpiry <= 30 && daysUntilExpiry > 0;
      })
    : [];

  const expiredProducts = hasExpiryTracking
    ? products.filter((p) => {
        if (!p.expiryDate || !p.isActive) return false;
        return new Date(p.expiryDate).getTime() < Date.now();
      })
    : [];

  const hasAlerts = lowStockProducts.length > 0 || expiringProducts.length > 0 || expiredProducts.length > 0;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>{t('dashboard.stockAlerts')}</CardTitle>
          <CardDescription>{t('dashboard.itemsRequiringAttention')}</CardDescription>
        </div>
        {hasAlerts && (
          <Button variant="ghost" size="sm" asChild>
            <Link href="/dashboard/inventory">
              {t('dashboard.viewAll')}
              <ArrowRight className="ml-1 size-4" />
            </Link>
          </Button>
        )}
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[280px] pr-4">
          {!hasAlerts ? (
            <div className="flex flex-col items-center justify-center h-full py-8 text-center">
              <div className="rounded-full bg-success/10 p-3 mb-3">
                <AlertTriangle className="size-6 text-success" />
              </div>
              <p className="font-medium">{t('dashboard.allClear')}</p>
              <p className="text-sm text-muted-foreground">{t('dashboard.noStockAlerts')}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Expired Products */}
              {expiredProducts.map((product) => (
                <div
                  key={`expired-${product.id}`}
                  className="flex items-center justify-between rounded-lg border border-destructive/20 bg-destructive/5 p-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="rounded-full bg-destructive/10 p-2">
                      <Clock className="size-4 text-destructive" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{product.name}</p>
                      <p className="text-xs text-muted-foreground">
                        SKU: {product.sku}
                      </p>
                    </div>
                  </div>
                  <Badge variant="destructive">Expired</Badge>
                </div>
              ))}

              {/* Expiring Soon Products */}
              {expiringProducts.map((product) => {
                const daysUntilExpiry = Math.ceil(
                  (new Date(product.expiryDate!).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
                );
                return (
                  <div
                    key={`expiring-${product.id}`}
                    className="flex items-center justify-between rounded-lg border border-warning/20 bg-warning/5 p-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="rounded-full bg-warning/10 p-2">
                        <Clock className="size-4 text-warning" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">{product.name}</p>
                        <p className="text-xs text-muted-foreground">
                          SKU: {product.sku}
                        </p>
                      </div>
                    </div>
                    <Badge className="bg-warning text-warning-foreground">
                      {daysUntilExpiry} days
                    </Badge>
                  </div>
                );
              })}

              {/* Low Stock Products */}
              {lowStockProducts.map((product) => (
                <div
                  key={`low-${product.id}`}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="rounded-full bg-muted p-2">
                      <AlertTriangle className="size-4 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{product.name}</p>
                      <p className="text-xs text-muted-foreground">
                        SKU: {product.sku}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge variant="secondary">
                      {product.quantity} left
                    </Badge>
                    <p className="text-xs text-muted-foreground mt-1">
                      Min: {product.minStock}
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
