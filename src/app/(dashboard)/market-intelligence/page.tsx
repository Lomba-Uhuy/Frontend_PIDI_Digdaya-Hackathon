"use client";
import React, { useState, useEffect } from "react";
import {
  AlertTriangle,
  BadgeCheck,
  Barcode,
  CheckCircle2,
  ChevronDown,
  Download,
  FileSignature,
  Globe,
  Sparkles,
  X,
} from "lucide-react";
import { Badge } from "../../../components/ui/badge";
import { MarketMap } from "../../../components/ui/market-map";
import {
  getMarketIntelligence,
  getHsCodes,
  getRegions,
  getTopMarkets,
  MarketIntelligenceResponse,
  MarketStat,
  HsOption,
  RegionOption,
} from "../../../lib/api";
import { useProductView } from "../../../lib/app-data";

const fmtUsd = (v: number | null | undefined) =>
  v == null ? "—" : "$" + Math.round(v).toLocaleString("en-US");

export default function MarketIntelligencePage() {
  // HS code = real 2-digit chapter with ingested data (e.g. "09", "46", "15").
  // Empty until we know the product's relevant chapter (avoids showing an
  // irrelevant chapter's data on first paint).
  const [hsCode, setHsCode] = useState("");
  const [region, setRegion] = useState("global");

  // Real reference data for the dropdowns (from ingested BPS data).
  const [hsOptions, setHsOptions] = useState<HsOption[]>([]);
  const [regionOptions, setRegionOptions] = useState<RegionOption[]>([]);
  // True when the HS dropdown was narrowed to the product's relevant chapters.
  const [hsTailored, setHsTailored] = useState(false);

  // Custom high-fidelity modal & interactive states
  const [showReportModal, setShowReportModal] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [toast, setToast] = useState<{ message: string } | null>(null);

  // Live BPS + UN Comtrade market intelligence.
  const [live, setLive] = useState<MarketIntelligenceResponse | null>(null);
  const [liveLoading, setLiveLoading] = useState(false);
  // Real top markets aggregated from bps_trade_data (reliable for every chapter).
  const [topMarkets, setTopMarkets] = useState<MarketStat[]>([]);

  // The HS dropdown is DYNAMIC and product-specific: it lists only the HS chapters
  // that the semantic (RAG) classifier deems relevant to the user's product — not a
  // hardcoded list. We classify the product description (the same one used at
  // onboarding), take the ranked top-k HS candidates, reduce them to 2-digit
  // chapters, and keep only those that actually have ingested market data. Falls
  // back to all data-backed chapters if classification is unavailable so the page
  // always works.
  // The HS chapters relevant to the product come from the backend-persisted RAG
  // candidates (workflow hs_classification stage) — no client-side classification.
  const product = useProductView();
  useEffect(() => {
    let cancelled = false;

    getHsCodes().then((opts) => {
      if (cancelled || !opts || opts.length === 0) return;

      // Relevant 2-digit chapters that also have ingested market data, in the
      // classifier's relevance order.
      const relevant = product
        .relevantChapters()
        .map((ch) => opts.find((o) => o.code === ch))
        .filter((o): o is HsOption => Boolean(o));

      const tailored = relevant.length > 0;
      const finalOpts = tailored ? relevant : opts;
      setHsOptions(finalOpts);
      setHsTailored(tailored);
      setHsCode(finalOpts[0].code);
    });

    getRegions().then((opts) => {
      if (!cancelled && opts) setRegionOptions(opts);
    });

    return () => {
      cancelled = true;
    };
  }, [product]);

  useEffect(() => {
    if (!hsCode) return;
    let cancelled = false;
    const hs = hsCode.replace(/[^0-9]/g, "");
    setLiveLoading(true);
    getMarketIntelligence(hs, region)
      .then((res) => {
        if (!cancelled) setLive(res);
      })
      .finally(() => {
        if (!cancelled) setLiveLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [hsCode, region]);

  // Real top markets per chapter (BPS aggregation) — reliable for every HS.
  useEffect(() => {
    if (!hsCode) return;
    let cancelled = false;
    getTopMarkets(hsCode.replace(/[^0-9]/g, "")).then((rows) => {
      if (!cancelled && rows) setTopMarkets(rows);
    });
    return () => {
      cancelled = true;
    };
  }, [hsCode]);

  const hsLabel = hsOptions.find((o) => o.code === hsCode)?.label ?? `HS ${hsCode}`;

  // Prefer the reliable BPS aggregation; fall back to the market-intel response.
  const baseMarkets: MarketStat[] = topMarkets.length > 0 ? topMarkets : live?.topMarkets ?? [];
  const displayMarkets =
    region === "global"
      ? baseMarkets
      : baseMarkets.filter((m) => m.partner.toUpperCase() === region.toUpperCase());

  // Data-derived insight (used when the AI market-intel analysis is unavailable).
  const derivedTotal = baseMarkets.reduce((a, m) => a + (m.tradeValueUsd ?? 0), 0);
  const derivedTop = baseMarkets[0];
  const derivedAnalysis = derivedTop
    ? `Total ekspor ${hsLabel.replace(/^\[\d+\]\s*/, "")} tercatat ${fmtUsd(derivedTotal)} dari ${baseMarkets.length} negara tujuan. Pasar terbesar: ${derivedTop.partner} (${fmtUsd(derivedTop.tradeValueUsd)}).`
    : "";

  const showToast = (message: string) => {
    setToast({ message });
    setTimeout(() => {
      setToast(null);
    }, 3500);
  };

  const handleCreateReport = () => {
    setIsGenerating(true);
    setTimeout(() => {
      setIsGenerating(false);
      setShowReportModal(true);
    }, 1500);
  };

  const handleDownloadReport = () => {
    const isCoffee = hsCode === "09";
    const reportTitle = isCoffee 
      ? "Laporan Strategi Ekspor AI - Kopi Robusta Premium"
      : "Laporan Strategi Ekspor AI - Kursi Rotan Handcrafted Jepara";
      
    const reportBody = `
==================================================
TRADECONNECT AI EXPORT STRATEGY REPORT
==================================================
Komoditas: ${isCoffee ? "Biji Kopi Robusta (HS 0901.11)" : "Kursi Rotan Anyaman (HS 9401.52)"}
Wilayah Sasaran: ${region === "global" ? "Ringkasan Global" : region === "eu" ? "Uni Eropa (EU27)" : "Amerika Utara"}
Tanggal Pembuatan: ${new Date().toLocaleDateString("id-ID")}
Skor Kesiapan Ekspor: 85/100 (Sangat Siap)
--------------------------------------------------

1. ANALISIS KELAYAKAN PASAR
   - Permintaan di ${region === "eu" ? "Uni Eropa" : "Pasar Global"} melonjak sebesar ${isCoffee ? "14%" : "28%"} pada kuartal terakhir.
   - Pasar Jerman dan Belanda menunjukkan toleransi harga premium tertinggi untuk produk berkelanjutan.
   - Pesaing utama berasal dari Vietnam dan India, namun keunikan cita rasa lokal dan kualitas anyaman tangan Indonesia memberikan keunggulan kompetitif.

2. LOGISTIK & STRATEGI INCOTERMS
   - Incoterms yang direkomendasikan: FOB (Free on Board) Tanjung Perak Surabaya atau Tanjung Emas Semarang.
   - Kontainer Uji Coba: 1 x 20ft Container (kapasitas ${isCoffee ? "18 Metrik Ton" : "150 Unit Kursi"}).
   - Rencana pengapalan disarankan menggunakan jalur laut langsung ke Pelabuhan Hamburg (DEHAM).

3. REGULASI KEPATUHAN & SERTIFIKASI
   - ${isCoffee ? "Kewajiban EUDR (European Union Deforestation Regulation): Koordinat geolokasi GPS kebun harus tervalidasi 100%." : "Sertifikat SVLK (Timber Legality Assurance) dan kepatuhan FSC Timber harus disiapkan lengkap sebelum kontainer dimuat."}
   - Sertifikasi Tambahan: ${isCoffee ? "Halal, Rainforest Alliance, Fairtrade." : "Sertifikasi FSC, Sistem Verifikasi Legalitas Kayu."}

4. TINDAKAN REKOMENDASI AI
   - Segera ajukan koordinat geolokasi terverifikasi ke sistem INATRADE.
   - Kunci harga CIF Hamburg Anda di kalkulator ekspor berdasarkan margin minimum 15%.
   - Gunakan generator email pintar AI TradeConnect untuk menjangkau pembeli terdaftar dari Penemuan Pembeli secara instan.

==================================================
Dibuat secara otomatis oleh TradeConnect AI.
Keamanan data pabean terjamin 100%.
    `;

    const blob = new Blob([reportBody], { type: "text/plain;charset=utf-8" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `laporan_strategi_ekspor_${hsCode}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    setShowReportModal(false);
    showToast("Laporan Strategi Ekspor AI berhasil diunduh!");
  };

  const isCoffee = hsCode === "09";

  return (
    <div className="h-full w-full overflow-y-auto p-4 md:p-8 bg-surface-bright font-sans text-on-surface">
      <div className="max-w-6xl mx-auto space-y-6 pb-12">
        
        {/* Header Section */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-primary font-heading">Eksplorasi Intelijen Pasar</h1>
            <p className="text-sm text-on-surface-variant mt-1 flex items-center gap-2 font-medium">
              <span className="w-2 h-2 rounded-full bg-secondary"></span>
              Aliran data langsung terhubung dengan UN Comtrade &amp; BPS
            </p>
          </div>
          
          <div className="flex items-center gap-3 w-full lg:w-auto">
            <div className="flex-1 lg:flex-none border border-outline-variant rounded-md bg-surface-container-lowest flex text-sm overflow-hidden shadow-sm">
              {/* HS Code Selection dropdown */}
              <div className="px-4 py-2 hover:bg-surface-container-low transition-colors relative flex flex-col justify-center min-w-[200px]">
                <div className="text-[10px] font-bold text-on-surface-variant uppercase mb-0.5 tracking-wider flex items-center gap-1">
                  KODE HS / KOMODITAS
                  {hsTailored && (
                    <span className="text-secondary normal-case tracking-normal font-semibold">· sesuai produk Anda</span>
                  )}
                </div>
                <div className="relative flex items-center">
                  <Barcode className="text-primary mr-1 size-4" />
                  <select
                    value={hsCode}
                    onChange={(e) => setHsCode(e.target.value)}
                    className="bg-transparent font-semibold text-on-surface outline-none appearance-none pr-6 cursor-pointer text-xs w-full"
                  >
                    {hsOptions.length === 0 ? (
                      <option value={hsCode}>Menganalisis produk Anda…</option>
                    ) : (
                      hsOptions.map((o) => (
                        <option key={o.code} value={o.code}>
                          {o.code} - {o.label.replace(/^\[\d+\]\s*/, "")}
                        </option>
                      ))
                    )}
                  </select>
                  <ChevronDown className="absolute right-0 pointer-events-none text-on-surface-variant size-4" />
                </div>
              </div>
              {/* Region Selection dropdown */}
              <div className="px-4 py-2 hover:bg-surface-container-low transition-colors relative flex flex-col justify-center min-w-[160px] border-l border-outline-variant">
                <div className="text-[10px] font-bold text-on-surface-variant uppercase mb-0.5 tracking-wider">WILAYAH SASARAN</div>
                <div className="relative flex items-center">
                  <select
                    value={region}
                    onChange={(e) => setRegion(e.target.value)}
                    className="bg-transparent font-semibold text-on-surface outline-none appearance-none pr-6 cursor-pointer text-xs w-full"
                  >
                    <option value="global">Ringkasan Global</option>
                    {regionOptions.map((o) => (
                      <option key={o.name} value={o.name}>
                        {o.name.charAt(0) + o.name.slice(1).toLowerCase()}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-0 pointer-events-none text-on-surface-variant size-4" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Content Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left Panel: Map */}
          <div className="lg:col-span-2 bg-surface-container-lowest border border-outline-variant rounded-xl shadow-sm overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-outline-variant flex justify-between items-center bg-surface-container-lowest">
              <h2 className="text-base font-bold text-primary flex items-center gap-2">
                <Globe className="text-primary size-6" />
                Peta Panas Volume Impor Global
              </h2>
              <div className="flex gap-2">
                <Badge variant="success" size="md">VOL: USD</Badge>
                <Badge variant="neutral" size="md">2023 YTD</Badge>
              </div>
            </div>
            
            <div className="relative flex-1 min-h-[400px] overflow-hidden">
              {/* Real Google Maps heat layer fed by live BPS/UN Comtrade values */}
              <MarketMap markets={displayMarkets.map((m) => ({ partner: m.partner, tradeValueUsd: m.tradeValueUsd }))} commodity={hsLabel.replace(/^\[\d+\]\s*/, "")} />

              {/* Legend */}
              <div className="absolute bottom-6 right-6 bg-surface-container-lowest/95 backdrop-blur border border-outline-variant rounded-lg p-3 shadow-md z-10 pointer-events-none">
                <div className="text-[10px] font-bold text-on-surface-variant uppercase mb-2">VOLUME IMPOR (USD)</div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-on-surface-variant">Rendah</span>
                  <div className="w-32 h-2 bg-gradient-to-r from-info/40 via-secondary to-error rounded-full"></div>
                  <span className="text-xs font-bold text-error">Tinggi</span>
                </div>
              </div>
            </div>

            {/* Live top-markets table (real BPS + UN Comtrade data) */}
            {displayMarkets.length > 0 && (
              <div className="border-t border-outline-variant">
                <div className="px-6 py-3 flex items-center justify-between">
                  <h3 className="text-xs font-bold text-on-surface uppercase tracking-wider">
                    Pasar Tujuan Teratas (Data Langsung)
                  </h3>
                  <Badge variant="success" size="md">BPS / UN Comtrade</Badge>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="text-on-surface-variant border-y border-outline-variant bg-surface">
                        <th className="text-left font-bold px-6 py-2">Negara</th>
                        <th className="text-right font-bold px-6 py-2">Nilai (USD)</th>
                        <th className="text-right font-bold px-6 py-2">Berat (KG)</th>
                        <th className="text-right font-bold px-6 py-2">Periode</th>
                      </tr>
                    </thead>
                    <tbody>
                      {displayMarkets.slice(0, 8).map((m, i) => (
                        <tr key={i} className="border-b border-outline-variant/50">
                          <td className="px-6 py-2 font-semibold text-on-surface">{m.partner}</td>
                          <td className="px-6 py-2 text-right font-mono text-on-surface">{fmtUsd(m.tradeValueUsd)}</td>
                          <td className="px-6 py-2 text-right font-mono text-on-surface-variant">
                            {m.netWeightKg != null ? Math.round(m.netWeightKg).toLocaleString("en-US") : "—"}
                          </td>
                          <td className="px-6 py-2 text-right text-on-surface-variant">{m.period ?? "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
 
          {/* Right Panel: AI Mentor Insights */}
          <div className="bg-surface-container-lowest border-2 border-primary-fixed rounded-xl p-6 shadow-sm flex flex-col h-full justify-between">
            <div>
              <h2 className="text-lg font-bold text-primary flex items-center gap-2 mb-4">
                <Sparkles className="size-6" />
                Wawasan Mentor AI
              </h2>
              
              <p className="text-sm text-on-surface leading-relaxed mb-6 font-medium">
                {liveLoading ? (
                  <span className="text-on-surface-variant italic">Memuat data langsung BPS &amp; UN Comtrade…</span>
                ) : live?.analysis ? (
                  <>
                    {live.analysis}
                    {live.totalValueUsd != null && (
                      <span className="block mt-2 text-xs text-secondary font-bold">
                        Total nilai ekspor tercatat: {fmtUsd(live.totalValueUsd)}
                        {live.topRegion ? ` • Pasar utama: ${live.topRegion}` : ""}
                      </span>
                    )}
                  </>
                ) : derivedAnalysis ? (
                  <>{derivedAnalysis}</>
                ) : (
                  <span className="text-on-surface-variant italic">Belum ada data pasar tercatat untuk komoditas ini.</span>
                )}
              </p>
  
              <div className="space-y-4">
                {live?.alerts && live.alerts.length > 0 ? (
                  live.alerts.map((a, i) => {
                    const isOpp = a.type === "opportunity";
                    return (
                      <div
                        key={i}
                        className={`border rounded-lg p-4 flex gap-3 ${
                          isOpp
                            ? "border-outline-variant bg-surface hover:border-secondary transition-colors"
                            : "border-error/30 bg-error-container/20"
                        }`}
                      >
                        {isOpp ? (
                          <BadgeCheck className="text-secondary size-5 shrink-0" />
                        ) : (
                          <AlertTriangle className="text-error size-5 shrink-0" />
                        )}
                        <div>
                          <h3 className={`text-sm font-bold mb-1 ${isOpp ? "text-primary" : "text-error"}`}>
                            {a.title}
                          </h3>
                          <p className="text-xs text-on-surface-variant leading-relaxed font-medium">
                            {a.description}
                          </p>
                        </div>
                      </div>
                    );
                  })
                ) : baseMarkets.length > 0 ? (
                  // Data-derived opportunities from the real BPS top markets.
                  baseMarkets.slice(0, 3).map((m, i) => (
                    <div key={i} className="border border-outline-variant rounded-lg p-4 bg-surface flex gap-3 hover:border-secondary transition-colors cursor-default">
                      <BadgeCheck className="text-secondary size-5 shrink-0" />
                      <div>
                        <h3 className="text-sm font-bold text-primary mb-1">Pasar Potensial: {m.partner}</h3>
                        <p className="text-xs text-on-surface-variant leading-relaxed font-medium">
                          Nilai ekspor tercatat {fmtUsd(m.tradeValueUsd)}
                          {m.netWeightKg ? ` (${Math.round(m.netWeightKg).toLocaleString("en-US")} kg)` : ""}
                          {m.period ? ` pada ${m.period}` : ""}. Prioritaskan penjajakan pembeli di negara ini.
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="border border-outline-variant rounded-lg p-4 bg-surface text-xs text-on-surface-variant italic">
                    Belum ada sinyal peluang untuk komoditas ini.
                  </div>
                )}
              </div>
            </div>
 
            <button 
              onClick={handleCreateReport}
              disabled={isGenerating}
              className="w-full mt-6 bg-surface-container-lowest border border-primary text-primary font-bold text-xs py-3 rounded-lg flex justify-center items-center gap-2 hover:bg-primary hover:text-white transition-all shadow-sm cursor-pointer disabled:opacity-50"
            >
              {isGenerating ? (
                <>
                  <span className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></span>
                  Membuat Laporan AI...
                </>
              ) : (
                <>
                  <FileSignature className="size-[18px]" />
                  Buat Laporan Strategi AI
                </>
              )}
            </button>
          </div>
 
        </div>

        {/* AI STRATEGY REPORT DETAIL MODAL */}
        {showReportModal && (
          <div className="fixed inset-0 bg-primary/65 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
            <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl w-full max-w-2xl shadow-2xl p-6 md:p-8 flex flex-col max-h-[85vh] overflow-hidden animate-in zoom-in-95 duration-300 font-sans text-sm text-on-surface">
              
              {/* Header */}
              <div className="flex justify-between items-center border-b border-outline-variant pb-4 mb-6 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary-container border border-outline-variant text-on-primary-container rounded-xl flex items-center justify-center">
                    <Sparkles className="size-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-primary leading-tight">
                      Laporan Strategi Ekspor AI TradeConnect
                    </h3>
                    <p className="text-xs text-on-surface-variant font-medium">
                      Komoditas: {isCoffee ? "Biji Kopi Robusta (HS 0901.11)" : "Kursi Rotan Handcrafted (HS 9401.52)"}
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowReportModal(false)}
                  className="text-on-surface-variant hover:text-error p-1.5 rounded-full hover:bg-surface-container-low transition-colors"
                >
                  <X className="size-5" />
                </button>
              </div>

              {/* Body */}
              <div className="flex-1 overflow-y-auto pr-2 space-y-6 text-on-surface-variant">
                <div className="bg-primary/5 p-4 rounded-xl border border-primary/10 flex justify-between items-center shrink-0">
                  <div>
                    <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider block mb-1">Skor Kesiapan Ekspor UMKM</span>
                    <span className="text-2xl font-black text-primary">85 / 100</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider block mb-1">Incoterms Terpilih</span>
                    <span className="text-base font-bold text-secondary uppercase">FOB Tanjung Perak</span>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <h4 className="text-xs font-bold text-primary uppercase tracking-wider mb-2">1. Kelayakan Pasar &amp; Tren Impor</h4>
                    <p className="text-xs text-on-surface-variant leading-relaxed">
                      Permintaan di pasar Uni Eropa melonjak sebesar {isCoffee ? "14%" : "28%"} pada kuartal terakhir. Pasar Jerman dan Belanda menunjukkan tingkat toleransi harga premium tertinggi untuk komoditas impor yang memiliki sertifikat keberlanjutan.
                    </p>
                  </div>

                  <div>
                    <h4 className="text-xs font-bold text-primary uppercase tracking-wider mb-2">2. Analisis Tarif &amp; Hambatan Regulasi</h4>
                    <p className="text-xs text-on-surface-variant leading-relaxed">
                      {isCoffee 
                        ? "Pemeriksaan EUDR (European Union Deforestation Regulation) mewajibkan sertifikasi geolahan (GPS koordinat). Hubungkan titik pemetaan kebun Anda dengan sistem pabean melalui dasbor Kepatuhan Hukum TradeConnect."
                        : "Sertifikasi legalitas kayu (SVLK) dan kepatuhan FSC Timber harus disiapkan lengkap sebelum kontainer dimuat untuk menghindari penahanan kargo di Bea Cukai pelabuhan Hamburg."}
                    </p>
                  </div>

                  <div>
                    <h4 className="text-xs font-bold text-primary uppercase tracking-wider mb-2">3. Rekomendasi Penawaran &amp; Margin Kontainer</h4>
                    <p className="text-xs text-on-surface-variant leading-relaxed">
                      Kami merekomendasikan penawaran harga FOB minimum {isCoffee ? "Rp 42.880/kg" : "Rp 720.000/pcs"} untuk kontainer uji coba pertama (1 x 20ft Container). AI akan melindungi margin laba dasar Anda sebesar 15% secara otomatis selama alur negosiasi dengan importir global.
                    </p>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="border-t border-outline-variant pt-4 mt-6 flex justify-end gap-3 shrink-0">
                <button 
                  onClick={() => setShowReportModal(false)}
                  className="px-4 py-2 border border-outline-variant hover:bg-surface rounded-lg text-xs font-bold text-on-surface transition-colors"
                >
                  Tutup
                </button>
                <button 
                  onClick={handleDownloadReport}
                  className="px-5 py-2 bg-primary text-on-primary hover:bg-primary/90 rounded-lg text-xs font-bold transition-colors shadow-md flex items-center gap-1.5"
                >
                  <Download className="size-4" />
                  Unduh Laporan Strategi
                </button>
              </div>

            </div>
          </div>
        )}

        {/* CUSTOM INTERACTIVE TOAST */}
        {toast && (
          <div className="fixed bottom-6 right-6 z-[10000] bg-primary text-white border border-secondary-fixed/40 px-5 py-3 rounded-xl shadow-2xl flex items-center gap-2.5 animate-in slide-in-from-bottom duration-300">
            <CheckCircle2 className="text-secondary-fixed size-6" />
            <span className="text-xs font-bold">{toast.message}</span>
          </div>
        )}

      </div>
    </div>
  );
}
