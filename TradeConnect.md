# TradeConnect: AI-Powered Buyer Matching & First Deal Assistant
### Akselerasi Ekspor Pertama UMKM Indonesia

---

## Ringkasan Eksekutif

Kegagalan akselerasi ekspor dari 64 juta UMKM Indonesia bukan bersumber dari rendahnya kualitas manufaktur atau kurangnya motivasi komersial. Hambatan sistemik ini berakar pada **ketakutan psikologis yang diperparah keterbatasan teknis** di zona paling rawan perdagangan internasional: penutupan transaksi perdana.

TradeConnect dikonseptualisasikan sebagai solusi infrastruktur digital intervensi langsung yang menjahit teknologi *semantic AI matching*, intelijen data global (UN Comtrade, TradeMap), dan asisten negosiasi berbasis RAG — dalam satu platform yang bertindak sebagai tim *Export Compliance* dan mentor negosiasi profesional.

---

## 1. Analisis Makroekonomi & Gap Analysis

### Kondisi UMKM Indonesia

| Indikator | Data |
|---|---|
| Kontribusi terhadap PDB | ~61% |
| Penyerapan Tenaga Kerja | ~97% (~117–119 juta jiwa) |
| Jumlah Unit UMKM | >64 juta unit |
| Kontribusi terhadap Ekspor Non-Migas | **hanya 15–16%** |
| UMKM siap ekspor yang belum bertransaksi | >800.000 unit |

### Dua Kesenjangan Utama (Gap)

**Gap A — Tidak Ada Akses ke Pembeli Nyata**
> UMKM yang secara administratif sudah "siap ekspor", namun tidak mengetahui cara mengidentifikasi pembeli konkret, memulai komunikasi, dan menutup transaksi internasional pertama secara aman.

**Gap B — Operasional Ekspor Suboptimal**
> UMKM yang sudah ekspor perdana, namun mengalami *underpricing*, ketergantungan pada satu pembeli, pemilihan pasar yang salah, dan ketidakmampuan diversifikasi.

> **TradeConnect fokus pada Gap A** — titik kegagalan paling akut sekaligus peluang intervensi paling berdampak.

---

### Peta Ekosistem: TradeConnect vs Platform Pra-Ekspor

| Parameter | Platform Pra-Ekspor *(mis. ExPath)* | TradeConnect |
|---|---|---|
| **Target Pengguna** | UMKM fase "belum tahu" | UMKM siap produk, belum punya pembeli |
| **Tahap Journey** | Pra-ekspor (edukasi & persiapan) | Ekspor Pertama (eksekusi & negosiasi) |
| **Output Utama** | Skor kesiapan & rekomendasi makro | Koneksi pembeli nyata + panduan closing deal |
| **Fokus AI** | Readiness assessment & market intelligence | Buyer profiling, semantic matching, negosiasi |
| **Integrasi Data** | UN Comtrade (agregat), BPS, Kemendag | TradeMap, Bill of Lading API, OSS RBA, INATRADE |
| **Pain Point** | "Saya tidak tahu ke mana harus menjual" | "Saya punya produk bersertifikasi, tapi tidak ada pembeli" |

---

## 2. Anatomi Kegagalan Transaksi Pertama

Tiga defisiensi mendasar yang menjadi akar kegagalan:

### 2.1 Kendala Bahasa & Negosiasi Profesional
Penggunaan alat penerjemah generik menghilangkan nuansa diplomasi bisnis dan ketegasan dalam penawaran. Respons yang lambat atau terlalu informal menyebabkan importir global meragukan kapasitas manajerial UMKM.

### 2.2 Ketidakmampuan Menilai Kredibilitas Pembeli
Dunia perdagangan internasional sarat dengan aktor oportunistik — broker tanpa modal hingga sindikat penipuan terorganisasi. UMKM sering membuang waktu berminggu-minggu melayani pihak yang tidak memiliki kapasitas impor nyata.

