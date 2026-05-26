import { API_CONFIG } from "./config";

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
  if (API_CONFIG.mode === "live") {
    try {
      const res = await fetch(`${API_CONFIG.baseUrl}/classify-intent`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      if (res.ok) return await res.json();
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
  if (API_CONFIG.mode === "live") {
    try {
      const res = await fetch(`${API_CONFIG.baseUrl}/generate-reply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email_content: emailContent,
          product_name: productContext,
          floor_price: floorPrice,
        }),
      });
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn("Live backend failed, falling back to mock reply generator:", e);
    }
  }

  // Dynamic high-fidelity mock replies based on input text & keyword rules
  const lowerText = emailContent.toLowerCase();
  
  // Custom generated drafts based on buyer's counter-offer or generic replies
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
