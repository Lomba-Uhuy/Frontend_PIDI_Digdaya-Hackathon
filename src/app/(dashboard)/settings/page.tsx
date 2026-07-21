"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  SlidersHorizontal,
  Building2,
  Rocket,
  ShieldCheck,
  HelpCircle,
  BadgeCheck,
  Check,
  Sun,
  Moon,
  Laptop,
  LifeBuoy,
  BookOpen,
  MessageSquare,
  Activity,
  Sparkles,
  ArrowUpRight,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { getStoredTheme, setTheme, type Theme } from "@/lib/theme";
import { getMyUmkm, updateUmkm, updateProduct, getStoredIds } from "@/lib/entities";
import { useProductView, useAppData } from "@/lib/app-data";

const TABS = [
  { id: "umum", label: "Umum", icon: SlidersHorizontal },
  { id: "akun", label: "Akun", icon: Building2 },
  { id: "privasi", label: "Privasi & Keamanan", icon: ShieldCheck },
  { id: "bantuan", label: "Bantuan", icon: HelpCircle },
] as const;

type TabId = (typeof TABS)[number]["id"];

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<TabId>("umum");
  const [companyName, setCompanyName] = useState("");
  const [productName, setProductName] = useState("");
  const [saved, setSaved] = useState(false);
  const [theme, setThemeState] = useState<Theme>("system");

  const product = useProductView();
  const { refresh } = useAppData();
  useEffect(() => {
    // Company + product come from the backend-sourced view (single source of truth).
    if (product.companyName) setCompanyName(product.companyName);
    if (product.name) setProductName(product.name);
    setThemeState(getStoredTheme());

    const hash = window.location.hash.replace("#", "");
    if (TABS.some((t) => t.id === hash)) setActiveTab(hash as TabId);
  }, [product]);

  const handleThemeChange = (next: Theme) => {
    setThemeState(next);
    setTheme(next);
  };

  const handleSaveProfile = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);

    // Persist to the backend (authoritative), then refresh the shared view so every
    // screen reflects the change. No localStorage product model.
    const { umkmId, productId } = getStoredIds();
    const tasks: Promise<unknown>[] = [];
    if (umkmId) tasks.push(updateUmkm(umkmId, { legalName: companyName }));
    if (umkmId && productId) tasks.push(updateProduct(umkmId, productId, { name: productName }));
    void Promise.all(tasks).then(() => {
      void refresh();
      window.dispatchEvent(new Event("tradeconnect_state_change"));
    });
  };

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto w-full max-w-5xl px-4 py-8 md:px-8">
        {/* Page header */}
        <div className="mb-6">
          <h1 className="font-heading text-2xl font-black text-on-surface md:text-3xl">Pengaturan</h1>
          <p className="mt-1 text-sm text-on-surface-variant">
            Kelola profil perusahaan, langganan, privasi, dan bantuan Anda.
          </p>
        </div>

        <div className="flex flex-col gap-6 md:flex-row">
          {/* Tab rail */}
          <nav className="flex gap-1 overflow-x-auto md:w-56 md:flex-col md:overflow-visible">
            <TabButton tab={TABS[0]} activeTab={activeTab} onSelect={setActiveTab} />
            <TabButton tab={TABS[1]} activeTab={activeTab} onSelect={setActiveTab} />

            {/* Upgrade — navigates to the dedicated showcase page */}
            <Link
              href="/upgrade"
              className="flex shrink-0 items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-semibold text-primary transition-all hover:bg-primary/10 md:w-full cursor-pointer"
            >
              <Rocket className="size-[18px] shrink-0" strokeWidth={2.25} />
              <span className="whitespace-nowrap">Upgrade Paket</span>
              <ArrowUpRight className="ml-auto hidden size-4 text-primary/60 md:block" />
            </Link>

            <TabButton tab={TABS[2]} activeTab={activeTab} onSelect={setActiveTab} />
            <TabButton tab={TABS[3]} activeTab={activeTab} onSelect={setActiveTab} />
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
                    <div className="flex flex-wrap gap-2">
                      <ThemeOption
                        icon={Sun}
                        label="Terang"
                        active={theme === "light"}
                        onClick={() => handleThemeChange("light")}
                      />
                      <ThemeOption
                        icon={Moon}
                        label="Gelap"
                        active={theme === "dark"}
                        onClick={() => handleThemeChange("dark")}
                      />
                      <ThemeOption
                        icon={Laptop}
                        label="Sistem"
                        active={theme === "system"}
                        onClick={() => handleThemeChange("system")}
                      />
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

            {activeTab === "privasi" && (
              <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-outline-variant bg-surface-container-low py-20 text-center">
                <ShieldCheck className="size-10 text-on-surface-variant/40" strokeWidth={1.75} />
                <p className="mt-3 text-sm font-semibold text-on-surface">Pengaturan Privasi & Keamanan</p>
                <p className="mt-1 max-w-xs text-xs text-on-surface-variant">
                  Kontrol keamanan akun dan visibilitas data sedang kami siapkan. Segera hadir.
                </p>
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

function TabButton({
  tab,
  activeTab,
  onSelect,
}: {
  tab: (typeof TABS)[number];
  activeTab: TabId;
  onSelect: (id: TabId) => void;
}) {
  const Icon = tab.icon;
  const isActive = activeTab === tab.id;
  return (
    <button
      type="button"
      onClick={() => onSelect(tab.id)}
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

function ThemeOption({
  icon: Icon,
  label,
  active,
  onClick,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-semibold transition-colors cursor-pointer",
        active
          ? "border-primary bg-primary text-on-primary"
          : "border-outline-variant font-medium text-on-surface-variant hover:bg-surface-container-high"
      )}
    >
      <Icon className="size-4" /> {label}
    </button>
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
