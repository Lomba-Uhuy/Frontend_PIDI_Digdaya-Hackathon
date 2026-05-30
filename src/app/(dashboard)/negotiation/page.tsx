"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getStep, setStep as setJourneyStep, setFinalPrice } from "../../../lib/state";
import { ChatMessage } from "../../../types";
import { classifyIntent, generateReply, calculatePrice, DraftReply, checkRedFlag, getCredibilityDimensions, RedFlagReport } from "../../../lib/api";

export default function NegotiationHubPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<string>("onboarding");
  const [inputValue, setInputValue] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [klausRepliedCount, setKlausRepliedCount] = useState(0);

  // States for Resizable/Collapsible Mentor Sidebar
  const [mentorWidth, setMentorWidth] = useState(380);
  const [isResizing, setIsResizing] = useState(false);

  // States for Decoupled Mock Services
  const [activeBuyerId, setActiveBuyerId] = useState("klaus");
  const [activeIntent, setActiveIntent] = useState<"inquiry" | "negotiation" | "complaint">("negotiation");
  const [intentConfidence, setIntentConfidence] = useState(0.95);
  const [drafts, setDrafts] = useState<DraftReply[]>([]);
  const [isDraftGenerating, setIsDraftGenerating] = useState(false);

  // States for Mini Export Price Calculator
  const [hpp, setHpp] = useState(2.00);
  const [margin, setMargin] = useState(15);
  const [localHandling, setLocalHandling] = useState(0.15);
  const [freight, setFreight] = useState(0.20);
  const [insurance, setInsurance] = useState(0.10);

  // States for B2B Risk & Credibility Intelligence
  const [redFlagReport, setRedFlagReport] = useState<RedFlagReport | null>(null);
  const [isLoadingRisk, setIsLoadingRisk] = useState(false);

  // Collapsible Left Conversation Panel
  const [isLeftPanelOpen, setIsLeftPanelOpen] = useState(true);

  // Dynamic Company & Product states
  const [productName, setProductName] = useState("Biji Kopi Robusta Premium");
  const [productType, setProductType] = useState("coffee");
  const [companyName, setCompanyName] = useState("PT Nusantara Global Coffee");

  const unitLabel = productType === "rattan" ? "pcs" : "kg";

  // Mock list of buyers for left panel
  const buyers = [
    {
      id: "klaus",
      name: "Klaus Weber",
      company: "GlobalTech Imports GmbH",
      country: "Jerman",
      flag: "🇩🇪",
      product: productName,
      lastMessage: klausRepliedCount === 1 
        ? "Silakan buat Purchase Order resmi di sistem..." 
        : "Kami sangat tertarik untuk memesan satu kontainer...",
      time: "09:42",
      unread: false,
      status: "Aktif"
    },
    {
      id: "indoeuro",
      name: "Jan de Jong",
      company: "IndoEuro Trading Ltd",
      country: "Belanda",
      flag: "🇳🇱",
      product: "Kerajinan Bambu Artistik",
      lastMessage: "Kontrak ditandatangani, terima kasih banyak!",
      time: "25 Mei",
      unread: false,
      status: "Selesai"
    },
    {
      id: "aseanfood",
      name: "Lim Shen",
      company: "Asean Food Products",
      country: "Singapura",
      flag: "🇸🇬",
      product: "Keripik Tempe Aneka Rasa",
      lastMessage: "Pembayaran tahap pertama berhasil diproses.",
      time: "24 Mei",
      unread: false,
      status: "Selesai"
    },
    {
      id: "nippon",
      name: "Kenji Sato",
      company: "Nippon Organic Foods",
      country: "Jepang",
      flag: "🇯🇵",
      product: "Teh Hijau Matcha Organik",
      lastMessage: "Mohon kirimkan sertifikasi bebas pestisida Anda.",
      time: "23 Mei",
      unread: true,
      status: "Menunggu"
    }
  ];

  // Derived Export pricing calculations
  const pricingRaw = calculatePrice(hpp, margin, localHandling, freight, insurance);
  const isRattanProduct = productType === "rattan";
  const pricing = {
    ...pricingRaw,
    marketAvg: isRattanProduct ? 55.00 : 2.80,
    status: isRattanProduct 
      ? (pricingRaw.cif > 55.00 * 1.05 ? "high" : pricingRaw.cif < 55.00 * 0.92 ? "low" : "competitive") as "high" | "low" | "competitive"
      : pricingRaw.status
  };

  const startResizing = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  };

  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      const newWidth = window.innerWidth - e.clientX;
      if (newWidth < 150) {
        setMentorWidth(0);
      } else if (newWidth > 600) {
        setMentorWidth(600);
      } else {
        setMentorWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isResizing]);

  // Hooking /generate-reply and /classify-intent simulation
  const fetchDraftsAndIntent = async (text: string) => {
    setIsDraftGenerating(true);
    try {
      const intentRes = await classifyIntent(text);
      setActiveIntent(intentRes.intent);
      setIntentConfidence(intentRes.confidence);

      // Floor price checks based on calculated CIF
      const replyRes = await generateReply(text, productName, pricing.cif);
      setDrafts(replyRes.drafts);
    } catch (err) {
      console.error("Failed to generate drafts & intents:", err);
    } finally {
      setIsDraftGenerating(false);
    }
  };

  // Sync state on mount
  useEffect(() => {
    const step = getStep();
    setCurrentStep(step);

    const savedProduct = localStorage.getItem("tradeconnect_product_name") || "Biji Kopi Robusta Premium";
    setProductName(savedProduct);
    const savedType = localStorage.getItem("tradeconnect_product_type") || "coffee";
    setProductType(savedType);
    const savedCompany = localStorage.getItem("tradeconnect_company_name") || "PT Nusantara Global Coffee";
    setCompanyName(savedCompany);

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

    const buyerIntroText = isRattan 
      ? `Kepada Rekan Pemasok TradeConnect,\n\nKami telah meninjau katalog awal Anda untuk kursi rotan anyaman. Kami sangat tertarik untuk memesan satu kontainer uji coba (sekitar 150 unit kursi) untuk pengiriman Kuartal 3 (Q3) ke pelabuhan Hamburg.\n\nNamun, harga CIF yang Anda tawarkan saat ini adalah $55,00/unit. Mengingat fluktuasi pasar saat ini dan demi membangun kemitraan jangka panjang, kami mengajukan revisi penawaran harga sebesar $45,00/unit. Mohon beri saran mengenai kelayakan harga tersebut dan berikan proforma invoice terbaru jika Anda setuju.`
      : `Kepada Rekan Pemasok TradeConnect,\n\nKami telah meninjau katalog awal Anda untuk biji kopi robusta. Kami sangat tertarik untuk memesan satu kontainer uji coba (sekitar 18 metrik ton) untuk pengiriman Kuartal 3 (Q3) ke pelabuhan Hamburg.\n\nNamun, harga CIF yang Anda tawarkan saat ini adalah $2,85/kg. Mengingat fluktuasi pasar saat ini dan demi membangun kemitraan jangka panjang, kami mengajukan revisi penawaran harga sebesar $2,50/kg. Mohon beri saran mengenai kelayakan harga tersebut dan berikan proforma invoice terbaru jika Anda setuju.`;

    if (step === "contacted_klaus") {
      setIsTyping(true);
      const timer = setTimeout(() => {
        setIsTyping(false);
        setMessages([
          {
            sender: "buyer",
            text: buyerIntroText,
            time: "09:42",
          }
        ]);
        setJourneyStep("negotiating");
        setCurrentStep("negotiating");
        
        // Dynamic fetch of drafts and intents for this new incoming message
        setIsDraftGenerating(true);
        classifyIntent(buyerIntroText).then((intentRes) => {
          setActiveIntent(intentRes.intent);
          setIntentConfidence(intentRes.confidence);
          const currentCif = isRattan ? 55.00 : 2.85;
          generateReply(buyerIntroText, savedProduct, currentCif).then((replyRes) => {
            setDrafts(replyRes.drafts);
            setIsDraftGenerating(false);
          });
        });
      }, 2000);
      return () => clearTimeout(timer);
    } else if (step !== "onboarding" && step !== "verified") {
      setMessages([
        {
          sender: "buyer",
          text: buyerIntroText,
          time: "09:42",
        }
      ]);
      
      setIsDraftGenerating(true);
      classifyIntent(buyerIntroText).then((intentRes) => {
        setActiveIntent(intentRes.intent);
        setIntentConfidence(intentRes.confidence);
        const currentCif = isRattan ? 55.00 : 2.85;
        generateReply(buyerIntroText, savedProduct, currentCif).then((replyRes) => {
          setDrafts(replyRes.drafts);
          setIsDraftGenerating(false);
        });
      });
    }
  }, []);

  // Fetch B2B risk analysis when active buyer changes
  useEffect(() => {
    setIsLoadingRisk(true);
    checkRedFlag(activeBuyerId).then((report) => {
      setRedFlagReport(report);
      setIsLoadingRisk(false);
    });
  }, [activeBuyerId]);

  const handleDraftSelect = (draftText: string) => {
    setInputValue(draftText);
  };

  const handleApproveDraft = (draftText: string) => {
    const newMsgs: ChatMessage[] = [
      ...messages,
      { 
        sender: 'me', 
        text: draftText, 
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
      }
    ];
    setMessages(newMsgs);
    setInputValue("");

    // Simulate Klaus's final reply
    if (klausRepliedCount === 0) {
      setIsTyping(true);
      setTimeout(async () => {
        setIsTyping(false);
        const savedCompany = localStorage.getItem("tradeconnect_company_name") || "PT Nusantara Global Coffee";
        const savedProduct = localStorage.getItem("tradeconnect_product_name") || "Biji Kopi Robusta Premium";
        const isRattan = savedProduct.toLowerCase().includes("rotan") || savedProduct.toLowerCase().includes("rattan") || savedProduct.toLowerCase().includes("kursi");
        
        const buyerMsg = isRattan
          ? `Terima kasih atas tanggapan Anda dan proposal jalan tengah yang sangat wajar. Kami menghargai reputasi kualitas ${savedCompany} dan setuju untuk menutup kesepakatan di harga $50,00/unit CIF Pelabuhan Hamburg dengan struktur pembayaran 30% DP dan 70% LC sesuai usulan Anda.\n\nSilakan buat Purchase Order resmi di sistem agar kita dapat segera melakukan penandatanganan dokumen dan pemeriksaan kepatuhan hukum ekspor.`
          : `Terima kasih atas tanggapan Anda dan proposal jalan tengah yang sangat wajar. Kami menghargai reputasi kualitas ${savedCompany} dan setuju untuk menutup kesepakatan di harga $2,75/kg CIF Pelabuhan Hamburg dengan struktur pembayaran 30% DP dan 70% LC sesuai usulan Anda.\n\nSilakan buat Purchase Order resmi di sistem agar kita dapat segera melakukan penandatanganan dokumen dan pemeriksaan kepatuhan hukum ekspor.`;
        setMessages([
          ...newMsgs,
          {
            sender: "buyer",
            text: buyerMsg,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          }
        ]);
        setFinalPrice(isRattan ? 50.00 : 2.75);
        setJourneyStep("compliance");
        setCurrentStep("compliance");
        setKlausRepliedCount(1);
        
        // Dynamic fetch of drafts and intents for this new incoming message
        fetchDraftsAndIntent(buyerMsg);
      }, 2500);
    }
  };

  const handleSend = () => {
    if (!inputValue.trim()) return;
    const userMsg = inputValue;
    const newMsgs: ChatMessage[] = [
      ...messages,
      { 
        sender: 'me', 
        text: userMsg, 
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
      }
    ];
    setMessages(newMsgs);
    setInputValue("");

    // Classify intent for high-fidelity responses
    classifyIntent(userMsg).then((res) => {
      if (klausRepliedCount === 0) {
        setIsTyping(true);
        setTimeout(async () => {
          setIsTyping(false);
          const savedCompany = localStorage.getItem("tradeconnect_company_name") || "PT Nusantara Global Coffee";
          const savedProduct = localStorage.getItem("tradeconnect_product_name") || "Biji Kopi Robusta Premium";
          const isRattan = savedProduct.toLowerCase().includes("rotan") || savedProduct.toLowerCase().includes("rattan") || savedProduct.toLowerCase().includes("kursi");
          
          const buyerMsg = isRattan
            ? `Terima kasih atas tanggapan Anda dan proposal jalan tengah yang sangat wajar. Kami menghargai reputasi kualitas ${savedCompany} dan setuju untuk menutup kesepakatan di harga $50,00/unit CIF Pelabuhan Hamburg dengan struktur pembayaran 30% DP dan 70% LC sesuai usulan Anda.\n\nSilakan buat Purchase Order resmi di sistem agar kita dapat segera melakukan penandatanganan dokumen dan pemeriksaan kepatuhan hukum ekspor.`
            : `Terima kasih atas tanggapan Anda dan proposal jalan tengah yang sangat wajar. Kami menghargai reputasi kualitas ${savedCompany} dan setuju untuk menutup kesepakatan di harga $2,75/kg CIF Pelabuhan Hamburg dengan struktur pembayaran 30% DP dan 70% LC sesuai usulan Anda.\n\nSilakan buat Purchase Order resmi di sistem agar kita dapat segera melakukan penandatanganan dokumen dan pemeriksaan kepatuhan hukum ekspor.`;
          setMessages([
            ...newMsgs,
            {
              sender: "buyer",
              text: buyerMsg,
              time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            }
          ]);
          setFinalPrice(isRattan ? 50.00 : 2.75);
          setJourneyStep("compliance");
          setCurrentStep("compliance");
          setKlausRepliedCount(1);
          
          fetchDraftsAndIntent(buyerMsg);
        }, 2500);
      }
    });
  };

  const handleRejectDraft = (draftId: string) => {
    setIsDraftGenerating(true);
    setTimeout(() => {
      setDrafts((prev) => 
        prev.map((d) => {
          if (d.id === draftId) {
            return {
              ...d,
              title: `${d.title} (Alternatif AI)`,
              strategy: "Draf RAG diregenerasi dengan fokus Incoterms EXW (Ex-Works) untuk memotong ongkos logistik internasional.",
              text: "Kami sangat menghargai feedback Anda. Terkait harga target $2.50/kg, kami bersedia memprosesnya khusus untuk pesanan trial ini, asalkan klausul Incoterms dialihkan menjadi EXW (Ex-Works) Gudang Surabaya kami. Dengan demikian, biaya pengapalan dan asuransi Hamburg sepenuhnya dikelola oleh pihak Anda. Silakan beri tahu kami jika opsi ini dapat diterima."
            };
          }
          return d;
        })
      );
      setIsDraftGenerating(false);
    }, 1000);
  };

  if (currentStep === "onboarding" || currentStep === "verified") {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center bg-surface-bright p-8">
        <div className="max-w-md text-center bg-surface-container-lowest p-8 border border-outline-variant rounded-2xl shadow-sm flex flex-col items-center">
          <div className="w-16 h-16 bg-indigo-50 text-[#070235] border border-outline-variant rounded-full flex items-center justify-center mb-4">
            <span className="material-symbols-outlined text-4xl">mail_lock</span>
          </div>
          <h2 className="text-xl font-bold text-[#070235] mb-2">Tidak Ada Negosiasi Aktif</h2>
          <p className="text-sm text-on-surface-variant mb-6">
            Anda belum memulai komunikasi dengan pembeli mana pun. Silakan buka menu <strong>Pencarian Pembeli</strong> untuk menemukan importir yang cocok dan kirimkan draf email perkenalan AI pertama Anda.
          </p>
          <button 
            onClick={() => router.push('/buyer-discovery')}
            className="bg-primary text-on-primary px-6 py-2.5 rounded-lg text-sm font-bold hover:bg-surface-tint transition-colors flex items-center gap-2 shadow-sm"
          >
            Buka Pencarian Pembeli
            <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex overflow-hidden h-full">
      {/* ========================================================================= */}
      {/* PANEL 1: LEFT PANE - Conversation List (Collapsible) */}
      {/* ========================================================================= */}
      <aside 
        style={{ width: isLeftPanelOpen ? "280px" : "0px", display: isLeftPanelOpen ? "flex" : "none" }}
        className={`flex-shrink-0 bg-surface-container-low border-r border-outline-variant flex flex-col h-full overflow-hidden transition-all duration-300 animate-in slide-in-from-left z-20 ${
          isLeftPanelOpen ? "absolute lg:relative left-0 top-0 bottom-0 shadow-2xl lg:shadow-none" : ""
        }`}
      >
        {/* Sidebar Header */}
        <div className="p-4 border-b border-outline-variant bg-surface-container-lowest flex flex-col gap-3 flex-shrink-0">
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-bold text-[#070235] uppercase tracking-wider">Hub Negosiasi</h3>
            <span className="bg-primary/10 text-primary text-[10px] font-bold px-2 py-0.5 rounded-full">
              4 Pembeli
            </span>
          </div>
          {/* Search bar */}
          <div className="relative flex items-center">
            <span className="material-symbols-outlined absolute left-2.5 text-on-surface-variant text-[16px]">search</span>
            <input 
              type="text" 
              placeholder="Cari pembeli atau negara..." 
              className="w-full bg-surface border border-outline-variant rounded-lg pl-8 pr-3 py-1.5 text-xs text-on-surface outline-none focus:border-primary transition-all"
            />
          </div>
        </div>
        
        {/* Buyer list */}
        <div className="flex-1 overflow-y-auto divide-y divide-outline-variant bg-surface">
          {buyers.map((buyer) => (
            <div 
              key={buyer.id}
              onClick={() => {
                if (buyer.id !== "klaus") {
                  alert(`Hubungan dengan ${buyer.company} diarsipkan. Percakapan demo saat ini berfokus pada Klaus Weber.`);
                }
              }}
              className={`p-3.5 flex flex-col gap-1 cursor-pointer transition-all ${
                buyer.id === activeBuyerId 
                  ? "bg-primary/5 border-l-4 border-primary" 
                  : "hover:bg-surface-container-lowest"
              }`}
            >
              <div className="flex justify-between items-start gap-1">
                <span className="text-xs font-bold text-on-surface truncate flex items-center gap-1.5">
                  <span>{buyer.flag}</span>
                  <span className="truncate">{buyer.company}</span>
                </span>
                <span className="text-[9px] text-on-surface-variant font-mono whitespace-nowrap">{buyer.time}</span>
              </div>
              <div className="text-[10px] text-on-surface-variant font-medium truncate">
                {buyer.product}
              </div>
              <p className="text-[11px] text-on-surface-variant truncate mt-0.5 font-normal">
                {buyer.lastMessage}
              </p>
              <div className="flex justify-between items-center mt-1.5">
                <span className={`text-[9px] px-2 py-0.5 rounded font-extrabold uppercase border ${
                  buyer.status === "Aktif" 
                    ? "bg-primary-container text-on-primary-container border-primary/20"
                    : buyer.status === "Selesai"
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                    : "bg-surface-container-high text-on-surface-variant border-outline-variant"
                }`}>
                  {buyer.status}
                </span>
                {buyer.unread && (
                  <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                )}
              </div>
            </div>
          ))}
        </div>
      </aside>

      {/* ========================================================================= */}
      {/* PANEL 2: MIDDLE PANE - Communication Thread & Chat */}
      {/* ========================================================================= */}
      <section className="flex-1 flex flex-col bg-surface border-r border-outline-variant relative h-full overflow-hidden">
        {/* RESPONSIVE BACKDROP OVERLAY */}
        {(isLeftPanelOpen || mentorWidth > 0) && (
          <div 
            onClick={() => {
              setIsLeftPanelOpen(false);
              setMentorWidth(0);
            }}
            className="block lg:hidden absolute inset-0 bg-[#070235]/35 backdrop-blur-[2px] z-10 animate-in fade-in duration-200 cursor-pointer"
          />
        )}
        {/* Thread Header */}
        <div className="px-5 py-3 border-b border-outline-variant bg-surface-container-lowest flex justify-between items-center flex-shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            {/* TOGGLE LEFT PANEL BUTTON */}
            <button 
              onClick={() => setIsLeftPanelOpen(!isLeftPanelOpen)}
              className="text-on-surface-variant hover:text-primary p-1.5 rounded-lg hover:bg-surface-container-low transition-colors shrink-0 mr-1"
              title={isLeftPanelOpen ? "Tutup Hub Negosiasi" : "Buka Hub Negosiasi"}
            >
              <span className="material-symbols-outlined text-[20px]">
                {isLeftPanelOpen ? "menu_open" : "menu"}
              </span>
            </button>

            <div className="flex flex-col gap-0.5 min-w-0">
              <h2 className="text-sm md:text-base font-bold text-on-surface truncate">GlobalTech Imports GmbH</h2>
              <div className="flex items-center gap-2 flex-wrap text-[10px] text-on-surface-variant font-medium">
                {/* Status Terhubung */}
                <span className="flex items-center gap-1 bg-primary-container/10 px-2 py-0.5 rounded text-[9px] font-bold text-primary uppercase border border-primary/20 shrink-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span> Terhubung via Email
                </span>

                {/* INTENT BADGE (compact) */}
                <span className={`flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-extrabold uppercase border shadow-sm shrink-0 ${
                  activeIntent === "negotiation"
                    ? "bg-amber-50 text-amber-700 border-amber-200"
                    : activeIntent === "inquiry"
                    ? "bg-blue-50 text-blue-700 border-blue-200"
                    : "bg-rose-50 text-rose-700 border-rose-200"
                }`}>
                  <span className="material-symbols-outlined text-[10px]">
                    {activeIntent === "negotiation" ? "payments" : activeIntent === "inquiry" ? "help" : "warning"}
                  </span>
                  Intent: {activeIntent === "negotiation" ? "Negosiasi" : activeIntent === "inquiry" ? "Pertanyaan" : "Keluhan"} ({Math.round(intentConfidence * 100)}%)
                </span>

                {/* Alamat Muted */}
                <span className="hidden sm:inline-block text-on-surface-variant/80">•</span>
                <span className="text-[10px] text-on-surface-variant/80 font-medium truncate">Frankfurt, Jerman • UID: DE123456789</span>
              </div>
            </div>
          </div>
          
          <div className="flex gap-2 items-center shrink-0">
            {mentorWidth === 0 && (
              <button 
                onClick={() => setMentorWidth(380)}
                className="bg-[#070235] text-[#85f8c4] border border-[#85f8c4]/30 px-3 py-1.5 rounded-lg text-[10px] font-extrabold uppercase flex items-center gap-1.5 hover:bg-[#070235]/80 transition-all shadow-md animate-in fade-in duration-300"
              >
                <span className="material-symbols-outlined text-[16px]">menu_open</span>
                Asisten AI
              </button>
            )}
            <div className="bg-surface-container-low text-on-surface-variant px-2.5 py-1 rounded-md flex items-center gap-1.5 border border-outline-variant text-[10px] font-bold uppercase shrink-0">
              <span className="material-symbols-outlined text-[15px] text-primary">inventory_2</span>
              <span className="hidden sm:inline">RFQ: Pembelian Massal</span>
              <span className="sm:hidden">RFQ</span>
            </div>
          </div>
        </div>

        {/* Thread Content */}
        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6 bg-surface-bright pb-32">
          {/* Timestamp */}
          <div className="text-center">
            <span className="bg-surface-container-low px-3 py-1 rounded-full font-mono text-on-surface-variant text-[11px] font-medium tracking-wide">Hari Ini, 09:42</span>
          </div>

          {/* Outbound Pitch Alert */}
          <div className="bg-indigo-50/50 border border-primary/20 p-4 rounded-xl max-w-2xl text-left shadow-sm self-start flex gap-3 animate-in fade-in duration-500">
            <span className="material-symbols-outlined text-primary text-[24px] shrink-0 mt-0.5">forward_to_inbox</span>
            <div>
              <div className="text-[10px] font-bold uppercase tracking-widest text-[#070235] mb-1">Email Penawaran AI Terkirim</div>
              <p className="text-xs text-on-surface-variant font-medium leading-relaxed">
                Email penawaran resmi untuk <strong className="text-primary">{productName} {productType === "rattan" ? "(HS 9401.52)" : "Grade 1 (HS 0901.11)"}</strong> telah dikirim secara otomatis ke alamat importir <strong className="text-primary">klaus.weber@globaltech.de</strong> pada pukul 09:42.
              </p>
            </div>
          </div>

          {/* Messages */}
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex flex-col gap-1 max-w-2xl ${msg.sender === 'me' ? 'self-end' : 'self-start animate-in fade-in slide-in-from-bottom-2 duration-300'}`}>
              <span className={`text-[10px] font-bold uppercase text-on-surface-variant ${msg.sender === 'me' ? 'mr-1 text-right' : 'ml-1'}`}>
                {msg.sender === 'me' ? 'Anda • Eksportir' : 'Klaus Weber • GlobalTech'}
              </span>
              <div className={`p-4 rounded-xl shadow-sm ${msg.sender === 'me' ? 'bg-primary text-on-primary rounded-tr-sm' : 'bg-surface-container-lowest border border-outline-variant rounded-tl-sm'}`}>
                <p className="text-sm leading-relaxed whitespace-pre-line">{msg.text}</p>
                {msg.sender === 'buyer' && idx === 0 && (
                  <div className="mt-4 flex gap-2">
                    <div className="flex items-center gap-2 border border-outline-variant rounded-md px-3 py-2 bg-surface-container-low w-fit cursor-pointer hover:bg-surface-container-high transition-colors">
                      <span className="material-symbols-outlined text-error text-[20px]">picture_as_pdf</span>
                      <span className="font-mono text-on-surface text-xs font-medium">Specs_Requirement_v2.pdf</span>
                    </div>
                  </div>
                )}
              </div>
              <span className={`text-[10px] text-on-surface-variant ${msg.sender === 'me' ? 'mr-1 mt-1 text-right' : 'ml-1 mt-1'} font-medium`}>
                {msg.time}
              </span>
            </div>
          ))}

          {/* Typing Indicator */}
          {isTyping && (
            <div className="flex flex-col gap-1 max-w-2xl self-start animate-pulse">
              <span className="text-[10px] font-bold uppercase text-on-surface-variant ml-1">Koneksi Email • TradeConnect Gateway</span>
              <div className="bg-surface-container-lowest border border-outline-variant p-4 rounded-xl shadow-sm rounded-tl-sm flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce"></span>
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce [animation-delay:0.2s]"></span>
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce [animation-delay:0.4s]"></span>
                <span className="text-xs text-on-surface-variant ml-2 font-semibold">AI sedang mengunduh & menerjemahkan email baru dari Klaus Weber...</span>
              </div>
            </div>
          )}

          {/* Proceed Call to Action */}
          {currentStep === "compliance" && !isTyping && (
            <div className="flex justify-center my-6 animate-in zoom-in-95 duration-500">
              <button 
                onClick={() => router.push('/compliance')}
                className="bg-[#070235] text-white hover:bg-surface-tint shadow-xl px-8 py-4 rounded-xl font-bold text-sm flex items-center gap-2 hover:-translate-y-1 transition-all active:translate-y-0 shadow-[0_0_20px_rgba(7,2,53,0.2)] animate-pulse"
              >
                <span className="material-symbols-outlined">fact_check</span>
                LANJUTKAN KE PEMERIKSAAN KEPATUHAN (DEAL READINESS)
              </button>
            </div>
          )}
          {currentStep === "compliance" && <div className="h-16 shrink-0" />}
        </div>

        {/* Input Area */}
        <div className="p-4 border-t border-outline-variant bg-surface-container-lowest flex-shrink-0 w-full z-10">
          <div className="border border-outline-variant rounded-lg bg-surface focus-within:border-primary focus-within:ring-1 focus-within:ring-primary transition-all flex flex-col overflow-hidden shadow-sm">
            <textarea 
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              className="w-full bg-transparent border-none focus:ring-0 resize-none p-3 text-sm text-on-surface min-h-[80px] outline-none" 
              placeholder={currentStep === "compliance" ? "Kesepakatan tercapai! Tekan tombol Lanjutkan di atas untuk melangkah maju." : "Ketik balasan Anda dalam bahasa Indonesia..."}
              disabled={currentStep === "compliance"}
            ></textarea>
            <div className="px-3 py-2 border-t border-outline-variant flex justify-between items-center bg-surface-container-lowest">
              <div className="flex gap-2">
                <button className="text-on-surface-variant hover:text-primary transition-colors p-1.5 rounded hover:bg-surface-container-low" disabled={currentStep === "compliance"}>
                  <span className="material-symbols-outlined text-[20px]">attach_file</span>
                </button>
                <button className="text-on-surface-variant hover:text-primary transition-colors p-1.5 rounded hover:bg-surface-container-low" disabled={currentStep === "compliance"}>
                  <span className="material-symbols-outlined text-[20px]">description</span>
                </button>
              </div>
              <button 
                onClick={handleSend}
                disabled={!inputValue.trim() || currentStep === "compliance"}
                className="bg-[#070235] text-white font-semibold text-sm py-1.5 px-6 rounded-md flex items-center gap-2 hover:bg-surface-tint transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
              >
                Kirim <span className="material-symbols-outlined text-[16px]">send</span>
              </button>
            </div>
          </div>
          <div className="mt-2 flex justify-between items-center px-1">
            <span className="text-[10px] font-bold uppercase text-on-surface-variant flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px]">translate</span> Diterjemahkan secara otomatis oleh TradeConnect AI
            </span>
            <span className="font-mono text-on-surface-variant text-[10px]">Koneksi Aman</span>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* PANEL 3: RIGHT PANE - Asisten Mentor AI & Kalkulator Ekspor */}
      {/* ========================================================================= */}
      <aside 
        style={{ width: mentorWidth > 0 ? `${mentorWidth}px` : '0px', display: mentorWidth > 0 ? 'flex' : 'none' }}
        className={`flex-shrink-0 bg-surface-container-low flex flex-col overflow-y-auto border-l-[4px] border-primary h-full transition-all duration-300 animate-in slide-in-from-right z-20 ${
          mentorWidth > 0 ? "absolute lg:relative right-0 top-0 bottom-0 shadow-2xl lg:shadow-none w-full max-w-[340px] sm:max-w-[380px]" : ""
        }`}
      >
        {/* Resize Handle */}
        <div 
          onMouseDown={startResizing}
          className={`absolute left-0 top-0 bottom-0 w-3 -ml-1.5 cursor-col-resize z-30 transition-all flex items-center justify-center ${
            isResizing 
              ? 'bg-[#85f8c4]/30 border-l-2 border-[#85f8c4]' 
              : 'hover:bg-primary/10 hover:border-l-2 hover:border-primary'
          }`}
          title="Geser ke kanan untuk menutup"
        >
          <div className={`w-[2px] h-12 rounded-full transition-all ${
            isResizing ? 'bg-[#85f8c4]' : 'bg-[#070235]/30'
          }`} />
        </div>

        {/* Sidebar Header */}
        <div className="p-4 border-b border-outline-variant flex justify-between items-center bg-surface-container-lowest sticky top-0 z-10 pl-6 flex-shrink-0">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-primary text-[32px]" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
            <div>
              <h3 className="text-base font-bold text-primary">Asisten Mentor AI</h3>
              <p className="text-xs text-on-surface-variant">Analisis Negosiasi Real-time</p>
            </div>
          </div>
          <button 
            onClick={() => setMentorWidth(0)}
            className="text-on-surface-variant hover:text-error p-1.5 rounded-full hover:bg-surface-container-low transition-colors"
            title="Tutup Asisten Mentor"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Sidebar Scrollable Body */}
        <div className="p-4 flex flex-col gap-6 pl-6">
          {/* ========================================================================= */}
          {/* E. CREDIBILITY BREAKDOWN BARS */}
          {/* ========================================================================= */}
          <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-4 shadow-sm flex flex-col gap-3 animate-in fade-in duration-300">
            <div className="flex justify-between items-center border-b border-outline-variant pb-2">
              <h4 className="text-[11px] font-extrabold text-[#070235] uppercase tracking-wider flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[18px] text-primary">military_tech</span> Kredibilitas Pembeli
              </h4>
              <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-bold px-2 py-0.5 rounded font-mono">
                Skor: {activeBuyerId === "klaus" ? "92/100" : activeBuyerId === "nippon" ? "71/100" : "80/100"}
              </span>
            </div>

            <div className="flex flex-col gap-3 mt-1">
              {getCredibilityDimensions(activeBuyerId).map((dim, idx) => (
                <div key={idx} className="flex flex-col gap-1 bg-surface-bright/40 p-2.5 border border-outline-variant/40 rounded-lg">
                  <div className="flex justify-between text-[11px] font-bold text-on-surface">
                    <span className="truncate">{dim.name}</span>
                    <span className="font-mono text-primary">{dim.score}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-surface-container-high rounded-full overflow-hidden mt-0.5">
                    <div 
                      className={`h-full rounded-full transition-all duration-1000 ${
                        dim.score >= 80 
                          ? "bg-emerald-500" 
                          : dim.score >= 50 
                          ? "bg-amber-500" 
                          : "bg-rose-500"
                      }`}
                      style={{ width: `${dim.score}%` }}
                    ></div>
                  </div>
                  <p className="text-[10px] text-on-surface-variant leading-relaxed font-medium mt-1">
                    {dim.description}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* ========================================================================= */}
          {/* F. RED FLAG PANEL */}
          {/* ========================================================================= */}
          {isLoadingRisk ? (
            <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6 shadow-sm flex flex-col items-center justify-center gap-2">
              <span className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin"></span>
              <span className="text-[11px] text-on-surface-variant font-medium">Menganalisis riwayat komunikasi & profiling buyer...</span>
            </div>
          ) : redFlagReport && (
            <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-4 shadow-sm flex flex-col gap-3 animate-in fade-in duration-300">
              <div className="flex justify-between items-center border-b border-outline-variant pb-2">
                <h4 className="text-[11px] font-extrabold text-[#070235] uppercase tracking-wider flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[18px] text-primary">security</span> Laporan Risiko Keamanan
                </h4>
                <span className={`text-[9px] font-bold px-2 py-0.5 rounded uppercase border ${
                  redFlagReport.riskLevel === "LOW"
                    ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                    : redFlagReport.riskLevel === "MEDIUM"
                    ? "bg-amber-50 text-amber-800 border-amber-200 animate-pulse"
                    : "bg-rose-50 text-rose-800 border-rose-200 animate-bounce"
                }`}>
                  Risiko: {redFlagReport.riskLevel === "LOW" ? "Rendah" : redFlagReport.riskLevel === "MEDIUM" ? "Sedang" : "Tinggi"}
                </span>
              </div>

              <div className="flex flex-col gap-3 mt-1">
                {redFlagReport.flags.map((flag, idx) => (
                  <div key={idx} className="flex gap-2.5 items-start bg-surface-bright/40 p-2.5 border border-outline-variant/40 rounded-lg">
                    <span className={`material-symbols-outlined text-[18px] shrink-0 mt-0.5 ${
                      redFlagReport.riskLevel === "LOW" ? "text-emerald-600" : "text-amber-600"
                    }`}>
                      {flag.icon || "warning"}
                    </span>
                    <div className="flex flex-col gap-0.5">
                      <span className="text-xs font-bold text-on-surface flex items-center gap-1">
                        {flag.title}
                        {redFlagReport.riskLevel !== "LOW" && <span className="text-amber-600 font-bold">⚠️</span>}
                      </span>
                      <p className="text-[10px] text-on-surface-variant leading-relaxed font-medium">
                        {flag.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* A. MINI EXPORT PRICE CALCULATOR */}
          {/* ========================================================================= */}
          <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-4 shadow-sm flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-outline-variant pb-2">
              <h4 className="text-[11px] font-extrabold text-[#070235] uppercase tracking-wider flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[18px] text-primary">calculate</span> Kalkulator Harga Ekspor
              </h4>
              <span className={`text-[9px] font-bold px-2 py-0.5 rounded uppercase border ${
                pricing.status === "competitive" 
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                  : pricing.status === "high"
                  ? "bg-rose-50 text-rose-700 border-rose-200"
                  : "bg-blue-50 text-blue-700 border-blue-200"
              }`}>
                {pricing.status === "competitive" ? "Kompetitif BPS" : pricing.status === "high" ? "Terlalu Tinggi" : "Terlalu Murah"}
              </span>
            </div>

            {/* Pricing Input Fields */}
            <div className="flex flex-col gap-3">
              {/* Ex-Works / HPP */}
              <div className="flex flex-col gap-1">
                <div className="flex justify-between text-xs">
                  <span className="font-semibold text-on-surface-variant">HPP {productType === "rattan" ? "Rotan" : "Kopi"} (Ex-Works)</span>
                  <span className="font-mono text-primary font-bold">${hpp.toFixed(2)}/{unitLabel}</span>
                </div>
                <input 
                  type="range" 
                  min={productType === "rattan" ? "20.00" : "1.00"} 
                  max={productType === "rattan" ? "80.00" : "3.00"} 
                  step={productType === "rattan" ? "1.00" : "0.05"}
                  value={hpp}
                  onChange={(e) => setHpp(parseFloat(e.target.value))}
                  className="w-full h-1 bg-surface-container-high rounded-lg appearance-none cursor-pointer accent-primary"
                />
              </div>

              {/* Profit Margin */}
              <div className="flex flex-col gap-1">
                <div className="flex justify-between text-xs">
                  <span className="font-semibold text-on-surface-variant">Profit Margin</span>
                  <span className="font-mono text-primary font-bold">{margin}%</span>
                </div>
                <input 
                  type="range" 
                  min="5" 
                  max="40" 
                  step="1"
                  value={margin}
                  onChange={(e) => setMargin(parseInt(e.target.value))}
                  className="w-full h-1 bg-surface-container-high rounded-lg appearance-none cursor-pointer accent-primary"
                />
              </div>

              {/* Ocean Freight */}
              <div className="flex flex-col gap-1">
                <div className="flex justify-between text-xs">
                  <span className="font-semibold text-on-surface-variant">Ocean Freight (Hamburg)</span>
                  <span className="font-mono text-primary font-bold">${freight.toFixed(2)}/{unitLabel}</span>
                </div>
                <input 
                  type="range" 
                  min={productType === "rattan" ? "2.00" : "0.05"} 
                  max={productType === "rattan" ? "30.00" : "0.50"} 
                  step={productType === "rattan" ? "0.50" : "0.01"}
                  value={freight}
                  onChange={(e) => setFreight(parseFloat(e.target.value))}
                  className="w-full h-1 bg-surface-container-high rounded-lg appearance-none cursor-pointer accent-primary"
                />
              </div>

              {/* Local Port Handling & Sea Insurance grid */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="flex flex-col gap-1 bg-surface-bright p-2 border border-outline-variant rounded-lg">
                  <span className="font-semibold text-[10px] text-on-surface-variant uppercase">Port Handling</span>
                  <div className="flex items-center justify-between mt-1">
                    <span className="font-mono text-primary font-bold">${localHandling.toFixed(2)}</span>
                    <button 
                      onClick={() => setLocalHandling((prev) => parseFloat((prev === (productType === "rattan" ? 3.00 : 0.15) ? (productType === "rattan" ? 2.00 : 0.10) : (productType === "rattan" ? 3.00 : 0.15)).toFixed(2)))}
                      className="text-[9px] font-bold text-on-surface-variant hover:text-primary transition-all border border-outline-variant px-1.5 py-0.5 rounded bg-surface"
                    >
                      Ubah
                    </button>
                  </div>
                </div>
                <div className="flex flex-col gap-1 bg-surface-bright p-2 border border-outline-variant rounded-lg">
                  <span className="font-semibold text-[10px] text-on-surface-variant uppercase">Asuransi Laut</span>
                  <div className="flex items-center justify-between mt-1">
                    <span className="font-mono text-primary font-bold">${insurance.toFixed(2)}</span>
                    <button 
                      onClick={() => setInsurance((prev) => parseFloat((prev === (productType === "rattan" ? 2.00 : 0.10) ? (productType === "rattan" ? 1.00 : 0.05) : (productType === "rattan" ? 2.00 : 0.10)).toFixed(2)))}
                      className="text-[9px] font-bold text-on-surface-variant hover:text-primary transition-all border border-outline-variant px-1.5 py-0.5 rounded bg-surface"
                    >
                      Ubah
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Calculations Output */}
            <div className="bg-primary/5 border border-primary/20 rounded-xl p-3 flex flex-col gap-2">
              <div className="flex justify-between text-xs font-semibold text-on-surface">
                <span>1. FOB Value (Free on Board)</span>
                <span className="font-mono text-primary">${pricing.fob.toFixed(2)}/{unitLabel}</span>
              </div>
              <div className="flex justify-between text-xs font-semibold text-on-surface">
                <span>2. CFR Value (Cost & Freight)</span>
                <span className="font-mono text-primary">${pricing.cfr.toFixed(2)}/{unitLabel}</span>
              </div>
              <div className="flex justify-between text-xs font-bold text-[#070235] border-t border-outline-variant/60 pt-1.5">
                <span>3. CIF Hamburg (Total Cost)</span>
                <span className="font-mono text-primary">${pricing.cif.toFixed(2)}/{unitLabel}</span>
              </div>
              <div className="flex justify-between text-[10px] text-on-surface-variant font-medium font-mono pt-1">
                <span>Est. IDR (kurs 16.000)</span>
                <span>Rp {(pricing.cif * 16000).toLocaleString("id-ID")}/{unitLabel}</span>
              </div>
            </div>

            {/* BPS market average note */}
            <div className="text-[10px] text-on-surface-variant leading-normal flex gap-1.5 border-t border-outline-variant/40 pt-2">
              <span className="material-symbols-outlined text-[16px] text-primary">analytics</span>
              <p>
                Rata-rata ekspor BPS: <strong>${pricing.marketAvg.toFixed(2)}/{unitLabel}</strong>. 
                {pricing.cif === (productType === "rattan" ? 50.00 : 2.75) 
                  ? " Harga Anda sama persis dengan kesepakatan final!"
                  : pricing.status === "competitive" 
                  ? " Harga penawaran Anda sangat kompetitif untuk pasar Eropa."
                  : pricing.status === "high"
                  ? " Harga CIF melebihi rata-rata pasar. Siapkan opsi konsesi."
                  : " Harga terlalu murah, verifikasi profitabilitas Anda."}
              </p>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* B. FLOOR PRICE GUARDRAIL WARNING */}
          {/* ========================================================================= */}
          {pricing.cif > (productType === "rattan" ? 45.00 : 2.50) ? (
            <div className="bg-error-container border border-error rounded-xl p-4 shadow-sm relative overflow-hidden animate-in fade-in duration-300">
              <div className="absolute top-0 left-0 w-1.5 h-full bg-error"></div>
              <div className="flex items-start gap-3">
                <span className="material-symbols-outlined text-on-error-container text-error">warning</span>
                <div>
                  <h4 className="text-xs font-bold text-on-error-container mb-1 uppercase tracking-wider text-error-800">PERINGATAN HARGA DASAR</h4>
                  <p className="text-xs text-on-error-container leading-relaxed">
                    Pembeli meminta harga <strong>{productType === "rattan" ? "$45.00/unit" : "$2.50/kg"}</strong>. Estimasi harga CIF minimal Anda saat ini adalah <strong>${pricing.cif.toFixed(2)}/{unitLabel}</strong>.
                    <br/><br/>
                    Menerima tawaran {productType === "rattan" ? "$45.00/unit" : "$2.50/kg"} akan menekan margin operasional di bawah target keuntungan Anda.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-emerald-50 border border-emerald-300 rounded-xl p-4 shadow-sm relative overflow-hidden animate-in fade-in duration-300">
              <div className="absolute top-0 left-0 w-1.5 h-full bg-emerald-500"></div>
              <div className="flex items-start gap-3">
                <span className="material-symbols-outlined text-emerald-600">check_circle</span>
                <div>
                  <h4 className="text-xs font-bold text-emerald-800 mb-1 uppercase tracking-wider">HARGA DASAR AMAN</h4>
                  <p className="text-xs text-emerald-700 leading-relaxed">
                    Estimasi CIF Anda saat ini adalah <strong>${pricing.cif.toFixed(2)}/{unitLabel}</strong>, berada di bawah atau sama dengan tawaran pembeli ({productType === "rattan" ? "$45.00/unit" : "$2.50/kg"}).
                    <br/><br/>
                    Tingkat profitabilitas Anda sangat terjamin untuk negosiasi ini!
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* C. RAG TACTICAL ANNOTATIONS */}
          {/* ========================================================================= */}
          <div>
            <h4 className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mb-3 flex items-center gap-2">
              <span className="material-symbols-outlined text-[16px]">analytics</span> Analisis Taktis RAG
            </h4>
            <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-4 flex flex-col gap-4 shadow-sm">
              <div className="flex gap-3">
                <span className="material-symbols-outlined text-primary text-[20px]">info</span>
                <p className="text-xs text-on-surface leading-relaxed">
                  <strong>Konteks Pembeli:</strong> GlobalTech biasanya memulai negosiasi dengan diskon 15-20% dari harga penawaran awal (data historis 6 bulan terakhir).
                </p>
              </div>
              <div className="w-full h-px bg-outline-variant"></div>
              <div className="flex gap-3">
                <span className="material-symbols-outlined text-primary text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>lightbulb</span>
                <p className="text-xs text-on-surface leading-relaxed">
                  <strong>Strategi RAG:</strong> Tolak secara halus permintaan $2.50. Tawarkan kompromi di $2.75/kg, atau pertahankan $2.85/kg dengan menawarkan termin pembayaran yang lebih fleksibel (misal: 30% DP, 70% LC).
                </p>
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* D. AUTOMATED DRAFT SUGGESTIONS */}
          {/* ========================================================================= */}
          <div>
            <h4 className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mb-3 flex items-center gap-2">
              <span className="material-symbols-outlined text-[16px]">edit_document</span> Draft Balasan Otomatis
            </h4>
            
            {isDraftGenerating ? (
              <div className="flex flex-col items-center justify-center p-8 bg-surface-container-lowest border border-outline-variant rounded-xl shadow-sm gap-2">
                <span className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></span>
                <span className="text-xs text-on-surface-variant font-medium">Menganalisis RAG & membuat draf...</span>
              </div>
            ) : drafts.length === 0 ? (
              <div className="text-center p-6 bg-surface-container-lowest border border-outline-variant rounded-xl text-xs text-on-surface-variant font-medium">
                Belum ada draf balasan. Kirim atau terima pesan untuk men-generate draf balasan RAG otomatis.
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {drafts.map((draft, idx) => (
                  <div key={draft.id} className="text-left bg-surface-container-lowest border border-outline-variant rounded-xl p-4 hover:border-primary hover:shadow-md transition-all group flex flex-col gap-3 shadow-sm animate-in fade-in duration-300">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-semibold text-on-surface group-hover:text-primary transition-colors">{draft.title}</span>
                      <span className="bg-surface-container-low text-on-surface-variant text-[9px] px-2 py-0.5 rounded font-mono font-bold border border-outline-variant/60">DRAFT {idx + 1}</span>
                    </div>
                    <p className="text-xs text-on-surface-variant leading-relaxed font-medium">
                      "{draft.text}"
                    </p>
                    <div className="bg-primary/5 p-2.5 rounded-lg text-[10px] text-on-surface-variant leading-normal border border-primary/10">
                      <strong>Strategi AI:</strong> {draft.strategy}
                    </div>
                    
                    {/* Interactive Approve, Edit, Reject Action Buttons */}
                    {currentStep !== "compliance" && (
                      <div className="grid grid-cols-3 gap-2 pt-2 border-t border-outline-variant/60 shrink-0">
                        <button 
                          onClick={() => handleApproveDraft(draft.text)}
                          className="px-2 py-1.5 bg-[#85f8c4]/30 hover:bg-[#85f8c4]/50 text-emerald-800 rounded text-[10px] font-extrabold transition-colors flex items-center justify-center gap-1"
                          title="Setujui dan kirim balasan langsung"
                        >
                          <span className="material-symbols-outlined text-[12px]" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                          Approve
                        </button>
                        <button 
                          onClick={() => handleDraftSelect(draft.text)}
                          className="px-2 py-1.5 bg-[#070235]/10 hover:bg-[#070235]/20 text-[#070235] rounded text-[10px] font-extrabold transition-colors flex items-center justify-center gap-1"
                          title="Salin teks draf ke kolom input untuk diedit"
                        >
                          <span className="material-symbols-outlined text-[12px]">edit</span>
                          Edit
                        </button>
                        <button 
                          onClick={() => handleRejectDraft(draft.id)}
                          className="px-2 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded text-[10px] font-extrabold transition-colors flex items-center justify-center gap-1"
                          title="Tolak & buat draf alternatif baru"
                        >
                          <span className="material-symbols-outlined text-[12px]">sync</span>
                          Reject
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </aside>
    </div>
  );
}
