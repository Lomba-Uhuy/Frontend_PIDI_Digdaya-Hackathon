"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowLeft, Anchor, BadgeCheck } from "lucide-react";

import { PricingTiers } from "@/components/ui/pricing-tiers";
import { getPlan, getPlanInfo, type Plan } from "@/lib/plan";

export default function UpgradePage() {
  const router = useRouter();
  const [plan, setPlan] = useState<Plan>("free");

  useEffect(() => {
    setPlan(getPlan());
    const sync = () => setPlan(getPlan());
    window.addEventListener("tradeconnect_plan_change", sync);
    return () => window.removeEventListener("tradeconnect_plan_change", sync);
  }, []);

  return (
    <div className="min-h-dvh bg-surface text-on-surface">
      {/* Top bar */}
      <header className="sticky top-0 z-10 flex items-center justify-between border-b border-outline-variant bg-surface/80 px-4 py-3 backdrop-blur md:px-8">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-on-surface-variant transition-colors hover:bg-surface-container-high hover:text-on-surface cursor-pointer"
        >
          <ArrowLeft className="size-4" /> Kembali
        </button>
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-on-primary">
            <Anchor className="size-4" strokeWidth={2.25} />
          </div>
          <span className="font-heading text-lg font-black text-primary">TradeConnect</span>
        </Link>
      </header>

      <main className="mx-auto w-full max-w-6xl px-4 py-10 md:px-8 md:py-16">
        {/* Hero */}
        <div className="mx-auto max-w-2xl text-center">
          <span className="inline-block rounded-full bg-secondary-container px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-on-secondary-container">
            Paket Langganan
          </span>
          <h1 className="mt-4 font-heading text-3xl font-black text-on-surface md:text-4xl">
            Pilih paket yang tumbuh bersama bisnis Anda
          </h1>
          <p className="mt-3 text-sm text-on-surface-variant md:text-base">
            Naik kelas kapan saja. Semakin tinggi paket, semakin rendah komisi transaksi Anda <br /> dan semakin banyak
            pembeli global yang bisa Anda jangkau.
          </p>
          <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
            Paket Anda saat ini:{" "}
            <span className="text-secondary">{getPlanInfo(plan).name}</span>
          </p>
        </div>

        {/* Pricing */}
        <div className="mt-10">
          <PricingTiers />
        </div>

        {/* Success-fee reassurance */}
        <div className="mx-auto mt-8 flex max-w-3xl items-start gap-3 rounded-xl border border-secondary/30 bg-secondary-container/40 p-4">
          <BadgeCheck className="mt-0.5 size-5 shrink-0 text-secondary" />
          <p className="text-xs leading-relaxed text-on-surface md:text-sm">
            <span className="font-bold">Model komisi berbasis keberhasilan.</span> Anda hanya membayar komisi saat
            transaksi ekspor berhasil dikonfirmasi — tanpa biaya di muka. Barrier masuk serendah mungkin untuk UMKM
            yang baru pertama kali ekspor.
          </p>
        </div>
      </main>
    </div>
  );
}
