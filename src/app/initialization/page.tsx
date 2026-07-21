"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  ArrowRight,
  Check,
  CheckCircle2,
  Cpu,
  Loader2,
  RotateCcw,
  XCircle,
} from "lucide-react";
import { hasSession } from "../../lib/auth";
import { getStoredIds, getMyUmkm } from "../../lib/entities";
import { apiGet } from "../../lib/http";
import {
  getWorkflow,
  getWorkflowEvents,
  startWorkflow,
  stageLabel,
  eventTitle,
  eventSeverity,
  formatDuration,
  isTerminal,
  type ProductWorkflow,
  type WorkflowEvent,
  type StageStatus,
} from "../../lib/workflow";

const POLL_MS = 2000;

const STAGE_ICON: Record<StageStatus, React.ReactNode> = {
  completed: <Check className="size-3.5" />,
  running: <Loader2 className="size-3.5 animate-spin" />,
  retrying: <RotateCcw className="size-3.5 animate-spin" />,
  failed: <XCircle className="size-3.5" />,
  skipped: <Check className="size-3.5" />,
  queued: <span className="w-2 h-2 bg-on-surface-variant rounded-full" />,
};

function stageChipClass(status: StageStatus): string {
  switch (status) {
    case "completed":
    case "skipped":
      return "bg-secondary text-on-secondary";
    case "running":
      return "bg-primary text-on-primary";
    case "retrying":
      return "bg-tertiary text-on-tertiary-container";
    case "failed":
      return "bg-error text-on-error";
    default:
      return "bg-surface-variant text-on-surface-variant";
  }
}

async function resolveProductId(): Promise<string | null> {
  const stored = getStoredIds().productId;
  if (stored) return stored;
  const umkm = await getMyUmkm();
  if (!umkm?.id) return null;
  const products = await apiGet<{ id: string }[]>(`/umkm/${umkm.id}/products`).catch(() => []);
  return Array.isArray(products) && products.length > 0 ? products[0].id : null;
}

