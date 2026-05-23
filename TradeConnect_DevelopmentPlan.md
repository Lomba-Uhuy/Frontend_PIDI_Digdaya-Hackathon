# TradeConnect — Dokumentasi Lengkap
> Platform AI untuk membantu UMKM Indonesia menembus pasar ekspor global

---

## Daftar Isi
1. [Deliverables Tim](#1-deliverables-tim)
2. [Gap Analysis — Peta Masalah UMKM Ekspor](#2-gap-analysis)
3. [Arsitektur Teknis](#3-arsitektur-teknis)
4. [Alur Kerja Webapp — 3 Fitur Inti](#4-alur-kerja-webapp--3-fitur-inti)
5. [User Journey UMKM — Step-by-Step](#5-user-journey-umkm)
6. [Model Bisnis & Monetisasi](#6-model-bisnis--monetisasi)
7. [Strategi Demo Hackathon PIDI](#7-strategi-demo-hackathon-pidi)
8. [Scope MVP Demo Semifinal](#8-scope-mvp-demo-semifinal)
9. [Pembagian Riset Tim](#9-pembagian-riset-tim)
10. [Timeline Development ke MVP](#10-timeline-development-ke-mvp)
11. [Mitigasi Risiko & Critical Path](#11-mitigasi-risiko--critical-path)

---

## 1. Deliverables Tim

> **"DELIVERABLES RISET PER ANGGOTA"** — Setiap anggota tim bertanggung jawab atas output riset spesifik menjelang demo semifinal 31 Mei.

---

### HUMA — Backend Engineer

| No | Deliverable |
|----|------------|
| 1 | Tech Stack Recommendation Doc |
| 2 | API Feasibility Report (OSS, INATRADE, Comtrade, BPS) |
| 3 | Vector DB Benchmark Results — pgvector vs Milvus |
| 4 | RAG Pipeline Prototype (Proof of Concept) |
| 5 | ETL Pipeline Architecture Design |

---

### LUTFI — Front End Developer

| No | Deliverable |
|----|------------|
| 1 | Wireframe Set — Onboarding, Matching, Chat, Readiness |
| 2 | UI-UX Audit Report & Prototype Existing |
| 3 | Design System dan Component Library |
| 4 | B2B Platform Benchmark Report |

---

### RENISA — Project Manager

| No | Deliverable |
|----|------------|
| 1 | Master Timeline (Gantt / Kanban) |
| 2 | Feature Priority Matrix — MoSCoW |
| 3 | Risk Register dan Mitigation Plan |
| 4 | Demo Script dan Backup Plan |
| 5 | Jury Criteria Alignment Matrix |

---

### NADIA — Business Analyst

| No | Deliverable |
|----|------------|
| 1 | Market Validation Report (Data Terbaru) |
| 2 | Competitor Analysis Matrix |
| 3 | Partnership Prospect List |
| 4 | Financial Model — Unit Economics |
| 5 | Pitch Data Pack — Angka dan Studi Kasus |

---

## 2. Gap Analysis

### Peta Perjalanan UMKM Ekspor

```
[ZONA PRA-EKSPOR]           [GAP A]              [ZONA TRADECONNECT]       [HASIL AKHIR]
Platform seperti ExPath     Titik Kegagalan       First Deal Execution
                            Paling Akut
```

### Zona Pra-Ekspor (Platform Existing)

**Kondisi Awal UMKM:**
- Tidak tahu produk bisa diekspor
- Tidak tahu pasar tujuan yang tepat

**Solusi Existing (Edukasi & Readiness Assessment):**
- Skor kesiapan ekspor
- Rekomendasi negara tujuan

**Kondisi Setelah Pra-Ekspor (UMKM Siap Ekspor):**
- Produk sudah bersertifikasi
- NIB aktif
- Tahu pasar potensial

---

### GAP A — Titik Kegagalan Paling Akut

Setelah UMKM siap ekspor, mereka menghadapi **3 hambatan kritis** yang belum ditangani platform manapun:

| # | Masalah | Solusi TradeConnect |
|---|---------|---------------------|
| 1 | **Tidak punya akses ke pembeli nyata** | AI Buyer Discovery — Semantic Matching, Credibility Scoring |
| 2 | **Tidak mampu bernegosiasi profesional dalam Bahasa Inggris** | Deal Communication Assistant — RAG-based, Guardrails negosiasi |
| 3 | **Rentan penipuan dan underpricing** | Deal Readiness Checker — Kalkulator FOB-CIF, Red Flag Detection, Doc Compliance |

---

### Hasil Akhir yang Dituju

Setelah ketiga gap ditangani, target output adalah:
- ✅ **Purchase Order ditutup**
- ✅ **Pembayaran aman**
- ✅ **Diversifikasi pasar** — Transaksi ekspor pertama berhasil

---

## 3. Arsitektur Teknis

### Integrasi API Eksternal

**API Pemerintah RI:**
- `OSS RBA` — Verifikasi NIB dan KBLI
- `INATRADE` — APE dan izin ekspor
- `INSW` — Lartas (larangan dan pembatasan ekspor)
- `BPS` — Statistik ekspor per provinsi

**Data Global:**
- `UN Comtrade` — Volume impor historis, nilai perdagangan USD, tren per negara dan HS Code
- `ITC TradeMap` — Direktori importir aktif 60+ negara, estimasi omzet dan kategori produk
- `ImportYeti / Panjiva` — Bill of Lading Intelligence, manifest pengiriman aktual

**Enrichment:**
- Marketplace APIs (Tokopedia, Shopee)
- Google Business Profile
- SIINas Kemenperin

---

### Data Pipeline — ETL

```
[Extract]          [Transform]          [Load]
JSON, XML, CSV  →  Normalisasi     →   PostgreSQL
dari berbagai      Deduplikasi          &
sumber             Validasi             Vector DB
```

---

### AI & ML Engine

| Komponen | Fungsi |
|----------|--------|
| **LLM** | Text generation, HS Code classification, Intent classification |
| **Embedding Model** | Produk UMKM → vectors, Profil importir → vectors |
| **RAG Pipeline** | Retrieval dari knowledge base, Grounded generation, Anti-hallucination |
| **NLP Red Flag Detector** | Pattern matching, Anomaly detection, FinCEN & BIS rules |

---

### API Layer (FastAPI atau Node.js)

- **REST API Gateway** — Authentication JWT, Rate Limiting, RBAC
- **Business Logic Services:** Matching Service, Communication Service, Readiness Service, Verification Service

---

### Frontend (React / Next.js)

| Modul | Fitur |
|-------|-------|
| **Dashboard UMKM** | Onboarding wizard, Profil & sertifikasi, Buyer matching results |
| **Chat Negosiasi** | RAG Communication UI, Draf & approve flow, Penjelasan strategi (Bahasa Indonesia) |
| **Deal Readiness Panel** | Kalkulator FOB-CIF, Red flag alerts, Document checklist |

---

### Database Layer

| Database | Isi |
|----------|-----|
| **PostgreSQL** | User data, Transaction records, UMKM profiles |
| **Vector Database** (pgvector / Milvus) | Product embeddings, Buyer embeddings, Semantic index |
| **Knowledge Base** | Regulasi ekspor, Template negosiasi, Incoterms reference, HS Code corpus |

---

### Keamanan

- **Multi-Tenant Architecture** — Isolasi data per UMKM, Enkripsi data sensitif (HPP dan floor price)
- **RAG Leak Protection** — Mencegah kebocoran data antar tenant, Prompt injection defense

---

## 4. Alur Kerja Webapp — 3 Fitur Inti

### INPUT — Onboarding UMKM

UMKM mendaftar dan mengisi profil dengan tiga kategori data:

**Data Produk:**
- Nama, deskripsi, foto
- Kapasitas produksi
- Kisaran harga, MOQ

**Data Legalitas:**
- NIB (Nomor Induk Berusaha)
- Sertifikasi BPOM, SNI, Halal, APE

**Data Kapabilitas:**
- Pengalaman ekspor
- Kesiapan logistik
- Toleransi pembayaran

---

### Proses Verifikasi & Enrichment

```
Data Produk    →  HS Code Classifier NLP
                  (Deskripsi → Kode HS 6-digit otomatis)

Data Legalitas →  Verifikasi API Pemerintah
                  (OSS RBA: NIB & KBLI, INATRADE: APE, BPOM/BSN/MUI)

Data Kapabilitas → Enrichment Data
                   (Marketplace, Google Business, SIINas Kemenperin)

                        ↓
              [Verified UMKM Profile Score]
              Triangulasi data → Trust score untuk importir
```

---

### Fitur 1: AI Buyer Discovery

```
UMKM Profile + Data Importir
        ↓
  Vector Embeddings (via LLM)
        ↓
  Disimpan di Vector DB (pgvector / Milvus)
        ↓
  Semantic Matching
  (Cosine Similarity / ANN)
  Contoh: "pot serabut kelapa" → cocok dengan "biodegradable plant containers"
        ↓
  Buyer Credibility Scoring:
  1. Scale Matching — volume impor
  2. Reputasi regional
  3. Kesehatan finansial
        ↓
  OUTPUT: Shortlist pembeli terkalibrasi
          berdasarkan probabilitas konversi
```

**Sumber Data Demand Side:**
- UN Comtrade API — Volume impor historis, nilai USD, tren per negara & HS Code
- ITC TradeMap — Direktori importir aktif 60+ negara
- Bill of Lading Intelligence — ImportYeti / Panjiva
- Hambatan Tarif & Non-Tarif — INSW, EU Trade Helpdesk, ASEAN Tariff Finder
- BPS API — Data ekspor per provinsi, kinerja sektoral wilayah

---

### Fitur 2: Deal Communication Assistant

```
Email inquiry masuk dari importir
        ↓
  Intent Classification (NLP):
  - Request for Quotation?
  - Negosiasi spesifikasi?
  - Komplain?
        ↓
  RAG Pipeline:
  - Retrieval data UMKM dari vector DB (harga, kapasitas, sertifikasi)
  - Generation draf balasan profesional Bahasa Inggris
        ↓
  Guardrails Negosiasi:
  - Floor price DILINDUNGI
  - BATNA tidak dibocorkan
  - Penjelasan strategi dalam Bahasa Indonesia
        ↓
  OUTPUT: Draf korespondensi siap kirim
          + edukasi taktik negosiasi
```

---

### Fitur 3: Deal Readiness Checker

```
                    ┌─ Kalkulator Harga Ekspor ─────────────────────┐
                    │  HPP + Origin Charges = FOB                   │
                    │  FOB + Ocean Freight = CFR                    │
                    │  CFR + Asuransi = CIF                         │
                    │  Benchmark vs UN Comtrade Export Unit Value   │
Negosiasi menuju ───┼─ Red Flag Detection (NLP) ────────────────────┤
kesepakatan harga   │  Anomali rute pengiriman                      │
                    │  Over/under-invoicing                         │
                    │  Tekanan pembayaran tunai ke rekening offshore │
                    │  Entitas tidak sesuai KBLI                    │
                    │                                               │
                    └─ Document Compliance Check ───────────────────┤
                       Commercial Invoice, Packing List (CBM)       │
                       Bill of Lading, PEB via INSW                 │
                       Sertifikat sektoral                          │

                              ↓
              OUTPUT: Peringatan risiko 🟢 Hijau / 🟡 Kuning / 🔴 Merah
                      + Kalkulasi harga akurat
                      + Checklist dokumen lengkap
```

---

## 5. User Journey UMKM

### Step 1 — Onboarding

1. UMKM mendaftar di TradeConnect
2. Input profil produk: nama, deskripsi, foto, kapasitas, MOQ, harga
3. Input NIB (Nomor Induk Berusaha)

---

### Step 2 — Verifikasi Otomatis

4. HS Code Classifier otomatis memetakan produk ke kode HS (via NLP)
5. API OSS RBA memverifikasi legalitas NIB dan KBLI
6. API INATRADE cek APE dan izin ekspor
7. Enrichment dari marketplace dan Google
8. **Verified UMKM Profile Score terbit** ✅

---

### Step 3 — Buyer Discovery

9. AI menganalisis profil UMKM
10. Semantic matching dengan database importir (UN Comtrade, TradeMap, ImportYeti)
11. Credibility scoring menilai tiap calon pembeli
12. Shortlist pembeli tersaji di dashboard
13. UMKM memilih pembeli dari shortlist

---

### Step 4 — Komunikasi & Negosiasi

14. Importir mengirim email inquiry
15. RAG Assistant menghasilkan draf balasan profesional
16. Penjelasan strategi negosiasi diberikan dalam Bahasa Indonesia
17. UMKM review dan approve → kirim

---

### Step 5 — Deal Readiness

18. Negosiasi menuju kesepakatan harga
19. Kalkulator otomatis: HPP → FOB → CFR → CIF
20. Red Flag scan pada profil pembeli dan terms kontrak
21. Checklist dokumen: Invoice, Packing List, Bill of Lading, PEB, Sertifikat

---

### Step 6 — Deal Closed

22. **Purchase Order ditandatangani** 🎉
23. Transaksi ekspor pertama berhasil
24. Profile Score UMKM meningkat → akses pembeli premium terbuka

---

## 6. Model Bisnis & Monetisasi

### Go-to-Market & Akuisisi

**B2B2C via Program Pemerintah:**
- Desa BISA Ekspor — Kemendag
- LPEI Coaching Program
- Subsidi anggaran pelatihan → Menurunkan CAC drastis

**Kemitraan Institusional:**
- GPEI — asosiasi eksportir
- Freight Forwarder
- Bank BUMN
- Asuransi kargo

---

### Revenue Streams

**1. FREEMIUM (Gratis) — Magnet Akuisisi Pengguna**
- Verifikasi profil OSS RBA
- Packing List generator
- Commercial Invoice template
- Kalkulator FOB-to-CIF dasar

**2. PREMIUM — Subscription / Pay-Per-Use (Kredit Mikropembayaran)**
- RAG Communication tanpa batas
- Buyer Credibility Scoring
- Red Flag Detection lengkap
- Prioritas matching

**3. KOMISI TRANSAKSI — 0,5% s/d 1,5%**
- Dari setiap Purchase Order yang berhasil tertutup
- Escrow pembayaran digital
- Asuransi transaksi L/C digital

**4. ANCILLARY REVENUE**
- Referral asuransi kargo
- Referral freight forwarder
- Referral trade finance
- Data analytics licensing

---

### Network Effect

```
Semakin banyak UMKM → Data matching semakin akurat
       ↓
Verified Profile Score → Aset analitik bernilai tinggi
       ↓
Database pembeli-penjual terverifikasi terus tumbuh
```

---

## 7. Strategi Demo Hackathon PIDI

### Prinsip Utama
> **Transparansi + Simulasi Pintar**

---

### Data Riil — Analisis Makro

| Sumber | Isi |
|--------|-----|
| UN Comtrade API (free tier) | Tunjukkan lonjakan impor HS 4602 rotan di Perancis/AS |
| BPS API | Statistik komoditas agregat |
| OSS RBA Sandbox | Demo verifikasi NIB secara real-time |

---

### Data Sintetis — Firm-Level

Profil pembeli disintesis dari:
- ImportYeti (data terbuka)
- Trial data Panjiva
- Kurasi portal Alibaba B2B

**DEKLARASI TRANSPARAN kepada juri:**
> "Profil pembeli menggunakan data sintetis yang meniru pola distribusi TradeMap"

---

### Live Pipeline Demo — Skenario UMKM Rotan Jepara

```
1. User input NIB dummy
        ↓
2. API Call ke OSS RBA sandbox
        ↓
3. Status legalitas TERVERIFIKASI ✅
        ↓
4. LLM baca deskripsi produk → HS Code otomatis terisi
        ↓
5. Proyeksi pasar Jepang muncul di dashboard
        ↓
6. Buyer matching results tampil secara real-time
```

---

### Penguat Kredibilitas

Letter of Intent dari:
- GPEI
- LPEI
- Kementerian Perdagangan

---

### Riset Kriteria Juri PIDI

**Aspek penilaian juri:**
- Inovasi dan diferensiasi
- Feasibility teknis
- Dampak ekonomi-sosial
- Skalabilitas bisnis
- Kualitas presentasi dan demo

**Strategi presentasi:**
- Lead dengan masalah nyata: **"800K UMKM gagal ekspor"**
- Live demo pipeline — bukan slide statis
- Tunjukkan data riil + transparansi data sintetis

**Strategi demo:**
- Skenario end-to-end: NIB → Verifikasi → HS Code → Buyer Match → Draf email
- Durasi: maksimal 5–7 menit
- Backup plan jika API down

---

### Struktur Slide Presentasi (8 Slide)

| Slide | Konten |
|-------|--------|
| 1 | Masalah — 800K UMKM gagal ekspor |
| 2 | Gap A — Penjelasan titik kegagalan |
| 3 | Solusi TradeConnect — 3 fitur inti |
| 4 | Arsitektur teknis |
| 5 | Live demo |
| 6 | Model bisnis |
| 7 | Roadmap dan impact |
| 8 | Tim dan penutup |

---

## 8. Scope MVP Demo Semifinal

### ✅ HARUS MASUK DEMO — Prioritas Tinggi

**Demo Essentials:**
- Data sintetis buyer — 50–100 profil realistis
- Skenario demo end-to-end: UMKM rotan Jepara
- Fallback jika API down: cached response siap

**Onboarding:**
- Input profil produk (nama, deskripsi, foto, kapasitas, MOQ, harga)
- Input NIB dan verifikasi otomatis via OSS RBA API
- HS Code Classification otomatis dari deskripsi produk via NLP
- Verified UMKM Profile Score tampil di dashboard

**AI Buyer Discovery:**
- Semantic matching produk UMKM ↔ profil buyer via pgvector
- Shortlist buyer dengan ranking relevance score
- Buyer Credibility Score versi simplified

**Communication Assistant:**
- RAG pipeline dasar — generate draf balasan Bahasa Inggris
- Intent classification email masuk dari importir
- Guardrail floor price protection aktif

**Deal Readiness Checker:**
- Kalkulator interaktif: HPP → FOB → CFR → CIF
- Red flag detection — rule-based level dasar
- Document checklist — status kelengkapan

---

### 🕐 DITUNDA PASCA-SEMIFINAL — Prioritas Rendah

- Integrasi INATRADE — cek APE dan izin ekspor
- Enrichment marketplace (Tokopedia, Shopee, Google)
- Full multi-tenant isolation production-grade
- Escrow pembayaran digital dan asuransi transaksi
- Analytics dashboard — metrik dan reporting
- Bill of Lading API (Panjiva / paid sources)
- Integrasi INSW dan EU Trade Helpdesk

---

## 9. Pembagian Riset Tim

### Pembagian Riset Tim — Rencana Detail

---

#### HUMA (Backend Engineer)

**Riset Arsitektur Backend**
- Evaluasi Stack: FastAPI (Python) vs Node.js (Express/NestJS)
  - Pertimbangan: performa, ekosistem AI-ML, developer experience
- Arsitektur API: REST vs GraphQL, Middleware & auth (JWT), Rate limiting strategy

**Riset Vector Database**
- **pgvector** (PostgreSQL ext): Pros — satu DB untuk semua, familiar SQL, biaya rendah. Cons — skala terbatas untuk dataset sangat besar
- **Milvus**: Pros — purpose-built untuk vector search, sangat cepat, distributed. Cons — ops complexity, infra tambahan
- **Keputusan:** Prototipe pakai pgvector → scaling pakai Milvus

**Riset Integrasi API Eksternal**
- UN Comtrade API (Endpoint V1/V2, free tier: 500 req/bulan)
- OSS RBA API (Sandbox, autentikasi, data NIB/KBLI/status kepatuhan)
- BPS Web API (webapi.bps.go.id, data ekspor per provinsi)
- INATRADE (ketersediaan API publik, APE, izin ekspor)

**Riset RAG Pipeline**
- Arsitektur RAG: embedding model selection, chunking strategy, retrieval method (dense vs hybrid)
- Knowledge Base Setup: regulasi ekspor, template negosiasi, Incoterms, HS Code corpus
- Guardrails Design: floor price protection, BATNA concealment, anti prompt injection

**Feasibility Check API Pemerintah**
- OSS RBA Sandbox: apakah bisa diakses developer? dokumentasi tersedia? response time?
- INATRADE API: public endpoint ada? perlu MoU? alternatif data source?

---

#### LUTFI (Front End Developer)

**Riset Framework UI**
- React vs Next.js: CSR vs SSR/SSG, SEO requirements, performance trade-offs
- UI Component Library: Tailwind CSS, shadcn-ui, Radix UI, pertimbangan aksesibilitas
- State Management: React Context vs Zustand, React Query (server state), WebSocket untuk chat

**Riset Referensi UI-UX B2B**
- Platform rujukan: Alibaba.com, IndoTrading, ThomasNet, Faire, Kompass
- Best practices: Simplicity untuk UMKM, Mobile-responsive, Bahasa Indonesia utama, Progressive disclosure

**Review Prototype Existing**
- Review mockup medium-fidelity yang ada
- Identifikasi masalah: layout/hierarchy, alur navigasi, konsistensi visual, missing screens/states
- List perbaikan: fitur yang perlu ditambah, UX flow, responsiveness, accessibility gaps

**Desain Dashboard UMKM**
- **Onboarding Flow:** Step-by-step wizard, input profil produk, upload foto, input NIB, progress indicator
- **Halaman Buyer Matching:** Shortlist card layout, credibility score visual, filter & sort, detail profil, tombol mulai komunikasi
- **Chat Negosiasi UI:** Draf balasan dari AI, panel penjelasan strategi (Bahasa Indonesia), approve/edit/reject flow, history percakapan
- **Deal Readiness Checker:** Kalkulator interaktif FOB → CIF, traffic light system (Hijau/Kuning/Merah), document checklist dengan progress bar

---

#### RENISA (Project Manager)

**Riset Kriteria Juri PIDI**
- Aspek penilaian: inovasi, feasibility teknis, dampak ekonomi-sosial, skalabilitas, kualitas demo
- Strategi presentasi dan demo (lihat Bagian 7)

**Koordinasi Resource Tim**
- Sprint planning: weekly milestones, daily async standup, blocker escalation
- Dependency mapping: Backend ↔ Frontend, Data pipeline ↔ AI engine, API readiness ↔ Demo
- Risk register: API pemerintah tidak bisa diakses, keterbatasan waktu, kompleksitas LLM, biaya cloud-compute

**Prioritas Fitur (MoSCoW)**

| Prioritas | Fitur |
|-----------|-------|
| **HARUS ADA** | HS Code Classification, Semantic Buyer Matching (data sintetis), Verifikasi NIB via OSS, Kalkulator FOB-CIF dasar, UI Dashboard prototipe |
| **NICE TO HAVE** | RAG Comm. Assistant (draf sederhana), Red Flag Detection (rule-based), Buyer Credibility Score (simplified) |
| **BISA DITUNDA** | Integrasi marketplace, Escrow pembayaran, Full multi-tenant, INATRADE integration, Analytics dashboard |

---

#### NADIA (Business Analyst)

**Validasi Pasar & Data Terbaru**
- Data ekspor UMKM: kontribusi 15–16% ekspor non-migas, 800K+ UMKM layak ekspor
- Sumber: BPS, ANTARA, Kadin, World Bank (data 2025–2026)
- Sizing pasar: TAM 64 juta UMKM, SAM UMKM bersertifikasi, SOM 800K+ siap ekspor
- Tren dan momentum: kebijakan pemerintah pro-ekspor, digitalisasi perdagangan, pertumbuhan e-commerce B2B regional

**Benchmark Kompetitor**

| Platform | Fokus | Kelebihan | Gap | Posisi TC |
|----------|-------|-----------|-----|-----------|
| **ExPath** | Pra-ekspor | Readiness score | Tidak ada buyer matching | Komplementer |
| **IndoTrading** | B2B marketplace lokal | Basis user besar | Keyword matching pasif, tidak ada AI negosiasi | Lebih cerdas |
| **Alibaba** | Marketplace global | Skala masif | Tidak spesifik UMKM ID, tidak ada perlindungan negosiasi & fraud detection | Niche Indonesia |
| **ThomasNet, Kompass** | B2B directory | — | Analisis kelebihan & kelemahan | — |

**Riset Potensi Kemitraan**
- **LPEI — Eximbank:** Program CPNE, Desa Devisa — Desa BISA, Marketing Handholding, potensi subsidi langganan, data eksportir binaan
- **Kementerian Perdagangan:** Program fasilitasi ekspor, Trade Expo Indonesia, integrasi INATRADE, potensi endorsement resmi
- **GPEI:** Asosiasi eksportir, jaringan anggota, Letter of Intent, channel distribusi
- **Partner tambahan:** Bank BUMN (trade finance), Asuransi kargo, Freight forwarder, Asosiasi UMKM daerah

**Persiapan Data Pitching**
- Perkuat angka proposal: statistik terbaru, infografis, studi kasus UMKM nyata (Jepara, Banyumas, dll)
- Financial model: Unit economics, CAC vs LTV, Break-even projection, Revenue forecast Y1–Y3
- Impact metrics: Target UMKM terakomodasi, estimasi peningkatan ekspor non-migas, job creation multiplier, devisa tambahan

---

## 10. Timeline Development ke MVP

### Fase 1 — Fondasi Data (Minggu 1–4)
- Pipeline ETL
- HS Code Classifier
- Vector DB setup
- Multi-tenant schema

### Fase 2 — Core Engine (Minggu 5–8)
- AI Buyer Discovery
- RAG Communication Assistant
- Deal Readiness Checker

### Fase 3 — MVP & Validasi (Minggu 9–12)
- Dashboard UI-UX
- Internal testing
- 5–10 UMKM binaan
- Iterasi feedback

### Fase 4 — Pilot & Scaling (Bulan 4–6)
- Pilot 50–100 UMKM
- Kemitraan LPEI-Kemendag
- Evaluasi konversi

---

### Sprint Menuju Demo Semifinal 31 Mei

#### MINGGU 1 (9–16 Mei) — Fondasi & Setup
> Target: Infrastruktur berdiri, data mengalir

| Anggota | Task Utama |
|---------|-----------|
| **Huma** | Setup repo + FastAPI, integrasi OSS RBA sandbox, HS Code Classifier NLP prototype, setup pgvector schema lengkap |
| **Lutfi** | Setup project React/Next.js + Tailwind + shadcn, halaman Onboarding Wizard (3 step), halaman Verifikasi NIB & Profil |
| **Renisa** | Finalisasi timeline & task board, setup Trello/Notion, riset kriteria juri PIDI detail |
| **Nadia** | Kumpulkan data pasar terbaru (BPS, ANTARA, Kadin), benchmark kompetitor detail, siapkan dataset sintetis buyer (50–100 profil) |

**Checkpoint 1 — 16 Mei:**
- Huma: Backend berjalan, OSS RBA terkoneksi, HS Classifier berfungsi, pgvector siap diisi
- Lutfi: Onboarding wizard selesai, halaman verifikasi NIB jalan, design system konsisten
- Renisa: Task board updated, kriteria juri dipetakan, tidak ada blocker kritis
- Nadia: Data pasar terkumpul, benchmark kompetitor selesai, dataset sintetis buyer siap

---

#### MINGGU 2 (17–23 Mei) — Core Features
> Target: Tiga fitur inti berfungsi end-to-end

| Anggota | Task Utama |
|---------|-----------|
| **Huma** | Pipeline ETL UN Comtrade & BPS, endpoint Buyer Matching (semantic search via pgvector), RAG Pipeline dasar Communication Assistant + guardrails, kalkulator FOB-CIF backend, Red Flag Detection rule-based |
| **Lutfi** | Dashboard Buyer Matching UI (card layout, filter, sort, detail modal), Chat Negosiasi UI & RAG Display (panel percakapan + penjelasan strategi) |
| **Renisa** | Susun demo script & skenario UMKM rotan Jepara, koordinasi sprint minggu 2 |
| **Nadia** | Kontak LPEI & GPEI eksplorasi LoI, susun financial model & unit economics, buat pitch data pack |

**Checkpoint 2 — 23 Mei:**
- Huma: Buyer Matching jalan, RAG Assistant berfungsi dasar, Kalkulator FOB-CIF selesai, Red Flag rule-based aktif
- Lutfi: Dashboard matching selesai, Chat negosiasi UI fungsional, koneksi awal ke backend mulai
- Renisa: Demo script final draft, semua fitur inti teridentifikasi
- Nadia: Financial model selesai, pitch data pack siap, feedback LPEI/GPEI tercatat

---

#### MINGGU 3 (24–31 Mei) — Integrasi, Polish & Demo Ready
> Target: MVP terintegrasi, presentasi siap, demo lancar

| Anggota | Task Utama |
|---------|-----------|
| **Huma** | Deal Readiness Checker backend (endpoint kalkulator, red flag scan, doc checklist), integrasi semua endpoint ke frontend, bug fix & optimasi (query pgvector, timeout handling, caching), demo rehearsal teknis |
| **Lutfi** | Deal Readiness Checker panel UI (kalkulator interaktif, traffic light, doc checklist), koneksi semua halaman ke backend API, polish UI & responsive testing, demo flow walkthrough final |
| **Renisa** | Finalisasi slide presentasi (8 slide), review integrasi frontend-backend, dry run presentasi 2–3 kali, timing total 10–15 menit |
| **Nadia** | Studi kasus UMKM nyata untuk demo, review & perkuat narasi proposal, input konten slide, dry run pitching, hafal angka-angka kunci |

**Checkpoint 3 — 28 Mei:**
- Huma: Semua endpoint aktif, frontend terkoneksi, fallback mechanism siap
- Lutfi: Semua halaman selesai, koneksi API berfungsi, UI polished & responsive
- Renisa: Slide presentasi 90%, demo script final, dry run terjadwal
- Nadia: Konten slide lengkap, financial model final, FAQ juri tersiapkan

---

### Demo Semifinal — 31 Mei

| Sesi | Durasi |
|------|--------|
| Presentasi slide | 5–7 menit |
| Live demo TradeConnect | 5–7 menit |
| QnA dari juri | 5–10 menit |

---

## 11. Mitigasi Risiko & Critical Path

### Mitigasi Risiko

| Risiko | Mitigasi |
|--------|---------|
| OSS RBA API down | Siapkan cached response dan mock data sebagai fallback |
| RAG terlalu lambat | Pre-generate draf untuk skenario demo |
| Waktu tidak cukup | Prioritaskan fitur demo, tunda fitur non-essential |
| Live demo gagal | Siapkan video recording dan screenshot sebagai backup |

---

### Dependency Antar Tim

| Dependency | Deadline |
|------------|---------|
| Nadia dataset sintetis → Huma seeding DB | 16 Mei |
| Huma tech stack decision → Lutfi API contract | 12 Mei |
| Huma API endpoints ready → Lutfi koneksi frontend | 25 Mei |
| Nadia angka dan data → Renisa konten slide | 27 Mei |
| Lutfi demo flow ready → Renisa dry run | 29 Mei |
| Huma fallback mechanism → Renisa backup plan demo | 28 Mei |

---

### Critical Path — Jalur Kritis

```
pgvector setup                   → Buyer Matching dimulai
Buyer Matching backend           → Frontend bisa tampilkan shortlist
RAG Pipeline fungsional          → Chat UI bisa tampilkan draf AI
Dataset sintetis dari Nadia      → Huma bisa seeding database
Semua API endpoint stabil        → Integrasi frontend (Minggu 3)
Integrasi frontend-backend selesai → Dry run 29–30 Mei
```

---

*Dokumen ini digenerate dari diagram draw.io Alur TradeConnect.*
*Terakhir diperbarui: Mei 2026* 