// Remote app settings from the admin (GET /api/app-config): announcement banner and feature switches.
// The same settings drive the Android app, so an admin change shows up in both.
import { validateAppConfig } from "./shared/app-config.js";

const $ = id => document.getElementById(id);
const DISMISS = "rwh-ann-dismissed";
let cfg = null, getLang = () => "en";

export async function initRemote({ api, lang }) {
  getLang = lang;
  if (!api) return null;
  try {
    const r = await fetch(`${api}/api/app-config`, { signal: AbortSignal.timeout(15000) });
    if (!r.ok) return null;
    const raw = await r.json();
    cfg = { ...validateAppConfig(raw).config, ai: raw.ai };
  } catch { return null; }
  if (!cfg.features.videos) { $("v-training") && ($("v-training").hidden = true); document.querySelector('[data-tab="training"]')?.setAttribute("hidden", ""); }
  if (!cfg.features.ai) document.querySelector('[data-tab="assistant"]')?.setAttribute("hidden", "");
  renderAnnouncement();
  return cfg;
}

export const featureOn = k => !cfg || cfg.features[k] !== false;

export function renderAnnouncement() {
  let el = $("announce");
  const a = cfg?.announcement, L = getLang();
  let dismissed = ""; try { dismissed = localStorage.getItem(DISMISS) || ""; } catch {}
  const text = a && (a[L] || a.en || a.ur);
  if (!a || !a.enabled || !text || dismissed === a.id) { if (el) el.hidden = true; return; }
  if (!el) {
    el = document.createElement("div"); el.id = "announce"; el.className = "announce"; el.setAttribute("role", "status");
    document.querySelector(".appbar").after(el);
  }
  el.hidden = false;
  el.dir = L === "ur" ? "rtl" : "ltr"; el.lang = L;
  el.innerHTML = "";
  const box = document.createElement("div"); box.className = "container announce-in";
  const p = document.createElement(a.link ? "a" : "span");
  p.textContent = text;
  if (a.link) { p.href = a.link; p.target = "_blank"; p.rel = "noopener"; }
  const x = document.createElement("button"); x.type = "button"; x.className = "announce-x"; x.setAttribute("aria-label", L === "ur" ? "بند کریں" : "Dismiss"); x.textContent = "×";
  x.onclick = () => { try { localStorage.setItem(DISMISS, a.id); } catch {} el.hidden = true; };
  box.append(p, x); el.append(box);
}
