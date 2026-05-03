'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Search, Filter, MoreHorizontal, Eye, Banknote, Download,
  CreditCard, AlertTriangle, Clock, CheckCircle, Plus, Receipt, Calendar, RotateCcw,
  CheckCircle2, Clock3, AlertCircle
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Field, FieldLabel, FieldGroup } from '@/components/ui/field';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuthStore } from '@/lib/stores/auth-store';
import { apiFetch } from '@/lib/api/client';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const statusColors: Record<string, string> = {
  pending:    'bg-yellow-100 text-yellow-800',
  partial:    'bg-blue-100 text-blue-800',
  paid:       'bg-green-100 text-green-800',
  overdue:    'bg-red-100 text-red-800',
  written_off:'bg-gray-100 text-gray-800',
};

function mapDebt(d: any) {
  return {
    id:              d.id,
    companyId:       d.company_id,
    type:            d.type,
    entityType:      d.entity_type,
    entityId:        d.entity_id,
    entityName:      d.entity_name,
    referenceType:   d.reference_type,
    referenceId:     d.reference_id,
    referenceNumber: d.reference_number,
    originalAmount:  d.original_amount ?? 0,
    paidAmount:      d.paid_amount ?? 0,
    remainingAmount: d.remaining_amount ?? 0,
    dueDate:         d.due_date ? new Date(d.due_date) : undefined,
    status:          d.status ?? 'pending',
    payments:        d.payments ?? [],
    notes:           d.notes,
    createdAt:       new Date(d.created_at),
    updatedAt:       new Date(d.updated_at),
  };
}

