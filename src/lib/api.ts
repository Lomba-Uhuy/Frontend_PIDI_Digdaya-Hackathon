import { API_CONFIG } from "./config";
import { apiGet, apiPost, isLive } from "./http";
import { getStoredIds } from "./entities";

export interface DraftReply {
  id: string;
  title: string;
  text: string;
  strategy: string;
}

export interface IntentResponse {
  intent: "inquiry" | "negotiation" | "complaint";
  confidence: number;
}

export interface PricingResponse {
  fob: number;
  cfr: number;
  cif: number;
  marketAvg: number;
  status: "competitive" | "high" | "low";
}

// 1. INTENT CLASSIFIER SERVICE
export async function classifyIntent(text: string): Promise<IntentResponse> {
  if (isLive()) {
    try {
      // Gateway: POST /api/v1/negotiations/classify-intent (JwtAuthGuard)
      // Backend DTO field is `email_text`.
      const raw = await apiPost<{ intent: string; confidence: number }>(
        "/negotiations/classify-intent",
        { email_text: text },
      );
      // Backend may return "spam" — map it into the frontend's 3-class union.
      const intent =
        raw.intent === "inquiry" || raw.intent === "complaint" ? raw.intent : "negotiation";
      return { intent, confidence: raw.confidence ?? 0.85 };
    } catch (e) {
      console.warn("Live backend failed, falling back to mock classifier:", e);
    }
  }

  // High-Fidelity Mock NLP Client-side Classifier
  const lowerText = text.toLowerCase();
  let intent: "inquiry" | "negotiation" | "complaint" = "negotiation"; // default
  let confidence = 0.85;

  if (
    lowerText.includes("salah") ||
    lowerText.includes("kecewa") ||
    lowerText.includes("rusak") ||
    lowerText.includes("lambat") ||
    lowerText.includes("komplain") ||
    lowerText.includes("cacat") ||
    lowerText.includes("klaim") ||
    lowerText.includes("terlambat")
  ) {
    intent = "complaint";
    confidence = 0.92;
  } else if (
    lowerText.includes("tanya") ||
    lowerText.includes("spesifikasi") ||
    lowerText.includes("sertifikat") ||
    lowerText.includes("katalog") ||
    lowerText.includes("mohon info") ||
    lowerText.includes("bagaimana") ||
    lowerText.includes("apakah") ||
    lowerText.includes("dokumen")
  ) {
    intent = "inquiry";
    confidence = 0.88;
  } else if (
    lowerText.includes("harga") ||
    lowerText.includes("tawar") ||
    lowerText.includes("diskon") ||
    lowerText.includes("margin") ||
    lowerText.includes("bayar") ||
    lowerText.includes("dp") ||
    lowerText.includes("lc") ||
    lowerText.includes("revisi") ||
    lowerText.includes("kontainer") ||
    lowerText.includes("cif") ||
    lowerText.includes("fob")
  ) {
    intent = "negotiation";
    confidence = 0.95;
  }

  return { intent, confidence };
}

