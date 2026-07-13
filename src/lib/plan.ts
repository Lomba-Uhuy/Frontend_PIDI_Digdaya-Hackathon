export type Plan = "free" | "growth" | "scale";

export interface PlanInfo {
  id: Plan;
  name: string;
  price: string; // formatted number, e.g. "249.000"
  period: string; // "selamanya" | "/bulan"
  free?: boolean;
  tagline: string;
  target: string;
  commission: string; // "1,5%"
  highlight?: boolean; // mid-tier "most popular"
  cta: string;
  features: string[];
}

// Source of truth: TradeConnect Financial Model — "Revenue Model — 3 Tier".
export const PLANS: PlanInfo[] = [
  {
    id: "free",
    name: "Free",
    price: "0",
    period: "selamanya",
    free: true,
    tagline: "Kenali potensi ekspor Anda tanpa biaya sepeser pun.",
    target: "UMKM baru & tahap eksplorasi",
    commission: "1,5%",
    cta: "Mulai Gratis",
    features: [
      "Lihat profil pembeli global (mode jelajah)",
      "Pencocokan deal manual & terbatas",
      "Komisi transaksi 1,5% per deal",
      "Analitik pasar dasar",
      "Dukungan komunitas",
    ],
  },
  {
    id: "growth",
    name: "Growth",
    price: "249.000",
    period: "/bulan",
    tagline: "Mesin pertumbuhan untuk UMKM yang siap ekspor.",
    target: "UMKM aktif & siap ekspor",
    commission: "1%",
    highlight: true,
    cta: "Upgrade ke Growth",
    features: [
      "Hingga 10 rekomendasi pembeli / bulan",
      "Pencocokan deal berbantuan AI",
      "Komisi transaksi turun jadi 1%",
      "Analitik pasar menengah",
      "Dukungan email (respons 2×24 jam)",
    ],
  },
  {
    id: "scale",
    name: "Scale",
    price: "749.000",
    period: "/bulan",
    tagline: "Skala penuh untuk eksportir yang sudah aktif.",
    target: "UMKM eksportir aktif",
    commission: "0,75%",
    cta: "Upgrade ke Scale",
    features: [
      "Rekomendasi pembeli tanpa batas",
      "AI prioritas + tim Business Development khusus",
      "Komisi transaksi terendah 0,75%",
      "Layanan pendukung (ancillary) prioritas",
      "Dashboard analitik lengkap",
      "Account manager khusus",
      "Opsi bagi hasil data (opt-in)",
    ],
  },
];

const PLAN_ORDER: Plan[] = ["free", "growth", "scale"];

export function getPlan(): Plan {
  if (typeof window === "undefined") return "free";
  return (localStorage.getItem("tradeconnect_plan") as Plan) || "free";
}

export function setPlan(plan: Plan) {
  if (typeof window !== "undefined") {
    localStorage.setItem("tradeconnect_plan", plan);
    // Sync topbar, sidebar nudge and billing tab instantly.
    window.dispatchEvent(new Event("tradeconnect_plan_change"));
  }
}

export function getPlanInfo(plan: Plan): PlanInfo {
  return PLANS.find((p) => p.id === plan) ?? PLANS[0];
}

export function planRank(plan: Plan): number {
  return PLAN_ORDER.indexOf(plan);
}
