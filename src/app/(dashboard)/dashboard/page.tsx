"use client";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { listDeals, Deal, DealStatus } from "../../../lib/deals";
import {
  matchBuyers,
  BuyerMatch,
  getTopMarkets,
  MarketStat,
  getBuyerStats,
  BuyerStats,
  getSystemHealth,
  SystemHealth,
  getActivity,
  ActivityEvent,
  getDealAnalytics,
  DealAnalytics,
  getBuyerAnalytics,
  BuyerAnalytics,
  getActivityStatistics,
  ActivityStatistics,
} from "../../../lib/api";
import { getStoredIds, getReadiness } from "../../../lib/entities";
import { computeCompleteness, Completeness } from "../../../lib/product-completeness";
import { useAppData, useProductView } from "../../../lib/app-data";
import { getWorkflowActivity } from "../../../lib/workflow";
import {
  Activity,
  ArrowRight,
  BadgeCheck,
  BarChart3,
  Boxes,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  FileText,
  Globe,
  Handshake,
  ListFilter,
  MessagesSquare,
  Package,
  Radar,
  RefreshCw,
  Send,
  Sparkles,
  TrendingUp,
  Truck,
  Users,
} from "lucide-react";
import { Avatar } from "../../../components/ui/avatar";
import { Badge } from "../../../components/ui/badge";
import { ProgressRing } from "../../../components/ui/progress-ring";

const fmtUsd = (v: number | null | undefined) =>
  v == null ? "—" : "$" + Math.round(v).toLocaleString("en-US");

const REGION_NAMES =
  typeof Intl !== "undefined" && "DisplayNames" in Intl
    ? new Intl.DisplayNames(["id"], { type: "region" })
    : null;
const regionName = (code: string): string => {
  try {
    return REGION_NAMES?.of(code) ?? code;
  } catch {
    return code;
  }
};

const ACTIVE_STATUSES: DealStatus[] = ["contacted", "negotiating", "compliance", "po_sent"];

const CATEGORY_ICON: Record<string, typeof Package> = {
  negotiation: MessagesSquare,
  purchase_order: FileText,
  sync: Truck,
  product: Package,
};
const SEV_DOT: Record<string, string> = {
  success: "bg-secondary",
  warning: "bg-warning",
  error: "bg-error",
  info: "bg-primary",
};

