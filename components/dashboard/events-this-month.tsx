'use client';

import { useEffect, useMemo, useState } from 'react';
import { CalendarDays, Plus, RefreshCcw, Lock, Globe } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuthStore } from '@/lib/stores/auth-store';
import { listEvents, type TenantEvent } from '@/lib/api/tenant';
import { useI18n } from '@/lib/i18n/use-i18n';

function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1, 0, 0, 0, 0);
}
function endOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
}

export function EventsThisMonth({
  onCreate,
  onOpenCalendar,
}: {
  onCreate?: () => void;
  onOpenCalendar?: () => void;
}) {
  const { token, user } = useAuthStore();
  const { t } = useI18n();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [events, setEvents] = useState<TenantEvent[]>([]);

  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';

  const monthEvents = useMemo(() => {
    const now = new Date();
    const start = startOfMonth(now).getTime();
    const end = endOfMonth(now).getTime();
    return events
      .filter((e) => {
        const t = new Date(e.start_date).getTime();
        return t >= start && t <= end;
      })
      .slice(0, 6);
  }, [events]);

  const load = async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const data = await listEvents(token);
      setEvents(data);
    } catch (e: any) {
      setError(e?.message || 'Failed to fetch events');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const marqueeItems = useMemo(() => monthEvents.concat(monthEvents), [monthEvents]);
  const marqueeDuration = useMemo(() => {
    // Keep smooth speed regardless of event count.
    const base = Math.max(18, monthEvents.length * 5);
    return `${base}s`;
  }, [monthEvents.length]);

  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="min-w-0">
          <CardTitle className="flex items-center gap-2">
            <CalendarDays className="size-5 text-primary" />
            {t('dashboard.upcomingEvents')}
          </CardTitle>
          <div className="text-sm text-muted-foreground">
            {t('dashboard.visibleToStaff')}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" onClick={load} disabled={loading}>
            <RefreshCcw className="mr-2 size-4" />
            {t('dashboard.refreshEvents')}
          </Button>
          <Button variant="outline" size="sm" onClick={onOpenCalendar}>
            {t('dashboard.openCalendar')}
          </Button>
          {isAdmin && (
            <Button size="sm" onClick={onCreate}>
              <Plus className="mr-2 size-4" />
              {t('dashboard.addEvent')}
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {error && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </div>
        )}
        {!error && monthEvents.length === 0 && (
          <div className="rounded-lg border bg-muted/30 p-6 text-center">
            <div className="text-sm font-semibold">{t('dashboard.noUpcomingEvents')}</div>
            <div className="text-xs text-muted-foreground">
              {t('dashboard.createEventsFor')}
            </div>
          </div>
        )}
        {monthEvents.length > 0 && (
          <div className="relative overflow-hidden rounded-xl">
            <div className="pointer-events-none absolute inset-y-0 left-0 w-10 bg-gradient-to-r from-background to-transparent" />
            <div className="pointer-events-none absolute inset-y-0 right-0 w-10 bg-gradient-to-l from-background to-transparent" />
            <div
              className="group flex w-max gap-4 pb-2 pr-4 [animation:events-marquee_linear_infinite] hover:[animation-play-state:paused]"
              style={{ animationDuration: marqueeDuration }}
            >
              {marqueeItems.map((e, idx) => {
                const isPrivate = e.visibility === 'private';
                const bg = isPrivate
                  ? 'from-fuchsia-600 via-purple-600 to-indigo-700'
                  : 'from-emerald-500 via-cyan-500 to-blue-600';
                const icon = isPrivate ? <Lock className="size-3" /> : <Globe className="size-3" />;
                return (
                  <div
                    key={`${e.id}-${idx}`}
                    className={`min-w-[300px] max-w-[340px] rounded-2xl border text-white shadow-sm bg-gradient-to-br ${bg} p-4`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <Badge className="bg-white/15 text-white border-white/20 gap-1">
                        {icon}
                        {e.visibility.toUpperCase()}
                      </Badge>
                      <div className="text-xs text-white/80">
                        {new Date(e.start_date).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="mt-3 text-xl font-black leading-tight tracking-tight line-clamp-2">
                      {e.title}
                    </div>
                    {e.description ? (
                      <div className="mt-2 text-sm text-white/90 line-clamp-2">
                        {e.description}
                      </div>
                    ) : (
                      <div className="mt-2 text-sm text-white/80">
                        {new Date(e.start_date).toLocaleString()}
                      </div>
                    )}
                    <div className="mt-3 text-[11px] text-white/75">
                      {e.created_by_name ? `By ${e.created_by_name}` : ' '}
                    </div>
                  </div>
                );
              })}
            </div>
            <style jsx>{`
              @keyframes events-marquee {
                from {
                  transform: translateX(0);
                }
                to {
                  transform: translateX(-50%);
                }
              }
            `}</style>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

