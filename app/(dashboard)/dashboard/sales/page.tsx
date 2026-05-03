'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Search, Filter, MoreHorizontal, Eye, Download,
  Receipt, Banknote, TrendingUp, ShoppingCart,
  Calendar, Printer, RefreshCcw, RotateCcw, Undo2,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuthStore } from '@/lib/stores/auth-store';
import { apiFetch } from '@/lib/api/client';
import { toast } from 'sonner';

const statusColors: Record<string, string> = {
  completed: 'bg-green-100 text-green-800',
  pending:   'bg-yellow-100 text-yellow-800',
  cancelled: 'bg-red-100 text-red-800',
  refunded:  'bg-gray-100 text-gray-800',
};

const paymentMethodLabels: Record<string, string> = {
  cash: 'Cash', card: 'Card', mobile: 'Mobile', credit: 'Credit', partial: 'Partial',
};

/* Maps a raw API transaction (snake_case) to a usable object */
function mapTxn(t: any) {
  return {
    id:                t.id,
    companyId:         t.company_id,
    transactionNumber: t.transaction_number,
    type:              t.type ?? 'sale',
    status:            t.status,
    customerId:        t.customer_id,
    customerName:      t.customer_name ?? 'Walk-in Customer',
    items:             t.items ?? [],
    subtotal:          t.subtotal ?? 0,
    discountAmount:    t.discount_amount ?? 0,
    discountPercent:   0,
    taxAmount:         t.tax_amount ?? 0,
    taxPercent:        0,
    total:             t.total ?? 0,
    paymentMethod:     t.payment_method ?? 'cash',
    amountPaid:        t.amount_paid ?? 0,
    change:            Math.max(0, (t.amount_paid ?? 0) - (t.total ?? 0)),
    amountDue:         t.amount_due ?? 0,
    cashierId:         t.cashier_id,
    cashierName:       t.cashier_name,
    syncStatus:        'synced' as const,
    createdAt:         new Date(t.created_at),
    updatedAt:         new Date(t.updated_at),
  };
}

