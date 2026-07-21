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
