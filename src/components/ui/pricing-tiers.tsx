"use client";

import { useEffect, useState } from "react";
import { Check, Percent } from "lucide-react";

import { cn } from "@/lib/utils";
import { PLANS, getPlan, setPlan, planRank, type Plan } from "@/lib/plan";

export function PricingTiers() {
  const [current, setCurrent] = useState<Plan>("free");

  useEffect(() => {
    setCurrent(getPlan());
    const handle = () => setCurrent(getPlan());
    window.addEventListener("tradeconnect_plan_change", handle);
    window.addEventListener("storage", handle);
    return () => {
      window.removeEventListener("tradeconnect_plan_change", handle);
      window.removeEventListener("storage", handle);
    };
  }, []);

  return (
    <div className="grid items-start gap-5 lg:grid-cols-3">
      {PLANS.map((plan) => {
        const isCurrent = plan.id === current;
        const isUpgrade = planRank(plan.id) > planRank(current);
        const ctaLabel = isCurrent
          ? "Paket Saat Ini"
          : isUpgrade
          ? plan.cta
          : `Pindah ke ${plan.name}`;

        return (
          <div
            key={plan.id}
            className={cn(
              "relative flex flex-col rounded-2xl border bg-surface-container-lowest p-6 transition-all",
              plan.highlight
                ? "border-2 border-primary shadow-lg lg:-translate-y-2"
                : "border-outline-variant shadow-sm"
            )}
          >
            {plan.highlight && (
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-on-primary shadow-md">
                Paling Populer
              </span>
            )}

            {/* Header */}
            <div className="space-y-1.5">
              <h3 className="font-heading text-xl font-black text-on-surface">{plan.name}</h3>
              <p className="min-h-[2.5rem] text-xs leading-relaxed text-on-surface-variant">
                {plan.tagline}
              </p>
            </div>

            {/* Price */}
            <div className="mt-5 flex flex-wrap items-baseline gap-x-1">
              {plan.free ? (
                <span className="font-heading text-3xl font-black text-on-surface">Gratis</span>
              ) : (
                <>
                  <span className="text-base font-bold text-on-surface-variant">Rp</span>
                  <span className="font-heading text-3xl font-black tabular-nums text-on-surface">
                    {plan.price}
                  </span>
                  <span className="text-sm font-semibold text-on-surface-variant">{plan.period}</span>
                </>
              )}
            </div>

            {/* Commission — the key differentiator across tiers */}
            <div className="mt-3 flex items-center gap-2 rounded-lg bg-secondary-container/60 px-3 py-2">
              <Percent className="size-3.5 shrink-0 text-on-secondary-container" strokeWidth={2.5} />
              <span className="text-[11px] font-semibold text-on-secondary-container">
                Komisi transaksi {plan.commission} per deal
              </span>
            </div>

            {/* CTA */}
            <button
              type="button"
              disabled={isCurrent}
              onClick={() => !isCurrent && setPlan(plan.id)}
              className={cn(
                "mt-5 w-full rounded-lg py-2.5 text-sm font-bold transition-all",
                isCurrent
                  ? "cursor-default bg-surface-container-high text-on-surface-variant"
                  : cn(
                      "cursor-pointer active:translate-y-px",
                      plan.highlight
                        ? "bg-primary text-on-primary hover:bg-primary-hover"
                        : "border border-primary text-primary hover:bg-primary hover:text-on-primary"
                    )
              )}
            >
              {ctaLabel}
            </button>

            {/* Target segment */}
            <p className="mt-5 text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">
              {plan.target}
            </p>

            {/* Features */}
            <ul className="mt-3 space-y-2.5">
              {plan.features.map((feature) => (
                <li key={feature} className="flex items-start gap-2.5 text-xs text-on-surface">
                  <Check className="mt-0.5 size-4 shrink-0 text-secondary" strokeWidth={2.5} />
                  <span className="leading-relaxed">{feature}</span>
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </div>
  );
}
