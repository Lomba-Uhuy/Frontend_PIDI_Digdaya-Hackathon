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
  if (w.google?.maps?.marker) return Promise.resolve(w.google);
  if (mapsPromise) return mapsPromise;

  mapsPromise = new Promise((resolve, reject) => {
    const cbName = "__tcInitGoogleMaps";
    (window as any)[cbName] = () => resolve((window as any).google);
    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=marker&loading=async&callback=${cbName}`;
    script.async = true;
    script.defer = true;
    script.onerror = () => reject(new Error("Failed to load Google Maps"));
    document.head.appendChild(script);
  });
  return mapsPromise;
}

const fmtUsd = (v: number | null | undefined) =>
  v == null ? "—" : "$" + Math.round(v).toLocaleString("en-US");

// ── Heat gradient (low → high) ───────────────────────────────────────────────
function lerpRgb(a: number[], b: number[], t: number): [number, number, number] {
  return [
    Math.round(a[0] + (b[0] - a[0]) * t),
    Math.round(a[1] + (b[1] - a[1]) * t),
    Math.round(a[2] + (b[2] - a[2]) * t),
  ];
}

function heatColor(t: number): [number, number, number] {
  const x = Math.max(0, Math.min(1, t));
  const green = [22, 163, 74]; // low
  const amber = [245, 158, 11]; // mid
  const red = [220, 38, 38]; // high
  return x <= 0.5 ? lerpRgb(green, amber, x / 0.5) : lerpRgb(amber, red, (x - 0.5) / 0.5);
}

// Styled detail card shown in the InfoWindow when a country pin is clicked.
function infoCardHtml(
  partner: string,
  commodity: string,
  valueUsd: number,
  sharePct: number,
  rgb: [number, number, number],
): string {
  const solid = `rgb(${rgb[0]},${rgb[1]},${rgb[2]})`;
  const glow = `rgba(${rgb[0]},${rgb[1]},${rgb[2]},0.22)`;
  return `
    <div style="font-family:system-ui,-apple-system,sans-serif;min-width:196px;padding:2px 4px 4px">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px">
        <span style="width:11px;height:11px;border-radius:9999px;background:${solid};box-shadow:0 0 0 3px ${glow};flex:none"></span>
        <strong style="font-size:13px;color:#0f172a;letter-spacing:-.01em">${partner}</strong>
      </div>
      <div style="font-size:11px;color:#64748b;margin-bottom:8px">${commodity}</div>
      <div style="display:flex;justify-content:space-between;gap:16px;font-size:12px">
        <span style="color:#64748b">Nilai ekspor</span><strong style="color:#0f172a">${fmtUsd(valueUsd)}</strong>
      </div>
      <div style="display:flex;justify-content:space-between;gap:16px;font-size:12px;margin-top:3px">
        <span style="color:#64748b">Pangsa pasar</span><strong style="color:${solid}">${sharePct}%</strong>
      </div>
      <button id="tc-find-buyers" type="button"
        style="margin-top:10px;width:100%;display:flex;align-items:center;justify-content:center;gap:6px;padding:7px 10px;border:none;border-radius:8px;background:${solid};color:#fff;font-size:12px;font-weight:600;cursor:pointer">
        <span style="font-size:13px;line-height:1">🔍</span> Cari Buyer di ${partner}
      </button>
    </div>`;
}

// Google removed `visualization.HeatmapLayer` in Maps JS v3.65, so we render an
// equivalent weighted heat layer ourselves on a canvas OverlayView. Built lazily
// because it must subclass the runtime `google.maps.OverlayView`.
let HeatOverlayClass: any = null;
function getHeatOverlayClass(google: any): any {
  if (HeatOverlayClass) return HeatOverlayClass;
  HeatOverlayClass = class extends google.maps.OverlayView {
    points: { location: any; weight: number }[];
    canvas: HTMLCanvasElement | null = null;
    constructor(points: { location: any; weight: number }[]) {
      super();
      this.points = points;
    }
    onAdd() {
      const canvas = document.createElement("canvas");
      canvas.style.position = "absolute";
      canvas.style.pointerEvents = "none";
      this.canvas = canvas;
      this.getPanes().overlayLayer.appendChild(canvas);
    }
    draw() {
      const proj = this.getProjection();
      const canvas = this.canvas;
      if (!proj || !canvas) return;

      const positions = this.points
        .map((p) => ({ px: proj.fromLatLngToDivPixel(p.location), w: p.weight }))
        .filter((p) => p.px);
      if (positions.length === 0) return;

      const MAX_R = 64;
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      for (const { px } of positions) {
        minX = Math.min(minX, px.x);
        minY = Math.min(minY, px.y);
        maxX = Math.max(maxX, px.x);
        maxY = Math.max(maxY, px.y);
      }
      const pad = MAX_R + 4;
      const left = Math.floor(minX - pad);
      const top = Math.floor(minY - pad);
      const width = Math.max(1, Math.ceil(maxX - minX + pad * 2));
      const height = Math.max(1, Math.ceil(maxY - minY + pad * 2));
      canvas.style.left = `${left}px`;
      canvas.style.top = `${top}px`;
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.clearRect(0, 0, width, height);

      const ws = positions.map((p) => p.w);
      const wmin = Math.min(...ws);
      const wmax = Math.max(...ws);
      for (const { px, w } of positions) {
        const t = wmax > wmin ? (w - wmin) / (wmax - wmin) : 1;
        const r = MAX_R * (0.5 + 0.5 * t);
        const cx = px.x - left;
        const cy = px.y - top;
        const [cr, cg, cb] = heatColor(t);
        const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
        grad.addColorStop(0, `rgba(${cr},${cg},${cb},0.75)`);
        grad.addColorStop(0.5, `rgba(${cr},${cg},${cb},0.32)`);
        grad.addColorStop(1, `rgba(${cr},${cg},${cb},0)`);
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    onRemove() {
      if (this.canvas && this.canvas.parentNode) this.canvas.parentNode.removeChild(this.canvas);
      this.canvas = null;
    }
  };
  return HeatOverlayClass;
}

export function MarketMap({
  markets,
  commodity,
  onFindBuyers,
}: {
  markets: MapMarket[];
  commodity: string;
  /** Called when the user clicks "Cari Buyer" inside a country's info card. */
  onFindBuyers?: (country: string) => void;
}) {
  const divRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<any>(null);
  const googleRef = useRef<any>(null);
  const overlaysRef = useRef<any[]>([]);
  const infoWindowRef = useRef<any>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  // Keep the latest callback in a ref so renderOverlays doesn't depend on it
  // (avoids re-creating every marker whenever the parent re-renders).
  const onFindBuyersRef = useRef(onFindBuyers);
  onFindBuyersRef.current = onFindBuyers;

  const renderOverlays = useCallback((google: any) => {
    const map = mapRef.current;
    if (!map) return;
    // Clear previous overlays. OverlayView (heat layer) uses setMap(null);
    // AdvancedMarkerElement is removed by clearing its `.map`.
    overlaysRef.current.forEach((o) => {
      if (typeof o.setMap === "function") o.setMap(null);
      else o.map = null;
    });
    overlaysRef.current = [];

    // Only markets we can place on the map AND that have a trade value.
    const valid = markets.filter((m) => coordsForCountry(m.partner) && m.tradeValueUsd);
    if (valid.length === 0) return;

    const total = valid.reduce((a, m) => a + (m.tradeValueUsd as number), 0);
    const weights = valid.map((m) => Math.max(1, Math.log10(m.tradeValueUsd as number)));
    const wmin = Math.min(...weights);
    const wmax = Math.max(...weights);

    const points: any[] = [];
    const bounds = new google.maps.LatLngBounds();

    valid.forEach((m, i) => {
      const c = coordsForCountry(m.partner)!;
      const value = m.tradeValueUsd as number;
      const latLng = new google.maps.LatLng(c.lat, c.lng);
      const weight = weights[i];
      points.push({ location: latLng, weight });
      bounds.extend(latLng);

      // Pin colour follows the same low→high heat scale as the layer beneath it.
      const t = wmax > wmin ? (weight - wmin) / (wmax - wmin) : 1;
      const rgb = heatColor(t);
      const pin = new google.maps.marker.PinElement({
        glyphText: m.partner.slice(0, 3),
        glyphColor: "#ffffff",
        background: `rgb(${rgb[0]},${rgb[1]},${rgb[2]})`,
        borderColor: "rgba(15,23,42,0.55)",
        scale: 1.15,
      });
      const marker = new google.maps.marker.AdvancedMarkerElement({
        position: latLng,
        map,
        title: `${m.partner}: ${fmtUsd(value)}`,
        // v65+: pass the PinElement directly (the `.element` getter is deprecated).
        content: pin,
        gmpClickable: true,
      });

      const share = total > 0 ? Math.round((value / total) * 100) : 0;
      // v65+: AdvancedMarkerElement fires the DOM custom event `gmp-click`. Reuse a
      // single shared InfoWindow so opening one closes any other.
      marker.addEventListener("gmp-click", () => {
        const iw = infoWindowRef.current;
        if (!iw) return;
        iw.setContent(infoCardHtml(m.partner, commodity, value, share, rgb));
        iw.open({ anchor: marker, map });
        // The info card is raw HTML — bind the "Cari Buyer" button once its DOM
        // is mounted. `domready` fires each time content is (re)opened.
        google.maps.event.addListenerOnce(iw, "domready", () => {
          const btn = document.getElementById("tc-find-buyers");
          if (btn) {
            btn.onclick = () => {
              iw.close();
              onFindBuyersRef.current?.(m.partner);
            };
          }
        });
      });
      overlaysRef.current.push(marker);
    });

    const HeatOverlay = getHeatOverlayClass(google);
    const heat = new HeatOverlay(points);
    heat.setMap(map);
    overlaysRef.current.push(heat);

    map.fitBounds(bounds, 60);
  }, [markets, commodity]);

  // Load Google Maps and create the map instance exactly once. Only a genuine
  // script/map-load failure sets the "error" state.
  useEffect(() => {
    let cancelled = false;
    loadGoogleMaps(API_CONFIG.googleMapsApiKey)
      .then((google) => {
        if (cancelled || !divRef.current) return;
        googleRef.current = google;
        if (!mapRef.current) {
          mapRef.current = new google.maps.Map(divRef.current, {
            center: { lat: 20, lng: 40 },
            zoom: 2,
            // Required by google.maps.marker.AdvancedMarkerElement. With a mapId,
            // styling is controlled by the cloud-based map style, so inline JSON
            // `styles` are ignored by the API and intentionally omitted here.
            mapId: API_CONFIG.googleMapsMapId,
            mapTypeControl: false,
            streetViewControl: false,
            fullscreenControl: false,
          });
          // Single shared InfoWindow with no header/close button. It auto-closes
          // when the user clicks anywhere else on the map (no need to hit an "X").
          infoWindowRef.current = new google.maps.InfoWindow({ headerDisabled: true });
          mapRef.current.addListener("click", () => infoWindowRef.current?.close());
        }
        setStatus("ready");
      })
      .catch((e) => {
        console.warn("Google Maps failed to load:", e);
        if (!cancelled) setStatus("error");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // (Re)render overlays whenever the map is ready or the data changes. An error
  // here must NOT blank the map — the map itself loaded fine, so we only log it.
  useEffect(() => {
    if (status !== "ready" || !googleRef.current || !mapRef.current) return;
    try {
      renderOverlays(googleRef.current);
    } catch (e) {
      console.warn("Failed to render market map overlays:", e);
    }
  }, [status, renderOverlays]);

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
