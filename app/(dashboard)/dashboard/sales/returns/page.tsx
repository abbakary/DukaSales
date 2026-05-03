'use client';

import { useMemo, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { RefreshCcw, Search, History, ReceiptText, Trash2, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuthStore } from '@/lib/stores/auth-store';
import { db } from '@/lib/db/dexie';
import { toast } from 'sonner';
import type { Transaction } from '@/lib/types';
import { deleteTenantResource, processPosReturn } from '@/lib/api/tenant';
import { syncTenantDataFromApi } from '@/lib/services/sync-from-api';

export default function ReturnsPage() {
  const { company, user, token } = useAuthStore();
  const [search, setSearch] = useState('');
  const [returnOpen, setReturnOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedTxn, setSelectedTxn] = useState<Transaction | null>(null);
  const [selectedReturn, setSelectedReturn] = useState<Transaction | null>(null);
  const [returnItems, setReturnItems] = useState<Record<string, number>>({});
  const [reason, setReason] = useState('');
  const [refundMethod, setRefundMethod] = useState<'cash' | 'card' | 'mobile' | 'credit'>('cash');
  const [processing, setProcessing] = useState(false);

  const canDeleteReturn = useMemo(() => user?.role === 'admin' || user?.role === 'super_admin', [user?.role]);

  const getItemUnitPrice = (item: any) => {
    const raw = item?.unitPrice ?? item?.price ?? item?.unit_price ?? 0;
    const n = Number(raw);
    return Number.isFinite(n) ? n : 0;
  };

  const getItemQty = (item: any) => {
    const raw = item?.quantity ?? item?.qty ?? 0;
    const n = Number(raw);
    return Number.isFinite(n) ? n : 0;
  };

  const transactions = useLiveQuery(
    async () => {
      if (!company?.id) return [];
      return db.transactions.where('companyId').equals(company.id)
        .filter(t => t.status === 'completed' && t.type === 'sale')
        .reverse().limit(100).toArray();
    },
    [company?.id], []
  );

  const returns = useLiveQuery(
    async () => {
      if (!company?.id) return [];
      return db.transactions.where('companyId').equals(company.id)
        .filter(t => (t.type === 'return' || t.transactionNumber.startsWith('RTN-')))
        .reverse()
        .limit(50)
        .toArray();
    },
    [company?.id], []
  );
  const products = useLiveQuery(
    async () => {
      if (!company?.id) return [];
      return db.products.where('companyId').equals(company.id).toArray();
    },
    [company?.id],
    []
  );

  const filtered = (transactions || []).filter(t =>
    t.transactionNumber.toLowerCase().includes(search.toLowerCase()) ||
    (t.customerName || '').toLowerCase().includes(search.toLowerCase())
  );

  const openReturn = (txn: Transaction) => {
    setSelectedTxn(txn);
    const init: Record<string, number> = {};
    txn.items.forEach((item: any) => {
      const key = String(item?.id ?? item?.productId ?? '');
      if (key) init[key] = 0;
    });
    setReturnItems(init);
    setReason('');
    setRefundMethod((txn.paymentMethod as any) || 'cash');
    setReturnOpen(true);
  };

  const handleReturn = async () => {
    if (!selectedTxn) return;
    if (!token || !company || !user) {
      toast.error('Session expired. Please login again');
      return;
    }
    const itemsToReturn = selectedTxn.items.filter((item: any) => {
      const key = String(item?.id ?? item?.productId ?? '');
      if (!key) return false;
      return (returnItems[key] || 0) > 0;
    });
    if (itemsToReturn.length === 0) { toast.error('Select at least one item to return'); return; }
    setProcessing(true);
    try {
      const returnQtys = itemsToReturn.reduce<Record<string, number>>((acc, item: any) => {
        const key = String(item?.id ?? item?.productId ?? '');
        acc[key] = returnItems[key] || 0;
        return acc;
      }, {});

      await processPosReturn(
        {
          original_transaction_id: selectedTxn.id,
          return_qtys: returnQtys,
          reason: reason.trim() || undefined,
          refund_method: refundMethod,
        },
        token,
      );

      await syncTenantDataFromApi(token);
      toast.success('Return processed successfully');
      setReturnOpen(false);
    } catch (e: any) {
      toast.error(e?.message || 'Failed to process return');
    } finally {
      setProcessing(false);
    }
  };

  const openReturnDetails = (txn: Transaction) => {
    setSelectedReturn(txn);
    setDetailsOpen(true);
  };

  const deleteReturn = async (txn: Transaction) => {
    if (!token) return;
    if (!canDeleteReturn) {
      toast.error('Admin access required');
      return;
    }
    try {
      await deleteTenantResource('transactions', txn.id, token);
      await syncTenantDataFromApi(token);
      toast.success('Return deleted');
    } catch (e: any) {
      toast.error(e?.message || 'Failed to delete return');
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Returns</h1>
          <p className="text-muted-foreground">Process customer returns and refunds</p>
        </div>
        <Button
          variant="outline"
          onClick={async () => {
            if (!token) return;
            try {
              await syncTenantDataFromApi(token);
              toast.success('Synced');
            } catch {
              toast.error('Sync failed');
            }
          }}
        >
          <RefreshCcw className="mr-2 size-4" />
          Refresh
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-4">
        <Card><CardContent className="pt-6"><div className="text-2xl font-bold">{(returns || []).length}</div><p className="text-sm text-muted-foreground">Total Returns</p></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="text-2xl font-bold text-destructive">{company?.currencySymbol}{(returns || []).reduce((s, r) => s + r.total, 0).toFixed(2)}</div><p className="text-sm text-muted-foreground">Total Refunded</p></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="text-2xl font-bold">{(transactions || []).length}</div><p className="text-sm text-muted-foreground">Eligible Transactions</p></CardContent></Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">
              {transactions?.length ? ((returns || []).length / transactions.length * 100).toFixed(1) : 0}%
            </div>
            <p className="text-sm text-muted-foreground">Return Rate</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="process" className="space-y-4">
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="process" className="gap-2">
              <RefreshCcw className="size-4" />
              Process Return
            </TabsTrigger>
            <TabsTrigger value="history" className="gap-2">
              <History className="size-4" />
              Return History
            </TabsTrigger>
          </TabsList>
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by transaction # or customer..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-8"
            />
          </div>
        </div>

        <TabsContent value="process">
          <Card>
            <CardHeader>
              <CardTitle>Completed Sales</CardTitle>
              <CardDescription>Select a transaction to process a return</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Transaction #</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Items</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.length === 0 ? (
                    <TableRow><TableCell colSpan={6} className="text-center py-10 text-muted-foreground">No completed sales found</TableCell></TableRow>
                  ) : filtered.map(txn => (
                    <TableRow key={txn.id}>
                      <TableCell className="font-mono font-medium">{txn.transactionNumber}</TableCell>
                      <TableCell>{txn.customerName || 'Walk-in'}</TableCell>
                      <TableCell>{txn.items.length} items</TableCell>
                      <TableCell className="text-right">{company?.currencySymbol}{txn.total.toFixed(2)}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{new Date(txn.createdAt).toLocaleString()}</TableCell>
                      <TableCell className="text-right">
                        <Button size="sm" variant="outline" onClick={() => openReturn(txn)}>
                          <RefreshCcw className="mr-2 size-3" />
                          Return
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Return Transactions</CardTitle>
              <CardDescription>View and verify completed returns</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Return #</TableHead>
                    <TableHead>Original</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead className="text-right">Refunded</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(returns || [])
                    .filter((t) =>
                      t.transactionNumber.toLowerCase().includes(search.toLowerCase()) ||
                      (t.customerName || '').toLowerCase().includes(search.toLowerCase())
                    )
                    .map((txn) => {
                      const originalNumber = (txn.items?.[0] as any)?.originalTransactionNumber;
                      const originalId = (txn.items?.[0] as any)?.originalTransactionId;
                      return (
                        <TableRow key={txn.id}>
                          <TableCell className="font-mono font-medium">{txn.transactionNumber}</TableCell>
                          <TableCell className="font-mono text-muted-foreground">{originalNumber || '-'}</TableCell>
                          <TableCell>{txn.customerName || 'Walk-in'}</TableCell>
                          <TableCell className="max-w-[200px] truncate text-muted-foreground" title={txn.notes || ((txn.items?.[0] as any)?.returnReason) || '-'}>
                            {txn.notes || ((txn.items?.[0] as any)?.returnReason) || '-'}
                          </TableCell>
                          <TableCell className="text-right">{company?.currencySymbol}{txn.total.toFixed(2)}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">{new Date(txn.createdAt).toLocaleString()}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button size="sm" variant="outline" onClick={() => openReturnDetails(txn)}>
                                <ReceiptText className="mr-2 size-3" />
                                Details
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  if (originalNumber) {
                                    setSearch(originalNumber);
                                  } else if (originalId) {
                                    toast.message('Original sale found (ID)', { description: originalId });
                                  } else {
                                    toast.error('Original sale not linked');
                                  }
                                }}
                              >
                                <ExternalLink className="mr-2 size-3" />
                                Original
                              </Button>
                              {canDeleteReturn && (
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => deleteReturn(txn)}
                                >
                                  <Trash2 className="mr-2 size-3" />
                                  Delete
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  {(returns || []).length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                        No returns yet
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={returnOpen} onOpenChange={setReturnOpen}>
        <DialogContent className="w-[98vw] h-[95vh] max-w-[1200px] sm:max-w-[1200px] p-0 flex flex-col gap-0 overflow-hidden">
          <DialogHeader className="px-6 pt-5 pb-4 border-b">
            <DialogTitle>Process Return - {selectedTxn?.transactionNumber}</DialogTitle>
            <DialogDescription>Select items and quantities to return</DialogDescription>
          </DialogHeader>
          {selectedTxn && (
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Refund Method</Label>
                  <Select value={refundMethod} onValueChange={(v) => setRefundMethod(v as any)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select method" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">Cash</SelectItem>
                      <SelectItem value="mobile">Mobile money</SelectItem>
                      <SelectItem value="card">Card</SelectItem>
                      <SelectItem value="credit">Credit</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Customer</Label>
                  <Input value={selectedTxn.customerName || 'Walk-in Customer'} disabled className="bg-muted/30" />
                </div>
              </div>

              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/30">
                      <TableHead>Item</TableHead>
                      <TableHead className="text-right">Sold</TableHead>
                      <TableHead className="text-right">Price</TableHead>
                      <TableHead className="w-[120px] text-right">Return Qty</TableHead>
                      <TableHead className="text-right">Refund</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedTxn.items.map((item: any) => {
                      const key = String(item?.id ?? item?.productId ?? '');
                      const unitPrice = getItemUnitPrice(item);
                      const returnQty = returnItems[key] || 0;
                      const soldQty = getItemQty(item);
                      const maxReturn = soldQty;

                      return (
                        <TableRow key={key}>
                          <TableCell className="font-medium">{item.productName ?? item.name}</TableCell>
                          <TableCell className="text-right">{soldQty}</TableCell>
                          <TableCell className="text-right">{company?.currencySymbol}{unitPrice.toFixed(2)}</TableCell>
                          <TableCell className="text-right">
                            <Input
                              type="number"
                              min={0}
                              max={maxReturn}
                              className="w-full h-9 text-right"
                              value={returnQty}
                              onChange={(e) => {
                                const v = Math.min(maxReturn, Math.max(0, parseInt(e.target.value) || 0));
                                setReturnItems(prev => ({ ...prev, [key]: v }));
                              }}
                            />
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {company?.currencySymbol}{(unitPrice * returnQty).toFixed(2)}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              <div className="flex flex-col items-end gap-2 pr-4">
                <div className="text-lg font-bold flex gap-4">
                  <span className="text-muted-foreground">Total Refund:</span>
                  <span className="text-destructive">
                    {company?.currencySymbol}
                    {selectedTxn.items.reduce((s, item) => {
                      const key = String(item?.id ?? item?.productId ?? '');
                      return s + getItemUnitPrice(item) * (returnItems[key] || 0);
                    }, 0).toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Return Reason</Label>
                <Textarea 
                  placeholder="Reason for return..." 
                  value={reason} 
                  onChange={e => setReason(e.target.value)} 
                  rows={3} 
                  className="resize-none"
                />
              </div>
            </div>
          )}
          <DialogFooter className="px-6 py-4 border-t bg-background">
            <Button variant="outline" onClick={() => setReturnOpen(false)}>Cancel</Button>
            <Button 
              onClick={handleReturn} 
              disabled={processing}
              className="min-w-[140px]"
            >
              {processing ? 'Processing...' : 'Process Return'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Return Details</DialogTitle>
            <DialogDescription>{selectedReturn?.transactionNumber}</DialogDescription>
          </DialogHeader>
          {selectedReturn && (
            <div className="space-y-4">
              <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
                <Card className="shadow-sm">
                  <CardContent className="pt-6">
                    <div className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Refunded Amount</div>
                    <div className="text-xl font-black text-destructive mt-1">
                      {company?.currencySymbol}{selectedReturn.total.toFixed(2)}
                    </div>
                  </CardContent>
                </Card>
                <Card className="shadow-sm">
                  <CardContent className="pt-6">
                    <div className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Original Sale</div>
                    <div className="text-sm font-mono font-bold mt-1">
                      {((selectedReturn.items?.[0] as any)?.originalTransactionNumber) || '-'}
                    </div>
                  </CardContent>
                </Card>
                <Card className="shadow-sm">
                  <CardContent className="pt-6">
                    <div className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Refund Method</div>
                    <div className="text-sm font-bold capitalize mt-1">
                      {((selectedReturn.items?.[0] as any)?.refundMethod) || selectedReturn.paymentMethod}
                    </div>
                  </CardContent>
                </Card>
                <Card className="shadow-sm">
                  <CardContent className="pt-6">
                    <div className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Processed By</div>
                    <div className="text-sm font-bold mt-1">
                      {selectedReturn.cashierName || 'N/A'}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Return Reason */}
              {(selectedReturn.notes || (selectedReturn.items?.[0] as any)?.returnReason) && (
                <Card className="border-warning/50 bg-warning/5">
                  <CardContent className="pt-4">
                    <div className="flex items-start gap-2">
                      <div className="text-xs text-muted-foreground uppercase tracking-wide">Return Reason</div>
                    </div>
                    <p className="mt-1 text-sm">{selectedReturn.notes || (selectedReturn.items?.[0] as any)?.returnReason}</p>
                  </CardContent>
                </Card>
              )}

              {/* Return Date/Time */}
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <span className="font-medium">Date:</span>
                  {new Date(selectedReturn.createdAt).toLocaleDateString()}
                </div>
                <div className="flex items-center gap-1">
                  <span className="font-medium">Time:</span>
                  {new Date(selectedReturn.createdAt).toLocaleTimeString()}
                </div>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item</TableHead>
                    <TableHead className="text-right">Qty Returned</TableHead>
                    <TableHead className="text-right">Unit Price</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead>Original Item</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {selectedReturn.items.map((i: any, idx: number) => (
                    <TableRow key={String(i?.id ?? i?.productId ?? `${idx}`)}>
                      <TableCell className="font-medium">{i.productName}</TableCell>
                      <TableCell className="text-right">{getItemQty(i)}</TableCell>
                      <TableCell className="text-right">{company?.currencySymbol}{getItemUnitPrice(i).toFixed(2)}</TableCell>
                      <TableCell className="text-right font-medium text-destructive">
                        -{company?.currencySymbol}{(Number(i.total) || (getItemUnitPrice(i) * getItemQty(i))).toFixed(2)}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {i.originalItemId ? `Item ID: ${i.originalItemId.slice(0, 8)}...` : '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailsOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
