"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Loader2, Search, ChevronLeft, ChevronRight, ShieldCheck } from "lucide-react";
import { getAdminUsers, setAdminUserRole, setAdminUserPlan, type AdminUserRow } from "../../../../lib/admin";

const PAGE = 20;

export default function AdminUsers() {
  const [rows, setRows] = useState<AdminUserRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    getAdminUsers({ search: q, page, limit: PAGE }).then((r) => {
      setRows(r.items); setTotal(r.total); setLoading(false);
    });
  }, [q, page]);
  useEffect(() => { load(); }, [load]);
  useEffect(() => { const t = setTimeout(() => { setQ(search); setPage(1); }, 400); return () => clearTimeout(t); }, [search]);

  const changeRole = async (u: AdminUserRow, role: string) => {
    setBusy(u.id); await setAdminUserRole(u.id, role).catch(() => {}); load(); setBusy(null);
  };
  const changePlan = async (u: AdminUserRow, plan: string) => {
    setBusy(u.id); await setAdminUserPlan(u.id, plan).catch(() => {}); load(); setBusy(null);
  };

  const pages = Math.max(1, Math.ceil(total / PAGE));
  return (
    <div className="p-6 md:p-8 space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Users</h1>
          <p className="text-sm text-on-surface-variant mt-1">{total} pengguna terdaftar.</p>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-on-surface-variant" />
          <input
            value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Cari email / perusahaan…"
            className="w-72 rounded-md border border-outline-variant bg-surface-container-lowest pl-9 pr-3 py-2 text-sm text-on-surface focus:border-outline focus:outline-none"
          />
        </div>
      </div>

      <div className="rounded-xl border border-outline-variant overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-surface-container-lowest text-on-surface-variant text-xs">
            <tr>
              {["Email", "Company", "Role", "Plan", "Products", "Workflow", "Last Login", "Actions"].map((h) => (
                <th key={h} className="text-left font-medium px-3 py-2">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant">
            {loading ? (
              <tr><td colSpan={8} className="px-3 py-8 text-center text-on-surface-variant"><Loader2 className="size-4 animate-spin inline" /></td></tr>
            ) : rows.length === 0 ? (
              <tr><td colSpan={8} className="px-3 py-8 text-center text-on-surface-variant">Tidak ada pengguna.</td></tr>
            ) : rows.map((u) => (
              <tr key={u.id} className="bg-surface-bright hover:bg-surface-container-lowest/60">
                <td className="px-3 py-2">
                  <Link href={`/admin/users/${u.id}`} className="text-on-surface hover:text-primary hover:underline">{u.email}</Link>
                  <div className="text-[10px] text-on-surface-variant">{u.is_active ? "active" : "inactive"}</div>
                </td>
                <td className="px-3 py-2 text-on-surface-variant">{u.legal_name ?? "—"}</td>
                <td className="px-3 py-2">
                  <span className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] ${u.role === "admin" ? "bg-primary/10 text-primary" : "bg-surface-container-high text-on-surface-variant"}`}>
                    {u.role === "admin" && <ShieldCheck className="size-3" />}{u.role}
                  </span>
                </td>
                <td className="px-3 py-2 capitalize text-on-surface-variant">{u.plan}</td>
                <td className="px-3 py-2 text-on-surface-variant">{u.products}</td>
                <td className="px-3 py-2 text-on-surface-variant">{u.workflow_status ?? "—"}</td>
                <td className="px-3 py-2 text-on-surface-variant text-xs">{u.last_login_at ? new Date(u.last_login_at).toLocaleString("id-ID", { dateStyle: "short", timeStyle: "short" }) : "—"}</td>
                <td className="px-3 py-2">
                  <div className="flex items-center gap-1">
                    <select disabled={busy === u.id} value={u.role} onChange={(e) => changeRole(u, e.target.value)}
                      className="rounded border border-outline-variant bg-surface-container-high text-xs px-1 py-1">
                      <option value="umkm">umkm</option><option value="admin">admin</option>
                    </select>
                    <select disabled={busy === u.id} value={u.plan} onChange={(e) => changePlan(u, e.target.value)}
                      className="rounded border border-outline-variant bg-surface-container-high text-xs px-1 py-1">
                      <option value="free">free</option><option value="premium">premium</option>
                    </select>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between text-sm text-on-surface-variant">
        <span>Halaman {page} / {pages}</span>
        <div className="flex gap-1">
          <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="rounded border border-outline-variant p-1.5 disabled:opacity-30 hover:bg-surface-container-high"><ChevronLeft className="size-4" /></button>
          <button disabled={page >= pages} onClick={() => setPage((p) => p + 1)} className="rounded border border-outline-variant p-1.5 disabled:opacity-30 hover:bg-surface-container-high"><ChevronRight className="size-4" /></button>
        </div>
      </div>
    </div>
  );
}
