'use client';

import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Plus, TrendingUp, TrendingDown, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useAuthStore } from '@/lib/stores/auth-store';
import { db } from '@/lib/db/dexie';
import { toast } from 'sonner';
import { v4 as uuid } from 'uuid';

export default function AdjustmentsPage() {
  const { company, user } = useAuthStore();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    productId: '',
    type: 'in' as 'in' | 'out',
    reason: 'adjustment' as const,
    quantity: 0,
    notes: '',
    updatePricing: false,
    costPrice: 0,
    sellingPrice: 0,
    minStock: 0,
  });
  const [saving, setSaving] = useState(false);

  const products = useLiveQuery(
    async () => {
      if (!company?.id) return [];
      return db.products.where('companyId').equals(company.id).filter(p => p.isActive).toArray();
    },
    [company?.id], []
  );

  const movements = useLiveQuery(
    async () => {
      if (!company?.id) return [];
      return db.stockMovements.where('companyId').equals(company.id).reverse().limit(50).toArray();
    },
    [company?.id], []
  );

  const selectedProduct = (products || []).find(p => p.id === form.productId);

  const handleSave = async () => {
    if (!form.productId) { toast.error('Select a product'); return; }
    if (form.quantity <= 0) { toast.error('Quantity must be greater than 0'); return; }
    if (!selectedProduct) return;
    if (form.type === 'out' && form.quantity > selectedProduct.quantity) {
      toast.error('Stock out quantity cannot exceed current stock');
      return;
    }
    if (form.updatePricing) {
      if (form.costPrice < 0 || form.sellingPrice < 0 || form.minStock < 0) {
        toast.error('Price and min stock values must be 0 or greater');
        return;
      }
    }
    setSaving(true);
    try {
      const prev = selectedProduct.quantity;
      const newQty = form.type === 'in' ? prev + form.quantity : Math.max(0, prev - form.quantity);
      const productPatch: Record<string, unknown> = {
        quantity: newQty,
        updatedAt: new Date(),
      };
      if (form.updatePricing) {
        productPatch.costPrice = Number(form.costPrice || 0);
        productPatch.sellingPrice = Number(form.sellingPrice || 0);
        productPatch.minStock = Number(form.minStock || 0);
      }
      await db.products.update(form.productId, productPatch);
      await db.stockMovements.add({
        id: uuid(), companyId: company!.id, productId: form.productId,
        productName: selectedProduct.name, type: form.type, reason: form.reason,
        quantity: form.quantity, previousStock: prev, newStock: newQty,
        referenceType: 'adjustment',
        notes: form.notes || (form.updatePricing ? `Pricing updated: cost=${form.costPrice}, selling=${form.sellingPrice}, minStock=${form.minStock}` : undefined),
        userId: user?.id || '', syncStatus: 'pending', createdAt: new Date(),
      });
      toast.success('Stock adjustment saved');
      setOpen(false);
      setForm({
        productId: '',
        type: 'in',
        reason: 'adjustment',
        quantity: 0,
        notes: '',
        updatePricing: false,
        costPrice: 0,
        sellingPrice: 0,
        minStock: 0,
      });
    } catch {
      toast.error('Failed to save adjustment');
    } finally {
      setSaving(false);
    }
  };

  const reasonLabels: Record<string, string> = {
    adjustment: 'Manual Adjustment', damage: 'Damaged', expired: 'Expired',
    return: 'Customer Return', purchase: 'Purchase', sale: 'Sale', transfer: 'Transfer',
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Stock Adjustments</h1>
          <p className="text-muted-foreground">Manually adjust stock levels</p>
        </div>
        <Button onClick={() => setOpen(true)}><Plus className="mr-2 size-4" />New Adjustment</Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card><CardContent className="pt-6">
          <div className="flex items-center gap-3"><TrendingUp className="size-8 text-green-600" /><div><div className="text-2xl font-bold">{(movements || []).filter(m => m.type === 'in').length}</div><p className="text-sm text-muted-foreground">Stock In</p></div></div>
        </CardContent></Card>
        <Card><CardContent className="pt-6">
          <div className="flex items-center gap-3"><TrendingDown className="size-8 text-destructive" /><div><div className="text-2xl font-bold">{(movements || []).filter(m => m.type === 'out').length}</div><p className="text-sm text-muted-foreground">Stock Out</p></div></div>
        </CardContent></Card>
        <Card><CardContent className="pt-6">
          <div className="flex items-center gap-3"><AlertTriangle className="size-8 text-warning" /><div><div className="text-2xl font-bold">{(products || []).filter(p => p.quantity <= p.minStock).length}</div><p className="text-sm text-muted-foreground">Low Stock Items</p></div></div>
        </CardContent></Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Recent Adjustments</CardTitle><CardDescription>{(movements || []).length} movements recorded</CardDescription></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead className="text-right">Qty</TableHead>
                <TableHead className="text-right">Before</TableHead>
                <TableHead className="text-right">After</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(movements || []).length === 0 ? (
                <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No adjustments yet</TableCell></TableRow>
              ) : (movements || []).map(m => (
                <TableRow key={m.id}>
                  <TableCell className="font-medium">{m.productName}</TableCell>
                  <TableCell>
                    <Badge className={m.type === 'in' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                      {m.type === 'in' ? '▲ In' : '▼ Out'}
                    </Badge>
                  </TableCell>
                  <TableCell>{reasonLabels[m.reason] || m.reason}</TableCell>
                  <TableCell className="text-right font-medium">{m.quantity}</TableCell>
                  <TableCell className="text-right text-muted-foreground">{m.previousStock}</TableCell>
                  <TableCell className="text-right font-medium">{m.newStock}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{new Date(m.createdAt).toLocaleDateString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New Stock Adjustment</DialogTitle>
            <DialogDescription>Adjust stock levels for a product</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Product *</Label>
              <Select value={form.productId} onValueChange={v => setForm(f => {
                const product = (products || []).find(p => p.id === v);
                if (!product) return { ...f, productId: v };
                return {
                  ...f,
                  productId: v,
                  costPrice: Number(product.costPrice || 0),
                  sellingPrice: Number(product.sellingPrice || 0),
                  minStock: Number(product.minStock || 0),
                };
              })}>
                <SelectTrigger><SelectValue placeholder="Select product" /></SelectTrigger>
                <SelectContent>
                  {(products || []).map(p => (
                    <SelectItem key={p.id} value={p.id}>{p.name} (Stock: {p.quantity} {p.unit})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Type *</Label>
                <Select value={form.type} onValueChange={v => setForm(f => ({ ...f, type: v as 'in' | 'out' }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="in">Stock In (+)</SelectItem>
                    <SelectItem value="out">Stock Out (-)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Reason *</Label>
                <Select value={form.reason} onValueChange={v => setForm(f => ({ ...f, reason: v as typeof form.reason }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="adjustment">Manual Adjustment</SelectItem>
                    <SelectItem value="damage">Damaged</SelectItem>
                    <SelectItem value="expired">Expired</SelectItem>
                    <SelectItem value="return">Customer Return</SelectItem>
                    <SelectItem value="transfer">Transfer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Quantity *</Label>
              <Input type="number" min="0.01" step="0.01" value={form.quantity} onChange={e => setForm(f => ({ ...f, quantity: parseFloat(e.target.value) || 0 }))} />
              {selectedProduct && (
                <p className="text-xs text-muted-foreground">
                  Current stock: {selectedProduct.quantity} {selectedProduct.unit} →
                  New: {form.type === 'in' ? selectedProduct.quantity + form.quantity : Math.max(0, selectedProduct.quantity - form.quantity)} {selectedProduct.unit}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea placeholder="Reason for adjustment..." value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2} />
            </div>
            <div className="space-y-3 rounded-md border p-3 bg-muted/20">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium">Update product pricing and min stock</p>
                  <p className="text-xs text-muted-foreground">Optional: apply latest cost, selling price, and threshold together with this adjustment.</p>
                </div>
                <Button
                  type="button"
                  variant={form.updatePricing ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setForm(f => ({ ...f, updatePricing: !f.updatePricing }))}
                >
                  {form.updatePricing ? 'Enabled' : 'Enable'}
                </Button>
              </div>
              {form.updatePricing && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1.5">
                    <Label>Cost Price</Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={form.costPrice}
                      onChange={(e) => setForm(f => ({ ...f, costPrice: parseFloat(e.target.value) || 0 }))}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Selling Price</Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={form.sellingPrice}
                      onChange={(e) => setForm(f => ({ ...f, sellingPrice: parseFloat(e.target.value) || 0 }))}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Min Stock</Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={form.minStock}
                      onChange={(e) => setForm(f => ({ ...f, minStock: parseFloat(e.target.value) || 0 }))}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save Adjustment'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
