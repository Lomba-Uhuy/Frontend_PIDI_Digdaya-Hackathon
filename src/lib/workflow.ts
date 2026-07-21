import { apiGet, apiPost, isLive } from "./http";
import type { ActivityEvent } from "./api";

// ── Product Initialization Workflow — read-only client over the backend engine ──
// Every value here originates from persisted backend state (product_workflow /
// workflow_stage / workflow_event). The frontend NEVER fabricates progress,
// percentages, stages, or events — it only renders what the engine recorded.

export type WorkflowStatus = "queued" | "running" | "completed" | "failed";
export type StageStatus =
  | "queued"
  | "running"
  | "completed"
  | "failed"
  | "retrying"
  | "skipped";

export interface WorkflowStage {
  id: string;
  workflowId: string;
  stageName: string;
  sequence: number;
  status: StageStatus;
  workerName: string | null;
  jobId: string | null;
  retryCount: number;
  durationMs: number | null;
  errorMessage: string | null;
  metadata: Record<string, unknown> | null;
  startedAt: string | null;
  finishedAt: string | null;
}

export interface WorkflowEvent {
  id: string;
  workflowId: string;
  type: string;
  stageName: string | null;
  message: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

export interface ProductWorkflow {
  id: string;
  productId: string;
  umkmId: string;
  workflowType: string;
  status: WorkflowStatus;
  currentStage: string | null;
  retryCount: number;
  failureReason: string | null;
  currentWorker: string | null;
  executionVersion: number;
  startedAt: string | null;
  finishedAt: string | null;
  createdAt: string;
  updatedAt: string;
  stages: WorkflowStage[];
  progress: { completed: number; total: number; percent: number };
}

/** Full workflow (status + stages + backend-computed progress). */
export async function getWorkflow(productId: string): Promise<ProductWorkflow | null> {
  if (!isLive()) return null;
  try {
    return await apiGet<ProductWorkflow>(`/products/${productId}/workflow`);
  } catch (e) {
    const status = (e as { status?: number }).status;
    if (status === 404) return null; // workflow not created yet
    throw e;
  }
}

export async function getWorkflowStages(productId: string): Promise<WorkflowStage[]> {
  if (!isLive()) return [];
  try {
    return await apiGet<WorkflowStage[]>(`/products/${productId}/workflow/stages`);
  } catch {
    return [];
  }
}

export async function getWorkflowEvents(productId: string): Promise<WorkflowEvent[]> {
  if (!isLive()) return [];
  try {
    return await apiGet<WorkflowEvent[]>(`/products/${productId}/workflow/events`);
  } catch {
    return [];
  }
}

/** Start / retry the initialization workflow (idempotent on the backend). */
export async function startWorkflow(productId: string): Promise<ProductWorkflow | null> {
  if (!isLive()) return null;
  try {
    return await apiPost<ProductWorkflow>(`/products/${productId}/workflow`, {});
  } catch (e) {
    console.warn("startWorkflow failed:", e);
    return null;
  }
}

export const isTerminal = (s: WorkflowStatus | undefined | null): boolean =>
  s === "completed" || s === "failed";

// ── Presentation helpers (labels only — no computed progress) ─────────────────
const STAGE_LABELS: Record<string, string> = {
  hs_classification: "Klasifikasi HS Code",
  embedding: "Pembuatan Embedding",
  buyer_sync: "Sinkronisasi Pembeli",
  buyer_matching: "Pencocokan Pembeli",
  market_intelligence: "Intelijen Pasar",
  export_readiness: "Kesiapan Ekspor",
  dashboard_bootstrap: "Persiapan Dasbor",
};
export const stageLabel = (name: string): string =>
  STAGE_LABELS[name] ?? name.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

const EVENT_LABELS: Record<string, string> = {
  WorkflowStarted: "Inisialisasi produk dimulai",
  StageStarted: "Tahap dimulai",
  StageCompleted: "Tahap selesai",
  StageFailed: "Tahap gagal",
  RetryScheduled: "Percobaan ulang dijadwalkan",
  WorkflowCompleted: "Inisialisasi produk selesai",
  WorkflowFailed: "Inisialisasi produk gagal",
};
export const eventLabel = (type: string): string => EVENT_LABELS[type] ?? type;

/** Human-friendly one-line description for an event (uses stage label when present). */
export function eventTitle(ev: WorkflowEvent): string {
  const base = eventLabel(ev.type);
  if (ev.stageName && (ev.type === "StageStarted" || ev.type === "StageCompleted" || ev.type === "StageFailed" || ev.type === "RetryScheduled")) {
    const verb =
      ev.type === "StageCompleted" ? "selesai" :
      ev.type === "StageFailed" ? "gagal" :
      ev.type === "RetryScheduled" ? "diulang" : "dimulai";
    return `${stageLabel(ev.stageName)} ${verb}`;
  }
  return base;
}

export const eventSeverity = (type: string): "info" | "success" | "warning" | "error" => {
  if (type === "WorkflowCompleted" || type === "StageCompleted") return "success";
  if (type === "WorkflowFailed" || type === "StageFailed") return "error";
  if (type === "RetryScheduled") return "warning";
  return "info";
};

// ── Bridge to the shared Activity/Notification feed (persisted events only) ────
// Workflow events are backend-persisted; mapping them into the ActivityEvent shape
// lets the existing Activity Timeline + Notifications render them WITHOUT any
// frontend-generated content.
const ACTIVITY_EVENT_TYPES = new Set([
  "WorkflowStarted",
  "StageCompleted",
  "StageFailed",
  "RetryScheduled",
  "WorkflowCompleted",
  "WorkflowFailed",
]);
// Stages worth a proactive notification when they complete.
const NOTIFY_STAGES = new Set(["buyer_sync", "market_intelligence", "export_readiness"]);

function mapEvent(productId: string, ev: WorkflowEvent): ActivityEvent {
  return {
    id: `wf-${ev.id}`,
    category: "product",
    type: ev.type,
    severity: eventSeverity(ev.type),
    title: eventTitle(ev),
    description: ev.message ?? (ev.stageName ? stageLabel(ev.stageName) : "Inisialisasi produk"),
    entity: "workflow",
    entityId: productId,
    actor: "workflow-orchestrator",
    status: ev.type,
    timestamp: ev.createdAt,
    link: "/workflow",
  };
}

/** Persisted workflow events mapped for the Activity Timeline (P6). */
export async function getWorkflowActivity(productId: string): Promise<ActivityEvent[]> {
  const events = await getWorkflowEvents(productId);
  return events.filter((e) => ACTIVITY_EVENT_TYPES.has(e.type)).map((e) => mapEvent(productId, e));
}

/** Persisted workflow events mapped for Notifications (P7) — the notable subset. */
export async function getWorkflowNotifications(productId: string): Promise<ActivityEvent[]> {
  const events = await getWorkflowEvents(productId);
  return events
    .filter(
      (e) =>
        e.type === "WorkflowStarted" ||
        e.type === "WorkflowCompleted" ||
        e.type === "WorkflowFailed" ||
        e.type === "RetryScheduled" ||
        (e.type === "StageCompleted" && e.stageName != null && NOTIFY_STAGES.has(e.stageName)),
    )
    .map((e) => mapEvent(productId, e));
}

export function formatDuration(ms: number | null | undefined): string {
  if (ms == null) return "—";
  if (ms < 1000) return `${ms} ms`;
  const s = ms / 1000;
  if (s < 60) return `${s.toFixed(s < 10 ? 2 : 1)} dtk`;
  const m = Math.floor(s / 60);
  return `${m}m ${Math.round(s % 60)}s`;
}
