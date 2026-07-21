# TradeConnect — Frontend API Dependency Audit

**Scope:** `Frontend_PIDI_Digdaya-Hackathon` (Next.js 16 / React 19) ↔ `backend_v2/tradeconnect` (NestJS gateway + Python services).
**Method:** Every page/component/lib file was read; every backend proxy route + DTO was verified against the running gateway (`/docs-json`). Nothing below is assumed.
**Date:** 2026-07-17.

Legend for **Data Source**: 🟥 hardcoded/simulated · 🟨 localStorage only · 🟩 live backend · 🟦 client-side computed (no backend needed).

---

## 1. Executive summary

- The frontend is a **single-user, localStorage-driven demo**. There is **no persisted account, UMKM, product, buyer, deal, PO, or notification data from the backend** — the entire journey state lives in `localStorage`.
- Exactly **three** features currently call the backend (via `src/lib/api.ts`, all with graceful mock fallback): **classify-intent**, **generate-reply**, **check-red-flag**, plus **market-intelligence** (added during integration). Everything else is 🟥/🟨/🟦.
- The backend **already exposes most endpoints needed** (auth, umkm/products, matching, negotiations, readiness, documents). The main gaps are **CRUD read-back + list/collection endpoints** (deals/negotiations, notifications, reminders, PO, dashboard summary) and **onboarding persistence** (file upload, product/umkm creation wired to the wizard).

---

## 2. localStorage state model (the current "database")

All set by the onboarding wizard (`src/app/page.tsx`) and read everywhere. This must be replaced by real persistence.

| Key | Written by | Read by | Backend replacement |
|---|---|---|---|
| `tradeconnect_company_name` | onboarding, settings | dashboard, buyer-discovery, negotiation, verification, settings, PO, signing-board, layout | `umkm.legal_name` |
| `tradeconnect_product_name` | onboarding, settings | most pages | `product.name` |
| `tradeconnect_product_desc` | onboarding | (unused display) | `product.description` |
| `tradeconnect_product_type` | onboarding (derived coffee/rattan) | most pages | derive from `product.hs_code` |
| `tradeconnect_nib` | onboarding | verification, buyer-discovery, compliance, signing-board | `umkm.nib` |
| `tradeconnect_moq` | onboarding | buyer-discovery | `product.moq` |
| `tradeconnect_capacity` | onboarding | buyer-discovery | `product.monthly_capacity` |
| `tradeconnect_logistics` | onboarding | — | `product`/`umkm` incoterm pref (no column yet) |
| `tradeconnect_floor_price` | onboarding | calculator, negotiation | `product.hpp`/`price_min` |
| `tradeconnect_asking_price` | onboarding | — | `product.price_max` |
| `tradeconnect_final_price` | calculator, negotiation | compliance, PO | **new** `deal.agreed_price` |
| `tradeconnect_step` | journey state machine | dashboard, calculator | **new** `deal.status` |
| `tradeconnect_plan` | upgrade page | layout, upgrade | **new** `user.plan` / subscription |
| `tradeconnect_reminders` | buyer-discovery | buyer-discovery | **new** `reminder` table + endpoints |
| `tradeconnect_theme` | layout | layout | client-only (OK to keep local) |
| `tradeconnect_tour_shown` | layout | layout | client-only (OK to keep local) |

---

## 3. Existing backend endpoints (reusable — verified against gateway `/docs-json`)

Base URL: `http://localhost:3000/api/v1`. All require `Authorization: Bearer <JWT>` **except** the two auth routes.

