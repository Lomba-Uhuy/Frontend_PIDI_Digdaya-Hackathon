import { getMyUmkm, getStoredIds, type UmkmResponse, type HsCandidate } from "./entities";
import { apiGet } from "./http";

// ── Single source of truth for the user's product, sourced from the backend ────
// Replaces the old localStorage `Product` model. Business fields come from the
// backend product/umkm; the HS classification is whatever the Product
// Initialization Workflow persisted. Nothing here is client-owned or fabricated.

export interface ProductView {
  id: string | null;
  name: string;
  description: string;
  productType: string; // derived from the product name (demo content only)
  companyName: string;
  nib: string;
  hsCode: string;
  hsConfidence: number | null;
  hsCategory: string;
  hsCandidates: HsCandidate[];
  floorPriceUsd: number | null;
  askingPriceUsd: number | null;
  moq: string;
  capacity: string;
  /** Unique 2-digit HS chapters from the candidates, most-relevant first. */
  relevantChapters: () => string[];
}

function deriveProductType(name: string): string {
  const n = (name || "").toLowerCase();
  if (n.includes("rotan") || n.includes("rattan") || n.includes("kursi")) return "rattan";
  if (n.includes("kopi") || n.includes("coffee")) return "coffee";
  return ""; // unknown — never silently assume coffee
}

function chaptersOf(cands: HsCandidate[]): string[] {
  const seen: string[] = [];
  for (const c of cands) {
    const ch = (c.hs_code || "").replace(/\D/g, "").slice(0, 2);
    if (ch && !seen.includes(ch)) seen.push(ch);
  }
  return seen;
}

export const EMPTY_PRODUCT_VIEW: ProductView = {
  id: null,
  name: "",
  description: "",
  productType: "",
  companyName: "",
  nib: "",
  hsCode: "",
  hsConfidence: null,
  hsCategory: "",
  hsCandidates: [],
  floorPriceUsd: null,
  askingPriceUsd: null,
  moq: "",
  capacity: "",
  relevantChapters: () => [],
};

/** Build a ProductView from already-loaded backend company + product objects (sync). */
export function buildProductView(
  company: UmkmResponse | null,
  product: Record<string, unknown> | null,
): ProductView {
  if (!product && !company) return EMPTY_PRODUCT_VIEW;
  const cands: HsCandidate[] = Array.isArray(product?.hsCandidates)
    ? (product!.hsCandidates as HsCandidate[])
    : [];
  const name = (product?.name as string) ?? "";
  return {
    id: (product?.id as string) ?? null,
    name,
    description: (product?.description as string) ?? "",
    productType: deriveProductType(name),
    companyName: (company?.legalName as string) ?? "",
    nib: (company?.nib as string) ?? "",
    hsCode: (product?.hsCode as string) || cands[0]?.hs_code || "",
    hsConfidence:
      product?.hsConfidence != null ? Number(product.hsConfidence) : cands[0]?.confidence ?? null,
    hsCategory: cands[0]?.category ?? "",
    hsCandidates: cands,
    floorPriceUsd: product?.priceMin != null ? Number(product.priceMin) : null,
    askingPriceUsd: product?.priceMax != null ? Number(product.priceMax) : null,
    moq: product?.moq != null ? String(product.moq) : "",
    capacity: product?.monthlyCapacity != null ? String(product.monthlyCapacity) : "",
    relevantChapters: () => chaptersOf(cands),
  };
}

/**
 * Fetch the backend company + product and build the view. For libs and screens
 * OUTSIDE the AppDataProvider (onboarding, verification, dashboard layout).
 */
export async function fetchProductView(): Promise<ProductView> {
  const company = await getMyUmkm().catch(() => null);
  const umkmId = company?.id ?? getStoredIds().umkmId;
  let product: Record<string, unknown> | null = null;
  if (umkmId) {
    const list = await apiGet<Array<Record<string, unknown>>>(`/umkm/${umkmId}/products`).catch(
      () => [] as Array<Record<string, unknown>>,
    );
    const pid = getStoredIds().productId;
    product = (pid ? list.find((x) => x.id === pid) : list[0]) ?? list[0] ?? null;
  }
  return buildProductView(company, product);
}