// 2. RAG AI REPLY GENERATOR SERVICE
export async function generateReply(
  emailContent: string,
  productContext: string,
  floorPrice: number = 2.68
): Promise<{ drafts: DraftReply[] }> {
  if (isLive()) {
    try {
      // Gateway: POST /api/v1/negotiations/generate-reply (JwtAuthGuard)
      // Returns a SINGLE draft { draft_en, intent, warnings, confidence } — adapt
      // it into the { drafts: DraftReply[] } shape the UI renders.
      const raw = await apiPost<{
        draft_en: string;
        intent?: string;
        warnings?: string[];
        confidence?: number;
      }>("/negotiations/generate-reply", {
        // Backend DTO fields: importer_email + product_id (UUID for pricing context).
        // Prefer the real product created during onboarding; fall back to the demo product.
        importer_email: emailContent,
        product_id: getStoredIds().productId || API_CONFIG.demoProductId,
      });
      if (raw?.draft_en) {
        const warn =
          raw.warnings && raw.warnings.length > 0
            ? ` (Catatan guardrail: ${raw.warnings.join("; ")})`
            : "";
        return {
          drafts: [
            {
              id: "draft-live-1",
              title: `Balasan AI (${raw.intent ?? "negotiation"})`,
              strategy: `Dibuat oleh pipeline RAG + LLM backend dengan tingkat keyakinan ${Math.round(
                (raw.confidence ?? 0.85) * 100,
              )}%.${warn}`,
              text: raw.draft_en,
            },
          ],
        };
      }
    } catch (e) {
      console.warn("Live backend failed, falling back to mock reply generator:", e);
    }
  }

  // Dynamic high-fidelity mock replies based on input text & keyword rules
  const lowerText = emailContent.toLowerCase();
  const isRattan = productContext.toLowerCase().includes("rotan") || productContext.toLowerCase().includes("rattan") || productContext.toLowerCase().includes("kursi");
  
  if (isRattan) {
    if (lowerText.includes("45,00") || lowerText.includes("45.00") || lowerText.includes("45")) {
      return {
        drafts: [
          {
            id: "draft-1-comp-rattan",
            title: "Tolak Halus (Kompromi $50.00)",
            strategy: "Tawarkan harga jalan tengah di atas floor price ($45.00/pcs) dengan termin pembayaran aman (30% DP, 70% LC) untuk menjaga kualitas rotan kelas A alami asal Jepara.",
            text: "Terima kasih atas ketertarikan Anda yang luar biasa pada kursi rotan kami. Sayangnya, karena kontrol kualitas yang ketat serta tingkat kerumitan anyaman tangan pengrajin Jepara kami, harga penawaran $45,00/unit berada di bawah batas margin keberlanjutan kami. Sebagai jalan tengah, kami bersedia menawarkan harga khusus $50,00/unit CIF Pelabuhan Hamburg dengan syarat pembayaran 30% Down Payment (DP) dan sisa 70% melalui Letter of Credit (L/C) at sight. Mohon saran jika Anda menyetujui usulan kompromi ini."
          },
          {
            id: "draft-2-vol-rattan",
            title: "Diskon Volume (Nego $48.00)",
            strategy: "Berikan diskon ekstra mendekati floor price ($48.00/pcs) dengan syarat pembeli meningkatkan volume pembelian uji coba menjadi 2 kontainer penuh (300 pcs kursi).",
            text: "Terima kasih atas tanggapan berharga Anda. Kami memahami dinamika pasar furnitur di Jerman saat ini. Kami bersedia menyesuaikan penawaran kami mendekati target Anda, yaitu sebesar $48,00/unit CIF Hamburg, dengan syarat volume pemesanan uji coba ditingkatkan menjadi minimum 2 kontainer penuh (sekitar 300 unit kursi). Hal ini sangat membantu kami mengoptimalkan pengapalan domestik dan pengemasan logistik. Silakan beri tahu kami jika opsi ini dapat disetujui."
          },
          {
            id: "draft-3-fob-rattan",
            title: "Opsi FOB Pelabuhan Semarang ($47.00)",
            strategy: "Kurangi harga secara signifikan dengan mengubah klausul Incoterms dari CIF Hamburg menjadi FOB Tanjung Emas Semarang, memindahkan biaya pengapalan internasional ke pembeli.",
            text: "Salam hangat dari Indonesia. Menanggapi proposal Anda, kami tidak dapat memenuhi CIF Hamburg di harga $45,00/unit. Namun, kami dapat menawarkan opsi alternatif yang sangat hemat: harga $47,00/unit FOB Pelabuhan Tanjung Emas (Semarang). Hal ini memungkinkan tim logistik Anda untuk mengelola pengapalan laut dan asuransi internasional secara mandiri dengan tarif korporat Anda sendiri. Mohon saran jika opsi ini lebih menguntungkan bagi Anda."
          }
        ]
      };
    }

    return {
      drafts: [
        {
          id: "draft-gen-1-rattan",
          title: "Konfirmasi Persetujuan Kontrak",
          strategy: "Kirim pesan terima kasih profesional atas kesepakatan harga dan instruksikan penyusunan kontrak pembelian.",
          text: "Terima kasih atas konfirmasi dan kerjasamanya yang luar biasa. Kami sangat senang kita dapat mencapai kesepakatan bersama yang adil untuk kursi rotan Jepara ini. Kami akan segera menyusun dokumen Proforma Invoice dan Purchase Order resmi di platform TradeConnect agar kita dapat melangkah ke tahap pemeriksaan kepatuhan hukum ekspor serta penandatanganan kontrak."
        },
        {
          id: "draft-gen-2-rattan",
          title: "Tanya Jadwal Pengapalan",
          strategy: "Tanyakan estimasi tanggal kesiapan kapal dan berkoordinasi mengenai detail agen logistik pembeli.",
          text: "Kami menyambut baik kesepakatan ini. Untuk mempersiapkan logistik pergudangan kami di Jepara, Jawa Tengah, mohon informasikan jadwal kedatangan kapal (shipping window) yang Anda targetkan untuk Kuartal 3 ini. Kami juga siap berkoordinasi langsung dengan freight forwarder rujukan Anda."
        }
      ]
    };
  }

  // Custom generated drafts based on buyer's counter-offer or generic replies (Coffee Default)
  if (lowerText.includes("2,50") || lowerText.includes("2.50")) {
    return {
      drafts: [
        {
          id: "draft-1-comp",
          title: "Tolak Halus (Kompromi $2.75)",
          strategy: "Tawarkan harga jalan tengah di atas floor price ($2.68/kg) dengan termin pembayaran aman (30% DP, 70% LC) untuk menjaga kualitas robusta Grade 1 premium.",
          text: "Terima kasih atas ketertarikan Anda. Sayangnya, karena kontrol kualitas yang ketat pada biji kopi robusta premium kami, harga $2,50/kg berada di bawah batas keberlanjutan minimum kami. Sebagai jalan tengah, kami dapat menawarkan harga spesial $2,75/kg CIF Pelabuhan Hamburg dengan struktur pembayaran 30% Down Payment (DP) dan sisa 70% melalui Letter of Credit (L/C). Mohon beri tahu kami jika usulan kompromi ini dapat diterima."
        },
        {
          id: "draft-2-vol",
          title: "Diskon Volume (Nego $2.65)",
          strategy: "Berikan diskon ekstra mendekati floor price ($2.65/kg) dengan syarat pembeli meningkatkan volume pembelian uji coba menjadi 2 kontainer penuh (36 ton).",
          text: "Terima kasih atas tanggapan Anda yang berharga. Kami memahami dinamika pasar di Jerman. Kami bersedia menyesuaikan penawaran harga kami mendekati target Anda, yaitu sebesar $2,65/kg CIF Hamburg, dengan syarat volume pemesanan uji coba ditingkatkan menjadi minimum 2 kontainer penuh (sekitar 36 metrik ton). Hal ini membantu kami menekan biaya pengapalan domestik dan kontainer secara kolektif. Silakan beri tahu kami jika Anda setuju."
        },
        {
          id: "draft-3-fob",
          title: "Opsi FOB Pelabuhan Lokal ($2.55)",
          strategy: "Kurangi harga secara signifikan dengan mengubah klausul Incoterms dari CIF Hamburg menjadi FOB Tanjung Perak, memindahkan biaya freight & asuransi internasional ke pembeli.",
          text: "Salam hangat dari Indonesia. Menanggapi proposal Anda, kami tidak dapat memenuhi CIF Hamburg di harga $2,50/kg. Namun, kami dapat menawarkan opsi alternatif yang sangat hemat: harga $2,55/kg FOB Pelabuhan Tanjung Perak (Surabaya). Hal ini memungkinkan tim logistik Anda untuk mengelola pengapalan laut dan asuransi internasional secara mandiri dengan tarif korporat Anda sendiri. Mohon saran jika opsi ini lebih menguntungkan bagi Anda."
        }
      ]
    };
  }

  // Generik fallback drafts for subsequent messages
  return {
    drafts: [
      {
        id: "draft-gen-1",
        title: "Konfirmasi Persetujuan Kontrak",
        strategy: "Kirim pesan terima kasih profesional atas kesepakatan harga dan instruksikan penyusunan kontrak pembelian.",
        text: "Terima kasih atas konfirmasi dan kerjasamanya yang luar biasa. Kami sangat senang kita dapat mencapai kesepakatan bersama yang adil. Kami akan segera menyusun dokumen Proforma Invoice dan Purchase Order resmi di platform TradeConnect agar kita dapat melangkah ke tahap pemeriksaan kepatuhan hukum ekspor serta penandatanganan kontrak."
      },
      {
        id: "draft-gen-2",
        title: "Tanya Jadwal Pengapalan",
        strategy: "Tanyakan estimasi tanggal kesiapan kapal dan berkoordinasi mengenai detail agen logistik pembeli.",
        text: "Kami menyambut baik kesepakatan ini. Untuk mempersiapkan logistik pergudangan kami di Jawa Timur, mohon informasikan jadwal kedatangan kapal (shipping window) yang Anda targetkan untuk Kuartal 3 ini. Kami juga siap berkoordinasi langsung dengan freight forwarder rujukan Anda."
      }
    ]
  };
}