| # | Method | Path | Purpose | Notes / gotchas |
|---|---|---|---|---|
| E1 | POST | `/auth/register` | Create account → `{accessToken, refreshToken,...}` | public |
| E2 | POST | `/auth/login` | Login → JWT pair | public |
| E3 | POST | `/umkm` | Create UMKM profile | body `CreateUmkmDto` |
| E4 | GET | `/umkm/me` | Get caller's UMKM | **read-back exists** |
| E5 | POST | `/umkm/:umkmId/products` | Add product | body `CreateProductDto` |
| E6 | GET | `/umkm/:umkmId/products` | List products | |
| E7 | POST | `/matching/search` | Buyers by `product_id` (server loads embedding) | body `{product_id, top_k?, country_filter?}` |
| E8 | POST | `/matching/match-buyers` | Buyers by raw 1024-dim `embedding` | body `{embedding, top_k?, country_filter?, min_volume?, category?}` |
| E9 | POST | `/matching/classify-hs` | Description → HS code | |
| E10 | POST | `/negotiations/classify-intent` | Email intent | body **`{email_text}`** |
| E11 | POST | `/negotiations/generate-reply` | AI reply | body **`{importer_email, product_id, buyer_id?}`**; needs `ANTHROPIC_API_KEY` + credits |
| E12 | POST | `/negotiations/draft` | Legacy draft | |
| E13 | POST | `/readiness/pricing` · `/calculate-price` | FOB/CIF pricing | body `PricingDto` (`originCharges, qty, oceanFreight,...`) |
| E14 | POST | `/readiness/fraud-scan` | Contract red-flag scan | |
| E15 | POST | `/check-red-flag` · `/readiness`… | Buyer red-flag | body **`{buyerProfile, communicationHistory}`** |
| E16 | POST | `/verify-nib` · `/readiness/verify-nib` | OSS/INSW NIB check | body `{nib}` |
| E17 | POST | `/readiness/market-intelligence` | BPS+Comtrade stats + AI insights | body `{hsCode, region}` |
| E18 | GET | `/documents/checklist` | Export doc checklist | **unused by FE** |
| E19 | POST | `/documents/generate` | Generate export docs | **unused by FE** |

---

## 4. Feature inventory + frontend→backend mapping matrix

### 4.1 Onboarding wizard — `src/app/page.tsx`
| Field/action | Data source | Required endpoint | Status |
|---|---|---|---|
| Product name/desc/prices, MOQ, capacity, incoterm | 🟨 localStorage | E3 `/umkm` + E5 `/umkm/:id/products` | **NOT wired** — wizard never calls backend |
| Product photos upload | 🟥 collected, discarded | **MISSING** file-upload endpoint (M1) | **NOT wired** |
| Certification files upload | 🟥 collected, discarded | **MISSING** file-upload endpoint (M1) | **NOT wired** |
| NIB + company name | 🟨 localStorage | E16 `/verify-nib` + E3 `/umkm` | **NOT wired** |
| HS-code auto-map (advertised) | 🟥 not performed | E9 `/matching/classify-hs` | **NOT wired** |

### 4.2 Verification — `src/app/verification/page.tsx`
| Element | Data source | Required endpoint | Status |
|---|---|---|---|
| OSS RBA validation, entity type, KBLI, risk | 🟥 timed simulation | E16 `/verify-nib` (returns is_valid, kbli, oss_status…) | **NOT wired** (backend exists) |
| HS code mapping | 🟥 hardcoded 0901.11/9401.52 | E9 `/matching/classify-hs` | **NOT wired** |
| Verified score (85) | 🟥 hardcoded | **MISSING** readiness score endpoint (M2) | missing |

### 4.3 Dashboard — `src/app/(dashboard)/dashboard/page.tsx`
| Widget | Data source | Required endpoint | Status |
|---|---|---|---|
| AI Mentor insight | 🟥 hardcoded string | **MISSING** dashboard/insights (M3) | missing |
| Readiness score ring (85) | 🟥 hardcoded | **MISSING** readiness score (M2) | missing |
| AI buyer matches (3 cards) | 🟥 hardcoded array | E7 `/matching/search` (needs product_id) | **NOT wired** |
| Active negotiations list | 🟨 derived from `tradeconnect_step` | **MISSING** `GET /deals` (M4) | missing |

