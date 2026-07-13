"use client";
import { useState, useRef, useEffect } from "react";
import { getFinalPrice, setStep } from "../../lib/state";
import {
  BadgeCheck,
  Building2,
  Check,
  Lock,
  NotebookPen,
  Pen,
  PenTool,
  RotateCcw,
  Send,
  ShieldCheck,
  Trophy,
  Type,
} from "lucide-react";
import { Badge } from "../../components/ui/badge";

export default function SigningBoardPage() {
  const [agreedPrice, setAgreedPrice] = useState(2.75);
  const [signatureMode, setSignatureMode] = useState<"draw" | "type">("draw");
  const [typedName, setTypedName] = useState("Klaus Weber");
  const [isSigned, setIsSigned] = useState(false);
  const [isRevisionMode, setIsRevisionMode] = useState(false);
  const [revisionNote, setRevisionNote] = useState("");
  const [revisionSent, setRevisionSent] = useState(false);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  const [companyName, setCompanyName] = useState("PT Nusantara Global Coffee");
  const [productName, setProductName] = useState("Biji Kopi Robusta Premium");
  const [productType, setProductType] = useState("coffee");
  const [nib, setNib] = useState("1234567890123");

  // Load final price and profile on mount
  useEffect(() => {
    setAgreedPrice(getFinalPrice());
    if (typeof window !== "undefined") {
      setCompanyName(localStorage.getItem("tradeconnect_company_name") || "PT Nusantara Global Coffee");
      setProductName(localStorage.getItem("tradeconnect_product_name") || "Biji Kopi Robusta Premium");
      setProductType(localStorage.getItem("tradeconnect_product_type") || "coffee");
      setNib(localStorage.getItem("tradeconnect_nib") || "1234567890123");
    }
  }, []);

  // HTML5 Canvas Drawing Logic
  useEffect(() => {
    if (signatureMode !== "draw") return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.strokeStyle = "#0f172a"; // Navy color (matches --color-primary)
    ctx.lineWidth = 3;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    const getCoordinates = (e: MouseEvent | TouchEvent) => {
      const rect = canvas.getBoundingClientRect();
      if ("touches" in e) {
        if (e.touches.length === 0) return { x: 0, y: 0 };
        return {
          x: e.touches[0].clientX - rect.left,
          y: e.touches[0].clientY - rect.top,
        };
      } else {
        return {
          x: e.clientX - rect.left,
          y: e.clientY - rect.top,
        };
      }
    };

    const handleStart = (e: MouseEvent | TouchEvent) => {
      e.preventDefault();
      const coords = getCoordinates(e);
      ctx.beginPath();
      ctx.moveTo(coords.x, coords.y);
      setIsDrawing(true);
    };

    const handleMove = (e: MouseEvent | TouchEvent) => {
      if (!isDrawing) return;
      e.preventDefault();
      const coords = getCoordinates(e);
      ctx.lineTo(coords.x, coords.y);
      ctx.stroke();
    };

    const handleEnd = () => {
      setIsDrawing(false);
    };

    // Desktop
    canvas.addEventListener("mousedown", handleStart);
    canvas.addEventListener("mousemove", handleMove);
    canvas.addEventListener("mouseup", handleEnd);
    canvas.addEventListener("mouseleave", handleEnd);

    // Mobile / Touch
    canvas.addEventListener("touchstart", handleStart, { passive: false });
    canvas.addEventListener("touchmove", handleMove, { passive: false });
    canvas.addEventListener("touchend", handleEnd);

    return () => {
      canvas.removeEventListener("mousedown", handleStart);
      canvas.removeEventListener("mousemove", handleMove);
      canvas.removeEventListener("mouseup", handleEnd);
      canvas.removeEventListener("mouseleave", handleEnd);
      canvas.removeEventListener("touchstart", handleStart);
      canvas.removeEventListener("touchmove", handleMove);
      canvas.removeEventListener("touchend", handleEnd);
    };
  }, [signatureMode, isDrawing]);

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const handleSignConfirm = () => {
    setStep("po_signed");
    setIsSigned(true);
  };

  const handleSendRevision = () => {
    if (!revisionNote.trim()) return;
    // Set step to compliance (revised)
    setStep("compliance");
    setRevisionSent(true);
  };

  // Calculations
  const isRattan = productType === "rattan";
  const itemTotal = isRattan ? (agreedPrice * 150) : (agreedPrice * 18 * 1000); // 150 Pcs or 18 Metric Tons
  const shippingTotal = 2100;
  const grandTotal = itemTotal + shippingTotal;
  const poNumber = isRattan ? "PO-JPR-2605-001" : "PO-GLB-2605-001";

  // Format currency
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    }).format(val);
  };

  if (isSigned) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="w-full max-w-2xl bg-slate-950 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden p-8 md:p-12 text-center relative">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl -z-10"></div>
          
          <div className="w-20 h-20 bg-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-[0_0_30px_rgba(16,185,129,0.3)] animate-bounce">
            <Check className="text-slate-950 font-black size-12" />
          </div>
          
          <h1 className="text-3xl md:text-4xl font-extrabold text-white mb-4 tracking-tight">Purchase Order Signed Successfully</h1>
          <p className="text-slate-400 text-base max-w-md mx-auto mb-8 leading-relaxed">
            Thank you! GlobalTech Imports GmbH has verified and digitally signed <strong className="text-emerald-400">{poNumber}</strong>. 
            The supplier, {companyName}, has been notified to initiate the production process.
          </p>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 mb-8 max-w-md mx-auto text-left space-y-2">
            <div className="flex justify-between text-xs text-slate-500">
              <span>IP Address Registered</span>
              <span className="font-mono text-slate-300">194.22.84.102 (Frankfurt, DE)</span>
            </div>
            <div className="flex justify-between text-xs text-slate-500">
              <span>Timestamp</span>
              <span className="font-mono text-slate-300">{new Date().toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-xs text-slate-500">
              <span>Document Lock Status</span>
              <span className="font-semibold text-emerald-400 uppercase flex items-center gap-1">
                <Lock className="size-3.5" /> Secured & Encrypted
              </span>
            </div>
          </div>

          <p className="text-slate-500 text-xs">You can close this tab and return to the supplier dashboard.</p>
        </div>
      </div>
    );
  }

  if (isRevisionMode) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="w-full max-w-xl bg-slate-950 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden p-8">
          <h2 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
            <NotebookPen className="text-amber-500 size-6" />
            Request Revisions
          </h2>
          <p className="text-slate-400 text-sm mb-6">
            Specify the changes required for <span className="text-slate-200 font-semibold">{poNumber}</span>. {companyName} will receive this feedback in their Negotiation Hub immediately.
          </p>

          {revisionSent ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-amber-500/20 text-amber-500 rounded-full flex items-center justify-center mx-auto mb-4 border border-amber-500/30">
                <Send className="size-8" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Revision Sent</h3>
              <p className="text-slate-400 text-sm max-w-sm mx-auto mb-6">
                Your revision notes have been synchronized. The supplier is currently drafting a corrected purchase order.
              </p>
              <button 
                onClick={() => setIsRevisionMode(false)}
                className="px-6 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-md text-sm font-semibold transition-colors"
              >
                Back to Document
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Revision Notes *</label>
                <textarea 
                  value={revisionNote}
                  onChange={(e) => setRevisionNote(e.target.value)}
                  className="w-full p-4 bg-slate-900 border border-slate-800 rounded-lg text-sm text-white focus:border-amber-500 focus:ring-1 focus:ring-amber-500 focus:outline-none transition-all min-h-[120px] resize-none" 
                  placeholder="e.g., Please adjust expected delivery to August 20, 2026. Or double check the packaging weight guidelines..."
                ></textarea>
              </div>

              <div className="flex justify-end gap-3">
                <button 
                  onClick={() => setIsRevisionMode(false)}
                  className="px-4 py-2 border border-slate-800 hover:bg-slate-900 text-slate-400 rounded-md text-sm font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleSendRevision}
                  disabled={!revisionNote.trim()}
                  className="px-6 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 disabled:opacity-50 rounded-md text-sm font-bold transition-colors flex items-center gap-2"
                >
                  Send Revision <Send className="size-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-primary/5 bg-surface-bright flex flex-col items-center py-10 px-4">
      {/* Top Banner Context */}
      <header className="w-full max-w-4xl flex items-center justify-between mb-8 pb-4 border-b border-outline-variant/60">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary text-secondary-fixed rounded-lg flex items-center justify-center shadow-md">
            <ShieldCheck className="size-6" />
          </div>
          <div>
            <h1 className="text-lg font-black text-primary tracking-tight font-heading">TradeConnect Secure Deal Board</h1>
            <p className="text-[11px] font-bold text-on-surface-variant uppercase tracking-widest">Global B2B Institutional Escrow Board</p>
          </div>
        </div>
        <div className="bg-secondary-fixed/30 text-primary border border-secondary-fixed px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 shadow-sm">
          <span className="w-2 h-2 rounded-full bg-secondary animate-ping"></span>
          Klaus Weber (GlobalTech)
        </div>
      </header>

      {/* Main PO Document Container */}
      <main className="w-full max-w-4xl bg-surface-container-lowest border border-outline-variant rounded-2xl shadow-xl p-6 md:p-12 relative overflow-hidden mb-8">
        
        {/* Secure Watermark Background */}
        <div className="absolute inset-0 flex items-center justify-center opacity-[0.02] pointer-events-none">
          <span className="text-[140px] font-black rotate-[-30deg] tracking-widest text-primary">GLOBAL SECURE</span>
        </div>

        {/* PO Document Header */}
        <div className="relative z-10 space-y-8">
          
          <div className="flex flex-col md:flex-row justify-between items-start gap-6 border-b border-outline-variant pb-6">
            <div>
              <Badge variant="success">Awaiting Digital Signature</Badge>
              <h2 className="text-3xl font-black text-primary mt-3 tracking-tight">PURCHASE ORDER</h2>
              <p className="text-xs text-on-surface-variant mt-1.5 font-medium">PO Number: <span className="text-on-surface font-bold">{poNumber}</span></p>
              <p className="text-xs text-on-surface-variant font-medium">Date Issued: <span className="text-on-surface font-bold">23 May 2026</span></p>
            </div>

            <div className="text-right flex flex-col items-end">
              <div className="w-12 h-12 bg-primary-container border border-outline-variant text-on-primary-container rounded-xl flex items-center justify-center mb-2 shadow-inner">
                <Building2 className="size-6" />
              </div>
              <h3 className="text-base font-bold text-primary">GlobalTech Imports GmbH</h3>
              <p className="text-xs text-on-surface-variant">Frankfurt, Germany</p>
              <p className="text-xs text-on-surface-variant font-mono">UID: DE123456789</p>
            </div>
          </div>

          {/* Parties Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-surface p-5 rounded-xl border border-outline-variant shadow-inner">
            <div>
              <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-1.5 block">Vendor (Exporter)</span>
              <h4 className="text-sm font-bold text-primary">{companyName}</h4>
              <p className="text-xs text-on-surface-variant">{isRattan ? "Semarang, Jawa Tengah, Indonesia" : "Jakarta, Indonesia"}</p>
              <p className="text-xs text-on-surface-variant font-mono">NIB: {nib}</p>
              <div className="mt-2">
                <Badge variant="success" icon={BadgeCheck}>Verified OSS Profile</Badge>
              </div>
            </div>
            <div className="border-t md:border-t-0 md:border-l border-outline-variant pt-6 md:pt-0 md:pl-8">
              <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-1.5 block">Shipping & Payment Terms</span>
              <p className="text-xs text-on-surface-variant mb-1"><span className="font-semibold text-on-surface">Incoterms:</span> CIF Hamburg Port</p>
              <p className="text-xs text-on-surface-variant mb-1"><span className="font-semibold text-on-surface">Expected Delivery:</span> 15 August 2026</p>
              <p className="text-xs text-on-surface-variant"><span className="font-semibold text-on-surface">Payment Terms:</span> 30% DP, 70% LC at Sight</p>
            </div>
          </div>

          {/* Item Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[500px]">
              <thead>
                <tr className="border-b-2 border-outline-variant text-[10px] text-on-surface-variant font-bold uppercase tracking-wider">
                  <th className="pb-3">Description</th>
                  <th className="pb-3 text-center">HS Code</th>
                  <th className="pb-3 text-center">{isRattan ? "Qty (Pcs)" : "Qty (MT)"}</th>
                  <th className="pb-3 text-right">Unit Price</th>
                  <th className="pb-3 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="text-xs md:text-sm">
                <tr className="border-b border-outline-variant/40">
                  <td className="py-4">
                    <div className="font-bold text-primary">{isRattan ? productName : "Premium Robusta Coffee Beans (Grade 1)"}</div>
                    <div className="text-[11px] text-on-surface-variant mt-0.5">{isRattan ? "100% Certified Sustainable Rattan, Grade A Anyaman" : "Moisture <12.5%, Defects <11%, Screen Size 16"}</div>
                  </td>
                  <td className="py-4 text-center font-mono text-xs text-on-surface-variant">{isRattan ? "9401.52" : "0901.11"}</td>
                  <td className="py-4 text-center font-bold text-on-surface">{isRattan ? "150.00" : "18.00"}</td>
                  <td className="py-4 text-right font-mono text-on-surface">{isRattan ? formatCurrency(agreedPrice) : formatCurrency(agreedPrice * 1000)}</td>
                  <td className="py-4 text-right font-black font-mono text-primary">{formatCurrency(itemTotal)}</td>
                </tr>
                <tr className="border-b border-outline-variant/40">
                  <td className="py-4">
                    <div className="font-bold text-primary">CIF Logistics & Handling ({isRattan ? "Semarang" : "Jakarta"} to Hamburg)</div>
                    <div className="text-[11px] text-on-surface-variant mt-0.5">Includes local charges, ocean freight, cargo insurance</div>
                  </td>
                  <td className="py-4 text-center font-mono text-xs text-on-surface-variant">-</td>
                  <td className="py-4 text-center font-bold text-on-surface">1 FCL</td>
                  <td className="py-4 text-right font-mono text-on-surface">{formatCurrency(shippingTotal)}</td>
                  <td className="py-4 text-right font-black font-mono text-primary">{formatCurrency(shippingTotal)}</td>
                </tr>
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={3}></td>
                  <td className="py-5 text-right font-bold text-on-surface-variant uppercase text-[10px] tracking-wider">Grand Total (USD)</td>
                  <td className="py-5 text-right font-black text-primary text-xl font-mono tracking-tight">{formatCurrency(grandTotal)}</td>
                </tr>
              </tfoot>
            </table>
          </div>

          <hr className="border-outline-variant border-t my-4" />

          {/* Signature Panel */}
          <div>
            <h4 className="text-[11px] font-bold text-on-surface-variant uppercase tracking-widest mb-4 flex items-center gap-1.5">
              <PenTool className="text-primary size-4" />
              Authorized Secure Digital Signature
            </h4>

            <div className="bg-surface border border-outline-variant rounded-xl p-6 shadow-inner">
              
              {/* Toggle Mode */}
              <div className="flex gap-2 mb-6 bg-surface-container-low p-1 rounded-lg w-fit border border-outline-variant">
                <button 
                  onClick={() => setSignatureMode("draw")}
                  className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1.5 ${signatureMode === "draw" ? "bg-primary text-white shadow-sm" : "text-on-surface-variant hover:text-primary"}`}
                >
                  <Pen className="size-4" /> Draw Signature
                </button>
                <button 
                  onClick={() => setSignatureMode("type")}
                  className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1.5 ${signatureMode === "type" ? "bg-primary text-white shadow-sm" : "text-on-surface-variant hover:text-primary"}`}
                >
                  <Type className="size-4" /> Type Signature
                </button>
              </div>

              {/* Mode Canvas */}
              {signatureMode === "draw" ? (
                <div className="flex flex-col items-center gap-3">
                  <div className="relative w-full max-w-lg border-2 border-dashed border-outline-variant rounded-xl overflow-hidden shadow-inner h-40">
                    <canvas
                      ref={canvasRef}
                      width={512}
                      height={160}
                      className="absolute inset-0 w-full h-full bg-white cursor-crosshair touch-none"
                    />
                    <div className="absolute top-2 right-2 flex items-center gap-1">
                      <span className="text-[9px] font-bold bg-primary/15 text-primary px-2 py-0.5 rounded tracking-widest uppercase">Secure Pad</span>
                    </div>
                  </div>
                  <div className="flex gap-3 justify-end w-full max-w-lg">
                    <button 
                      onClick={clearCanvas}
                      className="px-4 py-1.5 border border-outline-variant rounded-md text-xs font-bold text-on-surface hover:bg-surface-container-low transition-colors flex items-center gap-1"
                    >
                      <RotateCcw className="size-3.5" /> Clear Pad
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-4">
                  <div className="flex flex-col gap-1 w-full max-w-lg">
                    <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Full Name</label>
                    <input 
                      type="text" 
                      value={typedName}
                      onChange={(e) => setTypedName(e.target.value)}
                      className="w-full p-2.5 bg-surface-container-lowest border border-outline-variant rounded-md text-sm text-primary font-semibold outline-none focus:border-primary"
                      placeholder="e.g., Klaus Weber"
                    />
                  </div>

                  <div className="w-full max-w-lg bg-surface-container-lowest border border-outline-variant rounded-xl p-6 flex flex-col items-center justify-center text-center shadow-inner h-28">
                    <div className="font-[cursive] text-4xl text-primary select-none opacity-80">
                      {typedName || "Your Signature"}
                    </div>
                    <span className="text-[9px] font-bold uppercase tracking-widest text-on-surface-variant mt-3">Pre-rendered B2B Cursive Signature</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Action Board */}
          <div className="pt-6 border-t border-outline-variant flex flex-col sm:flex-row justify-between items-center gap-4">
            <button 
              onClick={() => setIsRevisionMode(true)}
              className="w-full sm:w-auto px-6 py-3 border border-outline-variant hover:border-warning hover:text-warning text-on-surface-variant font-bold text-sm rounded-xl transition-colors flex justify-center items-center gap-2 cursor-pointer"
            >
              <NotebookPen className="size-[18px]" />
              Request Changes / Revision
            </button>
            <div className="flex gap-3 w-full sm:w-auto">
              <button 
                onClick={handleSignConfirm}
                className="w-full sm:w-auto px-8 py-3.5 bg-primary text-white hover:bg-surface-tint font-bold text-sm rounded-xl transition-all flex justify-center items-center gap-2 shadow-lg"
              >
                <Trophy className="size-[18px]" />
                Confirm & Sign Purchase Order
              </button>
            </div>
          </div>

        </div>
      </main>

      <footer className="text-center text-xs text-on-surface-variant space-y-1">
        <p>Protected by TradeConnect 256-bit SSL B2B Institutional Escrow Pipeline.</p>
        <p>© 2026 TradeConnect. All Rights Reserved. Frankfurt - {isRattan ? "Semarang" : "Jakarta"} corridor.</p>
      </footer>
    </div>
  );
}
