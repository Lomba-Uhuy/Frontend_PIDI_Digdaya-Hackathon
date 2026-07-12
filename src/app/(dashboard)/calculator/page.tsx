"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getStep, setFinalPrice } from "../../../lib/state";
import { calculatePrice } from "../../../lib/api";
import {
  BarChart3,
  Check,
  Info,
  Lightbulb,
  MessagesSquare,
  Receipt,
  Save,
  SlidersHorizontal,
} from "lucide-react";
import { Badge } from "../../../components/ui/badge";

export default function ExportCalculatorPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState("onboarding");

  // Input states
  const [hpp, setHpp] = useState(2.00);
  const [margin, setMargin] = useState(15);
  const [localHandling, setLocalHandling] = useState(0.15);
  const [freight, setFreight] = useState(0.20);
  const [insurance, setInsurance] = useState(0.10);
  const [exportDuty, setExportDuty] = useState(5); // in %

  // Dynamic state
  const [productName, setProductName] = useState("Premium Robusta Coffee Beans");
  const [productType, setProductType] = useState("coffee");

  // Calculation output state
  const [isCalculated, setIsCalculated] = useState(true);
  const [savedPrice, setSavedPrice] = useState<number | null>(null);

  useEffect(() => {
    setCurrentStep(getStep());
    if (typeof window !== "undefined") {
      const savedProduct = localStorage.getItem("tradeconnect_product_name") || "Premium Robusta Coffee Beans";
      setProductName(savedProduct);
      const savedType = localStorage.getItem("tradeconnect_product_type") || "coffee";
      setProductType(savedType);

      const savedFloor = localStorage.getItem("tradeconnect_floor_price");
      const isRattan = savedProduct.toLowerCase().includes("rotan") || savedProduct.toLowerCase().includes("rattan") || savedProduct.toLowerCase().includes("kursi");
      
      if (isRattan) {
        setHpp(savedFloor ? parseFloat(savedFloor) : 40.00);
        setLocalHandling(3.00);
        setFreight(10.00);
        setInsurance(2.00);
      } else {
        setHpp(savedFloor ? parseFloat(savedFloor) : 2.00);
        setLocalHandling(0.15);
        setFreight(0.20);
        setInsurance(0.10);
      }
    }
  }, []);

  const unitLabel = productType === "rattan" ? "pcs" : "kg";

  // Compute values
  // Formula formal: 
  // Base FOB = HPP + Profit Margin + Local Handling
  const profitAmt = hpp * (margin / 100);
  const baseFob = hpp + profitAmt + localHandling;
  
  // Bea Ekspor (applied to FOB)
  const dutyAmt = baseFob * (exportDuty / 100);
  const finalFob = baseFob + dutyAmt;
  
  // CFR = finalFob + Freight
  const finalCfr = finalFob + freight;
  
  // CIF = finalCfr + Insurance
  const finalCif = finalCfr + insurance;
  
  // Benchmark
  const marketAvg = productType === "rattan" ? 55.00 : 2.80; // BPS Robusta unit value in USD/kg or Furnitures
  let status: "competitive" | "high" | "low" = "competitive";
  if (finalCif > marketAvg * 1.05) {
    status = "high";
  } else if (finalCif < marketAvg * 0.92) {
    status = "low";
  }

  const handleSavePrice = () => {
    setFinalPrice(parseFloat(finalCif.toFixed(2)));
    setSavedPrice(parseFloat(finalCif.toFixed(2)));
    setTimeout(() => {
      setSavedPrice(null);
    }, 2000);
  };

  return (
    <main className="flex-1 overflow-y-auto p-6 md:p-8 h-full bg-surface-bright flex flex-col gap-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-outline-variant pb-5 flex-shrink-0">
        <div>
          <h1 className="text-2xl font-black text-primary font-heading">Kalkulator Ekspor Mandiri</h1>
          <p className="text-sm text-on-surface-variant mt-1">
            Simulasikan struktur biaya ekspor Ex-Works sampai ke CIF negara tujuan secara akurat.
          </p>
        </div>
        <button 
          onClick={() => router.push('/negotiation')}
          className="bg-primary text-white hover:bg-surface-tint font-bold text-xs py-2.5 px-5 rounded-lg flex items-center gap-2 transition-all shadow-md"
        >
          <MessagesSquare className="size-4" />
          Buka Pusat Negosiasi
        </button>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* ========================================================================= */}
        {/* LEFT COLUMN: Input Form (6 cols) */}
        {/* ========================================================================= */}
        <section className="lg:col-span-5 bg-surface-container-lowest border border-outline-variant rounded-2xl p-6 md:p-8 shadow-sm flex flex-col gap-6">
          <div className="flex items-center gap-2.5 border-b border-outline-variant pb-3">
            <SlidersHorizontal className="text-primary size-6" />
            <h2 className="text-base font-bold text-primary uppercase tracking-wider">Komponen Biaya Ekspor</h2>
          </div>

          <div className="flex flex-col gap-5">
            {/* 1. HPP / Ex-Works */}
            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-on-surface-variant flex items-center gap-1">
                  Harga Pokok Produksi (HPP/EXW)
                  <span title="Harga produk dasar di pintu gudang Anda (Ex-Works) sebelum logistik.">
                    <Info className="text-on-surface-variant size-3.5" />
                  </span>
                </span>
                <span className="font-mono text-primary font-bold">${hpp.toFixed(2)}/{unitLabel}</span>
              </div>
              <input 
                type="range" 
                min={productType === "rattan" ? "20.00" : "0.50"} 
                max={productType === "rattan" ? "80.00" : "4.00"} 
                step={productType === "rattan" ? "1.00" : "0.05"}
                value={hpp}
                onChange={(e) => setHpp(parseFloat(e.target.value))}
                className="w-full h-1.5 bg-surface-container-high rounded-lg appearance-none cursor-pointer accent-primary"
              />
              <div className="flex justify-between text-[9px] text-on-surface-variant font-mono">
                <span>{productType === "rattan" ? "$20.00" : "$0.50"}</span>
                <span>{productType === "rattan" ? "$50.00" : "$2.00"}</span>
                <span>{productType === "rattan" ? "$80.00" : "$4.00"}</span>
              </div>
            </div>

            {/* 2. Profit Margin */}
            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-on-surface-variant">Profit Margin Yang Diinginkan</span>
                <span className="font-mono text-primary font-bold">{margin}%</span>
              </div>
              <input 
                type="range" 
                min="5" 
                max="50" 
                step="1"
                value={margin}
                onChange={(e) => setMargin(parseInt(e.target.value))}
                className="w-full h-1.5 bg-surface-container-high rounded-lg appearance-none cursor-pointer accent-primary"
              />
              <div className="flex justify-between text-[9px] text-on-surface-variant font-mono">
                <span>5%</span>
                <span>25%</span>
                <span>50%</span>
              </div>
            </div>

            {/* 3. Ongkir Domestik & Port Handling */}
            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-on-surface-variant">Ongkir Domestik & Handling Port</span>
                <span className="font-mono text-primary font-bold">${localHandling.toFixed(2)}/{unitLabel}</span>
              </div>
              <input 
                type="range" 
                min={productType === "rattan" ? "1.00" : "0.05"} 
                max={productType === "rattan" ? "10.00" : "0.50"} 
                step={productType === "rattan" ? "0.50" : "0.01"}
                value={localHandling}
                onChange={(e) => setLocalHandling(parseFloat(e.target.value))}
                className="w-full h-1.5 bg-surface-container-high rounded-lg appearance-none cursor-pointer accent-primary"
              />
              <div className="flex justify-between text-[9px] text-on-surface-variant font-mono">
                <span>{productType === "rattan" ? "$1.00" : "$0.05"}</span>
                <span>{productType === "rattan" ? "$5.00" : "$0.25"}</span>
                <span>{productType === "rattan" ? "$10.00" : "$0.50"}</span>
              </div>
            </div>

            {/* 4. Bea Ekspor (Export Duty) */}
            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-on-surface-variant">Bea Keluar / Pajak Ekspor</span>
                <span className="font-mono text-primary font-bold">{exportDuty}%</span>
              </div>
              <input 
                type="range" 
                min="0" 
                max="25" 
                step="1"
                value={exportDuty}
                onChange={(e) => setExportDuty(parseInt(e.target.value))}
                className="w-full h-1.5 bg-surface-container-high rounded-lg appearance-none cursor-pointer accent-primary"
              />
              <div className="flex justify-between text-[9px] text-on-surface-variant font-mono">
                <span>0% (Bebas Bea)</span>
                <span>12%</span>
                <span>25%</span>
              </div>
            </div>

            {/* 5. Freight Internasional */}
            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-on-surface-variant">Ocean Freight Internasional (Hamburg)</span>
                <span className="font-mono text-primary font-bold">${freight.toFixed(2)}/{unitLabel}</span>
              </div>
              <input 
                type="range" 
                min={productType === "rattan" ? "2.00" : "0.05"} 
                max={productType === "rattan" ? "30.00" : "0.80"} 
                step={productType === "rattan" ? "0.50" : "0.01"}
                value={freight}
                onChange={(e) => setFreight(parseFloat(e.target.value))}
                className="w-full h-1.5 bg-surface-container-high rounded-lg appearance-none cursor-pointer accent-primary"
              />
              <div className="flex justify-between text-[9px] text-on-surface-variant font-mono">
                <span>{productType === "rattan" ? "$2.00" : "$0.05"}</span>
                <span>{productType === "rattan" ? "$16.00" : "$0.40"}</span>
                <span>{productType === "rattan" ? "$30.00" : "$0.80"}</span>
              </div>
            </div>

            {/* 6. Asuransi Laut (Marine Insurance) */}
            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-on-surface-variant">Asuransi Maritim Internasional</span>
                <span className="font-mono text-primary font-bold">${insurance.toFixed(2)}/{unitLabel}</span>
              </div>
              <input 
                type="range" 
                min={productType === "rattan" ? "0.50" : "0.02"} 
                max={productType === "rattan" ? "5.00" : "0.30"} 
                step={productType === "rattan" ? "0.10" : "0.01"}
                value={insurance}
                onChange={(e) => setInsurance(parseFloat(e.target.value))}
                className="w-full h-1.5 bg-surface-container-high rounded-lg appearance-none cursor-pointer accent-primary"
              />
              <div className="flex justify-between text-[9px] text-on-surface-variant font-mono">
                <span>{productType === "rattan" ? "$0.50" : "$0.02"}</span>
                <span>{productType === "rattan" ? "$2.75" : "$0.15"}</span>
                <span>{productType === "rattan" ? "$5.00" : "$0.30"}</span>
              </div>
            </div>
          </div>

          <div className="border-t border-outline-variant pt-5 mt-2 flex flex-col gap-3">
            <button 
              onClick={handleSavePrice}
              className="bg-primary text-white hover:bg-surface-tint font-bold text-sm py-3 px-6 rounded-xl flex items-center justify-center gap-2 transition-all active:translate-y-0.5 shadow-md"
            >
              {savedPrice ? <Check className="size-5" /> : <Save className="size-5" />}
              {savedPrice ? "Harga Berhasil Dikunci!" : "Kunci & Simpan Harga Ekspor"}
            </button>
            <p className="text-[10px] text-on-surface-variant text-center font-medium leading-normal">
              *Mengunci harga akan memperbarui target harga CIF akhir pada modul negosiasi Anda dengan Klaus Weber secara otomatis.
            </p>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* RIGHT COLUMN: Output Breakdown Table & Metrics (7 cols) */}
        {/* ========================================================================= */}
        <section className="lg:col-span-7 flex flex-col gap-6">
          {/* TABULAR BREAKDOWN CARD */}
          <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-6 md:p-8 shadow-sm flex flex-col gap-5">
            <div className="flex justify-between items-center border-b border-outline-variant pb-3">
              <div className="flex items-center gap-2.5">
                <Receipt className="text-primary size-6" />
                <h2 className="text-base font-bold text-primary uppercase tracking-wider">Breakdown Harga Ekspor Resmi</h2>
              </div>
              <Badge variant="neutral" className="normal-case font-mono">1 USD = Rp 16.000</Badge>
            </div>

            {/* Price Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs md:text-sm">
                <thead>
                  <tr className="border-b border-outline-variant text-[10px] uppercase font-bold text-on-surface-variant tracking-wider bg-surface-container-low">
                    <th className="p-3">Komponen Biaya</th>
                    <th className="p-3 text-right">Nilai (USD)</th>
                    <th className="p-3 text-right">Estimasi (IDR)</th>
                    <th className="p-3">Formulasi Kalkulasi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/60 font-medium text-on-surface">
                  {/* HPP */}
                  <tr className="hover:bg-surface-container-low/20">
                    <td className="p-3 font-semibold">Harga Pokok Produksi (EXW)</td>
                    <td className="p-3 text-right font-mono">${hpp.toFixed(2)}</td>
                    <td className="p-3 text-right font-mono">Rp {(hpp * 16000).toLocaleString()}</td>
                    <td className="p-3 text-on-surface-variant text-[11px]">Harga pintu pabrik</td>
                  </tr>
                  
                  {/* Profit */}
                  <tr className="hover:bg-surface-container-low/20">
                    <td className="p-3">Ditambah: Profit Margin ({margin}%)</td>
                    <td className="p-3 text-right font-mono text-secondary">+${profitAmt.toFixed(2)}</td>
                    <td className="p-3 text-right font-mono text-secondary">+Rp {(profitAmt * 16000).toLocaleString()}</td>
                    <td className="p-3 text-on-surface-variant text-[11px]">HPP × Margin%</td>
                  </tr>

                  {/* Local Handling */}
                  <tr className="hover:bg-surface-container-low/20">
                    <td className="p-3">Ditambah: Ongkir Domestik & Port</td>
                    <td className="p-3 text-right font-mono">+${localHandling.toFixed(2)}</td>
                    <td className="p-3 text-right font-mono">+Rp {(localHandling * 16000).toLocaleString()}</td>
                    <td className="p-3 text-on-surface-variant text-[11px]">Handling pelabuhan lokal</td>
                  </tr>

                  {/* Bea Keluar */}
                  <tr className="hover:bg-surface-container-low/20">
                    <td className="p-3">Ditambah: Bea Keluar / Pajak ({exportDuty}%)</td>
                    <td className="p-3 text-right font-mono text-error">+${dutyAmt.toFixed(2)}</td>
                    <td className="p-3 text-right font-mono text-error">+Rp {(dutyAmt * 16000).toLocaleString()}</td>
                    <td className="p-3 text-on-surface-variant text-[11px]">FOB Awal × Bea%</td>
                  </tr>

                  {/* FOB */}
                  <tr className="bg-primary/5 hover:bg-primary/10">
                    <td className="p-3 font-bold text-primary">1. Nilai FOB (Free on Board)</td>
                    <td className="p-3 text-right font-mono font-bold text-primary">${finalFob.toFixed(2)}</td>
                    <td className="p-3 text-right font-mono font-bold text-primary">Rp {(finalFob * 16000).toLocaleString()}</td>
                    <td className="p-3 text-primary text-[11px] font-bold">HPP + Profit + Local + Bea</td>
                  </tr>

                  {/* Freight */}
                  <tr className="hover:bg-surface-container-low/20">
                    <td className="p-3">Ditambah: Ocean Freight Internasional</td>
                    <td className="p-3 text-right font-mono">+${freight.toFixed(2)}</td>
                    <td className="p-3 text-right font-mono">+Rp {(freight * 16000).toLocaleString()}</td>
                    <td className="p-3 text-on-surface-variant text-[11px]">Kapal laut Hamburg</td>
                  </tr>

                  {/* CFR */}
                  <tr className="bg-surface-container-low/40 hover:bg-surface-container-low">
                    <td className="p-3 font-semibold text-primary">2. Nilai CFR (Cost & Freight)</td>
                    <td className="p-3 text-right font-mono font-semibold text-primary">${finalCfr.toFixed(2)}</td>
                    <td className="p-3 text-right font-mono font-semibold text-primary">Rp {(finalCfr * 16000).toLocaleString()}</td>
                    <td className="p-3 text-on-surface-variant text-[11px]">FOB Final + Freight</td>
                  </tr>

                  {/* Insurance */}
                  <tr className="hover:bg-surface-container-low/20">
                    <td className="p-3">Ditambah: Asuransi Maritim</td>
                    <td className="p-3 text-right font-mono">+${insurance.toFixed(2)}</td>
                    <td className="p-3 text-right font-mono">+Rp {(insurance * 16000).toLocaleString()}</td>
                    <td className="p-3 text-on-surface-variant text-[11px]">Asuransi laut internasional</td>
                  </tr>

                  {/* CIF */}
                  <tr className="bg-secondary/10 hover:bg-secondary/15">
                    <td className="p-3 font-bold text-secondary">3. Nilai CIF (Cost, Ins, Freight)</td>
                    <td className="p-3 text-right font-mono font-bold text-secondary">${finalCif.toFixed(2)}</td>
                    <td className="p-3 text-right font-mono font-bold text-secondary">Rp {(finalCif * 16000).toLocaleString()}</td>
                    <td className="p-3 text-secondary text-[11px] font-bold">CFR + Insurance</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* BPS MARKET GAUGE CARD */}
          <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-6 shadow-sm flex flex-col gap-4">
            <div className="flex justify-between items-center border-b border-outline-variant pb-2.5">
              <h3 className="text-xs font-bold text-primary uppercase tracking-wider flex items-center gap-1.5">
                <BarChart3 className="text-primary size-[18px]" /> Benchmark Unit Value BPS
              </h3>
              <Badge variant={status === "competitive" ? "success" : status === "high" ? "danger" : "info"}>
                {status === "competitive" ? "Kompetitif Pasar Eropa" : status === "high" ? "Terlalu Mahal" : "Di Bawah Pasar (Risiko Dumping)"}
              </Badge>
            </div>

            {/* Visual Bar / Gauge */}
            <div className="flex flex-col gap-2.5 my-2">
              <div className="relative w-full h-4 bg-surface-container-high border border-outline-variant rounded-full overflow-hidden flex">
                <div className="w-[30%] h-full bg-info/40 border-r border-outline-variant" title="Murah"></div>
                <div className="w-[45%] h-full bg-secondary/40 border-r border-outline-variant" title="Ideal"></div>
                <div className="w-[25%] h-full bg-error/40" title="Mahal"></div>

                {/* Marker pointer of calculated CIF value relative to benchmark */}
                <div 
                  className="absolute top-0 bottom-0 w-1 bg-primary transition-all duration-500 shadow-lg"
                  style={{ left: `${Math.min(Math.max((finalCif / (productType === "rattan" ? 100.0 : 4.0)) * 100, 5), 95)}%` }}
                >
                  <div className="absolute -top-1.5 -left-1 w-3 h-3 bg-primary rounded-full border border-white"></div>
                </div>
              </div>

              <div className="flex justify-between text-[10px] text-on-surface-variant font-mono">
                <span>Rendah ({productType === "rattan" ? "< $48.00" : "< $2.55"})</span>
                <span className="font-bold text-secondary">Ideal ({productType === "rattan" ? "$48.00 - $58.00" : "$2.55 - $2.95"})</span>
                <span>Tinggi ({productType === "rattan" ? "> $58.00" : "> $2.95"})</span>
              </div>
            </div>

            {/* Explanatory block */}
            <div className="bg-primary/5 p-4 rounded-xl flex items-start gap-3 border border-primary/10">
              <Lightbulb className="text-primary size-5" />
              <div className="text-xs leading-relaxed text-on-surface">
                <strong>Analisis Kelayakan Ekspor:</strong> {productType === "rattan" ? "Furnitur Kursi Rotan dengan HS Code 9401.52" : "Biji kopi robusta dengan HS Code 0901.11"} di Jerman mencatat rata-rata harga pasar impor BPS sebesar <strong>${marketAvg.toFixed(2)}/{unitLabel}</strong>. 
                {status === "competitive" ? (
                  <span> Harga penawaran CIF Anda (<strong>${finalCif.toFixed(2)}/{unitLabel}</strong>) sangat bersaing. Pembeli dari Eropa Barat cenderung menyetujui transaksi ini karena margin keuntungan mereka aman dan sesuai harga standar Uni Eropa.</span>
                ) : status === "high" ? (
                  <span> Harga penawaran CIF Anda (<strong>${finalCif.toFixed(2)}/{unitLabel}</strong>) berada di atas harga pasar. Ini dapat memicu negosiasi panjang. Pertimbangkan menurunkan target profit margin atau memotong ongkos Handling lokal untuk meningkatkan tingkat keberhasilan deal.</span>
                ) : (
                  <span> Harga penawaran CIF Anda (<strong>${finalCif.toFixed(2)}/{unitLabel}</strong>) sangat murah. Pastikan kualitas produk {productType === "rattan" ? "furnitur rotan Jepara" : "robusta Grade 1 premium"} tetap terjaga dan berhati-hatilah terhadap kecurigaan produk di bawah standar (dumping) oleh otoritas bea cukai Hamburg.</span>
                )}
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
