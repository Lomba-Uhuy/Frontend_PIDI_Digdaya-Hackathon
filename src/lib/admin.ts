import { apiGet, apiPatch, apiPost, isLive } from "./http";

// ── Admin API client ──────────────────────────────────────────────────────────
// Every call hits an RBAC-gated backend endpoint (admin role enforced server-side).
// Returns real persisted data only.

export interface AdminMetrics {
  users: { total: number; active: number; active30d: number };
  companies: number;
  products: number;
  deals: number;
  workflows: {
    queued: number; running: number; completed: number; failed: number;
    total: number; avgDurationMs: number | null; successRate: number | null;
  };
  ocr: { available: boolean; queued: number; completed: number; failed: number };
  subscriptionDistribution: { plan: string; n: number }[];
  recentErrors: Array<Record<string, unknown>>;
}

export interface Paginated<T> { items: T[]; total: number; page: number; limit: number }

export interface AdminUserRow {
  id: string; email: string; role: string; is_active: boolean;
  last_login_at: string | null; created_at: string;
  plan: string; sub_status: string; umkm_id: string | null;
  legal_name: string | null; nib: string | null; products: number; workflow_status: string | null;
}

export interface ProviderHealth {
  internal: Array<{ name: string; status: string; httpStatus: number | null; latencyMs: number }>;
  external: Array<{ name: string; status: string; lastSync?: string | null; lastError?: string | null; note?: string }>;
}

async function get<T>(path: string, fallback: T): Promise<T> {
  if (!isLive()) return fallback;
  try { return await apiGet<T>(path); } catch { return fallback; }
}

export const getAdminMetrics = () =>
  get<AdminMetrics | null>("/admin/metrics", null);

export const getAdminUsers = (q: { search?: string; page?: number; limit?: number; role?: string; status?: string } = {}) => {
  const qs = new URLSearchParams();
  Object.entries(q).forEach(([k, v]) => v != null && v !== "" && qs.set(k, String(v)));
  return get<Paginated<AdminUserRow>>(`/admin/users?${qs}`, { items: [], total: 0, page: 1, limit: 20 });
};

export const getAdminUser = (id: string) => get<Record<string, unknown> | null>(`/admin/users/${id}`, null);

export const getAdminCompanies = (page = 1) =>
  get<Paginated<Record<string, unknown>>>(`/admin/companies?page=${page}`, { items: [], total: 0, page, limit: 20 });

export const getAdminProducts = (page = 1) =>
  get<Paginated<Record<string, unknown>>>(`/admin/products?page=${page}`, { items: [], total: 0, page, limit: 20 });

export const getAdminWorkflows = (q: { status?: string; page?: number } = {}) => {
  const qs = new URLSearchParams();
  Object.entries(q).forEach(([k, v]) => v != null && v !== "" && qs.set(k, String(v)));
  return get<Paginated<Record<string, unknown>>>(`/admin/workflows?${qs}`, { items: [], total: 0, page: 1, limit: 20 });
};

export const retryAdminWorkflow = (productId: string) =>
  apiPost(`/admin/workflows/${productId}/retry`, {});

export const getAdminSubscriptions = () =>
  get<{ items: Record<string, unknown>[]; distribution: { plan: string; n: number }[]; catalogue: { id: string; label: string; comingSoon: boolean }[] }>(
    "/admin/subscriptions",
    { items: [], distribution: [], catalogue: [] },
  );

export const getAdminProviders = () =>
  get<ProviderHealth>("/admin/providers", { internal: [], external: [] });

export const getAdminActivity = (limit = 40) =>
  get<{ items: Record<string, unknown>[] }>(`/admin/activity?limit=${limit}`, { items: [] });

export const getAdminAudit = (q: { action?: string; limit?: number; offset?: number } = {}) => {
  const qs = new URLSearchParams();
  Object.entries(q).forEach(([k, v]) => v != null && v !== "" && qs.set(k, String(v)));
  return get<{ items: Record<string, unknown>[]; total: number }>(`/admin/audit?${qs}`, { items: [], total: 0 });
};

export const setAdminUserRole = (id: string, role: string) => apiPatch(`/admin/users/${id}/role`, { role });
export const setAdminUserPlan = (id: string, plan: string) => apiPatch(`/admin/users/${id}/plan`, { plan });
