"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getStep, TradeConnectStep } from "../../../lib/state";
import {
  ArrowRight,
  CheckCircle2,
  ExternalLink,
  ListFilter,
  MessagesSquare,
  Radar,
  Send,
  Sparkles,
} from "lucide-react";
import { Avatar } from "../../../components/ui/avatar";
import { Badge } from "../../../components/ui/badge";
import { ProgressRing } from "../../../components/ui/progress-ring";

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
      matchScore: 94,
      seeking: "Premium Robusta Coffee Beans (Grade 1)",
      value: "$49,500 - $51,600",
    },
    {
      company: "Al-Futtaim Trading",
      location: "Dubai, UAE",
      matchScore: 88,
      seeking: "Premium Spices (Cloves)",
      value: "$12,000 - $15,000",
    },
    {
      company: "Nippon Import Co.",
      location: "Tokyo, Japan",
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
          <h1 className="text-2xl font-bold text-on-surface font-heading">Ringkasan Ekspor</h1>
          <p className="text-sm text-on-surface-variant mt-1">Pantau metrik utama dan peluang global Anda hari ini.</p>
        </div>

        {/* Top Widgets */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Mentor Insights */}
          <div className="lg:col-span-2 bg-surface-container-lowest border border-outline-variant rounded-xl p-6 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded bg-primary-fixed-dim text-primary flex items-center justify-center">
                  <Sparkles className="size-5" />
                </div>
                <h2 className="text-base font-semibold text-on-surface">Wawasan Mentor AI</h2>
              </div>
              <p className="text-sm text-on-surface-variant leading-relaxed">
                "Sertifikasi Halal untuk produk rempah Anda telah divalidasi. Permintaan dari pembeli di Timur Tengah (UEA, Arab Saudi) meningkat <strong className="text-secondary">14% minggu ini</strong>. Pertimbangkan untuk memperbarui katalog bahasa Inggris Anda untuk mempercepat pencocokan AI."
              </p>
            </div>
            <button className="mt-6 text-xs font-bold text-primary flex items-center gap-1 hover:text-primary-container transition-colors uppercase tracking-wider">
              LIHAT REKOMENDASI DETAIL <ArrowRight className="size-4" />
            </button>
          </div>

          {/* Readiness Score */}
          <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6 shadow-sm flex flex-col items-center justify-center text-center">
            <h2 className="text-sm font-bold text-on-surface mb-1">Skor Kesiapan</h2>
            <p className="text-[10px] text-on-surface-variant font-bold uppercase tracking-widest mb-6">Kesiapan Ekspor</p>
            
            <ProgressRing value={85} size={112} strokeWidth={12} className="mb-4" />

            <Badge variant="success" size="md" icon={CheckCircle2}>
              Siap Ekspor (Ready)
            </Badge>
          </div>
        </div>

        {/* AI Buyer Matches */}
        <div>
          <div className="flex justify-between items-end mb-4">
            <h2 className="text-lg font-bold text-on-surface">Pencocokan Pembeli AI</h2>
            <button className="text-xs font-medium text-primary hover:underline">Lihat Semua</button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {matches.map((match, idx) => (
              <div key={idx} className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5 shadow-sm flex flex-col">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex gap-3">
                    <Avatar name={match.company} />
                    <div>
                      <h3 className="font-semibold text-on-surface text-sm">{match.company}</h3>
                      <p className="text-[11px] text-on-surface-variant">{match.location}</p>
                    </div>
                  </div>
                  <Badge variant="success" icon={Radar}>
                    {match.matchScore}%
                  </Badge>
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
                  <Send className="size-4" />
                  Ajukan Penawaran
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Active Negotiations */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-outline-variant flex justify-between items-center bg-surface-container-lowest">
            <h2 className="text-base font-bold text-on-surface">Negosiasi Aktif</h2>
            <button className="text-on-surface-variant hover:text-primary">
              <ListFilter className="size-6" />
            </button>
          </div>
          {currentStep === "onboarding" || currentStep === "verified" ? (
            <div className="p-8 text-center text-on-surface-variant text-sm flex flex-col items-center">
              <MessagesSquare className="mb-2 opacity-50 text-outline size-9" />
              Anda belum memiliki negosiasi aktif. Buka menu <strong>Buyer Discovery</strong> untuk mencari dan menghubungi pembeli.
            </div>
          ) : (
            <div className="divide-y divide-outline-variant bg-surface">
              <div className="p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-surface-container-lowest">
                <div className="flex gap-4">
                  <Avatar name="GlobalTech Imports GmbH" size="lg" />
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-bold text-on-surface text-base">GlobalTech Imports GmbH</h3>
                      {currentStep === "po_signed" ? (
                        <Badge variant="success" size="md">Transaksi Selesai</Badge>
                      ) : currentStep === "po_sent" ? (
                        <Badge variant="warning" size="md" className="animate-pulse">Menunggu Tanda Tangan Pembeli</Badge>
                      ) : (
                        <Badge variant="info" size="md">Percakapan Aktif</Badge>
                      )}
                    </div>
                    <p className="text-xs text-on-surface-variant font-medium">
                      Klaus Weber: <span className="italic">
                        {currentStep === "po_signed" 
                          ? "Purchase Order ditandatangani. Kerja sama yang menyenangkan menanti!" 
                          : currentStep === "po_sent" 
                            ? "Saya sedang meninjau dokumen Purchase Order." 
                            : "Kami mengajukan penawaran harga sebesar $2.75/kg..."}
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
                  <ExternalLink className="size-4" />
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
