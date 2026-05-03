import { apiFetch } from "./client";

export async function listTenantResource<T>(resourceName: string, token: string) {
  return apiFetch<T[]>(`/tenant/${resourceName}`, { token });
}

export async function createTenantResource<T>(resourceName: string, payload: Record<string, unknown>, token: string) {
  return apiFetch<T>(`/tenant/${resourceName}`, {
    method: "POST",
    token,
    body: JSON.stringify(payload),
  });
}

export async function updateTenantResource<T>(resourceName: string, id: string, payload: Record<string, unknown>, token: string) {
  return apiFetch<T>(`/tenant/${resourceName}/${id}`, {
    method: "PATCH",
    token,
    body: JSON.stringify(payload),
  });
}

export async function deleteTenantResource(resourceName: string, id: string, token: string) {
  return apiFetch<{ success: boolean }>(`/tenant/${resourceName}/${id}`, {
    method: "DELETE",
    token,
  });
}

export async function receivePurchaseOrderItems(
  orderId: string,
  receiveQtys: Record<string, number>,
  token: string,
  autoCreateProducts = false
) {
  return apiFetch(`/tenant/purchase_orders/${orderId}/receive`, {
    method: "POST",
    token,
    body: JSON.stringify({ receive_qtys: receiveQtys, auto_create_products: autoCreateProducts }),
  });
}

export async function completePosSale(payload: Record<string, unknown>, token: string) {
  return apiFetch(`/tenant/pos/complete-sale`, {
    method: "POST",
    token,
    body: JSON.stringify(payload),
  });
}

export async function processPosReturn(payload: Record<string, unknown>, token: string) {
  return apiFetch(`/tenant/pos/process-return`, {
    method: "POST",
    token,
    body: JSON.stringify(payload),
  });
}

export async function recordDebtPayment(debtId: string, amount: number, paymentMethod: string, token: string) {
  return apiFetch(`/tenant/debts/${debtId}/record-payment`, {
    method: "POST",
    token,
    body: JSON.stringify({ amount, payment_method: paymentMethod }),
  });
}

// Events
export type TenantEvent = {
  id: string;
  company_id: string;
  title: string;
  description?: string | null;
  start_date: string;
  end_date?: string | null;
  is_all_day?: boolean;
  visibility: "public" | "private";
  created_by?: string | null;
  created_by_name?: string | null;
  created_at: string;
  updated_at: string;
};

export async function listEvents(token: string) {
  return apiFetch<TenantEvent[]>(`/tenant/events`, { token });
}

export async function createEvent(payload: Record<string, unknown>, token: string) {
  return apiFetch<TenantEvent>(`/tenant/events`, {
    method: "POST",
    token,
    body: JSON.stringify(payload),
  });
}

export async function updateEvent(id: string, payload: Record<string, unknown>, token: string) {
  return apiFetch<TenantEvent>(`/tenant/events/${id}`, {
    method: "PATCH",
    token,
    body: JSON.stringify(payload),
  });
}

export async function deleteEvent(id: string, token: string) {
  return apiFetch<{ success: boolean }>(`/tenant/events/${id}`, {
    method: "DELETE",
    token,
  });
}