// 3. EXPORT PRICING CALCULATOR SERVICE
export function calculatePrice(
  hpp: number,             // Harga Pokok Produksi per kg
  margin: number,          // Keuntungan yang diinginkan dalam %
  localHandling: number,   // Biaya domestik (truk, handling, dokumen bea cukai)
  freight: number,         // Ongkos kirim laut internasional per kg
  insurance: number        // Biaya asuransi per kg
): PricingResponse {
  // Matematika Perdagangan Internasional
  // FOB = HPP + Profit Margin + Local Handling
  const profitAmt = hpp * (margin / 100);
  const fob = hpp + profitAmt + localHandling;
  
  // CFR = FOB + Freight Internasional
  const cfr = fob + freight;
  
  // CIF = CFR + Asuransi Internasional
  const cif = cfr + insurance;
  
  // Benchmark Unit Value Ekspor BPS Hamburg (HS 0901.11 - Robusta): Rata-rata $2.80/kg
  const marketAvg = 2.80;
  
  let status: "competitive" | "high" | "low" = "competitive";
  if (cif > marketAvg * 1.05) {
    status = "high"; // Lebih mahal > 5% dari rata-rata BPS
  } else if (cif < marketAvg * 0.92) {
    status = "low";  // Terlalu murah (dapat dicurigai dumping/kualitas rendah)
  }

  return {
    fob: parseFloat(fob.toFixed(2)),
    cfr: parseFloat(cfr.toFixed(2)),
    cif: parseFloat(cif.toFixed(2)),
    marketAvg,
    status
  };
}

