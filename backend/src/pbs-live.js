// Live PBS prices.
// Every month the Pakistan Bureau of Statistics publishes "Urban Construction Items Prices"
// (Monthly Review on Price Indices, Annex-III) as an Excel file on pbs.gov.pk.
// This module finds the newest file, downloads it, reads the city-wise prices of
// cement, bricks, sand, bajri, mason, labourer and plumber, checks every value against
// the bundled figures and caches the result.
//
//   PBS_LIVE=off         turn it off (bundled Sept 2026 figures are then used)
//   PBS_XLSX_URL=…       pin a specific file instead of finding the newest one
//   PBS_CACHE_HOURS=24   how often to look for a new file
import ExcelJS from "exceljs";
import { PBS } from "./shared/rates.js";

const BASE = (process.env.PBS_BASE_URL || "https://www.pbs.gov.pk").replace(/\/+$/, "");
const ON = (process.env.PBS_LIVE || "on").toLowerCase() !== "off";
const PINNED = process.env.PBS_XLSX_URL || "";
const TTL = (Number(process.env.PBS_CACHE_HOURS) || 24) * 3600 * 1000;
const RETRY = 30 * 60 * 1000; // after a failure, try again in 30 minutes
const UA = { "User-Agent": "Mozilla/5.0 (compatible; rwh-planner-api; +https://github.com/shanu222/RWH-planner)" };

const MONTHS = ["january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december"];
const SHORT = ["jan", "feb", "mar", "apr", "may", "june", "july", "aug", "sep", "oct", "nov", "dec"];

// Item matchers. First matching row that passes the sanity check wins.
const ITEMS = {
  cement:  { re: /cement/i },
  bricks:  { re: /brick/i },
  sand:    { re: /\bsand\b/i, not: /stone|paper/i },
  bajri:   { re: /bajri|crush|gravel|aggregate|stone/i, not: /sand/i },
  mason:   { re: /mason|raj\b/i },
  labour:  { re: /labou?r|helper|unskilled|mazdoor/i, not: /^\s*skilled/i },
  plumber: { re: /plumber/i },
};
const CITIES = Object.keys(PBS.cities);

let state = { prices: null, month: null, file: null, fetchedAt: 0, checkedAt: 0, error: null };
let inflight = null;

const text = v => {
  if (v == null) return "";
  if (typeof v === "object") {
    if (v.richText) return v.richText.map(r => r.text).join("");
    if ("result" in v) return text(v.result);
    if (v.text) return String(v.text);
  }
  return String(v);
};
const num = v => {
  const s = text(v).replace(/[,\s]/g, "");
  const n = Number(s);
  return s !== "" && Number.isFinite(n) ? n : NaN;
};
const norm = s => s.toLowerCase().replace(/[^a-z]/g, "");

async function get(url, type = "text") {
  const res = await fetch(url, { headers: UA, signal: AbortSignal.timeout(25000), redirect: "follow" });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return type === "buffer" ? Buffer.from(await res.arrayBuffer()) : res.text();
}

// ---------- find the newest file ----------
const isFile = u => /\.xlsx?(\?|$)/i.test(u) && /urb/i.test(u) && /constr/i.test(u);
const abs = u => (u.startsWith("http") ? u : BASE + (u.startsWith("/") ? "" : "/") + u);
const linksIn = html => [...html.matchAll(/href=["']([^"']+)["']/gi)].map(m => abs(m[1].replace(/&amp;/g, "&")));

function monthFrom(s) {
  const m = String(s).toLowerCase().match(/(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*[\s,_-]*(20\d\d)/);
  if (!m) return null;
  const i = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"].indexOf(m[1]);
  return `${m[2]}-${String(i + 1).padStart(2, "0")}`;
}

async function findLatest() {
  const tried = [];
  // 1) monthly report pages, newest first (slugs look like monthly-inflation-report-for-july-2026 / -oct-2025)
  const now = new Date();
  for (let back = 0; back < 5; back++) {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - back, 1));
    const y = d.getUTCFullYear(), m = d.getUTCMonth();
    for (const name of [...new Set([MONTHS[m], SHORT[m], MONTHS[m].slice(0, 3)])]) {
      const page = `${BASE}/monthly-inflation-report-for-${name}-${y}/`;
      try {
        const html = await get(page);
        const file = linksIn(html).find(isFile);
        if (file) return { file, month: `${y}-${String(m + 1).padStart(2, "0")}`, page };
        tried.push(page + " (no file link)");
      } catch (e) { tried.push(page + " (" + e.message + ")"); }
    }
  }
  // 2) WordPress search for the report posts
  try {
    const posts = JSON.parse(await get(`${BASE}/wp-json/wp/v2/posts?search=${encodeURIComponent("Monthly Price Indices")}&per_page=6&orderby=date`));
    for (const p of posts) {
      const file = linksIn(p.content?.rendered || "").find(isFile);
      if (file) return { file, month: monthFrom(p.title?.rendered || "") || monthFrom(p.date), page: p.link };
    }
  } catch (e) { tried.push("wp-json posts (" + e.message + ")"); }
  // 3) price statistics page
  try {
    const html = await get(`${BASE}/price-statistics/`);
    const file = linksIn(html).find(isFile);
    if (file) return { file, month: null, page: `${BASE}/price-statistics/` };
  } catch (e) { tried.push("price-statistics (" + e.message + ")"); }
  throw new Error("No PBS construction price file found. Tried: " + tried.slice(0, 4).join("; "));
}