### 4.4 Buyer Discovery — `src/app/(dashboard)/buyer-discovery/page.tsx`
| Element | Data source | Required endpoint | Status |
|---|---|---|---|
| Buyer list (GlobalTech, EuroCafé) | 🟥 hardcoded (⚠ `id==="globaltech"` drives negotiation flow) | E7 `/matching/search` | **NOT wired** — live matches proven working but replacing breaks demo narrative |
| Filters (HS, region, min-vol, sort) | 🟥 client-side keyword check | E7 params (`country_filter`, `category`, sort) — **sort/pagination MISSING** (M5) | partial |
| Pagination "1-2 of 14" | 🟥 fake | **MISSING** pagination on E7 (M5) | missing |
| Diagnostics (1.2M scanned, 342 active, 14 matches) | 🟥 hardcoded | **MISSING** matching stats (M6) | missing |
| Export CSV | 🟦 client-side from hardcoded array | (reuse E7 data) | works on mock data |
| Create Reminder | 🟨 localStorage | **MISSING** reminder CRUD (M7) | missing |

### 4.5 Negotiation — `src/app/(dashboard)/negotiation/page.tsx`
| Element | Data source | Required endpoint | Status |
|---|---|---|---|
| Intent classification | 🟩 E10 (live, mock fallback) | E10 | **WIRED** |
| AI reply drafts | 🟩 E11 (live, needs Anthropic credits; mock fallback) | E11 | **WIRED** (blocked by billing) |
| Red-flag report | 🟩 E15 (live, mock fallback) | E15 | **WIRED** |
| Credibility dimensions | 🟥 hardcoded (`getCredibilityDimensions`) | **MISSING** buyer credibility (M8) | missing |
| Pricing panel | 🟦 `calculatePrice` client-side | E13 (optional) | client-computed |

### 4.6 Calculator — `src/app/(dashboard)/calculator/page.tsx`
| Element | Data source | Status |
|---|---|---|
| FOB/CFR/CIF breakdown | 🟦 inline client math (imports `calculatePrice` but computes inline) | OK — 🟦 deterministic; optionally back with E13 |
| BPS benchmark ($2.80 / $55) | 🟥 hardcoded constant | should use E17 `/market-intelligence` unit value |
| IDR rate (16,000) | 🟥 hardcoded | **MISSING** FX endpoint (M9) |

### 4.7 Compliance — `src/app/(dashboard)/compliance/page.tsx`
| Element | Data source | Required endpoint | Status |
|---|---|---|---|
| Document checklist (NIB, HS, BPOM/Halal) | 🟥 hardcoded | E18 `/documents/checklist` | **NOT wired** (backend exists) |
| Compliance/red-flag scan (4 steps) | 🟥 timed simulation | E14 `/readiness/fraud-scan` + E15 | **NOT wired** |
| PO figures (18MT × price + $2100) | 🟨 from `tradeconnect_final_price` | **MISSING** `POST /deals/:id/po` (M10) | missing |

### 4.8 Purchase Order — `src/app/(dashboard)/purchase-order/page.tsx`
| Element | Data source | Required endpoint | Status |
|---|---|---|---|
| PO document + parties + line items | 🟨 localStorage + hardcoded | **MISSING** PO CRUD (M10) + E19 `/documents/generate` | missing |
| Download PO | 🟦 client-side text/blob | E19 (server-rendered PDF preferred) | client-only |

### 4.9 Signing Board — `src/app/signing-board/page.tsx`
| Element | Data source | Required endpoint | Status |
|---|---|---|---|
| Contract signing / e-sign | 🟨 localStorage + simulation | **MISSING** `POST /deals/:id/sign` (M11) | missing |

### 4.10 Settings — `src/app/(dashboard)/settings/page.tsx`
| Element | Data source | Required endpoint | Status |
|---|---|---|---|
| Company/product edit | 🟨 localStorage read/write | E4 `GET /umkm/me` + **MISSING** `PATCH /umkm/:id` & `PATCH /products/:id` (M12) | missing (update endpoints) |

