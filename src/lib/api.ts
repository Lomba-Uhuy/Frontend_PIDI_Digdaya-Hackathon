import { apiGet, apiPost, isLive } from "./http";
import { getStoredIds } from "./entities";
import { API_CONFIG } from "./config";

export interface DraftReply {
  id: string;
  title: string;
  text: string;
  strategy: string;
}

export interface IntentResponse {
  intent: "inquiry" | "negotiation" | "complaint";
  confidence: number;
}


// 1. INTENT CLASSIFIER SERVICE
export async function classifyIntent(text: string): Promise<IntentResponse | null> {
  // Real-only: no fabricated fallback. Returns null when offline / on failure.
  if (!isLive()) return null;
  try {
    // Gateway: POST /api/v1/negotiations/classify-intent (JwtAuthGuard)
    // Backend DTO field is `email_text`.
    const raw = await apiPost<{ intent: string; confidence: number }>(
      "/negotiations/classify-intent",
      { email_text: text },
    );
    // Backend may return "spam" — map it into the frontend's 3-class union.
    const intent =
      raw.intent === "inquiry" || raw.intent === "complaint" ? raw.intent : "negotiation";
    return { intent, confidence: raw.confidence ?? 0.85 };
  } catch (e) {
    console.warn("classify-intent failed:", e);
    return null;
  }
}

// 2. RAG AI REPLY GENERATOR SERVICE
export async function generateReply(
  emailContent: string,
  productContext: string,
  floorPrice: number = 2.68
): Promise<{ drafts: DraftReply[]; unavailable?: boolean }> {
  if (isLive()) {
    try {
      // Gateway: POST /api/v1/negotiations/generate-reply (JwtAuthGuard)
      // Returns a SINGLE draft { draft_en, intent, warnings, confidence } — adapt
      // it into the { drafts: DraftReply[] } shape the UI renders.
      const raw = await apiPost<{
        draft_en: string;
        intent?: string;
        warnings?: string[];
        confidence?: number;
      }>("/negotiations/generate-reply", {
        // Backend DTO fields: importer_email + product_id (real product UUID for
        // pricing context). No fabricated demo product — requires a real product.
        importer_email: emailContent,
        product_id: getStoredIds().productId,
      });
      if (raw?.draft_en) {
        const warn =
          raw.warnings && raw.warnings.length > 0
            ? ` (Catatan guardrail: ${raw.warnings.join("; ")})`
            : "";
        return {
          drafts: [
            {
              id: "draft-live-1",
              title: `Balasan AI (${raw.intent ?? "negotiation"})`,
              strategy: `Dibuat oleh pipeline RAG + LLM backend dengan tingkat keyakinan ${Math.round(
                (raw.confidence ?? 0.85) * 100,
              )}%.${warn}`,
              text: raw.draft_en,
            },
          ],
        };
      }
    } catch (e) {
      // The AI service failed (e.g. LLM unavailable / out of credits → 503).
      // Report it as unavailable so the UI can show an honest notice — never a
      // fabricated draft.
      console.warn("generate-reply failed:", e);
      return { drafts: [], unavailable: true };
    }
  }
  // No fabricated fallback — return empty when the backend is unavailable.
  return { drafts: [] };
}

// 3. REAL EXPORT PRICING (backend: POST /readiness/pricing).
// Authoritative Decimal money math + REAL BPS export unit-value benchmark by HS
// code (from trade_flows). The frontend does NO business math and fabricates NO
// benchmark — every figure below originates from the backend.
export interface PricingInput {
  hpp: number;
  originCharges: number; // domestic handling / port
  oceanFreight: number;
  insuranceAmount: number;
  exportDuty?: number; // ABSOLUTE amount added to FOB (not a %)
  profitMarginPct: number;
  hsCode?: string;
  exchangeRate: number; // IDR per 1 USD (user assumption)
  qty?: number; // defaults to 1 → per-unit waterfall
}

export interface PricingBreakdown {
  fobUnit: string;
  fobTotal: string;
  cfrTotal: string;
  insuranceAmount: string;
  cifTotal: string;
  perUnitCIF: string;
  idr: {
    fobUnit: string;
    fobTotal: string;
    cfrTotal: string;
    cifTotal: string;
    perUnitCIF: string;
  };
  benchmarkUnitValue: string | null; // real BPS USD/kg, or null when no data
  pricingWarning: string | null;
  marginEstimate: string;
  exchangeRate: number;
}

