import { classifyHs, HsCandidate, HsClassification } from "../entities";

/**
 * Base class for browser-persisted domain models.
 *
 * Concrete subclasses declare their own `storageKey` and (de)serialisation; this
 * base centralises the localStorage plumbing so a model can be loaded, viewed and
 * edited as a plain object (`Model.current()`, `model.update({...})`, `model.save()`).
 */
export abstract class PersistedModel {
  /** localStorage key under which this model's JSON blob is stored. */
  protected abstract readonly storageKey: string;

  /** Serialisable snapshot of the model. */
  abstract toJSON(): Record<string, unknown>;

  /** Persist the model. Subclasses may override to also mirror legacy keys. */
  save(): void {
    if (typeof window === "undefined") return;
    localStorage.setItem(this.storageKey, JSON.stringify(this.toJSON()));
  }

  /** Remove the persisted blob. */
  clear(): void {
    if (typeof window === "undefined") return;
    localStorage.removeItem(this.storageKey);
  }

  protected static readJSON(key: string): Record<string, unknown> | null {
    if (typeof window === "undefined") return null;
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as Record<string, unknown>;
    } catch {
      return null;
    }
  }
}

/** Editable business fields of a product. */
export interface ProductFields {
  id: string | null;
  name: string;
  description: string;
  productType: string; // "coffee" | "rattan" | ...
  companyName: string;
  nib: string;
  moq: string;
  capacity: string;
  logistics: string;
  floorPriceUsd: number | null;
  askingPriceUsd: number | null;
}

/**
 * The user's product — the single source of truth for product data AND the cached
 * result of the semantic (RAG) HS-code classification. Because the classification
 * is expensive, it is computed once (at verification) and cached here so every
 * later screen (e.g. Market Intelligence) can read the relevant HS chapters with
 * no waiting.
 */
export class Product extends PersistedModel implements ProductFields {
  static readonly STORAGE_KEY = "tradeconnect_product";
  protected readonly storageKey = Product.STORAGE_KEY;

  // ── Business fields ─────────────────────────────────────────────────────────
  id: string | null = null;
  name = "";
  description = "";
  productType = "";
  companyName = "";
  nib = "";
  moq = "";
  capacity = "";
  logistics = "";
  floorPriceUsd: number | null = null;
  askingPriceUsd: number | null = null;

  // ── Cached RAG HS classification (ordered most → least relevant) ─────────────
  hsCode = "";
  hsConfidence: number | null = null;
  hsCategory = "";
  hsCandidates: HsCandidate[] = [];
  hsClassifiedAt: number | null = null;

  constructor(init: Partial<ProductFields> = {}) {
    super();
    Object.assign(this, init);
  }

  // ── Persistence ─────────────────────────────────────────────────────────────
  /** Load the current product: consolidated blob first, else legacy keys. */
  static current(): Product {
    const data = PersistedModel.readJSON(Product.STORAGE_KEY);
    if (data) {
      const p = Product.fromJSON(data);
      // The backend product UUID is written to the legacy key after onboarding's
      // first save — backfill it so the object always carries the real id.
      if (!p.id && typeof window !== "undefined") {
        p.id = localStorage.getItem("tradeconnect_product_id");
      }
      return p;
    }

    // Back-compat: hydrate from the individual keys older sessions wrote so the
    // model works even before the first `save()` under the new schema.
    const p = new Product();
    if (typeof window !== "undefined") {
      p.id = localStorage.getItem("tradeconnect_product_id");
      p.name = localStorage.getItem("tradeconnect_product_name") ?? "";
      p.description = localStorage.getItem("tradeconnect_product_desc") ?? "";
      p.productType = localStorage.getItem("tradeconnect_product_type") ?? "";
      p.companyName = localStorage.getItem("tradeconnect_company_name") ?? "";
      p.nib = localStorage.getItem("tradeconnect_nib") ?? "";
    }
    return p;
  }

