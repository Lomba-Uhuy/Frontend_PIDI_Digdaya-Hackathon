import { apiGet } from "./http";
import type { UmkmResponse } from "./entities";

export interface OnboardingStatus {
  hasCompany: boolean;
  hasProduct: boolean;
  complete: boolean;
  umkmId: string | null;
}

/**
 * Real onboarding status for the authenticated user, derived from backend
 * ownership (GET /umkm/me → company; GET /umkm/:id/products → product). Drives
 * the mandatory flow: no dashboard until BOTH a company and a product exist.
 *
 * Only a genuine 404 means "no company yet". Any other error (502/timeout while
 * the backend restarts) is rethrown so callers can fail open instead of wrongly
 * bouncing a fully-onboarded user back into onboarding.
 */
export async function getOnboardingStatus(): Promise<OnboardingStatus> {
  let umkm: UmkmResponse | null = null;
  try {
    umkm = await apiGet<UmkmResponse>("/umkm/me");
  } catch (e) {
    const status = (e as { status?: number }).status;
    if (status === 404) {
      return { hasCompany: false, hasProduct: false, complete: false, umkmId: null };
    }
    throw e; // transient — let the caller fail open, don't downgrade to "no company"
  }
  if (!umkm?.id) {
    return { hasCompany: false, hasProduct: false, complete: false, umkmId: null };
  }
  let hasProduct = false;
  try {
    const products = await apiGet<{ id: string }[]>(`/umkm/${umkm.id}/products`);
    hasProduct = Array.isArray(products) && products.length > 0;
  } catch (e) {
    const status = (e as { status?: number }).status;
    if (status && status !== 404) throw e; // transient — fail open, don't force onboarding
    hasProduct = false;
  }
  return { hasCompany: true, hasProduct, complete: hasProduct, umkmId: umkm.id };
}
