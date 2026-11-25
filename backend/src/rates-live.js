// Live rates for the cost estimate. Layers, each overriding the one before:
//   1. bundled published rates (shared/rates.js, with sources)
//   2. PBS monthly "Urban Construction Items Prices" Excel, fetched automatically (pbs-live.js)
//   3. your Google Sheet at RATES_SOURCE_URL, for items PBS does not survey (pipes, fittings,
//      tanks, filters, tanker water) and for any correction
//   4. the user's own edits in the app (applied in calc.js)
//
// RATES_SOURCE_URL accepts a normal Google Sheets link (shared "Anyone with the link – Viewer"),
// a "Publish to web" CSV link, or any CSV URL. Sheet columns (see rates-template.csv):
//   key, city, rate, source, url, as_of
import { defaultRates, PBS, PBS_CITY, RATE_ITEMS, RATE_KEYS } from "./shared/rates.js";
import { pbsPrices, pbsStatus } from "./pbs-live.js";

const TTL = (Number(process.env.RATES_CACHE_MINUTES) || 360) * 60 * 1000;
const SHEET = sheetCsvUrl(process.env.RATES_SOURCE_URL || "");

// Google Sheets links -> Google's open CSV endpoint (Visualization API).
export function sheetCsvUrl(u) {
  u = u.trim();
  const m = u.match(/docs\.google\.com\/spreadsheets\/d\/([a-zA-Z0-9_-]{20,})/);
  if (!m || /\/d\/e\//.test(u) || /output=csv|format=csv|tqx=out:csv/.test(u)) return u;
  const gid = (u.match(/[#&?]gid=(\d+)/) || [])[1];
  return `https://docs.google.com/spreadsheets/d/${m[1]}/gviz/tq?tqx=out:csv${gid ? "&gid=" + gid : ""}`;
}

let cache = { rows: null, fetchedAt: 0, error: null };
let inflight = null;

export function parseCSV(text) {
  const rows = []; let row = [], field = "", q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) {
      if (c === '"' && text[i + 1] === '"') { field += '"'; i++; }
      else if (c === '"') q = false;
      else field += c;
    } else if (c === '"') q = true;
    else if (c === ",") { row.push(field); field = ""; }
    else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(field); field = ""; if (row.some(x => x.trim() !== "")) rows.push(row); row = [];
    } else field += c;
  }
  row.push(field); if (row.some(x => x.trim() !== "")) rows.push(row);
  return rows;
}

async function fetchSheet() {
  const res = await fetch(SHEET, { signal: AbortSignal.timeout(10000), headers: { "User-Agent": "rwh-planner-api" }, redirect: "follow" });
  if (!res.ok) throw new Error(`rate sheet HTTP ${res.status}${res.status === 401 || res.status === 403 ? " (share the sheet as 'Anyone with the link – Viewer')" : ""}`);
  const body = await res.text();
  if (/^\s*</.test(body)) throw new Error("rate sheet returned a web page, not CSV (share the sheet as 'Anyone with the link – Viewer')");
  const rows = parseCSV(body);
  const head = rows.shift().map(h => h.trim().toLowerCase());
  const idx = n => head.indexOf(n);
  if (idx("key") < 0 || idx("rate") < 0) throw new Error("rate sheet needs 'key' and 'rate' columns");
  const out = [];
  for (const r of rows) {
    const key = (r[idx("key")] || "").trim();
    const rate = Number(String(r[idx("rate")] || "").replace(/[, ]/g, ""));
    if (!RATE_KEYS.includes(key) || !Number.isFinite(rate) || rate <= 0) continue;
    out.push({
      key, rate,
      city: idx("city") >= 0 ? (r[idx("city")] || "").trim() : "",
      src: idx("source") >= 0 ? (r[idx("source")] || "").trim() : "",
      url: idx("url") >= 0 ? (r[idx("url")] || "").trim() : "",
      asOf: idx("as_of") >= 0 ? (r[idx("as_of")] || "").trim() : "",
    });
  }
  if (!out.length) throw new Error("rate sheet has no valid rows");
  return out;
}

async function sheetRows() {
  if (!SHEET) return null;
  if (cache.rows && Date.now() - cache.fetchedAt < TTL) return cache.rows;
  if (cache.error && Date.now() - cache.checkedAt < 5 * 60 * 1000) return cache.rows;
  if (!inflight) {
    inflight = fetchSheet()
      .then(rows => { cache = { rows, fetchedAt: Date.now(), checkedAt: Date.now(), error: null }; return rows; })
      .catch(e => { console.error("rates:", e.message); cache.error = e.message; cache.checkedAt = Date.now(); return cache.rows; })
      .finally(() => { inflight = null; });
  }
  return inflight;
}

const PBS_KEYS = RATE_ITEMS.filter(i => i.pbs).map(i => [i.key, i.pbs]);

export async function liveRates(cityKey) {
  const base = defaultRates(cityKey);
  const pbsCity = PBS_CITY[cityKey] || "Islamabad";
  const [pbs, rows] = await Promise.all([pbsPrices().catch(() => null), sheetRows()]);
  const sources = { pbs: false, sheet: false };

  // 2. PBS live file
  if (pbs && pbs.prices[pbsCity]) {
    for (const [key, field] of PBS_KEYS) {
      const v = pbs.prices[pbsCity][field];
      if (v) { base[key] = { ...base[key], rate: v, asOf: pbs.month || base[key].asOf, url: pbs.page || pbs.file, live: "pbs" }; sources.pbs = true; }
    }
  }
  // 3. Google Sheet (a city-specific row beats an all-cities row)
  if (rows) {
    const match = c => !c || c.toLowerCase() === cityKey || c.toLowerCase() === pbsCity.toLowerCase();
    const best = {};
    for (const r of rows) if (match(r.city) && (!best[r.key] || (r.city ? 1 : 0) >= (best[r.key].city ? 1 : 0))) best[r.key] = r;
    for (const [k, r] of Object.entries(best)) {
      base[k] = { ...base[k], rate: r.rate, src: r.src || base[k].src, url: r.url || base[k].url, asOf: r.asOf || base[k].asOf, estimate: false, live: "sheet" };
      sources.sheet = true;
    }
  }
  return {
    city: cityKey, rates: base,
    live: sources.pbs || sources.sheet, sources,
    pbsMonth: sources.pbs ? pbs.month : null,
    bundledMonth: PBS.asOf,
    fetchedAt: new Date(Math.max(pbs?.fetchedAt || 0, cache.fetchedAt || 0) || Date.now()).toISOString(),
    sheetConfigured: !!SHEET,
  };
}

export function ratesStatus() {
  return {
    pbs: pbsStatus(),
    sheet: { configured: !!SHEET, url: SHEET ? SHEET.replace(/(spreadsheets\/d\/[^/]{6})[^/]+/, "$1…") : null, rows: cache.rows?.length || 0,
      fetchedAt: cache.fetchedAt ? new Date(cache.fetchedAt).toISOString() : null, error: cache.error },
  };
}
