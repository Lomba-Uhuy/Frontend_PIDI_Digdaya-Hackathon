# Backend Contracts Needed (Production — remove remaining mock/dummy)

Status of the "no dummy data" pass on the frontend:

- **Done (real-only):** AI intent (`/negotiations/classify-intent`), AI reply
  (`/negotiations/generate-reply`), red-flag **result** (`/check-red-flag`), and the
  dashboard AI buyer matches (`/matching/search`). These now return empty/`null` on
  failure instead of fabricated data.
- **Blocked (this document):** features below have **no real backend source**, so per
  the evidence-based policy they were NOT replaced with fabricated data. They still
  render their existing hardcoded values until the endpoints/data below exist.

Every contract here is derived from: existing frontend usage + the existing gateway
endpoints/DTOs (evidence cited), not invented conventions.

---

## 1. Buyer credibility dimensions (breakdown)

**Gap.** `getCredibilityDimensions()` in `src/lib/api.ts` returns 4 hardcoded
dimensions (Import History, Volume Consistency, Country Safety, Responsiveness).
The backend only exposes a **single** number.

- Evidence — backend has only `credibility_score` (0–1): `services/matching-service/.../application/matching_service.py` and `MatchResultResponseDto.credibility_score` in `services/gateway/src/proxy/dto/matching-response.dto.ts`.
- Also hardcoded: the credibility **score** label in `negotiation/page.tsx` (`activeBuyerId === "klaus" ? "92/100" : ...`).

**Option A (no new endpoint):** show only the real single `credibility_score` from the
match result; delete the 4-dimension UI. No backend work.

**Option B (new endpoint):** add a per-buyer credibility breakdown.
```
GET /api/v1/matching/buyers/:buyerId/credibility        (JwtAuthGuard)
200 → {
  buyerId: string,
  overall: number,               // 0..1, = existing credibility_score
  dimensions: [                   // ONLY dimensions the backend can actually compute
    { key: string, label: string, score: number /*0..100*/, description: string }
  ]
}
```
**Blocking evidence gap:** the repo has no data source for "Import History /
Responsiveness" etc. Those dimensions must be defined by real signals (order history,
response times) that do not currently exist in any table/service. Needs product +
data-model decision before Option B can be implemented.

---

## 2. Buyer conversation / negotiation messages

**Gap.** The negotiation thread (incoming buyer messages like the "Klaus" replies,
`setFinalPrice(2.75 / 50)`) is fully scripted in `negotiation/page.tsx`. There is no
messaging backend.

- Evidence — existing endpoints cover only deals + AI drafting, not messages:
  `deal.proxy.ts` (`POST/GET/GET :id/PATCH :id`), `comms.proxy.ts`
  (`draft`, `generate-reply`, `classify-intent`). No conversation/message store.

**Needed:**
```
GET  /api/v1/deals/:dealId/messages                     (JwtAuthGuard)
200 → { items: [ { id, dealId, sender: "buyer" | "umkm", text, createdAt } ] }

POST /api/v1/deals/:dealId/messages                      (JwtAuthGuard)
body → { text: string }
201 → { id, dealId, sender: "umkm", text, createdAt }
```
Requires a `deal_messages` table (evidence: `deal.schema.ts` exists in user-service;
a messages table does not). Real incoming buyer messages require an inbound channel
(email/webhook) that does not exist yet — **blocked**.

---

## 3. Communication history for red-flag input

**Gap.** `checkRedFlag()` sends `communicationHistory` built from the hardcoded
`_BUYER_PROFILES` (`src/lib/api.ts`) because there is no stored history.

- The endpoint `POST /check-red-flag` EXISTS (`public-readiness.proxy.ts:64`) and works;
  only its **input** is fabricated.

**Resolution:** once #2 exists, feed `check-red-flag` with the real
`{ buyerProfile, communicationHistory }` from the deal + its messages. No new endpoint —
just real input wiring. **Blocked on #2.**

---

## 4. Buyer identity flowing into negotiation

**Gap.** `negotiation/page.tsx` uses a hardcoded `activeBuyerId = "klaus"` and
`_BUYER_PROFILES` instead of a real matched buyer.

- Real buyer data exists via `POST /matching/search` → `{ buyer_id, name, country, hs_codes, credibility_score, min_order_qty, is_synthetic }` (`matching-response.dto.ts`).
- Note: seeded buyers may be flagged `is_synthetic: true` (test data) — real production
  buyers must come from a non-synthetic source.

**Resolution:** create a deal from a real match (`POST /deals` already exists,
`deal.proxy.ts:26`) and drive the negotiation from that `dealId` + `buyer_id`. Frontend
change once #2 exists.

---

## 5. Buyer discovery list not wired to matching

**Gap.** `buyer-discovery/page.tsx` renders a hardcoded `buyers` array (line ~200) and a
keyword filter — it does **not** call `/matching/search`.

- Real source EXISTS: `matchBuyers(productId)` → `POST /matching/search`
  (`api.ts`, already used by the dashboard).

**Resolution (frontend only, no backend needed):** replace the hardcoded `buyers`
list + keyword filter with `matchBuyers(getStoredIds().productId)`; show empty when
there is no product embedding / no matches. This is a real feature build (map the
match DTO fields into the buyer card), scheduled after sign-off.

---

## Summary

| Feature | Real source today | Action |
|---|---|---|
| AI intent / reply | ✅ endpoints | Done — real-only |
| Red-flag result | ✅ endpoint | Done — real-only (input pending #3) |
| Dashboard matches | ✅ `/matching/search` | Done — real-only |
| Buyer-discovery list | ✅ `/matching/search` (not wired) | #5 — frontend wiring |
| Credibility dimensions | ❌ only 1 score | #1 — Option A (show 1 score) or backend |
| Negotiation messages | ❌ none | #2 — new messaging backend |
| Comm history (red-flag input) | ❌ none | #3 — blocked on #2 |
| Negotiation buyer identity | ⚠️ matches exist, not linked | #4 — link deal↔buyer, blocked on #2 |
