import { apiGet, apiPatch, apiPost, isLive } from "./http";
import { getStoredIds } from "./entities";

// ── Deal lifecycle sub-resources (messages, purchase order, compliance) ──────
export type MessageSender = "umkm" | "buyer" | "system";
export interface DealMessage {
  id: string;
  dealId?: string;
  sender: MessageSender;
  text: string;
  intent?: string | null;
  meta?: Record<string, unknown> | null;
  createdAt: string;
}

export interface BuyerReplyContext {
  sellerPrice?: number;
  floorPrice?: number;
  benchmarkUnitValue?: number;
  productName?: string;
  hsCode?: string;
}

export interface BuyerReplyResult {
  message: DealMessage;
  accept: boolean;
  agreedPrice: number | null;
  proposedPrice: number | null;
  intent: string;
  dealStatus: DealStatus;
}

export interface PurchaseOrder {
  id: string;
  dealId: string;
  poNumber: string;
  productId: string | null;
  productName: string | null;
  buyerName: string | null;
  buyerCountry: string | null;
  incoterm: string;
  unitPrice: string;
  qty: number;
  currency: string;
  subtotal: string;
  paymentTerms: string;
  status: "draft" | "sent" | "signed";
  signedBy: string | null;
  signature: string | null;
  signedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export type ComplianceStatus = "pass" | "warn" | "fail";
export interface ComplianceCheck {
  id: string;
  dealId: string;
  kind: "nib" | "fraud_scan" | "document";
  label: string;
  status: ComplianceStatus;
  detail?: Record<string, unknown> | null;
  createdAt: string;
}
export interface ComplianceResult {
  checks: ComplianceCheck[];
  overall: ComplianceStatus;
}

/** Messages of a deal, oldest first. */
export async function getMessages(dealId: string): Promise<DealMessage[]> {
  if (!isLive()) return [];
  try {
    const res = await apiGet<{ items: DealMessage[] }>(`/deals/${dealId}/messages`);
    return res.items ?? [];
  } catch (e) {
    console.warn("getMessages failed:", e);
    return [];
  }
}

/** Append the UMKM's message to the thread. */
export async function sendMessage(dealId: string, text: string, intent?: string): Promise<DealMessage | null> {
  if (!isLive()) return null;
  try {
    return await apiPost<DealMessage>(`/deals/${dealId}/messages`, { text, intent });
  } catch (e) {
    console.warn("sendMessage failed:", e);
    return null;
  }
}

/** Generate + persist the AI-simulated buyer reply (converges to a real price). */
export async function requestBuyerReply(dealId: string, ctx: BuyerReplyContext): Promise<BuyerReplyResult | null> {
  if (!isLive()) return null;
  try {
    return await apiPost<BuyerReplyResult>(`/deals/${dealId}/messages/buyer-reply`, ctx);
  } catch (e) {
    console.warn("requestBuyerReply failed:", e);
    return null;
  }
}

export async function generatePurchaseOrder(dealId: string): Promise<PurchaseOrder | null> {
  if (!isLive()) return null;
  try {
    return await apiPost<PurchaseOrder>(`/deals/${dealId}/purchase-order`, {});
  } catch (e) {
    console.warn("generatePurchaseOrder failed:", e);
    return null;
  }
}

export async function getPurchaseOrder(dealId: string): Promise<PurchaseOrder | null> {
  if (!isLive()) return null;
  try {
    return await apiGet<PurchaseOrder>(`/deals/${dealId}/purchase-order`);
  } catch {
    return null; // 404 = not generated yet
  }
}

export async function sendPurchaseOrder(dealId: string): Promise<PurchaseOrder | null> {
  if (!isLive()) return null;
  try {
    return await apiPost<PurchaseOrder>(`/deals/${dealId}/purchase-order/send`, {});
  } catch (e) {
    console.warn("sendPurchaseOrder failed:", e);
    return null;
  }
}

export async function signPurchaseOrder(dealId: string, signedBy: string, signature?: string): Promise<PurchaseOrder | null> {
  if (!isLive()) return null;
  try {
    return await apiPost<PurchaseOrder>(`/deals/${dealId}/purchase-order/sign`, { signedBy, signature });
  } catch (e) {
    console.warn("signPurchaseOrder failed:", e);
    return null;
  }
}

export async function runCompliance(dealId: string): Promise<ComplianceResult | null> {
  if (!isLive()) return null;
  try {
    return await apiPost<ComplianceResult>(`/deals/${dealId}/compliance/run`, {});
  } catch (e) {
    console.warn("runCompliance failed:", e);
    return null;
  }
}

export async function getCompliance(dealId: string): Promise<ComplianceResult | null> {
  if (!isLive()) return null;
  try {
    return await apiGet<ComplianceResult>(`/deals/${dealId}/compliance`);
  } catch (e) {
    console.warn("getCompliance failed:", e);
    return null;
  }
}

/** The active deal id cached when a deal is created (Buyer Discovery → negotiation). */
export function getActiveDealId(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("tradeconnect_active_deal_id");
}

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
