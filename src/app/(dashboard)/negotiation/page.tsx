"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getStep, setStep as setJourneyStep, setFinalPrice } from "../../../lib/state";
import { ChatMessage } from "../../../types";
import { classifyIntent, generateReply, getPricingBreakdown, PricingBreakdown, DraftReply, checkRedFlag, RedFlagReport } from "../../../lib/api";
import { getSelectedBuyer, SelectedBuyer } from "../../../lib/selected-buyer";
import { getMessages, sendMessage, requestBuyerReply, getActiveDealId, type DealMessage } from "../../../lib/deals";
import { getIcon } from "../../../lib/icon-map";
import { cn } from "../../../lib/utils";
import { useProductView } from "../../../lib/app-data";
import {
  AlertTriangle,
  ArrowRight,
  Award,
  BarChart3,
  Calculator,
  CheckCircle2,
  Edit3,
  FileText,
  HelpCircle,
  Info,
  Languages,
  Lightbulb,
  MailPlus,
  MailWarning,
  Menu,
  Package,
  PanelLeftClose,
  PanelRightOpen,
  Paperclip,
  Pencil,
  RefreshCw,
  Search,
  Send,
  Shield,
  ShieldCheck,
  Sparkles,
  Wallet,
  X,
} from "lucide-react";
import { Avatar } from "../../../components/ui/avatar";
import { Badge } from "../../../components/ui/badge";

