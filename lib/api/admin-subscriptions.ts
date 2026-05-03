import { apiFetch } from "./client";

export interface AdminSubscriptionPlan {
  id: string;
  name: string;
  price: number;
  billingCycle: string;
  maxUsers: number;
  maxProducts: number;
  maxLocations: number;
  features: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

function mapPlan(raw: any): AdminSubscriptionPlan {
  return {
    id: raw.id,
    name: raw.name,
    price: raw.price ?? 0,
    billingCycle: raw.billing_cycle ?? "monthly",
    maxUsers: raw.max_users ?? 1,
    maxProducts: raw.max_products ?? 100,
    maxLocations: raw.max_locations ?? 1,
    features: raw.features ?? [],
    isActive: raw.is_active ?? true,
    createdAt: new Date(raw.created_at ?? Date.now()),
    updatedAt: new Date(raw.updated_at ?? Date.now()),
  };
}

export async function listSubscriptionPlansApi(token: string) {
  const rows = await apiFetch<any[]>("/admin/subscription-plans", { token });
  return rows.map(mapPlan);
}

export async function createSubscriptionPlanApi(payload: Partial<AdminSubscriptionPlan>, token: string) {
  const row = await apiFetch<any>("/admin/subscription-plans", {
    method: "POST",
    token,
    body: JSON.stringify({
      name: payload.name,
      price: payload.price ?? 0,
      billing_cycle: payload.billingCycle ?? "monthly",
      max_users: payload.maxUsers ?? 1,
      max_products: payload.maxProducts ?? 100,
      max_locations: payload.maxLocations ?? 1,
      features: payload.features ?? [],
      is_active: payload.isActive ?? true,
    }),
  });
  return mapPlan(row);
}

export async function updateSubscriptionPlanApi(planId: string, payload: Partial<AdminSubscriptionPlan>, token: string) {
  const row = await apiFetch<any>(`/admin/subscription-plans/${planId}`, {
    method: "PATCH",
    token,
    body: JSON.stringify({
      name: payload.name,
      price: payload.price,
      billing_cycle: payload.billingCycle,
      max_users: payload.maxUsers,
      max_products: payload.maxProducts,
      max_locations: payload.maxLocations,
      features: payload.features,
      is_active: payload.isActive,
    }),
  });
  return mapPlan(row);
}

export async function deleteSubscriptionPlanApi(planId: string, token: string) {
  return apiFetch<{ success: boolean }>(`/admin/subscription-plans/${planId}`, {
    method: "DELETE",
    token,
  });
}

export async function assignCompanySubscriptionApi(companyId: string, planId: string, subscriptionExpiry: string | null, token: string) {
  return apiFetch(`/admin/companies/${companyId}/assign-subscription`, {
    method: "POST",
    token,
    body: JSON.stringify({
      plan_id: planId,
      subscription_expiry: subscriptionExpiry || undefined,
    }),
  });
}

export async function getCurrentSubscriptionApi(token: string) {
  return apiFetch<any>("/tenant/subscription/current", { token });
}
