export const API_CONFIG = {
  // 'live' → call the TradeConnect gateway (falls back to mock on any failure).
  // 'mock' → fully offline high-fidelity simulation.
  mode: (process.env.NEXT_PUBLIC_API_MODE as 'live' | 'mock') || 'live',

  // Gateway base URL. NestJS gateway serves everything under /api/v1.
  // Local dev default = http://localhost:3000/api/v1 (docker-compose maps gateway → 3000).
  baseUrl: process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000/api/v1',

  // Demo credentials used to obtain a JWT automatically (all feature endpoints
  // are protected by JwtAuthGuard). On first use the client logs in, and if the
  // account does not exist it self-registers, then caches the token.
  demoEmail: process.env.NEXT_PUBLIC_DEMO_EMAIL || 'demo@tradeconnect.id',
  demoPassword: process.env.NEXT_PUBLIC_DEMO_PASSWORD || 'DemoPass123!',

  // generate-reply requires a real product UUID for pricing-guardrail context.
  // Defaults to the seeded demo "Kopi hitam" product; override per environment.
  demoProductId:
    process.env.NEXT_PUBLIC_DEMO_PRODUCT_ID || '2914e55a-8f5c-495b-8c34-e7b10670bd73',

  // Google Maps JavaScript API key (browser key). Used by the Market
  // Intelligence heat map. Override via NEXT_PUBLIC_GOOGLE_MAPS_API_KEY.
  googleMapsApiKey:
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || 'AIzaSyDOlodO0bDXSpCdDdR941Pmk0lR-xq2R9w',
};