### 4.11 Upgrade / Plans — `src/app/upgrade/page.tsx`, `src/lib/plan.ts`
| Element | Data source | Required endpoint | Status |
|---|---|---|---|
| Plan tiers (Free/Growth/Scale) | 🟥 hardcoded `PLANS` (static pricing — OK) | — | catalog OK static |
| Current plan + upgrade | 🟨 localStorage | **MISSING** subscription (M13) `GET/POST /subscription` | missing |

### 4.12 Dashboard layout — `src/app/(dashboard)/layout.tsx`
| Element | Data source | Required endpoint | Status |
|---|---|---|---|
| Top bar name/company | 🟨 localStorage | E4 `/umkm/me` | not wired |
| Notifications (bell) | 🟥 hardcoded/none | **MISSING** notifications (M14) | missing |
| Product tour | 🟨 localStorage flag | client-only OK | — |

---

## 5. Schema / contract mismatches found (real, verified)

1. **`/negotiations/generate-reply`** expects `product_id` (UUID) — the frontend has only a product *name* string. Needs onboarding to persist a product (E5) and store its UUID. *(FE currently sends a configurable `demoProductId`.)*
2. **`/matching/search`** field names are snake_case `product_id` / `top_k` (not `productId`/`limit`).
3. **`/check-red-flag`** expects `{buyerProfile, communicationHistory}` — frontend natively thinks in `buyerId`. Adapter maps known demo buyers; real impl needs a `GET /buyers/:id` to build the profile.
4. **`/readiness/market-intelligence`** returns `{bpsStats[], comtradeStats[], totalValueUsd, topRegion, insights:{analysis, alerts[]}}` — **not** a flat `topMarkets` array. FE normalizer handles this now.
5. **HS-code format:** FE uses dotted `0901.11`; BPS/Comtrade/matching expect digits (`0901`, 2–6 digits). Normalize before every call.
6. **Gateway DTO validation bug (already fixed):** `IntentDto`, `GenerateReplyDto`, `MatchBuyersDto` lacked `class-validator` decorators → `forbidNonWhitelisted` rejected all fields. Any *new* proxy DTO must include validation decorators, not just `@ApiProperty`.

---

## 6. Missing endpoints — implementation specifications

> Auth: all require `Bearer JWT` unless noted. Errors: standard `400/401/403/404/409/422/429/500`.

### M1 — File upload (product photos + certifications) · **Critical**
- `POST /api/v1/uploads` — `multipart/form-data` `{ file, kind: "product_photo"|"certification" }` → `{ id, url, mime, sizeBytes }`.
- DB: new `file_asset(id, owner_user_id, umkm_id?, product_id?, kind, url, mime, size_bytes, created_at)`. Storage: S3/MinIO or local volume. Referenced by `product.photo_urls[]` and `umkm.certifications[]` (columns already exist).

### M2 — Readiness score · **High**
- `GET /api/v1/umkm/:umkmId/readiness` → `{ score:0-100, breakdown:[{label, value, weight}], level:"ready"|"partial"|"not_ready" }`.
- Source: `umkm.verified_score` (exists) + product completeness + verification status. No external dep.

### M3 — Dashboard summary / AI mentor insight · **High**
- `GET /api/v1/dashboard/summary` → `{ readinessScore, mentorInsight:string, activeDealCount, topMatchCount }`.
- Aggregates umkm + deals + matching; `mentorInsight` may reuse comms-service/LLM (optional).