export default function NegotiationHubPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<string>("onboarding");
  const [inputValue, setInputValue] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  // The active deal whose persisted thread we render (from Buyer Discovery).
  const [dealId, setDealId] = useState<string | null>(null);

  // States for Resizable/Collapsible Mentor Sidebar
  const [mentorWidth, setMentorWidth] = useState(380);
  const [isResizing, setIsResizing] = useState(false);

  // The real buyer selected in Buyer Discovery (backend record).
  const [selectedBuyer, setSelectedBuyer] = useState<SelectedBuyer | null>(null);
  const [activeIntent, setActiveIntent] = useState<"inquiry" | "negotiation" | "complaint">("negotiation");
  const [intentConfidence, setIntentConfidence] = useState(0.95);
  const [drafts, setDrafts] = useState<DraftReply[]>([]);
  const [isDraftGenerating, setIsDraftGenerating] = useState(false);
  // true when the backend AI drafting service is unavailable (e.g. LLM out of credits)
  const [draftUnavailable, setDraftUnavailable] = useState(false);

  // States for Mini Export Price Calculator (cost assumptions = user inputs)
  const [hpp, setHpp] = useState(2.00);
  const [margin, setMargin] = useState(15);
  const [localHandling, setLocalHandling] = useState(0.15);
  const [freight, setFreight] = useState(0.20);
  const [insurance, setInsurance] = useState(0.10);
  const [fxRate] = useState(16000); // IDR per USD (labeled assumption)
  // Backend pricing result (real FOB/CFR/CIF + real BPS benchmark).
  const [pricing, setPricing] = useState<PricingBreakdown | null>(null);
  const [seed, setSeed] = useState(2); // HPP seed = product floor price
  const [hsCode, setHsCode] = useState("");
  const [floorPrice, setFloorPrice] = useState<number | null>(null);

  // States for B2B Risk & Credibility Intelligence
  const [redFlagReport, setRedFlagReport] = useState<RedFlagReport | null>(null);
  const [isLoadingRisk, setIsLoadingRisk] = useState(false);

  // Collapsible Left Conversation Panel
  const [isLeftPanelOpen, setIsLeftPanelOpen] = useState(true);

  // Dynamic Company & Product states
  const [productName, setProductName] = useState("");
  const [productType, setProductType] = useState("");
  const [companyName, setCompanyName] = useState("");

  // The BPS export unit-value benchmark is per kilogram, so the waterfall is per kg.
  const unitLabel = "kg";

  // Mock list of buyers for left panel
  // The negotiation inbox reflects the real buyer selected in Buyer Discovery.
  const buyers = selectedBuyer
    ? [
        {
          id: selectedBuyer.buyer_id,
          name: selectedBuyer.name,
          company: selectedBuyer.name,
          country: selectedBuyer.country,
          product: productName,
          lastMessage: "Percakapan penawaran dengan pembeli ini.",
          time: "",
          unread: false,
          status: "Aktif",
        },
      ]
    : [];
  const credPct = Math.round((selectedBuyer?.credibility_score ?? 0) * 100);

  // ── Backend pricing (authoritative FOB/CFR/CIF + REAL BPS benchmark) ──────────
  const nOf = (s: string | null | undefined) => {
    const x = parseFloat(s ?? "");
    return Number.isFinite(x) ? x : 0;
  };
  const rate = pricing?.exchangeRate ?? fxRate;
  const fobUnit = nOf(pricing?.fobUnit);
  const cfrUnit = nOf(pricing?.cfrTotal);
  const cifUnit = nOf(pricing?.perUnitCIF);
  const bench = pricing?.benchmarkUnitValue != null ? parseFloat(pricing.benchmarkUnitValue) : null;
  const priceStatus: "competitive" | "high" | "low" | "unknown" =
    bench == null ? "unknown" : cifUnit > bench * 1.05 ? "high" : cifUnit < bench * 0.92 ? "low" : "competitive";

  // Fetch the authoritative breakdown from the backend whenever an input changes.
  useEffect(() => {
    const t = setTimeout(async () => {
      const res = await getPricingBreakdown({
        hpp,
        originCharges: localHandling,
        oceanFreight: freight,
        insuranceAmount: insurance,
        profitMarginPct: margin,
        hsCode: hsCode || undefined,
        exchangeRate: fxRate,
        qty: 1,
      });
      setPricing(res);
    }, 350);
    return () => clearTimeout(t);
  }, [hpp, margin, localHandling, freight, insurance, fxRate, hsCode]);

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
      if (intentRes) {
        setActiveIntent(intentRes.intent);
        setIntentConfidence(intentRes.confidence);
      }

      // Floor price checks based on calculated CIF
      const replyRes = await generateReply(text, productName, cifUnit);
      setDrafts(replyRes.drafts);
      setDraftUnavailable(Boolean(replyRes.unavailable));
    } catch (err) {
      console.error("Failed to generate drafts & intents:", err);
    } finally {
      setIsDraftGenerating(false);
    }
  };

  // ── Persisted negotiation thread ─────────────────────────────────────────────
  const nowTime = () => new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  const toChat = (m: DealMessage): ChatMessage => ({
    sender: m.sender === "umkm" ? "me" : "buyer",
    text: m.text,
    time: m.createdAt ? new Date(m.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : nowTime(),
  });

  const loadThread = async (id: string) => {
    const msgs = await getMessages(id);
    setMessages(msgs.map(toChat));
    const lastBuyer = [...msgs].reverse().find((m) => m.sender === "buyer");
    if (lastBuyer) void fetchDraftsAndIntent(lastBuyer.text);
  };

  // Send the UMKM message, persist it, then fetch the AI-simulated buyer reply.
  // The buyer's numeric position converges to a REAL settlement derived from the
  // seller's live CIF and the real BPS benchmark (no hardcoded prices).
  const postAndReply = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || !dealId) return;
    setInputValue("");
    setMessages((prev) => [...prev, { sender: "me", text: trimmed, time: nowTime() }]);
    await sendMessage(dealId, trimmed, activeIntent);
    setIsTyping(true);
    const reply = await requestBuyerReply(dealId, {
      sellerPrice: cifUnit || undefined,
      floorPrice: floorPrice ?? undefined,
      benchmarkUnitValue: bench ?? undefined,
      productName: productName || undefined,
      hsCode: hsCode || undefined,
    });
    setIsTyping(false);
    if (reply?.message) {
      setMessages((prev) => [...prev, toChat(reply.message)]);
      if (reply.accept && reply.agreedPrice != null) {
        setFinalPrice(reply.agreedPrice);
        setJourneyStep("compliance");
        setCurrentStep("compliance");
      }
      void fetchDraftsAndIntent(reply.message.text);
    }
  };

  // Load product/pricing context + the persisted thread on mount.
  const product = useProductView();
  useEffect(() => {
    setCurrentStep(getStep());
    setProductName(product.name);
    setProductType(product.productType);
    setCompanyName(product.companyName);

    // Seed the mini-calculator from the real product (floor price + HS code).
    const savedFloor = product.floorPriceUsd;
    setFloorPrice(savedFloor);
    setHsCode(product.hsCode || product.hsCandidates?.[0]?.hs_code || "");
    const s = savedFloor && savedFloor > 0 ? savedFloor : 2;
    setSeed(s);
    setHpp(s);
    setLocalHandling(Number((s * 0.06).toFixed(2)));
    setFreight(Number((s * 0.08).toFixed(2)));
    setInsurance(Number((s * 0.04).toFixed(2)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product]);

  // Load the persisted deal thread once on mount.
  useEffect(() => {
    const id = getActiveDealId();
    setDealId(id);
    if (id) void loadThread(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load the buyer the user selected in Buyer Discovery (real backend record).
  useEffect(() => {
    setSelectedBuyer(getSelectedBuyer());
  }, []);

  // Fetch B2B risk analysis for the selected real buyer (real profile input).
  useEffect(() => {
    if (!selectedBuyer) {
      setRedFlagReport(null);
      setIsLoadingRisk(false);
      return;
    }
    setIsLoadingRisk(true);
    checkRedFlag({ name: selectedBuyer.name, country: selectedBuyer.country }).then((report) => {
      setRedFlagReport(report);
      setIsLoadingRisk(false);
    });
  }, [selectedBuyer]);

  const handleDraftSelect = (draftText: string) => {
    setInputValue(draftText);
  };

  const handleApproveDraft = (draftText: string) => {
    void postAndReply(draftText);
  };

  const handleSend = () => {
    void postAndReply(inputValue);
  };

  const handleRejectDraft = (_draftId: string) => {
    // Regenerate drafts from the latest buyer message via the real RAG endpoint.
    const lastBuyer = [...messages].reverse().find((m) => m.sender === "buyer");
    void fetchDraftsAndIntent(lastBuyer?.text ?? productName);
  };

  if (currentStep === "onboarding" || currentStep === "verified") {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center bg-surface-bright p-8">
        <div className="max-w-md text-center bg-surface-container-lowest p-8 border border-outline-variant rounded-2xl shadow-sm flex flex-col items-center">
          <div className="w-16 h-16 bg-primary-container text-on-primary-container border border-outline-variant rounded-full flex items-center justify-center mb-4">
            <MailWarning className="size-9" />
          </div>
          <h2 className="text-xl font-bold text-primary mb-2 font-heading">Tidak Ada Negosiasi Aktif</h2>
          <p className="text-sm text-on-surface-variant mb-6">
            Anda belum memulai komunikasi dengan pembeli mana pun. Silakan buka menu <strong>Pencarian Pembeli</strong> untuk menemukan importir yang cocok dan kirimkan draf email perkenalan AI pertama Anda.
          </p>
          <button 
            onClick={() => router.push('/buyer-discovery')}
            className="bg-primary text-on-primary px-6 py-2.5 rounded-lg text-sm font-bold hover:bg-surface-tint transition-colors flex items-center gap-2 shadow-sm"
          >
            Buka Pencarian Pembeli
            <ArrowRight className="size-4" />
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
            <h3 className="text-xs font-bold text-primary uppercase tracking-wider">Hub Negosiasi</h3>
            <span className="bg-primary/10 text-primary text-[10px] font-bold px-2 py-0.5 rounded-full">
              4 Pembeli
            </span>
          </div>
          {/* Search bar */}
          <div className="relative flex items-center">
            <Search className="absolute left-2.5 text-on-surface-variant size-4" />
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
              className={`p-3.5 flex flex-col gap-1 transition-all ${
                buyer.id === selectedBuyer?.buyer_id
                  ? "bg-primary/5 border-l-4 border-primary"
                  : "hover:bg-surface-container-lowest"
              }`}
            >
              <div className="flex justify-between items-start gap-1">
                <span className="text-xs font-bold text-on-surface truncate flex items-center gap-1.5">
                  <Avatar name={buyer.company} size="sm" className="text-[10px]" />
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
                <Badge variant={buyer.status === "Aktif" ? "info" : buyer.status === "Selesai" ? "success" : "neutral"}>
                  {buyer.status}
                </Badge>
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
            className="block lg:hidden absolute inset-0 bg-primary/35 backdrop-blur-[2px] z-10 animate-in fade-in duration-200 cursor-pointer"
          />
        )}
        {/* Thread Header */}
        <div className="px-5 py-3 border-b border-outline-variant bg-surface-container-lowest flex justify-between items-center flex-shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            {/* TOGGLE LEFT PANEL BUTTON */}
            <button
              onClick={() => setIsLeftPanelOpen(!isLeftPanelOpen)}
              className="text-on-surface-variant hover:text-primary p-1.5 rounded-lg hover:bg-surface-container-low transition-colors shrink-0 mr-1 cursor-pointer"
              title={isLeftPanelOpen ? "Tutup Hub Negosiasi" : "Buka Hub Negosiasi"}
            >
              {isLeftPanelOpen ? <PanelLeftClose className="size-5" /> : <Menu className="size-5" />}
            </button>

            <div className="flex flex-col gap-0.5 min-w-0">
              <h2 className="text-sm md:text-base font-bold text-on-surface truncate">{selectedBuyer?.name ?? "Pilih pembeli"}</h2>
              <div className="flex items-center gap-2 flex-wrap text-[10px] text-on-surface-variant font-medium">
                {/* Status Terhubung */}
                <Badge variant="info" size="md">
                  <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" /> Terhubung via Email
                </Badge>

                {/* INTENT BADGE (compact) */}
                <Badge
                  variant={activeIntent === "negotiation" ? "warning" : activeIntent === "inquiry" ? "info" : "danger"}
                  size="md"
                  icon={activeIntent === "negotiation" ? Wallet : activeIntent === "inquiry" ? HelpCircle : AlertTriangle}
                >
                  Intent: {activeIntent === "negotiation" ? "Negosiasi" : activeIntent === "inquiry" ? "Pertanyaan" : "Keluhan"} ({Math.round(intentConfidence * 100)}%)
                </Badge>

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
                className="bg-primary text-secondary-fixed border border-secondary-fixed/30 px-3 py-1.5 rounded-lg text-[10px] font-extrabold uppercase flex items-center gap-1.5 hover:bg-primary-hover transition-all shadow-md animate-in fade-in duration-300 cursor-pointer"
              >
                <PanelRightOpen className="size-4" />
                Asisten AI
              </button>
            )}
            <div className="bg-surface-container-low text-on-surface-variant px-2.5 py-1 rounded-md flex items-center gap-1.5 border border-outline-variant text-[10px] font-bold uppercase shrink-0">
              <Package className="text-primary size-[15px]" />
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
          <div className="bg-primary-container/50 border border-primary/20 p-4 rounded-xl max-w-2xl text-left shadow-sm self-start flex gap-3 animate-in fade-in duration-500">
            <MailPlus className="text-on-primary-container shrink-0 mt-0.5 size-6" />
            <div>
              <div className="text-[10px] font-bold uppercase tracking-widest text-on-primary-container mb-1">Penawaran AI Disiapkan</div>
              <p className="text-xs text-on-surface-variant font-medium leading-relaxed">
                Penawaran untuk <strong className="text-on-primary-container">{productName || "produk Anda"}{hsCode ? ` (HS ${hsCode})` : ""}</strong> disiapkan untuk pembeli{" "}
                <strong className="text-on-primary-container">
                  {selectedBuyer?.name ?? "terpilih"}{selectedBuyer?.country ? ` (${selectedBuyer.country})` : ""}
                </strong>. Gunakan draf balasan AI di bawah untuk berkomunikasi.
              </p>
            </div>
          </div>

          {/* Messages */}
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex flex-col gap-1 max-w-2xl ${msg.sender === 'me' ? 'self-end' : 'self-start animate-in fade-in slide-in-from-bottom-2 duration-300'}`}>
              <span className={`text-[10px] font-bold uppercase text-on-surface-variant ${msg.sender === 'me' ? 'mr-1 text-right' : 'ml-1'}`}>
                {msg.sender === 'me' ? 'Anda • Eksportir' : `${selectedBuyer?.name ?? 'Pembeli'}${selectedBuyer?.country ? ' • ' + selectedBuyer.country : ''}`}
              </span>
              <div className={`p-4 rounded-xl shadow-sm ${msg.sender === 'me' ? 'bg-primary text-on-primary rounded-tr-sm' : 'bg-surface-container-lowest border border-outline-variant rounded-tl-sm'}`}>
                <p className="text-sm leading-relaxed whitespace-pre-line">{msg.text}</p>
                {msg.sender === 'buyer' && idx === 0 && (
                  <div className="mt-4 flex gap-2">
                    <div className="flex items-center gap-2 border border-outline-variant rounded-md px-3 py-2 bg-surface-container-low w-fit cursor-pointer hover:bg-surface-container-high transition-colors">
                      <FileText className="text-error size-5" />
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
                <span className="text-xs text-on-surface-variant ml-2 font-semibold">AI sedang mengunduh &amp; menerjemahkan email baru dari {selectedBuyer?.name ?? 'pembeli'}...</span>
              </div>
            </div>
          )}

          {/* Proceed Call to Action */}
          {currentStep === "compliance" && !isTyping && (
            <div className="flex justify-center my-6 animate-in zoom-in-95 duration-500">
              <button 
                onClick={() => router.push('/compliance')}
                className="bg-primary text-white hover:bg-surface-tint shadow-xl px-8 py-4 rounded-xl font-bold text-sm flex items-center gap-2 hover:-translate-y-1 transition-all active:translate-y-0 shadow-[0_0_20px_rgba(15,23,42,0.2)] animate-pulse"
              >
                <ShieldCheck className="size-6" />
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
                  <Paperclip className="size-5" />
                </button>
                <button className="text-on-surface-variant hover:text-primary transition-colors p-1.5 rounded hover:bg-surface-container-low" disabled={currentStep === "compliance"}>
                  <FileText className="size-5" />
                </button>
              </div>
              <button 
                onClick={handleSend}
                disabled={!inputValue.trim() || currentStep === "compliance"}
                className="bg-primary text-white font-semibold text-sm py-1.5 px-6 rounded-md flex items-center gap-2 hover:bg-surface-tint transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
              >
                Kirim <Send className="size-4" />
              </button>
            </div>
          </div>
          <div className="mt-2 flex justify-between items-center px-1">
            <span className="text-[10px] font-bold uppercase text-on-surface-variant flex items-center gap-1">
              <Languages className="size-3.5" /> Diterjemahkan secara otomatis oleh TradeConnect AI
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
              ? 'bg-secondary-fixed/30 border-l-2 border-secondary-fixed' 
              : 'hover:bg-primary/10 hover:border-l-2 hover:border-primary'
          }`}
          title="Geser ke kanan untuk menutup"
        >
          <div className={`w-[2px] h-12 rounded-full transition-all ${
            isResizing ? 'bg-secondary-fixed' : 'bg-primary/30'
          }`} />
        </div>

        {/* Sidebar Header */}
        <div className="p-4 border-b border-outline-variant flex justify-between items-center bg-surface-container-lowest sticky top-0 z-10 pl-6 flex-shrink-0">
          <div className="flex items-center gap-3">
            <Sparkles className="text-primary size-8" />
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
            <X className="size-5" />
          </button>
        </div>

        {/* Sidebar Scrollable Body */}
        <div className="p-4 flex flex-col gap-6 pl-6">
          {/* ========================================================================= */}
          {/* E. CREDIBILITY BREAKDOWN BARS */}
          {/* ========================================================================= */}
          <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-4 shadow-sm flex flex-col gap-3 animate-in fade-in duration-300">
            <div className="flex justify-between items-center border-b border-outline-variant pb-2">
              <h4 className="text-[11px] font-extrabold text-primary uppercase tracking-wider flex items-center gap-1.5">
                <Award className="text-primary size-[18px]" /> Kredibilitas Pembeli
              </h4>
              {selectedBuyer && (
                <Badge
                  variant={credPct >= 60 ? "success" : credPct >= 40 ? "warning" : "danger"}
                  className="normal-case font-mono"
                >
                  Skor: {credPct}/100
                </Badge>
              )}
            </div>

            {selectedBuyer ? (
              <div className="flex flex-col gap-2 mt-1">
                <div className="w-full h-2 bg-surface-container-high rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-1000 ${
                      credPct >= 60 ? "bg-secondary" : credPct >= 40 ? "bg-warning" : "bg-error"
                    }`}
                    style={{ width: `${credPct}%` }}
                  ></div>
                </div>
                <p className="text-[10px] text-on-surface-variant leading-relaxed font-medium">
                  Skor dihitung backend dari sinyal dagang nyata (jumlah pengiriman, nilai FOB, keragaman
                  pemasok &amp; HS).{" "}
                  {selectedBuyer.is_synthetic ? "(Data Simulasi)" : "(Data Terverifikasi TradeAtlas)"}
                </p>
                <p className="text-[10px] text-on-surface-variant italic">
                  Rincian dimensi kredibilitas belum tersedia dari sumber data produksi.
                </p>
              </div>
            ) : (
              <p className="text-[11px] text-on-surface-variant mt-1">
                Pilih pembeli nyata dari Penemuan Pembeli untuk melihat kredibilitasnya.
              </p>
            )}
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
                <h4 className="text-[11px] font-extrabold text-primary uppercase tracking-wider flex items-center gap-1.5">
                  <Shield className="text-primary size-[18px]" /> Laporan Risiko Keamanan
                </h4>
                <Badge
                  variant={redFlagReport.riskLevel === "LOW" ? "success" : redFlagReport.riskLevel === "MEDIUM" ? "warning" : "danger"}
                  className={redFlagReport.riskLevel === "MEDIUM" ? "animate-pulse" : redFlagReport.riskLevel === "HIGH" ? "animate-bounce" : ""}
                >
                  Risiko: {redFlagReport.riskLevel === "LOW" ? "Rendah" : redFlagReport.riskLevel === "MEDIUM" ? "Sedang" : "Tinggi"}
                </Badge>
              </div>

              <div className="flex flex-col gap-3 mt-1">
                {redFlagReport.flags.map((flag, idx) => {
                  const FlagIcon = getIcon(flag.icon || "warning");
                  return (
                  <div key={idx} className="flex gap-2.5 items-start bg-surface-bright/40 p-2.5 border border-outline-variant/40 rounded-lg">
                    <FlagIcon
                      className={cn(
                        "size-[18px] shrink-0 mt-0.5",
                        redFlagReport.riskLevel === "LOW" ? "text-secondary" : "text-warning"
                      )}
                    />
                    <div className="flex flex-col gap-0.5">
                      <span className="text-xs font-bold text-on-surface flex items-center gap-1">
                        {flag.title}
                        {redFlagReport.riskLevel !== "LOW" && <AlertTriangle className="size-3 text-warning" />}
                      </span>
                      <p className="text-[10px] text-on-surface-variant leading-relaxed font-medium">
                        {flag.description}
                      </p>
                    </div>
                  </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* A. MINI EXPORT PRICE CALCULATOR */}
          {/* ========================================================================= */}
          <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-4 shadow-sm flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-outline-variant pb-2">
              <h4 className="text-[11px] font-extrabold text-primary uppercase tracking-wider flex items-center gap-1.5">
                <Calculator className="text-primary size-[18px]" /> Kalkulator Harga Ekspor
              </h4>
              <Badge variant={priceStatus === "competitive" ? "success" : priceStatus === "high" ? "danger" : priceStatus === "low" ? "info" : "neutral"}>
                {priceStatus === "competitive" ? "Kompetitif BPS" : priceStatus === "high" ? "Terlalu Tinggi" : priceStatus === "low" ? "Terlalu Murah" : "Tanpa Benchmark"}
              </Badge>
            </div>

            {/* Pricing Input Fields */}
            <div className="flex flex-col gap-3">
              {/* Ex-Works / HPP */}
              <div className="flex flex-col gap-1">
                <div className="flex justify-between text-xs">
                  <span className="font-semibold text-on-surface-variant">HPP {productName || "Produk"} (Ex-Works)</span>
                  <span className="font-mono text-primary font-bold">${hpp.toFixed(2)}/{unitLabel}</span>
                </div>
                <input
                  type="range"
                  min={Math.max(0.01, Number((seed * 0.4).toFixed(2)))}
                  max={Number((seed * 2).toFixed(2))}
                  step={seed >= 10 ? 0.5 : 0.05}
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
                  <span className="font-semibold text-on-surface-variant">Ocean Freight Internasional</span>
                  <span className="font-mono text-primary font-bold">${freight.toFixed(2)}/{unitLabel}</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={Number((seed * 0.6).toFixed(2))}
                  step={seed >= 10 ? 0.5 : 0.01}
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
                      onClick={() => setLocalHandling((prev) => {
                        const hi = Number((seed * 0.06).toFixed(2));
                        const lo = Number((seed * 0.04).toFixed(2));
                        return prev === hi ? lo : hi;
                      })}
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
                      onClick={() => setInsurance((prev) => {
                        const hi = Number((seed * 0.04).toFixed(2));
                        const lo = Number((seed * 0.02).toFixed(2));
                        return prev === hi ? lo : hi;
                      })}
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
                <span className="font-mono text-primary">${fobUnit.toFixed(2)}/{unitLabel}</span>
              </div>
              <div className="flex justify-between text-xs font-semibold text-on-surface">
                <span>2. CFR Value (Cost & Freight)</span>
                <span className="font-mono text-primary">${cfrUnit.toFixed(2)}/{unitLabel}</span>
              </div>
              <div className="flex justify-between text-xs font-bold text-primary border-t border-outline-variant/60 pt-1.5">
                <span>3. CIF (Total Cost)</span>
                <span className="font-mono text-primary">${cifUnit.toFixed(2)}/{unitLabel}</span>
              </div>
              <div className="flex justify-between text-[10px] text-on-surface-variant font-medium font-mono pt-1">
                <span>Est. IDR (asumsi kurs {rate.toLocaleString("id-ID")})</span>
                <span>Rp {Math.round(nOf(pricing?.idr.perUnitCIF) || cifUnit * rate).toLocaleString("id-ID")}/{unitLabel}</span>
              </div>
            </div>

            {/* BPS market average note */}
            <div className="text-[10px] text-on-surface-variant leading-normal flex gap-1.5 border-t border-outline-variant/40 pt-2">
              <BarChart3 className="text-primary size-4" />
              <p>
                {bench != null ? (
                  <>
                    Nilai satuan ekspor BPS (HS {hsCode || "—"}): <strong>${bench.toFixed(2)}/{unitLabel}</strong>.
                    {priceStatus === "competitive"
                      ? " Harga penawaran Anda selaras dengan benchmark pasar."
                      : priceStatus === "high"
                        ? " Harga CIF melebihi benchmark pasar. Siapkan opsi konsesi."
                        : " Harga di bawah benchmark; verifikasi profitabilitas Anda."}
                  </>
                ) : (
                  <>Benchmark nilai satuan ekspor BPS belum tersedia untuk HS {hsCode || "produk ini"}.</>
                )}
              </p>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* B. FLOOR PRICE GUARDRAIL WARNING */}
          {/* ========================================================================= */}
          {(floorPrice != null && cifUnit < floorPrice) || priceStatus === "high" ? (
            <div className="bg-error-container border border-error rounded-xl p-4 shadow-sm relative overflow-hidden animate-in fade-in duration-300">
              <div className="absolute top-0 left-0 w-1.5 h-full bg-error"></div>
              <div className="flex items-start gap-3">
                <AlertTriangle className="text-on-error-container size-6" />
                <div>
                  <h4 className="text-xs font-bold text-on-error-container mb-1 uppercase tracking-wider">PERINGATAN HARGA</h4>
                  <p className="text-xs text-on-error-container leading-relaxed">
                    {floorPrice != null && cifUnit < floorPrice ? (
                      <>
                        Estimasi CIF Anda <strong>${cifUnit.toFixed(2)}/{unitLabel}</strong> berada di bawah harga dasar Anda (<strong>${floorPrice.toFixed(2)}/{unitLabel}</strong>). Menerima harga ini menekan margin di bawah target Anda.
                      </>
                    ) : (
                      <>
                        Estimasi CIF Anda <strong>${cifUnit.toFixed(2)}/{unitLabel}</strong> berada di atas benchmark pasar BPS{bench != null ? <> (<strong>${bench.toFixed(2)}/{unitLabel}</strong>)</> : null}. Siapkan opsi konsesi agar penawaran tetap kompetitif.
                      </>
                    )}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-secondary-container border border-secondary/40 rounded-xl p-4 shadow-sm relative overflow-hidden animate-in fade-in duration-300">
              <div className="absolute top-0 left-0 w-1.5 h-full bg-secondary"></div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="text-on-secondary-container size-6" />
                <div>
                  <h4 className="text-xs font-bold text-on-secondary-container mb-1 uppercase tracking-wider">HARGA DASAR AMAN</h4>
                  <p className="text-xs text-on-secondary-container leading-relaxed">
                    Estimasi CIF Anda <strong>${cifUnit.toFixed(2)}/{unitLabel}</strong>
                    {floorPrice != null ? <> berada di atas harga dasar Anda (<strong>${floorPrice.toFixed(2)}/{unitLabel}</strong>)</> : null}
                    {bench != null ? <> dan selaras dengan benchmark pasar BPS (<strong>${bench.toFixed(2)}/{unitLabel}</strong>)</> : null}. Profitabilitas Anda terjaga untuk negosiasi ini.
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
              <BarChart3 className="size-4" /> Analisis Taktis RAG
            </h4>
            <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-4 flex flex-col gap-4 shadow-sm">
              <div className="flex gap-3">
                <Info className="text-primary size-5" />
                <p className="text-xs text-on-surface leading-relaxed">
                  <strong>Konteks Pembeli:</strong>{" "}
                  {selectedBuyer
                    ? `${selectedBuyer.name} (${selectedBuyer.country}) — skor kredibilitas ${credPct}/100 dihitung dari data pengiriman nyata.`
                    : "Pilih pembeli nyata dari Penemuan Pembeli untuk melihat konteksnya."}
                </p>
              </div>
              <div className="w-full h-px bg-outline-variant"></div>
              <div className="flex gap-3">
                <Lightbulb className="text-primary size-5" />
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
              <Edit3 className="size-4" /> Draft Balasan Otomatis
            </h4>
            
            {isDraftGenerating ? (
              <div className="flex flex-col items-center justify-center p-8 bg-surface-container-lowest border border-outline-variant rounded-xl shadow-sm gap-2">
                <span className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></span>
                <span className="text-xs text-on-surface-variant font-medium">Menganalisis RAG & membuat draf...</span>
              </div>
            ) : draftUnavailable ? (
              <div className="text-center p-6 bg-warning-container/40 border border-warning/40 rounded-xl text-xs text-on-surface font-medium flex flex-col items-center gap-1.5">
                <AlertTriangle className="size-5 text-warning" />
                Layanan draf AI sedang tidak tersedia (kuota/kredit LLM habis). Negosiasi tetap berjalan — Anda bisa menulis balasan secara manual.
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
                      &ldquo;{draft.text}&rdquo;
                    </p>
                    <div className="bg-primary/5 p-2.5 rounded-lg text-[10px] text-on-surface-variant leading-normal border border-primary/10">
                      <strong>Strategi AI:</strong> {draft.strategy}
                    </div>
                    
                    {/* Interactive Approve, Edit, Reject Action Buttons */}
                    {currentStep !== "compliance" && (
                      <div className="grid grid-cols-3 gap-2 pt-2 border-t border-outline-variant/60 shrink-0">
                        <button 
                          onClick={() => handleApproveDraft(draft.text)}
                          className="px-2 py-1.5 bg-secondary-container hover:bg-secondary-fixed/50 text-on-secondary-container rounded text-[10px] font-extrabold transition-colors flex items-center justify-center gap-1"
                          title="Setujui dan kirim balasan langsung"
                        >
                          <CheckCircle2 className="size-3" />
                          Approve
                        </button>
                        <button 
                          onClick={() => handleDraftSelect(draft.text)}
                          className="px-2 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary rounded text-[10px] font-extrabold transition-colors flex items-center justify-center gap-1"
                          title="Salin teks draf ke kolom input untuk diedit"
                        >
                          <Pencil className="size-3" />
                          Edit
                        </button>
                        <button 
                          onClick={() => handleRejectDraft(draft.id)}
                          className="px-2 py-1.5 bg-error-container hover:bg-error/20 text-on-error-container rounded text-[10px] font-extrabold transition-colors flex items-center justify-center gap-1"
                          title="Tolak & buat draf alternatif baru"
                        >
                          <RefreshCw className="size-3" />
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