// 4. B2B RISK & RED FLAG INTELLIGENCE SERVICE
export interface RedFlagReport {
  riskLevel: "LOW" | "MEDIUM" | "HIGH";
  flags: { icon: string; title: string; description: string }[];
}

// Maps a known demo buyerId → the structured profile + history the gateway needs.
const _BUYER_PROFILES: Record<
  string,
  { profile: Record<string, unknown>; history: { sender: string; message: string }[] }
> = {
  klaus: {
    profile: { companyName: "GlobalTech Imports GmbH", country: "Germany", countryCode: "DE" },
    history: [
      { sender: "buyer", message: "We are interested in a full container of your robusta coffee. Please share FOB and CIF Hamburg pricing and your export certificates." },
    ],
  },
  nippon: {
    profile: { companyName: "Nippon Organic Trading", country: "Japan", countryCode: "JP", requestedSampleBeforeContract: true },
    history: [
      { sender: "buyer", message: "Please send a green tea sample within 3 days before we sign the contract." },
    ],
  },
};

const _CATEGORY_ICON: Record<string, string> = {
  SAMPLE: "schedule",
  JURISDICTION: "gavel",
  COMMUNICATION: "forum",
  PAYMENT: "payments",
};

export async function checkRedFlag(buyerId: string): Promise<RedFlagReport> {
  if (isLive()) {
    try {
      const known = _BUYER_PROFILES[buyerId] ?? {
        profile: { companyName: buyerId, country: "Unknown" },
        history: [{ sender: "buyer", message: "Initial trade inquiry." }],
      };
      // Gateway: POST /api/v1/check-red-flag (JwtAuthGuard)
      const raw = await apiPost<{
        riskLevel: "LOW" | "MEDIUM" | "HIGH";
        flags: { id: string; description: string; category: string; severity: string }[];
        recommendation?: string;
      }>("/check-red-flag", {
        buyerProfile: known.profile,
        communicationHistory: known.history,
      });
      return {
        riskLevel: raw.riskLevel,
        flags: (raw.flags ?? []).map((f) => ({
          icon: _CATEGORY_ICON[f.category] ?? "flag",
          title: `${f.category} • ${f.severity}`,
          description: f.description,
        })),
      };
    } catch (e) {
      console.warn("Live backend failed, falling back to mock red flag checker:", e);
    }
  }

  // High-Fidelity Mock Risk Intelligence
  if (buyerId === "klaus") {
    let isRattan = false;
    if (typeof window !== "undefined") {
      const productName = localStorage.getItem("tradeconnect_product_name") || "";
      isRattan = productName.toLowerCase().includes("rotan") || productName.toLowerCase().includes("rattan") || productName.toLowerCase().includes("kursi");
    }
    return {
      riskLevel: "LOW",
      flags: [
        { icon: "verified_user", title: "Profil Bisnis Terverifikasi", description: "GlobalTech Imports GmbH terdaftar secara resmi di Frankfurt, Jerman (UID: DE123456789) tanpa riwayat sengketa dagang." },
        { icon: "payments", title: "Rekam Jejak Pembayaran Bersih", description: "Tidak ada keluhan gagal bayar atau keterlambatan Letter of Credit (L/C) dalam 24 bulan terakhir." },
        isRattan 
        ? { icon: "eco", title: "Sertifikasi SVLK & FSC Valid", description: "Dokumen Sistem Verifikasi Legalitas Kayu (SVLK) dan sertifikasi FSC produk rotan Anda cocok 100% dengan persyaratan bea cukai Uni Eropa." }
        : { icon: "eco", title: "Kepatuhan EUDR Sesuai Regulasi", description: "Buyer secara aktif mendukung pelacakan koordinat geo-lokasi kebun kopi sesuai aturan deforestasi Uni Eropa." }
      ]
    };
  } else if (buyerId === "nippon") {
    return {
      riskLevel: "MEDIUM",
      flags: [
        { icon: "schedule", title: "Pola Komunikasi Terburu-buru", description: "Buyer mendesak pengiriman sampel teh hijau dalam waktu 3 hari sebelum penandatanganan LOI/Kontrak." },
        { icon: "gavel", title: "Risiko Regulasi Ekstra Yokohama", description: "Diperlukan sertifikasi karantina tanaman dan fitosanitasi ekstra ketat untuk pengiriman komoditas pertanian ke Jepang." }
      ]
    };
  } else {
    return {
      riskLevel: "LOW",
      flags: [
        { icon: "verified", title: "Profil Importir Terdaftar", description: "Profil importir ini telah tervalidasi secara komersial oleh atase perdagangan Indonesia di negara setempat." }
      ]
    };
  }
}

