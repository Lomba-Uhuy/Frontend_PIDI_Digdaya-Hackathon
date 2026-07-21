import { API_CONFIG } from "./config";

// Centralized session — the single source of truth for authentication. The app
// NEVER auto-authenticates; a session exists only after a real backend login /
// register. Tokens live in localStorage purely as the session store (not business
// data). Ownership is always read from the backend using this token.
const TOKEN_KEY = "tradeconnect_access_token";
const REFRESH_KEY = "tradeconnect_refresh_token";

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setSession(accessToken: string, refreshToken?: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(TOKEN_KEY, accessToken);
  if (refreshToken) localStorage.setItem(REFRESH_KEY, refreshToken);
}

export function clearSession(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_KEY);
}

export function getRefreshToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(REFRESH_KEY);
}

export function hasSession(): boolean {
  return !!getToken();
}

// Concurrent-refresh protection: many in-flight 401s share ONE refresh call.
let refreshInflight: Promise<boolean> | null = null;

/**
 * Silently exchange the refresh token for a fresh access+refresh pair (rotation).
 * Returns true on success. Concurrent callers share a single request. On failure
 * the session is cleared (caller decides whether to redirect).
 */
export function refreshSession(): Promise<boolean> {
  if (refreshInflight) return refreshInflight;
  const rt = getRefreshToken();
  if (!rt) return Promise.resolve(false);
  refreshInflight = (async () => {
    try {
      const res = await fetch(`${API_CONFIG.baseUrl}/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken: rt }),
      });
      const data = await res.json().catch(() => ({} as Record<string, unknown>));
      const accessToken = (data as { accessToken?: string }).accessToken;
      if (res.ok && accessToken) {
        setSession(accessToken, (data as { refreshToken?: string }).refreshToken);
        return true;
      }
      clearSession();
      return false;
    } catch {
      return false;
    } finally {
      refreshInflight = null;
    }
  })();
  return refreshInflight;
}

export interface AuthResult {
  ok: boolean;
  error?: string;
}

export async function loginUser(email: string, password: string): Promise<AuthResult> {
  try {
    const res = await fetch(`${API_CONFIG.baseUrl}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json().catch(() => ({} as Record<string, unknown>));
    if (res.ok && (data as { accessToken?: string }).accessToken) {
      const d = data as { accessToken: string; refreshToken?: string };
      setSession(d.accessToken, d.refreshToken);
      return { ok: true };
    }
    return { ok: false, error: (data as { message?: string }).message || "Email atau kata sandi salah." };
  } catch {
    return { ok: false, error: "Tidak dapat terhubung ke server." };
  }
}

export async function registerUser(email: string, password: string): Promise<AuthResult> {
  try {
    const res = await fetch(`${API_CONFIG.baseUrl}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json().catch(() => ({} as Record<string, unknown>));
    if ((res.ok || res.status === 201) && (data as { accessToken?: string }).accessToken) {
      const d = data as { accessToken: string; refreshToken?: string };
      setSession(d.accessToken, d.refreshToken);
      return { ok: true };
    }
    if (res.status === 409) return { ok: false, error: "Email sudah terdaftar. Silakan masuk." };
    return { ok: false, error: (data as { message?: string }).message || "Registrasi gagal." };
  } catch {
    return { ok: false, error: "Tidak dapat terhubung ke server." };
  }
}

/** Clear the session and cached onboarding ids, then send the user to /login. */
export function logout(): void {
  clearSession();
  if (typeof window !== "undefined") {
    localStorage.removeItem("tradeconnect_umkm_id");
    localStorage.removeItem("tradeconnect_product_id");
    window.location.href = "/login";
  }
}

/** Called on a 401 — invalidate the session and bounce to /login (once). */
export function redirectToLogin(): void {
  if (typeof window === "undefined") return;
  clearSession();
  if (!window.location.pathname.startsWith("/login")) {
    window.location.href = "/login";
  }
}
