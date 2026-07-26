"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Loader2, Search, ChevronLeft, ChevronRight, ShieldCheck, UserPlus, X } from "lucide-react";
import { getAdminUsers, setAdminUserRole, setAdminUserPlan, createAdminUser, type AdminUserRow } from "../../../../lib/admin";

const PAGE = 20;

export default function AdminUsers() {
  const [rows, setRows] = useState<AdminUserRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);

  // Create-user modal
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ email: "", password: "", role: "umkm", plan: "free" });
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [createdMsg, setCreatedMsg] = useState<string | null>(null);

  const openCreate = () => {
    setForm({ email: "", password: "", role: "umkm", plan: "free" });
    setCreateError(null); setCreatedMsg(null); setShowCreate(true);
  };
  const submitCreate = async () => {
    setCreating(true); setCreateError(null);
    try {
      const u = await createAdminUser(form);
      setCreatedMsg(`Akun ${u.email} (${u.role}) berhasil dibuat.`);
      setShowCreate(false);
      setPage(1); setQ(""); setSearch("");
      load();
      setTimeout(() => setCreatedMsg(null), 4000);
    } catch (e) {
      const status = (e as { status?: number }).status;
      setCreateError(status === 409 ? "Email sudah terdaftar." : "Gagal membuat akun. Periksa email (valid) & kata sandi (min. 8 karakter).");
    } finally {
      setCreating(false);
    }
  };

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
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-on-surface-variant" />
            <input
              value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Cari email / perusahaan…"
              className="w-64 rounded-md border border-outline-variant bg-surface-container-lowest pl-9 pr-3 py-2 text-sm text-on-surface focus:border-outline focus:outline-none"
            />
          </div>
          <button
            onClick={openCreate}
            className="inline-flex items-center gap-1.5 rounded-md bg-primary text-on-primary px-3.5 py-2 text-sm font-semibold hover:bg-surface-tint transition-colors shrink-0"
          >
            <UserPlus className="size-4" /> Tambah User
          </button>
        </div>
      </div>

      {createdMsg && (
        <div className="rounded-md border border-secondary/40 bg-secondary/10 text-secondary px-3 py-2 text-sm">{createdMsg}</div>
      )}

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

      {/* Create-user modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => !creating && setShowCreate(false)}>
          <div className="w-full max-w-md rounded-xl border border-outline-variant bg-surface-container-lowest shadow-lg" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-outline-variant">
              <h2 className="text-base font-semibold flex items-center gap-2"><UserPlus className="size-4 text-primary" /> Tambah User</h2>
              <button onClick={() => setShowCreate(false)} disabled={creating} className="text-on-surface-variant hover:text-on-surface disabled:opacity-40"><X className="size-5" /></button>
            </div>
            <div className="p-5 space-y-4">
              <label className="block">
                <span className="text-xs font-medium text-on-surface-variant">Email</span>
                <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="nama@perusahaan.co.id"
                  className="mt-1 w-full rounded-md border border-outline-variant bg-surface px-3 py-2 text-sm text-on-surface focus:border-primary focus:outline-none" />
              </label>
              <label className="block">
                <span className="text-xs font-medium text-on-surface-variant">Kata Sandi <span className="text-on-surface-variant/60">(min. 8 karakter)</span></span>
                <input type="text" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="kata sandi awal"
                  className="mt-1 w-full rounded-md border border-outline-variant bg-surface px-3 py-2 text-sm text-on-surface focus:border-primary focus:outline-none font-mono-data" />
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <span className="text-xs font-medium text-on-surface-variant">Role</span>
                  <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}
                    className="mt-1 w-full rounded-md border border-outline-variant bg-surface px-3 py-2 text-sm text-on-surface focus:border-primary focus:outline-none">
                    <option value="umkm">umkm</option><option value="admin">admin</option>
                  </select>
                </label>
                <label className="block">
                  <span className="text-xs font-medium text-on-surface-variant">Paket</span>
                  <select value={form.plan} onChange={(e) => setForm({ ...form, plan: e.target.value })}
                    className="mt-1 w-full rounded-md border border-outline-variant bg-surface px-3 py-2 text-sm text-on-surface focus:border-primary focus:outline-none">
                    <option value="free">free</option><option value="premium">premium</option>
                  </select>
                </label>
              </div>
              {createError && <p className="text-xs text-error">{createError}</p>}
              <p className="text-[11px] text-on-surface-variant">User akan mengisi profil perusahaan & produk saat login pertama (khusus role umkm).</p>
            </div>
            <div className="flex justify-end gap-2 px-5 py-4 border-t border-outline-variant">
              <button onClick={() => setShowCreate(false)} disabled={creating} className="px-4 py-2 text-sm rounded-md border border-outline-variant hover:bg-surface-container-high disabled:opacity-40">Batal</button>
              <button onClick={submitCreate} disabled={creating || !form.email || form.password.length < 8}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-md bg-primary text-on-primary hover:bg-surface-tint disabled:opacity-40">
                {creating ? <Loader2 className="size-4 animate-spin" /> : <UserPlus className="size-4" />} Buat Akun
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