// 5. B2B CREDIBILITY BREAKDOWN SERVICE
export interface CredibilityDimension {
  name: string;
  score: number;
  description: string;
}

export function getCredibilityDimensions(buyerId: string): CredibilityDimension[] {
  if (buyerId === "klaus") {
    return [
      { name: "Sejarah Impor (Import History)", score: 92, description: "Memiliki riwayat impor reguler kopi robusta dari Indonesia & Vietnam dalam 3 tahun terakhir." },
      { name: "Konsistensi Volume (Volume Consistency)", score: 85, description: "Rata-rata pesanan bulanan stabil pada kisaran 15-20 metrik ton (1 kontainer penuh)." },
      { name: "Risiko Negara (Country Safety)", score: 95, description: "Jerman memiliki rating risiko transaksi komersial terendah di Uni Eropa (Grade AA+)." },
      { name: "Responsivitas (Responsiveness)", score: 90, description: "Rata-rata waktu tanggapan komunikasi email negosiasi di bawah 4 jam kerja." }
    ];
  } else if (buyerId === "nippon") {
    return [
      { name: "Sejarah Impor (Import History)", score: 60, description: "Baru memulai diversifikasi komoditas organik teh dan kopi dari Asia Tenggara." },
      { name: "Konsistensi Volume (Volume Consistency)", score: 70, description: "Pesanan bervariasi tergantung musim panen lokal di Jepang." },
      { name: "Risiko Negara (Country Safety)", score: 98, description: "Jepang memiliki tingkat jaminan hukum dagang internasional yang sangat tinggi." },
      { name: "Responsivitas (Responsiveness)", score: 55, description: "Perbedaan zona waktu memicu waktu tunda komunikasi rata-rata 12 jam." }
    ];
  } else {
    return [
      { name: "Sejarah Impor", score: 80, description: "Riwayat perdagangan komersial yang cukup aktif." },
      { name: "Konsistensi Volume", score: 75, description: "Volume impor rata-rata stabil." },
      { name: "Risiko Negara", score: 85, description: "Rating risiko komersial stabil." },
      { name: "Responsivitas", score: 80, description: "Komunikasi rata-rata di bawah 12 jam." }
    ];
  }
}

