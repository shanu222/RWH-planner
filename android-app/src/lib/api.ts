// API client with timeouts and an offline cache (stale-while-revalidate).
import { API_URL } from "./config";
import { readJSON, writeJSON } from "./storage";

export class ApiError extends Error {
  status: number;
  constructor(message: string, status = 0) { super(message); this.status = status; }
}

export async function request(path: string, init: RequestInit & { timeout?: number } = {}) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), init.timeout ?? 20000);
  try {
    const res = await fetch(API_URL + path, {
      ...init,
      signal: ctrl.signal,
      // always revalidate: admin changes (rates, videos, app settings) must show up on the next refresh,
      // not after the HTTP cache lifetime the API sends for browsers
      cache: "no-store",
      headers: { Accept: "application/json", "Cache-Control": "no-cache", Pragma: "no-cache",...(init.body ? { "Content-Type": "application/json" } : {}), ...(init.headers || {}) },
    });
    if (!res.ok) {
      let msg = `HTTP ${res.status}`;
      try { const j = await res.json(); if (j?.error) msg = j.error; } catch {}
      throw new ApiError(msg, res.status);
    }
    return res;
  } catch (e) {
    if (e instanceof ApiError) throw e;
    throw new ApiError("network", 0);
  } finally {
    clearTimeout(timer);
  }
}

export async function getJSON<T>(path: string, timeout = 20000): Promise<T> {
  return (await request(path, { timeout })).json() as Promise<T>;
}

export async function postJSON<T>(path: string, body: unknown, timeout = 60000): Promise<T> {
  return (await request(path, { method: "POST", body: JSON.stringify(body), timeout })).json() as Promise<T>;
}

export type Cached<T> = { data: T; at: number; fromCache: boolean };

// Fetch fresh data and cache it; on failure return the cached copy (or throw if there is none).
export async function cachedGet<T>(path: string, key: string, timeout = 20000): Promise<Cached<T>> {
  try {
    const data = await getJSON<T>(path, timeout);
    const at = Date.now();
    writeJSON(key, { data, at });
    return { data, at, fromCache: false };
  } catch (e) {
    const hit = await readJSON<{ data: T; at: number } | null>(key, null);
    if (hit) return { ...hit, fromCache: true };
    throw e;
  }
}

export const readCache = <T,>(key: string) => readJSON<{ data: T; at: number } | null>(key, null);
