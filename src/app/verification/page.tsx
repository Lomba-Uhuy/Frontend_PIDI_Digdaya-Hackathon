"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  ArrowRight,
  Award,
  BadgeCheck,
  Check,
  CheckCircle2,
  ClipboardCheck,
  Gavel,
  RotateCcw,
  Tag,
  TrendingUp,
  XCircle,
} from "lucide-react";
import { ProgressRing } from "../../components/ui/progress-ring";
import { verifyNib, classifyHs, getStoredIds, NibVerification, HsClassification } from "../../lib/entities";
import { Product } from "../../lib/models/product";

type Verdict = "verified" | "failed" | "incomplete";

export default function VerificationPage() {
  const router = useRouter();
  const [loadingStep, setLoadingStep] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [minElapsed, setMinElapsed] = useState(false);
  const [score, setScore] = useState(0);

  const [companyName, setCompanyName] = useState("");
  const [productName, setProductName] = useState("");
  const [nibInput, setNibInput] = useState("");

  // Live backend results. `checked` flags tell us the call resolved (so we can
  // distinguish "still loading" from "backend returned nothing / invalid").
  const [nibResult, setNibResult] = useState<NibVerification | null>(null);
  const [nibChecked, setNibChecked] = useState(false);
  const [hsResult, setHsResult] = useState<HsClassification | null>(null);
  const [hsChecked, setHsChecked] = useState(false);
  const [hasProduct, setHasProduct] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const product = Product.current();
    setCompanyName(product.companyName || "");
    setProductName(product.name || "");
    const nib = product.nib || "";
    setNibInput(nib);
    setHasProduct(Boolean(getStoredIds().productId));

    const desc = product.description || product.name || "Produk ekspor Indonesia";

    // Real OSS/INSW NIB validation.
    verifyNib(nib)
      .then((r) => setNibResult(r))
      .finally(() => setNibChecked(true));
    // Real AI HS classification (RAG). Cache the ranked candidates on the Product
    // so later screens (e.g. Market Intelligence) read them instantly — no re-analysis.
    classifyHs(desc, 6)
      .then((r) => {
        setHsResult(r);
        if (r) Product.current().setHsClassification(r).save();
      })
      .finally(() => setHsChecked(true));
  }, []);

  // Staged progress animation for the analysis screen.
  useEffect(() => {
    const t1 = setTimeout(() => setLoadingStep(1), 1200);
    const t2 = setTimeout(() => setLoadingStep(2), 2400);
    const t3 = setTimeout(() => setLoadingStep(3), 3600);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, []);

  // Timers: a minimum UX delay so the analysis screen doesn't flash, and a hard
  // safety timeout so a slow/stuck upstream can never hang the screen forever.
  useEffect(() => {
    const min = setTimeout(() => setMinElapsed(true), 2500);
    const max = setTimeout(() => setIsComplete(true), 15000);
    return () => {
      clearTimeout(min);
      clearTimeout(max);
    };
  }, []);

  // Reveal results only after EVERY process has finished: the OSS/INSW NIB check
  // AND the AI HS classification must both have resolved (plus the min UX delay).
  // This prevents showing the result with HS Code stuck at 0% while the AI mapping
  // is still running in the background.
  useEffect(() => {
    if (minElapsed && nibChecked && hsChecked) setIsComplete(true);
  }, [minElapsed, nibChecked, hsChecked]);

  // ── Strict, real scoring derived from live signals ──────────────────────────
  const nibDigits = nibInput.replace(/\D/g, "");
  const nibFormatValid = /^\d{13}$/.test(nibDigits);
  const legalChecked = nibChecked && nibResult != null; // backend responded
  const legalValid = nibResult?.is_valid === true;

  const verdict: Verdict = !nibFormatValid
    ? "incomplete"
    : !legalChecked
      ? "incomplete"
      : legalValid
        ? "verified"
        : "failed";

  // Component scores (0-100). Legal validity dominates the weighting.
  const cIdentity = nibFormatValid ? (companyName ? 100 : 70) : 0;
  const cLegal = legalValid ? 100 : 0;
  const cHs = hsResult?.hs_code ? Math.round(((hsResult.confidence as number) ?? 0.85) * 100) : 0;
  const cProduct = hasProduct ? 100 : 0;
  const totalScore = Math.round(cLegal * 0.45 + cIdentity * 0.2 + cHs * 0.15 + cProduct * 0.2);

  // Readiness level derived from the SAME score, so the dashboard badge stays
  // consistent with this page's verdict.
  const profileLevel: "ready" | "partial" | "not_ready" =
    verdict === "verified"
      ? totalScore >= 80
        ? "ready"
        : "partial"
      : totalScore >= 50
        ? "partial"
        : "not_ready";

  // Single source of truth: persist the exact score + level shown here so the
  // dashboard's "Skor Kesiapan" renders the same value instead of computing a
  // second, divergent number (or falling back to a hard-coded default).
  useEffect(() => {
    if (!isComplete || typeof window === "undefined") return;
    localStorage.setItem("tradeconnect_verified_score", String(totalScore));
    localStorage.setItem("tradeconnect_verified_level", profileLevel);
  }, [isComplete, totalScore, profileLevel]);

  // Count-up to the real score once results are revealed.
  useEffect(() => {
    if (!isComplete) return;
    let current = 0;
    const target = totalScore;
    if (target <= 0) {
      setScore(0);
      return;
    }
    const interval = setInterval(() => {
      current += 1;
      setScore(current);
      if (current >= target) clearInterval(interval);
    }, 14);
    return () => clearInterval(interval);
  }, [isComplete, totalScore]);

  // Entity type strictly from the validated OSS business name.
  const businessName = nibResult?.business_name || "";
  const entityType = (): string => {
    if (!legalValid) return "Belum tervalidasi";
    const src = (businessName || companyName).trim().toUpperCase();
    if (src.startsWith("PT")) return "PT (Perseroan Terbatas)";
    if (src.startsWith("CV")) return "CV (Persekutuan Komanditer)";
    if (src.startsWith("UD")) return "UD (Usaha Dagang)";
    if (src.startsWith("PD")) return "PD (Perusahaan Dagang)";
    if (src.startsWith("KOPERASI")) return "Koperasi";
    return "Badan Usaha Terdaftar";
  };

  const scaleText = nibResult?.business_scale || (legalValid ? "Tidak tersedia" : "Belum tervalidasi");
  const kbliText = nibResult?.kbli
    ? `${nibResult.kbli}${nibResult.kbli_description ? ` (${nibResult.kbli_description})` : ""}`
    : legalValid
      ? "Tidak tersedia"
      : "Belum tervalidasi";

  // ── Loading screen ──────────────────────────────────────────────────────────
  if (!isComplete) {
    return (
      <main className="w-full max-w-[1440px] mx-auto px-4 md:px-8 py-12 flex flex-col items-center justify-center min-h-screen bg-background">
        <div className="w-full max-w-md bg-surface-container-lowest border border-outline-variant rounded-xl p-8 shadow-sm flex flex-col items-center text-center">
          <div className="relative w-20 h-20 mb-6 flex items-center justify-center">
            <div className="absolute inset-0 border-4 border-surface-variant rounded-full"></div>
            <div className="absolute inset-0 border-4 border-primary rounded-full border-t-transparent animate-spin"></div>
            <ClipboardCheck className="text-primary size-8" />
          </div>
          <h2 className="text-xl font-bold text-primary mb-2">Menganalisis Profil Institusi</h2>
          <p className="text-sm text-on-surface-variant mb-8">
            Memvalidasi NIB Anda secara langsung ke OSS RBA (Kementerian Investasi)…
          </p>
          <div className="w-full flex flex-col gap-4 text-left">
            {[
              "Menghubungkan ke OSS RBA / INSW",
              "Klasifikasi NLP untuk Pemetaan HS Code",
              "Menghitung Skor Profil Terverifikasi",
            ].map((label, i) => (
              <div key={label} className={`flex items-center gap-4 transition-opacity duration-500 ${loadingStep >= i ? "opacity-100" : "opacity-30"}`}>
                <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${loadingStep >= i + 1 ? "bg-secondary text-on-secondary" : "bg-surface-variant animate-pulse"}`}>
                  {loadingStep >= i + 1 ? <Check className="size-3.5" /> : <span className="w-2 h-2 bg-on-surface-variant rounded-full"></span>}
                </div>
                <span className="text-sm font-medium text-on-surface">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </main>
    );
  }

  // ── Result header theme per verdict ─────────────────────────────────────────
  const header =
    verdict === "verified"
      ? { bg: "bg-primary", icon: <BadgeCheck className="text-on-secondary size-8" />, iconBg: "bg-secondary", title: "Verifikasi Berhasil", sub: "Profil institusi Anda aktif dan tervalidasi di OSS RBA." }
      : verdict === "failed"
        ? { bg: "bg-error", icon: <XCircle className="text-error size-8" />, iconBg: "bg-on-error", title: "Verifikasi Gagal", sub: `NIB ${nibDigits || "-"} tidak ditemukan atau tidak valid di OSS RBA.` }
        : { bg: "bg-tertiary", icon: <AlertTriangle className="text-on-tertiary-container size-8" />, iconBg: "bg-tertiary-container", title: "Data Belum Lengkap", sub: !nibFormatValid ? "NIB harus terdiri dari tepat 13 digit angka yang valid." : "Layanan verifikasi OSS tidak dapat dijangkau. Coba lagi." };

  const scoreColor = verdict === "verified" ? "text-secondary" : verdict === "failed" ? "text-error" : "text-tertiary";

  return (
    <main className="w-full max-w-[1440px] mx-auto px-4 md:px-8 py-12 flex flex-col items-center justify-center min-h-screen bg-background">
      <div className="w-full max-w-3xl bg-surface-container-lowest border border-outline-variant rounded-xl shadow-sm overflow-hidden animate-in zoom-in-95 duration-500">
        {/* Verdict header */}
        <div className={`${header.bg} p-6 md:p-8 text-center text-on-primary flex flex-col items-center relative overflow-hidden`}>
          <div className={`w-16 h-16 ${header.iconBg} rounded-full flex items-center justify-center mb-4 shadow-lg z-10 border-4 border-on-primary/20`}>
            {header.icon}
          </div>
          <h1 className="text-2xl md:text-3xl font-bold mb-2 z-10 font-heading">{header.title}</h1>
          <p className="text-sm z-10 opacity-90">{header.sub}</p>
        </div>

        <div className="p-6 md:p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Legal & product */}
          <div className="flex flex-col gap-4">
            <div className="bg-surface p-4 rounded-lg border border-outline-variant">
              <div className="flex items-center gap-2 mb-3">
                <Gavel className="text-secondary size-5" />
                <h3 className="text-base font-semibold text-on-surface">Validasi OSS RBA</h3>
              </div>
              <div className="grid grid-cols-2 gap-y-3 text-xs md:text-sm">
                <div className="text-on-surface-variant">Status NIB</div>
                {verdict === "verified" ? (
                  <div className="font-medium text-secondary flex items-center gap-1">
                    <CheckCircle2 className="size-3.5" /> Aktif &amp; Valid
                    {nibResult?.sandbox_mode && <span className="text-[10px] text-on-surface-variant">(sandbox)</span>}
                  </div>
                ) : verdict === "failed" ? (
                  <div className="font-medium text-error flex items-center gap-1">
                    <XCircle className="size-3.5" /> Tidak Valid / Tidak Ditemukan
                  </div>
                ) : (
                  <div className="font-medium text-tertiary flex items-center gap-1">
                    <AlertTriangle className="size-3.5" /> {!nibFormatValid ? "Format NIB salah" : "Tidak dapat diverifikasi"}
                  </div>
                )}

                <div className="text-on-surface-variant">Nama Terdaftar</div>
                <div className="font-medium text-on-surface truncate" title={businessName || companyName}>
                  {legalValid ? businessName || companyName || "—" : "Belum tervalidasi"}
                </div>

                <div className="text-on-surface-variant">Jenis Entitas</div>
                <div className="font-medium text-on-surface">{entityType()}</div>

                <div className="text-on-surface-variant">Skala Usaha</div>
                <div className="font-medium text-on-surface">{scaleText}</div>

                <div className="text-on-surface-variant">Kesesuaian KBLI</div>
                <div className="font-medium text-on-surface">{kbliText}</div>
              </div>
            </div>

            <div className="bg-surface p-4 rounded-lg border border-outline-variant">
              <div className="flex items-center gap-2 mb-3">
                <Tag className="text-primary size-5" />
                <h3 className="text-base font-semibold text-on-surface">Pemetaan HS Code AI</h3>
              </div>
              <p className="text-xs text-on-surface-variant mb-3">
                Klasifikasi AI untuk deskripsi produk {productName ? <>&ldquo;{productName}&rdquo;</> : "Anda"}:
              </p>
              <div className="bg-surface-variant p-3 rounded-md border border-outline-variant">
                {hsResult?.hs_code ? (
                  <>
                    <div className="text-xl font-mono-data font-bold text-primary tracking-widest mb-1">{hsResult.hs_code}</div>
                    <div className="text-xs font-medium text-on-surface">{hsResult.description || "Kode HS hasil klasifikasi AI"}</div>
                    <div className="mt-2 pt-2 border-t border-outline-variant flex items-center gap-1 text-[11px] text-secondary font-medium">
                      <TrendingUp className="size-3.5" />
                      {hsResult.confidence != null
                        ? `Keyakinan klasifikasi AI ${Math.round((hsResult.confidence as number) * 100)}%`
                        : "Terklasifikasi oleh model AI"}
                    </div>
                  </>
                ) : (
                  <div className="text-xs font-medium text-on-surface-variant py-2">
                    {hsChecked ? "Klasifikasi HS tidak tersedia (layanan AI tidak dapat dijangkau)." : "Mengklasifikasikan HS Code…"}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Score + breakdown */}
          <div className="flex flex-col gap-4">
            <div className="bg-surface p-4 rounded-lg border border-outline-variant h-full flex flex-col">
              <div className="flex items-center gap-2 mb-4">
                <Award className="text-primary size-5" />
                <h3 className="text-base font-semibold text-on-surface">Skor Profil Terverifikasi</h3>
              </div>
              <div className="flex-1 flex flex-col items-center justify-center">
                <ProgressRing value={score} size={128} strokeWidth={10} className="mb-4">
                  <div className="flex flex-col items-center justify-center">
                    <span className={`text-4xl font-bold ${scoreColor}`}>{score}</span>
                    <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mt-1">dari 100</span>
                  </div>
                </ProgressRing>
                <p className="text-center text-xs text-on-surface-variant px-2">
                  {verdict === "verified"
                    ? "Profil tervalidasi. Skor ini membuka akses ke pembeli global & prioritas pencocokan AI."
                    : verdict === "failed"
                      ? "NIB tidak valid. Perbaiki nomor NIB agar profil dapat diverifikasi dan skor meningkat."
                      : "Lengkapi data wajib (NIB 13 digit) untuk menyelesaikan verifikasi."}
                </p>

                {/* Real component breakdown */}
                <div className="w-full mt-4 space-y-2">
                  {[
                    { label: "Legalitas NIB (OSS)", value: cLegal },
                    { label: "Kelengkapan Identitas", value: cIdentity },
                    { label: "Klasifikasi HS Code", value: cHs },
                    { label: "Kelengkapan Produk", value: cProduct },
                  ].map((row) => (
                    <div key={row.label}>
                      <div className="flex justify-between text-[11px] text-on-surface-variant">
                        <span>{row.label}</span>
                        <span className={`font-medium ${row.value >= 60 ? "text-secondary" : row.value > 0 ? "text-tertiary" : "text-error"}`}>{row.value}%</span>
                      </div>
                      <div className="w-full h-1 bg-surface-variant rounded-full overflow-hidden">
                        <div className={`h-full ${row.value >= 60 ? "bg-secondary" : row.value > 0 ? "bg-tertiary" : "bg-error"}`} style={{ width: `${row.value}%` }}></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="bg-surface-container-low p-4 md:p-6 border-t border-outline-variant flex justify-end gap-3">
          {verdict !== "verified" ? (
            <button
              onClick={() => router.push("/")}
              className="px-6 py-2.5 text-xs font-medium bg-primary text-on-primary hover:bg-surface-tint rounded-md transition-colors flex items-center gap-2 shadow-sm"
            >
              <RotateCcw className="size-4" />
              Perbaiki Data Pendaftaran
            </button>
          ) : (
            <>
              <button
                onClick={() => router.push("/")}
                className="px-4 py-2.5 text-xs font-medium text-primary hover:bg-surface rounded-md transition-colors"
              >
                Tinjau Data
              </button>
              <button
                onClick={() => router.push("/dashboard")}
                className="px-6 py-2.5 text-xs font-medium bg-primary text-on-primary hover:bg-surface-tint rounded-md transition-colors flex items-center gap-2 shadow-sm"
              >
                Masuk ke Dasbor Eksportir
                <ArrowRight className="size-4" />
              </button>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
