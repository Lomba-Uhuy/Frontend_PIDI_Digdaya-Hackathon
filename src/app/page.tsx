"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  ArrowRight, BarChart3, CheckCircle2, ChevronDown, ClipboardCheck, Compass,
  FileText, Globe, Loader2, Lightbulb, Package, ShieldCheck, Sparkles, Users,
} from "lucide-react";
import { hasSession } from "../lib/auth";
import { getPlanCatalogue, postAuthRedirect, type PlanCatalogueItem } from "../lib/entitlements";
import { Logo } from "../components/ui/logo";

// ── Lightweight fade-in-up on scroll (200–500ms, subtle) ─────────────────────
function Reveal({ children, className = "", delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setShown(true); io.disconnect(); } },
      { threshold: 0.12 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <div ref={ref} style={{ transitionDelay: `${delay}ms` }}
      className={`transition-all duration-500 ease-out ${shown ? "opacity-100 translate-y-0" : "opacity-0 translate-y-5"} ${className}`}>
      {children}
    </div>
  );
}

const TRUST = [
  "Dirancang untuk UMKM Indonesia",
  "Fokus pada persiapan ekspor",
  "Alur bisnis yang terintegrasi",
  "Pengelolaan data yang aman",
  "Wawasan bisnis yang profesional",
];

const CHALLENGES = [
  { pain: "“Saya tidak tahu harus mulai ekspor dari mana.”", fix: "Panduan langkah demi langkah menuntun Anda dari awal hingga siap ekspor." },
  { pain: "“Saya tidak tahu negara mana yang membutuhkan produk saya.”", fix: "Wawasan pasar menunjukkan peluang di berbagai negara tujuan." },
  { pain: "“Saya kesulitan menyiapkan dokumen ekspor.”", fix: "Dokumen bisnis penting Anda tertata rapi dalam satu tempat." },
  { pain: "“Saya tidak yakin produk saya sudah siap ekspor.”", fix: "Penilaian produk membantu Anda memahami kesiapan ekspor dengan jelas." },
  { pain: "“Saya tidak tahu cara menemukan pembeli luar negeri.”", fix: "Temukan peluang bisnis internasional yang relevan dengan produk Anda." },
];

const FEATURES = [
  { icon: ClipboardCheck, title: "Penilaian Produk", body: "Pahami tingkat kesiapan ekspor produk Anda secara jelas dan terukur." },
  { icon: Users, title: "Temukan Pembeli", body: "Jelajahi peluang bisnis internasional yang potensial untuk produk Anda." },
  { icon: Compass, title: "Wawasan Pasar", body: "Kenali peluang ekspor di berbagai pasar dan negara tujuan." },
  { icon: Lightbulb, title: "Konsultasi Bisnis", body: "Dapatkan rekomendasi cerdas untuk mendukung keputusan ekspor Anda." },
  { icon: FileText, title: "Bantuan Dokumen", body: "Kelola dan rapikan dokumen bisnis penting dalam satu platform." },
  { icon: BarChart3, title: "Dasbor Bisnis", body: "Pantau kemajuan persiapan ekspor Anda dari satu tampilan terpusat." },
];

const STEPS = [
  { icon: ShieldCheck, title: "Daftar", body: "Buat akun secara gratis dalam hitungan menit." },
  { icon: Globe, title: "Lengkapi Profil Bisnis", body: "Isi informasi perusahaan Anda." },
  { icon: Package, title: "Tambahkan Produk", body: "Masukkan produk yang ingin Anda ekspor." },
  { icon: Sparkles, title: "Terima Wawasan", body: "Dapatkan rekomendasi personal untuk bisnis Anda." },
  { icon: Compass, title: "Jelajahi Peluang", body: "Mulai temukan peluang pasar internasional." },
];