### M4 — Deals / negotiations collection · **Critical**
- `GET /api/v1/deals?status=&page=&pageSize=` → paginated `{ items:[{id, buyer:{id,name,country}, product_id, status, agreedPrice, lastMessage, updatedAt}], total, page, pageSize }`.
- `GET /api/v1/deals/:id`, `POST /api/v1/deals` `{buyer_id, product_id}`, `PATCH /api/v1/deals/:id` `{status, agreedPrice}`.
- DB: new `deal(id, umkm_id, product_id, buyer_id, status ENUM('contacted','negotiating','compliance','po_sent','po_signed'), agreed_price, created_at, updated_at)` + FKs; index `(umkm_id, status)`. **Replaces `tradeconnect_step` + `tradeconnect_final_price`.**

### M5 — Matching sort + pagination · **High**
- Extend E7/E8 with `sort_by:"relevance"|"score"|"recent"`, `page`, `pageSize`; response wraps `{items, total, page, pageSize}`. Uses existing `buyer` + `buyer_embedding`.

### M6 — Matching diagnostics · **Medium**
- `GET /api/v1/matching/stats?category=` → `{ totalScanned, activeBuyers30d, highProbabilityMatches }`. Source: `buyer` table aggregates.

### M7 — Reminders CRUD · **Medium**
- `GET/POST /api/v1/reminders`, `DELETE /api/v1/reminders/:id`. Body `{title, date, time, type}`.
- DB: new `reminder(id, user_id, title, remind_at, type, created_at)`. **Replaces `tradeconnect_reminders`.**

### M8 — Buyer detail + credibility · **High**
- `GET /api/v1/buyers/:id` → full profile incl. `credibilityDimensions:[{name, score, description}]`, certifications, import history, financial score.
- Source: `buyer` table (add `credibility_dimensions jsonb` or compute). Feeds negotiation credibility panel + buyer-discovery modal.

### M9 — FX / reference rates · **Low**
- `GET /api/v1/reference/fx?base=USD&quote=IDR` → `{ rate, asOf }`. External: exchange-rate API; cache daily.

### M10 — Purchase Order · **High**
- `POST /api/v1/deals/:id/po` `{lineItems, incoterm, port}` → `{poId, number, totals}`; `GET /api/v1/deals/:id/po`; `GET /api/v1/deals/:id/po.pdf` (server-rendered).
- DB: new `purchase_order(id, deal_id, number, currency, subtotal, shipping, total, incoterm, port, status, created_at)` + `po_line_item(...)`. May reuse E19 `/documents/generate`.

### M11 — Contract signing · **Medium**
- `POST /api/v1/deals/:id/sign` `{signerName, signatureRef}` → `{status:"po_signed", signedAt}`. DB: `deal.status` + `signature(id, deal_id, signer, signed_at, ip)`.

### M12 — UMKM/Product update · **High**
- `PATCH /api/v1/umkm/:id`, `PATCH /api/v1/umkm/:umkmId/products/:productId`. Backs the Settings page. Tables already exist.

### M13 — Subscription / plan · **Medium**
- `GET /api/v1/subscription` → `{plan, since, commissionRate}`; `POST /api/v1/subscription/upgrade` `{plan}`. DB: `subscription(id, user_id, plan, started_at)` or `users.plan`. Catalog stays static in `plan.ts`.

### M14 — Notifications · **Medium**
- `GET /api/v1/notifications?unreadOnly=`, `POST /api/v1/notifications/:id/read`. DB: `notification(id, user_id, type, title, body, read_at, created_at)`.

---

## 7. Database requirements summary

**Reuse (exist):** `users`, `umkm`, `product`, `product_embedding`, `buyer`, `buyer_embedding`, `trade_flows`, `bps_trade_data`, `export_knowledge_base`, `audit_log`.
**New tables:** `deal`, `purchase_order`, `po_line_item`, `signature`, `reminder`, `notification`, `file_asset`, `subscription` (or `users.plan`).
**New columns:** `buyer.credibility_dimensions jsonb` (or compute); optional `product.incoterm_pref`.
**Indexes:** `deal(umkm_id, status)`, `reminder(user_id, remind_at)`, `notification(user_id, read_at)`, `file_asset(product_id)`, existing HNSW on `buyer_embedding`.

