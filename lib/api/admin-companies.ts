import type { Company } from "@/lib/types";
import { apiFetch, getApiBaseUrl } from "./client";

export interface CreateCompanyPayload {
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  tax_id?: string;
  logo?: string;
  currency: string;
  currency_symbol: string;
  types: string[];
  subscription_plan: string;
  is_active: boolean;
  admin_name: string;
  admin_email: string;
  admin_password: string;
  // Enhanced company details
  vrn_no?: string;
  tin_no?: string;
  website?: string;
  physical_address?: string;
  postal_address?: string;
  country?: string;
  region?: string;
  city?: string;
  postal_code?: string;
  business_license_no?: string;
  business_registration_no?: string;
  business_type?: string;
  industry?: string;
  year_established?: number;
  contact_person?: string;
  contact_person_title?: string;
  alternative_phone?: string;
  fax?: string;
  whatsapp?: string;
  facebook?: string;
  twitter?: string;
  instagram?: string;
  linkedin?: string;
  document_prefix?: string;
  document_footer?: string;
  document_header?: string;
  // Bank details and terms conditions
  bank_details?: Array<{
    bank_name: string;
    account_name: string;
    account_number: string;
    branch_name?: string;
    branch_code?: string;
    swift_code?: string;
    iban?: string;
    routing_number?: string;
    sort_code?: string;
    bank_address?: string;
    is_primary?: boolean;
    is_active?: boolean;
  }>;
  terms_conditions?: Array<{
    document_type: string;
    title?: string;
    terms_text?: string;
    payment_terms?: string;
    delivery_terms?: string;
    warranty_terms?: string;
    return_policy?: string;
    late_payment_terms?: string;
    cancellation_policy?: string;
    is_active?: boolean;
  }>;
}

export async function listCompaniesApi(token: string) {
  const rows = await apiFetch<any[]>("/admin/companies", { token });
  return rows.map((raw) => ({
    id: raw.id,
    name: raw.name,
    types: raw.types ?? [],
    logo: raw.logo,
    address: raw.address,
    phone: raw.phone,
    email: raw.email,
    taxId: raw.tax_id,
    currency: raw.currency,
    currencySymbol: raw.currency_symbol ?? "TSh",
    subscriptionPlan: raw.subscription_plan ?? "free",
    subscriptionExpiry: raw.subscription_expiry ? new Date(raw.subscription_expiry) : undefined,
    isActive: raw.is_active ?? true,
    createdAt: new Date(raw.created_at),
    updatedAt: new Date(raw.updated_at),
  })) as Company[];
}

export async function createCompanyApi(payload: CreateCompanyPayload, token: string) {
  return apiFetch<Company>("/admin/companies", {
    method: "POST",
    token,
    body: JSON.stringify(payload),
  });
}

export async function getCompanyApi(id: string, token: string) {
  const raw = await apiFetch<any>(`/admin/companies/${id}`, { token });
  return {
    id: raw.id,
    name: raw.name,
    types: raw.types ?? [],
    logo: raw.logo,
    address: raw.address,
    phone: raw.phone,
    email: raw.email,
    taxId: raw.tax_id,
    currency: raw.currency,
    currencySymbol: raw.currency_symbol ?? "TSh",
    subscriptionPlan: raw.subscription_plan ?? "free",
    subscriptionExpiry: raw.subscription_expiry ? new Date(raw.subscription_expiry) : undefined,
    isActive: raw.is_active ?? true,
    createdAt: new Date(raw.created_at),
    updatedAt: new Date(raw.updated_at),
    // Enhanced fields
    vrn_no: raw.vrn_no,
    tin_no: raw.tin_no,
    website: raw.website,
    physical_address: raw.physical_address,
    postal_address: raw.postal_address,
    country: raw.country,
    region: raw.region,
    city: raw.city,
    postal_code: raw.postal_code,
    business_license_no: raw.business_license_no,
    business_registration_no: raw.business_registration_no,
    business_type: raw.business_type,
    industry: raw.industry,
    year_established: raw.year_established,
    contact_person: raw.contact_person,
    contact_person_title: raw.contact_person_title,
    alternative_phone: raw.alternative_phone,
    fax: raw.fax,
    whatsapp: raw.whatsapp,
    facebook: raw.facebook,
    twitter: raw.twitter,
    instagram: raw.instagram,
    linkedin: raw.linkedin,
    document_prefix: raw.document_prefix,
    document_footer: raw.document_footer,
    document_header: raw.document_header,
  } as Company;
}

export async function updateCompanyApi(id: string, payload: Partial<CreateCompanyPayload>, token: string) {
  return apiFetch<Company>(`/admin/companies/${id}`, {
    method: "PUT",
    token,
    body: JSON.stringify(payload),
  });
}

export async function updateTenantCompanyApi(payload: Partial<CreateCompanyPayload>, token: string) {
  return apiFetch<Company>(`/tenant/company`, {
    method: "PUT",
    token,
    body: JSON.stringify(payload),
  });
}

export async function toggleCompanyStatusApi(id: string, token: string) {
  return apiFetch<Company>(`/admin/companies/${id}/toggle-status`, {
    method: "POST",
    token,
  });
}

export async function deleteCompanyApi(id: string, token: string) {
  return apiFetch(`/admin/companies/${id}`, {
    method: "DELETE",
    token,
  });
}

export async function getCompanyStatsApi(id: string, token: string) {
  return apiFetch<{
    users: number;
    products: number;
    transactions: number;
    revenue: number;
    customers: number;
    suppliers: number;
  }>(`/admin/companies/${id}/stats`, { token });
}

export async function getCompanyUsersApi(id: string, token: string) {
  return apiFetch<any[]>(`/admin/companies/${id}/users`, { token });
}

export async function getCompanyTransactionsApi(id: string, token: string) {
  return apiFetch<any[]>(`/admin/companies/${id}/transactions`, { token });
}

export async function uploadCompanyLogoApi(file: File, token: string) {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`${getApiBaseUrl()}/admin/companies/logo-upload`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    body: formData,
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.detail || "Logo upload failed");
  }
  const data = (await response.json()) as { logo_url: string };
  const logoUrl = data.logo_url.startsWith("http")
    ? data.logo_url
    : `${getApiBaseUrl()}${data.logo_url}`;
  return { logo_url: logoUrl };
}

export async function uploadTenantCompanyLogoApi(file: File, token: string) {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`${getApiBaseUrl()}/tenant/company/logo-upload`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    body: formData,
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.detail || "Logo upload failed");
  }
  const data = (await response.json()) as { logo_url: string };
  const logoUrl = data.logo_url.startsWith("http")
    ? data.logo_url
    : `${getApiBaseUrl()}${data.logo_url}`;
  return { logo_url: logoUrl };
}
