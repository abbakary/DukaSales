import { apiFetch } from "./client";

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  company: string;
  role: string;
  status: string;
  lastLogin: string | null;
  plan: string;
}

export async function listAdminUsersApi(token: string) {
  return apiFetch<AdminUser[]>("/admin/users", { token });
}

export async function toggleAdminUserStatusApi(userId: string, token: string) {
  return apiFetch<{ id: string; status: string }>(`/admin/users/${userId}/toggle-status`, {
    method: "PATCH",
    token,
  });
}
