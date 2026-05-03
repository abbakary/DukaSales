'use client';

import { useState, useEffect } from 'react';
import { Plus, Search, MoreHorizontal, Edit, Trash2, Play, Pause, Copy, Calendar, Target, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { useAuthStore } from '@/lib/stores/auth-store';
import { listAdsApi, createAdApi, deleteAdApi, Advertisement } from '@/lib/api/admin-ads';

const statusColors: Record<string, string> = {
  active: 'bg-green-100 text-green-800',
  scheduled: 'bg-blue-100 text-blue-800',
  paused: 'bg-yellow-100 text-yellow-800',
  ended: 'bg-gray-100 text-gray-800',
};

const targetLabels: Record<string, string> = {
  all: 'All Companies', free: 'Free Plan', basic: 'Basic Plan', pro: 'Pro Plan', enterprise: 'Enterprise',
};

export default function AdminAdsPage() {
  const { token } = useAuthStore();
  const [ads, setAds] = useState<Advertisement[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [createOpen, setCreateOpen] = useState(false);
  const [editAd, setEditAd] = useState<Advertisement | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState({ title: '', content: '', target: 'all', startDate: '', endDate: '' });

  const fetchAds = () => {
    if (!token) return;
    setLoading(true);
    listAdsApi(token)
      .then(setAds)
      .catch(err => toast.error(err.message || 'Failed to load ads'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchAds();
  }, [token]);

  const filtered = ads.filter(a =>
    a.title.toLowerCase().includes(search.toLowerCase()) &&
    (statusFilter === 'all' || (a.is_active ? 'active' : 'paused') === statusFilter)
  );

  const openCreate = () => { setForm({ title: '', content: '', target: 'all', startDate: '', endDate: '' }); setEditAd(null); setCreateOpen(true); };
  
  const handleSave = async () => {
    if (!form.title.trim() || !form.startDate || !form.endDate) { toast.error('Fill in all required fields'); return; }
    if (!token) return;

    try {
      if (editAd) {
        // Update is not implemented in backend yet, so just placeholder
        toast.info('Update ad not implemented in backend yet');
      } else {
        const created = await createAdApi({
          title: form.title,
          content: form.content,
          target: form.target,
          start_date: new Date(form.startDate).toISOString(),
          end_date: new Date(form.endDate).toISOString(),
          is_active: true,
          media_type: 'image',
          placements: ['dashboard'],
        }, token);
        setAds([created, ...ads]);
        toast.success('Ad created');
      }
      setCreateOpen(false);
    } catch (err: any) {
      toast.error(err.message || 'Failed to save ad');
    }
  };

  const toggleStatus = (id: string, currentActive: boolean) => {
    // Backend doesn't have patch for ad, placeholder
    toast.info('Toggle ad status not implemented in backend yet');
  };

  const duplicate = (ad: Advertisement) => {
    // Placeholder
    toast.info('Duplicate ad not implemented in backend yet');
  };

  const confirmDelete = async () => {
    if (!token || !deleteId) return;
    try {
      await deleteAdApi(deleteId, token);
      setAds(ads.filter(a => a.id !== deleteId));
      toast.success('Ad deleted');
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete ad');
    } finally {
      setDeleteId(null);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Advertisements</h1>
          <p className="text-muted-foreground">Create and manage ads displayed across the platform</p>
        </div>
        <Button onClick={openCreate}><Plus className="mr-2 size-4" />Create Ad</Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-4">
        <Card><CardContent className="pt-6"><div className="text-2xl font-bold">{ads.length}</div><p className="text-sm text-muted-foreground">Total Ads</p></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="text-2xl font-bold text-green-600">{ads.filter(a => a.is_active).length}</div><p className="text-sm text-muted-foreground">Active</p></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="text-2xl font-bold">0</div><p className="text-sm text-muted-foreground">Total Impressions</p></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="text-2xl font-bold">0</div><p className="text-sm text-muted-foreground">Total Clicks</p></CardContent></Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div><CardTitle>All Advertisements</CardTitle><CardDescription>{filtered.length} ads found</CardDescription></div>
            <div className="flex gap-2">
              <div className="relative"><Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input placeholder="Search ads..." value={search} onChange={e => setSearch(e.target.value)} className="pl-8 w-48" /></div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="paused">Paused</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {loading ? (
              <p className="text-center py-8 text-muted-foreground">Loading ads...</p>
            ) : filtered.map(ad => {
              const status = ad.is_active ? 'active' : 'paused';
              return (
                <div key={ad.id} className="flex items-center justify-between gap-4 rounded-lg border p-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium">{ad.title}</p>
                      <Badge className={statusColors[status]}>{status}</Badge>
                      <Badge variant="outline">{targetLabels[ad.target] || ad.target}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-1">{ad.content}</p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><Calendar className="size-3" />{new Date(ad.start_date).toLocaleDateString()} → {new Date(ad.end_date).toLocaleDateString()}</span>
                      <span className="flex items-center gap-1"><Eye className="size-3" />0 impressions</span>
                      <span className="flex items-center gap-1"><Target className="size-3" />0 clicks</span>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal className="size-4" /></Button></DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setDeleteId(ad.id)} className="text-destructive focus:text-destructive"><Trash2 className="mr-2 size-4" />Delete</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              );
            })}
            {!loading && filtered.length === 0 && <p className="text-center py-8 text-muted-foreground">No ads found</p>}
          </div>
        </CardContent>
      </Card>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Create New Ad</DialogTitle>
            <DialogDescription>Fill in the advertisement details</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2"><Label>Title *</Label><Input placeholder="Ad title" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} /></div>
            <div className="space-y-2"><Label>Content *</Label><Textarea placeholder="Ad message or description..." value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))} rows={3} /></div>
            <div className="space-y-2">
              <Label>Target Audience *</Label>
              <Select value={form.target} onValueChange={v => setForm(f => ({ ...f, target: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Companies</SelectItem>
                  <SelectItem value="free">Free Plan Only</SelectItem>
                  <SelectItem value="basic">Basic Plan Only</SelectItem>
                  <SelectItem value="pro">Pro Plan Only</SelectItem>
                  <SelectItem value="enterprise">Enterprise Only</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Start Date *</Label><Input type="date" value={form.startDate} onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))} /></div>
              <div className="space-y-2"><Label>End Date *</Label><Input type="date" value={form.endDate} onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))} /></div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button onClick={handleSave}>Create Ad</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Delete Ad</DialogTitle><DialogDescription>Are you sure? This cannot be undone.</DialogDescription></DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>Cancel</Button>
            <Button variant="destructive" onClick={confirmDelete}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