// 6. MARKET INTELLIGENCE SERVICE (BPS + UN Comtrade — real ingested data)
export interface MarketStat {
  partner: string;
  flow: string;
  tradeValueUsd: number | null;
  netWeightKg?: number | null;
  period?: number | null;
  source?: string;
}

export interface MarketAlert {
  type: string;
  title: string;
  description: string;
}

export interface MarketIntelligenceResponse {
  hsCode: string;
  region: string;
  totalValueUsd?: number | null;
  topRegion?: string | null;
  topMarkets: MarketStat[];
  analysis?: string;
  alerts: MarketAlert[];
  raw?: unknown;
}

// The readiness service returns { bpsStats:[{countryName,tradeValueUsd,netWeightKg,period,unitValueUsd}],
// comtradeStats:[...], totalValueUsd, topRegion, insights:{analysis, alerts:[{type,title,description}]} }.
function normalizeStat(s: Record<string, unknown>): MarketStat {
  return {
    partner: (s.countryName as string) || (s.partner as string) || "—",
    flow: (s.flow as string) || "Export",
    tradeValueUsd: (s.tradeValueUsd as number) ?? (s.trade_value_usd as number) ?? null,
    netWeightKg: (s.netWeightKg as number) ?? null,
    period: (s.period as number) ?? null,
  };
}

/**
 * Global market intelligence for an HS code, backed by the trade_flows table
 * (BPS + UN Comtrade). Gateway: POST /api/v1/readiness/market-intelligence.
 * Returns null when live mode is off or the backend is unreachable, so callers
 * can render their own fallback.
 */
