"use client";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { getAdminSubscriptions } from "../../../../lib/admin";

export default function AdminSubscriptions() {
  const [data, setData] = useState<Awaited<ReturnType<typeof getAdminSubscriptions>> | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => { getAdminSubscriptions().then((d) => { setData(d); setLoading(false); }); }, []);

  if (loading) return <div className="flex h-full items-center justify-center text-on-surface-variant"><Loader2 className="size-5 animate-spin" /></div>;

  return (
    <div className="p-6 md:p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Subscriptions</h1>
        <p className="text-sm text-on-surface-variant mt-1">Distribusi paket & langganan aktif (struktur siap integrasi pembayaran).</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {(data?.catalogue ?? []).map((c) => {
          const n = data?.distribution.find((d) => d.plan === c.id)?.n ?? 0;
          return (
            <div key={c.id} className="rounded-xl border border-outline-variant bg-surface-container-lowest p-4">
              <div className="text-xs text-on-surface-variant flex items-center gap-1">{c.label}{c.comingSoon && <span className="text-[9px] uppercase text-on-surface-variant">soon</span>}</div>
              <div className="mt-1 text-2xl font-bold">{n}</div>
            </div>
          );
        })}
      </div>

      <div className="rounded-xl border border-outline-variant overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-surface-container-lowest text-on-surface-variant text-xs">
            <tr>{["User", "Plan", "Status", "Billing", "Payment", "Provider", "Started"].map((h) => <th key={h} className="text-left font-medium px-3 py-2">{h}</th>)}</tr>
          </thead>
          <tbody className="divide-y divide-outline-variant">
            {(data?.items ?? []).length === 0 ? (
              <tr><td colSpan={7} className="px-3 py-8 text-center text-on-surface-variant">Belum ada langganan.</td></tr>
            ) : (data?.items ?? []).map((s, i) => (
              <tr key={i} className="bg-surface-bright">
                <td className="px-3 py-2 text-on-surface">{String(s.email)}</td>
                <td className="px-3 py-2 capitalize text-on-surface-variant">{String(s.plan)}</td>
                <td className="px-3 py-2 text-on-surface-variant">{String(s.status)}</td>
                <td className="px-3 py-2 text-on-surface-variant">{String(s.billing_cycle)}</td>
                <td className="px-3 py-2 text-on-surface-variant">{String(s.payment_status)}</td>
                <td className="px-3 py-2 text-on-surface-variant">{String(s.provider ?? "—")}</td>
                <td className="px-3 py-2 text-on-surface-variant text-xs">{s.started_at ? new Date(String(s.started_at)).toLocaleDateString("id-ID") : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
