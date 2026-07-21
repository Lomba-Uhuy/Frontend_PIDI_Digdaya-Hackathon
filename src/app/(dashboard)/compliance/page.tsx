"use client";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  getActiveDealId,
  getCompliance,
  runCompliance,
  type ComplianceCheck,
  type ComplianceStatus,
} from "../../../lib/deals";
import {
  AlertTriangle,
  ArrowRight,
  BadgeCheck,
  Loader2,
  Shield,
  ShieldAlert,
  ShieldCheck,
  XCircle,
} from "lucide-react";
import { Badge } from "../../../components/ui/badge";

const STATUS_META: Record<ComplianceStatus, { label: string; variant: "success" | "warning" | "danger"; Icon: typeof BadgeCheck }> = {
  pass: { label: "Lolos", variant: "success", Icon: BadgeCheck },
  warn: { label: "Perlu Ditinjau", variant: "warning", Icon: AlertTriangle },
  fail: { label: "Gagal", variant: "danger", Icon: XCircle },
};

export default function CompliancePage() {
  const router = useRouter();
  const [dealId, setDealId] = useState<string | null>(null);
  const [checks, setChecks] = useState<ComplianceCheck[] | null>(null);
  const [overall, setOverall] = useState<ComplianceStatus | null>(null);
  const [running, setRunning] = useState(false);

  const applyResult = useCallback((r: { checks: ComplianceCheck[]; overall: ComplianceStatus } | null) => {
    if (!r) return;
    setChecks(r.checks);
    setOverall(r.overall);
  }, []);

  useEffect(() => {
    const id = getActiveDealId();
    setDealId(id);
    if (id) getCompliance(id).then((r) => { if (r && r.checks.length > 0) applyResult(r); });
  }, [applyResult]);

  const handleRun = async () => {
    if (!dealId) return;
    setRunning(true);
    applyResult(await runCompliance(dealId));
    setRunning(false);
  };

  const canProceed = overall === "pass" || overall === "warn";

  return (
    <div className="h-full w-full overflow-y-auto p-4 md:p-8 bg-surface-bright pb-16">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="border-b border-outline-variant pb-6">
          <h2 className="text-2xl font-bold text-on-surface font-heading">Pemeriksa Kesiapan & Kepatuhan Ekspor</h2>
          <p className="text-sm text-on-surface-variant mt-1 font-medium">
            Pemeriksaan dijalankan dari data nyata: NIB, klasifikasi HS, harga kesepakatan vs harga dasar, dan kapasitas produksi.
          </p>
        </div>

        {!dealId ? (
          <div className="border border-dashed border-outline-variant rounded-xl p-10 text-center text-sm text-on-surface-variant">
            Belum ada transaksi aktif. Selesaikan negosiasi terlebih dahulu untuk menjalankan pemeriksaan kepatuhan.
          </div>
        ) : (
          <section className="bg-surface-container-lowest border border-outline-variant rounded-xl shadow-sm overflow-hidden">
            <div className="bg-surface p-5 border-b border-outline-variant flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Shield className="text-primary size-6" />
                <h3 className="text-lg font-bold text-on-surface">Hasil Pemeriksaan Kepatuhan</h3>
              </div>
              {overall && (
                <Badge variant={STATUS_META[overall].variant} icon={STATUS_META[overall].Icon}>
                  {overall === "pass" ? "Siap Ekspor" : overall === "warn" ? "Perlu Ditinjau" : "Terdapat Kegagalan"}
                </Badge>
              )}
            </div>

            <div className="p-5">
              {!checks ? (
                <div className="text-center py-10 flex flex-col items-center gap-4">
                  <ShieldAlert className="size-10 text-outline" />
                  <p className="text-sm text-on-surface-variant max-w-sm">
                    Jalankan pemeriksaan kepatuhan untuk memvalidasi kesiapan transaksi ekspor ini terhadap data profil dan produk Anda.
                  </p>
                  <button
                    onClick={handleRun}
                    disabled={running}
                    className="px-5 py-2.5 rounded-lg bg-primary text-on-primary text-sm font-bold hover:bg-surface-tint transition-colors flex items-center gap-2 disabled:opacity-50"
                  >
                    {running ? <Loader2 className="size-4 animate-spin" /> : <ShieldCheck className="size-4" />}
                    Jalankan Pemeriksaan Kepatuhan
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {checks.map((c) => {
                    const meta = STATUS_META[c.status];
                    return (
                      <div key={c.id} className="flex items-center justify-between gap-3 p-3.5 rounded-lg bg-surface border border-outline-variant shadow-sm">
                        <div className="flex items-center gap-3 min-w-0">
                          <meta.Icon
                            className={`size-5 shrink-0 ${c.status === "pass" ? "text-secondary" : c.status === "warn" ? "text-warning" : "text-error"}`}
                          />
                          <span className="text-sm font-semibold text-on-surface truncate">{c.label}</span>
                        </div>
                        <Badge variant={meta.variant}>{meta.label}</Badge>
                      </div>
                    );
                  })}

                  <div className="flex items-center justify-between pt-3">
                    <button
                      onClick={handleRun}
                      disabled={running}
                      className="px-4 py-2 rounded-md border border-outline-variant text-on-surface text-sm font-bold hover:bg-surface transition-colors flex items-center gap-2 disabled:opacity-50"
                    >
                      {running ? <Loader2 className="size-4 animate-spin" /> : null}
                      Jalankan Ulang
                    </button>
                    <button
                      onClick={() => router.push("/purchase-order")}
                      disabled={!canProceed}
                      className="px-5 py-2.5 rounded-lg bg-primary text-on-primary text-sm font-bold hover:bg-surface-tint transition-colors flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
                      title={canProceed ? "" : "Perbaiki pemeriksaan yang gagal sebelum melanjutkan"}
                    >
                      Lanjut ke Purchase Order <ArrowRight className="size-4" />
                    </button>
                  </div>
                  {overall === "fail" && (
                    <p className="text-xs text-error font-medium pt-1">
                      Terdapat pemeriksaan yang gagal (mis. NIB belum terdaftar atau harga di bawah harga dasar). Perbaiki sebelum menerbitkan PO.
                    </p>
                  )}
                </div>
              )}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
