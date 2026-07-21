"use client";
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { getMyUmkm, type UmkmResponse } from "./entities";
import { apiGet } from "./http";
import { getStoredIds } from "./entities";
import { getWorkflow, type ProductWorkflow } from "./workflow";
import { buildProductView, EMPTY_PRODUCT_VIEW, type ProductView } from "./product-view";
import { getSubscription, getRole, type Subscription } from "./entitlements";

// Centralized, server-driven Company + Product state — the single frontend source
// of truth for these business entities. Data is fetched ONCE from the backend
// (deduplicated) and held in memory (never localStorage). `refresh()` re-fetches
// for background refresh / cache invalidation after mutations.

export interface AppProduct {
  id: string;
  umkmId: string;
  name: string;
  description?: string;
  hsCode?: string | null;
  hsConfidence?: string | null;
  moq?: number;
  monthlyCapacity?: number;
  priceMin?: string;
  priceMax?: string;
  [key: string]: unknown;
}

interface AppDataValue {
  company: UmkmResponse | null;
  product: AppProduct | null;
  productId: string | null;
  /** Backend-sourced, normalized product (replaces the old localStorage model). */
  productView: ProductView;
  workflow: ProductWorkflow | null;
  /** Backend-owned RBAC + subscription (authoritative; UI gating only). */
  subscription: Subscription | null;
  role: string;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  /** Re-fetch only the workflow (cheap; used by the widget / details polling). */
  refreshWorkflow: () => Promise<ProductWorkflow | null>;
}

const AppDataContext = createContext<AppDataValue | null>(null);

export function AppDataProvider({ children }: { children: React.ReactNode }) {
  const [company, setCompany] = useState<UmkmResponse | null>(null);
  const [product, setProduct] = useState<AppProduct | null>(null);
  const [productId, setProductId] = useState<string | null>(null);
  const [workflow, setWorkflow] = useState<ProductWorkflow | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [role, setRole] = useState<string>("umkm");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshWorkflow = useCallback(async (): Promise<ProductWorkflow | null> => {
    const pid = productId;
    if (!pid) return null;
    const wf = await getWorkflow(pid).catch(() => null);
    setWorkflow(wf);
    return wf;
  }, [productId]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Backend-owned authorization: role (from token) + live subscription.
      const role = getRole();
      setRole(role);
      setSubscription(await getSubscription());
      // Admins are platform operators — they own no company/product/workflow.
      // Skip all UMKM data fetches (unnecessary + would 404) for admin sessions.
      if (role === "admin") {
        setCompany(null); setProduct(null); setProductId(null); setWorkflow(null);
        return;
      }
      const umkm = await getMyUmkm();
      setCompany(umkm);
      const umkmId = umkm?.id ?? getStoredIds().umkmId;
      if (umkmId) {
        const products = await apiGet<AppProduct[]>(`/umkm/${umkmId}/products`).catch(() => [] as AppProduct[]);
        const p = Array.isArray(products) && products.length > 0 ? products[0] : null;
        setProduct(p);
        setProductId(p?.id ?? null);
        // Load the persisted workflow once, in the same pass (deduplicated).
        setWorkflow(p?.id ? await getWorkflow(p.id).catch(() => null) : null);
      } else {
        setProduct(null);
        setProductId(null);
        setWorkflow(null);
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const productView = useMemo(
    () => buildProductView(company, product as unknown as Record<string, unknown> | null),
    [company, product],
  );

  return (
    <AppDataContext.Provider
      value={{ company, product, productId, productView, workflow, subscription, role, loading, error, refresh: load, refreshWorkflow }}
    >
      {children}
    </AppDataContext.Provider>
  );
}

/** Centralized server-driven Company + Product + Workflow state. Throws outside the provider. */
export function useAppData(): AppDataValue {
  const ctx = useContext(AppDataContext);
  if (!ctx) throw new Error("useAppData must be used within <AppDataProvider>");
  return ctx;
}

/**
 * Backend-sourced product view (replaces the old localStorage `Product` model).
 * Always returns a non-null view; empty until the backend data loads.
 */
export function useProductView(): ProductView {
  const ctx = useContext(AppDataContext);
  return ctx?.productView ?? EMPTY_PRODUCT_VIEW;
}

/** Backend-owned subscription entitlements (flags/quotas). UI gating only. */
export function useEntitlements() {
  const ctx = useContext(AppDataContext);
  return ctx?.subscription?.entitlements ?? null;
}

/** True if the caller's plan unlocks the given feature flag (UI hint). */
export function useHasFeature(feature: string): boolean {
  return Boolean(useEntitlements()?.flags?.[feature]);
}

/** RBAC role of the caller (UI menu gating; backend enforces the real gate). */
export function useRole(): string {
  const ctx = useContext(AppDataContext);
  return ctx?.role ?? "umkm";
}