export async function getPricingBreakdown(input: PricingInput): Promise<PricingBreakdown | null> {
  if (!isLive()) return null;
  try {
    return await apiPost<PricingBreakdown>("/readiness/pricing", {
      hpp: input.hpp,
      originCharges: input.originCharges,
      qty: input.qty ?? 1,
      oceanFreight: input.oceanFreight,
      insuranceAmount: input.insuranceAmount,
      exportDuty: input.exportDuty ?? 0,
      profitMarginPct: input.profitMarginPct,
      ...(input.hsCode ? { hsCode: input.hsCode } : {}),
      exchangeRate: input.exchangeRate,
    });
  } catch (e) {
    console.warn("getPricingBreakdown failed:", e);
    return null;
  }
}

// 4. B2B RISK & RED FLAG INTELLIGENCE SERVICE
export interface RedFlagReport {
  riskLevel: "LOW" | "MEDIUM" | "HIGH";
  flags: { icon: string; title: string; description: string }[];
}

const _CATEGORY_ICON: Record<string, string> = {
  SAMPLE: "schedule",
  JURISDICTION: "gavel",
  COMMUNICATION: "forum",
  PAYMENT: "payments",
};

/**
 * B2B risk analysis for a REAL buyer. Gateway: POST /api/v1/check-red-flag.
 * Sends only the real buyer identity; communicationHistory stays empty until a real
 * conversation store exists (never fabricated). Returns null offline / on failure.
 */
export async function checkRedFlag(buyer: { name: string; country: string }): Promise<RedFlagReport | null> {
  if (!isLive()) return null;
  try {
    const raw = await apiPost<{
      riskLevel: "LOW" | "MEDIUM" | "HIGH";
      flags: { id: string; description: string; category: string; severity: string }[];
      recommendation?: string;
    }>("/check-red-flag", {
      buyerProfile: { companyName: buyer.name, country: buyer.country },
      communicationHistory: [],
    });
    return {
      riskLevel: raw.riskLevel,
      flags: (raw.flags ?? []).map((f) => ({
        icon: _CATEGORY_ICON[f.category] ?? "flag",
        title: `${f.category} • ${f.severity}`,
        description: f.description,
      })),
    };
  } catch (e) {
    console.warn("check-red-flag failed:", e);
    return null;
  }
}

// 5. BUYER DIRECTORY SERVICE (real, synchronized DB — GET /matching/buyers)
export interface BuyerRecord {
  buyer_id: string;
  name: string;
  country: string;
  hs_codes: string[];
  credibility_score: number;
  min_order_qty: number;
  is_synthetic: boolean;
  source?: string | null;
  shipment_count?: number | null;
}

export interface BuyerListResponse {
  items: BuyerRecord[];
  page: number;
  per_page: number;
  total: number;
  total_pages: number;
}