function relativeTime(iso: string): string {
  const then = new Date(iso).getTime();
  if (!Number.isFinite(then)) return "";
  const s = Math.max(0, Math.floor((Date.now() - then) / 1000));
  if (s < 60) return "baru saja";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m} mnt lalu`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} jam lalu`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d} hr lalu`;
  return new Date(iso).toLocaleDateString("id-ID");
}

const DEAL_STATUS_LABEL: Record<DealStatus, string> = {
  contacted: "Kontak Awal",
  negotiating: "Percakapan Aktif",
  compliance: "Pemeriksaan Kepatuhan",
  po_sent: "Menunggu Tanda Tangan Pembeli",
  po_signed: "Transaksi Selesai",
  closed: "Ditutup",
};

export default function DashboardPage() {
  const router = useRouter();
  // Centralized server-driven company + product (backend is the source of truth).
  const { company: backendCompany, product: backendProduct, productId: appProductId } = useAppData();

  // Backend-sourced product (single source of truth; replaces localStorage model).
  const product = useProductView();
  const [deals, setDeals] = useState<Deal[]>([]);
  const [dealsTotal, setDealsTotal] = useState(0);
  const [matches, setMatches] = useState<BuyerMatch[]>([]);
  const [buyerStats, setBuyerStats] = useState<BuyerStats | null>(null);
  const [markets, setMarkets] = useState<MarketStat[]>([]);
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [activity, setActivity] = useState<ActivityEvent[]>([]);
  const [activityLoading, setActivityLoading] = useState(true);
  const [activityPage, setActivityPage] = useState(1);
  const [dealPage, setDealPage] = useState(1);
  const [dealAnalytics, setDealAnalytics] = useState<DealAnalytics | null>(null);
  const [buyerAnalytics, setBuyerAnalytics] = useState<BuyerAnalytics | null>(null);
  const [activityStats, setActivityStats] = useState<ActivityStatistics | null>(null);
  const [completeness, setCompleteness] = useState<Completeness | null>(null);
  const [readinessScore, setReadinessScore] = useState<number | null>(null);
  const [readinessLevel, setReadinessLevel] = useState<string | null>(null);

  const loadActivity = () => {
    setActivityLoading(true);
    const pid = appProductId ?? getStoredIds().productId;
    Promise.all([
      getActivity(30),
      pid ? getWorkflowActivity(pid) : Promise.resolve([] as ActivityEvent[]),
    ]).then(([a, wf]) => {
      // Merge persisted deal/PO/sync activity with persisted workflow events,
      // newest first. Both sources are backend-owned — nothing is fabricated.
      const merged = [...a, ...wf].sort(
        (x, y) => new Date(y.timestamp).getTime() - new Date(x.timestamp).getTime(),
      );
      setActivity(merged);
      setActivityPage(1);
      setActivityLoading(false);
    });
  };

  // ── Product completeness + market lookup, from the backend-sourced view ──────
  useEffect(() => {
    setCompleteness(computeCompleteness(product));
    const hs = product.hsCode || product.hsCandidates?.[0]?.hs_code || "";
    if (hs) getTopMarkets(hs).then((m) => m && setMarkets(m));
  }, [product]);

  // ── Real backend aggregates ──────────────────────────────────────────────────
  useEffect(() => {
    listDeals().then((res) => {
      if (res) {
        setDeals(res.items);
        setDealsTotal(res.total);
      }
    });
    getBuyerStats().then((s) => s && setBuyerStats(s));
    getSystemHealth().then(setHealth);
    getDealAnalytics().then((a) => a && setDealAnalytics(a));
    getBuyerAnalytics().then((a) => a && setBuyerAnalytics(a));
    getActivityStatistics().then((s) => s && setActivityStats(s));
    loadActivity();
  }, []);

  // Top-3 AI buyer matches — keyed to the backend product id (authoritative), so
  // it fires once the product loads rather than depending on a localStorage cache.
  useEffect(() => {
    const pid = appProductId ?? getStoredIds().productId;
    if (pid) matchBuyers(pid, 3).then((m) => m && setMatches(m));
  }, [appProductId]);

  // ── Readiness: verified score (single source of truth) else backend ──────────
  useEffect(() => {
    const storedScore =
      typeof window !== "undefined" ? localStorage.getItem("tradeconnect_verified_score") : null;
    const storedLevel =
      typeof window !== "undefined" ? localStorage.getItem("tradeconnect_verified_level") : null;
    if (storedScore != null) {
      const n = parseInt(storedScore, 10);
      if (Number.isFinite(n)) setReadinessScore(n);
      if (storedLevel) setReadinessLevel(storedLevel);
      return;
    }
    const umkmId = getStoredIds().umkmId;
    if (!umkmId) return;
    getReadiness(umkmId).then((r) => {
      if (r) {
        setReadinessScore(r.score);
        setReadinessLevel(r.level);
      }
    });
  }, []);

  const activeCount = useMemo(() => deals.filter((d) => ACTIVE_STATUSES.includes(d.status)).length, [deals]);
  const closedCount = useMemo(() => deals.filter((d) => d.status === "po_signed").length, [deals]);

  // Top import markets (potential buyers) for the product's HS code, by value.
  const topMarkets = useMemo(
    () =>
      [...markets]
        .filter((m) => m.tradeValueUsd != null)
        .sort((a, b) => (b.tradeValueUsd ?? 0) - (a.tradeValueUsd ?? 0))
        .slice(0, 4),
    [markets],
  );

  const hsCandidates = product?.hsCandidates ?? [];
  const topHs = hsCandidates.slice(0, 3);

  // Client-side pagination — 5 items per page for negotiations + activity.
  const PAGE = 5;
  const dealTotalPages = Math.max(1, Math.ceil(deals.length / PAGE));
  const pagedDeals = deals.slice((dealPage - 1) * PAGE, dealPage * PAGE);
  const activityTotalPages = Math.max(1, Math.ceil(activity.length / PAGE));
  const pagedActivity = activity.slice((activityPage - 1) * PAGE, activityPage * PAGE);

  const displayMatches = matches.map((m) => ({
    company: (m.companyName as string) || (m.name as string) || "—",
    location: (m.country as string) || "—",
    matchScore: Math.round(((m.similarity_score as number) ?? (m.score as number) ?? 0) * 100),
    seeking:
      Array.isArray(m.hs_codes) && m.hs_codes.length > 0 ? `HS ${(m.hs_codes as string[]).join(", ")}` : "—",
    value: (m.min_order_qty as number) ? `MOQ ${(m.min_order_qty as number).toLocaleString("en-US")}` : "—",
    isSynthetic: Boolean(m.is_synthetic),
  }));

  return (
    <div className="h-full w-full overflow-y-auto p-4 md:p-8 bg-surface-bright">
      <div className="max-w-6xl mx-auto space-y-6 pb-12">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-3">
          <div>
            <h1 className="text-2xl font-bold text-on-surface font-heading">Ringkasan Ekspor</h1>
            <p className="text-sm text-on-surface-variant mt-1">
              Pusat komando ekspor Anda — produk, pembeli, negosiasi, dan intelijen pasar dalam satu tampilan.
            </p>
          </div>
          <SystemStatus health={health} />
        </div>

        {/* KPI strip — all from real backend aggregates */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <Kpi icon={Users} label="Total Pembeli" value={buyerStats ? buyerStats.total : null} />
          <Kpi icon={BadgeCheck} label="Terverifikasi" value={buyerStats ? buyerStats.real : null} tone="secondary" />
          <Kpi icon={Boxes} label="Data Simulasi" value={buyerStats ? buyerStats.synthetic : null} tone="muted" />
          <Kpi icon={Globe} label="Negara Terjangkau" value={buyerStats ? buyerStats.top_countries.length : null} />
          <Kpi icon={MessagesSquare} label="Negosiasi Aktif" value={deals.length ? activeCount : dealsTotal ? 0 : null} />
          <Kpi icon={Handshake} label="Transaksi Selesai" value={dealsTotal ? closedCount : null} tone="secondary" />
        </div>

        {/* Product summary + readiness */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-surface-container-lowest border border-outline-variant rounded-xl p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded bg-primary-fixed-dim text-primary flex items-center justify-center">
                <Package className="size-5" />
              </div>
              <h2 className="text-base font-semibold text-on-surface">Profil Produk</h2>
            </div>
            {product && product.name ? (
              <>
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-on-surface">{backendProduct?.name || product.name}</h3>
                    <p className="text-xs text-on-surface-variant mt-0.5">
                      {backendCompany?.legalName || product.companyName || "—"}
                      {(backendProduct?.hsCode || product.hsCode) ? ` • HS ${backendProduct?.hsCode || product.hsCode}` : ""}
                    </p>
                  </div>
                  <Badge variant={hsCandidates.length > 0 ? "success" : "neutral"} icon={hsCandidates.length > 0 ? CheckCircle2 : undefined}>
                    {hsCandidates.length > 0 ? "Terklasifikasi AI" : "Belum diklasifikasi"}
                  </Badge>
                </div>
                {product.description && (
                  <p className="text-sm text-on-surface-variant leading-relaxed mb-4 line-clamp-2">{product.description}</p>
                )}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <Field label="Kategori HS" value={product.hsCategory || "—"} />
                  <Field label="MOQ" value={product.moq || "—"} />
                  <Field label="Kapasitas/bln" value={product.capacity || "—"} />
                  <Field label="NIB" value={product.nib ? "Terdaftar" : "—"} />
                  <Field label="Harga Dasar" value={fmtUsd(product.floorPriceUsd)} />
                  <Field label="Harga Tawar" value={fmtUsd(product.askingPriceUsd)} />
                  <Field
                    label="Keyakinan HS"
                    value={product.hsConfidence != null ? `${Math.round(product.hsConfidence * 100)}%` : "—"}
                  />
                  <Field label="Embedding" value={getStoredIds().productId ? "Terindeks" : "Lokal"} />
                </div>

                {completeness && completeness.total > 0 && (
                  <div className="mt-4 pt-4 border-t border-outline-variant">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-bold text-on-surface">
                        Kelengkapan Profil ({completeness.done}/{completeness.total})
                      </span>
                      <span className="text-xs font-black text-primary">{completeness.percent}%</span>
                    </div>
                    <div className="h-2 bg-surface-container-high rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full transition-all"
                        style={{ width: `${completeness.percent}%` }}
                      />
                    </div>
                    {completeness.missing.length > 0 ? (
                      <>
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {completeness.missing.slice(0, 6).map((m) => (
                            <span
                              key={m.key}
                              className="text-[10px] font-medium text-on-tertiary-container bg-tertiary-container px-1.5 py-0.5 rounded"
                              title={m.hint}
                            >
                              {m.label}
                            </span>
                          ))}
                        </div>
                        {completeness.nextAction && (
                          <p className="text-[11px] text-on-surface-variant mt-2">
                            Berikutnya:{" "}
                            <span className="font-semibold text-on-surface">{completeness.nextAction.hint}</span>
                          </p>
                        )}
                      </>
                    ) : (
                      <p className="text-[11px] text-secondary font-semibold mt-2">Profil produk lengkap ✓</p>
                    )}
                  </div>
                )}
              </>
            ) : (
              <div className="text-sm text-on-surface-variant border border-dashed border-outline-variant rounded-lg p-6 text-center">
                Belum ada produk. Selesaikan onboarding untuk menganalisis produk ekspor Anda.
              </div>
            )}
          </div>

          {/* Readiness — real score only, no fabricated fallback */}
          <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6 shadow-sm flex flex-col items-center justify-center text-center">
            <h2 className="text-sm font-bold text-on-surface mb-1">Skor Kesiapan</h2>
            <p className="text-[10px] text-on-surface-variant font-bold uppercase tracking-widest mb-6">Kesiapan Ekspor</p>
            {readinessScore != null ? (
              <>
                <ProgressRing value={readinessScore} size={112} strokeWidth={12} className="mb-4" />
                <Badge variant={readinessLevel === "not_ready" ? "warning" : "success"} size="md" icon={CheckCircle2}>
                  {readinessLevel === "ready"
                    ? "Siap Ekspor"
                    : readinessLevel === "partial"
                      ? "Hampir Siap"
                      : readinessLevel === "not_ready"
                        ? "Perlu Dilengkapi"
                        : "Terverifikasi"}
                </Badge>
              </>
            ) : (
              <div className="text-xs text-on-surface-variant py-8">
                Belum ada skor kesiapan.
                <button onClick={() => router.push("/verification")} className="block mx-auto mt-2 text-primary font-semibold underline">
                  Jalankan verifikasi
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Product intelligence — HS classification + recommended markets (real) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="size-5 text-secondary" />
              <h2 className="text-base font-semibold text-on-surface">Klasifikasi HS (AI/RAG)</h2>
            </div>
            {topHs.length > 0 ? (
              <div className="space-y-3">
                {topHs.map((c) => (
                  <div key={c.hs_code} className="flex items-center gap-3">
                    <span className="font-mono text-xs font-bold text-primary w-16 shrink-0">HS {c.hs_code}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-on-surface truncate" title={c.description}>{c.description || "—"}</p>
                      <div className="h-1.5 bg-surface-container-high rounded-full mt-1 overflow-hidden">
                        <div className="h-full bg-secondary rounded-full" style={{ width: `${Math.round((c.confidence ?? 0) * 100)}%` }} />
                      </div>
                    </div>
                    <span className="text-[11px] font-mono font-bold text-on-surface-variant w-10 text-right">
                      {Math.round((c.confidence ?? 0) * 100)}%
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-on-surface-variant">Belum ada klasifikasi HS. Verifikasi produk untuk menjalankan RAG classifier.</p>
            )}
          </div>

          <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="size-5 text-primary" />
                <h2 className="text-base font-semibold text-on-surface">Pasar Impor Teratas</h2>
              </div>
              <button onClick={() => router.push("/market-intelligence")} className="text-[11px] font-semibold text-primary hover:underline flex items-center gap-1">
                Intelijen Pasar <ArrowRight className="size-3" />
              </button>
            </div>
            {topMarkets.length > 0 ? (
              <div className="space-y-2.5">
                {topMarkets.map((m, i) => (
                  <div key={`${m.partner}-${i}`} className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2 text-on-surface">
                      <Globe className="size-3.5 text-on-surface-variant" /> {regionName(m.partner)}
                    </span>
                    <span className="font-mono font-semibold text-on-surface">{fmtUsd(m.tradeValueUsd)}</span>
                  </div>
                ))}
                <p className="text-[10px] text-on-surface-variant pt-1">Sumber: BPS / UN Comtrade (nilai perdagangan)</p>
              </div>
            ) : (
              <p className="text-sm text-on-surface-variant">
                {product?.hsCode ? "Data pasar untuk HS ini belum tersinkron." : "Belum ada HS produk untuk mencari pasar."}
              </p>
            )}
          </div>
        </div>

        {/* Analytics — real aggregation (deals + buyers) */}
        {(dealAnalytics || buyerAnalytics) && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <BarChart3 className="size-5 text-primary" />
                <h2 className="text-base font-semibold text-on-surface">Analitik Negosiasi</h2>
              </div>
              {dealAnalytics ? (
                <>
                  <div className="grid grid-cols-3 gap-3 mb-4">
                    <MiniStat label="Konversi" value={`${Math.round(dealAnalytics.conversionRate * 100)}%`} />
                    <MiniStat label="Rata2 Tutup" value={dealAnalytics.avgCloseDays != null ? `${dealAnalytics.avgCloseDays} hr` : "—"} />
                    <MiniStat label="Rata2 Harga" value={dealAnalytics.avgAgreedPrice != null ? `$${dealAnalytics.avgAgreedPrice}` : "—"} />
                  </div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant mb-2">Pipeline</p>
                  <div className="space-y-1.5">
                    {dealAnalytics.byStatus.map((s) => (
                      <div key={s.status} className="flex items-center gap-2 text-xs">
                        <span className="w-40 shrink-0 text-on-surface-variant truncate">
                          {DEAL_STATUS_LABEL[s.status as DealStatus] ?? s.status}
                        </span>
                        <div className="flex-1 h-2 bg-surface-container-high rounded-full overflow-hidden">
                          <div className="h-full bg-primary rounded-full" style={{ width: `${dealAnalytics.total ? Math.round((s.count / dealAnalytics.total) * 100) : 0}%` }} />
                        </div>
                        <span className="w-6 text-right font-mono font-bold text-on-surface">{s.count}</span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <p className="text-sm text-on-surface-variant">Belum ada data negosiasi.</p>
              )}
            </div>

            <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <Users className="size-5 text-primary" />
                <h2 className="text-base font-semibold text-on-surface">Analitik Pembeli</h2>
              </div>
              {buyerAnalytics ? (
                <>
                  <div className="grid grid-cols-3 gap-3 mb-4">
                    <MiniStat label="Tanpa Embedding" value={String(buyerAnalytics.missing_embeddings)} />
                    <MiniStat label="Sync 7 hr" value={String(buyerAnalytics.recently_synced)} />
                    <MiniStat label="Tanpa HS" value={String(buyerAnalytics.without_hs)} />
                  </div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant mb-2">Distribusi Kredibilitas</p>
                  <div className="space-y-1.5 mb-4">
                    {(["high", "medium", "low"] as const).map((band) => {
                      const c = buyerAnalytics.by_credibility.find((b) => b.band === band)?.count ?? 0;
                      const pct = buyerAnalytics.total ? Math.round((c / buyerAnalytics.total) * 100) : 0;
                      const color = band === "high" ? "bg-secondary" : band === "medium" ? "bg-warning" : "bg-error";
                      const label = band === "high" ? "Tinggi (≥60%)" : band === "medium" ? "Sedang (40–60%)" : "Rendah (<40%)";
                      return (
                        <div key={band} className="flex items-center gap-2 text-xs">
                          <span className="w-28 shrink-0 text-on-surface-variant">{label}</span>
                          <div className="flex-1 h-2 bg-surface-container-high rounded-full overflow-hidden">
                            <div className={`h-full ${color} rounded-full`} style={{ width: `${pct}%` }} />
                          </div>
                          <span className="w-8 text-right font-mono font-bold text-on-surface">{c}</span>
                        </div>
                      );
                    })}
                  </div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant mb-1.5">HS Teratas</p>
                  <div className="flex flex-wrap gap-1.5">
                    {buyerAnalytics.by_hs.slice(0, 6).map((hs) => (
                      <span key={hs.hs} className="text-[10px] font-mono font-semibold text-primary bg-primary/5 border border-primary/20 px-1.5 py-0.5 rounded">
                        HS {hs.hs} · {hs.count}
                      </span>
                    ))}
                  </div>
                </>
              ) : (
                <p className="text-sm text-on-surface-variant">Belum ada data pembeli.</p>
              )}
            </div>
          </div>
        )}

        {/* AI buyer matches (real /matching/search) */}
        <div>
          <div className="flex justify-between items-end mb-4">
            <h2 className="text-lg font-bold text-on-surface">Pencocokan Pembeli AI</h2>
            <button onClick={() => router.push("/buyer-discovery")} className="text-xs font-medium text-primary hover:underline">
              Lihat Semua
            </button>
          </div>
          {displayMatches.length === 0 ? (
            <div className="text-sm text-on-surface-variant border border-dashed border-outline-variant rounded-xl p-6 text-center">
              Belum ada pencocokan pembeli. Pastikan produk Anda sudah diproses untuk pencocokan AI (embedding).
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {displayMatches.map((match, idx) => (
                <div key={idx} className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5 shadow-sm flex flex-col">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex gap-3">
                      <Avatar name={match.company} />
                      <div>
                        <h3 className="font-semibold text-on-surface text-sm">{match.company}</h3>
                        <p className="text-[11px] text-on-surface-variant">{match.location}</p>
                        {match.isSynthetic && (
                          <span className="mt-1 inline-block text-[9px] font-bold uppercase tracking-wider text-on-tertiary-container bg-tertiary-container px-1.5 py-0.5 rounded">
                            Data Simulasi
                          </span>
                        )}
                      </div>
                    </div>
                    <Badge variant="success" icon={Radar}>{match.matchScore}%</Badge>
                  </div>
                  <div className="text-xs space-y-1 mb-6 flex-1">
                    <div className="flex gap-1">
                      <span className="text-on-surface-variant w-20">Mencari:</span>
                      <span className="font-medium text-on-surface">{match.seeking}</span>
                    </div>
                    <div className="flex gap-1">
                      <span className="text-on-surface-variant w-20">Estimasi Nilai:</span>
                      <span className="font-medium text-on-surface">{match.value}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => router.push("/buyer-discovery")}
                    className="w-full py-2 border border-outline-variant hover:border-primary text-primary text-xs font-bold rounded-lg transition-colors flex justify-center items-center gap-1"
                  >
                    <Send className="size-4" /> Ajukan Penawaran
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* AI processing + external provider health are admin-only concerns —
            not shown on the UMKM dashboard. See the Admin Platform. */}

        {/* Active negotiations (real /deals) */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-outline-variant flex justify-between items-center">
            <h2 className="text-base font-bold text-on-surface">
              Negosiasi Aktif{dealsTotal ? ` (${dealsTotal})` : ""}
            </h2>
            <button onClick={() => router.push("/negotiation")} className="text-on-surface-variant hover:text-primary" title="Buka negosiasi">
              <ListFilter className="size-6" />
            </button>
          </div>
          {deals.length > 0 ? (
            <div className="divide-y divide-outline-variant bg-surface">
              {pagedDeals.map((deal) => (
                <div key={deal.id} className="p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-surface-container-lowest">
                  <div className="flex gap-4">
                    <Avatar name={deal.buyerName || "Buyer"} size="lg" />
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-bold text-on-surface text-base">{deal.buyerName || "Buyer"}</h3>
                        <Badge
                          variant={deal.status === "po_signed" ? "success" : deal.status === "po_sent" ? "warning" : "info"}
                          size="md"
                          className={deal.status === "po_sent" ? "animate-pulse" : ""}
                        >
                          {DEAL_STATUS_LABEL[deal.status]}
                        </Badge>
                      </div>
                      <p className="text-xs text-on-surface-variant font-medium">
                        {deal.buyerCountry ? `${deal.buyerCountry} • ` : ""}
                        {deal.agreedPrice ? `Harga: $${Number(deal.agreedPrice).toFixed(2)}` : "Negosiasi berjalan"}
                        {deal.lastMessage ? ` — ${deal.lastMessage}` : ""}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      if (deal.status === "po_signed" || deal.status === "po_sent") router.push("/purchase-order");
                      else if (deal.status === "compliance") router.push("/compliance");
                      else router.push("/negotiation");
                    }}
                    className="px-5 py-2.5 bg-primary text-on-primary font-bold text-xs rounded-lg hover:bg-surface-tint transition-colors flex items-center gap-1.5 shadow-sm"
                  >
                    <ExternalLink className="size-4" />
                    {deal.status === "po_signed" || deal.status === "po_sent" ? "Buka PO & Dokumen" : "Lanjutkan Negosiasi"}
                  </button>
                </div>
              ))}
              <Pager page={dealPage} totalPages={dealTotalPages} onChange={setDealPage} />
            </div>
          ) : (
            <div className="p-8 text-center text-on-surface-variant text-sm flex flex-col items-center">
              <MessagesSquare className="mb-2 opacity-50 text-outline size-9" />
              Anda belum memiliki negosiasi aktif. Buka menu <strong>Buyer Discovery</strong> untuk mencari dan menghubungi pembeli.
            </div>
          )}
        </div>

        {/* Recent activity — real persisted events (deals, PO, sync, product) — bottom */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-outline-variant flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Activity className="size-5 text-primary" />
              <h2 className="text-base font-bold text-on-surface">Aktivitas Terbaru</h2>
            </div>
            <button onClick={loadActivity} className="text-on-surface-variant hover:text-primary" title="Muat ulang">
              <RefreshCw className={`size-4 ${activityLoading ? "animate-spin" : ""}`} />
            </button>
          </div>
          {activityLoading && activity.length === 0 ? (
            <div className="p-8 text-center text-on-surface-variant text-sm">Memuat aktivitas…</div>
          ) : activity.length === 0 ? (
            <div className="p-8 text-center text-on-surface-variant text-sm flex flex-col items-center">
              <Activity className="mb-2 opacity-50 text-outline size-8" />
              Belum ada aktivitas tercatat. Aktivitas muncul saat Anda bernegosiasi, menerbitkan PO, atau menyinkronkan pembeli.
            </div>
          ) : (
            <ul className="divide-y divide-outline-variant/60">
              {pagedActivity.map((e) => {
                const Icon = CATEGORY_ICON[e.category] ?? Activity;
                return (
                  <li key={e.id}>
                    <button
                      onClick={() => router.push(e.link)}
                      className="w-full text-left px-6 py-3 flex items-center gap-3 hover:bg-surface transition-colors"
                    >
                      <span className="relative shrink-0">
                        <span className="w-8 h-8 rounded-full bg-surface-container-high flex items-center justify-center text-on-surface-variant">
                          <Icon className="size-4" />
                        </span>
                        <span
                          className={`absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-surface-container-lowest ${SEV_DOT[e.severity] ?? "bg-primary"}`}
                        />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-on-surface truncate">{e.title}</p>
                        <p className="text-xs text-on-surface-variant truncate">{e.description}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-[11px] text-on-surface-variant">{relativeTime(e.timestamp)}</span>
                        <p className="text-[10px] text-on-surface-variant/70 font-medium">{e.actor}</p>
                      </div>
                    </button>
                  </li>
                );
              })}
              <li>
                <Pager page={activityPage} totalPages={activityTotalPages} onChange={setActivityPage} />
              </li>
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Presentational helpers ──────────────────────────────────────────────────────
function Kpi({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: typeof Users;
  label: string;
  value: number | null;
  tone?: "secondary" | "muted";
}) {
  const color = tone === "secondary" ? "text-secondary" : tone === "muted" ? "text-on-surface-variant" : "text-primary";
  return (
    <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-3.5 shadow-sm">
      <div className="flex items-center gap-1.5 mb-1.5">
        <Icon className={`size-3.5 ${color}`} />
        <span className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant truncate">{label}</span>
      </div>
      <span className={`text-2xl font-black tabular-nums ${value == null ? "text-outline" : "text-on-surface"}`}>
        {value == null ? "—" : value.toLocaleString("id-ID")}
      </span>
    </div>
  );
}

function Pager({
  page,
  totalPages,
  onChange,
}: {
  page: number;
  totalPages: number;
  onChange: (p: number) => void;
}) {
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-center gap-3 py-3 border-t border-outline-variant/60 bg-surface-container-lowest">
      <button
        disabled={page <= 1}
        onClick={() => onChange(Math.max(1, page - 1))}
        className="p-1.5 border border-outline-variant rounded-md disabled:opacity-40 hover:bg-surface text-on-surface-variant"
        aria-label="Sebelumnya"
      >
        <ChevronLeft className="size-4" />
      </button>
      <span className="text-xs text-on-surface-variant tabular-nums">
        Halaman {page} / {totalPages}
      </span>
      <button
        disabled={page >= totalPages}
        onClick={() => onChange(Math.min(totalPages, page + 1))}
        className="p-1.5 border border-outline-variant rounded-md disabled:opacity-40 hover:bg-surface text-on-surface-variant"
        aria-label="Berikutnya"
      >
        <ChevronRight className="size-4" />
      </button>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-surface p-2.5 rounded-lg border border-outline-variant text-center">
      <p className="text-lg font-black text-on-surface tabular-nums">{value}</p>
      <p className="text-[9px] font-bold uppercase tracking-wider text-on-surface-variant mt-0.5">{label}</p>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-surface p-2.5 rounded-lg border border-outline-variant">
      <p className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">{label}</p>
      <p className="text-sm font-semibold text-on-surface mt-0.5 truncate" title={value}>{value}</p>
    </div>
  );
}

function SystemStatus({ health }: { health: SystemHealth | null }) {
  const dot = (up: boolean) => (up ? "bg-secondary" : "bg-error");
  const overallColor =
    health?.overall === "ok" ? "text-secondary" : health?.overall === "degraded" ? "text-warning" : "text-error";
  return (
    <div className="flex items-center gap-3 bg-surface-container-lowest border border-outline-variant rounded-lg px-3 py-2 shadow-sm">
      <Activity className={`size-4 ${overallColor}`} />
      <div className="flex items-center gap-2">
        {health ? (
          health.services.map((s) => (
            <span key={s.name} className="flex items-center gap-1" title={`${s.name}: ${s.up ? "up" : "down"}`}>
              <span className={`w-2 h-2 rounded-full ${dot(s.up)}`} />
              <span className="text-[10px] font-medium text-on-surface-variant hidden lg:inline">
                {s.name.replace("-service", "")}
              </span>
            </span>
          ))
        ) : (
          <span className="text-[11px] text-on-surface-variant">Memeriksa status…</span>
        )}
      </div>
    </div>
  );
}
