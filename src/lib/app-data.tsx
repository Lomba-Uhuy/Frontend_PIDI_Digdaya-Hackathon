"use client";
import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { getMyUmkm, type UmkmResponse } from "./entities";
import { apiGet } from "./http";
import { getStoredIds } from "./entities";

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
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

const AppDataContext = createContext<AppDataValue | null>(null);

export function AppDataProvider({ children }: { children: React.ReactNode }) {
  const [company, setCompany] = useState<UmkmResponse | null>(null);
  const [product, setProduct] = useState<AppProduct | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const umkm = await getMyUmkm();
      setCompany(umkm);
      const umkmId = umkm?.id ?? getStoredIds().umkmId;
      if (umkmId) {
        const products = await apiGet<AppProduct[]>(`/umkm/${umkmId}/products`).catch(() => [] as AppProduct[]);
        setProduct(Array.isArray(products) && products.length > 0 ? products[0] : null);
      } else {
        setProduct(null);
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

  return (
    <AppDataContext.Provider value={{ company, product, loading, error, refresh: load }}>
      {children}
    </AppDataContext.Provider>
  );
}

/** Centralized server-driven Company + Product state. Throws if used outside the provider. */
export function useAppData(): AppDataValue {
  const ctx = useContext(AppDataContext);
  if (!ctx) throw new Error("useAppData must be used within <AppDataProvider>");
  return ctx;
}
