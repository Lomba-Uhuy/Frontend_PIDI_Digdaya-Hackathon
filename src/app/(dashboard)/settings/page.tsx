"use client";

import { useEffect, useState } from "react";
import {
  SlidersHorizontal,
  Building2,
  CreditCard,
  ShieldCheck,
  HelpCircle,
  BadgeCheck,
  Check,
  Sun,
  Moon,
  LifeBuoy,
  BookOpen,
  MessageSquare,
  Activity,
  Sparkles,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { PricingTiers } from "@/components/ui/pricing-tiers";
import { getPlan, getPlanInfo, type Plan } from "@/lib/plan";

const TABS = [
  { id: "umum", label: "Umum", icon: SlidersHorizontal },
  { id: "akun", label: "Akun", icon: Building2 },
  { id: "tagihan", label: "Tagihan & Paket", icon: CreditCard },
  { id: "privasi", label: "Privasi & Keamanan", icon: ShieldCheck },
  { id: "bantuan", label: "Bantuan", icon: HelpCircle },
] as const;

type TabId = (typeof TABS)[number]["id"];

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<TabId>("umum");
  const [companyName, setCompanyName] = useState("CV Kopi Mandiri");
  const [productName, setProductName] = useState("Kopi Arabika");
  const [plan, setPlanState] = useState<Plan>("free");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const savedCompany = localStorage.getItem("tradeconnect_company_name");
    if (savedCompany) setCompanyName(savedCompany);
    const savedProduct = localStorage.getItem("tradeconnect_product_name");
    if (savedProduct) setProductName(savedProduct);
    setPlanState(getPlan());

    const hash = window.location.hash.replace("#", "");
    if (TABS.some((t) => t.id === hash)) setActiveTab(hash as TabId);

    const syncPlan = () => setPlanState(getPlan());
    window.addEventListener("tradeconnect_plan_change", syncPlan);
    return () => window.removeEventListener("tradeconnect_plan_change", syncPlan);
  }, []);

  const handleSaveProfile = () => {
    localStorage.setItem("tradeconnect_company_name", companyName);
    localStorage.setItem("tradeconnect_product_name", productName);
    window.dispatchEvent(new Event("tradeconnect_state_change"));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const planInfo = getPlanInfo(plan);

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto w-full max-w-5xl px-4 py-8 md:px-8">
        {/* Page header */}
        <div className="mb-6">
          <h1 className="font-heading text-2xl font-black text-on-surface md:text-3xl">Pengaturan</h1>
          <p className="mt-1 text-sm text-on-surface-variant">
            Kelola profil perusahaan, paket langganan, privasi, dan bantuan Anda.
          </p>
        </div>

        <div className="flex flex-col gap-6 md:flex-row">
          {/* Tab rail */}
          <nav className="flex gap-1 overflow-x-auto md:w-56 md:flex-col md:overflow-visible">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "flex shrink-0 items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium transition-all cursor-pointer md:w-full",
                    isActive
                      ? "bg-secondary-container font-semibold text-on-secondary-container"
                      : "text-on-surface-variant hover:bg-surface-container-high"
                  )}
                >
                  <Icon className="size-[18px] shrink-0" strokeWidth={isActive ? 2.5 : 2} />
                  <span className="whitespace-nowrap">{tab.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Content */}
          <div className="min-w-0 flex-1">
            {activeTab === "umum" && (
              <div className="space-y-6">
                <Section title="Profil Perusahaan" description="Informasi ini tampil di dashboard dan dilihat oleh calon pembeli.">
                  <Field label="Nama Perusahaan">
                    <input
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      className="input-base"
                    />
                  </Field>
                  <Field label="Produk Utama">
                    <input
                      value={productName}
                      onChange={(e) => setProductName(e.target.value)}
                      className="input-base"
                    />
                  </Field>
                  <div className="flex items-center gap-3 pt-1">
                    <button
                      type="button"
                      onClick={handleSaveProfile}
                      className="rounded-lg bg-primary px-4 py-2 text-sm font-bold text-on-primary transition-colors hover:bg-primary-hover cursor-pointer"
                    >
                      Simpan Perubahan
                    </button>
                    {saved && (
                      <span className="flex items-center gap-1 text-xs font-semibold text-secondary">
                        <Check className="size-4" strokeWidth={2.5} /> Tersimpan
                      </span>
                    )}
                  </div>
                </Section>

                <Section title="Preferensi" description="Sesuaikan tampilan dan bahasa aplikasi.">
                  <Field label="Bahasa">
                    <select className="input-base cursor-pointer">
                      <option>Bahasa Indonesia</option>
                      <option>English</option>
                    </select>
                  </Field>
                  <Field label="Zona Waktu">
                    <select className="input-base cursor-pointer">
                      <option>WIB (GMT+7) — Jakarta</option>
                      <option>WITA (GMT+8) — Makassar</option>
                      <option>WIT (GMT+9) — Jayapura</option>
                    </select>
                  </Field>
                  <div>
                    <span className="mb-1.5 block text-xs font-bold text-on-surface-variant">Tampilan</span>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        className="flex items-center gap-2 rounded-lg border-2 border-primary bg-primary/5 px-4 py-2 text-sm font-semibold text-primary cursor-pointer"
                      >
                        <Sun className="size-4" /> Terang
                      </button>
                      <button
                        type="button"
                        disabled
                        className="flex items-center gap-2 rounded-lg border border-outline-variant px-4 py-2 text-sm font-medium text-on-surface-variant opacity-60"
                      >
                        <Moon className="size-4" /> Gelap
                        <span className="ml-1 rounded-full bg-surface-container-high px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide">
                          Segera
                        </span>
                      </button>
                    </div>
                  </div>
                </Section>
              </div>
            )}

            {activeTab === "akun" && (
              <div className="space-y-6">
                <Section title="Identitas Perusahaan">
                  <div className="flex items-center gap-4 rounded-xl border border-outline-variant bg-surface-container-low p-4">
                    <div className="flex size-14 shrink-0 items-center justify-center rounded-xl bg-primary text-on-primary">
                      <Building2 className="size-7" strokeWidth={2} />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="truncate font-bold text-on-surface">{companyName}</p>
                        <span className="flex items-center gap-1 rounded-full bg-secondary-container px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-on-secondary-container">
                          <BadgeCheck className="size-3" /> Terverifikasi
                        </span>
                      </div>
                      <p className="text-xs text-on-surface-variant">Eksportir Pemula · Indonesia</p>
                    </div>
                  </div>
                  <Field label="Nomor Induk Berusaha (NIB)">
                    <input value="1234-5678-9012-3456" readOnly className="input-base bg-surface-container-low text-on-surface-variant" />
                  </Field>
                  <Field label="Email Perusahaan">
                    <input type="email" defaultValue="ekspor@kopimandiri.co.id" className="input-base" />
                  </Field>
                  <Field label="Nomor Telepon">
                    <input type="tel" defaultValue="+62 812 3456 7890" className="input-base" />
                  </Field>
                  <Field label="Alamat">
                    <input defaultValue="Jl. Merdeka No. 12, Bandung, Jawa Barat" className="input-base" />
                  </Field>
                </Section>

                <Section title="Zona Berbahaya" tone="danger" description="Tindakan berikut bersifat permanen dan tidak dapat dibatalkan.">
                  <button
                    type="button"
                    className="rounded-lg border border-error/40 px-4 py-2 text-sm font-bold text-error transition-colors hover:bg-error-container cursor-pointer"
                  >
                    Nonaktifkan Akun
                  </button>
                </Section>
              </div>
            )}

            {activeTab === "tagihan" && (
              <div className="space-y-6">
                {/* Current plan banner */}
                <div className="flex flex-col gap-3 rounded-xl border border-outline-variant bg-surface-container-low p-5 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">Paket Anda saat ini</p>
                    <p className="mt-1 font-heading text-2xl font-black text-on-surface">{planInfo.name}</p>
                    <p className="mt-0.5 text-xs text-on-surface-variant">
                      Komisi transaksi {planInfo.commission} per deal · {planInfo.target}
                    </p>
                  </div>
                  <div className="flex size-12 items-center justify-center rounded-xl bg-primary text-on-primary">
                    <CreditCard className="size-6" />
                  </div>
                </div>

                <div>
                  <h2 className="font-heading text-lg font-black text-on-surface">Pilih paket yang tepat untuk Anda</h2>
                  <p className="mt-1 text-sm text-on-surface-variant">
                    Naik kelas kapan saja. Semakin tinggi paket, semakin rendah komisi transaksi Anda.
                  </p>
                </div>

                <PricingTiers />

                <div className="flex items-start gap-3 rounded-xl border border-secondary/30 bg-secondary-container/40 p-4">
                  <BadgeCheck className="mt-0.5 size-5 shrink-0 text-secondary" />
                  <p className="text-xs leading-relaxed text-on-surface">
                    <span className="font-bold">Model komisi berbasis keberhasilan.</span> Anda hanya membayar komisi saat
                    transaksi ekspor berhasil dikonfirmasi — tanpa biaya di muka. Barrier masuk serendah mungkin untuk UMKM
                    yang baru pertama kali ekspor.
                  </p>
                </div>
              </div>
            )}

            {activeTab === "privasi" && (
              <div className="space-y-6">
                <Section title="Keamanan" description="Lindungi akun perusahaan Anda.">
                  <ToggleRow label="Autentikasi dua faktor (2FA)" description="Wajib kode verifikasi saat login dari perangkat baru." defaultOn />
                  <ToggleRow label="Notifikasi email transaksi" description="Terima ringkasan aktivitas deal via email." defaultOn />
                </Section>
                <Section title="Data & Visibilitas" description="Kontrol bagaimana data Anda digunakan.">
                  <ToggleRow label="Tampilkan profil ke pembeli global" description="Perusahaan Anda dapat ditemukan di pencarian pembeli." defaultOn />
                  <ToggleRow label="Bagi hasil data (opt-in)" description="Izinkan data agregat anonim untuk riset pasar — tersedia bagi hasil pada paket Scale." />
                </Section>
              </div>
            )}

            {activeTab === "bantuan" && (
              <div className="space-y-6">
                <Section title="Pusat Bantuan" description="Butuh bantuan? Mulai dari sini.">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <HelpCard icon={BookOpen} title="Panduan Ekspor Pemula" description="Langkah demi langkah ekspor perdana Anda." />
                    <HelpCard icon={MessageSquare} title="Hubungi Dukungan" description="Tim kami siap membantu 2×24 jam." />
                    <HelpCard icon={LifeBuoy} title="Pertanyaan Umum (FAQ)" description="Jawaban cepat untuk pertanyaan populer." />
                    <HelpCard icon={Activity} title="Status Layanan" description="Semua sistem beroperasi normal." />
                  </div>
                </Section>
                <div className="flex items-start gap-3 rounded-xl border border-outline-variant bg-surface-container-low p-4">
                  <Sparkles className="mt-0.5 size-5 shrink-0 text-primary" />
                  <p className="text-xs leading-relaxed text-on-surface-variant">
                    Ingin mengulang tutorial interaktif? Buka menu profil di pojok kanan atas, lalu pilih{" "}
                    <span className="font-bold text-on-surface">Lihat Tutorial</span>.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Section({
  title,
  description,
  tone,
  children,
}: {
  title: string;
  description?: string;
  tone?: "danger";
  children: React.ReactNode;
}) {
  return (
    <section
      className={cn(
        "rounded-xl border bg-surface-container-lowest p-5 shadow-sm",
        tone === "danger" ? "border-error/30" : "border-outline-variant"
      )}
    >
      <h2
        className={cn(
          "font-heading text-base font-black",
          tone === "danger" ? "text-error" : "text-on-surface"
        )}
      >
        {title}
      </h2>
      {description && <p className="mt-0.5 text-xs text-on-surface-variant">{description}</p>}
      <div className="mt-4 space-y-4">{children}</div>
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-bold text-on-surface-variant">{label}</span>
      {children}
    </label>
  );
}

function ToggleRow({
  label,
  description,
  defaultOn,
}: {
  label: string;
  description: string;
  defaultOn?: boolean;
}) {
  const [on, setOn] = useState(!!defaultOn);
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="min-w-0">
        <p className="text-sm font-semibold text-on-surface">{label}</p>
        <p className="text-xs text-on-surface-variant">{description}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={on}
        aria-label={label}
        onClick={() => setOn((v) => !v)}
        className={cn(
          "relative mt-0.5 h-6 w-11 shrink-0 rounded-full transition-colors cursor-pointer",
          on ? "bg-secondary" : "bg-surface-container-highest"
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 size-5 rounded-full bg-surface-container-lowest shadow-sm transition-all",
            on ? "left-[22px]" : "left-0.5"
          )}
        />
      </button>
    </div>
  );
}

function HelpCard({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
}) {
  return (
    <button
      type="button"
      className="flex items-start gap-3 rounded-xl border border-outline-variant bg-surface-container-low p-4 text-left transition-all hover:border-primary/40 hover:bg-surface-container-high cursor-pointer"
    >
      <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
        <Icon className="size-[18px]" />
      </div>
      <div className="min-w-0">
        <p className="text-sm font-bold text-on-surface">{title}</p>
        <p className="text-xs text-on-surface-variant">{description}</p>
      </div>
    </button>
  );
}
