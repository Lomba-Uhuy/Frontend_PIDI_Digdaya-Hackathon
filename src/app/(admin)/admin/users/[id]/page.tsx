"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Loader2, ShieldCheck, Building2, Package, MessagesSquare } from "lucide-react";
import { getAdminUser } from "../../../../../lib/admin";

type Detail = {
  user: Record<string, unknown>;
  company: Record<string, unknown> | null;
  products: Record<string, unknown>[];
  deals: Record<string, unknown>[];
  entitlements: { plan: string; flags: Record<string, boolean>; quotas: Record<string, number | null> };
};

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <div className="text-xs text-on-surface-variant">{label}</div>
      <div className="text-sm text-on-surface mt-0.5">{value ?? "—"}</div>
    </div>
  );
}

const fmt = (v: unknown) => (v ? new Date(String(v)).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" }) : "—");

export default function AdminUserDetail() {
  const params = useParams<{ id: string }>();
  const id = params?.id;
  const [data, setData] = useState<Detail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    getAdminUser(id)
      .then((d) => { if (d) setData(d as unknown as Detail); else setError("Pengguna tidak ditemukan."); })
      .catch(() => setError("Gagal memuat data pengguna."))
      .finally(() => setLoading(false));
  }, [id]);

  return (
    <div className="p-6 md:p-8 max-w-5xl space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/admin/users" className="text-on-surface-variant hover:text-on-surface p-1.5 rounded-md hover:bg-surface-container-high"><ArrowLeft className="size-5" /></Link>
        <h1 className="text-2xl font-bold">Detail Pengguna</h1>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-on-surface-variant py-12 justify-center"><Loader2 className="size-4 animate-spin" /> Memuat…</div>
      ) : error || !data ? (
        <div className="rounded-xl border border-outline-variant bg-surface-container-lowest p-8 text-center text-on-surface-variant">{error ?? "Tidak ada data."}</div>
      ) : (
        <>
          {/* Profile */}
          <section className="rounded-xl border border-outline-variant bg-surface-container-lowest p-5">
            <h2 className="text-sm font-semibold text-on-surface-variant uppercase tracking-wide mb-4">Profil</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Field label="Email" value={<span className="break-all">{String(data.user.email)}</span>} />
              <Field label="Role" value={
                <span className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-xs ${data.user.role === "admin" ? "bg-primary/10 text-primary" : "bg-surface-container-high text-on-surface-variant"}`}>
                  {data.user.role === "admin" && <ShieldCheck className="size-3" />}{String(data.user.role)}
                </span>} />
              <Field label="Status" value={data.user.is_active ? "Aktif" : "Nonaktif"} />
              <Field label="Paket" value={<span className="capitalize">{data.entitlements.plan}</span>} />
              <Field label="Login terakhir" value={fmt(data.user.last_login_at)} />
              <Field label="Terdaftar" value={fmt(data.user.created_at)} />
              <Field label="Status langganan" value={String(data.user.sub_status ?? "—")} />
              <Field label="Status pembayaran" value={String(data.user.payment_status ?? "—")} />
            </div>
          </section>

          {/* Company */}
          <section className="rounded-xl border border-outline-variant bg-surface-container-lowest p-5">
            <h2 className="text-sm font-semibold text-on-surface-variant uppercase tracking-wide mb-4 flex items-center gap-2"><Building2 className="size-4" /> Perusahaan</h2>
            {data.company ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Field label="Nama" value={String(data.company.legal_name)} />
                <Field label="NIB" value={<span className="font-mono-data">{String(data.company.nib)}</span>} />
                <Field label="Verifikasi" value={String(data.company.verification_status ?? "—")} />
                <Field label="Skor" value={String(data.company.verified_score ?? "—")} />
              </div>
            ) : <p className="text-sm text-on-surface-variant">Pengguna ini belum memiliki perusahaan.</p>}
          </section>

          {/* Products */}
          <section className="rounded-xl border border-outline-variant bg-surface-container-lowest p-5">
            <h2 className="text-sm font-semibold text-on-surface-variant uppercase tracking-wide mb-4 flex items-center gap-2"><Package className="size-4" /> Produk ({data.products.length})</h2>
            {data.products.length === 0 ? <p className="text-sm text-on-surface-variant">Belum ada produk.</p> : (
              <div className="divide-y divide-outline-variant">
                {data.products.map((p) => (
                  <div key={String(p.id)} className="py-2.5 flex items-center justify-between text-sm">
                    <div><span className="text-on-surface">{String(p.name)}</span> <span className="text-on-surface-variant font-mono-data ml-2">{String(p.hs_code ?? "—")}</span></div>
                    <div className="text-on-surface-variant text-xs">{String(p.workflow_status ?? "—")}{p.current_stage ? ` · ${p.current_stage}` : ""}{Number(p.retry_count) > 0 ? ` · retry ${p.retry_count}` : ""}</div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Deals */}
          <section className="rounded-xl border border-outline-variant bg-surface-container-lowest p-5">
            <h2 className="text-sm font-semibold text-on-surface-variant uppercase tracking-wide mb-4 flex items-center gap-2"><MessagesSquare className="size-4" /> Negosiasi ({data.deals.length})</h2>
            {data.deals.length === 0 ? <p className="text-sm text-on-surface-variant">Belum ada negosiasi.</p> : (
              <div className="divide-y divide-outline-variant">
                {data.deals.map((d) => (
                  <div key={String(d.id)} className="py-2.5 flex items-center justify-between text-sm">
                    <span className="text-on-surface">{String(d.buyer_name ?? "—")} <span className="text-on-surface-variant">· {String(d.buyer_country ?? "")}</span></span>
                    <span className="text-on-surface-variant text-xs">{String(d.status)} · {fmt(d.updated_at)}</span>
                  </div>
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
