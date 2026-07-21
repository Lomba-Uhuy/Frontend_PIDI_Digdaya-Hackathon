"use client";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { setStep as setJourneyStep } from "../../../lib/state";
import { Product } from "../../../lib/models/product";
import {
  getActiveDealId,
  getPurchaseOrder,
  generatePurchaseOrder,
  sendPurchaseOrder,
  signPurchaseOrder,
  type PurchaseOrder,
} from "../../../lib/deals";
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  Download,
  FileText,
  FolderArchive,
  Handshake,
  Loader2,
  MailPlus,
  PenTool,
  Send,
  X,
} from "lucide-react";
import { Badge } from "../../../components/ui/badge";

const fmtUsd = (v: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2 }).format(v);

interface GeneratedDoc {
  id: string;
  name: string;
  ref: string;
  content: string;
}

export default function PurchaseOrderPage() {
  const router = useRouter();
  const [dealId, setDealId] = useState<string | null>(null);
  const [po, setPo] = useState<PurchaseOrder | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "empty" | "error">("loading");
  const [busy, setBusy] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<GeneratedDoc | null>(null);

  const [companyName, setCompanyName] = useState("");
  const [nib, setNib] = useState("");
  const [hsCode, setHsCode] = useState("");

  const load = useCallback(async (id: string) => {
    setStatus("loading");
    let record = await getPurchaseOrder(id);
    if (!record) record = await generatePurchaseOrder(id); // create draft from the deal
    if (!record) {
      setStatus("empty");
      return;
    }
    setPo(record);
    setStatus("ready");
  }, []);

  useEffect(() => {
    const product = Product.current();
    setCompanyName(product.companyName);
    setNib(product.nib);
    setHsCode(product.hsCode || product.hsCandidates?.[0]?.hs_code || "");
    const id = getActiveDealId();
    setDealId(id);
    if (id) void load(id);
    else setStatus("empty");
  }, [load]);

  const handleSend = async () => {
    if (!dealId) return;
    setBusy(true);
    const updated = await sendPurchaseOrder(dealId);
    if (updated) {
      setPo(updated);
      setJourneyStep("po_sent");
    }
    setBusy(false);
  };

  // The buyer is an AI-simulated counterparty (no real inbound signing channel),
  // so signing is triggered here and recorded against the real PO on the backend.
  const handleSimulateBuyerSign = async () => {
    if (!dealId || !po) return;
    setBusy(true);
    const updated = await signPurchaseOrder(dealId, po.buyerName || "Buyer");
    if (updated) {
      setPo(updated);
      setJourneyStep("po_signed");
    }
    setBusy(false);
  };

  // ── Loading / empty / error ──────────────────────────────────────────────────
  if (status === "loading") {
    return (
      <div className="h-full w-full flex items-center justify-center bg-surface-bright text-on-surface-variant gap-2 text-sm">
        <Loader2 className="size-5 animate-spin" /> Memuat Purchase Order…
      </div>
    );
  }
  if (status === "empty" || !po) {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center bg-surface-bright p-8 text-center">
        <FileText className="size-10 text-outline mb-3" />
        <h2 className="text-lg font-bold text-on-surface mb-1">Belum ada Purchase Order</h2>
        <p className="text-sm text-on-surface-variant max-w-md mb-5">
          Selesaikan negosiasi hingga pembeli menyetujui harga. PO akan dibuat otomatis dari kesepakatan tersebut.
        </p>
        <button
          onClick={() => router.push("/negotiation")}
          className="bg-primary text-on-primary px-6 py-2.5 rounded-lg text-sm font-bold hover:bg-surface-tint transition-colors flex items-center gap-2"
        >
          Buka Pusat Negosiasi <ArrowRight className="size-4" />
        </button>
      </div>
    );
  }

  const unitPrice = Number(po.unitPrice);
  const subtotal = Number(po.subtotal);

  const docs: GeneratedDoc[] = [
    {
      id: "po",
      name: "Purchase Order",
      ref: po.poNumber,
      content: `PURCHASE ORDER ${po.poNumber}
Penjual: ${companyName}${nib ? ` (NIB: ${nib})` : ""}, Indonesia
Pembeli: ${po.buyerName ?? "-"}${po.buyerCountry ? `, ${po.buyerCountry}` : ""}
Produk: ${po.productName ?? "-"}${hsCode ? ` (HS ${hsCode})` : ""}
Incoterm: ${po.incoterm}
Harga satuan: ${fmtUsd(unitPrice)} × ${po.qty} = ${fmtUsd(subtotal)}
Termin pembayaran: ${po.paymentTerms}
Status: ${po.status.toUpperCase()}${po.signedBy ? `\nDitandatangani oleh: ${po.signedBy}` : ""}`,
    },
    {
      id: "invoice",
      name: "Commercial Invoice",
      ref: `INV-${po.poNumber}`,
      content: `COMMERCIAL INVOICE (INV-${po.poNumber})
Dari: ${companyName}, Indonesia
Kepada: ${po.buyerName ?? "-"}${po.buyerCountry ? `, ${po.buyerCountry}` : ""}
Deskripsi: ${po.productName ?? "-"}${hsCode ? ` — HS ${hsCode}` : ""}
Kuantitas: ${po.qty}
Harga satuan (${po.incoterm}): ${fmtUsd(unitPrice)}
Total tagihan: ${fmtUsd(subtotal)} ${po.currency}
Termin pembayaran: ${po.paymentTerms}`,
    },
  ];

  // ── Signed / success ─────────────────────────────────────────────────────────
  if (po.status === "signed") {
    return (
      <div className="h-full w-full overflow-y-auto p-4 md:p-8 bg-surface-bright pb-24 flex items-center justify-center animate-in fade-in duration-500">
        <div className="w-full max-w-4xl bg-surface-container-lowest border border-outline-variant rounded-2xl shadow-xl overflow-hidden">
          <div className="bg-primary p-8 md:p-12 text-center text-white flex flex-col items-center">
            <div className="w-20 h-20 bg-secondary-fixed rounded-full flex items-center justify-center mb-6 border-4 border-white/10">
              <Handshake className="text-primary size-10" />
            </div>
            <h1 className="text-3xl md:text-5xl font-extrabold mb-3 tracking-tight font-heading">Transaksi Ekspor Berhasil!</h1>
            <p className="text-white/80 text-base max-w-lg leading-relaxed">
              {po.buyerName ?? "Pembeli"} telah menandatangani Purchase Order {po.poNumber}. Nilai kontrak {fmtUsd(subtotal)}.
            </p>
          </div>

          <div className="p-6 md:p-8 space-y-4">
            <h3 className="text-sm font-bold text-on-surface-variant uppercase tracking-wider flex items-center gap-1.5">
              <FolderArchive className="text-primary size-4.5" /> Dokumen dibuat dari data PO
            </h3>
            <div className="grid grid-cols-1 gap-3">
              {docs.map((doc) => (
                <div
                  key={doc.id}
                  onClick={() => setSelectedDoc(doc)}
                  className="flex justify-between items-center p-3.5 bg-surface-container-lowest border border-outline-variant hover:border-primary hover:shadow-md rounded-xl transition-all cursor-pointer group shadow-sm"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary-container border border-outline-variant/60 text-on-primary-container rounded-lg flex items-center justify-center shrink-0">
                      <FileText className="size-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-on-surface group-hover:text-primary transition-colors">{doc.name}</h4>
                      <p className="text-[11px] font-mono text-on-surface-variant">{doc.ref}</p>
                    </div>
                  </div>
                  <Badge variant="success" icon={CheckCircle2}>Siap</Badge>
                </div>
              ))}
            </div>
          </div>

          <div className="p-6 bg-surface-container-low border-t border-outline-variant flex justify-center">
            <button
              onClick={() => router.push("/dashboard")}
              className="px-8 py-3 bg-primary text-on-primary rounded-lg font-bold text-base hover:bg-surface-tint transition-all flex items-center gap-2 shadow-md hover:-translate-y-0.5"
            >
              Kembali ke Dashboard <ArrowRight className="size-5" />
            </button>
          </div>
        </div>
        {selectedDoc && <DocModal doc={selectedDoc} onClose={() => setSelectedDoc(null)} />}
      </div>
    );
  }

  // ── Sent / waiting for signature ─────────────────────────────────────────────
  if (po.status === "sent") {
    return (
      <div className="h-full w-full overflow-y-auto p-4 md:p-8 bg-surface-bright flex flex-col items-center justify-center animate-in fade-in duration-500">
        <div className="w-full max-w-xl bg-surface-container-lowest border border-outline-variant rounded-2xl shadow-xl p-8 text-center flex flex-col items-center gap-6">
          <div className="relative w-20 h-20 flex items-center justify-center">
            <div className="absolute inset-0 border-4 border-outline-variant rounded-full"></div>
            <div className="absolute inset-0 border-4 border-primary rounded-full border-t-transparent animate-spin"></div>
            <MailPlus className="text-primary animate-pulse size-8" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-primary mb-2 tracking-tight font-heading">PO Terkirim & Menunggu Tanda Tangan</h2>
            <p className="text-sm text-on-surface-variant leading-relaxed max-w-sm mx-auto">
              Purchase Order <strong className="text-on-surface">{po.poNumber}</strong> telah dikirim ke{" "}
              <strong className="text-on-surface">{po.buyerName ?? "pembeli"}</strong>. Nilai kontrak {fmtUsd(subtotal)}.
            </p>
          </div>
          <button
            onClick={handleSimulateBuyerSign}
            disabled={busy}
            className="px-6 py-3 bg-primary text-on-primary rounded-lg font-bold text-sm hover:bg-surface-tint transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            {busy ? <Loader2 className="size-4 animate-spin" /> : <PenTool className="size-4" />}
            Simulasikan Tanda Tangan Pembeli (AI)
          </button>
          <p className="text-[11px] text-on-surface-variant max-w-xs leading-normal">
            Pembeli adalah counterpart AI-tersimulasi; menandatangani mencatat status <strong>po_signed</strong> pada PO nyata di backend.
          </p>
        </div>
      </div>
    );
  }

  // ── Draft ────────────────────────────────────────────────────────────────────
  return (
    <div className="h-full w-full overflow-y-auto p-4 md:p-8 bg-surface-bright pb-16 animate-in fade-in duration-500">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex justify-between items-end border-b border-outline-variant pb-6">
          <div>
            <h2 className="text-2xl font-bold text-on-surface font-heading">Finalisasi Purchase Order</h2>
            <p className="text-sm text-on-surface-variant mt-1 font-medium">
              Dihasilkan otomatis dari kesepakatan negosiasi Anda.
            </p>
          </div>
        </div>

        <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl shadow-xl p-8 md:p-12 relative overflow-hidden">
          <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none">
            <span className="text-[120px] font-black rotate-[-30deg] tracking-widest text-on-surface">TRADE CONNECT</span>
          </div>
          <div className="relative z-10 flex flex-col gap-10">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-3xl font-black text-primary mb-2 tracking-tight">PURCHASE ORDER</h1>
                <p className="text-sm text-on-surface-variant font-medium">
                  Nomor PO: <span className="text-on-surface font-bold">{po.poNumber}</span>
                </p>
              </div>
              <div className="text-right">
                <div className="w-12 h-12 bg-tertiary-container border border-outline-variant text-on-tertiary-container rounded-xl flex items-center justify-center ml-auto mb-2 shadow-inner">
                  <Building2 className="size-6" />
                </div>
                <h3 className="text-base font-bold text-on-surface">{po.buyerName ?? "Pembeli"}</h3>
                <p className="text-xs text-on-surface-variant">{po.buyerCountry ?? ""}</p>
              </div>
            </div>

            <hr className="border-outline-variant" />

            <div className="grid grid-cols-2 gap-8">
              <div>
                <h4 className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider mb-2">Penjual (Eksportir UMKM)</h4>
                <h3 className="text-sm font-bold text-on-surface">{companyName || "—"}</h3>
                <p className="text-xs text-on-surface-variant">Indonesia</p>
                {nib && <p className="text-xs text-on-surface-variant font-mono">NIB: {nib}</p>}
              </div>
              <div>
                <h4 className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider mb-2">Rincian Logistik</h4>
                <p className="text-xs text-on-surface-variant mb-0.5"><span className="font-semibold text-on-surface">Incoterms:</span> {po.incoterm}</p>
                <p className="text-xs text-on-surface-variant"><span className="font-semibold text-on-surface">Pembayaran:</span> {po.paymentTerms}</p>
              </div>
            </div>

            <div>
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b-2 border-outline-variant text-xs text-on-surface-variant font-bold uppercase tracking-wider">
                    <th className="pb-3">Deskripsi Produk</th>
                    <th className="pb-3 text-center">Kode HS</th>
                    <th className="pb-3 text-center">Qty</th>
                    <th className="pb-3 text-right">Harga Satuan</th>
                    <th className="pb-3 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  <tr className="border-b border-outline-variant/50">
                    <td className="py-4"><div className="font-bold text-on-surface">{po.productName ?? "Produk"}</div></td>
                    <td className="py-4 text-center text-on-surface-variant font-mono">{hsCode || "—"}</td>
                    <td className="py-4 text-center text-on-surface font-semibold">{po.qty}</td>
                    <td className="py-4 text-right text-on-surface font-mono">{fmtUsd(unitPrice)}</td>
                    <td className="py-4 text-right font-black text-on-surface font-mono">{fmtUsd(subtotal)}</td>
                  </tr>
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan={3}></td>
                    <td className="py-4 text-right font-bold text-on-surface-variant uppercase text-[11px] tracking-wider">Grand Total ({po.currency})</td>
                    <td className="py-4 text-right font-black text-primary text-xl font-mono tracking-tight">{fmtUsd(subtotal)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>

        <div className="sticky bottom-0 -mx-4 md:-mx-8 px-4 md:px-8 py-4 border-t border-outline-variant bg-surface-container-lowest flex justify-end z-20 mt-8">
          <button
            onClick={handleSend}
            disabled={busy}
            className="bg-primary text-white shadow-xl px-8 py-4 rounded-xl text-lg font-bold flex items-center gap-3 hover:bg-primary-hover hover:-translate-y-1 transition-all active:translate-y-0 disabled:opacity-50"
          >
            {busy ? <Loader2 className="size-6 animate-spin" /> : <Send className="size-6" />}
            Setujui & Kirim PO ke Pembeli
          </button>
        </div>
      </div>
    </div>
  );
}

function DocModal({ doc, onClose }: { doc: GeneratedDoc; onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-primary/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-300" onClick={onClose}>
      <div
        className="bg-surface-container-lowest border border-outline-variant rounded-2xl w-full max-w-2xl shadow-2xl p-6 md:p-8 flex flex-col max-h-[85vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center border-b border-outline-variant/60 pb-4 mb-6 shrink-0">
          <div>
            <h3 className="text-lg font-black text-primary leading-tight">{doc.name}</h3>
            <p className="text-xs text-on-surface-variant font-mono">{doc.ref}</p>
          </div>
          <button onClick={onClose} className="text-on-surface-variant hover:text-error p-1.5 rounded-full hover:bg-surface-container-low transition-colors">
            <X className="size-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto bg-slate-900 border border-slate-800 rounded-xl p-6 font-mono text-xs md:text-sm text-emerald-400 leading-relaxed whitespace-pre-line shadow-inner">
          {doc.content}
        </div>
        <div className="border-t border-outline-variant/60 pt-4 mt-6 flex justify-end shrink-0">
          <button onClick={onClose} className="px-5 py-2 border border-outline-variant hover:bg-surface rounded-lg text-xs font-bold text-on-surface transition-colors">
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