export default function SalesPage() {
  const { company, token } = useAuthStore();
  const [transactions, setTransactions] = useState<ReturnType<typeof mapTxn>[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [selectedTransaction, setSelectedTransaction] = useState<ReturnType<typeof mapTxn> | null>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [typeFilter, setTypeFilter] = useState<'all' | 'sale' | 'return'>('all');

  const fetchTransactions = useCallback(async (quiet = false) => {
    if (!token) return;
    if (!quiet) setIsLoading(true);
    else setIsRefreshing(true);
    try {
      const data = await apiFetch<any[]>('/tenant/transactions', { token });
      setTransactions((data ?? []).map(mapTxn).sort((a, b) =>
        b.createdAt.getTime() - a.createdAt.getTime()
      ));
    } catch (e: any) {
      toast.error(e.message || 'Failed to load transactions');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [token]);

  useEffect(() => { fetchTransactions(); }, [fetchTransactions]);

  const filtered = transactions.filter((txn) => {
    const matchSearch =
      txn.transactionNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (txn.customerName ?? '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchStatus  = statusFilter  === 'all' || txn.status        === statusFilter;
    const matchPayment = paymentFilter === 'all' || txn.paymentMethod === paymentFilter;
    const matchType = typeFilter === 'all' || txn.type === typeFilter;
    return matchSearch && matchStatus && matchPayment && matchType;
  });

  const today = new Date(); today.setHours(0, 0, 0, 0);
  const todayTxns = transactions.filter(t => {
    const d = new Date(t.createdAt); d.setHours(0, 0, 0, 0);
    return d.getTime() === today.getTime() && t.status === 'completed';
  });

  // Separate sales and returns for accurate stats
  const sales = transactions.filter(t => t.type === 'sale' && t.status === 'completed');
  const returns = transactions.filter(t => t.type === 'return');
  
  const stats = {
    totalSales: sales.length,
    todaySales: todayTxns.filter(t => t.type === 'sale').length,
    totalRevenue: sales.reduce((s, t) => s + t.total, 0),
    todayRevenue: todayTxns.filter(t => t.type === 'sale').reduce((s, t) => s + t.total, 0),
    totalReturns: returns.length,
    totalRefunded: returns.reduce((s, t) => s + t.total, 0),
    netRevenue: sales.reduce((s, t) => s + t.total, 0) - returns.reduce((s, t) => s + t.total, 0),
  };

  const formatDate = (d: Date) => new Date(d).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  });

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex justify-between">
          <Skeleton className="h-8 w-48" /><Skeleton className="h-10 w-32" />
        </div>
        <div className="grid gap-4 sm:grid-cols-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24" />)}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Sales</h1>
          <p className="text-muted-foreground">View and manage your sales transactions</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => fetchTransactions(true)} disabled={isRefreshing}>
            <RotateCcw className={`mr-2 size-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
          <Button variant="outline">
            <Download className="mr-2 size-4" />Export
          </Button>
          <Button asChild>
            <Link href="/pos">
              <ShoppingCart className="mr-2 size-4" />New Sale
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-5">
        <Card className="overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground truncate">Total Sales</CardTitle>
            <Receipt className="size-4 text-muted-foreground shrink-0" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold truncate">
              {stats.totalSales}
            </div>
            <p className="text-xs text-muted-foreground truncate">All time</p>
          </CardContent>
        </Card>
        <Card className="overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground truncate">{"Today's Sales"}</CardTitle>
            <Calendar className="size-4 text-muted-foreground shrink-0" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600 truncate">{stats.todaySales}</div>
            <p className="text-xs text-muted-foreground truncate">Transactions today</p>
          </CardContent>
        </Card>
        <Card className="overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground truncate">Gross Revenue</CardTitle>
            <Banknote className="size-4 text-muted-foreground shrink-0" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold truncate" title={`${company?.currencySymbol}${stats.totalRevenue.toLocaleString()}`}>
              <span className="text-lg opacity-80 mr-1">{company?.currencySymbol}</span>
              {stats.totalRevenue.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground truncate">All time</p>
          </CardContent>
        </Card>
        <Card className="overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground truncate">Net Revenue</CardTitle>
            <TrendingUp className="size-4 text-success shrink-0" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success truncate" title={`${company?.currencySymbol}${stats.netRevenue.toLocaleString()}`}>
              <span className="text-lg opacity-80 mr-1">{company?.currencySymbol}</span>
              {stats.netRevenue.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground truncate">After refunds</p>
          </CardContent>
        </Card>
        <Card className={`overflow-hidden ${stats.totalRefunded > 0 ? 'border-warning/50' : ''}`}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground truncate">Total Refunds</CardTitle>
            <Undo2 className={`size-4 shrink-0 ${stats.totalRefunded > 0 ? 'text-warning' : 'text-muted-foreground'}`} />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold truncate ${stats.totalRefunded > 0 ? 'text-warning' : ''}`} title={`${company?.currencySymbol}${stats.totalRefunded.toLocaleString()}`}>
              <span className="text-lg opacity-80 mr-1">{company?.currencySymbol}</span>
              {stats.totalRefunded.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground truncate">{stats.totalReturns} returns</p>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>Transactions</CardTitle>
          <CardDescription>{filtered.length} transactions found</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by transaction # or customer..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8"
              />
            </div>
            <div className="flex gap-2">
              <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as any)}>
                <SelectTrigger className="w-[130px]">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="sale">Sales</SelectItem>
                  <SelectItem value="return">Returns</SelectItem>
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[130px]">
                  <Filter className="mr-2 size-4" /><SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                  <SelectItem value="refunded">Refunded</SelectItem>
                </SelectContent>
              </Select>
              <Select value={paymentFilter} onValueChange={setPaymentFilter}>
                <SelectTrigger className="w-[130px]">
                  <SelectValue placeholder="Payment" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Payments</SelectItem>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="card">Card</SelectItem>
                  <SelectItem value="mobile">Mobile</SelectItem>
                  <SelectItem value="credit">Credit</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Transaction #</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead>Payment</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead>Amount Due</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="w-12" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                      No transactions found
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((txn) => (
                    <TableRow key={txn.id} className={txn.type === 'return' ? 'bg-warning/5' : ''}>
                      <TableCell className="font-mono font-medium">
                        <div className="flex items-center gap-2">
                          {txn.type === 'return' && <Undo2 className="size-4 text-warning" />}
                          {txn.transactionNumber}
                        </div>
                      </TableCell>
                      <TableCell>{txn.type === 'return' ? (txn.items?.[0] as any)?.originalTransactionNumber || txn.customerName || 'Walk-in' : txn.customerName || 'Walk-in'}</TableCell>
                      <TableCell>{txn.items.length} items</TableCell>
                      <TableCell>
                        <Badge variant="outline">{paymentMethodLabels[txn.paymentMethod] ?? txn.paymentMethod}</Badge>
                      </TableCell>
                      <TableCell className={`text-right font-medium ${txn.type === 'return' ? 'text-warning' : ''}`}>
                        {txn.type === 'return' ? '-' : ''}{company?.currencySymbol}{txn.total.toFixed(2)}
                      </TableCell>
                      <TableCell>
                        {txn.type === 'return' ? (
                          <span className="text-muted-foreground text-sm">—</span>
                        ) : txn.amountDue > 0 ? (
                          <span className="text-amber-600 font-medium">
                            {company?.currencySymbol}{txn.amountDue.toFixed(2)}
                          </span>
                        ) : (
                          <span className="text-green-600 text-sm">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {txn.type === 'return' ? (
                          <Badge variant="outline" className="bg-warning/10 text-warning">Refund</Badge>
                        ) : (
                          <Badge className={statusColors[txn.status] ?? ''}>{txn.status}</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {formatDate(txn.createdAt)}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon"><MoreHorizontal className="size-4" /></Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => { setSelectedTransaction(txn); setDetailsDialogOpen(true); }}>
                              <Eye className="mr-2 size-4" />View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => toast.success('Printing receipt...')}>
                              <Printer className="mr-2 size-4" />Print Receipt
                            </DropdownMenuItem>
                            {txn.status === 'completed' && (
                              <DropdownMenuItem>
                                <RefreshCcw className="mr-2 size-4" />Process Return
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Details Dialog */}
      <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Transaction Details — {selectedTransaction?.transactionNumber}</DialogTitle>
          </DialogHeader>
          {selectedTransaction && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><p className="text-muted-foreground">Customer</p><p className="font-medium">{selectedTransaction.customerName || 'Walk-in'}</p></div>
                <div><p className="text-muted-foreground">Cashier</p><p className="font-medium">{selectedTransaction.cashierName}</p></div>
                <div><p className="text-muted-foreground">Date</p><p className="font-medium">{formatDate(selectedTransaction.createdAt)}</p></div>
                <div><p className="text-muted-foreground">Payment</p><p className="font-medium">{paymentMethodLabels[selectedTransaction.paymentMethod]}</p></div>
                <div><p className="text-muted-foreground">Status</p><Badge className={statusColors[selectedTransaction.status]}>{selectedTransaction.status}</Badge></div>
                {selectedTransaction.amountDue > 0 && (
                  <div><p className="text-muted-foreground">Amount Due</p><p className="font-medium text-amber-600">{company?.currencySymbol}{selectedTransaction.amountDue.toFixed(2)}</p></div>
                )}
              </div>

              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Item</TableHead>
                      <TableHead className="text-right">Qty</TableHead>
                      <TableHead className="text-right">Price</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedTransaction.items.map((item: any, i: number) => (
                      <TableRow key={i}>
                        <TableCell>{item.productName ?? item.name}</TableCell>
                        <TableCell className="text-right">{item.quantity}</TableCell>
                        <TableCell className="text-right">{company?.currencySymbol}{(item.unitPrice ?? item.price ?? 0).toFixed(2)}</TableCell>
                        <TableCell className="text-right">{company?.currencySymbol}{(item.total ?? (item.quantity * (item.unitPrice ?? item.price ?? 0))).toFixed(2)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="border-t pt-4 space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>{company?.currencySymbol}{selectedTransaction.subtotal.toFixed(2)}</span></div>
                {selectedTransaction.discountAmount > 0 && (
                  <div className="flex justify-between text-green-600"><span>Discount</span><span>-{company?.currencySymbol}{selectedTransaction.discountAmount.toFixed(2)}</span></div>
                )}
                {selectedTransaction.taxAmount > 0 && (
                  <div className="flex justify-between"><span className="text-muted-foreground">Tax</span><span>{company?.currencySymbol}{selectedTransaction.taxAmount.toFixed(2)}</span></div>
                )}
                <div className="flex justify-between font-bold text-lg border-t pt-2">
                  <span>Total</span><span>{company?.currencySymbol}{selectedTransaction.total.toFixed(2)}</span>
                </div>
                <div className="flex justify-between"><span className="text-muted-foreground">Amount Paid</span><span>{company?.currencySymbol}{selectedTransaction.amountPaid.toFixed(2)}</span></div>
                {selectedTransaction.amountDue > 0 && (
                  <div className="flex justify-between text-amber-600 font-medium"><span>Amount Due</span><span>{company?.currencySymbol}{selectedTransaction.amountDue.toFixed(2)}</span></div>
                )}
              </div>

              <div className="flex gap-2 pt-4">
                <Button className="flex-1" onClick={() => toast.success('Printing receipt...')}>
                  <Printer className="mr-2 size-4" />Print Receipt
                </Button>
                <Button variant="outline" onClick={() => setDetailsDialogOpen(false)}>Close</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