const WHY = [
  "Semua dalam satu platform",
  "Dirancang khusus untuk UMKM Indonesia",
  "Mudah digunakan",
  "Dipandu langkah demi langkah",
  "Wawasan berorientasi bisnis",
  "Aman dan tertata",
  "Tumbuh seiring bisnis Anda",
];

const FAQ = [
  { q: "Untuk siapa platform ini?", a: "Untuk pelaku UMKM Indonesia yang ingin menyiapkan produknya menuju pasar internasional — baik yang baru memulai maupun yang sudah berjalan." },
  { q: "Apakah saya perlu pengalaman ekspor?", a: "Tidak. Platform ini memandu Anda langkah demi langkah, sehingga Anda tetap percaya diri meski baru pertama kali." },
  { q: "Bisakah saya mengelola beberapa produk?", a: "Ya. Anda dapat menambah dan mengelola beberapa produk sesuai kebutuhan bisnis Anda." },
  { q: "Apakah saya bisa upgrade nanti?", a: "Tentu. Anda bisa mulai gratis dan meningkatkan paket kapan saja saat bisnis Anda berkembang." },
  { q: "Bagaimana cara memulai?", a: "Daftar gratis, lengkapi profil bisnis, tambahkan produk pertama Anda — dan Anda akan langsung menerima wawasan." },
];

const PLAN_TAGLINE: Record<string, string> = {
  free: "Mulai persiapan ekspor Anda tanpa biaya.",
  premium: "Buka seluruh potensi ekspor bisnis Anda.",
  enterprise: "Solusi khusus untuk kebutuhan skala besar.",
};

