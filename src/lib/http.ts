import { API_CONFIG } from "./config";
import { getToken, refreshSession, redirectToLogin } from "./auth";

// ── Authenticated API client ─────────────────────────────────────────────────
// Every request uses the real backend session token. On a 401 (expired access
// token) the client silently refreshes via the rotating refresh token and retries
// the original request once; if refresh fails the session is cleared and the user
// is sent to /login. The app NEVER auto-authenticates without a real session.

const authHeader = (): Record<string, string> => {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};

async function request<T>(
  path: string,
  init: { method: string; body?: unknown },
  opts?: { timeoutMs?: number },
): Promise<T> {
  const send = async (): Promise<Response> => {
    const headers: Record<string, string> = { ...authHeader() };
    if (init.body !== undefined) headers["Content-Type"] = "application/json";
    const controller = opts?.timeoutMs ? new AbortController() : null;
    const timer = controller ? setTimeout(() => controller.abort(), opts!.timeoutMs) : null;
    try {
      return await fetch(`${API_CONFIG.baseUrl}${path}`, {
        method: init.method,
        headers,
        body: init.body !== undefined ? JSON.stringify(init.body) : undefined,
        signal: controller?.signal,
      });
    } finally {
      if (timer) clearTimeout(timer);
    }
  };

  let res = await send();

  // Silent refresh + retry once on an expired access token.
  if (res.status === 401 && getToken()) {
    const refreshed = await refreshSession();
    if (refreshed) res = await send();
  }

  if (!res.ok) {
    if (res.status === 401) redirectToLogin();
    const err = new Error(`Gateway ${path} responded ${res.status}`) as Error & { status?: number };
    err.status = res.status;
    throw err;
  }

  const text = await res.text();
  return (text ? JSON.parse(text) : {}) as T;
}

export const apiGet = <T>(path: string): Promise<T> => request<T>(path, { method: "GET" });

export const apiPost = <T>(path: string, body: unknown, opts?: { timeoutMs?: number }): Promise<T> =>
  request<T>(path, { method: "POST", body }, opts);

export const apiPatch = <T>(path: string, body: unknown): Promise<T> =>
  request<T>(path, { method: "PATCH", body });

export const apiDelete = <T = unknown>(path: string): Promise<T> =>
  request<T>(path, { method: "DELETE" });

export const isLive = () => API_CONFIG.mode === "live";
