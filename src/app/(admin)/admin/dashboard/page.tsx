"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Loader2, Users, Building2, Package, Workflow, CheckCircle2, XCircle, AlertTriangle } from "lucide-react";
import { getAdminMetrics, type AdminMetrics } from "../../../../lib/admin";

function Card({ label, value, sub, href, tone }: { label: string; value: React.ReactNode; sub?: string; href?: string; tone?: string }) {
  const body = (
    <div className="rounded-xl border border-outline-variant bg-surface-container-lowest p-4 hover:border-outline-variant transition-colors">
      <div className="text-xs text-on-surface-variant">{label}</div>
      <div className={`mt-1 text-2xl font-bold ${tone ?? "text-on-surface"}`}>{value}</div>
      {sub && <div className="mt-0.5 text-[11px] text-on-surface-variant">{sub}</div>}
    </div>
  );
  return href ? <Link href={href}>{body}</Link> : body;
}

export default function AdminDashboard() {
  const [m, setM] = useState<AdminMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAdminMetrics().then((d) => { setM(d); setLoading(false); });
  }, []);

  if (loading) return <div className="flex h-full items-center justify-center text-on-surface-variant"><Loader2 className="size-5 animate-spin" /></div>;
  if (!m) return <div className="p-8 text-on-surface-variant">Gagal memuat metrik admin.</div>;

  const wf = m.workflows;
  return (
    <div className="p-6 md:p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-sm text-on-surface-variant mt-1">Metrik produksi nyata — seluruhnya dari database.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
        <Card label="Registered Users" value={m.users.total} sub={`${m.users.active30d} aktif 30h`} href="/admin/users" />
        <Card label="Active Users" value={m.users.active} tone="text-secondary" href="/admin/users" />
        <Card label="Companies" value={m.companies} href="/admin/companies" />
        <Card label="Products" value={m.products} href="/admin/products" />
        <Card label="Negotiations" value={m.deals} href="/admin/activity" />
        <Card label="OCR Queue" value={m.ocr.available ? m.ocr.queued : "—"} sub={m.ocr.available ? undefined : "modul belum aktif"} tone="text-on-surface-variant" />
      </div>

      <div>
        <h2 className="text-sm font-semibold text-on-surface-variant mb-2">AI Workflows</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
          <Card label="Completed" value={wf.completed} tone="text-secondary" href="/admin/workflows" />
          <Card label="Running" value={wf.running} tone="text-primary" href="/admin/workflows" />
          <Card label="Failed" value={wf.failed} tone="text-error" href="/admin/workflows" />
          <Card label="Queued" value={wf.queued} tone="text-on-surface-variant" href="/admin/workflows" />
          <Card label="Success Rate" value={wf.successRate != null ? `${wf.successRate}%` : "—"} />
          <Card label="Avg Duration" value={wf.avgDurationMs != null ? `${(wf.avgDurationMs / 1000).toFixed(1)}s` : "—"} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-xl border border-outline-variant bg-surface-container-lowest p-4">
          <h3 className="text-sm font-semibold mb-3">Subscription Distribution</h3>
          {m.subscriptionDistribution.length === 0 ? (
            <p className="text-xs text-on-surface-variant">Belum ada langganan.</p>
          ) : (
            <div className="space-y-2">
              {m.subscriptionDistribution.map((d) => (
                <div key={d.plan} className="flex items-center justify-between text-sm">
                  <span className="capitalize text-on-surface-variant">{d.plan}</span>
                  <span className="font-mono-data text-on-surface">{d.n}</span>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="rounded-xl border border-outline-variant bg-surface-container-lowest p-4">
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2"><AlertTriangle className="size-4 text-primary" /> Recent Workflow Errors</h3>
          {m.recentErrors.length === 0 ? (
            <p className="text-xs text-on-surface-variant flex items-center gap-1"><CheckCircle2 className="size-3.5 text-secondary" /> Tidak ada error terbaru.</p>
          ) : (
            <ul className="space-y-1.5 max-h-52 overflow-y-auto">
              {m.recentErrors.map((e) => (
                <li key={String(e.id)} className="text-xs flex items-start gap-2">
                  <XCircle className="size-3.5 text-error mt-0.5 shrink-0" />
                  <span className="text-on-surface-variant">
                    <b className="text-on-surface">{String(e.type)}</b> {String(e.stage_name ?? "")} — {String(e.message ?? "")}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