### 2.3 Miskalkulasi Harga & Incoterms
Karena takut kehilangan momentum, UMKM menetapkan harga terlalu murah (*underpricing*) hingga menggerus seluruh margin, atau menyetujui kontrak CIF yang kewajiban logistiknya di luar kapasitas finansial mereka.

---

## 3. Profil UMKM Tervalidasi — Data Sisi Pasokan

### Tiga Dimensi Profil

```
┌─────────────────────┐
│  Dimensi Produk     │  → Nama, deskripsi, bahan baku, kapasitas, harga, foto
├─────────────────────┤
│  Dimensi Kapabilitas│  → Riwayat ekspor, moda logistik, MOQ, syarat pembayaran
├─────────────────────┤
│  Dimensi Legalitas  │  → NIB, APE, sertifikasi BPOM/SNI/Halal
└─────────────────────┘
```

### Pipeline Akuisisi Data (3 Jalur)

**Jalur 1 — Self-Declared Input + AI HS Code Classifier**
- UMKM menginput deskripsi produk dalam teks bebas
- Model NLP (word embeddings) memetakan otomatis ke **kode HS 6-digit** yang paling relevan
- Dilatih pada korpus catatan kepabeanan historis — bukan sekadar terjemahan harfiah

**Jalur 2 — Verified Data Integration (Real-Time API)**

| Sumber | Fungsi Verifikasi |
|---|---|
| **OSS RBA (BKPM)** | Validasi legalitas entitas, skala usaha, kesesuaian KBLI |
| **INATRADE (Kemendag)** | Verifikasi APE, izin ekspor komoditas, kuota |
| **BPOM / BSN / MUI** | Validasi NIE, SNI, sertifikasi Halal |
| **LPEI (CPNE / Desa Devisa)** | Elevasi profil UMKM binaan ke visibilitas pembeli premium |

**Jalur 3 — Digital Enrichment Data**
- Metrik performa dari Official Store (Tokopedia, Shopee) via OAuth
- Google Business Profile (ulasan, jam operasional)
- Kapasitas produksi dari SIINas (Kemenperin)

> UMKM dengan NIB dasar tetap bisa masuk platform untuk mencari pembeli mikro. Semakin lengkap sertifikasi → algoritma memberikan akses ke jaringan pembeli premium secara otomatis.

---

## 4. Intelijen Pasar Global — Data Sisi Permintaan

### 4.1 Data Makroekonomi Resmi

| Sumber | Fungsi |
|---|---|
| **UN Comtrade** | Volume impor historis per negara & kode HS (>3 miliar rekam jejak) |
| **ITC TradeMap** | Direktori importir aktif di 60+ negara, estimasi omzet, tren pertumbuhan |
| **BPS (webapi.bps.go.id)** | Granularitas ekspor domestik tingkat provinsi & komoditas |

### 4.2 Resolusi Entitas Pembeli — Tingkat Transaksional
- Analisis **Bill of Lading** (manifest laut) via Panjiva / ImportYeti
- Mengungkap: nama pengirim, consignee, pelabuhan asal/tujuan, frekuensi pengiriman
- Prototype: data sampel trial Panjiva + ethical scraping direktori B2B publik

### 4.3 Pemetaan Hambatan Tarif & Non-Tarif

| Portal | Fungsi |
|---|---|
| **INSW** | Regulasi lartas & bea keluar dari Indonesia |
| **EU Trade Helpdesk (TARIC)** | Bea masuk, pelabelan, standar organik Eropa |
| **ASEAN Tariff Finder / Japan Customs** | Skema preferensi FTA, optimasi Form SKA (Surat Keterangan Asal) |

---

## 5. Fitur Inti Platform

### Fitur 1 — AI Buyer Discovery (Semantic Matching)

**Mekanisme Vector Database:**
1. Seluruh katalog produk UMKM + jutaan rekam jejak importir diubah menjadi **vector embeddings** oleh model LLM
2. Disimpan di vector database (Pinecone / Milvus / pgvector)
3. Matching menggunakan **Cosine Similarity / Approximate Nearest Neighbor (ANN)**

