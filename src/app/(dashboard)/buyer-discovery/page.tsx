"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  ArrowUpDown,
  BadgeCheck,
  BellPlus,
  ChevronLeft,
  ChevronRight,
  Globe,
  Loader2,
  Package,
  RefreshCw,
  Search,
  Send,
  Ship,
  Sparkles,
  X,
} from "lucide-react";
import { Avatar } from "../../../components/ui/avatar";
import { Badge } from "../../../components/ui/badge";
import { setStep as setJourneyStep } from "../../../lib/state";
import { useProductView } from "../../../lib/app-data";
import { createDeal } from "../../../lib/deals";
import { createReminder } from "../../../lib/reminders";
import {
  triggerBuyerSync,
  getBuyers,
  getBuyerDetail,
  getBuyerCountries,
  BuyerRecord,
  BuyerDetailRecord,
  BuyerCountryOption,
} from "../../../lib/api";
import { setSelectedBuyer, markProposeOffer } from "../../../lib/selected-buyer";

const PER_PAGE = 12;

// ISO-2 → localized country name via the built-in Intl API (no hardcoded list).
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

const num = (v: unknown): number | null => {
  const n = typeof v === "string" ? parseFloat(v) : (v as number);
  return Number.isFinite(n) ? n : null;
};
const fmtUsd = (v: unknown) => {
  const n = num(v);
  return n == null ? "—" : "$" + Math.round(n).toLocaleString("en-US");
};

/** is_synthetic → backend-driven provenance label (Task 12). */
function ProvenanceBadge({ synthetic }: { synthetic: boolean }) {
  return synthetic ? (
    <span className="text-[9px] font-bold uppercase tracking-wider text-on-tertiary-container bg-tertiary-container px-1.5 py-0.5 rounded">
      Data Simulasi
    </span>
  ) : (
    <span className="text-[9px] font-bold uppercase tracking-wider text-on-secondary bg-secondary px-1.5 py-0.5 rounded inline-flex items-center gap-0.5">
      <BadgeCheck className="size-3" /> Data Terverifikasi TradeAtlas
    </span>
  );
}

