import { apiPost, isLive } from "./http";
import { fetchProductView } from "./product-view";
import { getBuyerStats, getDealAnalytics, getTopMarkets } from "./api";

export interface ChatMsg {
  role: "user" | "assistant";
  content: string;
}

// Mirrors the backend BusinessContext (snake_case) — real data grounding the AI.
export interface AiBusinessContext {
  product_name?: string;
  hs_code?: string;
  hs_category?: string;
  company?: string;
  floor_price_usd?: number;
  asking_price_usd?: number;
  top_markets?: string[];
  buyer_total?: number;
  buyer_verified?: number;
  deals_total?: number;
  deals_active?: number;
  readiness_score?: number;
}

export interface ChatSource {
  title: string;
  category: string;
}
export interface ChatResult {
  reply: string;
  sources: ChatSource[];
  grounded: boolean;
}

export async function chatAI(
  messages: ChatMsg[],
  context?: AiBusinessContext,
): Promise<ChatResult | null> {
  if (!isLive()) return null;
  try {
    return await apiPost<ChatResult>("/ai/chat", { messages, context }, { timeoutMs: 60_000 });
  } catch (e) {
    console.warn("chatAI failed:", e);
    return null;
  }
}

/** Assemble the AI grounding context from the user's REAL persisted/backend data. */
export async function gatherContext(): Promise<AiBusinessContext> {
  const ctx: AiBusinessContext = {};
  if (typeof window !== "undefined") {
    const p = await fetchProductView();
    if (p.name) ctx.product_name = p.name;
    if (p.hsCode) ctx.hs_code = p.hsCode;
    if (p.hsCategory) ctx.hs_category = p.hsCategory;
    if (p.companyName) ctx.company = p.companyName;
    if (p.floorPriceUsd != null) ctx.floor_price_usd = p.floorPriceUsd;
    if (p.askingPriceUsd != null) ctx.asking_price_usd = p.askingPriceUsd;
    const rs = localStorage.getItem("tradeconnect_verified_score");
    if (rs) {
      const n = parseInt(rs, 10);
      if (Number.isFinite(n)) ctx.readiness_score = n;
    }
    const hs = p.hsCode || p.hsCandidates?.[0]?.hs_code;
    if (hs) {
      const m = await getTopMarkets(hs);
      if (m) {
        ctx.top_markets = m
          .filter((x) => x.tradeValueUsd != null)
          .sort((a, b) => (b.tradeValueUsd ?? 0) - (a.tradeValueUsd ?? 0))
          .slice(0, 5)
          .map((x) => x.partner);
      }
    }
  }
  const [stats, deals] = await Promise.all([getBuyerStats(), getDealAnalytics()]);
  if (stats) {
    ctx.buyer_total = stats.total;
    ctx.buyer_verified = stats.real;
  }
  if (deals) {
    ctx.deals_total = deals.total;
    ctx.deals_active = deals.open;
  }
  return ctx;
}

// ── Conversation persistence (per-browser, real user history) ────────────────
export interface Conversation {
  id: string;
  title: string;
  messages: ChatMsg[];
  createdAt: number;
  updatedAt: number;
}

const KEY = "tradeconnect_ai_conversations";

export function listConversations(): Conversation[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    const arr = raw ? (JSON.parse(raw) as Conversation[]) : [];
    return arr.sort((a, b) => b.updatedAt - a.updatedAt);
  } catch {
    return [];
  }
}

export function saveConversation(c: Conversation): void {
  if (typeof window === "undefined") return;
  const all = listConversations().filter((x) => x.id !== c.id);
  all.unshift(c);
  localStorage.setItem(KEY, JSON.stringify(all.slice(0, 50)));
}

export function deleteConversation(id: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(listConversations().filter((x) => x.id !== id)));
}

export function newConversation(): Conversation {
  const now = Date.now();
  return { id: `conv-${now}-${Math.random().toString(36).slice(2, 7)}`, title: "Percakapan Baru", messages: [], createdAt: now, updatedAt: now };
}

export function deriveTitle(messages: ChatMsg[]): string {
  const first = messages.find((m) => m.role === "user")?.content ?? "";
  return first.length > 42 ? `${first.slice(0, 42)}…` : first || "Percakapan Baru";
}

export const STARTER_PROMPTS = [
  "Negara mana yang paling potensial untuk produk saya dan mengapa?",
  "Bagaimana strategi negosiasi harga CIF untuk pembeli Eropa?",
  "Apa saja dokumen ekspor yang wajib saya siapkan?",
  "Apakah kode HS produk saya sudah tepat? Jelaskan implikasinya.",
  "Bagaimana cara meningkatkan skor kesiapan ekspor saya?",
];
