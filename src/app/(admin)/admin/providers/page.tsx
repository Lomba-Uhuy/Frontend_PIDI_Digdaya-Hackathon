"use client";
import { useEffect, useState } from "react";
import { Loader2, RefreshCw } from "lucide-react";
import { getAdminProviders, type ProviderHealth } from "../../../../lib/admin";

const dot: Record<string, string> = {
  up: "bg-secondary", degraded: "bg-tertiary", down: "bg-error",
  failed: "bg-error", ok: "bg-secondary", unknown: "bg-outline",
};

export default function AdminProviders() {
  const [h, setH] = useState<ProviderHealth | null>(null);
  const [loading, setLoading] = useState(true);
  const load = () => { setLoading(true); getAdminProviders().then((d) => { setH(d); setLoading(false); }); };
  useEffect(() => { load(); }, []);

  return (
    <div className="p-6 md:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Providers & System Health</h1>
          <p className="text-sm text-on-surface-variant mt-1">Status nyata — tidak ada yang dipalsukan; status tak diketahui ditampilkan apa adanya.</p>
        </div>
        <button onClick={load} className="inline-flex items-center gap-2 rounded-md border border-outline-variant px-3 py-2 text-sm hover:bg-surface-container-high">
          <RefreshCw className={`size-4 ${loading ? "animate-spin" : ""}`} /> Refresh
        </button>
      </div>

      {loading && !h ? (
        <div className="text-on-surface-variant"><Loader2 className="size-5 animate-spin" /></div>
      ) : (
        <>
          <section>
            <h2 className="text-sm font-semibold text-on-surface-variant mb-2">Internal Services (live ping)</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {h?.internal.map((p) => (
                <div key={p.name} className="rounded-xl border border-outline-variant bg-surface-container-lowest p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-on-surface">{p.name}</span>
                    <span className="flex items-center gap-1.5 text-xs capitalize">
                      <span className={`size-2 rounded-full ${dot[p.status] ?? "bg-outline"}`} />{p.status}
                    </span>
                  </div>
                  <div className="mt-2 text-[11px] text-on-surface-variant">HTTP {p.httpStatus ?? "—"} · {p.latencyMs}ms</div>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h2 className="text-sm font-semibold text-on-surface-variant mb-2">External Data Providers</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {h?.external.map((p) => (
                <div key={p.name} className="rounded-xl border border-outline-variant bg-surface-container-lowest p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-on-surface">{p.name}</span>
                    <span className="flex items-center gap-1.5 text-xs capitalize">
                      <span className={`size-2 rounded-full ${dot[p.status] ?? "bg-outline"}`} />{p.status}
                    </span>
                  </div>
                  <div className="mt-2 text-[11px] text-on-surface-variant">
                    {p.lastSync ? `Last sync: ${new Date(p.lastSync).toLocaleString("id-ID")}` : p.note ?? "—"}
                    {p.lastError ? <div className="text-error mt-0.5 truncate">{p.lastError}</div> : null}
                  </div>
                </div>
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
