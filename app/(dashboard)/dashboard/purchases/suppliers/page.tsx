'use client';

import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Plus, Search, MoreHorizontal, Edit, Trash2, Eye, Phone, Mail, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useAuthStore } from '@/lib/stores/auth-store';
import { db } from '@/lib/db/dexie';
import { toast } from 'sonner';
import { v4 as uuid } from 'uuid';
import type { Supplier } from '@/lib/types';
import { DocumentPreviewDialog } from '@/components/shared/documents/document-preview-dialog';
import {
  transformPurchaseOrderToInvoice,
  transformPurchaseOrderToQuotation,
  transformPurchaseOrderToDeliveryNote,
  transformPurchaseOrderToPaymentSlip,
  transformPurchaseOrderToOrderSlip,
} from '@/lib/utils/document-transform';
import { createTenantResource, updateTenantResource } from '@/lib/api/tenant';
import { syncTenantDataFromApi } from '@/lib/services/sync-from-api';

export default function SuppliersPage() {
  const { company, token } = useAuthStore();
  const [search, setSearch] = useState('');
  const [addOpen, setAddOpen] = useState(false);
  const [editSupplier, setEditSupplier] = useState<Supplier | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [viewSupplier, setViewSupplier] = useState<Supplier | null>(null);
  const [form, setForm] = useState({ name: '', contactPerson: '', phone: '', email: '', address: '', taxId: '', paymentTerms: '', notes: '' });

  const suppliers = useLiveQuery(
    async () => {
      if (!company?.id) return [];
      return db.suppliers.where('companyId').equals(company.id).filter(s => s.isActive).toArray();
    },
    [company?.id], []
  );

  const purchaseOrders = useLiveQuery(
    async () => {
      if (!company?.id) return [];
      return db.purchaseOrders.where('companyId').equals(company.id).reverse().toArray();
    },
    [company?.id],
    []
  );

  const filtered = (suppliers || []).filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.phone?.toLowerCase().includes(search.toLowerCase()) ||
    s.email?.toLowerCase().includes(search.toLowerCase())
  );

  const openAdd = () => { setForm({ name: '', contactPerson: '', phone: '', email: '', address: '', taxId: '', paymentTerms: '', notes: '' }); setEditSupplier(null); setAddOpen(true); };
  const openEdit = (s: Supplier) => { setForm({ name: s.name, contactPerson: s.contactPerson || '', phone: s.phone || '', email: s.email || '', address: s.address || '', taxId: s.taxId || '', paymentTerms: s.paymentTerms || '', notes: s.notes || '' }); setEditSupplier(s); setAddOpen(true); };

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error('Supplier name is required'); return; }
    try {
      if (!token) throw new Error('Session expired');
      const payload = {
        name: form.name,
        contact_person: form.contactPerson || undefined,
        phone: form.phone || undefined,
        email: form.email || undefined,
        address: form.address || undefined,
        payment_terms: form.paymentTerms || undefined,
      };
      if (editSupplier) {
        await updateTenantResource('suppliers', editSupplier.id, payload, token);
        toast.success('Supplier updated');
      } else {
        await createTenantResource('suppliers', {
          id: uuid(),
          ...payload,
          current_debt: 0,
          is_active: true,
        }, token);
        toast.success('Supplier added');
      }
      await syncTenantDataFromApi(token);
      setAddOpen(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to save supplier');
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      if (!token) throw new Error('Session expired');
      await updateTenantResource('suppliers', deleteId, { is_active: false }, token);
      await syncTenantDataFromApi(token);
      toast.success('Supplier removed');
      setDeleteId(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to remove supplier');
    }
  };

  const stats = {
    total: (suppliers || []).length,
    withDebt: (suppliers || []).filter(s => s.currentDebt > 0).length,
    totalDebt: (suppliers || []).reduce((s, sup) => s + sup.currentDebt, 0),
  };

  const latestOrderBySupplier = (supplierId: string) =>
    (purchaseOrders || []).find((po) => po.supplierId === supplierId);

  const getSupplierDocuments = (supplier: Supplier) => {
    const order = latestOrderBySupplier(supplier.id);
    if (!company || !order) return null;
    return {
      invoice: transformPurchaseOrderToInvoice(order, company, supplier),
      quotation: transformPurchaseOrderToQuotation(order, company, supplier),
      deliveryNote: transformPurchaseOrderToDeliveryNote(order, company, supplier),
      paymentSlip: transformPurchaseOrderToPaymentSlip(order, company, supplier),
      orderSlip: transformPurchaseOrderToOrderSlip(order, company, supplier),
    };
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Suppliers</h1>
          <p className="text-muted-foreground">Manage your suppliers and vendor relationships</p>
        </div>
        <Button onClick={openAdd}><Plus className="mr-2 size-4" />Add Supplier</Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card><CardContent className="pt-6"><div className="text-2xl font-bold">{stats.total}</div><p className="text-sm text-muted-foreground">Total Suppliers</p></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="text-2xl font-bold text-warning">{stats.withDebt}</div><p className="text-sm text-muted-foreground">With Outstanding Debt</p></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="text-2xl font-bold text-destructive">{company?.currencySymbol}{stats.totalDebt.toFixed(2)}</div><p className="text-sm text-muted-foreground">Total Payables</p></CardContent></Card>
      </div>

      <Card>
        <CardHeader><CardTitle>All Suppliers</CardTitle><CardDescription>{filtered.length} suppliers found</CardDescription></CardHeader>
        <CardContent>
          <div className="relative mb-4">
            <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search suppliers..." value={search} onChange={e => setSearch(e.target.value)} className="pl-8" />
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Supplier</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Payment Terms</TableHead>
                <TableHead className="text-right">Outstanding Debt</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No suppliers found</TableCell></TableRow>
              ) : filtered.map(s => (
                <TableRow key={s.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="size-9"><AvatarFallback className="bg-primary/10 text-primary text-sm">{s.name.substring(0, 2).toUpperCase()}</AvatarFallback></Avatar>
                      <div>
                        <p className="font-medium">{s.name}</p>
                        {s.contactPerson && <p className="text-sm text-muted-foreground">{s.contactPerson}</p>}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      {s.phone && <div className="flex items-center gap-1 text-sm"><Phone className="size-3 text-muted-foreground" />{s.phone}</div>}
                      {s.email && <div className="flex items-center gap-1 text-sm"><Mail className="size-3 text-muted-foreground" />{s.email}</div>}
                    </div>
                  </TableCell>
                  <TableCell>{s.paymentTerms ? <Badge variant="outline">{s.paymentTerms}</Badge> : <span className="text-muted-foreground text-sm">—</span>}</TableCell>
                  <TableCell className="text-right">
                    <span className={s.currentDebt > 0 ? 'text-destructive font-medium' : 'text-muted-foreground'}>
                      {company?.currencySymbol}{s.currentDebt.toFixed(2)}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="inline-flex items-center gap-2">
                      {getSupplierDocuments(s) ? (
                        <DocumentPreviewDialog
                          data={getSupplierDocuments(s)!}
                          defaultType="invoice"
                          trigger={<Button variant="outline" size="sm">Documents</Button>}
                        />
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          disabled
                          title="No purchase orders yet for this supplier"
                        >
                          Documents
                        </Button>
                      )}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal className="size-4" /></Button></DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setViewSupplier(s)}><Eye className="mr-2 size-4" />View</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openEdit(s)}><Edit className="mr-2 size-4" />Edit</DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => setDeleteId(s.id)} className="text-destructive focus:text-destructive"><Trash2 className="mr-2 size-4" />Delete</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editSupplier ? 'Edit Supplier' : 'Add Supplier'}</DialogTitle>
            <DialogDescription>Fill in the supplier details</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2"><Label>Supplier Name *</Label><Input placeholder="Company name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Contact Person</Label><Input placeholder="Contact name" value={form.contactPerson} onChange={e => setForm(f => ({ ...f, contactPerson: e.target.value }))} /></div>
              <div className="space-y-2"><Label>Phone</Label><Input placeholder="Phone number" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Email</Label><Input type="email" placeholder="Email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} /></div>
              <div className="space-y-2"><Label>Tax ID</Label><Input placeholder="Tax ID" value={form.taxId} onChange={e => setForm(f => ({ ...f, taxId: e.target.value }))} /></div>
            </div>
            <div className="space-y-2"><Label>Address</Label><Input placeholder="Address" value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} /></div>
            <div className="space-y-2"><Label>Payment Terms</Label><Input placeholder="e.g. Net 30, Immediate" value={form.paymentTerms} onChange={e => setForm(f => ({ ...f, paymentTerms: e.target.value }))} /></div>
            <div className="space-y-2"><Label>Notes</Label><Textarea placeholder="Additional notes..." value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button onClick={handleSave}>{editSupplier ? 'Update' : 'Add'} Supplier</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={!!viewSupplier} onOpenChange={() => setViewSupplier(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>{viewSupplier?.name}</DialogTitle></DialogHeader>
          {viewSupplier && (
            <div className="space-y-3 text-sm">
              {viewSupplier.contactPerson && <div className="flex justify-between"><span className="text-muted-foreground">Contact</span><span>{viewSupplier.contactPerson}</span></div>}
              {viewSupplier.phone && <div className="flex justify-between"><span className="text-muted-foreground">Phone</span><span>{viewSupplier.phone}</span></div>}
              {viewSupplier.email && <div className="flex justify-between"><span className="text-muted-foreground">Email</span><span>{viewSupplier.email}</span></div>}
              {viewSupplier.address && <div className="flex justify-between"><span className="text-muted-foreground">Address</span><span>{viewSupplier.address}</span></div>}
              {viewSupplier.paymentTerms && <div className="flex justify-between"><span className="text-muted-foreground">Payment Terms</span><span>{viewSupplier.paymentTerms}</span></div>}
              <div className="flex justify-between font-medium border-t pt-3"><span>Outstanding Debt</span><span className={viewSupplier.currentDebt > 0 ? 'text-destructive' : 'text-green-600'}>{company?.currencySymbol}{viewSupplier.currentDebt.toFixed(2)}</span></div>
            </div>
          )}
          <DialogFooter><Button variant="outline" onClick={() => setViewSupplier(null)}>Close</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Delete Supplier</DialogTitle><DialogDescription>Are you sure? This cannot be undone.</DialogDescription></DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
