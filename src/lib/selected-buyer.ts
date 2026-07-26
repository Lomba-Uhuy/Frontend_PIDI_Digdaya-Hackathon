// The buyer the user picked in Buyer Discovery, shared with the Negotiation
// screen. Holds only real backend fields — no fabricated data.
export interface SelectedBuyer {
  buyer_id: string;
  name: string;
  country: string;
  credibility_score: number;
  is_synthetic: boolean;
  source?: string | null;
}

const KEY = "tradeconnect_selected_buyer";

export function setSelectedBuyer(buyer: SelectedBuyer): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(buyer));
}

export function getSelectedBuyer(): SelectedBuyer | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as SelectedBuyer;
  } catch {
    return null;
  }
}

// One-shot flag set by "Ajukan Penawaran" in Buyer Discovery, consumed by the
// Negotiation screen to auto-draft an initial English offer for this buyer.
const PROPOSE_KEY = "tradeconnect_propose_offer";

export function markProposeOffer(buyerId: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(PROPOSE_KEY, buyerId);
}

/** Read the buyer_id awaiting an initial offer WITHOUT clearing it (safe to call twice). */
export function peekProposeOffer(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(PROPOSE_KEY);
}

/** Clear the pending-offer flag once the draft has been generated. */
export function clearProposeOffer(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(PROPOSE_KEY);
}
