"use client";
/* eslint-disable @typescript-eslint/no-explicit-any -- the Google Maps JS API global is untyped (no @types/google.maps installed). */
import { useCallback, useEffect, useRef, useState } from "react";
import { API_CONFIG } from "../../lib/config";
import { coordsForCountry } from "../../lib/country-coords";

export interface MapMarket {
  partner: string;
  tradeValueUsd: number | null;
}

let mapsPromise: Promise<any> | null = null;

function loadGoogleMaps(apiKey: string): Promise<any> {
  if (typeof window === "undefined") return Promise.reject(new Error("no window"));
  const w = window as any;
  if (w.google?.maps?.visualization) return Promise.resolve(w.google);
  if (mapsPromise) return mapsPromise;

  mapsPromise = new Promise((resolve, reject) => {
    const cbName = "__tcInitGoogleMaps";
    (window as any)[cbName] = () => resolve((window as any).google);
    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=visualization&callback=${cbName}`;
    script.async = true;
    script.defer = true;
    script.onerror = () => reject(new Error("Failed to load Google Maps"));
    document.head.appendChild(script);
  });
  return mapsPromise;
}

const fmtUsd = (v: number | null | undefined) =>
  v == null ? "—" : "$" + Math.round(v).toLocaleString("en-US");

export function MarketMap({ markets, commodity }: { markets: MapMarket[]; commodity: string }) {
  const divRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<any>(null);
  const overlaysRef = useRef<any[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");

  const renderOverlays = useCallback((google: any) => {
    const map = mapRef.current;
    if (!map) return;
    // Clear previous overlays
    overlaysRef.current.forEach((o) => o.setMap && o.setMap(null));
    overlaysRef.current = [];

    const points: any[] = [];
    const bounds = new google.maps.LatLngBounds();
    let any = false;

    for (const m of markets) {
      const c = coordsForCountry(m.partner);
      if (!c || !m.tradeValueUsd) continue;
      any = true;
      const latLng = new google.maps.LatLng(c.lat, c.lng);
      points.push({ location: latLng, weight: Math.max(1, Math.log10(m.tradeValueUsd)) });
      bounds.extend(latLng);

      const marker = new google.maps.Marker({
        position: latLng,
        map,
        title: `${m.partner}: ${fmtUsd(m.tradeValueUsd)}`,
        label: { text: m.partner.slice(0, 3), color: "#0f172a", fontSize: "10px", fontWeight: "700" },
      });
      const info = new google.maps.InfoWindow({
        content: `<div style="font-size:12px"><strong>${m.partner}</strong><br/>${commodity}<br/>Nilai: ${fmtUsd(m.tradeValueUsd)}</div>`,
      });
      marker.addListener("click", () => info.open(map, marker));
      overlaysRef.current.push(marker);
    }

    if (points.length > 0) {
      const heatmap = new google.maps.visualization.HeatmapLayer({
        data: points,
        map,
        radius: 34,
        opacity: 0.65,
      });
      overlaysRef.current.push(heatmap);
    }
    if (any) map.fitBounds(bounds, 60);
  }, [markets, commodity]);

  // Load Google Maps once, then (re)render overlays whenever the data changes.
  useEffect(() => {
    let cancelled = false;
    loadGoogleMaps(API_CONFIG.googleMapsApiKey)
      .then((google) => {
        if (cancelled || !divRef.current) return;
        if (!mapRef.current) {
          mapRef.current = new google.maps.Map(divRef.current, {
            center: { lat: 20, lng: 40 },
            zoom: 2,
            mapTypeControl: false,
            streetViewControl: false,
            fullscreenControl: false,
            styles: [
              { elementType: "labels", stylers: [{ visibility: "off" }] },
              { featureType: "administrative.country", elementType: "geometry.stroke", stylers: [{ color: "#c9d3df" }] },
              { featureType: "water", elementType: "geometry", stylers: [{ color: "#dbeafe" }] },
              { featureType: "landscape", elementType: "geometry", stylers: [{ color: "#f8fafc" }] },
            ],
          });
        }
        setStatus("ready");
        renderOverlays(google);
      })
      .catch(() => {
        if (!cancelled) setStatus("error");
      });
    return () => {
      cancelled = true;
    };
  }, [renderOverlays]);

  return (
    <div className="relative w-full h-full min-h-[400px]">
      <div ref={divRef} className="absolute inset-0 rounded-b-xl" />
      {status !== "ready" && (
        <div className="absolute inset-0 flex items-center justify-center bg-surface-container-lowest/80 text-sm text-on-surface-variant">
          {status === "loading" ? "Memuat peta Google…" : "Peta tidak dapat dimuat (periksa koneksi / API key)."}
        </div>
      )}
      {status === "ready" && markets.length === 0 && (
        <div className="absolute bottom-3 left-3 bg-surface-container-lowest/90 border border-outline-variant rounded-md px-3 py-1.5 text-[11px] text-on-surface-variant">
          Belum ada data pasar untuk komoditas ini.
        </div>
      )}
    </div>
  );
}
