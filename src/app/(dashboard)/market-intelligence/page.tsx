"use client";
import React, { useState, useEffect } from "react";

export default function MarketIntelligencePage() {
  const [hsCode, setHsCode] = useState("0901.11"); // 0901.11 (Kopi) or 9401.52 (Rotan)
  const [region, setRegion] = useState("global"); // global, eu, na
  
  // Custom high-fidelity modal & interactive states
  const [showReportModal, setShowReportModal] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [toast, setToast] = useState<{ message: string } | null>(null);

  useEffect(() => {
    // Sync with main productType if present in localStorage
    if (typeof window !== "undefined") {
      const savedType = localStorage.getItem("tradeconnect_product_type");
      if (savedType === "rattan") {
        setHsCode("9401.52");
      } else {
        setHsCode("0901.11");
      }
    }
  }, []);

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
    const isCoffee = hsCode === "0901.11";
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
   - Gunakan generator email pintar AI TradeConnect untuk menjangkau pembeli terdaftar (Klaus Weber) secara instan.

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

  const isCoffee = hsCode === "0901.11";

  return (
    <div className="h-full w-full overflow-y-auto p-4 md:p-8 bg-surface-bright font-sans text-on-surface">
      <div className="max-w-6xl mx-auto space-y-6 pb-12">
        
        {/* Header Section */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[#070235]">Eksplorasi Intelijen Pasar</h1>
            <p className="text-sm text-on-surface-variant mt-1 flex items-center gap-2 font-medium">
              <span className="w-2 h-2 rounded-full bg-secondary"></span>
              Aliran data langsung terhubung dengan UN Comtrade &amp; BPS
            </p>
          </div>
          
          <div className="flex items-center gap-3 w-full lg:w-auto">
            <div className="flex-1 lg:flex-none border border-outline-variant rounded-md bg-surface-container-lowest flex text-sm overflow-hidden shadow-sm">
              {/* HS Code Selection dropdown */}
              <div className="px-4 py-2 hover:bg-surface-container-low transition-colors relative flex flex-col justify-center min-w-[200px]">
                <div className="text-[10px] font-bold text-on-surface-variant uppercase mb-0.5 tracking-wider">KODE HS / KOMODITAS</div>
                <div className="relative flex items-center">
                  <span className="material-symbols-outlined text-[16px] text-primary mr-1">barcode</span>
                  <select 
                    value={hsCode}
                    onChange={(e) => setHsCode(e.target.value)}
                    className="bg-transparent font-semibold text-on-surface outline-none appearance-none pr-6 cursor-pointer text-xs w-full"
                  >
                    <option value="0901.11">0901.11 - Kopi Robusta Premium</option>
                    <option value="9401.52">9401.52 - Kursi Rotan Handcrafted</option>
                  </select>
                  <span className="material-symbols-outlined text-[16px] absolute right-0 pointer-events-none text-on-surface-variant">expand_more</span>
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
                    <option value="eu">Uni Eropa (EU27)</option>
                    <option value="na">Amerika Utara</option>
                  </select>
                  <span className="material-symbols-outlined text-[16px] absolute right-0 pointer-events-none text-on-surface-variant">expand_more</span>
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
              <h2 className="text-base font-bold text-[#070235] flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">public</span>
                Peta Panas Volume Impor Global
              </h2>
              <div className="flex gap-2 text-[10px] font-bold uppercase tracking-wider">
                <span className="bg-secondary-container text-on-secondary-container px-2 py-1 rounded">VOL: USD</span>
                <span className="bg-surface-container-highest text-on-surface-variant px-2 py-1 rounded border border-outline-variant">2023 YTD</span>
              </div>
            </div>
            
            <div className="relative flex-1 bg-[#dff3f0] min-h-[400px] flex items-center justify-center overflow-hidden transition-all duration-500">
              {/* Map Illustration Placeholder */}
              <div className="absolute inset-0 opacity-80" style={{
                backgroundImage: 'radial-gradient(circle at center, #68dba9 0%, transparent 70%)',
                backgroundSize: '100% 100%'
              }}></div>
              
              {/* Decorative nodes - dynamic based on HS Code */}
              {isCoffee ? (
                <>
                  {/* Germany */}
                  <div className="absolute top-[28%] left-[48%] w-5 h-5 bg-primary rounded-full shadow-[0_0_0_8px_rgba(7,2,53,0.25)] animate-pulse z-10" title="Jerman (Volume Impor Tinggi)"></div>
                  {/* Netherlands */}
                  <div className="absolute top-[26%] left-[45%] w-4.5 h-4.5 bg-primary rounded-full shadow-[0_0_0_6px_rgba(7,2,53,0.2)] animate-pulse z-10" style={{ animationDelay: '0.4s' }} title="Belanda"></div>
                  {/* USA */}
                  <div className="absolute top-[35%] left-[22%] w-4 h-4 bg-primary rounded-full shadow-[0_0_0_6px_rgba(7,2,53,0.2)] animate-pulse z-10" style={{ animationDelay: '0.8s' }} title="Amerika Serikat"></div>
                </>
              ) : (
                <>
                  {/* Germany */}
                  <div className="absolute top-[28%] left-[48%] w-5 h-5 bg-primary rounded-full shadow-[0_0_0_8px_rgba(7,2,53,0.25)] animate-pulse z-10" title="Jerman (Volume Impor Furnitur Tinggi)"></div>
                  {/* France */}
                  <div className="absolute top-[32%] left-[44%] w-4 h-4 bg-primary rounded-full shadow-[0_0_0_6px_rgba(7,2,53,0.2)] animate-pulse z-10" style={{ animationDelay: '0.6s' }} title="Prancis"></div>
                  {/* Japan */}
                  <div className="absolute top-[38%] right-[15%] w-4.5 h-4.5 bg-primary rounded-full shadow-[0_0_0_6px_rgba(7,2,53,0.2)] animate-pulse z-10" style={{ animationDelay: '1.2s' }} title="Jepang"></div>
                </>
              )}
 
              {/* Map legend */}
              <div className="absolute bottom-6 right-6 bg-surface-container-lowest/95 backdrop-blur border border-outline-variant rounded-lg p-3 shadow-md z-10">
                <div className="text-[10px] font-bold text-on-surface-variant uppercase mb-2">VOLUME IMPOR ({isCoffee ? "Kopi" : "Rotan"})</div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-on-surface-variant">Rendah</span>
                  <div className="w-32 h-2 bg-gradient-to-r from-surface-variant to-secondary rounded-full"></div>
                  <span className="text-xs font-bold text-secondary">Tinggi</span>
                </div>
              </div>
 
              {/* Central stylized continent shapes to look like the design */}
              <div className="w-full h-full relative opacity-40 text-secondary-fixed mix-blend-multiply select-none">
                 <svg viewBox="0 0 1000 500" className="w-full h-full" preserveAspectRatio="xMidYMid slice">
                    <path d="M200,150 Q250,120 300,180 T250,250 T150,300 T180,200 Z" fill="currentColor" />
                    <path d="M450,100 Q550,80 600,150 T500,300 T400,250 T420,150 Z" fill="currentColor" />
                    <path d="M700,150 Q800,120 850,200 T750,350 T650,250 Z" fill="currentColor" />
                 </svg>
              </div>
            </div>
          </div>
 
          {/* Right Panel: AI Mentor Insights */}
          <div className="bg-surface-container-lowest border-2 border-primary-fixed rounded-xl p-6 shadow-sm flex flex-col h-full justify-between">
            <div>
              <h2 className="text-lg font-bold text-primary flex items-center gap-2 mb-4">
                <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
                Wawasan Mentor AI
              </h2>
              
              <p className="text-sm text-on-surface leading-relaxed mb-6 font-medium">
                {isCoffee ? (
                  <>
                    Analisis Kopi <strong>HS 0901.11</strong> menunjukkan lonjakan permintaan sebesar 14% dari <strong>Uni Eropa</strong> selama kuartal terakhir.
                  </>
                ) : (
                  <>
                    Analisis Furnitur Rotan <strong>HS 9401.52</strong> menunjukkan kenaikan permintaan ekspor sebesar 28% ke pasar <strong>Eropa Barat</strong>.
                  </>
                )}
              </p>
  
              <div className="space-y-4">
                {/* Opportunity Alert */}
                <div className="border border-outline-variant rounded-lg p-4 bg-surface flex gap-3 hover:border-secondary transition-colors cursor-default">
                  <span className="material-symbols-outlined text-secondary text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
                  <div>
                    <h3 className="text-sm font-bold text-[#070235] mb-1">Peluang Teridentifikasi</h3>
                    <p className="text-xs text-on-surface-variant leading-relaxed font-medium">
                      {isCoffee 
                        ? "Jerman menunjukkan toleransi harga premium tertinggi untuk biji kopi organik yang bersertifikat."
                        : "Prancis dan Denmark menunjukkan peningkatan signifikan untuk furnitur ramah lingkungan bersertifikat SVLK."}
                    </p>
                  </div>
                </div>
  
                {/* Regulatory Alert */}
                <div className="border border-error/30 rounded-lg p-4 bg-error-container/20 flex gap-3">
                  <span className="material-symbols-outlined text-error text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>warning</span>
                  <div>
                    <h3 className="text-sm font-bold text-error mb-1">Peringatan Regulasi</h3>
                    <p className="text-xs text-on-surface-variant leading-relaxed font-medium">
                      {isCoffee
                        ? "Bukti pemenuhan Regulasi Deforestasi Uni Eropa (EUDR) wajib disiapkan pada Kuartal 3 (Q3)."
                        : "Persyaratan sertifikat legalitas kayu (SVLK) dan kepatuhan FSC Timber wajib disertakan untuk bea cukai Hamburg."}
                    </p>
                  </div>
                </div>
              </div>
            </div>
 
            <button 
              onClick={handleCreateReport}
              disabled={isGenerating}
              className="w-full mt-6 bg-surface-container-lowest border border-primary text-primary font-bold text-xs py-3 rounded-lg flex justify-center items-center gap-2 hover:bg-[#070235] hover:text-white transition-all shadow-sm cursor-pointer disabled:opacity-50"
            >
              {isGenerating ? (
                <>
                  <span className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></span>
                  Membuat Laporan AI...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[18px]">request_quote</span>
                  Buat Laporan Strategi AI
                </>
              )}
            </button>
          </div>
 
        </div>

        {/* AI STRATEGY REPORT DETAIL MODAL */}
        {showReportModal && (
          <div className="fixed inset-0 bg-[#070235]/65 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
            <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl w-full max-w-2xl shadow-2xl p-6 md:p-8 flex flex-col max-h-[85vh] overflow-hidden animate-in zoom-in-95 duration-300 font-sans text-sm text-on-surface">
              
              {/* Header */}
              <div className="flex justify-between items-center border-b border-outline-variant pb-4 mb-6 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-indigo-50 border border-outline-variant text-[#070235] rounded-xl flex items-center justify-center">
                    <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
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
                  <span className="material-symbols-outlined text-[20px]">close</span>
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
                    <h4 className="text-xs font-bold text-[#070235] uppercase tracking-wider mb-2">1. Kelayakan Pasar &amp; Tren Impor</h4>
                    <p className="text-xs text-on-surface-variant leading-relaxed">
                      Permintaan di pasar Uni Eropa melonjak sebesar {isCoffee ? "14%" : "28%"} pada kuartal terakhir. Pasar Jerman dan Belanda menunjukkan tingkat toleransi harga premium tertinggi untuk komoditas impor yang memiliki sertifikat keberlanjutan.
                    </p>
                  </div>

                  <div>
                    <h4 className="text-xs font-bold text-[#070235] uppercase tracking-wider mb-2">2. Analisis Tarif &amp; Hambatan Regulasi</h4>
                    <p className="text-xs text-on-surface-variant leading-relaxed">
                      {isCoffee 
                        ? "Pemeriksaan EUDR (European Union Deforestation Regulation) mewajibkan sertifikasi geolahan (GPS koordinat). Hubungkan titik pemetaan kebun Anda dengan sistem pabean melalui dasbor Kepatuhan Hukum TradeConnect."
                        : "Sertifikasi legalitas kayu (SVLK) dan kepatuhan FSC Timber harus disiapkan lengkap sebelum kontainer dimuat untuk menghindari penahanan kargo di Bea Cukai pelabuhan Hamburg."}
                    </p>
                  </div>

                  <div>
                    <h4 className="text-xs font-bold text-[#070235] uppercase tracking-wider mb-2">3. Rekomendasi Penawaran &amp; Margin Kontainer</h4>
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
                  className="px-5 py-2 bg-primary text-on-primary hover:bg-[#070235]/90 rounded-lg text-xs font-bold transition-colors shadow-md flex items-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-[16px]">download</span>
                  Unduh Laporan Strategi
                </button>
              </div>

            </div>
          </div>
        )}

        {/* CUSTOM INTERACTIVE TOAST */}
        {toast && (
          <div className="fixed bottom-6 right-6 z-[10000] bg-[#070235] text-white border border-[#85f8c4]/40 px-5 py-3 rounded-xl shadow-2xl flex items-center gap-2.5 animate-in slide-in-from-bottom duration-300">
            <span className="material-symbols-outlined text-[#85f8c4]">check_circle</span>
            <span className="text-xs font-bold">{toast.message}</span>
          </div>
        )}

      </div>
    </div>
  );
}