  static fromJSON(d: Record<string, unknown>): Product {
    const p = new Product();
    p.id = (d.id as string) ?? null;
    p.name = (d.name as string) ?? "";
    p.description = (d.description as string) ?? "";
    p.productType = (d.productType as string) ?? "";
    p.companyName = (d.companyName as string) ?? "";
    p.nib = (d.nib as string) ?? "";
    p.moq = (d.moq as string) ?? "";
    p.capacity = (d.capacity as string) ?? "";
    p.logistics = (d.logistics as string) ?? "";
    p.floorPriceUsd = (d.floorPriceUsd as number) ?? null;
    p.askingPriceUsd = (d.askingPriceUsd as number) ?? null;
    p.hsCode = (d.hsCode as string) ?? "";
    p.hsConfidence = (d.hsConfidence as number) ?? null;
    p.hsCategory = (d.hsCategory as string) ?? "";
    p.hsCandidates = Array.isArray(d.hsCandidates) ? (d.hsCandidates as HsCandidate[]) : [];
    p.hsClassifiedAt = (d.hsClassifiedAt as number) ?? null;
    return p;
  }

  toJSON(): Record<string, unknown> {
    return {
      id: this.id,
      name: this.name,
      description: this.description,
      productType: this.productType,
      companyName: this.companyName,
      nib: this.nib,
      moq: this.moq,
      capacity: this.capacity,
      logistics: this.logistics,
      floorPriceUsd: this.floorPriceUsd,
      askingPriceUsd: this.askingPriceUsd,
      hsCode: this.hsCode,
      hsConfidence: this.hsConfidence,
      hsCategory: this.hsCategory,
      hsCandidates: this.hsCandidates,
      hsClassifiedAt: this.hsClassifiedAt,
    };
  }

  /** Persist the blob AND mirror the individual keys many components still read. */
  override save(): void {
    super.save();
    if (typeof window === "undefined") return;
    if (this.name) localStorage.setItem("tradeconnect_product_name", this.name);
    if (this.description) localStorage.setItem("tradeconnect_product_desc", this.description);
    if (this.productType) localStorage.setItem("tradeconnect_product_type", this.productType);
    if (this.id) localStorage.setItem("tradeconnect_product_id", this.id);
    if (this.companyName) localStorage.setItem("tradeconnect_company_name", this.companyName);
    if (this.nib) localStorage.setItem("tradeconnect_nib", this.nib);
  }

  // ── View / edit ─────────────────────────────────────────────────────────────
  /** Chainable field update. Call `.save()` to persist. */
  update(patch: Partial<ProductFields>): this {
    Object.assign(this, patch);
    return this;
  }

  // ── Cached RAG HS classification ─────────────────────────────────────────────
  hasHsClassification(): boolean {
    return this.hsCandidates.length > 0;
  }

  /** Store a classification result, ordered most → least relevant by confidence. */
  setHsClassification(cls: HsClassification): this {
    const raw: HsCandidate[] =
      Array.isArray(cls.top_k) && cls.top_k.length > 0
        ? [...cls.top_k]
        : [
            {
              hs_code: cls.hs_code,
              description: cls.description,
              confidence: cls.confidence,
              category: cls.category,
            },
          ];
    // Highest confidence (most relevant) first.
    raw.sort((a, b) => (b.confidence ?? 0) - (a.confidence ?? 0));
    this.hsCandidates = raw;
    this.hsCode = cls.hs_code || raw[0]?.hs_code || this.hsCode;
    this.hsConfidence = cls.confidence ?? raw[0]?.confidence ?? null;
    this.hsCategory = cls.category ?? raw[0]?.category ?? "";
    this.hsClassifiedAt = Date.now();
    return this;
  }

  /** Unique 2-digit HS chapters from the cached candidates, most-relevant first. */
  relevantChapters(): string[] {
    const seen: string[] = [];
    for (const c of this.hsCandidates) {
      const ch = (c.hs_code || "").replace(/\D/g, "").slice(0, 2);
      if (ch && !seen.includes(ch)) seen.push(ch);
    }
    return seen;
  }

  /**
   * Return the cached RAG candidates. Classifies once (and caches) ONLY if the
   * cache is empty — so screens that need the HS codes never re-analyse when the
   * product was already classified at verification time.
   */
  async ensureHsClassification(topK = 6): Promise<HsCandidate[]> {
    if (this.hasHsClassification()) return this.hsCandidates;
    const desc = this.description || this.name;
    if (!desc) return this.hsCandidates;
    const cls = await classifyHs(desc, topK);
    if (cls) {
      this.setHsClassification(cls);
      this.save();
    }
    return this.hsCandidates;
  }
}