export default function LandingPage() {
  const router = useRouter();
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [plans, setPlans] = useState<PlanCatalogueItem[]>([]);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  useEffect(() => {
    const s = hasSession();
    setAuthed(s);
    if (s) { router.replace(postAuthRedirect()); return; } // admins → admin platform
    getPlanCatalogue().then(setPlans);
  }, [router]);

  if (authed === null || authed) {
    return <div className="h-screen w-full flex items-center justify-center bg-background text-on-surface-variant"><Loader2 className="size-6 animate-spin text-primary" /></div>;
  }

  // Plain-language plan value (dynamic from backend quotas — no technical labels).
  const planHighlights = (p: PlanCatalogueItem): string[] => {
    const q = p.quotas ?? {};
    const cap = (v: number | null | undefined, unit: string, plural: string) =>
      v == null ? `${plural} tak terbatas` : `${v.toLocaleString("id-ID")} ${unit}`;
    return [
      cap(q.products, "produk", "Produk"),
      cap(q.ai_consultations, "konsultasi bisnis / bulan", "Konsultasi bisnis"),
      cap(q.buyer_matches, "peluang pembeli / bulan", "Peluang pembeli"),
      "Wawasan pasar & dasbor bisnis",
    ];
  };

  return (
    <main className="min-h-screen bg-background text-on-surface antialiased">
      {/* NAV */}
      <header className="sticky top-0 z-30 border-b border-outline-variant/50 bg-background/70 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-5 md:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-semibold text-lg tracking-tight">
            <Logo size={34} priority /> TradeConnect
          </Link>
          <nav className="hidden md:flex items-center gap-8 text-sm text-on-surface-variant">
            <a href="#features" className="hover:text-on-surface transition-colors">Fitur</a>
            <a href="#how" className="hover:text-on-surface transition-colors">Cara Kerja</a>
            <a href="#pricing" className="hover:text-on-surface transition-colors">Harga</a>
            <a href="#faq" className="hover:text-on-surface transition-colors">FAQ</a>
          </nav>
          <div className="flex items-center gap-2">
            <Link href="/login" className="px-3.5 py-2 text-sm font-medium hover:bg-surface-container rounded-full transition-colors">Masuk</Link>
            <Link href="/login?mode=register" className="px-4 py-2 text-sm font-semibold bg-primary text-on-primary rounded-full hover:shadow-md hover:shadow-primary/20 transition-all inline-flex items-center gap-1.5">Mulai Gratis</Link>
          </div>
        </div>
      </header>

      {/* HERO */}
      <section className="max-w-6xl mx-auto px-5 md:px-8 pt-16 md:pt-28 pb-16">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <Reveal>
            <div className="inline-flex items-center gap-2 rounded-full border border-outline-variant bg-surface-container-low px-3 py-1 text-xs text-on-surface-variant mb-6">
              <Sparkles className="size-3.5 text-primary" /> Platform ekspor untuk UMKM Indonesia
            </div>
            <h1 className="text-4xl md:text-[56px] font-bold tracking-tight leading-[1.05]">
              Kembangkan Bisnis Anda <span className="text-primary">ke Pasar Internasional.</span>
            </h1>
            <p className="mt-6 text-base md:text-lg text-on-surface-variant max-w-lg leading-relaxed">
              Bantu UMKM Indonesia menyiapkan produk, menemukan peluang internasional, mengelola kesiapan ekspor, dan tumbuh dengan percaya diri — semua dalam satu platform terpadu.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row items-start sm:items-center gap-3">
              <Link href="/login?mode=register" className="px-6 py-3 text-sm font-semibold bg-primary text-on-primary rounded-full hover:shadow-lg hover:shadow-primary/20 hover:-translate-y-0.5 transition-all inline-flex items-center gap-2">
                Mulai Gratis <ArrowRight className="size-4" />
              </Link>
              <a href="#how" className="px-6 py-3 text-sm font-semibold border border-outline-variant rounded-full hover:bg-surface-container transition-colors">Lihat Cara Kerjanya</a>
            </div>
          </Reveal>

          {/* Illustration: product → international market */}
          <Reveal delay={120}>
            <div className="relative mx-auto w-full max-w-xl">
              <div className="absolute -inset-3 md:-inset-5 rounded-[2.5rem] bg-gradient-to-br from-primary/5 to-secondary/5 -z-10" />
              <Image
                src="/landingpage.png"
                alt="Ilustrasi UMKM Indonesia menyiapkan produk untuk pasar internasional"
                width={2816}
                height={1536}
                priority
                sizes="(max-width: 768px) 100vw, 576px"
                className="w-full h-auto rounded-2xl shadow-sm animate-[float_7s_ease-in-out_infinite]"
              />
            </div>
          </Reveal>
        </div>
      </section>

      {/* TRUST */}
      <section className="border-y border-outline-variant/50 bg-surface-container-low/40">
        <div className="max-w-6xl mx-auto px-5 md:px-8 py-8">
          <Reveal className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm text-on-surface-variant">
            {TRUST.map((t) => (
              <span key={t} className="inline-flex items-center gap-2"><CheckCircle2 className="size-4 text-secondary" /> {t}</span>
            ))}
          </Reveal>
        </div>
      </section>

      {/* CHALLENGES */}
      <section className="max-w-5xl mx-auto px-5 md:px-8 py-20">
        <Reveal className="text-center">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight">Tantangan yang Sering Dihadapi</h2>
          <p className="mt-3 text-on-surface-variant">Kami mengubah setiap kesulitan menjadi langkah yang jelas.</p>
        </Reveal>
        <div className="mt-12 space-y-4">
          {CHALLENGES.map((c, i) => (
            <Reveal key={c.pain} delay={i * 60}>
              <div className="grid md:grid-cols-2 gap-4 items-center rounded-2xl border border-outline-variant bg-surface-container-lowest p-5 md:p-6 hover:shadow-md transition-all duration-300">
                <p className="text-lg font-medium text-on-surface-variant italic">{c.pain}</p>
                <div className="flex items-start gap-3">
                  <ArrowRight className="size-5 text-primary mt-0.5 shrink-0" />
                  <p className="text-sm md:text-base">{c.fix}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="max-w-6xl mx-auto px-5 md:px-8 py-20">
        <Reveal className="text-center">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight">Semua yang Anda Butuhkan untuk Ekspor</h2>
          <p className="mt-3 text-on-surface-variant max-w-2xl mx-auto">Fokus pada manfaat bisnis nyata, bukan kerumitan teknis.</p>
        </Reveal>
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-5">
          {FEATURES.map((f, i) => (
            <Reveal key={f.title} delay={(i % 3) * 80}>
              <div className="h-full rounded-2xl border border-outline-variant bg-surface-container-lowest p-6 hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
                <div className="size-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-4"><f.icon className="size-5" /></div>
                <h3 className="font-semibold text-lg">{f.title}</h3>
                <p className="text-sm text-on-surface-variant mt-2 leading-relaxed">{f.body}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how" className="bg-surface-container-low/40 border-y border-outline-variant/50">
        <div className="max-w-6xl mx-auto px-5 md:px-8 py-20">
          <Reveal className="text-center">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">Mulai dalam Lima Langkah Sederhana</h2>
          </Reveal>
          <div className="mt-14 grid grid-cols-1 md:grid-cols-5 gap-5">
            {STEPS.map((s, i) => (
              <Reveal key={s.title} delay={i * 90}>
                <div className="relative text-center">
                  <div className="mx-auto size-14 rounded-2xl bg-surface-container-lowest border border-outline-variant shadow-sm flex items-center justify-center text-primary">
                    <s.icon className="size-6" />
                  </div>
                  <div className="mt-1 text-xs font-mono-data text-on-surface-variant/50">Langkah {i + 1}</div>
                  <h3 className="mt-1 font-semibold text-sm">{s.title}</h3>
                  <p className="text-xs text-on-surface-variant mt-1 px-2">{s.body}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* WHY CHOOSE */}
      <section className="max-w-6xl mx-auto px-5 md:px-8 py-20">
        <Reveal className="text-center">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight">Mengapa Memilih Kami</h2>
        </Reveal>
        <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {WHY.map((w, i) => (
            <Reveal key={w} delay={(i % 3) * 70}>
              <div className="flex items-center gap-3 rounded-xl border border-outline-variant bg-surface-container-lowest p-4 hover:shadow-md transition-all duration-300">
                <CheckCircle2 className="size-5 text-secondary shrink-0" />
                <span className="font-medium text-sm">{w}</span>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* PRICING (dynamic, value-focused) */}
      <section id="pricing" className="bg-surface-container-low/40 border-y border-outline-variant/50">
        <div className="max-w-6xl mx-auto px-5 md:px-8 py-20">
          <Reveal className="text-center">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">Harga yang Sederhana</h2>
            <p className="mt-3 text-on-surface-variant">Mulai gratis. Tingkatkan saat bisnis Anda tumbuh.</p>
          </Reveal>
          {plans.length === 0 ? (
            <div className="text-center text-on-surface-variant mt-10 text-sm"><Loader2 className="size-4 animate-spin inline" /> Memuat paket…</div>
          ) : (
            <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-5 items-stretch">
              {plans.map((p, i) => (
                <Reveal key={p.id} delay={i * 90} className="h-full">
                  <div className={`h-full flex flex-col rounded-2xl border p-7 bg-surface-container-lowest transition-all duration-300 ${p.id === "premium" ? "border-primary shadow-lg" : "border-outline-variant hover:shadow-md"}`}>
                    <div className="flex items-center justify-between">
                      <h3 className="text-xl font-bold">{p.label}</h3>
                      {p.comingSoon && <span className="text-[10px] uppercase tracking-wide text-on-surface-variant border border-outline-variant rounded-full px-2 py-0.5">Segera</span>}
                      {p.id === "premium" && <span className="text-[10px] uppercase tracking-wide text-on-primary bg-primary rounded-full px-2 py-0.5">Populer</span>}
                    </div>
                    <p className="text-sm text-on-surface-variant mt-2 min-h-[40px]">{PLAN_TAGLINE[p.id] ?? ""}</p>
                    <ul className="mt-5 space-y-2.5 flex-1">
                      {(p.comingSoon ? ["Fitur khusus sesuai kebutuhan", "Dukungan prioritas", "Skala tanpa batas"] : planHighlights(p)).map((h) => (
                        <li key={h} className="flex items-start gap-2.5 text-sm">
                          <CheckCircle2 className="size-4 text-secondary shrink-0 mt-0.5" /><span>{h}</span>
                        </li>
                      ))}
                    </ul>
                    <Link
                      href={p.comingSoon ? "#" : "/login?mode=register"}
                      aria-disabled={p.comingSoon}
                      className={`mt-7 block text-center px-4 py-2.5 rounded-full text-sm font-semibold transition-all ${
                        p.comingSoon ? "bg-surface-container text-on-surface-variant pointer-events-none" : p.id === "premium" ? "bg-primary text-on-primary hover:shadow-lg hover:shadow-primary/20" : "border border-outline-variant hover:bg-surface-container"
                      }`}
                    >
                      {p.comingSoon ? "Segera Hadir" : p.id === "free" ? "Mulai Gratis" : "Pilih Premium"}
                    </Link>
                  </div>
                </Reveal>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="max-w-3xl mx-auto px-5 md:px-8 py-20">
        <Reveal className="text-center">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight">Pertanyaan Umum</h2>
        </Reveal>
        <Reveal className="mt-12 divide-y divide-outline-variant border-y border-outline-variant">
          {FAQ.map((f, i) => (
            <div key={f.q}>
              <button onClick={() => setOpenFaq(openFaq === i ? null : i)} className="w-full flex items-center justify-between gap-4 py-5 text-left">
                <span className="font-medium">{f.q}</span>
                <ChevronDown className={`size-4 shrink-0 text-on-surface-variant transition-transform duration-300 ${openFaq === i ? "rotate-180" : ""}`} />
              </button>
              <div className={`overflow-hidden transition-all duration-300 ${openFaq === i ? "max-h-40 pb-5" : "max-h-0"}`}>
                <p className="text-sm text-on-surface-variant leading-relaxed">{f.a}</p>
              </div>
            </div>
          ))}
        </Reveal>
      </section>

      {/* FINAL CTA */}
      <section className="max-w-6xl mx-auto px-5 md:px-8 pb-24">
        <Reveal>
          <div className="rounded-[2rem] bg-primary text-on-primary px-6 py-16 text-center overflow-hidden relative">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">Siap Menjangkau Pasar Internasional?</h2>
            <p className="mt-4 opacity-90 max-w-lg mx-auto">Mulai bangun perjalanan ekspor Anda hari ini dengan satu platform terpadu.</p>
            <Link href="/login?mode=register" className="mt-8 inline-flex items-center gap-2 px-7 py-3.5 text-sm font-semibold bg-on-primary text-primary rounded-full hover:-translate-y-0.5 hover:shadow-lg transition-all">
              Mulai Gratis <ArrowRight className="size-4" />
            </Link>
          </div>
        </Reveal>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-outline-variant/50">
        <div className="max-w-6xl mx-auto px-5 md:px-8 py-10 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-on-surface-variant">
          <div className="flex items-center gap-2 font-semibold text-on-surface"><Logo size={26} /> TradeConnect</div>
          <nav className="flex items-center gap-6">
            <a href="#features" className="hover:text-on-surface transition-colors">Fitur</a>
            <a href="#pricing" className="hover:text-on-surface transition-colors">Harga</a>
            <a href="#faq" className="hover:text-on-surface transition-colors">FAQ</a>
            <Link href="/login" className="hover:text-on-surface transition-colors">Masuk</Link>
          </nav>
          <span className="text-xs">© {new Date().getFullYear()} TradeConnect · Untuk UMKM Indonesia</span>
        </div>
      </footer>
    </main>
  );
}