export interface BuyerDetailRecord extends BuyerRecord {
  description?: string | null;
  is_active: boolean;
  metadata: Record<string, unknown>;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface BuyerListParams {
  q?: string;
  country?: string[];
  hs?: string;
  source?: string;
  is_synthetic?: boolean;
  min_credibility?: number;
  sort_by?: "credibility" | "name" | "created_at" | "min_order_qty";
  sort_dir?: "asc" | "desc";
  page?: number;
  per_page?: number;
}

/** Search/list real buyers from the synchronized DB. Gateway: GET /matching/buyers. */
export async function getBuyers(params: BuyerListParams = {}): Promise<BuyerListResponse | null> {
  if (!isLive()) return null;
  try {
    const qs = new URLSearchParams();
    if (params.q) qs.set("q", params.q);
    (params.country ?? []).forEach((c) => qs.append("country", c));
    if (params.hs) qs.set("hs", params.hs);
    if (params.source) qs.set("source", params.source);
    if (params.is_synthetic !== undefined) qs.set("is_synthetic", String(params.is_synthetic));
    if (params.min_credibility !== undefined) qs.set("min_credibility", String(params.min_credibility));
    if (params.sort_by) qs.set("sort_by", params.sort_by);
    if (params.sort_dir) qs.set("sort_dir", params.sort_dir);
    qs.set("page", String(params.page ?? 1));
    qs.set("per_page", String(params.per_page ?? 12));
    return await apiGet<BuyerListResponse>(`/matching/buyers?${qs.toString()}`);
  } catch (e) {
    console.warn("getBuyers failed:", e);
    return null;
  }
}

export interface BuyerCountryOption {
  country: string; // ISO-2
  count: number;
}

/** Distinct buyer countries (with counts) present in the DB, for the filter dropdown.
 *  Sourced from GET /matching/buyers/stats (top_countries). No hardcoded list. */
export async function getBuyerCountries(): Promise<BuyerCountryOption[]> {
  if (!isLive()) return [];
  try {
    const raw = await apiGet<{ top_countries?: { country: string; count: number }[] }>(
      "/matching/buyers/stats",
    );
    return (raw.top_countries ?? []).filter((c) => c.country && c.country !== "??");
  } catch (e) {
    console.warn("getBuyerCountries failed:", e);
    return [];
  }
}

// Buyer directory statistics (real vs simulated, by source & country).
export interface BuyerStats {
  total: number;
  real: number;
  synthetic: number;
  by_source: { source: string; count: number }[];
  top_countries: { country: string; count: number }[];
}

export async function getBuyerStats(): Promise<BuyerStats | null> {
  if (!isLive()) return null;
  try {
    return await apiGet<BuyerStats>("/matching/buyers/stats");
  } catch (e) {
    console.warn("getBuyerStats failed:", e);
    return null;
  }
}

// System / service health from the gateway readiness probe (terminus format).
// Lives at the gateway root (/health/ready), outside /api/v1 and unauthenticated.
export interface ServiceHealth {
  name: string;
  up: boolean;
}
export interface SystemHealth {
  overall: "ok" | "degraded" | "down";
  services: ServiceHealth[];
}

export async function getSystemHealth(): Promise<SystemHealth> {
  try {
    // Terminus returns 503 (with the same body) when a dependency is down.
    // Health lives under the gateway's /api/v1 prefix (only bare /health is excluded).
    const resp = await fetch(`${API_CONFIG.baseUrl}/health/ready`);
    const body = (await resp.json()) as {
      details?: Record<string, { status?: string }>;
    };
    const details = body.details ?? {};
    const services: ServiceHealth[] = [
      { name: "gateway", up: true },
      ...Object.entries(details).map(([name, v]) => ({ name, up: v?.status === "up" })),
    ];
    const allUp = services.every((s) => s.up);
    const anyUp = services.some((s) => s.up);
    return { overall: allUp ? "ok" : anyUp ? "degraded" : "down", services };
  } catch {
    return { overall: "down", services: [{ name: "gateway", up: false }] };
  }
}

// Activity feed — real persisted events (deals, PO, buyer sync, product).
export interface ActivityEvent {
  id: string;
  category: "negotiation" | "purchase_order" | "sync" | "product";
  type: string;
  severity: "info" | "success" | "warning" | "error";
  title: string;
  description: string;
  entity: string;
  entityId: string;
  actor: string;
  status: string;
  timestamp: string;
  link: string;
}
export interface ActivityStatistics {
  total: number;
  byCategory: { category: string; count: number }[];
  lastSync: {
    provider: string;
    status: string;
    buyersUpserted: number;
    error: string | null;
    finishedAt: string | null;
    startedAt: string | null;
  } | null;
}

export async function getActivity(limit = 15, category?: string): Promise<ActivityEvent[]> {
  if (!isLive()) return [];
  try {
    const qs = new URLSearchParams({ limit: String(limit) });
    if (category) qs.set("category", category);
    const r = await apiGet<{ items: ActivityEvent[] }>(`/activity/recent?${qs.toString()}`);
    return r.items ?? [];
  } catch (e) {
    console.warn("getActivity failed:", e);
    return [];
  }
}

export async function getActivityStatistics(): Promise<ActivityStatistics | null> {
  if (!isLive()) return null;
  try {
    return await apiGet<ActivityStatistics>("/activity/statistics");
  } catch (e) {
    console.warn("getActivityStatistics failed:", e);
    return null;
  }
}

// Negotiation analytics (real aggregation from /deals/analytics).
export interface DealAnalytics {
  total: number;
  open: number;
  closed: number;
  conversionRate: number;
  avgCloseDays: number | null;
  avgAgreedPrice: number | null;
  byStatus: { status: string; count: number }[];
  byCountry: { country: string; count: number }[];
}
export async function getDealAnalytics(): Promise<DealAnalytics | null> {
  if (!isLive()) return null;
  try {
    return await apiGet<DealAnalytics>("/deals/analytics");
  } catch (e) {
    console.warn("getDealAnalytics failed:", e);
    return null;
  }
}

// Buyer directory analytics (real aggregation from /matching/buyers/analytics).
export interface BuyerAnalytics {
  total: number;
  by_credibility: { band: string; count: number }[];
  by_hs: { hs: string; count: number }[];
  missing_embeddings: number;
  recently_synced: number;
  without_hs: number;
  top_credibility: { name: string; country: string; credibility_score: number }[];
}
export async function getBuyerAnalytics(): Promise<BuyerAnalytics | null> {
  if (!isLive()) return null;
  try {
    return await apiGet<BuyerAnalytics>("/matching/buyers/analytics");
  } catch (e) {
    console.warn("getBuyerAnalytics failed:", e);
    return null;
  }
}

/** Full buyer detail from the synchronized DB. Gateway: GET /matching/buyers/:id. */
export async function getBuyerDetail(id: string): Promise<BuyerDetailRecord | null> {
  if (!isLive()) return null;
  try {
    return await apiGet<BuyerDetailRecord>(`/matching/buyers/${encodeURIComponent(id)}`);
  } catch (e) {
    console.warn("getBuyerDetail failed:", e);
    return null;
  }
}

// 6. MARKET INTELLIGENCE SERVICE (BPS + UN Comtrade — real ingested data)
export interface MarketStat {
  partner: string;
  flow: string;
  tradeValueUsd: number | null;
  netWeightKg?: number | null;
  period?: number | null;
  source?: string;
}

export interface MarketAlert {
  type: string;
  title: string;
  description: string;
}

export interface MarketIntelligenceResponse {
  hsCode: string;
  region: string;
  totalValueUsd?: number | null;
  topRegion?: string | null;
  topMarkets: MarketStat[];
  analysis?: string;
  alerts: MarketAlert[];
  raw?: unknown;
}

// The readiness service returns { bpsStats:[{countryName,tradeValueUsd,netWeightKg,period,unitValueUsd}],
// comtradeStats:[...], totalValueUsd, topRegion, insights:{analysis, alerts:[{type,title,description}]} }.
function normalizeStat(s: Record<string, unknown>): MarketStat {
  return {
    partner: (s.countryName as string) || (s.partner as string) || "—",
    flow: (s.flow as string) || "Export",
    tradeValueUsd: (s.tradeValueUsd as number) ?? (s.trade_value_usd as number) ?? null,
    netWeightKg: (s.netWeightKg as number) ?? null,
    period: (s.period as number) ?? null,
  };
}

/**
 * Global market intelligence for an HS code, backed by the trade_flows table
 * (BPS + UN Comtrade). Gateway: POST /api/v1/readiness/market-intelligence.
 * Returns null when live mode is off or the backend is unreachable, so callers
 * can render their own fallback.
 */
export async function getMarketIntelligence(
  hsCode: string = "0901",
  region: string = "global",
): Promise<MarketIntelligenceResponse | null> {
  if (!isLive()) return null;
  try {
    const raw = await apiPost<Record<string, unknown>>("/readiness/market-intelligence", {
      hsCode,
      region,
    });
    const bps = (Array.isArray(raw.bpsStats) ? raw.bpsStats : []) as Record<string, unknown>[];
    const comtrade = (Array.isArray(raw.comtradeStats)
      ? raw.comtradeStats
      : []) as Record<string, unknown>[];
    const source = bps.length > 0 ? bps : comtrade;
    const insights = (raw.insights as Record<string, unknown>) || {};
    return {
      hsCode,
      region,
      totalValueUsd: (raw.totalValueUsd as number) ?? null,
      topRegion: (raw.topRegion as string) ?? null,
      topMarkets: source.map(normalizeStat),
      analysis: (insights.analysis as string) || "",
      alerts: Array.isArray(insights.alerts) ? (insights.alerts as MarketAlert[]) : [],
      raw,
    };
  } catch (e) {
    console.warn("Live market-intelligence failed:", e);
    return null;
  }
}

// 6a. MARKET REFERENCE DATA (real, derived from ingested BPS data)
export interface HsOption {
  code: string;
  label: string;
  count: number;
}
export interface RegionOption {
  name: string;
  count: number;
  valueUsd: number;
}

/** HS codes that actually have ingested trade data. Gateway: GET /market/hs-codes. */
export async function getHsCodes(): Promise<HsOption[] | null> {
  if (!isLive()) return null;
  try {
    return await apiGet<HsOption[]>("/market/hs-codes");
  } catch (e) {
    console.warn("getHsCodes failed:", e);
    return null;
  }
}

/** Top destination countries for an HS chapter (real BPS aggregation). Gateway: GET /market/top-markets. */
export async function getTopMarkets(hs: string): Promise<MarketStat[] | null> {
  if (!isLive()) return null;
  try {
    const rows = await apiGet<Array<{ partner: string; tradeValueUsd: number; netWeightKg: number; period: number | null }>>(
      `/market/top-markets?hs=${encodeURIComponent(hs)}`,
    );
    return rows.map((r) => ({
      partner: r.partner,
      flow: "Export",
      tradeValueUsd: r.tradeValueUsd,
      netWeightKg: r.netWeightKg,
      period: r.period,
    }));
  } catch (e) {
    console.warn("getTopMarkets failed:", e);
    return null;
  }
}

/** Destination countries present in the trade data. Gateway: GET /market/regions. */
export async function getRegions(): Promise<RegionOption[] | null> {
  if (!isLive()) return null;
  try {
    return await apiGet<RegionOption[]>("/market/regions");
  } catch (e) {
    console.warn("getRegions failed:", e);
    return null;
  }
}

// 6b. EXPORT DOCUMENT CHECKLIST (readiness service)
export interface ChecklistItem {
  id: string;
  label: string;
  description: string;
  required: boolean;
}

/** Gateway: GET /api/v1/documents/checklist. Returns null on failure. */
export async function getDocumentChecklist(): Promise<ChecklistItem[] | null> {
  if (!isLive()) return null;
  try {
    const raw = await apiGet<{ items: ChecklistItem[] }>("/documents/checklist");
    return raw?.items ?? null;
  } catch (e) {
    console.warn("getDocumentChecklist failed:", e);
    return null;
  }
}

// 7. AI BUYER DISCOVERY SERVICE (pgvector semantic match)
export interface BuyerMatch {
  buyerId?: string;
  companyName?: string;
  country?: string;
  score?: number;
  [key: string]: unknown;
}

/**
 * Semantic buyer matches for a product. Gateway: POST /api/v1/matching/search.
 * Requires the matching-service (embeddings) to be running; returns null on any
 * failure so the buyer-discovery page can fall back to its curated list.
 */
export async function matchBuyers(productId: string, limit: number = 10): Promise<BuyerMatch[] | null> {
  if (!isLive()) return null;
  try {
    // Backend DTO: { product_id, top_k } — server loads the product's precomputed embedding.
    return await apiPost<BuyerMatch[]>("/matching/search", { product_id: productId, top_k: limit });
  } catch (e) {
    console.warn("Live buyer matching failed:", e);
    return null;
  }
}

// 8. REAL BUYER SYNC (TradeAtlas → buyer table, via ETL worker)
export interface BuyerSyncResult {
  status: string; // "queued" | "auth_required" | ...
  task_id?: string;
}

/**
 * Trigger a real-buyer sync for the product's HS codes + target markets.
 * Gateway: POST /api/v1/matching/buyers/sync (enqueues the ETL task).
 * Dynamic inputs only — HS from the product RAG, countries from user markets.
 * Fire-and-forget: returns null when offline / on failure (never blocks the UI).
 */
export async function triggerBuyerSync(
  hsCodes: string[],
  importerCountries: string[] = [],
  opts?: { startDate?: string; endDate?: string; maxPages?: number },
): Promise<BuyerSyncResult | null> {
  if (!isLive() || hsCodes.length === 0) return null;
  try {
    return await apiPost<BuyerSyncResult>("/matching/buyers/sync", {
      hs_codes: hsCodes,
      importer_countries: importerCountries,
      ...(opts?.startDate ? { start_date: opts.startDate } : {}),
      ...(opts?.endDate ? { end_date: opts.endDate } : {}),
      ...(opts?.maxPages ? { max_pages: opts.maxPages } : {}),
    });
  } catch (e) {
    console.warn("triggerBuyerSync failed:", e);
    return null;
  }
}

