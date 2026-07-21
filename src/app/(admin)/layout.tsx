"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard, Users, Building2, Package, Workflow, ScanText, Server,
  Activity, CreditCard, Database, Settings, ScrollText, Loader2, ShieldAlert, LogOut,
} from "lucide-react";
import { hasSession, logout } from "../../lib/auth";
import { getRole } from "../../lib/entitlements";
import { Logo } from "../../components/ui/logo";

// Functional nav — each item maps 1:1 to a real page backed by a live admin API.
// No duplicates, no dead links.
const NAV: Array<{ label: string; href: string; icon: React.ElementType }> = [
  { label: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
  { label: "Users", href: "/admin/users", icon: Users },
  { label: "Companies", href: "/admin/companies", icon: Building2 },
  { label: "Products", href: "/admin/products", icon: Package },
  { label: "AI Workflows", href: "/admin/workflows", icon: Workflow },
  { label: "Subscriptions", href: "/admin/subscriptions", icon: CreditCard },
  { label: "Providers & Health", href: "/admin/providers", icon: Server },
  { label: "Activity", href: "/admin/activity", icon: Activity },
  { label: "Audit Logs", href: "/admin/audit", icon: ScrollText },
];

// Planned modules — intentionally disabled (no backend module yet). Shown so the
// operational roadmap is visible, but they never route to an unfinished page.
const PLANNED: Array<{ label: string; icon: React.ElementType }> = [
  { label: "OCR Jobs", icon: ScanText },
  { label: "Database", icon: Database },
  { label: "Settings", icon: Settings },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [gate, setGate] = useState<"checking" | "ok" | "denied">("checking");

  useEffect(() => {
    if (!hasSession()) {
      router.replace("/login");
      return;
    }
    // UI gate only — the backend enforces the admin role on every request.
    setGate(getRole() === "admin" ? "ok" : "denied");
  }, [router]);

  if (gate === "checking") {
    return (
      <div className="h-screen w-full flex items-center justify-center gap-2 bg-surface-bright text-on-surface-variant">
        <Loader2 className="size-5 animate-spin" /> Memeriksa akses admin…
      </div>
    );
  }
  if (gate === "denied") {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center gap-4 bg-surface-bright text-on-surface px-6 text-center">
        <ShieldAlert className="size-10 text-error" />
        <div>
          <h1 className="text-xl font-bold">Akses ditolak</h1>
          <p className="text-sm text-on-surface-variant mt-1">Halaman ini hanya untuk administrator.</p>
        </div>
        <Link href="/dashboard" className="px-4 py-2 rounded-md bg-surface-container-high hover:bg-surface-container-highest text-sm">
          Kembali ke Dasbor
        </Link>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full bg-surface-bright text-on-surface">
      {/* Admin sidebar — visually distinct from the UMKM app */}
      <aside className="w-60 shrink-0 border-r border-outline-variant bg-surface-container-lowest flex flex-col">
        <div className="px-4 py-4 border-b border-outline-variant flex items-center gap-2">
          <Logo size={24} />
          <span className="font-bold tracking-tight">TradeConnect <span className="text-primary">Admin</span></span>
        </div>
        <nav className="flex-1 overflow-y-auto py-2">
          {NAV.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.label}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-2 text-sm transition-colors ${
                  active ? "bg-surface-container-high text-on-surface border-l-2 border-primary" : "text-on-surface-variant hover:bg-surface-container-high/60 hover:text-on-surface"
                }`}
              >
                <item.icon className="size-4 shrink-0" />
                <span className="truncate">{item.label}</span>
              </Link>
            );
          })}
          {/* Planned modules — intentionally disabled, never route anywhere. */}
          <div className="mt-3 px-4 pt-3 border-t border-outline-variant/70">
            <div className="text-[9px] uppercase tracking-wider text-on-surface-variant mb-1">Segera hadir</div>
          </div>
          {PLANNED.map((item) => (
            <div key={item.label} className="flex items-center gap-3 px-4 py-2 text-sm text-on-surface-variant cursor-not-allowed select-none" aria-disabled>
              <item.icon className="size-4 shrink-0" />
              <span className="truncate">{item.label}</span>
            </div>
          ))}
        </nav>
        <button
          onClick={() => logout()}
          className="m-3 flex items-center justify-center gap-2 rounded-md bg-surface-container-high hover:bg-surface-container-highest py-2 text-sm"
        >
          <LogOut className="size-4" /> Keluar
        </button>
      </aside>
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  );
}
