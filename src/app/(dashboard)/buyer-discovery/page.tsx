"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { setStep as setJourneyStep } from "../../../lib/state";
import { createDeal } from "../../../lib/deals";
import { createReminder } from "../../../lib/reminders";
import {
  AlertTriangle,
  ArrowRight,
  ArrowUpDown,
  BadgeCheck,
  BellPlus,
  Calendar,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Download,
  Gavel,
  Globe,
  History,
  ListFilter,
  MapPin,
  Package,
  RotateCcw,
  SearchX,
  Send,
  SlidersHorizontal,
  Sparkles,
  Tag,
  Trophy,
  Truck,
  Wrench,
  X,
} from "lucide-react";
import { Avatar } from "../../../components/ui/avatar";
import { Badge } from "../../../components/ui/badge";

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

  const [companyName, setCompanyName] = useState("PT Nusantara Global Coffee");
  const [productName, setProductName] = useState("Biji Kopi Robusta Premium");
  const [productType, setProductType] = useState("coffee");
  const [nib, setNib] = useState("1234567890123");
  const [capacity, setCapacity] = useState("50,000 Units");
  const [moq, setMoq] = useState("1000 Pcs");

  // Custom high-fidelity Interactive states
  const [toast, setToast] = useState<{ message: string; type: "success" | "info" } | null>(null);
  const [showReminderModal, setShowReminderModal] = useState(false);
  const [reminderTitle, setReminderTitle] = useState("");
  const [reminderDate, setReminderDate] = useState("");
  const [reminderTime, setReminderTime] = useState("");
  const [reminderType, setReminderType] = useState("Email Penawaran");

  const showToast = (msg: string, type: "success" | "info" = "success") => {
    setToast({ message: msg, type });
    setTimeout(() => {
      setToast(null);
    }, 3500);
  };

  const handleExportCSV = () => {
    const csvHeader = "Nama Pembeli,Lokasi,Kategori,Skor Kredibilitas,Rata-rata Volume Bulanan,Top HS Code,Kecocokan\n";
    const csvRows = buyers.map(b => 
      `"${b.name}","${b.location}","${b.category}",${b.score},"${b.avgVolume}","${b.hsCodes}","${b.confidence}"`
    ).join("\n");
    const csvContent = "data:text/csv;charset=utf-8," + csvHeader + csvRows;
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `pembeli_global_${productType || 'coffee'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("Data pembeli global berhasil diekspor ke CSV!");
  };

  const handleSaveReminder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reminderTitle || !reminderDate) {
      showToast("Harap isi semua kolom wajib!", "info");
      return;
    }
    const reminders = JSON.parse(localStorage.getItem("tradeconnect_reminders") || "[]");
    reminders.push({
      title: reminderTitle,
      date: reminderDate,
      time: reminderTime || "12:00",
      type: reminderType,
      id: Date.now()
    });
    localStorage.setItem("tradeconnect_reminders", JSON.stringify(reminders));
    // Persist to backend (M7) — best-effort.
    void createReminder({ title: reminderTitle, date: reminderDate, time: reminderTime, type: reminderType });
    setShowReminderModal(false);
    showToast(`Pengingat "${reminderTitle}" berhasil dijadwalkan!`);
    setReminderTitle("");
    setReminderDate("");
    setReminderTime("");
  };

  // Sync profile details on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedCompany = localStorage.getItem("tradeconnect_company_name") || "PT Nusantara Global Coffee";
      const savedProduct = localStorage.getItem("tradeconnect_product_name") || "Biji Kopi Robusta Premium";
      const savedType = localStorage.getItem("tradeconnect_product_type") || "coffee";
      const savedNib = localStorage.getItem("tradeconnect_nib") || "1234567890123";
      const savedCapacity = localStorage.getItem("tradeconnect_capacity") || "50,000 Units";
      const savedMoq = localStorage.getItem("tradeconnect_moq") || "1000 Pcs";

      setCompanyName(savedCompany);
      setProductName(savedProduct);
      setProductType(savedType);
      setNib(savedNib);
      setCapacity(savedCapacity);
      setMoq(savedMoq);

      if (savedType === "rattan") {
        setTargetHsCode("9401.52 (Kursi Rotan)");
      } else {
        setTargetHsCode("0901.21 (Kopi Panggang)");
      }
    }
  }, []);

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
        // Persist a real deal (M4) for the contacted buyer (GlobalTech) — best-effort.
        void createDeal({
          buyerName: "GlobalTech Imports GmbH",
          buyerCountry: "Germany",
          status: "negotiating",
          lastMessage: "Email penawaran AI terkirim ke pembeli.",
        });
        setJourneyStep("contacted_klaus");
        setIsPitching(false);
        router.push('/negotiation');
      }, 1800);
      return () => clearTimeout(timer);
    }
  }, [isPitching, pitchStep]);

  const isRattan = productType === "rattan";

  const buyers: Buyer[] = [
    {
      id: "globaltech",
      name: "GlobalTech Imports GmbH",
      logo: "G",
      location: "Frankfurt, Jerman",
      category: isRattan ? "Mebel & Kerajinan Tangan Premium" : "Komoditas Global & Bahan Pangan",
      score: 94,
      lastShipment: "4 Hari yang Lalu",
      origin: "Indonesia",
      avgVolume: isRattan ? "1.5 TEU / bulan" : "18.0 TEU / bulan",
      hsCodes: isRattan ? "9401.52, 9403.83" : "0901.11, 0901.21",
      confidence: "Tingkat Keyakinan 98%",
      rationale: isRattan 
        ? `Importir B2B asal Jerman ini sedang aktif mencari pemasok kursi/anyaman rotan untuk pengapalan Kuartal 3 (Q3) ke pelabuhan Hamburg. Mereka memiliki permintaan pengapalan kontainer furnitur anyaman yang sangat stabil dan sangat cocok dengan kapasitas ${companyName || "CV Jepara Rattan Mandiri"}.`
        : `Importir B2B asal Jerman ini sedang aktif mencari pemasok biji kopi robusta untuk pengapalan Kuartal 3 (Q3) ke pelabuhan Hamburg. Mereka memiliki permintaan pengapalan kontainer yang sangat stabil (rata-rata 18 TEU per bulan) dan sangat cocok dengan kapasitas ${companyName || "PT Nusantara Global Coffee"}.`,
      details: {
        established: "2008",
        importRecords: "1.240 pengiriman sukses",
        preferredPorts: "Pelabuhan Hamburg (DEHAM), Pelabuhan Bremen (DEBRE)",
        certifications: isRattan ? "FSC Certification, SVLK Timber Legality" : "ISO 9001, Fairtrade Imp., Rainforest Alliance",
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
      category: isRattan ? "Grosir Mebel & Dekorasi Rumah" : "Distribusi Grosir",
      score: 82,
      lastShipment: "45 Hari yang Lalu",
      origin: isRattan ? "Indonesia / Vietnam" : "Brasil / Vietnam",
      avgVolume: isRattan ? "2 TEU / bulan" : "12 TEU / bulan",
      hsCodes: isRattan ? "9401.52, 9401.53" : "0901.21, 1801.00",
      confidence: "Tingkat Keyakinan 85%",
      rationale: isRattan
        ? `Kecocokan volume pengiriman yang cukup dengan kapasitas Anda. Namun, riwayat data bill of lading menunjukkan mereka utamanya mengimpor furnitur kayu berat dibandingkan spesifikasi anyaman rotan ringan Anda. Silakan lanjutkan dengan draf penawaran khusus yang menonjolkan keunikan anyaman tangan Jepara Anda.`
        : "Kecocokan volume pengiriman yang kuat dengan kapasitas Anda. Namun, riwayat data bill of lading menunjukkan mereka utamanya mengimpor biji kopi mentah curah (HS 0901.11) dibandingkan spesifikasi kopi panggang Anda. Silakan lanjutkan dengan draf penawaran khusus yang menonjolkan kualitas penyangraian Anda.",
      details: {
        established: "2012",
        importRecords: "850 pengiriman sukses",
        preferredPorts: "Pelabuhan Hamburg (DEHAM), Pelabuhan Rotterdam (NLROT)",
        certifications: isRattan ? "FSC Certificate, V-Legal Timber" : "IFS Broker Certificate, Importir Organik Resmi Uni Eropa",
        complianceHistory: "Sangat Baik (Keterlambatan kecil diselesaikan di 2024)",
        contactPerson: "Dr. Elena Brandt (Kepala Rantai Pasok)",
        financialScore: "Peringkat A- Rated",
      }
    }
  ];

  // Initialise the visible buyer list from the derived buyers after hydration.
  useEffect(() => {
    setFilteredBuyers(buyers);
  }, [productType, companyName]);

  const handleApplyFilter = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      const isRattanMode = productType === "rattan";
      const keyword = isRattanMode ? "rotan" : "kopi";
      const code = isRattanMode ? "9401" : "0901";
      const hasMatch = targetHsCode.toLowerCase().includes(keyword) || targetHsCode.toLowerCase().includes(code);
      const isTargetRegionMatch = selectedRegion === "Uni Eropa (EU27)";
      
      if (!isTargetRegionMatch || !hasMatch) {
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
      const isRattanMode = productType === "rattan";
      setTargetHsCode(isRattanMode ? "9401.52 (Kursi Rotan)" : "0901.21 (Kopi Panggang)");
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
            <h2 className="text-3xl font-bold text-primary font-heading">Pencarian Pembeli Global</h2>
          </div>
          <div className="flex gap-3">
            <button 
              onClick={handleExportCSV}
              className="px-4 py-2 border border-outline-variant rounded-md bg-surface-container-lowest text-on-surface text-sm font-semibold hover:bg-surface-container-low transition-colors flex items-center gap-2 shadow-sm"
            >
              <Download className="size-[18px]" />
              Ekspor CSV
            </button>
            <button 
              onClick={() => setShowReminderModal(true)}
              className="px-4 py-2 bg-primary text-on-primary rounded-md text-sm font-semibold hover:bg-surface-tint transition-colors flex items-center gap-2 shadow-sm"
            >
              <BellPlus className="size-[18px]" />
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
                <Package className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant size-[18px]" />
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
                <Globe className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant size-[18px]" />
                <select 
                  className="w-full pl-9 pr-8 py-2 bg-surface border border-outline-variant rounded-md text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none appearance-none cursor-pointer text-on-surface font-semibold"
                  value={selectedRegion}
                  onChange={(e) => setSelectedRegion(e.target.value)}
                >
                  <option value="Uni Eropa (EU27)">Uni Eropa (EU27)</option>
                  <option value="Amerika Utara">Amerika Utara</option>
                  <option value="Asia Timur">Asia Timur</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none size-[18px]" />
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Volume Minimum Bulanan</label>
              <div className="relative">
                <SlidersHorizontal className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant size-[18px]" />
                <select 
                  className="w-full pl-9 pr-8 py-2 bg-surface border border-outline-variant rounded-md text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none appearance-none cursor-pointer text-on-surface font-semibold"
                  value={minVolume}
                  onChange={(e) => setMinVolume(e.target.value)}
                >
                  <option value="1 TEU / Bulan">1 TEU / Bulan</option>
                  <option value="5+ TEU / Bulan">5+ TEU / Bulan</option>
                  <option value="Hanya Kargo LCL">Hanya Kargo LCL</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none size-[18px]" />
              </div>
            </div>
            {/* Sort dropdown (relevance, score, terbaru) */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Urutkan Berdasarkan</label>
              <div className="relative">
                <ArrowUpDown className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant size-[18px]" />
                <select 
                  className="w-full pl-9 pr-8 py-2 bg-surface border border-outline-variant rounded-md text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none appearance-none cursor-pointer text-on-surface font-semibold"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                >
                  <option value="Relevansi">Relevansi</option>
                  <option value="Skor Kecocokan">Skor Kecocokan</option>
                  <option value="Terbaru">Terbaru</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none size-[18px]" />
              </div>
            </div>
            <div className="flex items-end">
              <button 
                onClick={handleApplyFilter}
                className="w-full h-[38px] bg-primary text-white rounded-md border border-transparent hover:bg-surface-tint transition-colors text-sm font-bold flex items-center justify-center gap-2 shadow-sm"
              >
                <ListFilter className="size-[18px]" />
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
                  <SearchX className="size-9" />
                </div>
                <h3 className="text-xl font-bold text-on-surface mb-2">Tidak Ada Pembeli yang Cocok</h3>
                <p className="text-xs text-on-surface-variant max-w-md leading-relaxed mb-6">
                  Maaf, kriteria penyaringan Anda saat ini tidak menemukan pembeli terdaftar yang cocok di pasar global. Coba ganti Negara Tujuan atau HS Code produk Anda (misal masukkan &apos;kopi&apos;).
                </p>
                <button 
                  onClick={handleResetFilter}
                  className="px-6 py-2.5 bg-primary text-on-primary text-xs font-bold rounded-lg hover:bg-surface-tint transition-colors flex items-center gap-2 shadow-sm"
                >
                  <RotateCcw className="size-[18px]" />
                  Atur Ulang Filter
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                {filteredBuyers.map((buyer) => {
                  const scoreVariant = buyer.score < 40 ? "danger" : buyer.score < 70 ? "warning" : "success";

                  return (
                    <div key={buyer.id} className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-200 animate-in fade-in">
                      <div className="p-5 border-b border-outline-variant flex justify-between items-start bg-surface-container-lowest">
                        <div className="flex gap-4">
                          <Avatar name={buyer.name} initials={buyer.logo} size="lg" />
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="text-lg font-bold text-primary">{buyer.name}</h3>
                              {buyer.id === "globaltech" && (
                                <Badge variant="success" icon={BadgeCheck}>Terverifikasi</Badge>
                              )}
                            </div>
                            <p className="text-xs text-on-surface-variant flex items-center gap-1.5 font-medium">
                              <MapPin className="size-4" /> {buyer.location}
                              <span className="text-outline-variant">•</span>
                              {buyer.category}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-[10px] font-bold text-on-surface-variant uppercase mb-1 tracking-wider">Skor Kredibilitas</div>
                          <Badge variant={scoreVariant} size="md" className="rounded-full tracking-tight normal-case">
                            {buyer.score}<span className="text-[10px] font-normal opacity-85">/100</span>
                          </Badge>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-3 divide-x divide-outline-variant border-b border-outline-variant bg-surface">
                        <div className="p-4">
                          <div className="text-[10px] font-bold text-on-surface-variant uppercase mb-2 flex items-center gap-1.5 tracking-wider">
                            <Calendar className="size-3.5" /> Pengiriman Terakhir
                          </div>
                          <div className="text-sm font-bold text-on-surface">{buyer.lastShipment}</div>
                          {buyer.id === "eurocafe" ? (
                            <div className="text-xs text-error flex items-center gap-1 mt-1 font-semibold">
                              <AlertTriangle className="size-3.5" /> Tidak Teratur
                            </div>
                          ) : (
                            <div className="text-xs text-on-surface-variant mt-1 font-semibold text-secondary">Asal: {buyer.origin}</div>
                          )}
                        </div>
                        <div className="p-4">
                          <div className="text-[10px] font-bold text-on-surface-variant uppercase mb-2 flex items-center gap-1.5 tracking-wider">
                            <Truck className="size-3.5" /> Rata-rata Volume
                          </div>
                          <div className="text-sm font-bold text-on-surface">{buyer.avgVolume}</div>
                          <div className="text-xs text-on-surface-variant mt-1 font-medium">
                            {buyer.id === "eurocafe" ? "Kapasitas tinggi" : "Permintaan tinggi"}
                          </div>
                        </div>
                        <div className="p-4">
                          <div className="text-[10px] font-bold text-on-surface-variant uppercase mb-2 flex items-center gap-1.5 tracking-wider">
                            <Tag className="size-3.5" /> Top HS Code
                          </div>
                          <div className="text-sm font-bold text-on-surface">{buyer.hsCodes}</div>
                          <div className="text-xs text-on-surface-variant mt-1 font-medium">
                            {buyer.id === "eurocafe" ? "Komoditas Campuran" : "Sesuai Katalog"}
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
                          className="px-4 py-2 bg-primary text-white rounded-md text-sm font-bold hover:bg-surface-tint transition-colors flex items-center gap-2 shadow-sm"
                        >
                          <Send className="size-[18px]" />
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


            {/* Context Widget 2: Terminal Stats */}
            <div className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden shadow-sm">
              <div className="p-4 border-b border-outline-variant bg-surface-container-lowest flex items-center gap-2">
                <Wrench className="text-on-surface-variant size-5" />
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
                <Gavel className="text-error size-5" />
                <div>
                  <h4 className="text-sm font-bold text-on-surface mb-1">Regulasi Deforestasi UE (EUDR)</h4>
                  <p className="text-xs text-on-surface-variant mb-2 leading-relaxed">Pastikan koordinat geolokasi (GPS) untuk lahan kopi Anda telah diperbarui sebelum menawarkan produk ke pembeli Eropa. Kepatuhan hukum sangat ketat.</p>
                  <button className="text-[11px] font-bold text-primary hover:underline flex items-center gap-1 uppercase tracking-wider">
                    Perbarui Koordinat <ArrowRight className="size-3.5" />
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
            <button className="w-8 h-8 flex items-center justify-center border border-outline-variant rounded hover:bg-surface-container-low transition-colors disabled:opacity-50 shadow-sm"><ChevronLeft className="size-[18px]" /></button>
            <button className="w-8 h-8 flex items-center justify-center border border-primary bg-primary text-on-primary rounded text-xs font-bold shadow-sm">1</button>
            <button className="w-8 h-8 flex items-center justify-center border border-outline-variant rounded hover:bg-surface-container-low transition-colors text-xs font-bold shadow-sm">2</button>
            <button className="w-8 h-8 flex items-center justify-center border border-outline-variant rounded hover:bg-surface-container-low transition-colors text-xs font-bold shadow-sm">3</button>
            <span className="w-8 h-8 flex items-center justify-center text-xs font-bold">...</span>
            <button className="w-8 h-8 flex items-center justify-center border border-outline-variant rounded hover:bg-surface-container-low transition-colors shadow-sm"><ChevronRight className="size-[18px]" /></button>
          </div>
        </div>

        {/* INTERACTIVE BUYER PROFILE MODAL */}
        {selectedBuyer && (
          <div className="fixed inset-0 bg-primary/65 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
            <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl w-full max-w-2xl shadow-2xl p-6 md:p-8 flex flex-col max-h-[85vh] overflow-hidden animate-in zoom-in-95 duration-300">
              
              <div className="flex justify-between items-center border-b border-outline-variant pb-4 mb-6 shrink-0">
                <div className="flex items-center gap-3">
                  <Avatar name={selectedBuyer.name} initials={selectedBuyer.logo} size="lg" className="rounded-xl text-xl" />
                  <div>
                    <h3 className="text-xl font-black text-primary leading-tight">{selectedBuyer.name}</h3>
                    <p className="text-xs text-on-surface-variant font-medium">{selectedBuyer.location} • {selectedBuyer.category}</p>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedBuyer(null)}
                  className="text-on-surface-variant hover:text-error p-1.5 rounded-full hover:bg-surface-container-low transition-colors"
                >
                  <X className="size-[22px]" />
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
                    <History className="size-[18px]" /> Riwayat Impor & Catatan Manifest
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
                    <Trophy className="size-[18px]" /> Kepatuhan Global & Sertifikasi
                  </h4>
                  <div className="bg-surface-container-low/50 border border-outline-variant rounded-lg p-4 space-y-2 text-xs font-medium">
                    <div className="flex justify-between border-b border-outline-variant/40 pb-2">
                      <span>Sertifikasi Aktif</span>
                      <span className="text-on-surface font-bold">{selectedBuyer.details.certifications}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Riwayat Pabean & Kepatuhan</span>
                      <span className="text-secondary font-bold flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span> {selectedBuyer.details.complianceHistory}
                      </span>
                    </div>
                  </div>
                </div>

                {/* AI Recommendation Context */}
                <div>
                  <h4 className="text-xs font-bold text-primary uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Sparkles className="size-[18px]" /> Analisis Kecocokan TradeConnect
                  </h4>
                  <div className="bg-secondary-fixed/10 border-l-4 border-secondary p-4 rounded-r-xl">
                    <p className="text-xs text-on-surface-variant font-medium leading-relaxed italic">
                      &ldquo;{selectedBuyer.rationale}&rdquo;
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
                  <Send className="size-4" />
                  Mulai Komunikasi (Outbound)
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Pitching Simulation Modal */}
        {isPitching && (
          <div className="fixed inset-0 bg-primary/65 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
            <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl w-full max-w-lg shadow-2xl p-6 md:p-8 flex flex-col items-center animate-in zoom-in-95 duration-300">
              
              {/* Spinner & AI Icon */}
              <div className="relative w-20 h-20 mb-6 flex items-center justify-center shrink-0">
                <div className="absolute inset-0 border-4 border-outline-variant rounded-full"></div>
                <div className="absolute inset-0 border-4 border-primary rounded-full border-t-transparent animate-spin"></div>
                <Sparkles className="text-primary animate-pulse size-8" />
              </div>

              <h3 className="text-xl font-bold text-primary mb-1">TradeConnect AI Outbound Pipeline</h3>
              <p className="text-xs text-on-surface-variant mb-6 uppercase tracking-wider font-bold">Pengiriman Email Penawaran Resmi</p>

              {/* Progress Steps */}
              <div className="w-full space-y-4 mb-6">
                {/* Step 1 */}
                <div className="flex items-center gap-3">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${pitchStep >= 2 ? 'bg-secondary text-on-secondary border-none' : 'bg-surface-variant animate-pulse text-on-surface-variant'}`}>
                    {pitchStep >= 2 ? <Check className="size-3.5" /> : "1"}
                  </div>
                  <span className={`text-xs font-semibold ${pitchStep >= 1 ? 'text-on-surface' : 'text-on-surface-variant'}`}>Menganalisis kecocokan katalog dan kepatuhan hukum kebun</span>
                </div>

                {/* Step 2 */}
                <div className={`flex items-center gap-3 transition-opacity duration-300 ${pitchStep >= 2 ? 'opacity-100' : 'opacity-30'}`}>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${pitchStep >= 3 ? 'bg-secondary text-on-secondary border-none' : 'bg-surface-variant animate-pulse text-on-surface-variant'}`}>
                    {pitchStep >= 3 ? <Check className="size-3.5" /> : "2"}
                  </div>
                  <span className={`text-xs font-semibold ${pitchStep >= 2 ? 'text-on-surface' : 'text-on-surface-variant'}`}>Mencocokkan manifest impor pabean GlobalTech</span>
                </div>

                {/* Step 3 */}
                <div className={`flex items-center gap-3 transition-opacity duration-300 ${pitchStep >= 3 ? 'opacity-100' : 'opacity-30'}`}>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${pitchStep >= 4 ? 'bg-secondary text-on-secondary border-none' : 'bg-surface-variant animate-pulse text-on-surface-variant'}`}>
                    {pitchStep >= 4 ? <Check className="size-3.5" /> : "3"}
                  </div>
                  <span className={`text-xs font-semibold ${pitchStep >= 3 ? 'text-on-surface' : 'text-on-surface-variant'}`}>Menyusun surat penawaran B2B formal dalam Bahasa Inggris</span>
                </div>

                {/* Step 3.5: Preview of the drafted email */}
                {pitchStep === 3 && (
                  <div className="bg-surface border border-outline-variant p-3.5 rounded-lg text-[10px] font-mono text-on-surface-variant shadow-inner max-h-24 overflow-y-auto animate-in slide-in-from-top-2 duration-300 w-full text-left">
                    <span className="text-primary font-bold">Subjek:</span> Perkenalan B2B: {productName}<br/>
                    <span className="text-primary font-bold">Kpd:</span> klaus.weber@globaltech.de<br/>
                    <span className="text-on-surface-variant">---</span><br/>
                    Dear Mr. Weber,<br/>
                    {companyName} offers premium {productName} (HS {isRattan ? "9401.52" : "0901.11"}) crafted under highest standards. Our monthly production capacity is {capacity} and MOQ is {moq}. Our NIB ({nib}) is fully verified...
                  </div>
                )}

                {/* Step 4 */}
                <div className={`flex items-center gap-3 transition-opacity duration-300 ${pitchStep >= 4 ? 'opacity-100' : 'opacity-30'}`}>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${pitchStep >= 5 ? 'bg-secondary text-on-secondary border-none' : 'bg-surface-variant animate-pulse text-on-surface-variant'}`}>
                    {pitchStep >= 5 ? <Check className="size-3.5" /> : "4"}
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

        {/* INTERACTIVE REMINDER SCHEDULER MODAL */}
        {showReminderModal && (
          <div className="fixed inset-0 bg-primary/65 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
            <form 
              onSubmit={handleSaveReminder}
              className="bg-surface-container-lowest border border-outline-variant rounded-2xl w-full max-w-md shadow-2xl p-6 md:p-8 flex flex-col gap-5 animate-in zoom-in-95 duration-300 pointer-events-auto text-sm text-on-surface font-sans"
            >
              <div className="flex justify-between items-center border-b border-outline-variant pb-3 shrink-0">
                <div className="flex items-center gap-2">
                  <BellPlus className="text-primary size-6" />
                  <h3 className="text-base font-bold text-primary">Jadwalkan Pengingat Ekspor</h3>
                </div>
                <button 
                  type="button"
                  onClick={() => setShowReminderModal(false)}
                  className="text-on-surface-variant hover:text-error p-1 rounded-full hover:bg-surface-container-high transition-colors"
                >
                  <X className="size-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Judul Pengingat *</label>
                  <input 
                    type="text"
                    required
                    placeholder="misal: Kirim dokumen penawaran ke GlobalTech"
                    value={reminderTitle}
                    onChange={(e) => setReminderTitle(e.target.value)}
                    className="w-full px-3 py-2 bg-surface border border-outline-variant rounded-md text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none text-on-surface font-medium"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Tanggal *</label>
                    <input 
                      type="date"
                      required
                      value={reminderDate}
                      onChange={(e) => setReminderDate(e.target.value)}
                      className="w-full px-3 py-2 bg-surface border border-outline-variant rounded-md text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none text-on-surface font-medium"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Waktu</label>
                    <input 
                      type="time"
                      value={reminderTime}
                      onChange={(e) => setReminderTime(e.target.value)}
                      className="w-full px-3 py-2 bg-surface border border-outline-variant rounded-md text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none text-on-surface font-medium"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Tipe Pengingat</label>
                  <div className="relative">
                    <select 
                      value={reminderType}
                      onChange={(e) => setReminderType(e.target.value)}
                      className="w-full px-3 pr-10 py-2 bg-surface border border-outline-variant rounded-md text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none appearance-none cursor-pointer text-on-surface font-medium"
                    >
                      <option value="Email Penawaran">Email Penawaran</option>
                      <option value="Pemeriksaan Kepatuhan">Pemeriksaan Kepatuhan</option>
                      <option value="Tanda Tangan PO">Tanda Tangan PO</option>
                      <option value="Follow-up Logistik">Follow-up Logistik</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none size-[18px]" />
                  </div>
                </div>
              </div>

              <div className="border-t border-outline-variant pt-3 flex justify-end gap-3 shrink-0">
                <button 
                  type="button"
                  onClick={() => setShowReminderModal(false)}
                  className="px-4 py-2 border border-outline-variant hover:bg-surface rounded-lg text-xs font-bold text-on-surface transition-colors"
                >
                  Batal
                </button>
                <button 
                  type="submit"
                  className="px-5 py-2 bg-primary text-on-primary hover:bg-surface-tint rounded-lg text-xs font-bold transition-colors shadow-md"
                >
                  Jadwalkan Pengingat
                </button>
              </div>
            </form>
          </div>
        )}

        {/* CUSTOM PREMIUM INTERACTIVE TOAST */}
        {toast && (
          <div className="fixed bottom-6 right-6 z-[10000] bg-primary text-white border border-secondary-fixed/40 px-5 py-3 rounded-xl shadow-2xl flex items-center gap-2.5 animate-in slide-in-from-bottom duration-300 font-sans">
            <CheckCircle2 className="text-secondary-fixed size-6" />
            <span className="text-xs font-bold">{toast.message}</span>
          </div>
        )}

      </div>
    </div>
  );
}