> *Contoh:* Produsen "pot serabut kelapa" Indonesia secara otomatis dicocokkan dengan importir Spanyol yang membeli "biodegradable plant containers" atau "sustainable garden accessories"

**Buyer Credibility Scoring — 3 Variabel Utama:**

| Variabel | Mekanisme |
|---|---|
| **Scale Matching** | Mencocokkan volume impor pembeli dengan kapasitas UMKM. Pembeli kapasitas 50 kontainer/bulan diturunkan peringkat untuk UMKM kapasitas LCL |
| **Sinyal Reputasi Logistik** | Konsistensi pembelian dari kawasan Asia Tenggara = familiaritas rute lokal |
| **Kesehatan Finansial** | Silang data forum eksportir + asuransi perdagangan untuk deteksi riwayat sengketa pembayaran |

**Output:** Shortlist pembeli terkalibrasi, diurutkan berdasarkan probabilitas konversi tertinggi.

---

### Fitur 2 — Deal Communication Assistant (Arsitektur RAG)

**Alur Kerja RAG:**

```
Email Masuk (Importir)
        ↓
Intent Classification (NLP)
[RFQ? Komplain? Negosiasi spesifikasi?]
        ↓
Retrieval dari Vector DB UMKM
[Inventaris, kapasitas CBM, harga, sertifikasi]
        ↓
LLM Generation
[Draf bahasa Inggris bisnis: fasih, sopan, asertif]
        ↓
Output ke UMKM
[Draf Inggris + Anotasi penjelasan Bahasa Indonesia]
```

**Negotiation Context Engine — Guardrails:**
- **Floor Price Discipline:** AI dilarang keras mengungkapkan *walk-away point* atau BATNA ke pihak eksternal, bahkan jika diprovokasi via prompt injection
- **Anotasi Edukasi:** Sistem menjelaskan rasionalitas taktik negosiasi dalam Bahasa Indonesia

> *Contoh anotasi:* "Draf ini menggunakan teknik **price anchoring** dengan menawarkan diskon ongkos kirim sebagai kompensasi, alih-alih menurunkan harga unit dasar produk Anda."

> Platform bertransformasi dari **"alat otomatisasi"** menjadi **"mentor negosiasi"**

---

### Fitur 3 — Deal Readiness Checker

#### 3a. Kalkulator Harga Ekspor: FOB → CIF

| Incoterm | Komponen Kalkulasi |
|---|---|
| **FOB** | HPP + Truk ke pelabuhan + THC (Tanjung Priok/Perak) + Dokumen PEB + Reefer plug-in (agrikultur/perikanan) |
| **CFR** | FOB + Ocean Freight |
| **CIF** | CFR + Asuransi *(Asuransi = Tingkat Premi × 1.10 × CFR)* |

Sistem membandingkan harga kesepakatan dengan **Export Unit Value UN Comtrade** sebagai benchmark. Jika harga di bawah kuartil terendah historis → ⚠️ **peringatan underpricing**.

#### 3b. Red Flag Detection (NLP Anti-Penipuan)

Sistem memindai dokumen negosiasi, draf kontrak, dan profil pengiriman berdasarkan parameter FinCEN & BIS:

| 🔴 Red Flag | Indikasi |
|---|---|
| **Anomali Rute Logistik** | Rute tidak efisien, consignee Bill of Lading adalah pihak ketiga/freight forwarder | 
| **Manipulasi Nilai Faktur** | Permintaan over/under-invoicing; profil "toko kecil" memesan komponen industri berteknologi tinggi |
| **Tekanan Pembayaran Tunai** | Menolak L/C, memaksakan transfer ke rekening offshore tidak relevan |

#### 3c. Pemeriksaan Kepatuhan Dokumen

Checklist dokumen wajib sebelum PO final:
- ✅ Commercial Invoice
- ✅ Packing List (berat kotor, kubikasi CBM)
- ✅ Bill of Lading (B/L)
- ✅ PEB terverifikasi INSW
- ✅ Sertifikat Fitosanitasi *(rempah/sayuran)*
- ✅ V-Legal/SVLK *(produk kayu/furnitur)*

---

## 6. Arsitektur Teknis Backend

