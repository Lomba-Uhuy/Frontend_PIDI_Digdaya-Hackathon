"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { setStep as setJourneyStep } from "../../../lib/state";

interface BuyerDetails {
  established: string;
  importRecords: string;
  preferredPorts: string;
  certifications: string;
  complianceHistory: string;
  contactPerson: string;
  financialScore: string;
}

interface Buyer {
  id: string;
  name: string;
  logo: string;
  location: string;
  category: string;
  score: number;
  lastShipment: string;
  origin: string;
  avgVolume: string;
  hsCodes: string;
  confidence: string;
  rationale: string;
  details: BuyerDetails;
}

export default function BuyerDiscoveryPage() {
  const router = useRouter();
  const [isPitching, setIsPitching] = useState(false);
  const [pitchStep, setPitchStep] = useState(0);
  const [selectedBuyer, setSelectedBuyer] = useState<Buyer | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [targetHsCode, setTargetHsCode] = useState("0901.21 (Kopi Panggang)");
  const [selectedRegion, setSelectedRegion] = useState("Uni Eropa (EU27)");
  const [minVolume, setMinVolume] = useState("1 TEU / Bulan");
  const [sortBy, setSortBy] = useState("Relevansi");
  const [filteredBuyers, setFilteredBuyers] = useState<Buyer[]>([]);

  // Pitching process simulation effect
  useEffect(() => {
    if (!isPitching) return;
    if (pitchStep === 1) {
      const timer = setTimeout(() => setPitchStep(2), 1200);
      return () => clearTimeout(timer);
    } else if (pitchStep === 2) {
      const timer = setTimeout(() => setPitchStep(3), 2000);
      return () => clearTimeout(timer);
    } else if (pitchStep === 3) {
      const timer = setTimeout(() => setPitchStep(4), 2800);
      return () => clearTimeout(timer);
    } else if (pitchStep === 4) {
      const timer = setTimeout(() => {
        setJourneyStep("contacted_klaus");
        setIsPitching(false);
        router.push('/negotiation');
      }, 1800);
      return () => clearTimeout(timer);
    }
  }, [isPitching, pitchStep]);

  const buyers: Buyer[] = [
    {
      id: "globaltech",
      name: "GlobalTech Imports GmbH",
      logo: "G",
      location: "Frankfurt, Jerman",
      category: "Komoditas Global & Bahan Pangan",
      score: 94,
      lastShipment: "4 Hari yang Lalu",
      origin: "Indonesia",
      avgVolume: "18.0 TEU / bulan",
      hsCodes: "0901.11, 0901.21",
      confidence: "Tingkat Keyakinan 98%",
      rationale: "Importir B2B asal Jerman ini sedang aktif mencari pemasok biji kopi robusta untuk pengapalan Kuartal 3 (Q3) ke pelabuhan Hamburg. Mereka memiliki permintaan pengapalan kontainer yang sangat stabil (rata-rata 18 TEU per bulan) dan sangat cocok dengan kapasitas PT Nusantara.",
      details: {
        established: "2008",
        importRecords: "1.240 pengiriman sukses",
        preferredPorts: "Pelabuhan Hamburg (DEHAM), Pelabuhan Bremen (DEBRE)",
        certifications: "ISO 9001, Fairtrade Imp., Rainforest Alliance",
        complianceHistory: "100% Catatan Manifest Bersih (Bebas Hambatan Pabean)",
        contactPerson: "Klaus Weber (Direktur Pengadaan Global)",
        financialScore: "A+ (Peringkat Kredit Dun & Bradstreet)",
      }
    },
    {
      id: "eurocafe",
      name: "EuroCafé Logistics Group",
      logo: "E",
      location: "Hamburg, Jerman",
      category: "Distribusi Grosir",
      score: 82,
      lastShipment: "45 Hari yang Lalu",
      origin: "Brasil / Vietnam",
      avgVolume: "12 TEU / bulan",
      hsCodes: "0901.21, 1801.00",
      confidence: "Tingkat Keyakinan 85%",
      rationale: "Kecocokan volume pengiriman yang kuat dengan kapasitas Anda. Namun, riwayat data bill of lading menunjukkan mereka utamanya mengimpor biji kopi mentah curah (HS 0901.11) dibandingkan spesifikasi kopi panggang Anda. Silakan lanjutkan dengan draf penawaran khusus yang menonjolkan kualitas penyangraian Anda.",
      details: {
        established: "2012",
        importRecords: "850 pengiriman sukses",
        preferredPorts: "Pelabuhan Hamburg (DEHAM), Pelabuhan Rotterdam (NLROT)",
        certifications: "IFS Broker Certificate, Importir Organik Resmi Uni Eropa",
        complianceHistory: "Sangat Baik (Keterlambatan kecil diselesaikan di 2024)",
        contactPerson: "Dr. Elena Brandt (Kepala Rantai Pasok)",
        financialScore: "Peringkat A- Rated",
      }
    }
  ];

  useEffect(() => {
    setFilteredBuyers(buyers);
  }, []);

  const handleApplyFilter = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      const hasCoffeeKeyword = targetHsCode.toLowerCase().includes("kopi") || targetHsCode.toLowerCase().includes("0901");
      const isTargetRegionMatch = selectedRegion === "Uni Eropa (EU27)";
      
      if (!isTargetRegionMatch || !hasCoffeeKeyword) {
        setFilteredBuyers([]);
      } else {
        setFilteredBuyers(buyers);
      }
    }, 1200);
  };

  const handleResetFilter = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setTargetHsCode("0901.21 (Kopi Panggang)");
      setSelectedRegion("Uni Eropa (EU27)");
      setMinVolume("1 TEU / Bulan");
      setSortBy("Relevansi");
      setFilteredBuyers(buyers);
    }, 800);
  };

  return (
    <div className="h-full w-full overflow-y-auto p-4 md:p-8 bg-surface-bright">
      <div className="max-w-6xl mx-auto space-y-6 pb-12">
        {/* Header & Context */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="material-symbols-outlined text-[20px] text-surface-tint">auto_awesome</span>
              <span className="text-xs font-bold text-surface-tint tracking-widest uppercase">Mesin Pencocokan Semantik AI</span>
            </div>
            <h2 className="text-3xl font-bold text-primary mb-2">Pencarian Pembeli Global</h2>
            <p className="text-base text-on-surface-variant max-w-2xl">Menganalisis miliaran data Bill of Lading global dan manifest pabean publik untuk menemukan importir potensial yang paling cocok untuk katalog produk UMKM Anda.</p>
          </div>
          <div className="flex gap-3">
            <button className="px-4 py-2 border border-outline-variant rounded-md bg-surface-container-lowest text-on-surface text-sm font-semibold hover:bg-surface-container-low transition-colors flex items-center gap-2 shadow-sm">
              <span className="material-symbols-outlined text-[18px]">download</span>
              Ekspor CSV
            </button>
            <button className="px-4 py-2 bg-primary text-on-primary rounded-md text-sm font-semibold hover:bg-surface-tint transition-colors flex items-center gap-2 shadow-sm">
              <span className="material-symbols-outlined text-[18px]">add_alert</span>
              Buat Pengingat
            </button>
          </div>
        </div>

        {/* Terminal Filter Bar - 5 Columns featuring Sort */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-4 mb-6 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Target HS Code</label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]">inventory_2</span>
                <input 
                  className="w-full pl-9 pr-3 py-2 bg-surface border border-outline-variant rounded-md text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none text-on-surface font-semibold" 
                  type="text" 
                  value={targetHsCode}
                  onChange={(e) => setTargetHsCode(e.target.value)}
                />
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Negara Tujuan</label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]">public</span>
                <select 
                  className="w-full pl-9 pr-8 py-2 bg-surface border border-outline-variant rounded-md text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none appearance-none cursor-pointer text-on-surface font-semibold"
                  value={selectedRegion}
                  onChange={(e) => setSelectedRegion(e.target.value)}
                >
                  <option value="Uni Eropa (EU27)">Uni Eropa (EU27)</option>
                  <option value="Amerika Utara">Amerika Utara</option>
                  <option value="Asia Timur">Asia Timur</option>
                </select>
                <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none text-[18px]">arrow_drop_down</span>
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Volume Minimum Bulanan</label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]">equalizer</span>
                <select 
                  className="w-full pl-9 pr-8 py-2 bg-surface border border-outline-variant rounded-md text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none appearance-none cursor-pointer text-on-surface font-semibold"
                  value={minVolume}
                  onChange={(e) => setMinVolume(e.target.value)}
                >
                  <option value="1 TEU / Bulan">1 TEU / Bulan</option>
                  <option value="5+ TEU / Bulan">5+ TEU / Bulan</option>
                  <option value="Hanya Kargo LCL">Hanya Kargo LCL</option>
                </select>
                <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none text-[18px]">arrow_drop_down</span>
              </div>
            </div>
            {/* Sort dropdown (relevance, score, terbaru) */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Urutkan Berdasarkan</label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]">sort</span>
                <select 
                  className="w-full pl-9 pr-8 py-2 bg-surface border border-outline-variant rounded-md text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none appearance-none cursor-pointer text-on-surface font-semibold"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                >
                  <option value="Relevansi">Relevansi</option>
                  <option value="Skor Kecocokan">Skor Kecocokan</option>
                  <option value="Terbaru">Terbaru</option>
                </select>
                <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none text-[18px]">arrow_drop_down</span>
              </div>
            </div>
            <div className="flex items-end">
              <button 
                onClick={handleApplyFilter}
                className="w-full h-[38px] bg-primary text-[#ffffff] rounded-md border border-transparent hover:bg-surface-tint transition-colors text-sm font-bold flex items-center justify-center gap-2 shadow-sm"
              >
                <span className="material-symbols-outlined text-[18px]">filter_list</span>
                Terapkan Filter
              </button>
            </div>
          </div>
        </div>

        {/* Bento/Grid Content Area */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
          {/* Main List (Left) */}
          <div className="xl:col-span-8 space-y-6">
            
            {isLoading ? (
              <div className="space-y-6">
                {[1, 2].map((i) => (
                  <div key={i} className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden shadow-sm animate-pulse">
                    <div className="p-5 border-b border-outline-variant flex justify-between items-start">
                      <div className="flex gap-4 w-full">
                        <div className="w-12 h-12 rounded-lg bg-surface-variant shrink-0"></div>
                        <div className="space-y-2 w-1/2">
                          <div className="h-4 bg-surface-variant rounded w-3/4"></div>
                          <div className="h-3 bg-surface-variant rounded w-1/2"></div>
                        </div>
                      </div>
                      <div className="w-24 h-8 bg-surface-variant rounded"></div>
                    </div>
                    <div className="grid grid-cols-3 divide-x divide-outline-variant border-b border-outline-variant h-20 bg-surface/50">
                      <div className="p-4 space-y-2"><div className="h-2 bg-surface-variant rounded w-3/4"></div><div className="h-2 bg-surface-variant rounded w-1/2"></div></div>
                      <div className="p-4 space-y-2"><div className="h-2 bg-surface-variant rounded w-3/4"></div><div className="h-2 bg-surface-variant rounded w-1/2"></div></div>
                      <div className="p-4 space-y-2"><div className="h-2 bg-surface-variant rounded w-3/4"></div><div className="h-2 bg-surface-variant rounded w-1/2"></div></div>
                    </div>
                    <div className="p-4 bg-surface-container-lowest h-24">
                      <div className="h-full bg-surface-container-low rounded-lg"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredBuyers.length === 0 ? (
              <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-8 md:p-12 text-center shadow-sm flex flex-col items-center justify-center animate-in fade-in duration-300">
                <div className="w-16 h-16 rounded-full bg-primary-container/10 border border-primary/20 flex items-center justify-center text-primary mb-4 shadow-inner">
                  <span className="material-symbols-outlined text-4xl">search_off</span>
                </div>
                <h3 className="text-xl font-bold text-on-surface mb-2">Tidak Ada Pembeli yang Cocok</h3>
                <p className="text-xs text-on-surface-variant max-w-md leading-relaxed mb-6">
                  Maaf, kriteria penyaringan Anda saat ini tidak menemukan pembeli terdaftar yang cocok di pasar global. Coba ganti Negara Tujuan atau HS Code produk Anda (misal masukkan 'kopi').
                </p>
                <button 
                  onClick={handleResetFilter}
                  className="px-6 py-2.5 bg-primary text-on-primary text-xs font-bold rounded-lg hover:bg-surface-tint transition-colors flex items-center gap-2 shadow-sm"
                >
                  <span className="material-symbols-outlined text-[18px]">restart_alt</span>
                  Atur Ulang Filter
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                {filteredBuyers.map((buyer) => {
                  // Color-coded Credibility Score Badge
                  let scoreColorClass = "bg-emerald-50 text-emerald-700 border border-emerald-200";
                  if (buyer.score < 40) {
                    scoreColorClass = "bg-red-50 text-red-700 border border-red-200";
                  } else if (buyer.score < 70) {
                    scoreColorClass = "bg-amber-50 text-amber-700 border border-amber-200";
                  }

                  return (
                    <div key={buyer.id} className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-200 animate-in fade-in">
                      <div className="p-5 border-b border-outline-variant flex justify-between items-start bg-surface-container-lowest">
                        <div className="flex gap-4">
                          <div className="w-12 h-12 rounded-lg border border-outline-variant bg-surface flex items-center justify-center flex-shrink-0 shadow-sm">
                            <span className="text-2xl font-black text-primary">{buyer.logo}</span>
                          </div>
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="text-lg font-bold text-primary">{buyer.name}</h3>
                              {buyer.id === "globaltech" && (
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-[#85f8c4]/30 text-emerald-800 flex items-center gap-1 border border-[#85f8c4]">
                                  <span className="material-symbols-outlined text-[12px]" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span> Terverifikasi
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-on-surface-variant flex items-center gap-1.5 font-medium">
                              <span className="material-symbols-outlined text-[16px]">location_on</span> {buyer.location}
                              <span className="text-outline-variant">•</span>
                              {buyer.category}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-[10px] font-bold text-on-surface-variant uppercase mb-1 tracking-wider">Skor Kredibilitas</div>
                          <div className={`px-2.5 py-1 rounded-full text-xs font-black flex items-center justify-center gap-0.5 leading-none tracking-tight ${scoreColorClass}`}>
                            {buyer.score}<span className="text-[10px] font-normal opacity-85">/100</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-3 divide-x divide-outline-variant border-b border-outline-variant bg-surface">
                        <div className="p-4">
                          <div className="text-[10px] font-bold text-on-surface-variant uppercase mb-2 flex items-center gap-1.5 tracking-wider">
                            <span className="material-symbols-outlined text-[14px]">calendar_today</span> Pengiriman Terakhir
                          </div>
                          <div className="text-sm font-bold text-on-surface">{buyer.lastShipment}</div>
                          {buyer.id === "eurocafe" ? (
                            <div className="text-xs text-error flex items-center gap-1 mt-1 font-semibold">
                              <span className="material-symbols-outlined text-[14px]">warning</span> Tidak Teratur
                            </div>
                          ) : (
                            <div className="text-xs text-on-surface-variant mt-1 font-semibold text-secondary">Asal: {buyer.origin}</div>
                          )}
                        </div>
                        <div className="p-4">
                          <div className="text-[10px] font-bold text-on-surface-variant uppercase mb-2 flex items-center gap-1.5 tracking-wider">
                            <span className="material-symbols-outlined text-[14px]">local_shipping</span> Rata-rata Volume
                          </div>
                          <div className="text-sm font-bold text-on-surface">{buyer.avgVolume}</div>
                          <div className="text-xs text-on-surface-variant mt-1 font-medium">
                            {buyer.id === "eurocafe" ? "Kapasitas tinggi" : "Permintaan tinggi"}
                          </div>
                        </div>
                        <div className="p-4">
                          <div className="text-[10px] font-bold text-on-surface-variant uppercase mb-2 flex items-center gap-1.5 tracking-wider">
                            <span className="material-symbols-outlined text-[14px]">category</span> Top HS Code
                          </div>
                          <div className="text-sm font-bold text-on-surface">{buyer.hsCodes}</div>
                          <div className="text-xs text-on-surface-variant mt-1 font-medium">
                            {buyer.id === "eurocafe" ? "Komoditas Campuran" : "Sesuai Katalog"}
                          </div>
                        </div>
                      </div>
                      
                      <div className="p-4 bg-surface-container-lowest">
                        <div className="bg-surface-container-low border-l-4 border-surface-tint p-4 rounded-r-lg flex gap-3 shadow-inner">
                          <span className="material-symbols-outlined text-surface-tint mt-0.5 text-[20px]">auto_awesome</span>
                          <div>
                            <h4 className="text-sm font-bold text-on-surface mb-1">Analisis Pencocokan AI: {buyer.confidence}</h4>
                            <p className="text-xs text-on-surface-variant leading-relaxed">
                              {buyer.rationale}
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="p-4 border-t border-outline-variant bg-surface-container-lowest flex justify-end gap-3">
                        <button 
                          onClick={() => setSelectedBuyer(buyer)}
                          className="px-4 py-2 border border-outline-variant rounded-md text-on-surface text-sm font-bold hover:bg-surface-container-low transition-colors shadow-sm"
                        >
                          Lihat Profil Lengkap
                        </button>
                        <button 
                          onClick={() => { 
                            if (buyer.id === "globaltech") {
                              setIsPitching(true); 
                              setPitchStep(1); 
                            } else {
                              router.push(`/negotiation?buyer=${buyer.id}`);
                            }
                          }} 
                          className="px-4 py-2 bg-primary text-[#ffffff] rounded-md text-sm font-bold hover:bg-surface-tint transition-colors flex items-center gap-2 shadow-sm"
                        >
                          <span className="material-symbols-outlined text-[18px]">send</span>
                          Buat Email Penawaran AI
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Contextual Sidebar (Right) */}
          <div className="xl:col-span-4 space-y-6">
            {/* Context Widget 1: Map/Heatmap */}
            <div className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden shadow-sm">
              <div className="p-4 border-b border-outline-variant bg-surface-container-lowest flex items-center gap-2">
                <span className="material-symbols-outlined text-on-surface-variant text-[20px]">travel_explore</span>
                <h3 className="text-base font-bold text-on-surface">Peta Panas Permintaan</h3>
              </div>
              <div className="h-48 relative group flex items-center justify-center bg-[#dff3f0]">
                 <div className="absolute inset-0 opacity-80" style={{
                    backgroundImage: 'radial-gradient(circle at center, #68dba9 0%, transparent 70%)',
                    backgroundSize: '100% 100%'
                  }}></div>
                  <div className="absolute top-1/4 left-1/4 w-3 h-3 bg-primary rounded-full shadow-[0_0_0_4px_rgba(7,2,53,0.2)] animate-pulse"></div>
              </div>
              <div className="p-4 bg-surface-container-lowest">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-on-surface-variant font-medium">Wilayah Teratas (HS 0901.21)</span>
                  <span className="text-sm text-primary font-bold">Uni Eropa</span>
                </div>
                <div className="w-full bg-surface-variant rounded-full h-1.5 mb-3">
                  <div className="bg-primary h-1.5 rounded-full" style={{ width: "65%" }}></div>
                </div>
                <p className="text-xs text-on-surface-variant">Volume impor Uni Eropa naik 4,2% YoY berdasarkan data pabean manifest Q3.</p>
              </div>
            </div>

            {/* Context Widget 2: Terminal Stats */}
            <div className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden shadow-sm">
              <div className="p-4 border-b border-outline-variant bg-surface-container-lowest flex items-center gap-2">
                <span className="material-symbols-outlined text-on-surface-variant text-[20px]">troubleshoot</span>
                <h3 className="text-base font-bold text-on-surface">Diagnostik Pencarian</h3>
              </div>
              <div className="p-0 divide-y divide-outline-variant">
                <div className="flex justify-between items-center p-4 bg-surface-container-lowest">
                  <span className="text-sm text-on-surface-variant font-medium">Total Rekaman Dipindai</span>
                  <span className="text-sm text-on-surface font-bold">1,2M+</span>
                </div>
                <div className="flex justify-between items-center p-4 bg-surface-container-lowest">
                  <span className="text-sm text-on-surface-variant font-medium">Pembeli Aktif (30 hari terakhir)</span>
                  <span className="text-sm text-on-surface font-bold">342</span>
                </div>
                <div className="flex justify-between items-center p-4 bg-surface-container-lowest">
                  <span className="text-sm text-on-surface-variant font-medium">Kecocokan Probabilitas Tinggi</span>
                  <span className="text-sm text-secondary font-black">14 Buyer</span>
                </div>
              </div>
            </div>

            {/* Context Widget 3: Compliance Alert */}
            <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-4 border-l-[4px] border-l-error shadow-sm">
              <div className="flex items-start gap-3">
                <span className="material-symbols-outlined text-error text-[20px]">gavel</span>
                <div>
                  <h4 className="text-sm font-bold text-on-surface mb-1">Regulasi Deforestasi UE (EUDR)</h4>
                  <p className="text-xs text-on-surface-variant mb-2 leading-relaxed">Pastikan koordinat geolokasi (GPS) untuk lahan kopi Anda telah diperbarui sebelum menawarkan produk ke pembeli Eropa. Kepatuhan hukum sangat ketat.</p>
                  <button className="text-[11px] font-bold text-primary hover:underline flex items-center gap-1 uppercase tracking-wider">
                    Perbarui Koordinat <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Pagination */}
        <div className="mt-8 pt-4 border-t border-outline-variant flex justify-between items-center text-on-surface-variant">
          <span className="text-xs font-semibold tracking-wide">Menampilkan 1-2 dari 14 hasil cocok</span>
          <div className="flex gap-1.5">
            <button className="w-8 h-8 flex items-center justify-center border border-outline-variant rounded hover:bg-surface-container-low transition-colors disabled:opacity-50 shadow-sm"><span className="material-symbols-outlined text-[18px]">chevron_left</span></button>
            <button className="w-8 h-8 flex items-center justify-center border border-primary bg-primary text-on-primary rounded text-xs font-bold shadow-sm">1</button>
            <button className="w-8 h-8 flex items-center justify-center border border-outline-variant rounded hover:bg-surface-container-low transition-colors text-xs font-bold shadow-sm">2</button>
            <button className="w-8 h-8 flex items-center justify-center border border-outline-variant rounded hover:bg-surface-container-low transition-colors text-xs font-bold shadow-sm">3</button>
            <span className="w-8 h-8 flex items-center justify-center text-xs font-bold">...</span>
            <button className="w-8 h-8 flex items-center justify-center border border-outline-variant rounded hover:bg-surface-container-low transition-colors shadow-sm"><span className="material-symbols-outlined text-[18px]">chevron_right</span></button>
          </div>
        </div>

        {/* INTERACTIVE BUYER PROFILE MODAL */}
        {selectedBuyer && (
          <div className="fixed inset-0 bg-[#070235]/65 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
            <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl w-full max-w-2xl shadow-2xl p-6 md:p-8 flex flex-col max-h-[85vh] overflow-hidden animate-in zoom-in-95 duration-300">
              
              <div className="flex justify-between items-center border-b border-outline-variant pb-4 mb-6 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-indigo-50 border border-outline-variant text-[#070235] rounded-xl flex items-center justify-center font-black text-xl">
                    {selectedBuyer.logo}
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-primary leading-tight">{selectedBuyer.name}</h3>
                    <p className="text-xs text-on-surface-variant font-medium">{selectedBuyer.location} • {selectedBuyer.category}</p>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedBuyer(null)}
                  className="text-on-surface-variant hover:text-error p-1.5 rounded-full hover:bg-surface-container-low transition-colors"
                >
                  <span className="material-symbols-outlined text-[22px]">close</span>
                </button>
              </div>

              <div className="flex-1 overflow-y-auto pr-2 space-y-6 text-sm text-on-surface-variant">
                {/* Score Widget */}
                <div className="grid grid-cols-2 gap-4 bg-surface p-4 rounded-xl border border-outline-variant shadow-sm shrink-0">
                  <div>
                    <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider block mb-1">Skor Kredibilitas Terverifikasi</span>
                    <span className="text-3xl font-black text-secondary">{selectedBuyer.score}<span className="text-sm font-medium text-on-surface-variant">/100</span></span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider block mb-1">Peringkat Finansial</span>
                    <span className="text-3xl font-black text-primary">{selectedBuyer.details.financialScore}</span>
                  </div>
                </div>

                {/* Import History */}
                <div>
                  <h4 className="text-xs font-bold text-primary uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[18px]">history</span> Riwayat Impor & Catatan Manifest
                  </h4>
                  <div className="bg-surface-container-low/50 border border-outline-variant rounded-lg p-4 space-y-2 text-xs font-medium">
                    <div className="flex justify-between border-b border-outline-variant/40 pb-2">
                      <span>Perusahaan Didirikan</span>
                      <span className="text-on-surface font-bold">{selectedBuyer.details.established}</span>
                    </div>
                    <div className="flex justify-between border-b border-outline-variant/40 pb-2">
                      <span>Total Pengiriman Sukses</span>
                      <span className="text-on-surface font-bold">{selectedBuyer.details.importRecords}</span>
                    </div>
                    <div className="flex justify-between border-b border-outline-variant/40 pb-2">
                      <span>Rata-rata Volume Bulanan</span>
                      <span className="text-on-surface font-bold">{selectedBuyer.avgVolume}</span>
                    </div>
                    <div className="flex justify-between border-b border-outline-variant/40 pb-2">
                      <span>Pelabuhan Tujuan</span>
                      <span className="text-on-surface font-bold">{selectedBuyer.details.preferredPorts}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Komoditas Target Utama</span>
                      <span className="font-mono text-primary font-bold">{selectedBuyer.hsCodes}</span>
                    </div>
                  </div>
                </div>

                {/* Compliance & Standards */}
                <div>
                  <h4 className="text-xs font-bold text-primary uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[18px]">workspace_premium</span> Kepatuhan Global & Sertifikasi
                  </h4>
                  <div className="bg-surface-container-low/50 border border-outline-variant rounded-lg p-4 space-y-2 text-xs font-medium">
                    <div className="flex justify-between border-b border-outline-variant/40 pb-2">
                      <span>Sertifikasi Aktif</span>
                      <span className="text-on-surface font-bold">{selectedBuyer.details.certifications}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Riwayat Pabean & Kepatuhan</span>
                      <span className="text-emerald-700 font-bold flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> {selectedBuyer.details.complianceHistory}
                      </span>
                    </div>
                  </div>
                </div>

                {/* AI Recommendation Context */}
                <div>
                  <h4 className="text-xs font-bold text-primary uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[18px]">auto_awesome</span> Analisis Kecocokan TradeConnect
                  </h4>
                  <div className="bg-[#85f8c4]/10 border-l-4 border-secondary p-4 rounded-r-xl">
                    <p className="text-xs text-on-surface-variant font-medium leading-relaxed italic">
                      "{selectedBuyer.rationale}"
                    </p>
                  </div>
                </div>
              </div>

              <div className="border-t border-outline-variant pt-4 mt-6 flex justify-end gap-3 shrink-0">
                <button 
                  onClick={() => setSelectedBuyer(null)}
                  className="px-5 py-2 border border-outline-variant hover:bg-surface rounded-lg text-xs font-bold text-on-surface transition-colors"
                >
                  Tutup
                </button>
                <button 
                  onClick={() => {
                    setSelectedBuyer(null);
                    setIsPitching(true);
                    setPitchStep(1);
                  }}
                  className="px-6 py-2 bg-primary text-on-primary hover:bg-surface-tint rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 shadow-md"
                >
                  <span className="material-symbols-outlined text-[16px]">send</span>
                  Mulai Komunikasi (Outbound)
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Pitching Simulation Modal */}
        {isPitching && (
          <div className="fixed inset-0 bg-[#070235]/65 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
            <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl w-full max-w-lg shadow-2xl p-6 md:p-8 flex flex-col items-center animate-in zoom-in-95 duration-300">
              
              {/* Spinner & AI Icon */}
              <div className="relative w-20 h-20 mb-6 flex items-center justify-center shrink-0">
                <div className="absolute inset-0 border-4 border-outline-variant rounded-full"></div>
                <div className="absolute inset-0 border-4 border-primary rounded-full border-t-transparent animate-spin"></div>
                <span className="material-symbols-outlined text-primary text-3xl animate-pulse">auto_awesome</span>
              </div>

              <h3 className="text-xl font-bold text-primary mb-1">TradeConnect AI Outbound Pipeline</h3>
              <p className="text-xs text-on-surface-variant mb-6 uppercase tracking-wider font-bold">Fase 2: Pengiriman Email Penawaran Resmi</p>

              {/* Progress Steps */}
              <div className="w-full space-y-4 mb-6">
                {/* Step 1 */}
                <div className="flex items-center gap-3">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${pitchStep >= 2 ? 'bg-secondary text-on-secondary border-none' : 'bg-surface-variant animate-pulse text-on-surface-variant'}`}>
                    {pitchStep >= 2 ? '✓' : '1'}
                  </div>
                  <span className={`text-xs font-semibold ${pitchStep >= 1 ? 'text-on-surface' : 'text-on-surface-variant'}`}>Menganalisis kecocokan katalog dan kepatuhan hukum kebun</span>
                </div>

                {/* Step 2 */}
                <div className={`flex items-center gap-3 transition-opacity duration-300 ${pitchStep >= 2 ? 'opacity-100' : 'opacity-30'}`}>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${pitchStep >= 3 ? 'bg-secondary text-on-secondary border-none' : 'bg-surface-variant animate-pulse text-on-surface-variant'}`}>
                    {pitchStep >= 3 ? '✓' : '2'}
                  </div>
                  <span className={`text-xs font-semibold ${pitchStep >= 2 ? 'text-on-surface' : 'text-on-surface-variant'}`}>Mencocokkan manifest impor pabean GlobalTech</span>
                </div>

                {/* Step 3 */}
                <div className={`flex items-center gap-3 transition-opacity duration-300 ${pitchStep >= 3 ? 'opacity-100' : 'opacity-30'}`}>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${pitchStep >= 4 ? 'bg-secondary text-on-secondary border-none' : 'bg-surface-variant animate-pulse text-on-surface-variant'}`}>
                    {pitchStep >= 4 ? '✓' : '3'}
                  </div>
                  <span className={`text-xs font-semibold ${pitchStep >= 3 ? 'text-on-surface' : 'text-on-surface-variant'}`}>Menyusun surat penawaran B2B formal dalam Bahasa Inggris</span>
                </div>

                {/* Step 3.5: Preview of the drafted email */}
                {pitchStep === 3 && (
                  <div className="bg-surface border border-outline-variant p-3.5 rounded-lg text-[10px] font-mono text-on-surface-variant shadow-inner max-h-24 overflow-y-auto animate-in slide-in-from-top-2 duration-300 w-full text-left">
                    <span className="text-primary font-bold">Subjek:</span> Perkenalan B2B: Biji Kopi Robusta Premium Grade 1<br/>
                    <span className="text-primary font-bold">Kpd:</span> klaus.weber@globaltech.de<br/>
                    <span className="text-slate-400">---</span><br/>
                    Dear Mr. Weber,<br/>
                    PT Nusantara Coffee offers Premium Grade 1 Robusta Coffee Beans (HS 0901.11) with moisture content below 12.5%. Our monthly production capacity is 50,000 Units and NIB is fully verified...
                  </div>
                )}

                {/* Step 4 */}
                <div className={`flex items-center gap-3 transition-opacity duration-300 ${pitchStep >= 4 ? 'opacity-100' : 'opacity-30'}`}>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${pitchStep >= 5 ? 'bg-secondary text-on-secondary border-none' : 'bg-surface-variant animate-pulse text-on-surface-variant'}`}>
                    {pitchStep >= 5 ? '✓' : '4'}
                  </div>
                  <span className={`text-xs font-semibold ${pitchStep >= 4 ? 'text-on-surface' : 'text-on-surface-variant'}`}>Mengirim email penawaran aman ke Klaus Weber</span>
                </div>
              </div>

              <div className="w-full bg-surface-variant rounded-full h-1.5 overflow-hidden">
                <div 
                  className="bg-primary h-1.5 rounded-full transition-all duration-500 ease-out" 
                  style={{ width: `${(pitchStep / 4) * 100}%` }}
                ></div>
              </div>

            </div>
          </div>
        )}

      </div>
    </div>
  );
}
