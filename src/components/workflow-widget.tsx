"use client";
import { useEffect, useRef } from "react";
import Link from "next/link";
import { ArrowRight, CheckCircle2, Cpu, Loader2, RotateCcw, XCircle } from "lucide-react";
import { useAppData } from "../lib/app-data";
import { isTerminal, stageLabel, formatDuration } from "../lib/workflow";

const POLL_MS = 3000;

/**
 * Dashboard "Product Workflow" widget. Renders ONLY persisted workflow state from
 * AppDataProvider; while the workflow is still running it re-fetches (cheap) so the
 * card stays live without duplicating the initialization screen's logic.
 */
export function WorkflowWidget() {
  const { workflow, productId, refreshWorkflow } = useAppData();
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!productId || !workflow || isTerminal(workflow.status)) return;
    const tick = async () => {
      const wf = await refreshWorkflow();
      if (wf && !isTerminal(wf.status)) timer.current = setTimeout(tick, POLL_MS);
    };
    timer.current = setTimeout(tick, POLL_MS);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [productId, workflow, refreshWorkflow]);

  if (!productId) return null;

  const status = workflow?.status;
  const percent = workflow?.progress.percent ?? 0;
  const completed = workflow?.progress.completed ?? 0;
  const total = workflow?.progress.total ?? 7;
  const running = workflow?.stages.find((s) => s.status === "running" || s.status === "retrying");
  const failed = workflow?.stages.find((s) => s.status === "failed");

  const totalDurationMs = (workflow?.stages ?? []).reduce((sum, s) => sum + (s.durationMs ?? 0), 0);

  const badge =
    status === "completed"
      ? { icon: <CheckCircle2 className="size-4" />, cls: "bg-secondary/15 text-secondary", label: "Selesai" }
      : status === "failed"
        ? { icon: <XCircle className="size-4" />, cls: "bg-error/15 text-error", label: "Gagal" }
        : status === "running"
          ? { icon: <Loader2 className="size-4 animate-spin" />, cls: "bg-primary/15 text-primary", label: "Berjalan" }
          : { icon: <Cpu className="size-4" />, cls: "bg-surface-variant text-on-surface-variant", label: "Antre" };

  return (
    <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5 shadow-sm flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Cpu className="text-primary size-5" />
          <h3 className="text-base font-semibold text-on-surface">Inisialisasi Produk</h3>
        </div>
        <span className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-1 rounded-full ${badge.cls}`}>
          {badge.icon} {badge.label}
        </span>
      </div>

      {!workflow ? (
        <p className="text-sm text-on-surface-variant">Belum ada workflow inisialisasi untuk produk ini.</p>
      ) : (
        <>
          <div>
            <div className="flex justify-between items-center mb-1.5 text-xs">
              <span className="text-on-surface-variant">{completed} / {total} tahap</span>
              <span className="font-mono-data font-semibold text-primary">{percent}%</span>
            </div>
            <div className="w-full h-2 bg-surface-variant rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-500 ${status === "failed" ? "bg-error" : status === "completed" ? "bg-secondary" : "bg-primary"}`}
                style={{ width: `${percent}%` }}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
            <Info label="Tahap berjalan" value={running ? stageLabel(running.stageName) : status === "completed" ? "—" : "—"} />
            <Info label="Tahap gagal" value={failed ? stageLabel(failed.stageName) : "—"} tone={failed ? "error" : undefined} />
            <Info label="Durasi eksekusi" value={formatDuration(totalDurationMs)} />
            <Info label="Retry" value={String(workflow.retryCount)} />
            <Info label="Versi eksekusi" value={String(workflow.executionVersion)} />
            <Info
              label="Eksekusi terakhir"
              value={workflow.finishedAt ? new Date(workflow.finishedAt).toLocaleString("id-ID", { dateStyle: "short", timeStyle: "short" }) : "—"}
            />
          </div>

          {failed && workflow.failureReason && (
            <p className="text-[11px] text-error flex items-start gap-1.5">
              <RotateCcw className="size-3.5 mt-0.5 shrink-0" /> {workflow.failureReason}
            </p>
          )}
        </>
      )}

      <Link
        href="/workflow"
        className="mt-auto inline-flex items-center justify-center gap-2 text-xs font-medium text-primary hover:bg-surface rounded-md py-2 border border-outline-variant transition-colors"
      >
        Lihat Detail Workflow <ArrowRight className="size-3.5" />
      </Link>
    </div>
  );
}

function Info({ label, value, tone }: { label: string; value: string; tone?: "error" }) {
  return (
    <div>
      <div className="text-on-surface-variant">{label}</div>
      <div className={`font-medium ${tone === "error" ? "text-error" : "text-on-surface"} truncate`} title={value}>
        {value}
      </div>
    </div>
  );
}
