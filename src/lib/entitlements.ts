import { apiGet, apiPost, isLive } from "./http";
import { getToken } from "./auth";

// ── Backend-owned authorization state (RBAC + subscription entitlements) ───────
// The backend is the ONLY source of truth and the ONLY enforcement point. These
// helpers are for UI hints/gating only — hiding a locked feature never grants it.

export interface Entitlements {
  plan: string;
  label: string;
  flags: Record<string, boolean>;
  quotas: Record<string, number | null>; // null = unlimited
}

export interface Subscription {
  plan: string;
  status: string;
  billingCycle: string;
  startedAt: string;
  expiredAt: string | null;
  paymentStatus: string;
  provider: string | null;
  usage: Record<string, number>;
  entitlements: Entitlements;
}

export interface PlanCatalogueItem {
  id: string;
  label: string;
  comingSoon: boolean;
  quotas: Record<string, number | null>;
  flags: Record<string, boolean>;
}

export async function getSubscription(): Promise<Subscription | null> {
  if (!isLive()) return null;
  try {
    return await apiGet<Subscription>("/subscription/me");
  } catch {
    return null;
  }
}

export async function getPlanCatalogue(): Promise<PlanCatalogueItem[]> {
  if (!isLive()) return [];
  try {
    const r = await apiGet<{ plans: PlanCatalogueItem[] }>("/subscription/plans");
    return r.plans ?? [];
  } catch {
    return [];
  }
}

/** Self-service plan change (payment simulated on the backend for now). */
export async function changePlan(plan: string): Promise<Subscription | null> {
  if (!isLive()) return null;
  try {
    await apiPost("/subscription/change", { plan });
    return await getSubscription();
  } catch (e) {
    console.warn("changePlan failed:", e);
    return null;
  }
}

/** UI-only helper — the backend guard is the real gate. */
export const hasFeature = (ent: Entitlements | null | undefined, feature: string): boolean =>
  Boolean(ent?.flags?.[feature]);

/**
 * Read the RBAC role from the current access token (for hiding menus only). The
 * backend RolesGuard is authoritative; a tampered token still can't access
 * admin endpoints because the gateway re-validates the signature.
 */
export function getRole(): string {
  const token = getToken();
  if (!token) return "umkm";
  try {
    const seg = token.split(".")[1];
    const json = atob(seg.replace(/-/g, "+").replace(/_/g, "/"));
    const payload = JSON.parse(json) as { role?: string };
    return payload.role ?? "umkm";
  } catch {
    return "umkm";
  }
}

export const isAdmin = (): boolean => getRole() === "admin";

/**
 * Where an authenticated user belongs after login. Role comes from the
 * backend-signed session token (JWT), not from frontend state or routes.
 * Admins go straight to the admin platform — never through UMKM onboarding.
 */
export const postAuthRedirect = (): string => (getRole() === "admin" ? "/admin/dashboard" : "/dashboard");
