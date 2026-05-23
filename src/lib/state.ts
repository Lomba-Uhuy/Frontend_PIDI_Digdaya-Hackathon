export type TradeConnectStep =
  | 'onboarding'
  | 'verified'
  | 'contacted_klaus'
  | 'negotiating'
  | 'compliance'
  | 'po_sent'
  | 'po_signed';

export function getStep(): TradeConnectStep {
  if (typeof window === 'undefined') return 'onboarding';
  return (localStorage.getItem('tradeconnect_step') as TradeConnectStep) || 'onboarding';
}

export function setStep(step: TradeConnectStep) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('tradeconnect_step', step);
    // Dispatch custom event to sync cross-page/cross-tab state instantly
    window.dispatchEvent(new Event('tradeconnect_state_change'));
  }
}

export function getFinalPrice(): number {
  if (typeof window === 'undefined') return 2.75;
  const price = localStorage.getItem('tradeconnect_final_price');
  return price ? parseFloat(price) : 2.75;
}

export function setFinalPrice(price: number) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('tradeconnect_final_price', price.toString());
  }
}

export function resetState() {
  if (typeof window !== 'undefined') {
    localStorage.setItem('tradeconnect_step', 'onboarding');
    localStorage.setItem('tradeconnect_final_price', '2.75');
    window.dispatchEvent(new Event('tradeconnect_state_change'));
  }
}
