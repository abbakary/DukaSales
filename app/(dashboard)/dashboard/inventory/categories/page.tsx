'use client';

import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Plus, Edit, Trash2, ChevronRight, FolderOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuthStore } from '@/lib/stores/auth-store';
import { db } from '@/lib/db/dexie';
import { toast } from 'sonner';
import { v4 as uuid } from 'uuid';
import type { Category } from '@/lib/types';
import { createTenantResource, deleteTenantResource, updateTenantResource } from '@/lib/api/tenant';
import { syncTenantDataFromApi } from '@/lib/services/sync-from-api';

export default function CategoriesPage() {
  const { company, token } = useAuthStore();
  const [addOpen, setAddOpen] = useState(false);
  const [editCategory, setEditCategory] = useState<Category | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', description: '', parentId: '' });

  const categories = useLiveQuery(
    async () => {
      if (!company?.id) return [];
      return db.categories.where('companyId').equals(company.id).toArray();
    },
    [company?.id],
    []
  );

  const parents = (categories || []).filter(c => !c.parentId);
  const getChildren = (parentId: string) => (categories || []).filter(c => c.parentId === parentId);
  const getProductCount = (catId: string) => 0; // placeholder

  const openAdd = () => { setForm({ name: '', description: '', parentId: '' }); setEditCategory(null); setAddOpen(true); };
  const openEdit = (cat: Category) => { setForm({ name: cat.name, description: cat.description || '', parentId: cat.parentId || '' }); setEditCategory(cat); setAddOpen(true); };

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error('Name is required'); return; }
    try {
      if (!token) throw new Error('Session expired');
      const payload = {
        name: form.name,
        description: form.description || undefined,
        parent_id: form.parentId || undefined,
        sort_order: (categories || []).length,
        is_active: true,
      };
      if (editCategory) {
        await updateTenantResource('categories', editCategory.id, payload, token);
        toast.success('Category updated');
      } else {
        await createTenantResource('categories', { id: uuid(), ...payload }, token);
        toast.success('Category added');
      }
      await syncTenantDataFromApi(token);
      setAddOpen(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to save category');
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    const children = getChildren(deleteId);
    if (children.length > 0) { toast.error('Remove subcategories first'); setDeleteId(null); return; }
    try {
      if (!token) throw new Error('Session expired');
      await deleteTenantResource('categories', deleteId, token);
      await syncTenantDataFromApi(token);
      toast.success('Category deleted');
      setDeleteId(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete category');
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Categories</h1>
          <p className="text-muted-foreground">Organize your products into categories</p>
        </div>
        <Button onClick={openAdd}><Plus className="mr-2 size-4" />Add Category</Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card><CardContent className="pt-6"><div className="text-2xl font-bold">{parents.length}</div><p className="text-sm text-muted-foreground">Parent Categories</p></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="text-2xl font-bold">{(categories || []).filter(c => c.parentId).length}</div><p className="text-sm text-muted-foreground">Subcategories</p></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="text-2xl font-bold">{(categories || []).length}</div><p className="text-sm text-muted-foreground">Total Categories</p></CardContent></Card>
      </div>

      <div className="space-y-4">
        {parents.length === 0 ? (
          <Card><CardContent className="py-12 text-center text-muted-foreground"><FolderOpen className="mx-auto size-12 mb-3" /><p>No categories yet. Add your first category.</p></CardContent></Card>
        ) : parents.map(parent => {
          const children = getChildren(parent.id);
          return (
            <Card key={parent.id}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10"><FolderOpen className="size-5 text-primary" /></div>
                    <div>
                      <CardTitle className="text-base">{parent.name}</CardTitle>
                      {parent.description && <CardDescription>{parent.description}</CardDescription>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">{children.length} subcategories</Badge>
                    <Button variant="ghost" size="icon" onClick={() => openEdit(parent)}><Edit className="size-4" /></Button>
                    <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => setDeleteId(parent.id)}><Trash2 className="size-4" /></Button>
                  </div>
                </div>
              </CardHeader>
              {children.length > 0 && (
                <CardContent className="pt-0">
                  <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                    {children.map(child => (
                      <div key={child.id} className="flex items-center justify-between rounded-lg border p-3">
                        <div className="flex items-center gap-2">
                          <ChevronRight className="size-4 text-muted-foreground" />
                          <span className="text-sm font-medium">{child.name}</span>
                        </div>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" className="size-7" onClick={() => openEdit(child)}><Edit className="size-3" /></Button>
                          <Button variant="ghost" size="icon" className="size-7 text-destructive hover:text-destructive" onClick={() => setDeleteId(child.id)}><Trash2 className="size-3" /></Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editCategory ? 'Edit Category' : 'Add Category'}</DialogTitle>
            <DialogDescription>Fill in the category details</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Name *</Label>
              <Input placeholder="Category name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Input placeholder="Optional description" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Parent Category (optional)</Label>
              <Select value={form.parentId || 'none'} onValueChange={v => setForm(f => ({ ...f, parentId: v === 'none' ? '' : v }))}>
                <SelectTrigger><SelectValue placeholder="None (top-level)" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None (top-level)</SelectItem>
                  {parents.filter(p => p.id !== editCategory?.id).map(p => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button onClick={handleSave}>{editCategory ? 'Update' : 'Add'} Category</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Category</DialogTitle>
            <DialogDescription>Are you sure? This cannot be undone.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
