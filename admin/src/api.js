export const API = (import.meta.env.VITE_API_URL || "").replace(/\/+$/, "");
export const $ = id => document.getElementById(id);
export const esc = v => String(v ?? "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const KEY = "rwh-admin-session";
export const session = {
  get: () => { try { return sessionStorage.getItem(KEY) || ""; } catch { return ""; } },
  set: t => { try { t ? sessionStorage.setItem(KEY, t) : sessionStorage.removeItem(KEY); } catch {} },
};
export async function api(path, opts = {}) {
  let res;
  try {
    res = await fetch(API + path, { ...opts, headers: { "Content-Type": "application/json", Authorization: "Bearer " + session.get(), ...(opts.headers || {}) } });
  } catch { throw new Error("Cannot reach the server. Check VITE_API_URL and ALLOWED_ORIGINS."); }
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    if (res.status === 401 && !path.endsWith("/login")) { session.set(""); location.reload(); }
    const e = new Error(body.error || "Request failed (" + res.status + ")"); e.status = res.status; throw e;
  }
  return body;
}
export const say = (el, m, kind) => { el.textContent = m || ""; el.className = el.className.replace(/\b(ok|err)\b/g, "").trim() + (kind ? " " + kind : ""); };
