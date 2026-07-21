"use client";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { getAdminAudit } from "../../../../lib/admin";

export default function AdminAudit() {
  const [rows, setRows] = useState<Record<string, unknown>[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  useEffect(() => { getAdminAudit({ limit: 100 }).then((r) => { setRows(r.items); setTotal(r.total); setLoading(false); }); }, []);

  return (
    <div className="p-6 md:p-8 space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Audit Logs</h1>
        <p className="text-sm text-on-surface-variant mt-1">{total} tindakan administratif tercatat.</p>
      </div>
      <div className="rounded-xl border border-outline-variant overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-surface-container-lowest text-on-surface-variant text-xs">
            <tr>{["Time", "Actor", "Action", "Resource", "Before", "After", "IP"].map((h) => <th key={h} className="text-left font-medium px-3 py-2">{h}</th>)}</tr>
          </thead>
          <tbody className="divide-y divide-outline-variant">
            {loading ? (
              <tr><td colSpan={7} className="px-3 py-8 text-center text-on-surface-variant"><Loader2 className="size-4 animate-spin inline" /></td></tr>
            ) : rows.length === 0 ? (
              <tr><td colSpan={7} className="px-3 py-8 text-center text-on-surface-variant">Belum ada catatan audit.</td></tr>
            ) : rows.map((r) => (
              <tr key={String(r.id)} className="bg-surface-bright align-top">
                <td className="px-3 py-2 text-on-surface-variant text-xs whitespace-nowrap">{new Date(String(r.createdAt)).toLocaleString("id-ID", { dateStyle: "short", timeStyle: "medium" })}</td>
                <td className="px-3 py-2 text-on-surface-variant text-xs">{String(r.actorEmail ?? r.actorUserId ?? "—")}</td>
                <td className="px-3 py-2"><span className="rounded bg-surface-container-high px-1.5 py-0.5 text-[11px] text-primary">{String(r.action)}</span></td>
                <td className="px-3 py-2 text-on-surface-variant text-xs">{String(r.resourceType ?? "—")}<div className="text-on-surface-variant">{String(r.resourceId ?? "")}</div></td>
                <td className="px-3 py-2 text-on-surface-variant text-[11px] font-mono-data max-w-[160px] truncate">{r.before ? JSON.stringify(r.before) : "—"}</td>
                <td className="px-3 py-2 text-on-surface-variant text-[11px] font-mono-data max-w-[160px] truncate">{r.after ? JSON.stringify(r.after) : "—"}</td>
                <td className="px-3 py-2 text-on-surface-variant text-xs">{String(r.ip ?? "—")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