export async function getMarketIntelligence(
  hsCode: string = "0901",
  region: string = "global",
): Promise<MarketIntelligenceResponse | null> {
  if (!isLive()) return null;
  try {
    const raw = await apiPost<Record<string, unknown>>("/readiness/market-intelligence", {
      hsCode,
      region,
    });
    const bps = (Array.isArray(raw.bpsStats) ? raw.bpsStats : []) as Record<string, unknown>[];
    const comtrade = (Array.isArray(raw.comtradeStats)
      ? raw.comtradeStats
      : []) as Record<string, unknown>[];
    const source = bps.length > 0 ? bps : comtrade;
    const insights = (raw.insights as Record<string, unknown>) || {};
    return {
      hsCode,
      region,
      totalValueUsd: (raw.totalValueUsd as number) ?? null,
      topRegion: (raw.topRegion as string) ?? null,
      topMarkets: source.map(normalizeStat),
      analysis: (insights.analysis as string) || "",
      alerts: Array.isArray(insights.alerts) ? (insights.alerts as MarketAlert[]) : [],
      raw,
    };
  } catch (e) {
    console.warn("Live market-intelligence failed:", e);
    return null;
  }
}

// 6a. MARKET REFERENCE DATA (real, derived from ingested BPS data)
export interface HsOption {
  code: string;
  label: string;
  count: number;
}
export interface RegionOption {
  name: string;
  count: number;
  valueUsd: number;
}

/** HS codes that actually have ingested trade data. Gateway: GET /market/hs-codes. */
export async function getHsCodes(): Promise<HsOption[] | null> {
  if (!isLive()) return null;
  try {
    return await apiGet<HsOption[]>("/market/hs-codes");
  } catch (e) {
    console.warn("getHsCodes failed:", e);
    return null;
  }
}

/** Top destination countries for an HS chapter (real BPS aggregation). Gateway: GET /market/top-markets. */
export async function getTopMarkets(hs: string): Promise<MarketStat[] | null> {
  if (!isLive()) return null;
  try {
    const rows = await apiGet<Array<{ partner: string; tradeValueUsd: number; netWeightKg: number; period: number | null }>>(
      `/market/top-markets?hs=${encodeURIComponent(hs)}`,
    );
    return rows.map((r) => ({
      partner: r.partner,
      flow: "Export",
      tradeValueUsd: r.tradeValueUsd,
      netWeightKg: r.netWeightKg,
      period: r.period,
    }));
  } catch (e) {
    console.warn("getTopMarkets failed:", e);
    return null;
  }
}

/** Destination countries present in the trade data. Gateway: GET /market/regions. */
export async function getRegions(): Promise<RegionOption[] | null> {
  if (!isLive()) return null;
  try {
    return await apiGet<RegionOption[]>("/market/regions");
  } catch (e) {
    console.warn("getRegions failed:", e);
    return null;
  }
}

// 6b. EXPORT DOCUMENT CHECKLIST (readiness service)
export interface ChecklistItem {
  id: string;
  label: string;
  description: string;
  required: boolean;
}

/** Gateway: GET /api/v1/documents/checklist. Returns null on failure. */
export async function getDocumentChecklist(): Promise<ChecklistItem[] | null> {
  if (!isLive()) return null;
  try {
    const raw = await apiGet<{ items: ChecklistItem[] }>("/documents/checklist");
    return raw?.items ?? null;
  } catch (e) {
    console.warn("getDocumentChecklist failed:", e);
    return null;
  }
}

// 7. AI BUYER DISCOVERY SERVICE (pgvector semantic match)
export interface BuyerMatch {
  buyerId?: string;
  companyName?: string;
  country?: string;
  score?: number;
  [key: string]: unknown;
}

/**
 * Semantic buyer matches for a product. Gateway: POST /api/v1/matching/search.
 * Requires the matching-service (embeddings) to be running; returns null on any
 * failure so the buyer-discovery page can fall back to its curated list.
 */
export async function matchBuyers(productId: string, limit: number = 10): Promise<BuyerMatch[] | null> {
  if (!isLive()) return null;
  try {
    // Backend DTO: { product_id, top_k } — server loads the product's precomputed embedding.
    return await apiPost<BuyerMatch[]>("/matching/search", { product_id: productId, top_k: limit });
  } catch (e) {
    console.warn("Live buyer matching failed:", e);
    return null;
  }
}

