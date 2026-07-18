import { apiGet, apiPatch, apiPost, isLive } from "./http";
import { getStoredIds } from "./entities";

export type DealStatus =
  | "contacted"
  | "negotiating"
  | "compliance"
  | "po_sent"
  | "po_signed"
  | "closed";

export interface Deal {
  id: string;
  umkmId: string;
  productId: string | null;
  buyerId: string | null;
  buyerName: string | null;
  buyerCountry: string | null;
  status: DealStatus;
  agreedPrice: string | null;
  lastMessage: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface DealList {
  items: Deal[];
  total: number;
  page: number;
  pageSize: number;
}

export interface CreateDealInput {
  buyerName: string;
  buyerCountry?: string;
  status?: DealStatus;
  agreedPrice?: number;
  lastMessage?: string;
  productId?: string;
  buyerId?: string;
}

const DEAL_ID_KEY = "tradeconnect_active_deal_id";

export async function createDeal(input: CreateDealInput): Promise<Deal | null> {
  if (!isLive()) return null;
  try {
    const productId = input.productId ?? getStoredIds().productId ?? undefined;
    const deal = await apiPost<Deal>("/deals", { ...input, productId });
    if (typeof window !== "undefined" && deal?.id) localStorage.setItem(DEAL_ID_KEY, deal.id);
    return deal;
  } catch (e) {
    console.warn("createDeal failed:", e);
    return null;
  }
}

export async function listDeals(status?: DealStatus): Promise<DealList | null> {
  if (!isLive()) return null;
  try {
    const qs = new URLSearchParams({ page: "1", pageSize: "20" });
    if (status) qs.set("status", status);
    return await apiGet<DealList>(`/deals?${qs.toString()}`);
  } catch (e) {
    console.warn("listDeals failed:", e);
    return null;
  }
}

/**
 * Update the active deal's status/price. Uses the cached active-deal id; if none
 * exists it looks up the most recent open deal. Best-effort.
 */
export async function updateActiveDeal(patch: {
  status?: DealStatus;
  agreedPrice?: number;
  lastMessage?: string;
}): Promise<Deal | null> {
  if (!isLive()) return null;
  try {
    let id = typeof window !== "undefined" ? localStorage.getItem(DEAL_ID_KEY) : null;
    if (!id) {
      const list = await listDeals();
      id = list?.items?.[0]?.id ?? null;
    }
    if (!id) return null;
    return await apiPatch<Deal>(`/deals/${id}`, patch);
  } catch (e) {
    console.warn("updateActiveDeal failed:", e);
    return null;
  }
}