| Komponen | Teknologi |
|---|---|
| **API Integration Layer** | ETL pipeline — normalisasi JSON (web API), XML (kepabeanan), CSV (bulk) |
| **Vector Database** | Milvus / pgvector (PostgreSQL) untuk similarity search berkecepatan tinggi |
| **Multi-Tenant Security** | Role-Based Access Control (RBAC) — isolasi data per UMKM |
| **RAG Anti-Leakage** | Proteksi mencegah rembesan floor price satu pengguna ke generasi pengguna lain |

---

## 7. Strategi Monetisasi

### Model Pendapatan Berjenjang (Freemium → Premium)

| Tier | Fitur | Biaya |
|---|---|---|
| **Freemium** | Verifikasi OSS RBA, Packing List/Commercial Invoice standar, konversi FOB-CIF dasar | Gratis |
| **Premium** | Generasi komunikasi RAG tanpa batas, skor kredibilitas pembeli (Bill of Lading API), deteksi Red Flag | Kredit mikropembayaran / Langganan korporat |
| **Transaksional** | Komisi PO yang berhasil ditutup via portal escrow digital | 0,5% – 1,5% per transaksi |

### Ekosistem Pendapatan Tambahan (Ancillary Revenue)
- Afiliasi **asuransi kargo laut**
- Referral **Freight Forwarder**
- Referral **Trade Finance / Kredit Modal Kerja Ekspor (bank BUMN)**

---

## 8. Kemitraan Kelembagaan (B2B2C / Public-Private)

| Mitra | Sinergi |
|---|---|
| **LPEI — Desa BISA Ekspor** | Distribusi platform ke ribuan eksportir binaan; biaya langganan berpotensi disubsidi program pemerintah |
| **Kementerian Perdagangan** | Integrasi program Marketing Handholding; akses database INATRADE |
| **GPEI (Gabungan Perusahaan Ekspor Indonesia)** | Letter of Intent untuk legitimasi hackathon & MVP |

> Kemitraan institusional = penurunan **Customer Acquisition Cost** secara dramatis

---

## 9. Strategi Pembuktian Prototipe (Hackathon)

### Pendekatan Hybrid Data

| Data | Sumber | Tujuan |
|---|---|---|
| **Riil — Makro** | UN Comtrade free tier API | Lonjakan impor produk rotan (HS 4602) di Prancis/AS |
| **Riil — Statistik** | BPS / Open Data Kemendag | Agregat komoditas regional |
| **Sintetis — Firm-Level** | ImportYeti, Alibaba B2B (ethical scraping) | Profil calon pembeli (dideklarasikan eksplisit ke juri) |

### Demo Live Pipeline yang Meyakinkan
```
1. Input NIB dummy
        ↓
2. API Call ke sandbox OSS RBA
        ↓
3. Tampilkan status "Terverifikasi" (hijau)
        ↓
4. LLM baca deskripsi "Kerajinan Daun Lontar"
        ↓
5. Auto-mapping ke Kode HS + proyeksi pasar Jepang
```

> Kejujuran rekayasa dalam mendeklarasikan data sintetis akan **dihormati oleh teknolog dan pembuat kebijakan**.

---

## Kesimpulan

TradeConnect bukan sekadar platform direktori pembeli. Dengan mengintegrasikan:
- **Semantic AI Matching** (vector database + LLM)
- **Data Global** (UN Comtrade, TradeMap, Bill of Lading intelligence)
- **RAG Negotiation Assistant** (tata kelola negosiasi berguardrails)
- **Verifikasi Legalitas** (OSS RBA, INATRADE, BPOM/SNI/Halal)

...platform ini memiliki kapabilitas untuk **meredefinisi arsitektur rantai pasok global** dan merealisasikan visi Indonesia mentransformasi 64 juta UMKM menjadi eksportir dunia yang tangguh, terverifikasi, dan berkelanjutan.

---

*Dokumen ini disusun berdasarkan analisis mendalam ekosistem ekspor UMKM Indonesia dan kajian teknis platform TradeConnect.*
