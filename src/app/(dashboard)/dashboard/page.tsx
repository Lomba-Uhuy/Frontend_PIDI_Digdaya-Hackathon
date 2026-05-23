"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getStep, TradeConnectStep } from "../../../lib/state";

export default function DashboardPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<TradeConnectStep>("onboarding");

  useEffect(() => {
    setCurrentStep(getStep());
    const handleStateChange = () => {
      setCurrentStep(getStep());
    };
    window.addEventListener("tradeconnect_state_change", handleStateChange);
    return () => {
      window.removeEventListener("tradeconnect_state_change", handleStateChange);
    };
  }, []);

  const matches = [
    {
      company: "GlobalTech Imports GmbH",
      location: "Frankfurt, Germany",
      flag: "🇩🇪",
      matchScore: 94,
      seeking: "Premium Robusta Coffee Beans (Grade 1)",
      value: "$49,500 - $51,600",
    },
    {
      company: "Al-Futtaim Trading",
      location: "Dubai, UAE",
      flag: "🇦🇪",
      matchScore: 88,
      seeking: "Premium Spices (Cloves)",
      value: "$12,000 - $15,000",
    },
    {
      company: "Nippon Import Co.",
      location: "Tokyo, Japan",
      flag: "🇯🇵",
      matchScore: 82,
      seeking: "Organic Vanilla Beans",
      value: "$8,500",
    },
  ];

  return (
    <div className="h-full w-full overflow-y-auto p-4 md:p-8 bg-surface-bright">
      <div className="max-w-6xl mx-auto space-y-8 pb-12">
        
        {/* Header Section */}
        <div>
          <h1 className="text-2xl font-bold text-on-surface">Ringkasan Ekspor <span className="text-lg font-normal text-on-surface-variant">(Export Overview)</span></h1>
          <p className="text-sm text-on-surface-variant mt-1">Pantau metrik utama dan peluang global Anda hari ini.</p>
        </div>

        {/* Top Widgets */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Mentor Insights */}
          <div className="lg:col-span-2 bg-surface-container-lowest border border-outline-variant rounded-xl p-6 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded bg-primary-fixed-dim text-primary flex items-center justify-center">
                  <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
                </div>
                <h2 className="text-base font-semibold text-on-surface">Wawasan Mentor <span className="font-normal text-on-surface-variant text-sm">(Mentor Insights)</span></h2>
              </div>
              <p className="text-sm text-on-surface-variant leading-relaxed">
                "Sertifikasi Halal untuk produk rempah Anda telah divalidasi. Permintaan dari pembeli di Timur Tengah (UEA, Arab Saudi) meningkat <strong className="text-secondary">14% minggu ini</strong>. Pertimbangkan untuk memperbarui katalog bahasa Inggris Anda untuk mempercepat pencocokan AI."
              </p>
            </div>
            <button className="mt-6 text-xs font-bold text-primary flex items-center gap-1 hover:text-primary-container transition-colors uppercase tracking-wider">
              LIHAT REKOMENDASI DETAIL <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
            </button>
          </div>

          {/* Readiness Score */}
          <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6 shadow-sm flex flex-col items-center justify-center text-center">
            <h2 className="text-sm font-bold text-on-surface mb-1">Skor Kesiapan</h2>
            <p className="text-[10px] text-on-surface-variant font-bold uppercase tracking-widest mb-6">Export Readiness</p>
            
            <div className="relative w-28 h-28 mb-4">
              <svg className="w-full h-full transform -rotate-90">
                <circle cx="56" cy="56" r="48" fill="none" stroke="currentColor" strokeWidth="12" className="text-surface-variant"></circle>
                <circle cx="56" cy="56" r="48" fill="none" stroke="currentColor" strokeWidth="12" strokeDasharray="301" strokeDashoffset="45" className="text-secondary drop-shadow-sm stroke-current"></circle>
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-4xl font-bold text-on-surface">85</span>
              </div>
            </div>

            <div className="bg-secondary-fixed text-on-secondary-fixed text-[11px] font-bold px-3 py-1 rounded-full flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px]">check_circle</span>
              SIAP EKSPOR (READY)
            </div>
          </div>
        </div>

        {/* AI Buyer Matches */}
        <div>
          <div className="flex justify-between items-end mb-4">
            <h2 className="text-lg font-bold text-on-surface">Pencocokan Pembeli AI <span className="text-sm font-normal text-on-surface-variant">(AI Matches)</span></h2>
            <button className="text-xs font-medium text-primary hover:underline">Lihat Semua</button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {matches.map((match, idx) => (
              <div key={idx} className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5 shadow-sm flex flex-col">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex gap-3">
                    <span className="text-2xl">{match.flag}</span>
                    <div>
                      <h3 className="font-semibold text-on-surface text-sm">{match.company}</h3>
                      <p className="text-[11px] text-on-surface-variant">{match.location}</p>
                    </div>
                  </div>
                  <div className="bg-secondary-fixed-dim/20 text-secondary border border-secondary/20 px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1">
                    <span className="material-symbols-outlined text-[12px]" style={{ fontVariationSettings: "'FILL' 1" }}>radar</span>
                    {match.matchScore}%
                  </div>
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
                  onClick={() => router.push('/negotiation')}
                  className="w-full py-2 border border-outline-variant hover:border-primary text-primary text-xs font-bold rounded-lg transition-colors flex justify-center items-center gap-1"
                >
                  <span className="material-symbols-outlined text-[16px]">send</span>
                  Ajukan Penawaran
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Active Negotiations */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-outline-variant flex justify-between items-center bg-surface-container-lowest">
            <h2 className="text-base font-bold text-on-surface">Negosiasi Aktif <span className="text-sm font-normal text-on-surface-variant">(Active Negotiations)</span></h2>
            <button className="text-on-surface-variant hover:text-primary">
              <span className="material-symbols-outlined">filter_list</span>
            </button>
          </div>
          {currentStep === "onboarding" || currentStep === "verified" ? (
            <div className="p-8 text-center text-on-surface-variant text-sm flex flex-col items-center">
              <span className="material-symbols-outlined text-4xl mb-2 opacity-50 text-outline">forum</span>
              Anda belum memiliki negosiasi aktif. Buka menu <strong>Buyer Discovery</strong> untuk mencari dan menghubungi pembeli.
            </div>
          ) : (
            <div className="divide-y divide-outline-variant bg-surface">
              <div className="p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-surface-container-lowest">
                <div className="flex gap-4">
                  <div className="w-12 h-12 rounded-lg bg-indigo-50 border border-outline-variant text-primary flex items-center justify-center shadow-sm shrink-0">
                    <span className="text-2xl">🇩🇪</span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-bold text-on-surface text-base">GlobalTech Imports GmbH</h3>
                      {currentStep === "po_signed" ? (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-700 border border-emerald-300">
                          Deal Closed 🎉
                        </span>
                      ) : currentStep === "po_sent" ? (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-700 border border-amber-300 animate-pulse">
                          Awaiting Buyer Sign
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-primary-container text-primary border border-primary/20">
                          Active Chat
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-on-surface-variant font-medium">
                      Klaus Weber: <span className="italic">
                        {currentStep === "po_signed" 
                          ? "Purchase Order signed. Exciting partnership ahead!" 
                          : currentStep === "po_sent" 
                            ? "I am reviewing the Purchase Order document." 
                            : "We request a revised quotation at $2.75/kg..."}
                      </span>
                    </p>
                  </div>
                </div>
                
                <button 
                  onClick={() => {
                    if (currentStep === "po_signed" || currentStep === "po_sent") {
                      router.push('/purchase-order');
                    } else if (currentStep === "compliance") {
                      router.push('/compliance');
                    } else {
                      router.push('/negotiation');
                    }
                  }} 
                  className="px-5 py-2.5 bg-primary text-on-primary font-bold text-xs rounded-lg hover:bg-surface-tint transition-colors flex items-center gap-1.5 shadow-sm"
                >
                  <span className="material-symbols-outlined text-[16px]">open_in_new</span>
                  {currentStep === "po_signed" ? "Buka PO & Dokumen" : currentStep === "po_sent" ? "Cek Status PO" : "Lanjutkan Negosiasi"}
                </button>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