// ---------- read the workbook (layout-agnostic) ----------
export async function parseWorkbook(buf) {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(buf);
  let best = null;
  wb.eachSheet(ws => {
    const grid = [];
    ws.eachRow({ includeEmpty: true }, (row, r) => {
      const cells = [];
      row.eachCell({ includeEmpty: true }, (c, col) => { cells[col - 1] = c.value; });
      grid[r - 1] = cells;
    });
    const res = parseGrid(grid);
    if (res && (!best || res.count > best.count)) best = res;
  });
  return best;
}

export function parseGrid(grid) {
  const T = grid.map(r => (r || []).map(text));
  // locate city labels
  const cityPos = {};
  T.forEach((row, r) => row.forEach((s, c) => {
    const n = norm(s);
    for (const city of CITIES) if (n === norm(city) && !cityPos[city]) cityPos[city] = { r, c };
  }));
  const found = Object.keys(cityPos);
  if (found.length < 3) return null;
  // orientation: cities across one row (columns) or down one column (rows)
  const rowsOf = {}, colsOf = {};
  for (const p of Object.values(cityPos)) { rowsOf[p.r] = (rowsOf[p.r] || 0) + 1; colsOf[p.c] = (colsOf[p.c] || 0) + 1; }
  const maxRow = Math.max(...Object.values(rowsOf)), maxCol = Math.max(...Object.values(colsOf));
  const citiesAcross = maxRow >= maxCol;

  const prices = {};
  let month = null;
  for (const row of T) for (const s of row) { const m = monthFrom(s); if (m) { month = m; break; } } // first month mention, usually the title
  for (const city of found) prices[city] = {};

  for (const [key, it] of Object.entries(ITEMS)) {
    if (citiesAcross) {
      // items are rows; label is any text cell left of the first city column
      const firstCityCol = Math.min(...found.map(c => cityPos[c].c));
      for (let r = 0; r < T.length; r++) {
        const label = (T[r] || []).slice(0, Math.max(1, firstCityCol)).join(" ");
        if (!it.re.test(label) || (it.not && it.not.test(label))) continue;
        const vals = {};
        for (const city of found) vals[city] = num(grid[r]?.[cityPos[city].c]);
        if (accept(key, vals, prices)) break;
      }
    } else {
      const firstCityRow = Math.min(...found.map(c => cityPos[c].r));
      const width = Math.max(...T.map(r => r.length));
      for (let c = 0; c < width; c++) {
        const label = T.slice(0, Math.max(1, firstCityRow)).map(r => r[c] || "").join(" ");
        if (!it.re.test(label) || (it.not && it.not.test(label))) continue;
        const vals = {};
        for (const city of found) vals[city] = num(grid[cityPos[city].r]?.[c]);
        if (accept(key, vals, prices)) break;
      }
    }
  }
  let count = 0;
  for (const city of found) count += Object.keys(prices[city]).length;
  return count ? { prices, month, count } : null;
}

// A row is accepted only if its values are within 0.5x–2x of the bundled figures for most cities.
// This rejects rows in other units (e.g. cement per tonne) or wrongly matched rows.
function accept(key, vals, prices) {
  let ok = 0, seen = 0;
  for (const [city, v] of Object.entries(vals)) {
    const ref = PBS.cities[city]?.[key];
    if (!Number.isFinite(v) || !ref) continue;
    seen++;
    if (v >= ref * 0.5 && v <= ref * 2) ok++;
  }
  if (seen < 3 || ok / seen < 0.7) return false;
  for (const [city, v] of Object.entries(vals)) {
    const ref = PBS.cities[city]?.[key];
    if (Number.isFinite(v) && ref && v >= ref * 0.5 && v <= ref * 2) prices[city][key] = Math.round(v * 100) / 100;
  }
  return true;
}

// ---------- public ----------
async function refresh() {
  state.checkedAt = Date.now();
  try {
    const found = PINNED ? { file: PINNED, month: monthFrom(PINNED), page: PINNED } : await findLatest();
    if (state.prices && state.file === found.file && Date.now() - state.fetchedAt < TTL * 30) { state.error = null; return; }
    const parsed = await parseWorkbook(await get(found.file, "buffer"));
    if (!parsed) throw new Error("Could not read city prices from " + found.file);
    state = { prices: parsed.prices, month: parsed.month || found.month, file: found.file, page: found.page, fetchedAt: Date.now(), checkedAt: Date.now(), error: null, count: parsed.count };
    console.log(`PBS: ${parsed.count} prices for ${state.month} from ${found.file}`);
  } catch (e) {
    state.error = e.message;
    console.error("PBS:", e.message);
  }
}

export async function pbsPrices() {
  if (!ON) return null;
  const age = Date.now() - state.checkedAt;
  const due = !state.checkedAt || (state.error ? age > RETRY : age > TTL);
  if (due && !inflight) inflight = refresh().finally(() => { inflight = null; });
  // first request waits (up to 20 s) for the first fetch; later requests use the cache while refreshing
  if (!state.prices && inflight) await Promise.race([inflight, new Promise(r => setTimeout(r, 20000))]);
  return state.prices ? state : null;
}

export function pbsStatus() {
  return {
    enabled: ON, month: state.month, file: state.file, page: state.page || null, values: state.count || 0,
    fetchedAt: state.fetchedAt ? new Date(state.fetchedAt).toISOString() : null,
    checkedAt: state.checkedAt ? new Date(state.checkedAt).toISOString() : null, error: state.error,
  };
}

// warm up on start
if (ON) setTimeout(() => { pbsPrices().catch(() => {}); }, 2000).unref?.();
