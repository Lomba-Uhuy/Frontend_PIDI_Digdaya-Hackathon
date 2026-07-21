"use client";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { getAdminActivity } from "../../../../lib/admin";

const sev: Record<string, string> = {
  WorkflowCompleted: "text-secondary", StageCompleted: "text-secondary",
  WorkflowFailed: "text-error", StageFailed: "text-error", RetryScheduled: "text-primary",
};

export default function AdminActivity() {
  const [rows, setRows] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => { getAdminActivity(60).then((r) => { setRows(r.items); setLoading(false); }); }, []);

  return (
    <div className="p-6 md:p-8 space-y-4">
      <div><h1 className="text-2xl font-bold">Activity Center</h1><p className="text-sm text-on-surface-variant mt-1">Kejadian workflow lintas seluruh platform (persisted).</p></div>
      {loading ? <div className="text-on-surface-variant"><Loader2 className="size-5 animate-spin" /></div>
      : rows.length === 0 ? <p className="text-on-surface-variant text-sm">Belum ada aktivitas.</p>
      : (
        <ol className="relative border-l border-outline-variant ml-2 space-y-3">
          {rows.map((e) => (
            <li key={String(e.id)} className="ml-4">
              <span className="absolute -left-1.5 size-3 rounded-full border-2 border-outline-variant bg-surface-container-highest" />
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm">
                  <b className={sev[String(e.type)] ?? "text-on-surface"}>{String(e.type)}</b>
                  <span className="text-on-surface-variant"> {String(e.stage_name ?? "")} · {String(e.company ?? "")} / {String(e.product_name ?? "")}</span>
                </span>
                <span className="text-[11px] text-on-surface-variant shrink-0">{new Date(String(e.created_at)).toLocaleString("id-ID", { dateStyle: "short", timeStyle: "medium" })}</span>
              </div>
              {e.message ? <div className="text-[11px] text-on-surface-variant">{String(e.message)}</div> : null}
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