export default function InitializationPage() {
  const router = useRouter();
  const [productId, setProductId] = useState<string | null>(null);
  const [workflow, setWorkflow] = useState<ProductWorkflow | null>(null);
  const [events, setEvents] = useState<WorkflowEvent[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);
  const pollRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const navigatedRef = useRef(false);

  // Auth guard + resolve which product we're initializing.
  useEffect(() => {
    if (typeof window !== "undefined" && !hasSession()) {
      router.replace("/login");
      return;
    }
    let cancelled = false;
    (async () => {
      const pid = await resolveProductId().catch(() => null);
      if (cancelled) return;
      if (!pid) {
        setNotFound(true);
        return;
      }
      setProductId(pid);
      // Ensure the workflow exists / is running (idempotent on the backend).
      await startWorkflow(pid);
    })();
    return () => {
      cancelled = true;
    };
  }, [router]);

  // Poll persisted workflow state until it reaches a terminal status.
  useEffect(() => {
    if (!productId) return;
    let cancelled = false;

    const tick = async () => {
      try {
        const [wf, evs] = await Promise.all([getWorkflow(productId), getWorkflowEvents(productId)]);
        if (cancelled) return;
        if (wf) setWorkflow(wf);
        setEvents(evs);
        if (wf && isTerminal(wf.status)) {
          if (wf.status === "completed" && !navigatedRef.current) {
            navigatedRef.current = true;
            setTimeout(() => router.replace("/dashboard"), 1400);
          }
          return; // stop polling on terminal
        }
      } catch (e) {
        if (!cancelled) setError((e as Error).message);
      }
      if (!cancelled) pollRef.current = setTimeout(tick, POLL_MS);
    };
    void tick();

    return () => {
      cancelled = true;
      if (pollRef.current) clearTimeout(pollRef.current);
    };
  }, [productId, router]);

  const retry = async () => {
    if (!productId) return;
    navigatedRef.current = false;
    setError(null);
    await startWorkflow(productId);
    const wf = await getWorkflow(productId);
    setWorkflow(wf);
    // Resume polling.
    if (pollRef.current) clearTimeout(pollRef.current);
    const tick = async () => {
      const [w, evs] = await Promise.all([getWorkflow(productId), getWorkflowEvents(productId)]);
      if (w) setWorkflow(w);
      setEvents(evs);
      if (w && isTerminal(w.status)) {
        if (w.status === "completed" && !navigatedRef.current) {
          navigatedRef.current = true;
          setTimeout(() => router.replace("/dashboard"), 1400);
        }
        return;
      }
      pollRef.current = setTimeout(tick, POLL_MS);
    };
    void tick();
  };

  const status = workflow?.status;
  const percent = workflow?.progress.percent ?? 0;
  const completed = workflow?.progress.completed ?? 0;
  const total = workflow?.progress.total ?? 7;

  if (notFound) {
    return (
      <main className="w-full min-h-screen flex flex-col items-center justify-center px-4 bg-background">
        <div className="max-w-md text-center bg-surface-container-lowest border border-outline-variant rounded-xl p-8 shadow-sm">
          <AlertTriangle className="text-tertiary size-10 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-on-surface mb-2">Produk belum ditemukan</h2>
          <p className="text-sm text-on-surface-variant mb-6">
            Kami tidak menemukan produk untuk diinisialisasi. Silakan selesaikan pendaftaran produk terlebih dahulu.
          </p>
          <button
            onClick={() => router.replace("/onboarding")}
            className="px-6 py-2.5 text-sm font-medium bg-primary text-on-primary hover:bg-surface-tint rounded-md"
          >
            Kembali ke Pendaftaran
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="w-full max-w-[1440px] mx-auto px-4 md:px-8 py-12 flex flex-col items-center min-h-screen bg-background">
      <div className="w-full max-w-3xl bg-surface-container-lowest border border-outline-variant rounded-xl shadow-sm overflow-hidden">
        {/* Header */}
        <div className="bg-primary p-6 md:p-8 text-center text-on-primary flex flex-col items-center">
          <div className="w-16 h-16 bg-on-primary/15 rounded-full flex items-center justify-center mb-4 border-4 border-on-primary/20">
            {status === "completed" ? (
              <CheckCircle2 className="size-8" />
            ) : status === "failed" ? (
              <XCircle className="size-8" />
            ) : (
              <Cpu className="size-8" />
            )}
          </div>
          <h1 className="text-2xl md:text-3xl font-bold mb-1 font-heading">
            {status === "completed"
              ? "Inisialisasi Selesai"
              : status === "failed"
                ? "Inisialisasi Gagal"
                : "Menginisialisasi Produk Anda"}
          </h1>
          <p className="text-sm opacity-90">
            {status === "completed"
              ? "Menyiapkan dasbor Anda…"
              : status === "failed"
                ? "Salah satu tahap gagal diproses. Anda dapat mencoba lagi."
                : "AI TradeConnect sedang menyiapkan produk Anda untuk pasar global."}
          </p>
        </div>

        <div className="p-6 md:p-8 flex flex-col gap-6">
          {/* Progress — backend-computed percent, never fabricated */}
          <div>
            <div className="flex justify-between items-center mb-2 text-sm">
              <span className="font-medium text-on-surface">
                {completed} / {total} tahap selesai
              </span>
              <span className="font-mono-data font-semibold text-primary">{percent}%</span>
            </div>
            <div className="w-full h-2 bg-surface-variant rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-500 ${status === "failed" ? "bg-error" : "bg-primary"}`}
                style={{ width: `${percent}%` }}
              />
            </div>
            {workflow && (
              <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-[11px] text-on-surface-variant">
                <span>Status: <b className="text-on-surface">{workflow.status}</b></span>
                {workflow.currentStage && <span>Tahap: <b className="text-on-surface">{stageLabel(workflow.currentStage)}</b></span>}
                {workflow.currentWorker && <span>Worker: <b className="text-on-surface">{workflow.currentWorker}</b></span>}
                <span>Retry: <b className="text-on-surface">{workflow.retryCount}</b></span>
                <span>Versi eksekusi: <b className="text-on-surface">{workflow.executionVersion}</b></span>
              </div>
            )}
          </div>

          {/* Stages — real persisted stages */}
          <div className="flex flex-col gap-2">
            {(workflow?.stages ?? []).map((s) => (
              <div
                key={s.id}
                className="flex items-center gap-3 p-3 rounded-md border border-outline-variant bg-surface"
              >
                <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${stageChipClass(s.status)}`}>
                  {STAGE_ICON[s.status]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-on-surface">{stageLabel(s.stageName)}</div>
                  {s.errorMessage && <div className="text-[11px] text-error truncate">{s.errorMessage}</div>}
                </div>
                <div className="text-right shrink-0">
                  <div className="text-[11px] font-medium text-on-surface-variant capitalize">{s.status}</div>
                  {s.durationMs != null && <div className="text-[10px] text-on-surface-variant">{formatDuration(s.durationMs)}</div>}
                  {s.retryCount > 0 && <div className="text-[10px] text-tertiary">retry ×{s.retryCount}</div>}
                </div>
              </div>
            ))}
            {!workflow && (
              <div className="flex items-center gap-2 text-sm text-on-surface-variant py-6 justify-center">
                <Loader2 className="size-4 animate-spin" /> Memuat status inisialisasi…
              </div>
            )}
          </div>

          {/* Event timeline — persisted workflow events only */}
          {events.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold text-on-surface-variant uppercase tracking-wide mb-2">Linimasa Kejadian</h3>
              <ul className="flex flex-col gap-1.5 max-h-48 overflow-y-auto pr-1">
                {events.map((ev) => {
                  const sev = eventSeverity(ev.type);
                  const dot =
                    sev === "success" ? "bg-secondary" : sev === "error" ? "bg-error" : sev === "warning" ? "bg-tertiary" : "bg-primary";
                  return (
                    <li key={ev.id} className="flex items-start gap-2 text-xs">
                      <span className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${dot}`} />
                      <span className="text-on-surface">{eventTitle(ev)}</span>
                      <span className="text-on-surface-variant ml-auto shrink-0">
                        {new Date(ev.createdAt).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          {error && <p className="text-xs text-error">{error}</p>}

          {/* Actions */}
          {status === "failed" && (
            <div className="flex justify-end gap-3">
              <button
                onClick={retry}
                className="px-5 py-2.5 text-sm font-medium bg-primary text-on-primary hover:bg-surface-tint rounded-md flex items-center gap-2"
              >
                <RotateCcw className="size-4" /> Coba Lagi
              </button>
            </div>
          )}
          {status === "completed" && (
            <div className="flex justify-end">
              <button
                onClick={() => router.replace("/dashboard")}
                className="px-6 py-2.5 text-sm font-medium bg-primary text-on-primary hover:bg-surface-tint rounded-md flex items-center gap-2"
              >
                Masuk ke Dasbor <ArrowRight className="size-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
