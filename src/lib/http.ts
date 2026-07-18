import { API_CONFIG } from "./config";

// ── JWT handling ────────────────────────────────────────────────────────────
// All gateway feature endpoints are behind JwtAuthGuard. This helper obtains a
// token transparently (login → fall back to register) and caches it so pages
// never have to manage auth themselves.

const TOKEN_KEY = "tradeconnect_access_token";

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

function setToken(token: string) {
  if (typeof window !== "undefined") localStorage.setItem(TOKEN_KEY, token);
}

function clearToken() {
  if (typeof window !== "undefined") localStorage.removeItem(TOKEN_KEY);
}

let inflightAuth: Promise<string | null> | null = null;

async function authenticate(): Promise<string | null> {
  // Try login; if the demo account does not exist yet, self-register.
  const creds = { email: API_CONFIG.demoEmail, password: API_CONFIG.demoPassword };
  try {
    const loginRes = await fetch(`${API_CONFIG.baseUrl}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(creds),
    });
    if (loginRes.ok) {
      const data = await loginRes.json();
      if (data?.accessToken) {
        setToken(data.accessToken);
        return data.accessToken;
      }
    }
  } catch {
    // network error → caller falls back to mock
    return null;
  }

  // Login failed (likely account missing) → register.
  // AuthRegisterDto only accepts { email, password } (whitelist + forbidNonWhitelisted).
  try {
    const registerRes = await fetch(`${API_CONFIG.baseUrl}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(creds),
    });
    if (registerRes.ok || registerRes.status === 201) {
      const data = await registerRes.json();
      if (data?.accessToken) {
        setToken(data.accessToken);
        return data.accessToken;
      }
    }
  } catch {
    return null;
  }
  return null;
}

async function ensureToken(): Promise<string | null> {
  const existing = getToken();
  if (existing) return existing;
  if (!inflightAuth) {
    inflightAuth = authenticate().finally(() => {
      inflightAuth = null;
    });
  }
  return inflightAuth;
}

/**
 * POST JSON to a gateway endpoint with an automatically-managed bearer token.
 * Returns the parsed JSON body, or throws so callers can fall back to mock.
 * Retries once after re-authenticating on a 401.
 */
export async function apiPost<T>(
  path: string,
  body: unknown,
  opts?: { timeoutMs?: number },
): Promise<T> {
  const doRequest = async (token: string | null): Promise<Response> => {
    const controller = opts?.timeoutMs ? new AbortController() : null;
    const timer = controller ? setTimeout(() => controller.abort(), opts!.timeoutMs) : null;
    try {
      return await fetch(`${API_CONFIG.baseUrl}${path}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(body),
        signal: controller?.signal,
      });
    } finally {
      if (timer) clearTimeout(timer);
    }
  };

  let token = await ensureToken();
  let res = await doRequest(token);

  if (res.status === 401) {
    clearToken();
    token = await ensureToken();
    res = await doRequest(token);
  }

  if (!res.ok) {
    throw new Error(`Gateway ${path} responded ${res.status}`);
  }
  return (await res.json()) as T;
}

/** PATCH JSON to a gateway endpoint with an automatically-managed bearer token. */
export async function apiPatch<T>(path: string, body: unknown): Promise<T> {
  const doRequest = async (token: string | null): Promise<Response> =>
    fetch(`${API_CONFIG.baseUrl}${path}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(body),
    });

  let token = await ensureToken();
  let res = await doRequest(token);
  if (res.status === 401) {
    clearToken();
    token = await ensureToken();
    res = await doRequest(token);
  }
  if (!res.ok) throw new Error(`Gateway ${path} responded ${res.status}`);
  return (await res.json()) as T;
}

/**
 * GET JSON from a gateway endpoint with an automatically-managed bearer token.
 * Retries once after re-authenticating on a 401. Throws on non-2xx so callers
 * can branch (e.g. treat 404 as "not created yet").
 */
export async function apiGet<T>(path: string): Promise<T> {
  const doRequest = async (token: string | null): Promise<Response> =>
    fetch(`${API_CONFIG.baseUrl}${path}`, {
      method: "GET",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });

  let token = await ensureToken();
  let res = await doRequest(token);

  if (res.status === 401) {
    clearToken();
    token = await ensureToken();
    res = await doRequest(token);
  }

  if (!res.ok) {
    const err = new Error(`Gateway ${path} responded ${res.status}`) as Error & { status?: number };
    err.status = res.status;
    throw err;
  }
  return (await res.json()) as T;
}

/** DELETE a gateway endpoint with an automatically-managed bearer token. */
export async function apiDelete<T = unknown>(path: string): Promise<T> {
  const doRequest = async (token: string | null): Promise<Response> =>
    fetch(`${API_CONFIG.baseUrl}${path}`, {
      method: "DELETE",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });

  let token = await ensureToken();
  let res = await doRequest(token);
  if (res.status === 401) {
    clearToken();
    token = await ensureToken();
    res = await doRequest(token);
  }
  if (!res.ok) throw new Error(`Gateway ${path} responded ${res.status}`);
  // DELETE may return an empty body
  const text = await res.text();
  return (text ? JSON.parse(text) : {}) as T;
}

export const isLive = () => API_CONFIG.mode === "live";
