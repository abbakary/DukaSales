import { apiFetch } from "./client";
import type { Company, User } from "@/lib/types";

export interface LoginResponse {
  access_token: string;
  token_type: string;
  role: string;
  user_id: string;
  company_id?: string | null;
}

export interface MeResponse {
  user: User;
  company: Company | null;
}

// ------------------ MAP USER ------------------
function mapUser(raw: any): User {
  return {
    id: raw.id,
    companyId: raw.company_id ?? raw.companyId,
    email: raw.email,
    name: raw.name,
    role: raw.role,
    isActive: raw.is_active ?? raw.isActive ?? true,
    createdAt: new Date(raw.created_at ?? raw.createdAt),
    updatedAt: new Date(raw.updated_at ?? raw.updatedAt),
  };
}

// ------------------ MAP COMPANY ------------------
function mapCompany(raw: any): Company {
  return {
    id: raw.id,
    name: raw.name,
    types: raw.types ?? [],
    logo: raw.logo,
    address: raw.address,
    phone: raw.phone,
    email: raw.email,
    taxId: raw.tax_id ?? raw.taxId,
    currency: raw.currency ?? "TSH",
    currencySymbol: raw.currency_symbol ?? raw.currencySymbol ?? "TSh",
    subscriptionPlan: raw.subscription_plan ?? "free",
    subscriptionExpiry: raw.subscription_expiry
      ? new Date(raw.subscription_expiry)
      : undefined,
    isActive: raw.is_active ?? true,
    createdAt: new Date(raw.created_at),
    updatedAt: new Date(raw.updated_at),
  };
}

// ------------------ LOGIN ------------------
export async function loginApi(email: string, password: string) {
  const response = await apiFetch<LoginResponse>("/auth/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json", // 🔥 IMPORTANT FIX
    },
    body: JSON.stringify({ email, password }),
  });

  // Store token safely
  if (typeof window !== "undefined" && response?.access_token) {
    localStorage.setItem("access_token", response.access_token);
  }

  return response;
}

// ------------------ GET TOKEN ------------------
function getStoredToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("access_token");
}

// ------------------ GET ME ------------------
export async function getMeApi(token?: string): Promise<MeResponse> {
  const authToken = token ?? getStoredToken();

  if (!authToken) {
    throw new Error("No authentication token found");
  }

  const raw = await apiFetch<any>("/auth/me", {
    token: authToken,
  });

  return {
    user: mapUser(raw.user),
    company: raw.company ? mapCompany(raw.company) : null,
  };
}
