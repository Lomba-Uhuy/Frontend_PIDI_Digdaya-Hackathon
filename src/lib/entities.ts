import { apiGet, apiPatch, apiPost, isLive } from "./http";

// ── Real backend persistence for the core entities (UMKM + Product) ──────────
// The demo journey used to live entirely in localStorage. These helpers create
// the same entities in the backend (idempotently) so downstream features that
// need real UUIDs (generate-reply.product_id, matching/search.product_id) work.
// Everything is best-effort: on any failure the caller keeps the localStorage
// flow so the demo never breaks offline.

const UMKM_ID_KEY = "tradeconnect_umkm_id";
const PRODUCT_ID_KEY = "tradeconnect_product_id";

export interface OnboardingProfile {
  companyName: string;
  nib: string;
  productName: string;
  productDesc: string;
  moq: string;
  capacity: string;
  floorPriceUsd: number;
  askingPriceUsd: number;
}

export interface UmkmResponse {
  id: string;
  legalName: string;
  nib: string;
  verificationStatus: string;
  verifiedScore: string;
}

export interface ProductResponse {
  id: string;
  umkmId: string;
  name: string;
  hsCode: string;
  hsConfidence: string;
}

const parseIntLoose = (s: string, fallback: number): number => {
  const digits = (s || "").replace(/[^0-9]/g, "");
  const n = parseInt(digits, 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
};

export function getStoredIds(): { umkmId: string | null; productId: string | null } {
  if (typeof window === "undefined") return { umkmId: null, productId: null };
  return {
    umkmId: localStorage.getItem(UMKM_ID_KEY),
    productId: localStorage.getItem(PRODUCT_ID_KEY),
  };
}

/**
 * Ensure the authenticated demo account has a UMKM + Product in the backend.
 * Returns their real UUIDs (also cached in localStorage), or null if live mode
 * is off / the backend is unreachable.
 */
export async function ensureUmkmAndProduct(
  profile: OnboardingProfile,
): Promise<{ umkmId: string; productId: string } | null> {
  if (!isLive()) return null;
  try {
    // ── UMKM (get-or-create) ──────────────────────────────────────────────
    let umkm: UmkmResponse | null = null;
    try {
      umkm = await apiGet<UmkmResponse>("/umkm/me");
    } catch (e) {
      const status = (e as { status?: number }).status;
      if (status && status !== 404) throw e; // 404 = not created yet
    }

    if (!umkm) {
      const nib = (profile.nib || "").replace(/[^0-9]/g, "");
      if (nib.length !== 13) {
        // Backend requires exactly 13 digits; fall back to demo flow.
        console.warn("ensureUmkmAndProduct: NIB is not 13 digits, skipping backend persistence");
        return null;
      }
      umkm = await apiPost<UmkmResponse>("/umkm", {
        legalName: profile.companyName || "TradeConnect Demo UMKM",
        nib,
        description: profile.productDesc?.slice(0, 500) || undefined,
      });
    }
    if (typeof window !== "undefined") localStorage.setItem(UMKM_ID_KEY, umkm.id);

    // ── Product (get-or-create) ───────────────────────────────────────────
    let product: ProductResponse | null = null;
    try {
      const products = await apiGet<ProductResponse[]>(`/umkm/${umkm.id}/products`);
      if (Array.isArray(products) && products.length > 0) product = products[0];
    } catch {
      // ignore — will create below
    }

    if (!product) {
      const description =
        (profile.productDesc && profile.productDesc.length >= 10
          ? profile.productDesc
          : `${profile.productName} — produk ekspor unggulan.`).slice(0, 5000);
      product = await apiPost<ProductResponse>(`/umkm/${umkm.id}/products`, {
        name: profile.productName || "Produk Ekspor",
        description,
        moq: parseIntLoose(profile.moq, 1000),
        monthlyCapacity: parseIntLoose(profile.capacity, 10000),
        priceMin: Number(profile.floorPriceUsd) || 1,
        priceMax: Number(profile.askingPriceUsd) || Number(profile.floorPriceUsd) || 2,
        hpp: Number(profile.floorPriceUsd) || 1,
      });
    }
    if (typeof window !== "undefined") localStorage.setItem(PRODUCT_ID_KEY, product.id);

    return { umkmId: umkm.id, productId: product.id };
  } catch (e) {
    console.warn("ensureUmkmAndProduct failed, keeping localStorage flow:", e);
    return null;
  }
}

/** Fetch the authenticated user's UMKM profile (E4 GET /umkm/me). */
export async function getMyUmkm(): Promise<UmkmResponse | null> {
  if (!isLive()) return null;
  try {
    return await apiGet<UmkmResponse>("/umkm/me");
  } catch {
    return null; // 404 = not created yet
  }
}

/** Update the UMKM profile (M12 PATCH /umkm/:id). */
export async function updateUmkm(
  umkmId: string,
  patch: { legalName?: string; description?: string },
): Promise<UmkmResponse | null> {
  if (!isLive()) return null;
  try {
    return await apiPatch<UmkmResponse>(`/umkm/${umkmId}`, patch);
  } catch (e) {
    console.warn("updateUmkm failed:", e);
    return null;
  }
}

/** Update a product (M12 PATCH /umkm/:umkmId/products/:productId). */
export async function updateProduct(
  umkmId: string,
  productId: string,
  patch: { name?: string; description?: string; moq?: number; monthlyCapacity?: number; priceMin?: number; priceMax?: number },
): Promise<ProductResponse | null> {
  if (!isLive()) return null;
  try {
    return await apiPatch<ProductResponse>(`/umkm/${umkmId}/products/${productId}`, patch);
  } catch (e) {
    console.warn("updateProduct failed:", e);
    return null;
  }
}

export interface ReadinessScore {
  umkmId: string;
  score: number;
  level: "ready" | "partial" | "not_ready";
  breakdown: { label: string; value: number; weight: number }[];
}

/** Composite export-readiness score (M2 GET /umkm/:umkmId/readiness). */
export async function getReadiness(umkmId: string): Promise<ReadinessScore | null> {
  if (!isLive()) return null;
  try {
    return await apiGet<ReadinessScore>(`/umkm/${umkmId}/readiness`);
  } catch (e) {
    console.warn("getReadiness failed:", e);
    return null;
  }
}

// ── Verification helpers (live) ──────────────────────────────────────────────

export interface NibVerification {
  nib: string;
  is_valid: boolean;
  business_name?: string;
  kbli?: string;
  kbli_description?: string;
  business_scale?: string;
  compliance_status?: string;
  sandbox_mode?: boolean;
  [key: string]: unknown;
}

export async function verifyNib(nib: string): Promise<NibVerification | null> {
  if (!isLive()) return null;
  try {
    return await apiPost<NibVerification>("/verify-nib", {
      nib: (nib || "").replace(/[^0-9]/g, ""),
    });
  } catch (e) {
    console.warn("verifyNib failed:", e);
    return null;
  }
}

export interface HsCandidate {
  hs_code: string;
  description?: string;
  confidence?: number;
  category?: string;
}

export interface HsClassification {
  hs_code: string;
  confidence?: number;
  description?: string;
  category?: string;
  /** Ranked semantic candidates (RAG top-k) — the HS codes relevant to the product. */
  top_k?: HsCandidate[];
  [key: string]: unknown;
}

/**
 * Read the product's PERSISTED HS classification from the backend. The HS code +
 * ranked candidates are produced and stored by the Product Initialization Workflow
 * (hs_classification stage) — the frontend never classifies client-side. Returns
 * an HsClassification-shaped view (or null if not yet classified).
 */
export async function getProductClassification(): Promise<HsClassification | null> {
  if (!isLive()) return null;
  try {
    const { umkmId, productId } = getStoredIds();
    const uid = umkmId ?? (await getMyUmkm())?.id ?? null;
    if (!uid) return null;
    const products = await apiGet<Array<Record<string, unknown>>>(`/umkm/${uid}/products`).catch(() => []);
    const p = (productId ? products.find((x) => x.id === productId) : products[0]) ?? products[0];
    if (!p) return null;
    const candidates: HsCandidate[] = Array.isArray(p.hsCandidates) ? (p.hsCandidates as HsCandidate[]) : [];
    const hsCode = (p.hsCode as string) || candidates[0]?.hs_code || "";
    if (!hsCode && candidates.length === 0) return null; // not classified yet
    return {
      hs_code: hsCode,
      confidence: p.hsConfidence != null ? Number(p.hsConfidence) : candidates[0]?.confidence,
      description: candidates[0]?.description,
      category: candidates[0]?.category,
      top_k: candidates,
    };
  } catch (e) {
    console.warn("getProductClassification failed:", e);
    return null;
  }
}