export default function CreditsPage() {
  const { company, token } = useAuthStore();
  const [debts, setDebts] = useState<ReturnType<typeof mapDebt>[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('receivables');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [selectedDebt, setSelectedDebt] = useState<ReturnType<typeof mapDebt> | null>(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [submitting, setSubmitting] = useState(false);

  const fetchDebts = useCallback(async (quiet = false) => {
    if (!token) {
      setDebts([]);
      setIsLoading(false);
      setIsRefreshing(false);
      return;
    }
    if (!quiet) setIsLoading(true);
    else setIsRefreshing(true);
    try {
      const data = await apiFetch<any[]>('/tenant/debts', { token });
      setDebts((data ?? []).map(mapDebt));
    } catch (e: any) {
      toast.error(e.message || 'Failed to load debts');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [token]);

  useEffect(() => { fetchDebts(); }, [fetchDebts]);

  const receivables = debts.filter(d => d.type === 'receivable');
  const payables    = debts.filter(d => d.type === 'payable');

  const filterDebts = (list: typeof debts) => list.filter(d => {
    const q = searchQuery.toLowerCase();
    const matchSearch  = (d.entityName || "").toLowerCase().includes(q) ||
      (d.referenceNumber || "").toLowerCase().includes(q);
    const matchStatus  = statusFilter === 'all' || d.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const receivablesStats = {
    total:   receivables.filter(d => d.status !== 'paid').reduce((s, d) => s + d.remainingAmount, 0),
    pending: receivables.filter(d => d.status === 'pending' || d.status === 'partial').length,
    overdue: receivables.filter(d =>
      d.status === 'overdue' ||
      (d.status !== 'paid' && d.dueDate && new Date(d.dueDate) < new Date())
    ).length,
  };
  const payablesStats = {
    total:   payables.filter(d => d.status !== 'paid').reduce((s, d) => s + d.remainingAmount, 0),
    pending: payables.filter(d => d.status === 'pending' || d.status === 'partial').length,
  };

  const handleRecordPayment = (debt: ReturnType<typeof mapDebt>) => {
    setSelectedDebt(debt);
    setPaymentAmount(String(debt.remainingAmount));
    setPaymentMethod('cash');
    setPaymentDialogOpen(true);
  };

  const confirmPayment = async () => {
    if (!selectedDebt || !token) return;
    const amount = parseFloat(paymentAmount);
    if (isNaN(amount) || amount <= 0) { toast.error('Enter a valid amount'); return; }
    if (amount > selectedDebt.remainingAmount) { toast.error('Amount exceeds remaining balance'); return; }

    setSubmitting(true);
    try {
      await apiFetch(`/tenant/debts/${selectedDebt.id}/record-payment`, {
        method: 'POST',
        token,
        body: JSON.stringify({ amount, payment_method: paymentMethod }),
      });

      toast.success(`Payment of ${company?.currencySymbol}${amount.toFixed(2)} recorded`);
      setPaymentDialogOpen(false);
      // Re-fetch fresh data from API immediately
      await fetchDebts(true);
    } catch (e: any) {
      toast.error(e.message || 'Failed to record payment');
    } finally {
      setSubmitting(false);
    }
  };

  const DebtTable = ({ list, type }: { list: typeof debts; type: 'receivable' | 'payable' }) => (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{type === 'receivable' ? 'Customer' : 'Supplier'}</TableHead>
            <TableHead>Reference</TableHead>
            <TableHead className="text-right">Original</TableHead>
            <TableHead className="text-right">Remaining</TableHead>
            <TableHead>Progress</TableHead>
            <TableHead>Due Date</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-12" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {list.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                No {type === 'receivable' ? 'receivables' : 'payables'} found
              </TableCell>
            </TableRow>
          ) : list.map(debt => (
            <TableRow key={debt.id}>
              <TableCell>
                <div className="flex items-center gap-3">
                  <Avatar className="size-8">
                    <AvatarFallback className="bg-primary/10 text-primary text-xs">
                      {debt.entityName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="font-medium">{debt.entityName}</span>
                </div>
              </TableCell>
              <TableCell className="font-mono text-sm">{debt.referenceNumber}</TableCell>
              <TableCell className="text-right text-muted-foreground">
                {company?.currencySymbol}{debt.originalAmount.toFixed(2)}
              </TableCell>
              <TableCell className="text-right font-medium">
                {debt.status === 'paid' ? (
                  <span className="text-green-600">Paid</span>
                ) : (
                  <span className={debt.remainingAmount > 0 ? 'text-amber-600' : 'text-green-600'}>
                    {company?.currencySymbol}{debt.remainingAmount.toFixed(2)}
                  </span>
                )}
              </TableCell>
              <TableCell>
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    {debt.paidAmount >= debt.originalAmount ? (
                      <Badge className="bg-emerald-500 hover:bg-emerald-600 text-white border-0 font-black uppercase text-[9px] tracking-widest px-2 h-5">
                        <CheckCircle2 className="mr-1 size-3" /> Fully Paid
                      </Badge>
                    ) : debt.paidAmount > 0 ? (
                      <Badge className="bg-amber-500 hover:bg-amber-600 text-white border-0 font-black uppercase text-[9px] tracking-widest px-2 h-5">
                        <Clock3 className="mr-1 size-3" /> Partial
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="border-rose-200 bg-rose-50 text-rose-600 font-black uppercase text-[9px] tracking-widest px-2 h-5">
                        <AlertCircle className="mr-1 size-3" /> Unpaid
                      </Badge>
                    )}
                  </div>
                  <Progress
                    value={debt.originalAmount > 0 ? (debt.paidAmount / debt.originalAmount) * 100 : 0}
                    className="h-1.5 w-24"
                  />
                  <p className="text-[10px] font-bold text-muted-foreground">
                    {debt.originalAmount > 0 ? Math.round((debt.paidAmount / debt.originalAmount) * 100) : 0}% cleared
                  </p>
                </div>
              </TableCell>
              <TableCell>
                {debt.dueDate ? (
                  <div className="flex items-center gap-1">
                    <Calendar className="size-3 text-muted-foreground" />
                    <span className="text-sm">{new Date(debt.dueDate).toLocaleDateString()}</span>
                  </div>
                ) : <span className="text-muted-foreground text-sm">—</span>}
              </TableCell>
              <TableCell>
                <Badge className={cn("font-black uppercase text-[10px] tracking-widest", statusColors[debt.status] || '')}>{debt.status}</Badge>
              </TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon"><MoreHorizontal className="size-4" /></Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => { setSelectedDebt(debt); setDetailsDialogOpen(true); }}>
                      <Eye className="mr-2 size-4" />View Details
                    </DropdownMenuItem>
                    {debt.status !== 'paid' && (
                      <DropdownMenuItem onClick={() => handleRecordPayment(debt)}>
                        <Plus className="mr-2 size-4" />
                        {type === 'receivable' ? 'Record Payment' : 'Make Payment'}
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem><Receipt className="mr-2 size-4" />Send Reminder</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-4 sm:grid-cols-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24" />)}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Credits &amp; Debts</h1>
          <p className="text-muted-foreground">Manage customer receivables and supplier payables</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => fetchDebts(true)} disabled={isRefreshing}>
            <RotateCcw className={`mr-2 size-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
          <Button variant="outline"><Download className="mr-2 size-4" />Export Report</Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Receivables</CardTitle>
            <Banknote className="size-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{company?.currencySymbol}{receivablesStats.total.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">{receivablesStats.pending} pending</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Overdue</CardTitle>
            <AlertTriangle className="size-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{receivablesStats.overdue}</div>
            <p className="text-xs text-muted-foreground">Need follow-up</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Payables</CardTitle>
            <CreditCard className="size-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{company?.currencySymbol}{payablesStats.total.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">{payablesStats.pending} pending</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Net Position</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${receivablesStats.total - payablesStats.total >= 0 ? 'text-green-600' : 'text-destructive'}`}>
              {company?.currencySymbol}{(receivablesStats.total - payablesStats.total).toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">Receivables - Payables</p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="receivables">Customer Receivables ({receivables.filter(d => d.status !== 'paid').length})</TabsTrigger>
          <TabsTrigger value="payables">Supplier Payables ({payables.filter(d => d.status !== 'paid').length})</TabsTrigger>
        </TabsList>

        {(['receivables', 'payables'] as const).map(tab => (
          <TabsContent key={tab} value={tab} className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>{tab === 'receivables' ? 'Customer Receivables' : 'Supplier Payables'}</CardTitle>
                <CardDescription>{tab === 'receivables' ? 'Money owed to you by customers' : 'Money you owe to suppliers'}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center mb-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder={`Search by ${tab === 'receivables' ? 'customer' : 'supplier'} or reference...`}
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      className="pl-8"
                    />
                  </div>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[130px]"><Filter className="mr-2 size-4" /><SelectValue placeholder="Status" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="partial">Partial</SelectItem>
                      <SelectItem value="overdue">Overdue</SelectItem>
                      <SelectItem value="paid">Paid</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <DebtTable
                  list={filterDebts(tab === 'receivables' ? receivables : payables)}
                  type={tab === 'receivables' ? 'receivable' : 'payable'}
                />
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>

      {/* Payment Dialog */}
      <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record Payment</DialogTitle>
            <DialogDescription>Record a payment for {selectedDebt?.entityName}</DialogDescription>
          </DialogHeader>
          <FieldGroup>
            <div className="bg-muted/50 p-4 rounded-lg space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Original Amount</span><span>{company?.currencySymbol}{selectedDebt?.originalAmount.toFixed(2)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Already Paid</span><span>{company?.currencySymbol}{selectedDebt?.paidAmount.toFixed(2)}</span></div>
              <div className="flex justify-between font-medium border-t pt-2"><span>Remaining Balance</span><span>{company?.currencySymbol}{selectedDebt?.remainingAmount.toFixed(2)}</span></div>
            </div>
            <Field>
              <FieldLabel>Payment Amount</FieldLabel>
              <Input
                type="number" min="0.01" step="0.01"
                placeholder={`Max: ${company?.currencySymbol}${selectedDebt?.remainingAmount.toFixed(2)}`}
                value={paymentAmount}
                onChange={e => setPaymentAmount(e.target.value)}
              />
            </Field>
            <Field>
              <FieldLabel>Payment Method</FieldLabel>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="card">Card</SelectItem>
                  <SelectItem value="mobile">Mobile Money</SelectItem>
                  <SelectItem value="bank">Bank Transfer</SelectItem>
                </SelectContent>
              </Select>
            </Field>
          </FieldGroup>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPaymentDialogOpen(false)} disabled={submitting}>Cancel</Button>
            <Button onClick={confirmPayment} disabled={submitting}>
              {submitting ? 'Recording...' : 'Record Payment'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Details Dialog */}
      <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Debt Details — {selectedDebt?.referenceNumber}</DialogTitle>
            <DialogDescription>Full history and status for this {selectedDebt?.type}</DialogDescription>
          </DialogHeader>

          {selectedDebt && (
            <div className="space-y-6">
              {/* Top Overview Cards */}
              <div className="grid gap-3 grid-cols-1 sm:grid-cols-3">
                <Card className="shadow-none border bg-muted/20">
                  <CardContent className="pt-4 px-4 pb-3">
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Original</p>
                    <p className="text-lg font-black mt-1">{company?.currencySymbol}{selectedDebt.originalAmount.toFixed(2)}</p>
                  </CardContent>
                </Card>
                <Card className="shadow-none border bg-emerald-50/30 border-emerald-100">
                  <CardContent className="pt-4 px-4 pb-3">
                    <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600">Paid So Far</p>
                    <p className="text-lg font-black mt-1 text-emerald-700">{company?.currencySymbol}{selectedDebt.paidAmount.toFixed(2)}</p>
                  </CardContent>
                </Card>
                <Card className="shadow-none border bg-amber-50/30 border-amber-100">
                  <CardContent className="pt-4 px-4 pb-3">
                    <p className="text-[10px] font-black uppercase tracking-widest text-amber-600">Remaining</p>
                    <p className="text-lg font-black mt-1 text-amber-700">{company?.currencySymbol}{selectedDebt.remainingAmount.toFixed(2)}</p>
                  </CardContent>
                </Card>
              </div>

              {/* Info Grid */}
              <div className="grid grid-cols-2 gap-y-4 gap-x-8 text-sm border rounded-2xl p-6 bg-muted/10">
                <div>
                  <p className="text-muted-foreground font-medium mb-1">Entity</p>
                  <div className="flex items-center gap-2">
                    <Avatar className="size-6">
                      <AvatarFallback className="bg-primary/10 text-primary text-[10px] font-black">
                        {selectedDebt.entityName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <p className="font-black uppercase tracking-tight">{selectedDebt.entityName}</p>
                  </div>
                </div>
                <div>
                  <p className="text-muted-foreground font-medium mb-1">Status</p>
                  <Badge className={cn("font-black uppercase text-[10px] tracking-widest", statusColors[selectedDebt.status])}>
                    {selectedDebt.status}
                  </Badge>
                </div>
                <div>
                  <p className="text-muted-foreground font-medium mb-1">Due Date</p>
                  <div className="flex items-center gap-2 font-bold">
                    <Calendar className="size-4 text-muted-foreground" />
                    {selectedDebt.dueDate ? new Date(selectedDebt.dueDate).toLocaleDateString() : 'No date set'}
                  </div>
                </div>
                <div>
                  <p className="text-muted-foreground font-medium mb-1">Reference</p>
                  <p className="font-mono font-bold text-indigo-600">{selectedDebt.referenceNumber}</p>
                </div>
              </div>

              {/* Payment History Table */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
                    <Receipt className="size-4 text-indigo-600" />
                    Payment History
                  </h3>
                  <Badge variant="outline" className="font-bold text-[10px]">
                    {selectedDebt.payments?.length || 0} Records
                  </Badge>
                </div>
                
                <div className="border rounded-2xl overflow-hidden">
                  <Table>
                    <TableHeader className="bg-muted/50">
                      <TableRow>
                        <TableHead className="font-bold uppercase text-[10px]">Date</TableHead>
                        <TableHead className="font-bold uppercase text-[10px]">Method</TableHead>
                        <TableHead className="text-right font-bold uppercase text-[10px]">Amount</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(!selectedDebt.payments || selectedDebt.payments.length === 0) ? (
                        <TableRow>
                          <TableCell colSpan={3} className="text-center py-6 text-muted-foreground text-xs italic">
                            No payment history found
                          </TableCell>
                        </TableRow>
                      ) : (
                        selectedDebt.payments.map((p: any, i: number) => (
                          <TableRow key={i} className="hover:bg-muted/20">
                            <TableCell className="text-xs font-medium">
                              {new Date(p.createdAt || p.created_at || p.date || p.payment_date).toLocaleDateString()}
                            </TableCell>
                            <TableCell className="text-xs font-black uppercase tracking-tighter text-muted-foreground">
                              {p.paymentMethod || p.payment_method || p.method || 'cash'}
                            </TableCell>
                            <TableCell className="text-right font-black text-emerald-600">
                              {company?.currencySymbol}{(p.amount || 0).toFixed(2)}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>

              {/* Notes Section */}
              {selectedDebt.notes && (
                <div className="bg-amber-50/50 border border-amber-100 p-4 rounded-2xl">
                  <p className="text-[10px] font-black uppercase tracking-widest text-amber-600 mb-1">Internal Notes</p>
                  <p className="text-sm text-amber-800 leading-relaxed">{selectedDebt.notes}</p>
                </div>
              )}
            </div>
          )}

          <DialogFooter className="border-t pt-4">
            <Button variant="outline" onClick={() => setDetailsDialogOpen(false)} className="font-bold">Close</Button>
            {selectedDebt && selectedDebt.status !== 'paid' && (
              <Button onClick={() => { setDetailsDialogOpen(false); handleRecordPayment(selectedDebt); }} className="font-black bg-indigo-600">
                <Plus className="mr-2 size-4" /> Record New Payment
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
