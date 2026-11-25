// Live rates: fetches the rate sheet at RATES_SOURCE_URL (CSV, e.g. a Google Sheet
// published as CSV), caches it, and merges it over the built-in published rates.
//
// Sheet columns (header row required, see rates-template.csv in the repo root):
//   key, city, rate, source, url, as_of
//   key   – one of: pipe4, elbow4, filter, tank, bajri, sand, bricks, cement, plumber, mason, labour, tanker
//   city  – blank = all cities; otherwise a PBS city (Islamabad, Rawalpindi, Lahore, Karachi, Peshawar,
//           Quetta, Multan, Abbottabad) or an app city key (islamabad, murree, …)
//   rate  – PKR, in the item's unit (see the template)
import { defaultRates, PBS_CITY, RATE_KEYS } from "./shared/rates.js";

const URL_ = process.env.RATES_SOURCE_URL || "";
const TTL = (Number(process.env.RATES_CACHE_MINUTES) || 360) * 60 * 1000;

let cache = { rows: null, fetchedAt: 0, error: null };
let inflight = null;

function parseCSV(text) {
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
  const res = await fetch(URL_, { signal: AbortSignal.timeout(10000), headers: { "User-Agent": "rwh-planner-api" } });
  if (!res.ok) throw new Error(`rate sheet HTTP ${res.status}`);
  const rows = parseCSV(await res.text());
  const head = rows.shift().map(h => h.trim().toLowerCase());
  const idx = n => head.indexOf(n);
  if (idx("key") < 0 || idx("rate") < 0) throw new Error("rate sheet needs 'key' and 'rate' columns");
  const out = [];
  for (const r of rows) {
    const key = (r[idx("key")] || "").trim();
    const rate = Number(String(r[idx("rate")] || "").replace(/[, ]/g, ""));
    if (!RATE_KEYS.includes(key) || !Number.isFinite(rate) || rate < 0) continue;
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
  if (!URL_) return null;
  if (cache.rows && Date.now() - cache.fetchedAt < TTL) return cache.rows;
  if (!inflight) {
    inflight = fetchSheet()
      .then(rows => { cache = { rows, fetchedAt: Date.now(), error: null }; return rows; })
      .catch(e => { console.error("rates:", e.message); cache.error = e.message; return cache.rows; }) // keep last good copy
      .finally(() => { inflight = null; });
  }
  return inflight;
}

// Rates for an app city: built-in published rates, overridden by matching sheet rows
// (a city-specific row beats an all-cities row).
export async function liveRates(cityKey) {
  const base = defaultRates(cityKey);
  const pbsCity = PBS_CITY[cityKey] || "";
  const rows = await sheetRows();
  let live = false;
  if (rows) {
    const match = c => !c || c.toLowerCase() === cityKey || c.toLowerCase() === pbsCity.toLowerCase();
    const rank = c => (c ? 1 : 0);
    const best = {};
    for (const r of rows) if (match(r.city) && (!best[r.key] || rank(r.city) >= rank(best[r.key].city))) best[r.key] = r;
    for (const [k, r] of Object.entries(best)) {
      base[k] = { ...base[k], rate: r.rate, src: r.src || base[k].src, url: r.url || base[k].url, asOf: r.asOf || base[k].asOf, estimate: false, live: true };
      live = true;
    }
  }
  return {
    city: cityKey, rates: base, live,
    fetchedAt: cache.fetchedAt ? new Date(cache.fetchedAt).toISOString() : null,
    sheetConfigured: !!URL_, error: cache.error,
  };
}
