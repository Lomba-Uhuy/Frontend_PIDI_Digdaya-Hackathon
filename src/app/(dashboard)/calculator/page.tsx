"use client";
import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { setFinalPrice } from "../../../lib/state";
import { getPricingBreakdown, PricingBreakdown } from "../../../lib/api";
import { Product } from "../../../lib/models/product";
import { getSelectedBuyer, SelectedBuyer } from "../../../lib/selected-buyer";
import {
  AlertTriangle,
  BarChart3,
  Check,
  Info,
  Lightbulb,
  Loader2,
  MessagesSquare,
  Receipt,
  Save,
  SlidersHorizontal,
} from "lucide-react";
import { Badge } from "../../../components/ui/badge";

// The BPS export unit-value benchmark is denominated per kilogram (net_weight_kg),
// so the whole waterfall is expressed per kg to stay comparable to it.
const UNIT = "kg";

const nOf = (s: string | null | undefined): number => {
  const x = parseFloat(s ?? "");
  return Number.isFinite(x) ? x : 0;
};
const usd = (v: number) => `$${v.toFixed(2)}`;
const idr = (v: number) => `Rp ${Math.round(v).toLocaleString("id-ID")}`;

export default function ExportCalculatorPage() {
  const router = useRouter();

  // ── Product / buyer context (real, from onboarding + Buyer Discovery) ─────────
  const [productName, setProductName] = useState("");
  const [hsCode, setHsCode] = useState("");
  const [seed, setSeed] = useState(2); // HPP seed = product floor price
  const [selectedBuyer, setSelectedBuyer] = useState<SelectedBuyer | null>(null);

  // ── Cost assumptions (user-controlled inputs, not fabricated data) ────────────
  const [hpp, setHpp] = useState(2);
  const [margin, setMargin] = useState(15); // %
  const [localHandling, setLocalHandling] = useState(0.15);
  const [exportDutyPct, setExportDutyPct] = useState(0); // %
  const [freight, setFreight] = useState(0.2);
  const [insurance, setInsurance] = useState(0.1);
  const [fxRate, setFxRate] = useState(16000); // IDR per USD (explicit assumption)

  // ── Backend pricing result ────────────────────────────────────────────────────
  const [pricing, setPricing] = useState<PricingBreakdown | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [savedPrice, setSavedPrice] = useState<number | null>(null);

  // Seed defaults from the real product once, on mount.
  useEffect(() => {
    setSelectedBuyer(getSelectedBuyer());
    if (typeof window === "undefined") return;
    const p = Product.current();
    setProductName(p.name);
    setHsCode(p.hsCode || p.hsCandidates?.[0]?.hs_code || "");
    const s = p.floorPriceUsd && p.floorPriceUsd > 0 ? p.floorPriceUsd : 2;
    setSeed(s);
    setHpp(s);
    setLocalHandling(Number((s * 0.06).toFixed(2)));
    setFreight(Number((s * 0.08).toFixed(2)));
    setInsurance(Number((s * 0.04).toFixed(2)));
  }, []);

  // Slider ranges scale to the product's price magnitude — no per-product hardcoding.
  const R = useMemo(() => {
    const big = seed >= 10;
    const r2 = (v: number) => Number(v.toFixed(2));
    return {
      hpp: { min: Math.max(0.01, r2(seed * 0.3)), mid: r2(seed), max: r2(seed * 2.5), step: big ? 0.5 : 0.05 },
      handling: { min: 0, mid: r2(seed * 0.2), max: r2(seed * 0.4), step: big ? 0.1 : 0.01 },
      freight: { min: 0, mid: r2(seed * 0.3), max: r2(seed * 0.6), step: big ? 0.1 : 0.01 },
      insurance: { min: 0, mid: r2(seed * 0.12), max: r2(seed * 0.25), step: big ? 0.05 : 0.01 },
    };
  }, [seed]);

  // Fetch the authoritative breakdown from the backend whenever an input changes.
  useEffect(() => {
    const t = setTimeout(async () => {
      setStatus("loading");
      // Export duty is entered as a % (a user assumption); convert to the absolute
      // per-unit amount the backend expects (added to the FOB base).
      const dutyBase = hpp + hpp * (margin / 100) + localHandling;
      const exportDutyAbs = Number(((dutyBase * exportDutyPct) / 100).toFixed(4));
      const res = await getPricingBreakdown({
        hpp,
        originCharges: localHandling,
        oceanFreight: freight,
        insuranceAmount: insurance,
        exportDuty: exportDutyAbs,
        profitMarginPct: margin,
        hsCode: hsCode || undefined,
        exchangeRate: fxRate,
        qty: 1,
      });
      if (!res) {
        setPricing(null);
        setStatus("error");
        return;
      }
      setPricing(res);
      setStatus("ready");
    }, 350);
    return () => clearTimeout(t);
  }, [hpp, margin, localHandling, exportDutyPct, freight, insurance, fxRate, hsCode]);

  // ── Derived display values (authoritative totals from backend) ────────────────
  const rate = pricing?.exchangeRate ?? fxRate;
  const profitAmt = hpp * (margin / 100);
  const dutyAmt = (hpp + profitAmt + localHandling) * (exportDutyPct / 100);
  const fobUnit = nOf(pricing?.fobUnit);
  const cfrUnit = nOf(pricing?.cfrTotal);
  const cifUnit = nOf(pricing?.perUnitCIF);

  const bench = pricing?.benchmarkUnitValue != null ? parseFloat(pricing.benchmarkUnitValue) : null;
  const dev = bench != null && bench > 0 ? Math.round((Math.abs(cifUnit - bench) / bench) * 100) : null;
  const gaugeStatus: "competitive" | "high" | "low" | "unknown" =
    bench == null ? "unknown" : cifUnit > bench * 1.05 ? "high" : cifUnit < bench * 0.92 ? "low" : "competitive";

  const handleSavePrice = () => {
    if (!pricing) return;
    const cif = Number(cifUnit.toFixed(2));
    setFinalPrice(cif);
    setSavedPrice(cif);
    setTimeout(() => setSavedPrice(null), 2000);
  };

  const busy = status === "loading";

  return (
    <main className="flex-1 overflow-y-auto p-6 md:p-8 h-full bg-surface-bright flex flex-col gap-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-outline-variant pb-5 shrink-0">
        <div>
          <h1 className="text-2xl font-black text-primary font-heading">Kalkulator Ekspor Mandiri</h1>
          <p className="text-sm text-on-surface-variant mt-1">
            Simulasikan struktur biaya ekspor Ex-Works sampai ke CIF negara tujuan.
            {productName ? ` Produk: ${productName}` : ""}
            {hsCode ? ` — HS ${hsCode}` : ""}
          </p>
        </div>
        <button
          onClick={() => router.push("/negotiation")}
          className="bg-primary text-white hover:bg-surface-tint font-bold text-xs py-2.5 px-5 rounded-lg flex items-center gap-2 transition-all shadow-md"
        >
          <MessagesSquare className="size-4" />
          Buka Pusat Negosiasi
        </button>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* LEFT: Inputs */}
        <section className="lg:col-span-5 bg-surface-container-lowest border border-outline-variant rounded-2xl p-6 md:p-8 shadow-sm flex flex-col gap-6">
          <div className="flex items-center gap-2.5 border-b border-outline-variant pb-3">
            <SlidersHorizontal className="text-primary size-6" />
            <h2 className="text-base font-bold text-primary uppercase tracking-wider">Komponen Biaya Ekspor</h2>
          </div>

          <div className="flex flex-col gap-5">
            {/* HPP */}
            <Slider
              label={
                <span className="flex items-center gap-1">
                  Harga Pokok Produksi (HPP/EXW)
                  <span title="Harga produk dasar di pintu gudang Anda (Ex-Works) sebelum logistik.">
                    <Info className="text-on-surface-variant size-3.5" />
                  </span>
                </span>
              }
              value={`${usd(hpp)}/${UNIT}`}
              min={R.hpp.min}
              max={R.hpp.max}
              step={R.hpp.step}
              current={hpp}
              onChange={setHpp}
              ticks={[usd(R.hpp.min), usd(R.hpp.mid), usd(R.hpp.max)]}
            />

            {/* Margin */}
            <Slider
              label="Profit Margin Yang Diinginkan"
              value={`${margin}%`}
              min={5}
              max={50}
              step={1}
              current={margin}
              onChange={(v) => setMargin(Math.round(v))}
              ticks={["5%", "25%", "50%"]}
            />

            {/* Local handling */}
            <Slider
              label="Ongkir Domestik & Handling Port"
              value={`${usd(localHandling)}/${UNIT}`}
              min={R.handling.min}
              max={R.handling.max}
              step={R.handling.step}
              current={localHandling}
              onChange={setLocalHandling}
              ticks={[usd(R.handling.min), usd(R.handling.mid), usd(R.handling.max)]}
            />

            {/* Export duty */}
            <Slider
              label="Bea Keluar / Pajak Ekspor"
              value={`${exportDutyPct}%`}
              min={0}
              max={25}
              step={1}
              current={exportDutyPct}
              onChange={(v) => setExportDutyPct(Math.round(v))}
              ticks={["0% (Bebas Bea)", "12%", "25%"]}
            />

            {/* Freight */}
            <Slider
              label="Ocean Freight Internasional"
              value={`${usd(freight)}/${UNIT}`}
              min={R.freight.min}
              max={R.freight.max}
              step={R.freight.step}
              current={freight}
              onChange={setFreight}
              ticks={[usd(R.freight.min), usd(R.freight.mid), usd(R.freight.max)]}
            />

            {/* Insurance */}
            <Slider
              label="Asuransi Maritim Internasional"
              value={`${usd(insurance)}/${UNIT}`}
              min={R.insurance.min}
              max={R.insurance.max}
              step={R.insurance.step}
              current={insurance}
              onChange={setInsurance}
              ticks={[usd(R.insurance.min), usd(R.insurance.mid), usd(R.insurance.max)]}
            />

            {/* FX assumption (explicit, editable — not presented as a fixed fact) */}
            <div className="flex flex-col gap-1.5">
              <label className="flex justify-between text-xs font-semibold">
                <span className="text-on-surface-variant flex items-center gap-1">
                  Asumsi Kurs (USD → IDR)
                  <span title="Nilai tukar yang Anda asumsikan untuk estimasi kolom IDR. Ubah sesuai kurs acuan Anda.">
                    <Info className="text-on-surface-variant size-3.5" />
                  </span>
                </span>
                <span className="font-mono text-primary font-bold">Rp {fxRate.toLocaleString("id-ID")}</span>
              </label>
              <input
                type="number"
                min={1}
                step={100}
                value={fxRate}
                onChange={(e) => setFxRate(Math.max(1, parseInt(e.target.value || "1", 10)))}
                className="w-full px-3 py-2 text-sm bg-surface border border-outline-variant rounded-md outline-none focus:border-primary font-mono"
              />
            </div>
          </div>

          <div className="border-t border-outline-variant pt-5 mt-2 flex flex-col gap-3">
            <button
              onClick={handleSavePrice}
              disabled={!pricing}
              className="bg-primary text-white hover:bg-surface-tint font-bold text-sm py-3 px-6 rounded-xl flex items-center justify-center gap-2 transition-all active:translate-y-0.5 shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {savedPrice ? <Check className="size-5" /> : <Save className="size-5" />}
              {savedPrice ? "Harga Berhasil Dikunci!" : "Kunci & Simpan Harga Ekspor"}
            </button>
            <p className="text-[10px] text-on-surface-variant text-center font-medium leading-normal">
              *Mengunci harga akan memperbarui target harga CIF pada modul negosiasi
              {selectedBuyer ? ` dengan ${selectedBuyer.name}` : ""} secara otomatis.
            </p>
          </div>
        </section>

        {/* RIGHT: Breakdown + benchmark */}
        <section className="lg:col-span-7 flex flex-col gap-6">
          <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-6 md:p-8 shadow-sm flex flex-col gap-5">
            <div className="flex justify-between items-center border-b border-outline-variant pb-3">
              <div className="flex items-center gap-2.5">
                <Receipt className="text-primary size-6" />
                <h2 className="text-base font-bold text-primary uppercase tracking-wider">Breakdown Harga Ekspor</h2>
              </div>
              <Badge variant="neutral" className="normal-case font-mono">
                1 USD = Rp {rate.toLocaleString("id-ID")}
              </Badge>
            </div>

            {status === "error" ? (
              <div className="border border-dashed border-error/40 bg-error/5 rounded-xl p-8 text-center text-sm text-error flex flex-col items-center gap-2">
                <AlertTriangle className="size-6" />
                Gagal menghitung harga dari backend. Pastikan layanan readiness aktif, lalu ubah salah satu nilai untuk mencoba lagi.
              </div>
            ) : (
              <div className="relative overflow-x-auto">
                {busy && (
                  <div className="absolute inset-0 bg-surface-container-lowest/60 flex items-center justify-center z-10">
                    <Loader2 className="size-5 animate-spin text-primary" />
                  </div>
                )}
                <table className="w-full text-left border-collapse text-xs md:text-sm">
                  <thead>
                    <tr className="border-b border-outline-variant text-[10px] uppercase font-bold text-on-surface-variant tracking-wider bg-surface-container-low">
                      <th className="p-3">Komponen Biaya</th>
                      <th className="p-3 text-right">Nilai (USD)</th>
                      <th className="p-3 text-right">Estimasi (IDR)</th>
                      <th className="p-3">Formulasi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant/60 font-medium text-on-surface">
                    <Row name="Harga Pokok Produksi (EXW)" usdVal={usd(hpp)} idrVal={idr(hpp * rate)} note="Harga pintu pabrik" bold />
                    <Row name={`Ditambah: Profit Margin (${margin}%)`} usdVal={`+${usd(profitAmt)}`} idrVal={`+${idr(profitAmt * rate)}`} note="HPP × Margin%" tone="secondary" />
                    <Row name="Ditambah: Ongkir Domestik & Port" usdVal={`+${usd(localHandling)}`} idrVal={`+${idr(localHandling * rate)}`} note="Handling pelabuhan lokal" />
                    <Row name={`Ditambah: Bea Keluar / Pajak (${exportDutyPct}%)`} usdVal={`+${usd(dutyAmt)}`} idrVal={`+${idr(dutyAmt * rate)}`} note="Basis FOB × Bea%" tone="error" />
                    <Row name="1. Nilai FOB (Free on Board)" usdVal={usd(fobUnit)} idrVal={idr(nOf(pricing?.idr.fobUnit))} note="HPP + Profit + Local + Bea" highlight="primary" />
                    <Row name="Ditambah: Ocean Freight Internasional" usdVal={`+${usd(freight)}`} idrVal={`+${idr(freight * rate)}`} note="Angkutan laut internasional" />
                    <Row name="2. Nilai CFR (Cost & Freight)" usdVal={usd(cfrUnit)} idrVal={idr(nOf(pricing?.idr.cfrTotal))} note="FOB + Freight" highlight="soft" />
                    <Row name="Ditambah: Asuransi Maritim" usdVal={`+${usd(nOf(pricing?.insuranceAmount))}`} idrVal={`+${idr(nOf(pricing?.insuranceAmount) * rate)}`} note="Asuransi laut internasional" />
                    <Row name="3. Nilai CIF (Cost, Ins, Freight)" usdVal={usd(cifUnit)} idrVal={idr(nOf(pricing?.idr.perUnitCIF))} note="CFR + Insurance" highlight="secondary" />
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Benchmark card — REAL BPS unit value (or an honest "not available") */}
          <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-6 shadow-sm flex flex-col gap-4">
            <div className="flex justify-between items-center border-b border-outline-variant pb-2.5">
              <h3 className="text-xs font-bold text-primary uppercase tracking-wider flex items-center gap-1.5">
                <BarChart3 className="text-primary size-4.5" /> Benchmark Nilai Satuan Ekspor BPS
              </h3>
              <Badge
                variant={
                  gaugeStatus === "competitive"
                    ? "success"
                    : gaugeStatus === "high"
                      ? "danger"
                      : gaugeStatus === "low"
                        ? "info"
                        : "neutral"
                }
              >
                {gaugeStatus === "competitive"
                  ? "Kompetitif"
                  : gaugeStatus === "high"
                    ? "Di Atas Pasar"
                    : gaugeStatus === "low"
                      ? "Di Bawah Pasar (Risiko Dumping)"
                      : "Benchmark tidak tersedia"}
              </Badge>
            </div>

            {bench != null ? (
              <>
                <div className="flex flex-col gap-2.5 my-2">
                  <div className="relative w-full h-4 bg-surface-container-high border border-outline-variant rounded-full overflow-hidden flex">
                    <div className="h-full bg-info/40 border-r border-outline-variant" style={{ width: `${(0.92 / 2) * 100}%` }} title="Murah" />
                    <div className="h-full bg-secondary/40 border-r border-outline-variant" style={{ width: `${((1.05 - 0.92) / 2) * 100}%` }} title="Ideal" />
                    <div className="h-full bg-error/40" style={{ width: `${((2 - 1.05) / 2) * 100}%` }} title="Mahal" />
                    <div
                      className="absolute top-0 bottom-0 w-1 bg-primary transition-all duration-500 shadow-lg"
                      style={{ left: `${Math.min(Math.max((cifUnit / (bench * 2)) * 100, 3), 97)}%` }}
                    >
                      <div className="absolute -top-1.5 -left-1 w-3 h-3 bg-primary rounded-full border border-white"></div>
                    </div>
                  </div>
                  <div className="flex justify-between text-[10px] text-on-surface-variant font-mono">
                    <span>Rendah (&lt; {usd(bench * 0.92)})</span>
                    <span className="font-bold text-secondary">
                      Ideal ({usd(bench * 0.92)} - {usd(bench * 1.05)})
                    </span>
                    <span>Tinggi (&gt; {usd(bench * 1.05)})</span>
                  </div>
                </div>

                <div className="bg-primary/5 p-4 rounded-xl flex items-start gap-3 border border-primary/10">
                  <Lightbulb className="text-primary size-5" />
                  <div className="text-xs leading-relaxed text-on-surface">
                    <strong>Analisis Kelayakan Ekspor:</strong> Nilai satuan ekspor rata-rata BPS untuk HS{" "}
                    {hsCode || "—"} adalah <strong>{usd(bench)}/{UNIT}</strong> (sumber: data BPS <code>trade_flows</code>).{" "}
                    {gaugeStatus === "competitive" ? (
                      <span>
                        Harga CIF Anda (<strong>{usd(cifUnit)}/{UNIT}</strong>) selaras dengan benchmark pasar (selisih {dev}%). Pembeli cenderung menerima harga ini.
                      </span>
                    ) : gaugeStatus === "high" ? (
                      <span>
                        Harga CIF Anda (<strong>{usd(cifUnit)}/{UNIT}</strong>) sekitar {dev}% di atas benchmark. Pertimbangkan menurunkan margin atau ongkos untuk meningkatkan peluang deal.
                      </span>
                    ) : (
                      <span>
                        Harga CIF Anda (<strong>{usd(cifUnit)}/{UNIT}</strong>) sekitar {dev}% di bawah benchmark. Pastikan kualitas terjaga dan waspadai kecurigaan dumping oleh otoritas bea cukai tujuan.
                      </span>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <div className="bg-surface-container-low p-4 rounded-xl flex items-start gap-3 border border-outline-variant">
                <Info className="text-on-surface-variant size-5" />
                <div className="text-xs leading-relaxed text-on-surface-variant">
                  Benchmark nilai satuan ekspor BPS belum tersedia untuk HS{" "}
                  <strong>{hsCode || "produk ini"}</strong>. Simulasi biaya di atas tetap akurat; perbandingan pasar akan aktif otomatis setelah data ekspor BPS untuk HS tersebut tersinkron ke database.
                </div>
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}

// ── Small presentational helpers ────────────────────────────────────────────────
function Slider({
  label,
  value,
  min,
  max,
  step,
  current,
  onChange,
  ticks,
}: {
  label: React.ReactNode;
  value: string;
  min: number;
  max: number;
  step: number;
  current: number;
  onChange: (v: number) => void;
  ticks: [string, string, string];
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex justify-between text-xs font-semibold">
        <span className="text-on-surface-variant">{label}</span>
        <span className="font-mono text-primary font-bold">{value}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={current}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full h-1.5 bg-surface-container-high rounded-lg appearance-none cursor-pointer accent-primary"
      />
      <div className="flex justify-between text-[9px] text-on-surface-variant font-mono">
        <span>{ticks[0]}</span>
        <span>{ticks[1]}</span>
        <span>{ticks[2]}</span>
      </div>
    </div>
  );
}

function Row({
  name,
  usdVal,
  idrVal,
  note,
  bold,
  tone,
  highlight,
}: {
  name: string;
  usdVal: string;
  idrVal: string;
  note: string;
  bold?: boolean;
  tone?: "secondary" | "error";
  highlight?: "primary" | "secondary" | "soft";
}) {
  const rowClass =
    highlight === "primary"
      ? "bg-primary/5 hover:bg-primary/10"
      : highlight === "secondary"
        ? "bg-secondary/10 hover:bg-secondary/15"
        : highlight === "soft"
          ? "bg-surface-container-low/40 hover:bg-surface-container-low"
          : "hover:bg-surface-container-low/20";
  const valColor =
    highlight === "primary"
      ? "text-primary font-bold"
      : highlight === "secondary"
        ? "text-secondary font-bold"
        : highlight === "soft"
          ? "text-primary font-semibold"
          : tone === "secondary"
            ? "text-secondary"
            : tone === "error"
              ? "text-error"
              : "";
  const nameColor =
    highlight === "primary"
      ? "font-bold text-primary"
      : highlight === "secondary"
        ? "font-bold text-secondary"
        : highlight === "soft"
          ? "font-semibold text-primary"
          : bold
            ? "font-semibold"
            : "";
  const noteColor = highlight ? "font-bold" : "text-on-surface-variant";
  return (
    <tr className={rowClass}>
      <td className={`p-3 ${nameColor}`}>{name}</td>
      <td className={`p-3 text-right font-mono ${valColor}`}>{usdVal}</td>
      <td className={`p-3 text-right font-mono ${valColor}`}>{idrVal}</td>
      <td className={`p-3 text-[11px] ${noteColor}`}>{note}</td>
    </tr>
  );
}