export default function BuyerDiscoveryPage() {
  const router = useRouter();

  // ── Data (backend only) ─────────────────────────────────────────────────────
  const [buyers, setBuyers] = useState<BuyerRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [status, setStatus] = useState<"loading" | "ready" | "error" | "empty">("loading");

  // ── Filters / sorting / pagination (all backend-supported) ───────────────────
  const [q, setQ] = useState("");
  const [qInput, setQInput] = useState("");
  const [country, setCountry] = useState("");
  const [countryOptions, setCountryOptions] = useState<BuyerCountryOption[]>([]);
  const [minCredibility, setMinCredibility] = useState(0); // committed (debounced) value used by load()
  const [minCredInput, setMinCredInput] = useState(0); // live slider value (debounced → minCredibility)
  const [onlyReal, setOnlyReal] = useState(false);
  const [sortBy, setSortBy] = useState<"credibility" | "name" | "min_order_qty">("credibility");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);

  // ── Detail modal ─────────────────────────────────────────────────────────────
  const [detail, setDetail] = useState<BuyerDetailRecord | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // ── Reminder modal ───────────────────────────────────────────────────────────
  const [reminderFor, setReminderFor] = useState<BuyerRecord | null>(null);
  const [reminderDate, setReminderDate] = useState("");
  const [reminderTime, setReminderTime] = useState("");

  const [toast, setToast] = useState<string | null>(null);
  const showToast = (m: string) => {
    setToast(m);
    setTimeout(() => setToast(null), 3000);
  };

  const product = useProductView();
  // 4-digit HS heading of the user's product — used to show only buyers that
  // source products matching the user's product (not the whole directory).
  const productHs = useMemo(() => {
    const raw = product.hsCode || product.hsCandidates?.[0]?.hs_code || "";
    return raw.replace(/\D/g, "").slice(0, 4);
  }, [product]);
  const [matchProduct, setMatchProduct] = useState(true);

  // Debounce the search box → q.
  useEffect(() => {
    const t = setTimeout(() => {
      setQ(qInput.trim());
      setPage(1);
    }, 400);
    return () => clearTimeout(t);
  }, [qInput]);

  // Debounce the credibility slider → minCredibility. Without this, dragging fires
  // one backend request per intermediate value and exhausts the rate limiter (429).
  useEffect(() => {
    const t = setTimeout(() => {
      setMinCredibility(minCredInput);
      setPage(1);
    }, 400);
    return () => clearTimeout(t);
  }, [minCredInput]);

  // Populate the country filter dropdown from real DB data (no hardcoded list).
  useEffect(() => {
    getBuyerCountries().then(setCountryOptions);
  }, []);

  // Pre-fill the country filter when arriving from Market Intelligence
  // ("Cari Buyer di <negara>" → /buyer-discovery?country=DE). Read once on mount.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const c = new URLSearchParams(window.location.search).get("country");
    if (c) {
      setCountry(c.toUpperCase());
      setPage(1);
    }
  }, []);

  // Buyer synchronization for this product's HS codes is owned by the backend
  // Product Initialization Workflow (buyer_sync stage) — no client-triggered sync.

  // ── Fetch buyers from the backend whenever query/filter/sort/page changes ─────
  const load = useCallback(async () => {
    setStatus("loading");
    const res = await getBuyers({
      q: q || undefined,
      country: country ? [country] : undefined,
      hs: matchProduct && productHs ? productHs : undefined,
      is_synthetic: onlyReal ? false : undefined,
      min_credibility: minCredibility > 0 ? minCredibility : undefined,
      sort_by: sortBy,
      sort_dir: sortDir,
      page,
      per_page: PER_PAGE,
    });
    if (!res) {
      setBuyers([]);
      setStatus("error");
      return;
    }
    setBuyers(res.items);
    setTotal(res.total);
    setTotalPages(res.total_pages);
    setStatus(res.items.length === 0 ? "empty" : "ready");
  }, [q, country, matchProduct, productHs, onlyReal, minCredibility, sortBy, sortDir, page]);

  useEffect(() => {
    void load();
  }, [load]);

  // ── Actions ──────────────────────────────────────────────────────────────────
  const openDetail = async (b: BuyerRecord) => {
    setDetailLoading(true);
    setDetail({ ...(b as BuyerDetailRecord), metadata: {}, is_active: true }); // show summary immediately
    const full = await getBuyerDetail(b.buyer_id);
    if (full) setDetail(full);
    setDetailLoading(false);
  };

  const proposeDeal = async (b: BuyerRecord) => {
    setSelectedBuyer({
      buyer_id: b.buyer_id,
      name: b.name,
      country: b.country,
      credibility_score: b.credibility_score,
      is_synthetic: b.is_synthetic,
      source: b.source ?? null,
    });
    // Ask the Negotiation screen to auto-draft an initial English offer for this buyer.
    markProposeOffer(b.buyer_id);
    await createDeal({
      buyerName: b.name,
      buyerCountry: b.country,
      status: "negotiating",
      lastMessage: "Penawaran diajukan ke pembeli.",
    });
    setJourneyStep("negotiating");
    router.push("/negotiation");
  };

  const saveReminder = async () => {
    if (!reminderFor || !reminderDate) {
      showToast("Isi tanggal pengingat.");
      return;
    }
    await createReminder({
      title: `Tindak lanjut ${reminderFor.name}`,
      date: reminderDate,
      time: reminderTime || "12:00",
      type: "Email Penawaran",
    });
    showToast(`Pengingat untuk ${reminderFor.name} dijadwalkan.`);
    setReminderFor(null);
    setReminderDate("");
    setReminderTime("");
  };

  const toggleSort = (field: typeof sortBy) => {
    if (sortBy === field) setSortDir((d) => (d === "desc" ? "asc" : "desc"));
    else {
      setSortBy(field);
      setSortDir("desc");
    }
    setPage(1);
  };

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div className="h-full w-full overflow-y-auto p-4 md:p-8 bg-surface-bright">
      <div className="max-w-6xl mx-auto space-y-6 pb-12">
        {/* Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-primary font-heading">Penemuan Pembeli AI</h1>
            <p className="text-sm text-on-surface-variant mt-1 flex items-center gap-2 font-medium">
              <Sparkles className="size-4 text-secondary" />
              Importir nyata tersinkron dari data bea cukai (TradeAtlas) untuk produk Anda
              {product?.hsCode ? ` — HS ${product.hsCode}` : ""}
            </p>
          </div>
          <button
            onClick={() => void load()}
            className="text-xs font-semibold text-primary border border-outline-variant rounded-md px-3 py-2 hover:bg-surface flex items-center gap-1.5"
          >
            <RefreshCw className="size-4" /> Muat ulang
          </button>
        </div>

        {/* Filter / search / sort bar */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-4 shadow-sm flex flex-col md:flex-row md:items-end gap-3">
          <div className="flex-1">
            <label className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">Cari nama pembeli</label>
            <div className="relative mt-1">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 size-4 text-on-surface-variant" />
              <input
                value={qInput}
                onChange={(e) => setQInput(e.target.value)}
                placeholder="mis. Starbucks"
                className="w-full pl-8 pr-2 py-2 text-sm bg-surface border border-outline-variant rounded-md outline-none focus:border-primary"
              />
            </div>
          </div>
          <div className="w-full md:w-52">
            <label className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">Negara</label>
            <select
              value={country}
              onChange={(e) => {
                setCountry(e.target.value);
                setPage(1);
              }}
              className="w-full mt-1 px-2 py-2 text-sm bg-surface border border-outline-variant rounded-md outline-none focus:border-primary"
            >
              <option value="">Semua negara</option>
              {/* If the pre-selected country (e.g. from Market Intelligence) has no
                  buyers in the DB it won't be in the options — surface it anyway so
                  the dropdown reflects the active filter. */}
              {country && !countryOptions.some((c) => c.country === country) && (
                <option value={country}>{regionName(country)} (0)</option>
              )}
              {countryOptions.map((c) => (
                <option key={c.country} value={c.country}>
                  {regionName(c.country)} ({c.count})
                </option>
              ))}
            </select>
          </div>
          <div className="w-full md:w-40">
            <label className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">
              Min. kredibilitas {minCredInput > 0 ? `${Math.round(minCredInput * 100)}%` : ""}
            </label>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={minCredInput}
              onChange={(e) => setMinCredInput(parseFloat(e.target.value))}
              className="w-full mt-3 accent-primary"
            />
          </div>
          <div className="flex flex-col gap-2 pb-2">
            <label
              className={`flex items-center gap-2 text-xs font-medium ${productHs ? "text-on-surface" : "text-on-surface-variant cursor-not-allowed"}`}
              title={productHs ? undefined : "HS produk belum tersedia — selesaikan klasifikasi produk untuk mengaktifkan filter ini"}
            >
              <input
                type="checkbox"
                checked={Boolean(productHs) && matchProduct}
                disabled={!productHs}
                onChange={(e) => {
                  setMatchProduct(e.target.checked);
                  setPage(1);
                }}
                className="accent-primary disabled:opacity-50"
              />
              {productHs ? `Sesuai produk (HS ${productHs})` : "Sesuai produk (HS belum tersedia)"}
            </label>
            <label className="flex items-center gap-2 text-xs font-medium text-on-surface">
              <input
                type="checkbox"
                checked={onlyReal}
                onChange={(e) => {
                  setOnlyReal(e.target.checked);
                  setPage(1);
                }}
                className="accent-primary"
              />
              Hanya data terverifikasi
            </label>
          </div>
        </div>

        {/* Sort chips + count */}
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2 text-xs">
            <span className="text-on-surface-variant">Urutkan:</span>
            {([
              ["credibility", "Kredibilitas"],
              ["name", "Nama"],
              ["min_order_qty", "MOQ"],
            ] as const).map(([field, label]) => (
              <button
                key={field}
                onClick={() => toggleSort(field)}
                className={`px-2 py-1 rounded-md border flex items-center gap-1 ${
                  sortBy === field ? "border-primary text-primary font-semibold" : "border-outline-variant text-on-surface-variant"
                }`}
              >
                {label}
                {sortBy === field && <ArrowUpDown className="size-3" />}
              </button>
            ))}
          </div>
          <span className="text-xs text-on-surface-variant">
            {status === "ready" || status === "empty" ? `${total} pembeli` : ""}
          </span>
        </div>

        {/* Grid / states */}
        {status === "loading" && (
          <div className="flex items-center justify-center py-20 text-on-surface-variant text-sm gap-2">
            <Loader2 className="size-5 animate-spin" /> Memuat pembeli dari database…
          </div>
        )}

        {status === "error" && (
          <div className="border border-dashed border-error/40 bg-error/5 rounded-xl p-8 text-center text-sm text-error flex flex-col items-center gap-2">
            <AlertTriangle className="size-6" />
            Gagal memuat pembeli dari backend. Pastikan layanan matching aktif.
            <button onClick={() => void load()} className="mt-2 text-xs font-semibold text-primary underline">
              Coba lagi
            </button>
          </div>
        )}

        {status === "empty" && (
          <div className="border border-dashed border-outline-variant rounded-xl p-10 text-center text-sm text-on-surface-variant">
            Belum ada pembeli yang cocok. Sinkronisasi importir nyata mungkin masih berjalan di latar — coba muat ulang beberapa saat lagi.
          </div>
        )}

        {status === "ready" && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {buyers.map((b) => {
              const cred = Math.round(b.credibility_score * 100);
              return (
                <div
                  key={b.buyer_id}
                  className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5 shadow-sm flex flex-col"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex gap-3 min-w-0">
                      <Avatar name={b.name} />
                      <div className="min-w-0">
                        <h3 className="font-semibold text-on-surface text-sm truncate" title={b.name}>
                          {b.name}
                        </h3>
                        <p className="text-[11px] text-on-surface-variant flex items-center gap-1">
                          <Globe className="size-3" /> {b.country}
                        </p>
                      </div>
                    </div>
                    <Badge variant={cred >= 60 ? "success" : cred >= 40 ? "warning" : "danger"}>{cred}%</Badge>
                  </div>

                  <div className="mb-3">
                    <ProvenanceBadge synthetic={b.is_synthetic} />
                  </div>

                  <div className="text-xs space-y-1.5 mb-4 flex-1">
                    <div className="flex items-center gap-1.5 text-on-surface-variant">
                      <Package className="size-3.5" />
                      <span className="text-on-surface font-medium">
                        {b.hs_codes.length > 0 ? `HS ${b.hs_codes.slice(0, 3).join(", ")}` : "HS —"}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-on-surface-variant">
                      <Ship className="size-3.5" />
                      <span className="text-on-surface font-medium">
                        {b.shipment_count != null ? `${b.shipment_count} pengiriman tercatat` : "MOQ " + b.min_order_qty}
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => void openDetail(b)}
                      className="flex-1 py-2 border border-outline-variant hover:border-primary text-on-surface text-xs font-semibold rounded-lg transition-colors"
                    >
                      Detail
                    </button>
                    <button
                      onClick={() => setReminderFor(b)}
                      title="Buat pengingat"
                      className="px-2.5 py-2 border border-outline-variant hover:border-primary text-primary rounded-lg"
                    >
                      <BellPlus className="size-4" />
                    </button>
                    <button
                      onClick={() => void proposeDeal(b)}
                      className="flex-1 py-2 bg-primary text-on-primary text-xs font-bold rounded-lg transition-colors flex justify-center items-center gap-1 hover:bg-surface-tint"
                    >
                      <Send className="size-4" /> Penawaran
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {(status === "ready" || status === "empty") && totalPages > 1 && (
          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="p-2 border border-outline-variant rounded-md disabled:opacity-40 hover:bg-surface"
            >
              <ChevronLeft className="size-4" />
            </button>
            <span className="text-xs text-on-surface-variant">
              Halaman {page} / {totalPages}
            </span>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="p-2 border border-outline-variant rounded-md disabled:opacity-40 hover:bg-surface"
            >
              <ChevronRight className="size-4" />
            </button>
          </div>
        )}
      </div>

      {/* Detail modal */}
      {detail && (
        <div className="fixed inset-0 z-10000 bg-black/50 flex items-center justify-center p-4" onClick={() => setDetail(null)}>
          <div
            className="bg-surface-container-lowest border border-outline-variant rounded-xl shadow-xl w-full max-w-lg max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-5 border-b border-outline-variant flex justify-between items-start">
              <div className="flex gap-3">
                <Avatar name={detail.name} />
                <div>
                  <h3 className="font-bold text-on-surface">{detail.name}</h3>
                  <p className="text-xs text-on-surface-variant flex items-center gap-1">
                    <Globe className="size-3" /> {detail.country} · <ProvenanceBadge synthetic={detail.is_synthetic} />
                  </p>
                </div>
              </div>
              <button onClick={() => setDetail(null)} className="text-on-surface-variant hover:text-primary">
                <X className="size-5" />
              </button>
            </div>
            <div className="p-5 space-y-3 text-sm">
              {detailLoading && (
                <div className="text-xs text-on-surface-variant flex items-center gap-2">
                  <Loader2 className="size-4 animate-spin" /> Memuat detail…
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <Stat label="Skor Kredibilitas" value={`${Math.round(detail.credibility_score * 100)}%`} />
                <Stat label="Jumlah Pengiriman" value={String(detail.metadata?.["shipment_count"] ?? detail.shipment_count ?? "—")} />
                <Stat label="Total Nilai FOB" value={fmtUsd(detail.metadata?.["total_usd_fob"])} />
                <Stat label="MOQ" value={String(detail.min_order_qty)} />
              </div>
              <Field label="HS Codes" value={(detail.hs_codes || []).join(", ") || "—"} />
              <Field
                label="Negara Pemasok"
                value={(detail.metadata?.["exporter_countries"] as string[] | undefined)?.join(", ") || "—"}
              />
              <Field
                label="Pelabuhan Kedatangan"
                value={(detail.metadata?.["arrival_ports"] as string[] | undefined)?.slice(0, 6).join(", ") || "—"}
              />
              <Field label="Sumber" value={detail.source || (detail.metadata?.["source"] as string) || "—"} />
              {detail.description && (
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant mb-1">Ringkasan</p>
                  <p className="text-xs text-on-surface leading-relaxed">{detail.description}</p>
                </div>
              )}
            </div>
            <div className="p-4 border-t border-outline-variant flex justify-end gap-2">
              <button onClick={() => setDetail(null)} className="px-4 py-2 text-xs font-medium text-on-surface hover:bg-surface rounded-md">
                Tutup
              </button>
              <button
                onClick={() => {
                  const b = detail;
                  setDetail(null);
                  void proposeDeal(b);
                }}
                className="px-4 py-2 text-xs font-bold bg-primary text-on-primary rounded-md flex items-center gap-1 hover:bg-surface-tint"
              >
                <Send className="size-4" /> Ajukan Penawaran
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reminder modal */}
      {reminderFor && (
        <div className="fixed inset-0 z-10000 bg-black/50 flex items-center justify-center p-4" onClick={() => setReminderFor(null)}>
          <div className="bg-surface-container-lowest border border-outline-variant rounded-xl shadow-xl w-full max-w-sm p-5" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-bold text-on-surface mb-1">Buat Pengingat</h3>
            <p className="text-xs text-on-surface-variant mb-4">Tindak lanjut untuk {reminderFor.name}</p>
            <label className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">Tanggal</label>
            <input type="date" value={reminderDate} onChange={(e) => setReminderDate(e.target.value)} className="w-full mt-1 mb-3 px-2 py-2 text-sm bg-surface border border-outline-variant rounded-md outline-none focus:border-primary" />
            <label className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">Waktu (opsional)</label>
            <input type="time" value={reminderTime} onChange={(e) => setReminderTime(e.target.value)} className="w-full mt-1 mb-4 px-2 py-2 text-sm bg-surface border border-outline-variant rounded-md outline-none focus:border-primary" />
            <div className="flex justify-end gap-2">
              <button onClick={() => setReminderFor(null)} className="px-4 py-2 text-xs font-medium text-on-surface hover:bg-surface rounded-md">Batal</button>
              <button onClick={() => void saveReminder()} className="px-4 py-2 text-xs font-bold bg-primary text-on-primary rounded-md">Simpan</button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className="fixed bottom-6 right-6 z-10000 bg-on-surface text-surface text-xs font-medium px-4 py-3 rounded-lg shadow-lg">
          {toast}
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-surface p-2.5 rounded-lg border border-outline-variant">
      <p className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">{label}</p>
      <p className="text-sm font-semibold text-on-surface mt-0.5">{value}</p>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 text-xs">
      <span className="text-on-surface-variant">{label}</span>
      <span className="text-on-surface font-medium text-right truncate" title={value}>
        {value}
      </span>
    </div>
  );
}
