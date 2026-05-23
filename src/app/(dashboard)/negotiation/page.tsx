"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getStep, setStep as setJourneyStep, setFinalPrice } from "../../../lib/state";
import { ChatMessage } from "../../../types";

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

  // States for Hiding Draft Suggestions dynamically on Reject
  const [hideDraft1, setHideDraft1] = useState(false);
  const [hideDraft2, setHideDraft2] = useState(false);

  const startResizing = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  };

  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      const newWidth = window.innerWidth - e.clientX;
      if (newWidth < 150) {
        // Collapse completely if dragged very close to the right edge
        setMentorWidth(0);
      } else if (newWidth > 600) {
        // Limit max width
        setMentorWidth(600);
      } else {
        setMentorWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    // Apply global cursor and user-select rules during resize to prevent flickering
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

  // Sync state on mount
  useEffect(() => {
    const step = getStep();
    setCurrentStep(step);

    if (step === "contacted_klaus") {
      setIsTyping(true);
      const timer = setTimeout(() => {
        setIsTyping(false);
        setMessages([
          {
            sender: "buyer",
            text: `Kepada Rekan Pemasok TradeConnect,\n\nKami telah meninjau katalog awal Anda untuk biji kopi robusta. Kami sangat tertarik untuk memesan satu kontainer uji coba (sekitar 18 metrik ton) untuk pengiriman Kuartal 3 (Q3) ke pelabuhan Hamburg.\n\nNamun, harga CIF yang Anda tawarkan saat ini adalah $2,85/kg. Mengingat fluktuasi pasar saat ini dan demi membangun kemitraan jangka panjang, kami mengajukan revisi penawaran harga sebesar $2,50/kg. Mohon beri saran mengenai kelayakan harga tersebut dan berikan proforma invoice terbaru jika Anda setuju.`,
            time: "09:42",
          }
        ]);
        setJourneyStep("negotiating");
        setCurrentStep("negotiating");
      }, 2000);
      return () => clearTimeout(timer);
    } else if (step !== "onboarding" && step !== "verified") {
      // If already in negotiating or later, show first message immediately
      setMessages([
        {
          sender: "buyer",
          text: `Kepada Rekan Pemasok TradeConnect,\n\nKami telah meninjau katalog awal Anda untuk biji kopi robusta. Kami sangat tertarik untuk memesan satu kontainer uji coba (sekitar 18 metrik ton) untuk pengiriman Kuartal 3 (Q3) ke pelabuhan Hamburg.\n\nNamun, harga CIF yang Anda tawarkan saat ini adalah $2,85/kg. Mengingat fluktuasi pasar saat ini dan demi membangun kemitraan jangka panjang, kami mengajukan revisi penawaran harga sebesar $2,50/kg. Mohon beri saran mengenai kelayakan harga tersebut dan berikan proforma invoice terbaru jika Anda setuju.`,
          time: "09:42",
        }
      ]);
    }
  }, []);

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
      setTimeout(() => {
        setIsTyping(false);
        setMessages([
          ...newMsgs,
          {
            sender: "buyer",
            text: `Terima kasih atas tanggapan Anda dan proposal jalan tengah yang sangat wajar. Kami menghargai reputasi kualitas PT Nusantara dan setuju untuk menutup kesepakatan di harga $2,75/kg CIF Pelabuhan Hamburg dengan struktur pembayaran 30% DP dan 70% LC sesuai usulan Anda.\n\nSilakan buat Purchase Order resmi di sistem agar kita dapat segera melakukan penandatanganan dokumen dan pemeriksaan kepatuhan hukum ekspor.`,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          }
        ]);
        setFinalPrice(2.75);
        setJourneyStep("compliance");
        setCurrentStep("compliance");
        setKlausRepliedCount(1);
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

    // Simulate Klaus's final reply
    if (klausRepliedCount === 0) {
      setIsTyping(true);
      setTimeout(() => {
        setIsTyping(false);
        setMessages([
          ...newMsgs,
          {
            sender: "buyer",
            text: `Terima kasih atas tanggapan Anda dan proposal jalan tengah yang sangat wajar. Kami menghargai reputasi kualitas PT Nusantara dan setuju untuk menutup kesepakatan di harga $2,75/kg CIF Pelabuhan Hamburg dengan struktur pembayaran 30% DP dan 70% LC sesuai usulan Anda.\n\nSilakan buat Purchase Order resmi di sistem agar kita dapat segera melakukan penandatanganan dokumen dan pemeriksaan kepatuhan hukum ekspor.`,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          }
        ]);
        setFinalPrice(2.75);
        setJourneyStep("compliance");
        setCurrentStep("compliance");
        setKlausRepliedCount(1);
      }, 2500);
    }
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
      {/* LEFT PANE: Communication Thread */}
      <section className="flex-1 flex flex-col bg-surface border-r border-outline-variant relative h-full overflow-hidden">
        {/* Thread Header */}
        <div className="px-6 py-4 border-b border-outline-variant bg-surface-container-lowest flex justify-between items-center flex-shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded bg-tertiary-container flex items-center justify-center text-on-tertiary-container shadow-inner border border-outline-variant">
              <span className="material-symbols-outlined text-2xl">domain</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-semibold text-on-surface">GlobalTech Imports GmbH</h2>
                <span className="flex items-center gap-1 bg-surface-container-high px-2 py-0.5 rounded text-[10px] font-bold text-on-surface-variant uppercase">
                  <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span> Aktif
                </span>
              </div>
              <p className="text-sm text-on-surface-variant">Frankfurt, Jerman • UID: DE123456789</p>
            </div>
          </div>
          <div className="flex gap-2 items-center">
            {mentorWidth === 0 && (
              <button 
                onClick={() => setMentorWidth(380)}
                className="bg-[#070235] text-[#85f8c4] border border-[#85f8c4]/30 px-3.5 py-1.5 rounded-lg text-[10px] font-extrabold uppercase flex items-center gap-1.5 hover:bg-[#070235]/80 transition-all shadow-md animate-in fade-in duration-300 mr-2"
              >
                <span className="material-symbols-outlined text-[16px]">menu_open</span>
                Buka Asisten Mentor AI
              </button>
            )}
            {(currentStep === "compliance" || getStep() === "po_sent" || getStep() === "po_signed") && (
              <button onClick={() => router.push('/compliance')} className="bg-[#070235] text-[#85f8c4] px-4 py-2 rounded-lg flex items-center gap-1.5 hover:bg-surface-tint hover:text-white transition-colors shadow-md animate-pulse">
                <span className="material-symbols-outlined text-[18px]">fact_check</span>
                <span className="text-[10px] font-bold uppercase tracking-wider">Lanjutkan ke Deal Readiness</span>
              </button>
            )}
            <div className="bg-tertiary-container text-on-tertiary-container px-3 py-1.5 rounded-full flex items-center gap-1 border border-tertiary-fixed-dim">
              <span className="material-symbols-outlined text-[16px]">inventory_2</span>
              <span className="text-[10px] font-bold uppercase">RFQ: Pembelian Massal</span>
            </div>
          </div>
        </div>

        {/* Thread Content - Flex child with pb-32 to prevent overlaps */}
        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6 bg-surface-bright pb-32">
          {/* Timestamp */}
          <div className="text-center">
            <span className="bg-surface-container-low px-3 py-1 rounded-full font-mono text-on-surface-variant text-[11px] font-medium tracking-wide">Hari Ini, 09:42</span>
          </div>

          {/* Outbound Pitch Alert (Fase 2) */}
          <div className="bg-indigo-50/50 border border-primary/20 p-4 rounded-xl max-w-2xl text-left shadow-sm self-start flex gap-3 animate-in fade-in duration-500">
            <span className="material-symbols-outlined text-primary text-[24px] shrink-0 mt-0.5">forward_to_inbox</span>
            <div>
              <div className="text-[10px] font-bold uppercase tracking-widest text-[#070235] mb-1">Email Penawaran AI Terkirim</div>
              <p className="text-xs text-on-surface-variant font-medium leading-relaxed">
                Email penawaran resmi untuk <strong className="text-primary">Biji Kopi Robusta Premium Grade 1 (HS 0901.11)</strong> telah dikirim secara otomatis ke alamat importir <strong className="text-primary">klaus.weber@globaltech.de</strong> pada pukul 09:42.
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

          {/* Typing Indicator (Loading State) */}
          {isTyping && (
            <div className="flex flex-col gap-1 max-w-2xl self-start">
              <span className="text-[10px] font-bold uppercase text-on-surface-variant ml-1">Klaus Weber • GlobalTech</span>
              <div className="bg-surface-container-lowest border border-outline-variant p-4 rounded-xl shadow-sm rounded-tl-sm flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce"></span>
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce [animation-delay:0.2s]"></span>
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce [animation-delay:0.4s]"></span>
                <span className="text-xs text-on-surface-variant ml-2 font-medium">Klaus Weber sedang menulis email balasan...</span>
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

        {/* Input Area - Placed as standard flex child so it never overlaps */}
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

      {/* RIGHT PANE: Mentor Sidebar - resizable & collapsible */}
      <aside 
        style={{ width: mentorWidth > 0 ? `${mentorWidth}px` : '0px', display: mentorWidth > 0 ? 'flex' : 'none' }}
        className="flex-shrink-0 bg-surface-container-low flex flex-col overflow-y-auto border-l-[4px] border-primary h-full relative animate-in slide-in-from-right duration-300"
      >
        {/* Visual Resize Handle Bar on the left border */}
        <div 
          onMouseDown={startResizing}
          className={`absolute left-0 top-0 bottom-0 w-3 -ml-1.5 cursor-col-resize z-30 transition-all flex items-center justify-center ${
            isResizing 
              ? 'bg-[#85f8c4]/30 border-l-2 border-[#85f8c4]' 
              : 'hover:bg-primary/10 hover:border-l-2 hover:border-primary'
          }`}
          title="Geser ke kanan untuk menutup (Drag right to close)"
        >
          {/* Grabber indicator */}
          <div className={`w-[2px] h-12 rounded-full transition-all ${
            isResizing ? 'bg-[#85f8c4]' : 'bg-[#070235]/30'
          }`} />
        </div>

        <div className="p-4 border-b border-outline-variant flex justify-between items-center bg-surface-container-lowest sticky top-0 z-10 pl-6">
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

        <div className="p-4 flex flex-col gap-6 pl-6">
          {/* Floor Price Guardrail Warning */}
          <div className="bg-error-container border border-error rounded-xl p-4 shadow-sm relative overflow-hidden animate-in fade-in duration-300">
            <div className="absolute top-0 left-0 w-1.5 h-full bg-error"></div>
            <div className="flex items-start gap-3">
              <span className="material-symbols-outlined text-on-error-container">warning</span>
              <div>
                <h4 className="text-xs font-bold text-on-error-container mb-1 uppercase tracking-wider">PERINGATAN HARGA DASAR</h4>
                <p className="text-xs text-on-error-container leading-relaxed">
                  Pembeli meminta harga <strong>$2.50/kg</strong>. Harga dasar (floor price) Anda untuk menjaga margin minimal 15% adalah <strong>$2.68/kg</strong>.
                  <br/><br/>
                  Menerima tawaran ini akan menyebabkan kerugian margin operasional.
                </p>
              </div>
            </div>
          </div>

          {/* RAG Tactical Annotations */}
          <div>
            <h4 className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mb-3 flex items-center gap-2">
              <span className="material-symbols-outlined text-[16px]">analytics</span> Analisis Taktis
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
                  <strong>Strategi:</strong> Tolak secara halus permintaan $2.50. Tawarkan kompromi di $2.75/kg, atau pertahankan $2.85/kg dengan menawarkan termin pembayaran yang lebih fleksibel (misal: 30% DP, 70% LC).
                </p>
              </div>
            </div>
          </div>

          {/* Automated Draft Suggestions */}
          <div>
            <h4 className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mb-3 flex items-center gap-2">
              <span className="material-symbols-outlined text-[16px]">edit_document</span> Draft Balasan Otomatis
            </h4>
            <div className="flex flex-col gap-3">
              {/* Draft Option 1 */}
              {!hideDraft1 && (
                <div className="text-left bg-surface-container-lowest border border-outline-variant rounded-xl p-4 hover:border-primary hover:shadow-md transition-all group flex flex-col gap-3 shadow-sm animate-in fade-in duration-300">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-semibold text-on-surface group-hover:text-primary transition-colors">Tolak Halus (Kompromi $2.75)</span>
                    <span className="bg-surface-container-low text-on-surface-variant text-[9px] px-2 py-0.5 rounded font-mono font-bold border border-outline-variant/60">DRAFT 1</span>
                  </div>
                  <p className="text-xs text-on-surface-variant leading-relaxed">
                    "Terima kasih atas ketertarikan Anda. Sayangnya, karena kontrol kualitas yang ketat, harga $2,50/kg berada di bawah batas keberlanjutan minimum kami. Kami dapat menawarkan jalan tengah di harga $2,75/kg, dengan struktur pembayaran 30% DP dan 70% LC. Mohon informasikan jika usulan ini dapat diterima."
                  </p>
                  
                  {/* Interactive Approve, Edit, Reject Action Buttons */}
                  {currentStep !== "compliance" && (
                    <div className="grid grid-cols-3 gap-2 pt-2 border-t border-outline-variant/60 shrink-0">
                      <button 
                        onClick={() => handleApproveDraft("Terima kasih atas ketertarikan Anda. Sayangnya, karena kontrol kualitas yang ketat, harga $2,50/kg berada di bawah batas keberlanjutan minimum kami. Kami dapat menawarkan jalan tengah di harga $2,75/kg, dengan struktur pembayaran 30% DP dan 70% LC. Mohon informasikan jika usulan ini dapat diterima.")}
                        className="px-2.5 py-1.5 bg-[#85f8c4]/30 hover:bg-[#85f8c4]/50 text-emerald-800 rounded text-[10px] font-bold transition-colors flex items-center justify-center gap-1"
                        title="Setujui dan kirim balasan langsung"
                      >
                        <span className="material-symbols-outlined text-[12px]" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                        Approve
                      </button>
                      <button 
                        onClick={() => handleDraftSelect("Terima kasih atas ketertarikan Anda. Sayangnya, karena kontrol kualitas yang ketat, harga $2,50/kg berada di bawah batas keberlanjutan minimum kami. Kami dapat menawarkan jalan tengah di harga $2,75/kg, dengan struktur pembayaran 30% DP and 70% LC. Mohon informasikan jika usulan ini dapat diterima.")}
                        className="px-2.5 py-1.5 bg-[#070235]/10 hover:bg-[#070235]/20 text-[#070235] rounded text-[10px] font-bold transition-colors flex items-center justify-center gap-1"
                        title="Salin teks draf ke kolom input untuk diedit"
                      >
                        <span className="material-symbols-outlined text-[12px]">edit</span>
                        Edit
                      </button>
                      <button 
                        onClick={() => { setHideDraft1(true); alert("Saran draf AI 1 diabaikan."); }}
                        className="px-2.5 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 rounded text-[10px] font-bold transition-colors flex items-center justify-center gap-1"
                        title="Tolak saran draf ini"
                      >
                        <span className="material-symbols-outlined text-[12px]">cancel</span>
                        Reject
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Draft Option 2 */}
              {!hideDraft2 && (
                <div className="text-left bg-surface-container-lowest border border-outline-variant rounded-xl p-4 hover:border-primary hover:shadow-md transition-all group flex flex-col gap-3 shadow-sm animate-in fade-in duration-300">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-semibold text-on-surface group-hover:text-primary transition-colors">Pertahankan Harga (Ubah Termin)</span>
                    <span className="bg-surface-container-low text-on-surface-variant text-[9px] px-2 py-0.5 rounded font-mono font-bold border border-outline-variant/60">DRAFT 2</span>
                  </div>
                  <p className="text-xs text-on-surface-variant leading-relaxed">
                    "Kami sangat menghargai peluang kemitraan ini. Meskipun kami harus mempertahankan harga $2,85/kg untuk menjamin kualitas robusta premium kami, kami bersedia menawarkan termin pembayaran yang lebih bersahabat seperti 20% DP dan sisa 80% dibayarkan saat barang tiba di tujuan. Silakan beri saran."
                  </p>
                  
                  {/* Interactive Approve, Edit, Reject Action Buttons */}
                  {currentStep !== "compliance" && (
                    <div className="grid grid-cols-3 gap-2 pt-2 border-t border-outline-variant/60 shrink-0">
                      <button 
                        onClick={() => handleApproveDraft("Kami sangat menghargai peluang kemitraan ini. Meskipun kami harus mempertahankan harga $2,85/kg untuk menjamin kualitas robusta premium kami, kami bersedia menawarkan termin pembayaran yang lebih bersahabat seperti 20% DP dan sisa 80% dibayarkan saat barang tiba di tujuan. Silakan beri saran.")}
                        className="px-2.5 py-1.5 bg-[#85f8c4]/30 hover:bg-[#85f8c4]/50 text-emerald-800 rounded text-[10px] font-bold transition-colors flex items-center justify-center gap-1"
                        title="Setujui dan kirim balasan langsung"
                      >
                        <span className="material-symbols-outlined text-[12px]" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                        Approve
                      </button>
                      <button 
                        onClick={() => handleDraftSelect("Kami sangat menghargai peluang kemitraan ini. Meskipun kami harus mempertahankan harga $2,85/kg untuk menjamin kualitas robusta premium kami, kami bersedia menawarkan termin pembayaran yang lebih bersahabat seperti 20% DP dan sisa 80% dibayarkan saat barang tiba di tujuan. Silakan beri saran.")}
                        className="px-2.5 py-1.5 bg-[#070235]/10 hover:bg-[#070235]/20 text-[#070235] rounded text-[10px] font-bold transition-colors flex items-center justify-center gap-1"
                        title="Salin teks draf ke kolom input untuk diedit"
                      >
                        <span className="material-symbols-outlined text-[12px]">edit</span>
                        Edit
                      </button>
                      <button 
                        onClick={() => { setHideDraft2(true); alert("Saran draf AI 2 diabaikan."); }}
                        className="px-2.5 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 rounded text-[10px] font-bold transition-colors flex items-center justify-center gap-1"
                        title="Tolak saran draf ini"
                      >
                        <span className="material-symbols-outlined text-[12px]">cancel</span>
                        Reject
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}
