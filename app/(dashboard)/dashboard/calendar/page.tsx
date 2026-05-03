'use client';

import { useEffect, useMemo, useState } from 'react';
import { Plus, RefreshCcw, Trash2, Edit, Lock, Globe } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import { useAuthStore } from '@/lib/stores/auth-store';
import { createEvent, deleteEvent, listEvents, updateEvent, type TenantEvent } from '@/lib/api/tenant';

type EventForm = {
  title: string;
  description: string;
  startDate: string; // yyyy-mm-ddThh:mm
  endDate: string; // yyyy-mm-ddThh:mm
  isAllDay: boolean;
  isPrivate: boolean;
};

function toInputDateTimeValue(d: Date) {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function CalendarPage() {
  const { token, user } = useAuthStore();
  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';

  const [loading, setLoading] = useState(false);
  const [events, setEvents] = useState<TenantEvent[]>([]);
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<'create' | 'edit'>('create');
  const [active, setActive] = useState<TenantEvent | null>(null);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState<EventForm>(() => {
    const start = new Date();
    const end = new Date(Date.now() + 60 * 60 * 1000);
    return {
      title: '',
      description: '',
      startDate: toInputDateTimeValue(start),
      endDate: toInputDateTimeValue(end),
      isAllDay: false,
      isPrivate: false,
    };
  });

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return events;
    return events.filter((e) => {
      return (
        e.title.toLowerCase().includes(q) ||
        (e.description || '').toLowerCase().includes(q)
      );
    });
  }, [events, search]);

  const publicEvents = useMemo(() => filtered.filter((e) => e.visibility === 'public'), [filtered]);
  const myEvents = useMemo(() => filtered, [filtered]);

  const load = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const data = await listEvents(token);
      setEvents(data);
    } catch (e: any) {
      toast.error(e?.message || 'Failed to fetch events');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const openCreate = () => {
    const start = new Date();
    const end = new Date(Date.now() + 60 * 60 * 1000);
    setMode('create');
    setActive(null);
    setForm({
      title: '',
      description: '',
      startDate: toInputDateTimeValue(start),
      endDate: toInputDateTimeValue(end),
      isAllDay: false,
      isPrivate: false,
    });
    setOpen(true);
  };

  const openEdit = (e: TenantEvent) => {
    setMode('edit');
    setActive(e);
    setForm({
      title: e.title,
      description: e.description || '',
      startDate: toInputDateTimeValue(new Date(e.start_date)),
      endDate: e.end_date ? toInputDateTimeValue(new Date(e.end_date)) : toInputDateTimeValue(new Date(new Date(e.start_date).getTime() + 60 * 60 * 1000)),
      isAllDay: Boolean(e.is_all_day),
      isPrivate: e.visibility === 'private',
    });
    setOpen(true);
  };

  const submit = async () => {
    if (!token) return;
    if (!isAdmin) {
      toast.error('Admin access required');
      return;
    }
    const title = form.title.trim();
    if (!title) {
      toast.error('Title is required');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        title,
        description: form.description.trim() || undefined,
        start_date: new Date(form.startDate).toISOString(),
        end_date: form.endDate ? new Date(form.endDate).toISOString() : undefined,
        is_all_day: form.isAllDay,
        visibility: form.isPrivate ? 'private' : 'public',
      };

      if (mode === 'create') {
        await createEvent(payload, token);
        toast.success('Event created');
      } else if (active) {
        await updateEvent(active.id, payload, token);
        toast.success('Event updated');
      }
      setOpen(false);
      await load();
    } catch (e: any) {
      toast.error(e?.message || 'Failed to save event');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (e: TenantEvent) => {
    if (!token) return;
    if (!isAdmin) {
      toast.error('Admin access required');
      return;
    }
    try {
      await deleteEvent(e.id, token);
      toast.success('Event deleted');
      await load();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to delete');
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Calendar</h1>
          <p className="text-muted-foreground">
            {isAdmin ? 'Create public or private events for your shop.' : 'View public shop events.'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative w-full max-w-sm">
            <Input placeholder="Search events..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <Button variant="outline" onClick={load} disabled={loading}>
            <RefreshCcw className="mr-2 size-4" />
            Refresh
          </Button>
          {isAdmin && (
            <Button onClick={openCreate}>
              <Plus className="mr-2 size-4" />
              New Event
            </Button>
          )}
        </div>
      </div>

      <Tabs defaultValue={isAdmin ? 'all' : 'public'} className="space-y-4">
        <TabsList>
          {isAdmin && <TabsTrigger value="all">My Events</TabsTrigger>}
          <TabsTrigger value="public">Public Events</TabsTrigger>
        </TabsList>

        {isAdmin && (
          <TabsContent value="all">
            <Card>
              <CardHeader>
                <CardTitle>All events</CardTitle>
                <CardDescription>Includes private events (admin only)</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {myEvents.length === 0 ? (
                  <div className="rounded-lg border bg-muted/30 p-8 text-center text-sm text-muted-foreground">
                    No events found.
                  </div>
                ) : (
                  myEvents.map((e) => (
                    <div key={e.id} className="flex items-start justify-between gap-3 rounded-lg border p-4">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <div className="font-semibold truncate">{e.title}</div>
                          <Badge variant="secondary" className="gap-1">
                            {e.visibility === 'private' ? <Lock className="size-3" /> : <Globe className="size-3" />}
                            {e.visibility}
                          </Badge>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(e.start_date).toLocaleString()}
                          {e.end_date ? ` → ${new Date(e.end_date).toLocaleString()}` : ''}
                        </div>
                        {e.description ? (
                          <div className="mt-1 text-sm text-muted-foreground line-clamp-2">{e.description}</div>
                        ) : null}
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <Button variant="outline" size="sm" onClick={() => openEdit(e)}>
                          <Edit className="mr-2 size-3" />
                          Edit
                        </Button>
                        <Button variant="destructive" size="sm" onClick={() => remove(e)}>
                          <Trash2 className="mr-2 size-3" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </TabsContent>
        )}

        <TabsContent value="public">
          <Card>
            <CardHeader>
              <CardTitle>Public events</CardTitle>
              <CardDescription>Visible to all shop roles</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {publicEvents.length === 0 ? (
                <div className="rounded-lg border bg-muted/30 p-8 text-center text-sm text-muted-foreground">
                  No public events found.
                </div>
              ) : (
                publicEvents.map((e) => (
                  <div key={e.id} className="rounded-lg border p-4">
                    <div className="font-semibold">{e.title}</div>
                    <div className="text-xs text-muted-foreground">{new Date(e.start_date).toLocaleString()}</div>
                    {e.description ? (
                      <div className="mt-1 text-sm text-muted-foreground">{e.description}</div>
                    ) : null}
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>{mode === 'create' ? 'Create Event' : 'Edit Event'}</DialogTitle>
            <DialogDescription>
              Private events are only visible to admins. Public events are visible to all roles.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label>Title</Label>
              <Input value={form.title} onChange={(e) => setForm((s) => ({ ...s, title: e.target.value }))} />
            </div>

            <div className="grid gap-2">
              <Label>Description</Label>
              <Textarea value={form.description} onChange={(e) => setForm((s) => ({ ...s, description: e.target.value }))} rows={3} />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label>Start</Label>
                <Input
                  type="datetime-local"
                  value={form.startDate}
                  onChange={(e) => setForm((s) => ({ ...s, startDate: e.target.value }))}
                />
              </div>
              <div className="grid gap-2">
                <Label>End</Label>
                <Input
                  type="datetime-local"
                  value={form.endDate}
                  onChange={(e) => setForm((s) => ({ ...s, endDate: e.target.value }))}
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-4 rounded-lg border p-3">
              <div className="space-y-0.5">
                <div className="font-semibold text-sm">All day</div>
                <div className="text-xs text-muted-foreground">Event has no specific time</div>
              </div>
              <Switch checked={form.isAllDay} onCheckedChange={(v) => setForm((s) => ({ ...s, isAllDay: v }))} />
            </div>

            <div className="flex flex-wrap items-center justify-between gap-4 rounded-lg border p-3">
              <div className="space-y-0.5">
                <div className="font-semibold text-sm">Private</div>
                <div className="text-xs text-muted-foreground">Visible to admin only</div>
              </div>
              <Switch checked={form.isPrivate} onCheckedChange={(v) => setForm((s) => ({ ...s, isPrivate: v }))} />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={submit} disabled={saving}>
              {saving ? 'Saving...' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

