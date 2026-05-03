import { apiFetch } from "./client";

export interface DashboardStats {
  stats: {
    totalCompanies: number;
    activeCompanies: number;
    totalUsers: number;
    activeUsers: number;
    monthlyRevenue: number;
    revenueGrowth: number;
    newCompaniesThisMonth: number;
    activeSubscriptions: number;
    pendingApprovals: number;
  };
  subscriptionBreakdown: Array<{
    plan: string;
    count: number;
    percentage: number;
  }>;
  recentCompanies: Array<{
    id: string;
    name: string;
    types: string[];
    subscription_plan: string;
    is_active: boolean;
    created_at: string;
  }>;
  recentActivity: Array<{
    action: string;
    target: string;
    time: string;
    type: string;
  }>;
}

export async function getAdminDashboardStatsApi(token: string) {
  return apiFetch<DashboardStats>("/admin/dashboard-stats", { token });
}
