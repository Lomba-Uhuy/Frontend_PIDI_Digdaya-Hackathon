export const API_CONFIG = {
  // 'live' → call the TradeConnect gateway. 'mock' is not used in production.
  mode: (process.env.NEXT_PUBLIC_API_MODE as 'live' | 'mock') || 'live',

  // Gateway base URL. NestJS gateway serves everything under /api/v1.
  // Local dev default = http://localhost:3000/api/v1 (docker-compose maps gateway → 3000).
  baseUrl: process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000/api/v1',

  // Google Maps JavaScript API key (browser key). Used by the Market
  // Intelligence heat map. Override via NEXT_PUBLIC_GOOGLE_MAPS_API_KEY.
  googleMapsApiKey:
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || 'AIzaSyDOlodO0bDXSpCdDdR941Pmk0lR-xq2R9w',

  // Map ID is required by google.maps.marker.AdvancedMarkerElement. 'DEMO_MAP_ID'
  // is Google's official id for development; set a real Cloud map ID in production
  // (a Cloud map ID also lets you restore custom map styling). Override via
  // NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID.
  googleMapsMapId: process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID || 'DEMO_MAP_ID',
};
