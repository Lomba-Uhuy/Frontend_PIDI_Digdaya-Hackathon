"use client";
import { useCallback, useEffect, useState } from "react";
import { Loader2, RotateCcw } from "lucide-react";
import { getAdminWorkflows, retryAdminWorkflow } from "../../../../lib/admin";

const STATUSES = ["", "running", "queued", "completed", "failed"];
const statusCls: Record<string, string> = {
  completed: "text-secondary", running: "text-primary", failed: "text-error", queued: "text-on-surface-variant",
};

export default function AdminWorkflows() {
  const [rows, setRows] = useState<Record<string, unknown>[]>([]);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    getAdminWorkflows({ status: status || undefined }).then((r) => { setRows(r.items); setLoading(false); });
  }, [status]);
  useEffect(() => { load(); }, [load]);

  const retry = async (productId: string) => {
    setBusy(productId); await retryAdminWorkflow(productId).catch(() => {}); setTimeout(load, 800); setBusy(null);
  };

  return (
    <div className="p-6 md:p-8 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">AI Workflows</h1>
          <p className="text-sm text-on-surface-variant mt-1">Konsol operasional workflow inisialisasi produk.</p>
        </div>
        <div className="flex gap-1">
          {STATUSES.map((s) => (
            <button key={s || "all"} onClick={() => setStatus(s)}
              className={`rounded px-3 py-1.5 text-xs capitalize ${status === s ? "bg-surface-container-highest text-on-surface" : "bg-surface-container-lowest text-on-surface-variant hover:bg-surface-container-high"}`}>
              {s || "all"}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-outline-variant overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-surface-container-lowest text-on-surface-variant text-xs">
            <tr>{["Product", "Company", "Status", "Stage", "Progress", "Retry", "Exec v", "Worker", ""].map((h) => <th key={h} className="text-left font-medium px-3 py-2">{h}</th>)}</tr>
          </thead>
          <tbody className="divide-y divide-outline-variant">
            {loading ? (
              <tr><td colSpan={9} className="px-3 py-8 text-center text-on-surface-variant"><Loader2 className="size-4 animate-spin inline" /></td></tr>
            ) : rows.length === 0 ? (
              <tr><td colSpan={9} className="px-3 py-8 text-center text-on-surface-variant">Belum ada workflow.</td></tr>
            ) : rows.map((w) => (
              <tr key={String(w.id)} className="bg-surface-bright hover:bg-surface-container-lowest/60">
                <td className="px-3 py-2 text-on-surface">{String(w.product_name ?? "—")}</td>
                <td className="px-3 py-2 text-on-surface-variant">{String(w.company ?? "—")}</td>
                <td className={`px-3 py-2 capitalize ${statusCls[String(w.status)] ?? "text-on-surface-variant"}`}>{String(w.status)}</td>
                <td className="px-3 py-2 text-on-surface-variant">{String(w.current_stage ?? "—")}</td>
                <td className="px-3 py-2 text-on-surface-variant">{String(w.stages_done ?? 0)}/{String(w.stages_total ?? 0)}</td>
                <td className="px-3 py-2 text-on-surface-variant">{String(w.retry_count ?? 0)}</td>
                <td className="px-3 py-2 text-on-surface-variant">{String(w.execution_version ?? 1)}</td>
                <td className="px-3 py-2 text-on-surface-variant text-xs">{String(w.current_worker ?? "—")}</td>
                <td className="px-3 py-2">
                  {w.status === "failed" && (
                    <button disabled={busy === w.product_id} onClick={() => retry(String(w.product_id))}
                      className="inline-flex items-center gap-1 rounded bg-primary/10 text-primary px-2 py-1 text-xs hover:bg-primary/20 disabled:opacity-40">
                      <RotateCcw className="size-3" /> Retry
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
