"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getStep, setStep as setJourneyStep, getFinalPrice } from "../../../lib/state";
import { ExportDocument } from "../../../types";

export default function PurchaseOrderPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<string>("onboarding");
  const [agreedPrice, setAgreedPrice] = useState(2.75);
  const [score, setScore] = useState(85);
  const [selectedDoc, setSelectedDoc] = useState<ExportDocument | null>(null);

  // Sync state and price
  useEffect(() => {
    setCurrentStep(getStep());
    setAgreedPrice(getFinalPrice());

    const handleStateChange = () => {
      const step = getStep();
      setCurrentStep(step);
      setAgreedPrice(getFinalPrice());
    };

    window.addEventListener("tradeconnect_state_change", handleStateChange);
    return () => {
      window.removeEventListener("tradeconnect_state_change", handleStateChange);
    };
  }, []);

  // Score count-up effect in Fase 8
  useEffect(() => {
    if (currentStep === "po_signed") {
      let current = 85;
      const target = 92;
      const interval = setInterval(() => {
        current += 1;
        setScore(current);
        if (current >= target) {
          clearInterval(interval);
        }
      }, 100);
      return () => clearInterval(interval);
    } else {
      setScore(85);
    }
  }, [currentStep]);

  const handleSendPO = () => {
    setJourneyStep("po_sent");
    setCurrentStep("po_sent");
  };

  const itemTotal = agreedPrice * 18 * 1000;
  const shippingTotal = 2100;
  const grandTotal = itemTotal + shippingTotal;

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    }).format(val);
  };

  // Export Documents metadata
  const exportDocs: ExportDocument[] = [
    {
      id: "invoice",
      name: "Commercial Invoice",
      type: "INVOICE-GLB-2605-001",
      description: "Official trade billing containing itemized product rates, banking instructions, and payment conditions.",
      fileSize: "148 KB",
      icon: "receipt_long",
      content: `PT Nusantara Global Coffee
Jakarta, Indonesia
NIB: 1234567890123

BILLED TO:
GlobalTech Imports GmbH
Frankfurt, Germany
UID: DE123456789

DESCRIPTION: Premium Robusta Coffee Beans (Grade 1)
HS Code: 0901.11
Quantity: 18.00 Metric Tons
Unit Price: $2,750.00 / MT
Logistics Term: CIF Hamburg Port
Grand Total: $51,600.00

PAYMENT METHOD: Letter of Credit (L/C) at Sight
Escrow Bank: Bank Mandiri (Persero) Tbk, Jakarta`
    },
    {
      id: "packing_list",
      name: "Packing List (CBM)",
      type: "PL-GLB-2605-001",
      description: "Detailed description of container cargo dimensions, net weight, gross weight, and packaging seals.",
      fileSize: "92 KB",
      icon: "inventory_2",
      content: `PACKING LIST
Shipment Ref: PO-GLB-2605-001
Carrier: Maersk Line V.29A

CARGO DESCRIPTION:
Product: Premium Robusta Coffee Beans Grade 1
Packaging: 300 Double-ply Jute Bags (60 kg net weight each)
Total Bags: 300 Bags
Net Weight: 18,000.00 Kgs (18 MT)
Gross Weight: 18,150.00 Kgs
Container: 1 x 20ft FCL (Full Container Load)
Seal Number: MAERSK-ID-992182
Volume: 24.2 CBM`
    },
    {
      id: "bl",
      name: "Draft Bill of Lading (B/L)",
      type: "BL-MAERSK-90021",
      description: "Sea freight carriage contract issued by Maersk Line confirming logistics routes and consignee instructions.",
      fileSize: "210 KB",
      icon: "directions_boat",
      content: `BILL OF LADING (DRAFT)
Carrier: Maersk Line A/S
B/L Number: MAEU90881920

SHIPPER: PT Nusantara Global Coffee, Jakarta, Indonesia
CONSIGNEE: GlobalTech Imports GmbH, Frankfurt, Germany
NOTIFY PARTY: Commerzbank AG, Frankfurt Branch

PORT OF LOADING: Port of Tanjung Priok (IDTPP), Jakarta
PORT OF DISCHARGE: Port of Hamburg (DEHAM), Germany
VESSEL NAME: Maersk Mc-Kinney Moller V.2605
FREIGHT STATUS: Prepaid under CIF Terms`
    },
    {
      id: "peb",
      name: "Pemberitahuan Ekspor Barang",
      type: "PEB-INSW-099281",
      description: "Official customs export declaration registered and cleared via INSW (Indonesia National Single Window).",
      fileSize: "312 KB",
      icon: "gavel",
      content: `REPUBLIK INDONESIA - DIREKTORAT JENDERAL BEA DAN CUKAI
PEMBERITAHUAN EKSPOR BARANG (PEB)
Nomor Pengajuan: 099281-20260523-000192

Eksportir: PT Nusantara Global Coffee (NIB: 1234567890123)
Penerima: GlobalTech Imports GmbH, Jerman
KBLI Utama: 46311 (Wholesale Coffee)

Komoditas: Kopi Robusta Premium (Roasted)
Kode HS: 0901.11 (Coffee, roasted, decaffeinated)
Valuta: USD ($51,600.00)
Kantor Bea Cukai Pemuatan: KPU Tanjung Priok
Status Kelulusan Lartas: BEBAS LARTAS (100% Cleared)`
    },
    {
      id: "coo",
      name: "Certificate of Origin (COO)",
      type: "COO-KADIN-00129",
      description: "Chamber of Commerce certificate confirming 100% authentic Indonesian origin for tariff reduction eligibility.",
      fileSize: "185 KB",
      icon: "workspace_premium",
      content: `INDONESIAN CHAMBER OF COMMERCE AND INDUSTRY (KADIN)
CERTIFICATE OF ORIGIN (FORM B-2-B)
Reference No: COO-KADIN-00129

We hereby certify that the goods described below are of Indonesian origin:
Exporter: PT Nusantara Global Coffee, Jakarta
Consignee: GlobalTech Imports GmbH, Frankfurt

Item: 300 Bags Premium Robusta Coffee Beans Grade 1
Source Origin: Banyumas & Lampung Highlands, Indonesia
Authority Seal: Chamber of Commerce West Jakarta Division
Verification Status: Genuine & Active`
    }
  ];

  // SUCCESS / DEAL CLOSED STATE (Fase 8)
  if (currentStep === "po_signed") {
    return (
      <div className="h-full w-full overflow-y-auto p-4 md:p-8 bg-surface-bright pb-24 flex items-center justify-center min-h-[calc(100vh-80px)] animate-in fade-in duration-500">
        <div className="w-full max-w-4xl bg-surface-container-lowest border border-outline-variant rounded-2xl shadow-xl overflow-hidden animate-in zoom-in-95 duration-500">
          
          {/* Success Header */}
          <div className="bg-[#070235] p-8 md:p-12 text-center text-white flex flex-col items-center relative overflow-hidden">
            <div className="absolute inset-0 opacity-10 pointer-events-none">
              <div className="absolute -top-24 -right-24 w-64 h-64 bg-white rounded-full blur-3xl"></div>
              <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-white rounded-full blur-3xl"></div>
            </div>
            
            <div className="w-20 h-20 bg-[#85f8c4] rounded-full flex items-center justify-center mb-6 shadow-[0_0_20px_rgba(133,248,196,0.3)] z-10 border-4 border-white/10">
              <span className="material-symbols-outlined text-[40px] text-[#070235]" style={{ fontVariationSettings: "'FILL' 1" }}>handshake</span>
            </div>
            <h1 className="text-3xl md:text-5xl font-extrabold mb-3 z-10 tracking-tight">Transaksi Ekspor Berhasil!</h1>
            <p className="text-white/80 text-base z-10 max-w-lg leading-relaxed">
              Klaus Weber telah menandatangani Purchase Order. Seluruh berkas ekspor telah diterbitkan oleh TradeConnect AI.
            </p>
          </div>

          <div className="p-6 md:p-8 grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
            
            {/* Score Increase Widget (Left 5 cols) */}
            <div className="md:col-span-5 bg-surface p-6 rounded-xl border border-outline-variant text-center shadow-sm flex flex-col justify-center h-full">
              <div className="flex items-center justify-center gap-2 mb-4">
                <span className="material-symbols-outlined text-secondary text-[24px]">trending_up</span>
                <h3 className="text-base font-bold text-on-surface">Peningkatan Profile Score</h3>
              </div>
              <div className="flex items-center justify-center gap-6 my-4">
                <div className="flex flex-col items-center">
                  <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mb-1">Sebelumnya</span>
                  <span className="text-3xl font-bold text-on-surface-variant line-through">85</span>
                </div>
                <span className="material-symbols-outlined text-outline-variant text-3xl">arrow_forward</span>
                <div className="flex flex-col items-center">
                  <span className="text-[10px] font-bold text-secondary uppercase tracking-wider mb-1">Sekarang</span>
                  <span className="text-5xl font-black text-secondary animate-pulse">{score}</span>
                </div>
              </div>
              <p className="text-xs text-on-surface-variant leading-relaxed mt-2">
                Selamat! Rekam jejak sukses perdana Anda telah menaikkan kredibilitas ekspor Anda. Akses pencocokan dengan **Buyer Premium (Tier 1)** kini terbuka secara eksklusif!
              </p>
            </div>

            {/* Document Package Grid (Right 7 cols) */}
            <div className="md:col-span-7 space-y-4">
              <h3 className="text-sm font-bold text-on-surface-variant uppercase tracking-wider flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[18px] text-primary">folder_zip</span>
                Export Document Package (Fase 8)
              </h3>
              
              <div className="grid grid-cols-1 gap-3">
                {exportDocs.map((doc) => (
                  <div 
                    key={doc.id} 
                    onClick={() => setSelectedDoc(doc)}
                    className="flex justify-between items-center p-3.5 bg-surface-container-lowest border border-outline-variant hover:border-primary hover:shadow-md rounded-xl transition-all cursor-pointer group shadow-sm"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-indigo-50 border border-outline-variant/60 text-[#070235] rounded-lg flex items-center justify-center shrink-0">
                        <span className="material-symbols-outlined text-[20px]">{doc.icon}</span>
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-on-surface group-hover:text-primary transition-colors">{doc.name}</h4>
                        <p className="text-[11px] font-mono text-on-surface-variant">{doc.type}</p>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono font-bold bg-[#85f8c4]/30 text-emerald-800 border border-[#85f8c4] px-2 py-0.5 rounded flex items-center gap-1">
                      <span className="material-symbols-outlined text-[12px]" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span> Ready
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="p-6 bg-surface-container-low border-t border-outline-variant flex justify-center">
            <button 
              onClick={() => router.push('/dashboard')}
              className="px-8 py-3 bg-primary text-on-primary rounded-lg font-bold text-base hover:bg-surface-tint transition-colors flex items-center gap-2 shadow-md hover:-translate-y-0.5 transition-all"
            >
              Kembali ke Dashboard
              <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
            </button>
          </div>
        </div>

        {/* DOCUMENT PREVIEW MODAL */}
        {selectedDoc && (
          <div className="fixed inset-0 bg-[#070235]/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
            <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl w-full max-w-2xl shadow-2xl p-6 md:p-8 flex flex-col max-h-[85vh] overflow-hidden animate-in zoom-in-95 duration-300">
              
              <div className="flex justify-between items-center border-b border-outline-variant/60 pb-4 mb-6 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-indigo-50 border border-outline-variant text-[#070235] rounded-xl flex items-center justify-center">
                    <span className="material-symbols-outlined text-xl">{selectedDoc.icon}</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-[#070235] leading-tight">{selectedDoc.name}</h3>
                    <p className="text-xs text-on-surface-variant font-mono">{selectedDoc.type} • {selectedDoc.fileSize}</p>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedDoc(null)}
                  className="text-on-surface-variant hover:text-error p-1.5 rounded-full hover:bg-surface-container-low transition-colors"
                >
                  <span className="material-symbols-outlined text-[22px]">close</span>
                </button>
              </div>

              <div className="flex-1 overflow-y-auto bg-slate-900 border border-slate-800 rounded-xl p-6 font-mono text-xs md:text-sm text-emerald-400 leading-relaxed whitespace-pre-line shadow-inner max-h-[450px]">
                {selectedDoc.content}
              </div>

              <div className="border-t border-outline-variant/60 pt-4 mt-6 flex justify-end gap-3 shrink-0">
                <button 
                  onClick={() => setSelectedDoc(null)}
                  className="px-5 py-2 border border-outline-variant hover:bg-surface rounded-lg text-xs font-bold text-on-surface transition-colors"
                >
                  Tutup
                </button>
                <button 
                  onClick={() => {
                    alert(`Mengunduh Berkas ${selectedDoc.name} (${selectedDoc.fileSize}) dari database INSW...`);
                    setSelectedDoc(null);
                  }}
                  className="px-6 py-2 bg-primary text-on-primary hover:bg-surface-tint rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 shadow-md"
                >
                  <span className="material-symbols-outlined text-[16px]">download</span>
                  Unduh Dokumen Resmi
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    );
  }

  // WAITING FOR BUYER'S SIGNATURE STATE (Fase 7 - Waiting)
  if (currentStep === "po_sent") {
    return (
      <div className="h-full w-full overflow-y-auto p-4 md:p-8 bg-surface-bright pb-16 flex flex-col items-center justify-center min-h-[calc(100vh-80px)] relative animate-in fade-in duration-500">
        
        {/* Floating Premium Demo Helper Bar */}
        <div className="absolute top-4 w-full max-w-2xl bg-amber-50 border border-amber-200 rounded-xl p-4 flex flex-col sm:flex-row justify-between items-center gap-3 shadow-md z-15 animate-bounce">
          <div className="flex items-center gap-2 text-amber-800">
            <span className="material-symbols-outlined text-[22px] animate-pulse">auto_awesome</span>
            <span className="text-xs font-semibold"><strong>DEMO TOOL:</strong> Klaus Weber has received the PO link via email!</span>
          </div>
          <button 
            onClick={() => window.open('/signing-board?token=klaus-weber-9918', '_blank')}
            className="px-4 py-2 bg-[#070235] hover:bg-surface-tint text-[#85f8c4] rounded-lg text-xs font-extrabold shadow-md transition-colors flex items-center gap-1.5 shrink-0"
          >
            Buka Layar Buyer (Klaus)
            <span className="material-symbols-outlined text-[16px]">open_in_new</span>
          </button>
        </div>

        <div className="w-full max-w-xl bg-surface-container-lowest border border-outline-variant rounded-2xl shadow-xl p-8 text-center flex flex-col items-center gap-6 mt-16 animate-in zoom-in-95 duration-500">
          <div className="relative w-20 h-20 flex items-center justify-center">
            <div className="absolute inset-0 border-4 border-outline-variant rounded-full"></div>
            <div className="absolute inset-0 border-4 border-[#070235] rounded-full border-t-transparent animate-spin"></div>
            <span className="material-symbols-outlined text-[#070235] text-3xl animate-pulse">forward_to_inbox</span>
          </div>

          <div>
            <h2 className="text-2xl font-black text-[#070235] mb-2 tracking-tight">PO Sent & Awaiting Signature</h2>
            <p className="text-xs text-on-surface-variant font-bold uppercase tracking-widest mb-4">Fase 7 — Menunggu Persetujuan Pembeli</p>
            <p className="text-sm text-on-surface-variant leading-relaxed max-w-sm mx-auto">
              Purchase Order **PO-GLB-2605-001** has been generated and securely emailed to Klaus Weber at **GlobalTech Imports GmbH**.
            </p>
          </div>

          <div className="bg-surface p-4 rounded-xl border border-outline-variant text-left space-y-2 w-full text-xs text-on-surface-variant shadow-inner">
            <div className="flex justify-between">
              <span>Secure Token Link</span>
              <span className="font-mono text-primary font-bold">/signing-board?token=klaus...</span>
            </div>
            <div className="flex justify-between">
              <span>CIF Contract Price</span>
              <span className="font-bold text-on-surface">{formatCurrency(grandTotal)}</span>
            </div>
            <div className="flex justify-between">
              <span>Status</span>
              <span className="text-amber-600 font-bold uppercase flex items-center gap-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping"></span> Waiting Signature
              </span>
            </div>
          </div>

          <p className="text-[11px] text-on-surface-variant max-w-xs leading-normal">
            This dashboard will **automatically unlock** immediately when the buyer clicks and signs the purchase order in the tab above!
          </p>
        </div>
      </div>
    );
  }

  // DEFAULT / DRAFT PO STATE (Sisi Seller/UMKM)
  return (
    <div className="h-full w-full overflow-y-auto p-4 md:p-8 bg-surface-bright pb-16 animate-in fade-in duration-500">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Page Header */}
        <div className="flex justify-between items-end border-b border-outline-variant pb-6">
          <div>
            <h2 className="text-2xl font-bold text-on-surface">Purchase Order Finalization</h2>
            <p className="text-sm text-on-surface-variant mt-1 font-medium font-medium">Review and issue the finalized PO generated from your negotiations.</p>
          </div>
          <button className="text-primary text-sm font-bold flex items-center gap-2 border border-outline-variant px-4 py-2 rounded hover:bg-surface-container-low transition-colors shadow-sm bg-surface-container-lowest">
            <span className="material-symbols-outlined text-[20px]">download</span>
            Unduh Draft PO
          </button>
        </div>

        {/* PO Document Preview */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl shadow-xl p-8 md:p-12 relative overflow-hidden">
          {/* Watermark */}
          <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none">
            <span className="text-[120px] font-black rotate-[-30deg] tracking-widest text-on-surface">TRADE CONNECT</span>
          </div>

          <div className="relative z-10 flex flex-col gap-10">
            {/* PO Header */}
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-3xl font-black text-primary mb-2 tracking-tight">PURCHASE ORDER</h1>
                <p className="text-sm text-on-surface-variant font-medium">PO Number: <span className="text-on-surface font-bold">PO-GLB-2605-001</span></p>
                <p className="text-sm text-on-surface-variant font-medium">Date: <span className="text-on-surface font-bold">23 May 2026</span></p>
              </div>
              <div className="text-right">
                <div className="w-12 h-12 bg-tertiary-container border border-outline-variant text-on-tertiary-container rounded-xl flex items-center justify-center ml-auto mb-2 shadow-inner">
                  <span className="material-symbols-outlined text-2xl">domain</span>
                </div>
                <h3 className="text-base font-bold text-on-surface">GlobalTech Imports GmbH</h3>
                <p className="text-xs text-on-surface-variant">Frankfurt, Germany</p>
                <p className="text-xs text-on-surface-variant font-mono">UID: DE123456789</p>
              </div>
            </div>

            <hr className="border-outline-variant" />

            {/* Vendor Details */}
            <div className="grid grid-cols-2 gap-8">
              <div>
                <h4 className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider mb-2">Vendor (Supplier)</h4>
                <h3 className="text-sm font-bold text-on-surface">PT Nusantara Global Coffee</h3>
                <p className="text-xs text-on-surface-variant">Jakarta, Indonesia</p>
                <p className="text-xs text-on-surface-variant font-mono">NIB: 1234567890123</p>
              </div>
              <div>
                <h4 className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider mb-2">Shipping & Logistics</h4>
                <p className="text-xs text-on-surface-variant mb-0.5"><span className="font-semibold text-on-surface">Incoterms:</span> CIF Hamburg Port</p>
                <p className="text-xs text-on-surface-variant mb-0.5"><span className="font-semibold text-on-surface">Expected Delivery:</span> 15 Aug 2026</p>
                <p className="text-xs text-on-surface-variant"><span className="font-semibold text-on-surface">Payment:</span> 30% DP, 70% LC at Sight</p>
              </div>
            </div>

            {/* Item Table */}
            <div>
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b-2 border-outline-variant text-xs text-on-surface-variant font-bold uppercase tracking-wider">
                    <th className="pb-3">Description</th>
                    <th className="pb-3 text-center">HS Code</th>
                    <th className="pb-3 text-center">Qty (MT)</th>
                    <th className="pb-3 text-right">Unit Price</th>
                    <th className="pb-3 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  <tr className="border-b border-outline-variant/50">
                    <td className="py-4">
                      <div className="font-bold text-on-surface">Premium Robusta Coffee Beans (Grade 1)</div>
                    </td>
                    <td className="py-4 text-center text-on-surface-variant font-mono">0901.11</td>
                    <td className="py-4 text-center text-on-surface font-semibold">18.00</td>
                    <td className="py-4 text-right text-on-surface font-mono">{formatCurrency(agreedPrice * 1000)}</td>
                    <td className="py-4 text-right font-black text-on-surface font-mono">{formatCurrency(itemTotal)}</td>
                  </tr>
                  <tr className="border-b border-outline-variant/50">
                    <td className="py-4">
                      <div className="font-bold text-on-surface">CIF Logistics & Handling (to Hamburg)</div>
                    </td>
                    <td className="py-4 text-center text-on-surface-variant font-mono">-</td>
                    <td className="py-4 text-center text-on-surface font-semibold">1 FCL</td>
                    <td className="py-4 text-right text-on-surface font-mono">{formatCurrency(shippingTotal)}</td>
                    <td className="py-4 text-right font-black text-on-surface font-mono">{formatCurrency(shippingTotal)}</td>
                  </tr>
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan={3}></td>
                    <td className="py-4 text-right font-bold text-on-surface-variant uppercase text-[11px] tracking-wider">Grand Total (USD)</td>
                    <td className="py-4 text-right font-black text-primary text-xl font-mono tracking-tight">{formatCurrency(grandTotal)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Signatures */}
            <div className="grid grid-cols-2 gap-8 mt-8 border-t border-outline-variant pt-8">
              <div className="flex flex-col items-center">
                <span className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider mb-8">Authorized Buyer</span>
                <div className="w-48 h-12 border-b border-outline-variant flex items-center justify-center">
                  <span className="text-xs text-on-surface-variant/40 font-semibold italic">Waiting for signature</span>
                </div>
                <span className="text-xs font-semibold text-on-surface mt-2">Klaus Weber (GlobalTech)</span>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider mb-8">Authorized Supplier (You)</span>
                <div className="w-48 h-12 border-b-2 border-primary border-dashed flex items-end justify-center pb-1">
                  <span className="text-[10px] text-primary/75 font-bold uppercase tracking-widest flex items-center gap-1 animate-pulse">
                    <span className="material-symbols-outlined text-[14px]">draw</span> Sign on Approval
                  </span>
                </div>
                <span className="text-xs font-semibold text-on-surface mt-2">You (PT Nusantara Coffee)</span>
              </div>
            </div>

          </div>
        </div>

        {/* Sticky Solid Footer Bar to prevent bleed-through */}
        <div className="sticky bottom-0 -mx-4 md:-mx-8 px-4 md:px-8 py-4 border-t border-outline-variant bg-surface-container-lowest flex justify-end z-20 shadow-[0_-8px_20px_rgba(0,0,0,0.03)] mt-8">
          <button 
            onClick={handleSendPO}
            className="bg-[#070235] text-white shadow-xl px-8 py-4 rounded-xl text-lg font-bold flex items-center gap-3 hover:bg-[#5b598c] hover:-translate-y-1 transition-all active:translate-y-0 shadow-[0_0_20px_rgba(7,2,53,0.25)]"
          >
            <span className="material-symbols-outlined text-[24px]">send_and_archive</span>
            Approve & Send PO for Buyer Sign
          </button>
        </div>

      </div>
    </div>
  );
}
