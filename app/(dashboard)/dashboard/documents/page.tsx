'use client';

import { useMemo, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { format } from 'date-fns';
import {
  FileText,
  Search,
  Filter,
  Download,
  Eye,
  ReceiptText,
  Truck,
  ClipboardList,
  WalletCards,
} from 'lucide-react';
import { useAuthStore } from '@/lib/stores/auth-store';
import { db } from '@/lib/db/dexie';
import type { Customer, Transaction, PurchaseOrder, Supplier } from '@/lib/types';
import type { DocumentType } from '@/lib/types/documents';
import {
  transformTransactionToDeliveryNote,
  transformTransactionToInvoice,
  transformTransactionToOrderSlip,
  transformTransactionToPaymentSlip,
  transformTransactionToQuotation,
  transformPurchaseOrderToInvoice,
  transformPurchaseOrderToQuotation,
  transformPurchaseOrderToDeliveryNote,
  transformPurchaseOrderToPaymentSlip,
  transformPurchaseOrderToOrderSlip,
} from '@/lib/utils/document-transform';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { DocumentPreviewDialog } from '@/components/shared/documents/document-preview-dialog';

const DOCUMENT_TYPE_OPTIONS: { value: DocumentType | 'all'; label: string }[] = [
  { value: 'all', label: 'All Types' },
  { value: 'invoice', label: 'Invoice' },
  { value: 'delivery_note', label: 'Delivery Note' },
  { value: 'payment_slip', label: 'Payment Slip' },
  { value: 'order_slip', label: 'Order Slip' },
  { value: 'quotation', label: 'Quotation' },
];

const TYPE_BADGES: Record<DocumentType, { label: string; className: string }> = {
  invoice: { label: 'Invoice', className: 'bg-blue-100 text-blue-700 border-blue-200' },
  delivery_note: { label: 'Delivery Note', className: 'bg-amber-100 text-amber-700 border-amber-200' },
  payment_slip: { label: 'Payment Slip', className: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  order_slip: { label: 'Order Slip', className: 'bg-indigo-100 text-indigo-700 border-indigo-200' },
  quotation: { label: 'Quotation', className: 'bg-violet-100 text-violet-700 border-violet-200' },
};

function downloadDocumentData(filename: string, payload: unknown) {
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export default function DocumentsPage() {
  const { company } = useAuthStore();
  const [query, setQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<DocumentType | 'all'>('all');
  const [paymentFilter, setPaymentFilter] = useState<'all' | 'cash' | 'card' | 'mobile' | 'credit'>('all');

  const transactions = useLiveQuery(async () => {
    if (!company?.id) return [];
    return db.transactions.where('companyId').equals(company.id).reverse().toArray();
  }, [company?.id], []);

  const customers = useLiveQuery(async () => {
    if (!company?.id) return [];
    return db.customers.where('companyId').equals(company.id).toArray();
  }, [company?.id], []);

  const purchaseOrders = useLiveQuery(async () => {
    if (!company?.id) return [];
    return db.purchaseOrders.where('companyId').equals(company.id).reverse().toArray();
  }, [company?.id], []);

  const suppliers = useLiveQuery(async () => {
    if (!company?.id) return [];
    return db.suppliers.where('companyId').equals(company.id).toArray();
  }, [company?.id], []);

  const customerMap = useMemo(() => {
    const map = new Map<string, Customer>();
    (customers || []).forEach((c) => map.set(c.id, c));
    return map;
  }, [customers]);

  const supplierMap = useMemo(() => {
    const map = new Map<string, Supplier>();
    (suppliers || []).forEach((s) => map.set(s.id, s));
    return map;
  }, [suppliers]);

  const rows = useMemo(() => {
    const salesRows = (transactions || []).flatMap((txn) => {
      const customer = txn.customerId ? customerMap.get(txn.customerId) : undefined;
      const docs: { type: DocumentType; txn: Transaction; customer?: Customer }[] = [
        { type: 'invoice', txn, customer },
        { type: 'delivery_note', txn, customer },
        { type: 'payment_slip', txn, customer },
        { type: 'order_slip', txn, customer },
        { type: 'quotation', txn, customer },
      ];
      return docs;
    });
    const purchaseRows = (purchaseOrders || []).flatMap((po) => {
      const supplier = supplierMap.get(po.supplierId);
      const docs: { type: DocumentType; po: PurchaseOrder; supplier?: Supplier }[] = [
        { type: 'invoice', po, supplier },
        { type: 'delivery_note', po, supplier },
        { type: 'payment_slip', po, supplier },
        { type: 'order_slip', po, supplier },
        { type: 'quotation', po, supplier },
      ];
      return docs;
    });

    return [...salesRows, ...purchaseRows];
  }, [transactions, customerMap, purchaseOrders, supplierMap]);

  const filteredRows = rows.filter((row) => {
    if (typeFilter !== 'all' && row.type !== typeFilter) return false;
    if (
      paymentFilter !== 'all' &&
      (
        ('txn' in row && row.txn.paymentMethod !== paymentFilter) ||
        ('po' in row && (row.po.amountDue > 0 ? 'credit' : 'cash') !== paymentFilter)
      )
    ) return false;
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return (
      ('txn' in row && (
        row.txn.transactionNumber.toLowerCase().includes(q) ||
        row.txn.customerName?.toLowerCase().includes(q) ||
        row.customer?.name.toLowerCase().includes(q)
      )) ||
      ('po' in row && (
        row.po.orderNumber.toLowerCase().includes(q) ||
        row.po.supplierName.toLowerCase().includes(q) ||
        row.supplier?.name.toLowerCase().includes(q)
      ))
    );
  });

  const stats = {
    total: filteredRows.length,
    invoices: filteredRows.filter((r) => r.type === 'invoice').length,
    notes: filteredRows.filter((r) => r.type === 'delivery_note').length,
    slips: filteredRows.filter((r) => r.type === 'payment_slip' || r.type === 'order_slip').length,
  };

  const buildDocumentsData = (row: (typeof filteredRows)[number]) => {
    if ('txn' in row) {
      return {
        invoice: transformTransactionToInvoice(row.txn, company!, row.customer),
        quotation: transformTransactionToQuotation(row.txn, company!, row.customer),
        deliveryNote: transformTransactionToDeliveryNote(row.txn, company!, row.customer),
        paymentSlip: transformTransactionToPaymentSlip(row.txn, company!, row.customer),
        orderSlip: transformTransactionToOrderSlip(row.txn, company!, row.customer),
      };
    }
    return {
      invoice: transformPurchaseOrderToInvoice(row.po, company!, row.supplier),
      quotation: transformPurchaseOrderToQuotation(row.po, company!, row.supplier),
      deliveryNote: transformPurchaseOrderToDeliveryNote(row.po, company!, row.supplier),
      paymentSlip: transformPurchaseOrderToPaymentSlip(row.po, company!, row.supplier),
      orderSlip: transformPurchaseOrderToOrderSlip(row.po, company!, row.supplier),
    };
  };

  const iconForType = (type: DocumentType) => {
    if (type === 'invoice') return <ReceiptText className="size-4" />;
    if (type === 'delivery_note') return <Truck className="size-4" />;
    if (type === 'payment_slip') return <WalletCards className="size-4" />;
    if (type === 'order_slip') return <ClipboardList className="size-4" />;
    return <FileText className="size-4" />;
  };

  if (!company) return null;

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Documents</h1>
          <p className="text-muted-foreground">Preview, print, and manage all sales documents for this shop.</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Visible Documents</CardTitle></CardHeader>
          <CardContent className="text-2xl font-black">{stats.total}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Invoices</CardTitle></CardHeader>
          <CardContent className="text-2xl font-black text-blue-700">{stats.invoices}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Delivery Notes</CardTitle></CardHeader>
          <CardContent className="text-2xl font-black text-amber-700">{stats.notes}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Slips</CardTitle></CardHeader>
          <CardContent className="text-2xl font-black text-emerald-700">{stats.slips}</CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Documents</CardTitle>
          <CardDescription>Real-time documents generated from transactions.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-3 md:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder="Search by transaction number or customer..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
            <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as DocumentType | 'all')}>
              <SelectTrigger className="w-full md:w-[180px]">
                <Filter className="mr-2 size-4" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DOCUMENT_TYPE_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={paymentFilter} onValueChange={(v) => setPaymentFilter(v as typeof paymentFilter)}>
              <SelectTrigger className="w-full md:w-[160px]">
                <SelectValue />
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

          <div className="rounded-md border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Transaction</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Payment</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                      No documents found for current filters.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredRows.map((row) => {
                    const docsData = buildDocumentsData(row);
                    const number = 'txn' in row ? row.txn.transactionNumber : row.po.orderNumber;
                    const party = 'txn' in row ? (row.txn.customerName || 'Walk-in Customer') : row.po.supplierName;
                    const payment = 'txn' in row ? row.txn.paymentMethod : (row.po.amountDue > 0 ? 'credit' : 'cash');
                    const date = 'txn' in row ? row.txn.createdAt : row.po.createdAt;
                    return (
                      <TableRow key={`${'txn' in row ? row.txn.id : row.po.id}-${row.type}`}>
                        <TableCell>
                          <Badge variant="outline" className={TYPE_BADGES[row.type].className}>
                            <span className="mr-1">{iconForType(row.type)}</span>
                            {TYPE_BADGES[row.type].label}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-mono font-medium">{number}</TableCell>
                        <TableCell>{party}</TableCell>
                        <TableCell className="uppercase text-xs">{payment}</TableCell>
                        <TableCell>{format(new Date(date), 'MMM dd, yyyy HH:mm')}</TableCell>
                        <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <DocumentPreviewDialog
                                data={docsData}
                                defaultType={row.type}
                                trigger={
                                  <Button variant="ghost" size="icon" title="Preview & Export PDF">
                                    <Eye className="size-4" />
                                  </Button>
                                }
                              />
                            </div>
                          </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
