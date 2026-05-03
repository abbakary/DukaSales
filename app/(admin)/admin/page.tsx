'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Building2,
  Users,
  Banknote,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  Eye,
  Plus,
  Megaphone,
  CreditCard,
  Activity,
  Clock,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { useAuthStore } from '@/lib/stores/auth-store';
import { getAdminDashboardStatsApi, DashboardStats } from '@/lib/api/admin-dashboard';
import { listAdsApi, Advertisement } from '@/lib/api/admin-ads';
import { toast } from 'sonner';

export default function AdminDashboardPage() {
  const { token } = useAuthStore();
  const [data, setData] = useState<DashboardStats | null>(null);
  const [activeAds, setActiveAds] = useState<Advertisement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    Promise.all([
      getAdminDashboardStatsApi(token),
      listAdsApi(token)
    ])
    .then(([stats, ads]) => {
      setData(stats);
      setActiveAds(ads);
    })
    .catch(err => {
      toast.error('Failed to load dashboard data');
      console.error(err);
    })
    .finally(() => setLoading(false));
  }, [token]);

  if (loading) {
    return <div className="p-6">Loading dashboard data...</div>;
  }

  const stats = data?.stats || {
    totalCompanies: 0,
    activeCompanies: 0,
    totalUsers: 0,
    monthlyRevenue: 0,
    revenueGrowth: 0,
    newCompaniesThisMonth: 0,
    activeSubscriptions: 0,
    pendingApprovals: 0,
  };

  const recentCompanies = data?.recentCompanies || [];
  const subscriptionBreakdown = data?.subscriptionBreakdown || [];
  const recentActivity = data?.recentActivity || [];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Platform Overview</h1>
          <p className="text-muted-foreground">
            Monitor and manage all companies, users, and subscriptions
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/admin/reports">
              <TrendingUp className="mr-2 size-4" />
              View Reports
            </Link>
          </Button>
          <Button asChild>
            <Link href="/admin/companies/new">
              <Plus className="mr-2 size-4" />
              Add Company
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Companies
            </CardTitle>
            <Building2 className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalCompanies}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              <span className="flex items-center text-success">
                <ArrowUpRight className="mr-1 size-3" />
                +{stats.newCompaniesThisMonth}
              </span>
              <span className="ml-1">this month</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Users
            </CardTitle>
            <Users className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers.toLocaleString()}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              <span className="flex items-center text-success">
                <ArrowUpRight className="mr-1 size-3" />
                Active: {stats.activeUsers}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Monthly Revenue
            </CardTitle>
            <Banknote className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">TSh {stats.monthlyRevenue.toLocaleString()}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              <span className="flex items-center text-success">
                <ArrowUpRight className="mr-1 size-3" />
                +{stats.revenueGrowth}%
              </span>
              <span className="ml-1">vs last month</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pending Approvals
            </CardTitle>
            <Clock className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingApprovals}</div>
            <div className="text-xs text-muted-foreground">
              <Link href="/admin/companies" className="text-primary hover:underline">
                Review pending requests
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recent Companies */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Recent Companies</CardTitle>
              <CardDescription>Latest registered businesses</CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/admin/companies">
                View all
                <ArrowUpRight className="ml-1 size-3" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentCompanies.map((company) => (
                <div
                  key={company.id}
                  className="flex items-center justify-between gap-4 rounded-lg border p-3"
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="size-10">
                      <AvatarFallback className="bg-primary/10 text-primary text-sm">
                        {company.name.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{company.name}</p>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span className="capitalize">{(company.types || []).join(' + ')}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge
                      variant={company.is_active ? 'default' : 'secondary'}
                      className={company.is_active ? 'bg-success text-success-foreground' : ''}
                    >
                      {company.is_active ? 'active' : 'suspended'}
                    </Badge>
                    <Badge variant="outline" className="capitalize">
                      {company.subscription_plan}
                    </Badge>
                    <Button variant="ghost" size="icon" asChild>
                      <Link href={`/admin/companies/${company.id}`}>
                        <Eye className="size-4" />
                      </Link>
                    </Button>
                  </div>
                </div>
              ))}
              {recentCompanies.length === 0 && (
                <p className="text-sm text-muted-foreground">No recent companies found.</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Subscription Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Subscription Plans</CardTitle>
            <CardDescription>Distribution by plan type</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {subscriptionBreakdown.map((plan) => (
              <div key={plan.plan} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">{plan.plan}</span>
                  <span className="text-muted-foreground">{plan.count} companies</span>
                </div>
                <Progress value={plan.percentage} className="h-2" />
              </div>
            ))}
            {subscriptionBreakdown.length === 0 && (
              <p className="text-sm text-muted-foreground">No subscription data.</p>
            )}
            <div className="pt-4 border-t">
              <Button variant="outline" className="w-full" asChild>
                <Link href="/admin/subscriptions">
                  <CreditCard className="mr-2 size-4" />
                  Manage Plans
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Active Ads */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Active Campaigns</CardTitle>
              <CardDescription>Current advertising campaigns</CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/admin/ads">
                View all
                <ArrowUpRight className="ml-1 size-3" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {activeAds.slice(0, 3).map((ad) => (
                <div key={ad.id} className="flex items-center justify-between gap-4 rounded-lg border p-3">
                  <div className="flex items-center gap-3">
                    <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Megaphone className="size-5" />
                    </div>
                    <div>
                      <p className="font-medium">{ad.title}</p>
                      <p className="text-sm text-muted-foreground">
                        Status: {ad.is_active ? 'active' : 'inactive'}
                      </p>
                    </div>
                  </div>
                  <Badge variant={ad.is_active ? 'default' : 'secondary'}>
                    {ad.is_active ? 'active' : 'inactive'}
                  </Badge>
                </div>
              ))}
              {activeAds.length === 0 && (
                <p className="text-sm text-muted-foreground">No active campaigns found.</p>
              )}
              <Button variant="outline" className="w-full" asChild>
                <Link href="/admin/ads/new">
                  <Plus className="mr-2 size-4" />
                  Create New Ad
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Latest platform activity</CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/admin/users">
                View all
                <ArrowUpRight className="ml-1 size-3" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.map((activity, index) => (
                <div key={index} className="flex items-start gap-3">
                  <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted">
                    <Activity className="size-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1 space-y-1">
                    <p className="text-sm">
                      <span className="font-medium">{activity.action}</span>
                      <span className="text-muted-foreground"> - {activity.target}</span>
                    </p>
                    <p className="text-xs text-muted-foreground">{new Date(activity.time).toLocaleString()}</p>
                  </div>
                </div>
              ))}
              {recentActivity.length === 0 && (
                <p className="text-sm text-muted-foreground">No recent activity.</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
