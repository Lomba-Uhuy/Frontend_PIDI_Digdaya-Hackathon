import { Product } from "./models/product";
import { getStoredIds } from "./entities";

export interface CompletenessSection {
  key: string;
  label: string;
  done: boolean;
  hint: string;
}

export interface Completeness {
  percent: number;
  done: number;
  total: number;
  sections: CompletenessSection[];
  missing: CompletenessSection[];
  nextAction: CompletenessSection | null;
}

/**
 * Real completeness/validation engine — every section is evaluated against an
 * ACTUAL persisted product field (localStorage `Product` + backend product id).
 * No fabricated scores; a section is "done" only when its real data exists.
 */
export function computeCompleteness(p: Product | null): Completeness {
  const ids = getStoredIds();
  const hasEmbedding = Boolean(ids.productId); // saved to backend → embedded/indexed
  const sections: CompletenessSection[] = p
    ? [
        {
          key: "product_info",
          label: "Informasi Produk",
          done: Boolean(p.name && p.description),
          hint: "Lengkapi nama & deskripsi produk",
        },
        { key: "hs", label: "Klasifikasi HS", done: Boolean(p.hsCode), hint: "Jalankan klasifikasi HS (RAG)" },
        {
          key: "ai_analysis",
          label: "Analisis AI (kandidat HS)",
          done: (p.hsCandidates?.length ?? 0) > 0,
          hint: "Verifikasi produk untuk menjalankan analisis AI",
        },
        {
          key: "embedding",
          label: "Embedding / Indeks",
          done: hasEmbedding,
          hint: "Simpan produk ke backend agar dapat diindeks untuk pencocokan",
        },
        { key: "capacity", label: "Kapasitas Produksi", done: Boolean(p.capacity), hint: "Isi kapasitas produksi bulanan" },
        { key: "moq", label: "MOQ", done: Boolean(p.moq), hint: "Tentukan minimum order quantity" },
        {
          key: "pricing",
          label: "Harga (dasar & penawaran)",
          done: p.floorPriceUsd != null && p.askingPriceUsd != null,
          hint: "Tetapkan harga dasar & harga penawaran",
        },
        { key: "company", label: "Informasi Perusahaan", done: Boolean(p.companyName), hint: "Lengkapi nama perusahaan" },
        { key: "nib", label: "NIB / Legalitas", done: Boolean(p.nib), hint: "Daftarkan Nomor Induk Berusaha (NIB)" },
      ]
    : [];

  const done = sections.filter((s) => s.done).length;
  const total = sections.length;
  const missing = sections.filter((s) => !s.done);
  return {
    percent: total > 0 ? Math.round((done / total) * 100) : 0,
    done,
    total,
    sections,
    missing,
    nextAction: missing[0] ?? null,
  };
}
