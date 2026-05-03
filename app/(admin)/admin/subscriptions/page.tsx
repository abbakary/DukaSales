'use client';

import { useEffect, useMemo, useState } from 'react';
import { Plus, Edit, Trash2, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { useAuthStore } from '@/lib/stores/auth-store';
import {
  AdminSubscriptionPlan,
  assignCompanySubscriptionApi,
  createSubscriptionPlanApi,
  listSubscriptionPlansApi,
  updateSubscriptionPlanApi,
} from '@/lib/api/admin-subscriptions';
import { listCompaniesApi } from '@/lib/api/admin-companies';

export default function SubscriptionsPage() {
  const { token } = useAuthStore();
  const [plans, setPlans] = useState<AdminSubscriptionPlan[]>([]);
  const [companies, setCompanies] = useState<any[]>([]);
  const [editPlan, setEditPlan] = useState<AdminSubscriptionPlan | null>(null);
  const [open, setOpen] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);
  const [assignCompanyId, setAssignCompanyId] = useState('');
  const [assignPlanId, setAssignPlanId] = useState('');
  const [assignExpiry, setAssignExpiry] = useState('');
  const [form, setForm] = useState({ name: '', price: 0, maxUsers: 5, maxProducts: 500, maxLocations: 1, features: '' });

  useEffect(() => {
    if (!token) return;
    Promise.all([listSubscriptionPlansApi(token), listCompaniesApi(token)])
      .then(([plansRows, companyRows]) => {
        setPlans(plansRows);
        setCompanies(companyRows);
      })
      .catch((error) => toast.error(error.message || 'Failed to load subscriptions'));
  }, [token]);

  const openEdit = (plan: AdminSubscriptionPlan) => {
    setForm({ name: plan.name, price: plan.price, maxUsers: plan.maxUsers, maxProducts: plan.maxProducts, maxLocations: plan.maxLocations, features: plan.features.join('\n') });
    setEditPlan(plan);
    setOpen(true);
  };

  const companiesByPlan = useMemo(() => {
    const map: Record<string, number> = {};
    companies.forEach((company) => {
      const plan = String(company.subscriptionPlan || 'free').toLowerCase();
      map[plan] = (map[plan] || 0) + 1;
    });
    return map;
  }, [companies]);

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error('Plan name required'); return; }
    if (!token) { toast.error('Unauthorized'); return; }
    const features = form.features.split('\n').filter(f => f.trim());
    try {
      if (editPlan) {
        const updated = await updateSubscriptionPlanApi(editPlan.id, {
          name: form.name,
          price: form.price,
          maxUsers: form.maxUsers,
          maxProducts: form.maxProducts,
          maxLocations: form.maxLocations,
          features,
        }, token);
        setPlans(plans.map(p => p.id === editPlan.id ? updated : p));
        toast.success('Plan updated');
      } else {
        const created = await createSubscriptionPlanApi({
          name: form.name,
          price: form.price,
          maxUsers: form.maxUsers,
          maxProducts: form.maxProducts,
          maxLocations: form.maxLocations,
          features,
          billingCycle: 'monthly',
          isActive: true,
        }, token);
        setPlans([...plans, created]);
        toast.success('Plan created');
      }
      setOpen(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to save plan');
    }
  };

  const toggleActive = async (id: string) => {
    if (!token) return;
    const target = plans.find(p => p.id === id);
    if (!target) return;
    try {
      const updated = await updateSubscriptionPlanApi(id, { isActive: !target.isActive }, token);
      setPlans(plans.map(p => p.id === id ? updated : p));
      toast.success('Plan status updated');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update status');
    }
  };

  const assignPlan = async () => {
    if (!assignCompanyId || !assignPlanId) {
      toast.error('Select company and plan');
      return;
    }
    if (!token) return;
    try {
      await assignCompanySubscriptionApi(assignCompanyId, assignPlanId, assignExpiry || null, token);
      const updatedCompanies = await listCompaniesApi(token);
      setCompanies(updatedCompanies);
      toast.success('Subscription assigned');
      setAssignOpen(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to assign subscription');
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Subscription Plans</h1>
          <p className="text-muted-foreground">Manage pricing plans and features</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setAssignOpen(true)}>Assign Subscription</Button>
          <Button onClick={() => { setForm({ name: '', price: 0, maxUsers: 5, maxProducts: 500, maxLocations: 1, features: '' }); setEditPlan(null); setOpen(true); }}>
            <Plus className="mr-2 size-4" />Add Plan
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-4">
        <Card><CardContent className="pt-6"><div className="text-2xl font-bold">{plans.length}</div><p className="text-sm text-muted-foreground">Total Plans</p></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="text-2xl font-bold text-green-600">{plans.filter(p => p.isActive).length}</div><p className="text-sm text-muted-foreground">Active Plans</p></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="text-2xl font-bold">{companies.length}</div><p className="text-sm text-muted-foreground">Total Subscribers</p></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="text-2xl font-bold">TSh {plans.reduce((s, p) => s + p.price * (companiesByPlan[p.name.toLowerCase()] || 0), 0).toLocaleString()}</div><p className="text-sm text-muted-foreground">Monthly Revenue</p></CardContent></Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {plans.map(plan => (
          <Card key={plan.id} className={`relative ${!plan.isActive ? 'opacity-60' : ''}`}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>{plan.name}</CardTitle>
                <Badge variant={plan.isActive ? 'default' : 'secondary'}>{plan.isActive ? 'Active' : 'Inactive'}</Badge>
              </div>
              <div className="text-3xl font-bold">TSh {plan.price}<span className="text-sm font-normal text-muted-foreground">/mo</span></div>
              <CardDescription>{companiesByPlan[plan.name.toLowerCase()] || 0} companies subscribed</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Max Users</span><span className="font-medium">{plan.maxUsers === 999 ? 'Unlimited' : plan.maxUsers}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Max Products</span><span className="font-medium">{plan.maxProducts >= 999999 ? 'Unlimited' : plan.maxProducts.toLocaleString()}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Locations</span><span className="font-medium">{plan.maxLocations === 999 ? 'Unlimited' : plan.maxLocations}</span></div>
              </div>
              <Separator />
              <ul className="space-y-1">
                {plan.features.map((f, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm"><Check className="size-3 text-green-600 shrink-0" />{f}</li>
                ))}
              </ul>
              <div className="flex gap-2 pt-2">
                <Button variant="outline" size="sm" className="flex-1" onClick={() => openEdit(plan)}><Edit className="mr-1 size-3" />Edit</Button>
                <Button variant="outline" size="sm" onClick={() => toggleActive(plan.id)}>
                  {plan.isActive ? <X className="size-3" /> : <Check className="size-3" />}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editPlan ? 'Edit Plan' : 'Create Plan'}</DialogTitle>
            <DialogDescription>Configure the subscription plan details</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Plan Name *</Label><Input placeholder="e.g. Pro" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></div>
              <div className="space-y-2"><Label>Monthly Price (TSh)</Label><Input type="number" min="0" value={form.price} onChange={e => setForm(f => ({ ...f, price: parseFloat(e.target.value) || 0 }))} /></div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2"><Label>Max Users</Label><Input type="number" min="1" value={form.maxUsers} onChange={e => setForm(f => ({ ...f, maxUsers: parseInt(e.target.value) || 1 }))} /></div>
              <div className="space-y-2"><Label>Max Products</Label><Input type="number" min="1" value={form.maxProducts} onChange={e => setForm(f => ({ ...f, maxProducts: parseInt(e.target.value) || 1 }))} /></div>
              <div className="space-y-2"><Label>Locations</Label><Input type="number" min="1" value={form.maxLocations} onChange={e => setForm(f => ({ ...f, maxLocations: parseInt(e.target.value) || 1 }))} /></div>
            </div>
            <div className="space-y-2">
              <Label>Features (one per line)</Label>
              <textarea className="w-full rounded-md border bg-background px-3 py-2 text-sm min-h-[100px]" placeholder="POS&#10;Inventory&#10;Reports" value={form.features} onChange={e => setForm(f => ({ ...f, features: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={handleSave}>{editPlan ? 'Update' : 'Create'} Plan</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={assignOpen} onOpenChange={setAssignOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Subscription</DialogTitle>
            <DialogDescription>Assign a plan to a client company/shop.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Company</Label>
              <select
                className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                value={assignCompanyId}
                onChange={(e) => setAssignCompanyId(e.target.value)}
              >
                <option value="">Select company</option>
                {companies.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label>Plan</Label>
              <select
                className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                value={assignPlanId}
                onChange={(e) => setAssignPlanId(e.target.value)}
              >
                <option value="">Select plan</option>
                {plans.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label>Expiry Date (optional)</Label>
              <Input type="date" value={assignExpiry} onChange={(e) => setAssignExpiry(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignOpen(false)}>Cancel</Button>
            <Button onClick={assignPlan}>Assign</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
