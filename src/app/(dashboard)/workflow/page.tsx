"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Cpu,
  Loader2,
  RefreshCw,
  RotateCcw,
  Sparkles,
} from "lucide-react";
import { useAppData } from "../../../lib/app-data";
import {
  getWorkflowEvents,
  startWorkflow,
  stageLabel,
  eventTitle,
  eventSeverity,
  formatDuration,
  isTerminal,
  type WorkflowEvent,
  type StageStatus,
} from "../../../lib/workflow";

const POLL_MS = 3000;

const STATUS_CLS: Record<StageStatus, string> = {
  completed: "bg-secondary/15 text-secondary",
  skipped: "bg-surface-variant text-on-surface-variant",
  running: "bg-primary/15 text-primary",
  retrying: "bg-tertiary/20 text-tertiary",
  failed: "bg-error/15 text-error",
  queued: "bg-surface-variant text-on-surface-variant",
};

const fmtTs = (iso: string | null | undefined): string =>
  iso ? new Date(iso).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "medium" }) : "—";

export default function WorkflowDetailsPage() {
  const { productId, product, workflow, refreshWorkflow, loading } = useAppData();
  const [events, setEvents] = useState<WorkflowEvent[]>([]);
  const [busy, setBusy] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadEvents = useCallback(async () => {
    if (!productId) return;
    setEvents(await getWorkflowEvents(productId));
  }, [productId]);

  useEffect(() => {
    void loadEvents();
  }, [loadEvents]);

  // Live refresh while the workflow is still executing.
  useEffect(() => {
    if (!productId || !workflow || isTerminal(workflow.status)) return;
    const tick = async () => {
      const wf = await refreshWorkflow();
      await loadEvents();
      if (wf && !isTerminal(wf.status)) timer.current = setTimeout(tick, POLL_MS);
    };
    timer.current = setTimeout(tick, POLL_MS);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [productId, workflow, refreshWorkflow, loadEvents]);

  const onRefresh = async () => {
    setBusy(true);
    await refreshWorkflow();
    await loadEvents();
    setBusy(false);
  };

  const onRetry = async () => {
    if (!productId) return;
    setBusy(true);
    await startWorkflow(productId);
    await refreshWorkflow();
    await loadEvents();
    setBusy(false);
  };

  // Persisted AI artifacts (from the product row the workflow wrote to).
  const p = product as Record<string, unknown> | null;
  const hsCode = (p?.hsCode as string) ?? null;
  const hsConfidence = p?.hsConfidence != null ? Number(p.hsConfidence) : null;
  const hsCandidates = (p?.hsCandidates as Array<{ hs_code: string; description?: string; confidence?: number }>) ?? [];
  const hsModelVersion = (p?.hsModelVersion as string) ?? null;
  const hsClassifiedAt = (p?.hsClassifiedAt as string) ?? null;
  const stageByName = (name: string) => workflow?.stages.find((s) => s.stageName === name);

  return (
    <div className="h-full w-full overflow-y-auto p-4 md:p-8 bg-surface-bright">
      <div className="max-w-5xl mx-auto space-y-6 pb-12">
        {/* Header */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="text-on-surface-variant hover:text-primary p-1.5 rounded-md hover:bg-surface">
              <ArrowLeft className="size-5" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-on-surface font-heading flex items-center gap-2">
                <Cpu className="text-primary size-6" /> Detail Workflow Produk
              </h1>
              <p className="text-sm text-on-surface-variant mt-0.5">
                Lifecycle inisialisasi produk — seluruh data berasal dari backend.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onRefresh}
              disabled={busy}
              className="inline-flex items-center gap-2 text-xs font-medium px-3 py-2 rounded-md border border-outline-variant text-on-surface hover:bg-surface disabled:opacity-50"
            >
              <RefreshCw className={`size-3.5 ${busy ? "animate-spin" : ""}`} /> Segarkan
            </button>
            {workflow?.status === "failed" && (
              <button
                onClick={onRetry}
                disabled={busy}
                className="inline-flex items-center gap-2 text-xs font-medium px-3 py-2 rounded-md bg-primary text-on-primary hover:bg-surface-tint disabled:opacity-50"
              >
                <RotateCcw className="size-3.5" /> Coba Lagi
              </button>
            )}
          </div>
        </div>

        {loading && !workflow ? (
          <div className="flex items-center gap-2 text-sm text-on-surface-variant py-12 justify-center">
            <Loader2 className="size-4 animate-spin" /> Memuat workflow…
          </div>
        ) : !productId ? (
          <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-8 text-center text-sm text-on-surface-variant">
            Belum ada produk. Selesaikan pendaftaran produk untuk memulai inisialisasi.
          </div>
        ) : !workflow ? (
          <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-8 text-center">
            <p className="text-sm text-on-surface-variant mb-4">Workflow inisialisasi belum dibuat untuk produk ini.</p>
            <button onClick={onRetry} disabled={busy} className="px-5 py-2.5 text-sm font-medium bg-primary text-on-primary rounded-md">
              Mulai Inisialisasi
            </button>
          </div>
        ) : (
          <>
            {/* Summary */}
            <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5 shadow-sm">
              <h2 className="text-sm font-semibold text-on-surface-variant uppercase tracking-wide mb-3">Ringkasan</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <Field label="Status" value={workflow.status} strong />
                <Field label="Progres" value={`${workflow.progress.completed}/${workflow.progress.total} (${workflow.progress.percent}%)`} />
                <Field label="Tahap saat ini" value={workflow.currentStage ? stageLabel(workflow.currentStage) : "—"} />
                <Field label="Worker" value={workflow.currentWorker ?? "—"} />
                <Field label="Retry" value={String(workflow.retryCount)} />
                <Field label="Versi eksekusi" value={String(workflow.executionVersion)} />
                <Field label="Dimulai" value={fmtTs(workflow.startedAt)} />
                <Field label="Selesai" value={fmtTs(workflow.finishedAt)} />
              </div>
              {workflow.failureReason && (
                <p className="mt-3 text-xs text-error flex items-start gap-1.5">
                  <RotateCcw className="size-3.5 mt-0.5 shrink-0" /> {workflow.failureReason}
                </p>
              )}
            </div>

            {/* AI Artifacts (persisted) */}
            <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5 shadow-sm">
              <h2 className="text-sm font-semibold text-on-surface-variant uppercase tracking-wide mb-3 flex items-center gap-2">
                <Sparkles className="size-4 text-primary" /> Artefak AI Produk
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-1">
                  <div className="text-xs text-on-surface-variant mb-1">HS Code Utama</div>
                  <div className="text-2xl font-mono-data font-bold text-primary tracking-wider">{hsCode ?? "—"}</div>
                  {hsConfidence != null && (
                    <div className="text-[11px] text-secondary font-medium mt-1">Keyakinan {Math.round(hsConfidence * 100)}%</div>
                  )}
                  <div className="text-[11px] text-on-surface-variant mt-2 space-y-0.5">
                    <div>Model: {hsModelVersion ?? "—"}</div>
                    <div>Diklasifikasi: {fmtTs(hsClassifiedAt)}</div>
                  </div>
                </div>
                <div className="md:col-span-2">
                  <div className="text-xs text-on-surface-variant mb-1">Kandidat HS (Top-K)</div>
                  {hsCandidates.length > 0 ? (
                    <ul className="flex flex-col gap-1">
                      {hsCandidates.slice(0, 5).map((c, i) => (
                        <li key={`${c.hs_code}-${i}`} className="flex items-center gap-2 text-xs bg-surface rounded-md px-2.5 py-1.5 border border-outline-variant">
                          <span className="font-mono-data font-semibold text-on-surface">{c.hs_code}</span>
                          <span className="text-on-surface-variant truncate flex-1">{c.description ?? ""}</span>
                          {c.confidence != null && <span className="text-secondary font-medium shrink-0">{Math.round((c.confidence as number) * 100)}%</span>}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-xs text-on-surface-variant">Belum ada kandidat terklasifikasi.</p>
                  )}
                </div>
              </div>
              {/* Per-stage AI status */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-4">
                {["embedding", "buyer_sync", "market_intelligence", "export_readiness"].map((name) => {
                  const s = stageByName(name);
                  return (
                    <div key={name} className="bg-surface rounded-md px-2.5 py-2 border border-outline-variant">
                      <div className="text-[11px] text-on-surface-variant">{stageLabel(name)}</div>
                      <div className={`text-xs font-medium capitalize inline-block px-1.5 py-0.5 rounded mt-1 ${s ? STATUS_CLS[s.status] : "text-on-surface-variant"}`}>
                        {s?.status ?? "—"}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Stages */}
            <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5 shadow-sm">
              <h2 className="text-sm font-semibold text-on-surface-variant uppercase tracking-wide mb-3">Tahapan Eksekusi</h2>
              <div className="flex flex-col divide-y divide-outline-variant">
                {workflow.stages.map((s) => (
                  <div key={s.id} className="py-3 flex items-start gap-3">
                    <div className="w-7 h-7 rounded-full bg-surface-variant text-on-surface-variant flex items-center justify-center text-xs font-semibold shrink-0">
                      {s.sequence}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium text-on-surface">{stageLabel(s.stageName)}</span>
                        <span className={`text-[11px] font-medium capitalize px-1.5 py-0.5 rounded ${STATUS_CLS[s.status]}`}>{s.status}</span>
                        {s.retryCount > 0 && <span className="text-[10px] text-tertiary">retry ×{s.retryCount}</span>}
                      </div>
                      <div className="flex flex-wrap gap-x-4 gap-y-0.5 mt-1 text-[11px] text-on-surface-variant">
                        {s.workerName && <span>Worker: {s.workerName}</span>}
                        {s.jobId && <span>Job: <span className="font-mono-data">{s.jobId}</span></span>}
                        <span>Durasi: {formatDuration(s.durationMs)}</span>
                        {s.startedAt && <span>Mulai: {fmtTs(s.startedAt)}</span>}
                      </div>
                      {s.errorMessage && <div className="text-[11px] text-error mt-1">{s.errorMessage}</div>}
                      {s.metadata && Object.keys(s.metadata).length > 0 && (
                        <div className="text-[11px] text-on-surface-variant mt-1 font-mono-data bg-surface rounded px-2 py-1 border border-outline-variant overflow-x-auto">
                          {JSON.stringify(s.metadata)}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Events */}
            <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5 shadow-sm">
              <h2 className="text-sm font-semibold text-on-surface-variant uppercase tracking-wide mb-3">Linimasa Kejadian</h2>
              {events.length === 0 ? (
                <p className="text-sm text-on-surface-variant">Belum ada kejadian tercatat.</p>
              ) : (
                <ol className="relative border-l border-outline-variant ml-2 space-y-3">
                  {events.map((ev) => {
                    const sev = eventSeverity(ev.type);
                    const dot =
                      sev === "success" ? "bg-secondary" : sev === "error" ? "bg-error" : sev === "warning" ? "bg-tertiary" : "bg-primary";
                    return (
                      <li key={ev.id} className="ml-4">
                        <span className={`absolute -left-1.5 w-3 h-3 rounded-full border-2 border-surface-container-lowest ${dot}`} />
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-sm text-on-surface">{eventTitle(ev)}</span>
                          <span className="text-[11px] text-on-surface-variant shrink-0">{fmtTs(ev.createdAt)}</span>
                        </div>
                        {ev.message && <div className="text-[11px] text-on-surface-variant">{ev.message}</div>}
                      </li>
                    );
                  })}
                </ol>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function Field({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div>
      <div className="text-xs text-on-surface-variant">{label}</div>
      <div className={`${strong ? "font-semibold capitalize" : "font-medium"} text-on-surface truncate`} title={value}>
        {value}
      </div>
    </div>
  );
}