---

## 8. External API dependencies (per feature)

| Feature | External source | Endpoint | Sync strategy | Fallback |
|---|---|---|---|---|
| Market intelligence, calculator benchmark | **BPS** + **UN Comtrade** | E17 (reads `trade_flows`/`bps_trade_data`) | ETL `ingest_bps` / `ingest_un_comtrade` (daily; Comtrade free tier 500/mo) | curated copy |
| NIB verification | **OSS RBA** / **INSW** | E16 | on-demand, cache result on `umkm` | `sandbox_mode:true` |
| AI reply / intent | **Anthropic** (Haiku 4.5) | E11/E10 | on-demand | deterministic mock (needs account credits) |
| HS classification, buyer matching | local **e5-large** embeddings | E9/E7/E8 | precompute embeddings (product/buyer) | — |
| FX (M9) | exchange-rate API | M9 | daily cache | last-known rate |

---

## 9. Gap analysis (rollup)

- **FE features with NO backend endpoint:** dashboard summary/insights (M3), deals list (M4), reminders (M7), matching diagnostics (M6), PO (M10), signing (M11), subscription (M13), notifications (M14), file upload (M1), readiness score (M2), FX (M9).
- **FE using dummy data but backend EXISTS (just wire it):** verification→E16, HS map→E9, buyer list→E7, compliance checklist→E18, compliance scan→E14/E15, dashboard matches→E7, settings read→E4.
- **Backend endpoints never consumed by FE:** E9 classify-hs, E12 draft, E18 documents/checklist, E19 documents/generate, E13 pricing (calculator computes locally).
- **Missing cross-cutting:** pagination/sort/filter envelopes (M4/M5), update (PATCH) endpoints (M12), auth wiring in the actual UI (onboarding never registers/logs in — `src/lib/http.ts` auto-auths with a demo account).

---

## 10. Prioritized implementation roadmap

**Critical (app cannot be real without these)**
1. Wire onboarding → E1/E3/E5 (persist account, UMKM, product; store `umkm_id`/`product_id`). 
2. M1 file upload (photos + certs).
3. M4 deals collection (replaces the localStorage journey state).

**High (primary workflows)**
4. Wire verification → E16 + E9; settings read → E4; M12 update endpoints.
5. M2 readiness score; M3 dashboard summary; dashboard matches + buyer-discovery → E7 with M5 sort/pagination.
6. M8 buyer detail/credibility; M10 purchase order.

**Medium**
7. M7 reminders; M6 matching diagnostics; M11 signing; M13 subscription; M14 notifications; compliance → E18/E14/E15.

**Low**
8. M9 FX; back calculator with E13; consume E19 for server-rendered PO/PDF.

---

## 11. API dependency diagram (text)

```
Onboarding ──▶ E1 register ─▶ E3 /umkm ─▶ E5 /products ─▶ M1 uploads
                                   │            │
Verification ─▶ E16 verify-nib ────┘            └▶ E9 classify-hs
Dashboard ───▶ M3 summary, M2 readiness, M4 deals, E7 matches
Buyer Disc. ─▶ E7 search (+M5 sort/page), M6 stats, M7 reminders, M8 buyer detail
Negotiation ─▶ E10 intent, E11 reply, E15 red-flag, M8 credibility   [E10/E11/E15 WIRED]
Calculator ──▶ (client math) + E13 pricing + E17 benchmark + M9 fx
Compliance ──▶ E18 checklist, E14 fraud-scan, E15 red-flag, M10 PO
Purchase Ord ▶ M10 po (+E19 documents/generate)
Signing ─────▶ M11 sign
Settings ────▶ E4 /umkm/me, M12 PATCH umkm/product
Upgrade ─────▶ M13 subscription
Layout ──────▶ E4 /umkm/me, M14 notifications
                (external: BPS, UN Comtrade, OSS/INSW, Anthropic, e5-large, FX)
```
