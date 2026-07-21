"use client";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { getAdminProducts } from "../../../../lib/admin";

export default function AdminProducts() {
  const [rows, setRows] = useState<Record<string, unknown>[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  useEffect(() => { getAdminProducts(1).then((r) => { setRows(r.items); setTotal(r.total); setLoading(false); }); }, []);

  return (
    <div className="p-6 md:p-8 space-y-4">
      <div><h1 className="text-2xl font-bold">Products</h1><p className="text-sm text-on-surface-variant mt-1">{total} produk.</p></div>
      <div className="rounded-xl border border-outline-variant overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-surface-container-lowest text-on-surface-variant text-xs"><tr>{["Product", "Company", "Owner", "HS", "Candidates", "Workflow", "Created"].map((h) => <th key={h} className="text-left font-medium px-3 py-2">{h}</th>)}</tr></thead>
          <tbody className="divide-y divide-outline-variant">
            {loading ? <tr><td colSpan={7} className="px-3 py-8 text-center text-on-surface-variant"><Loader2 className="size-4 animate-spin inline" /></td></tr>
            : rows.length === 0 ? <tr><td colSpan={7} className="px-3 py-8 text-center text-on-surface-variant">Belum ada produk.</td></tr>
            : rows.map((p) => (
              <tr key={String(p.id)} className="bg-surface-bright">
                <td className="px-3 py-2 text-on-surface">{String(p.name ?? "—")}</td>
                <td className="px-3 py-2 text-on-surface-variant">{String(p.company ?? "—")}</td>
                <td className="px-3 py-2 text-on-surface-variant text-xs">{String(p.owner_email ?? "—")}</td>
                <td className="px-3 py-2 text-on-surface-variant font-mono-data">{String(p.hs_code ?? "—")}</td>
                <td className="px-3 py-2 text-on-surface-variant">{String(p.hs_candidates ?? 0)}</td>
                <td className="px-3 py-2 text-on-surface-variant">{String(p.workflow_status ?? "—")}</td>
                <td className="px-3 py-2 text-on-surface-variant text-xs">{p.created_at ? new Date(String(p.created_at)).toLocaleDateString("id-ID") : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
