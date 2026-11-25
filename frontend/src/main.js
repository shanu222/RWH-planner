import "@fontsource/inter/400.css";
import "@fontsource/inter/500.css";
import "@fontsource/inter/600.css";
import "@fontsource/jetbrains-mono/500.css";
import "@fontsource/noto-nastaliq-urdu/400.css";
import "@fontsource/noto-nastaliq-urdu/700.css";
import "./styles.css";

import { CITIES, ROOFS, TANKS, DEFAULTS, FT2, STORM_M, compute, normalizeInputs, plotRoofArea } from "./shared/calc.js";
import { RATE_ITEMS, PLOTS, PBS, PBS_CITY } from "./shared/rates.js";
import { MONTHS, t, fmt, round100, money } from "./shared/i18n.js";
import { initLearn, renderTraining, renderGuides, openFromHash } from "./learn.js";
import { initAssistant, renderAssistant } from "./assistant.js";

const API = (import.meta.env.VITE_API_URL || "").replace(/\/+$/, "");
const STORE = "rwh-planner-v4";
const $ = id => document.getElementById(id);

// ---------- state ----------
let S = { ...DEFAULTS, lang: "en" };
try { const saved = JSON.parse(localStorage.getItem(STORE) || "null"); if (saved && typeof saved === "object") S = { ...S, ...saved }; } catch {}
// a shared design link (?d=…) overrides the saved inputs
const SHARE_KEYS = ["city", "plot", "marlaSize", "storeys", "area", "unit", "roof", "people", "lpcd", "houses", "tank", "rain", "contingency", "rates"];
try {
  const d = new URLSearchParams(location.search).get("d");
  if (d) {
    const json = JSON.parse(decodeURIComponent(escape(atob(d.replace(/-/g, "+").replace(/_/g, "/")))));
    for (const k of SHARE_KEYS) if (k in json) S[k] = json[k]; else if (k === "rates" || k === "rain" || k === "tank") S[k] = null;
    history.replaceState(null, "", location.pathname + location.hash);
  }
} catch {}
S = { ...normalizeInputs(S), lang: S.lang === "ur" ? "ur" : "en" };
function shareUrl() {
  const o = {}; for (const k of SHARE_KEYS) if (S[k] != null) o[k] = S[k];
  const d = btoa(unescape(encodeURIComponent(JSON.stringify(o)))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  return `${location.origin}${location.pathname}?d=${d}#overview`;
}
let lastResult = null;
let published = null;   // live rates from the API for the current city
let ratesMeta = null;   // { live, fetchedAt, … } or { offline: true }

// ---------- build static controls ----------
const citySel = $("city"), roofSel = $("roof"), monthsEl = $("months");
MONTHS.en.forEach((m, i) => {
  const l = document.createElement("label"); l.htmlFor = "m" + i;
  const sp = document.createElement("span"); sp.className = "mname"; l.appendChild(sp);
  const inp = document.createElement("input"); inp.type = "number"; inp.min = "0"; inp.step = "0.1"; inp.id = "m" + i; inp.inputMode = "decimal";
  inp.addEventListener("input", () => {
    const rain = S.rain ? S.rain.slice() : CITIES[S.city].mm.slice();
    rain[i] = Math.max(0, parseFloat(inp.value) || 0); S.rain = rain; S.tank = null; update();
  });
  l.appendChild(inp); monthsEl.appendChild(l);
});

function renderSelects() {
  const L = S.lang;
  citySel.innerHTML = ""; for (const [k, c] of Object.entries(CITIES)) { const o = document.createElement("option"); o.value = k; o.textContent = c[L] || c.en; citySel.appendChild(o); }
  roofSel.innerHTML = ""; for (const [k, r] of Object.entries(ROOFS)) { const o = document.createElement("option"); o.value = k; o.textContent = `${r[L] || r.en} · C ${r.c.toFixed(2)}`; roofSel.appendChild(o); }
  const plotSel = $("plot"); plotSel.innerHTML = "";
  for (const p of PLOTS) { const o = document.createElement("option"); o.value = p.key; o.textContent = p[L] || p.en; plotSel.appendChild(o); }
  const oc = document.createElement("option"); oc.value = "custom"; oc.textContent = t(L, "customArea"); plotSel.appendChild(oc);
}

function applyLang() {
  const L = S.lang;
  document.documentElement.lang = L;
  document.documentElement.dir = L === "ur" ? "rtl" : "ltr";
  document.title = t(L, "appName");
  document.querySelectorAll("[data-t]").forEach(el => { el.textContent = t(L, el.dataset.t); });
  $("lnEn").setAttribute("aria-pressed", L === "en"); $("lnUr").setAttribute("aria-pressed", L === "ur");
  document.querySelectorAll(".mname").forEach((el, i) => { el.textContent = L === "ur" ? MONTHS.ur[i] : MONTHS.en[i]; });
  renderSelects();
  fillForm();
  if (lastResult) renderRates(lastResult, true);
  renderRateStatus();
  if (view === "training") renderTraining();
  if (view === "guides") renderGuides();
  if (view === "assistant") renderAssistant();
}

function fillForm() {
  citySel.value = S.city; roofSel.value = S.roof;
  const rain = S.rain || CITIES[S.city].mm;
  rain.forEach((v, i) => { const el = $("m" + i); if (document.activeElement !== el) el.value = v; });
  const c = CITIES[S.city];
  $("src").innerHTML = `${t(S.lang, "source")}: <a href="${c.url}" target="_blank" rel="noopener">${t(S.lang, "climateTable", { city: c[S.lang] || c.en })}</a>, <span dir="ltr">${c.src}</span>.`;
  const a = $("area"); if (document.activeElement !== a) a.value = S.unit === "ft2" ? Math.round(S.area / FT2) : Math.round(S.area * 10) / 10;
  $("uM2").setAttribute("aria-pressed", S.unit === "m2"); $("uFt").setAttribute("aria-pressed", S.unit === "ft2");
  for (const k of ["people", "lpcd", "houses", "storeys", "contingency"]) { const el = $(k); if (document.activeElement !== el) el.value = S[k]; }
  $("plot").value = S.plot; $("marlaSize").value = String(S.marlaSize); $("marlaSize").disabled = S.plot === "custom";
}

// ---------- events ----------
$("lnEn").addEventListener("click", () => { S.lang = "en"; applyLang(); update(); });
$("lnUr").addEventListener("click", () => { S.lang = "ur"; applyLang(); update(); });
citySel.addEventListener("change", () => { S.city = citySel.value; S.rain = null; S.tank = null; S.rates = null; fillForm(); update(); loadRates(); });
$("plot").addEventListener("change", e => { S.plot = e.target.value; if (S.plot !== "custom") S.area = plotRoofArea(S.plot, S.marlaSize); S.tank = null; fillForm(); update(); });
$("marlaSize").addEventListener("change", e => { S.marlaSize = Number(e.target.value); if (S.plot !== "custom") S.area = plotRoofArea(S.plot, S.marlaSize); S.tank = null; fillForm(); update(); });
roofSel.addEventListener("change", () => { S.roof = roofSel.value; S.tank = null; update(); });
$("resetRain").addEventListener("click", () => { S.rain = null; S.tank = null; fillForm(); update(); });
$("area").addEventListener("input", e => { const v = parseFloat(e.target.value) || 0; S.area = S.unit === "ft2" ? v * FT2 : v; S.plot = "custom"; $("plot").value = "custom"; $("marlaSize").disabled = true; S.tank = null; update(); });
$("uM2").addEventListener("click", () => { S.unit = "m2"; fillForm(); update(); });
$("uFt").addEventListener("click", () => { S.unit = "ft2"; fillForm(); update(); });
for (const k of ["people", "lpcd", "houses", "storeys", "contingency"]) {
  $(k).addEventListener("input", e => { const v = Number(e.target.value); S[k] = Number.isFinite(v) && v >= 0 ? v : 0; if (k === "people" || k === "lpcd") S.tank = null; update(); });
}
$("resetRates").addEventListener("click", () => { S.rates = null; S.tank = null; renderRates(lastResult, true); update(); });

// ---------- live rates ----------
async function loadRates() {
  const city = S.city;
  if (!API) { published = null; ratesMeta = { builtIn: true }; renderRateStatus(); update(); return; }
  try {
    let res;
    for (let attempt = 0; attempt < 2; attempt++) {
      try { res = await fetch(`${API}/api/rates?city=${encodeURIComponent(city)}`, { signal: AbortSignal.timeout(25000) }); if (res.ok) break; }
      catch (e) { if (attempt) throw e; }
      await new Promise(r => setTimeout(r, 1500));
    }
    if (!res || !res.ok) throw new Error("HTTP " + (res && res.status));
    const data = await res.json();
    if (city !== S.city) return;
    published = data.rates; ratesMeta = data;
  } catch (e) {
    console.warn("rates:", e.message); published = null; ratesMeta = { offline: true };
  }
  renderRates(null, true); renderRateStatus(); update();
}
$("tank").addEventListener("input", e => { S.tank = TANKS[+e.target.value]; update(); });

// ---------- charts ----------
const narrow = id => { const el = $(id); return el && el.clientWidth > 0 && el.clientWidth < 560; };
const svg = (w, h, inner) => `<svg viewBox="0 0 ${w} ${h}" role="img">${inner}</svg>`;
function niceMax(v) { if (v <= 0) return 1; const p = Math.pow(10, Math.floor(Math.log10(v))); const f = v / p; return (f <= 1 ? 1 : f <= 2 ? 2 : f <= 2.5 ? 2.5 : f <= 5 ? 5 : 10) * p; }

function monthChart(r) {
  const n = narrow("monthChart"), W = n ? 380 : 640, H = n ? 230 : 220, L = 44, R = 8, T = 8, B = 26, iw = W - L - R, ih = H - T - B;
  const mx = niceMax(Math.max(...r.inflow, ...r.demand));
  const names = S.lang === "ur" ? MONTHS.ur : MONTHS.en;
  let g = "";
  for (let i = 0; i <= 4; i++) { const y = T + ih - ih * i / 4, v = mx * i / 4 / 1000; g += `<line x1="${L}" x2="${W - R}" y1="${y}" y2="${y}" stroke="var(--line)"/><text x="${L - 6}" y="${y + 4}" text-anchor="end">${fmt(v, v % 1 ? 1 : 0)}k</text>`; }
  const bw = iw / 12;
  r.inflow.forEach((v, i) => {
    const x = L + i * bw, h = ih * v / mx, dh = ih * r.demand[i] / mx;
    g += `<rect x="${x + bw * 0.14}" y="${T + ih - h}" width="${bw * 0.42}" height="${Math.max(0, h)}" rx="3" fill="var(--rain)"><title>${names[i]}: ${fmt(v)} L</title></rect>`;
    g += `<rect x="${x + bw * 0.58}" y="${T + ih - dh}" width="${bw * 0.28}" height="${Math.max(0, dh)}" rx="3" fill="var(--demand)" opacity=".85"><title>${names[i]}: ${fmt(r.demand[i])} L</title></rect>`;
    const lab = S.lang === "ur" ? (n ? "" : names[i]) : (n ? names[i][0] : names[i]);
    if (lab) g += `<text class="m" x="${x + bw / 2}" y="${H - 8}" text-anchor="middle">${lab}</text>`;
    else if (i % 2 === 0) g += `<text x="${x + bw / 2}" y="${H - 8}" text-anchor="middle">${i + 1}</text>`;
  });
  $("monthChart").innerHTML = svg(W, H, g);
  const wet = names.filter((m, i) => r.inflow[i] > r.demand[i]);
  $("monthNote").textContent = wet.length ? t(S.lang, "wetNote", { months: wet.join(t(S.lang, "listSep")) }) : t(S.lang, "dryNote");
}

function tankChart(r) {
  const n = narrow("tankChart"), W = n ? 380 : 640, H = n ? 210 : 190, L = 40, R = 14, T = 10, B = 28, iw = W - L - R, ih = H - T - B;
  const pct = r.curve.map(c => c.pct);
  const mx = Math.min(100, Math.max(20, Math.ceil(Math.max(...pct) / 20) * 20));
  const xs = i => L + iw * i / (TANKS.length - 1), ys = p => T + ih - ih * p / mx;
  let g = "", d = "", a = `M${xs(0)},${T + ih}`;
  for (let i = 0; i <= 4; i++) { const y = T + ih - ih * i / 4; g += `<line x1="${L}" x2="${W - R}" y1="${y}" y2="${y}" stroke="var(--line)"/><text x="${L - 6}" y="${y + 4}" text-anchor="end">${fmt(mx * i / 4)}%</text>`; }
  pct.forEach((p, i) => { d += `${i ? "L" : "M"}${xs(i)},${ys(p)}`; a += `L${xs(i)},${ys(p)}`; });
  a += `L${xs(TANKS.length - 1)},${T + ih}Z`;
  g += `<path d="${a}" fill="var(--accent)" opacity=".12"/><path d="${d}" fill="none" stroke="var(--accent)" stroke-width="2.5"/>`;
  TANKS.forEach((V, i) => { if (i % 2 === 0 || i === TANKS.length - 1) g += `<text x="${xs(i)}" y="${H - 8}" text-anchor="middle">${V / 1000}k</text>`; });
  g += `<line x1="${xs(r.recIdx)}" x2="${xs(r.recIdx)}" y1="${T}" y2="${T + ih}" stroke="var(--good)" stroke-dasharray="4 4"/>`;
  const si = TANKS.indexOf(r.tank);
  g += `<circle cx="${xs(si)}" cy="${ys(pct[si])}" r="6" fill="var(--surface)" stroke="var(--accent)" stroke-width="3"><title>${fmt(r.tank)} L: ${fmt(pct[si])}%</title></circle>`;
  $("tankChart").innerHTML = svg(W, H, g);
  $("tankAxis").textContent = t(S.lang, n ? "tankAxisShort" : "tankAxisLong");
}

// ---------- render ----------
function update() {
  const L = S.lang, r = compute(S, published);
  lastResult = r;
  const c = CITIES[S.city], cityName = c[L] || c.en;
  const litres = n => t(L, "litres", { n: fmt(round100(n)) });
  const pay = r.cost.payback;
  const wellWord = r.well.wells > 1 ? t(L, "wellN") : t(L, "well1");
  const wellText = t(L, "wellText", { n: r.well.wells, wellWord, d: fmt(r.well.diameter, 1), depth: fmt(r.well.depth, 1) });

  const plotName = S.plot === "custom" ? t(L, "customArea") : (PLOTS.find(p => p.key === S.plot)?.[L] || "");
  $("ovSub").textContent = t(L, "ovSub", { city: cityName + (r.edited ? " " + t(L, "edited") : ""), plot: plotName, area: fmt(r.A), people: S.people });
  $("hHarvest").textContent = fmt(round100(r.harvest));
  $("hMet").textContent = fmt(r.met) + "%";
  $("hMetS").textContent = t(L, "sMetU", { l: fmt(round100(r.sim.used)) });
  $("kTotal").textContent = money(L, r.cost.total);
  $("kTotalS").textContent = t(L, "sCostU", { p: fmt(r.boq.contingencyPct) });
  $("kPay").textContent = pay ? t(L, "yearsN", { n: fmt(pay, 1) }) : "–";
  $("kPayS").textContent = t(L, "sPayU", { s: money(L, r.cost.save) });
  const b = r.boq;
  $("sys").innerHTML = [
    [t(L, "sysRoof"), `${fmt(r.A)} ${t(L, "m2")} · ${fmt(r.A / FT2)} ${t(L, "ft2")}`],
    [t(L, "sysRain"), t(L, "mm", { n: fmt(r.annualRain) })],
    [t(L, "sysTank"), t(L, "sysTankV", { v: fmt(r.tank), n: b.tanks })],
    [t(L, "sysPipes"), t(L, "sysPipesV", { n: b.outlets, ft: fmt(b.pipeFt) })],
    [t(L, "sysFilters"), t(L, b.filters === 1 ? "sysFilters1" : "sysFiltersV", { n: b.filters })],
    [t(L, "sysWell"), wellText],
    [t(L, "sysTanker"), t(L, "tankersN", { n: fmt(r.tankersEquivalent, 1) })],
  ].map(([k, v]) => `<dt>${esc(k)}</dt><dd>${esc(v)}</dd>`).join("");
  monthTable(r);
  $("shareUrl").value = shareUrl();

  $("tank").value = TANKS.indexOf(r.tank);
  $("tankOut").textContent = t(L, "litres", { n: fmt(r.tank) });
  $("reco").innerHTML = t(L, "reco", { v: `<b class="num">${fmt(r.recommended)}</b>` });

  $("rOver").textContent = litres(r.well.overflow);
  $("rMonsoon").textContent = litres(r.well.monsoon);
  $("rStorm").textContent = t(L, "mm", { n: fmt(STORM_M * 1000) });
  $("rStore").textContent = t(L, "m3", { n: fmt(r.well.storm, 1) });
  $("rWell").textContent = wellText;

  $("cTotal").textContent = money(L, r.cost.total); $("cSave").textContent = money(L, r.cost.save);
  $("cPay").textContent = pay ? t(L, "yearsN", { n: fmt(pay, 1) }) : t(L, "noSaving");

  $("aHarvest").textContent = fmt(r.area.harvestML, 1);
  $("aTrips").textContent = fmt(r.area.tankerTrips);
  $("aRecharge").textContent = fmt(r.area.rechargeML, 1);
  $("aStorm").textContent = fmt(r.area.stormM3);

  if (view === "overview") monthChart(r);
  if (view === "water") tankChart(r);
  renderBoq(r, wellText); renderRates(r);
  const a = $("area"); if (document.activeElement !== a) a.value = S.unit === "ft2" ? Math.round(r.A / FT2) : Math.round(r.A * 10) / 10;
  $("summary").textContent = summaryText(r, L, cityName, wellText);
  try { localStorage.setItem(STORE, JSON.stringify(S)); } catch {}
}

function summaryText(r, L, cityName, wellText) {
  const ur = L === "ur", pay = r.cost.payback;
  const line = (k, v) => `${k}: ${v}`;
  return [
    ur ? "بارانی پانی پلانر – ڈیزائن کا خلاصہ" : "RWH PLANNER – DESIGN SUMMARY",
    line(t(L, "rLocation"), `${cityName} – ${t(L, "mm", { n: fmt(r.annualRain) })} ${ur ? "سالانہ بارش" : "rain per year"}`),
    line(t(L, "rRoofArea"), `${fmt(r.A)} ${t(L, "m2")} (${fmt(r.A / FT2)} ${t(L, "ft2")}), C ${r.C.toFixed(2)}, η 0.90`),
    line(t(L, "rDemand"), `${S.people} × ${S.lpcd} ${ur ? "لیٹر یومیہ" : "L/day"} = ${t(L, "litres", { n: fmt(r.dem) })}`),
    "",
    line(t(L, "rainCollected"), t(L, "litres", { n: fmt(round100(r.harvest)) })),
    line(t(L, "rSelectedTank"), `${t(L, "litres", { n: fmt(r.tank) })} (${t(L, "rRecommendedTank")}: ${fmt(r.recommended)})`),
    line(t(L, "rUsedYear"), `${t(L, "litres", { n: fmt(round100(r.sim.used)) })} = ${fmt(r.met)}%`),
    line(t(L, "overflowYear"), t(L, "litres", { n: fmt(round100(r.sim.over)) })),
    line(t(L, "suggestedWell"), wellText),
    "",
    line(t(L, "totalCost"), money(L, r.cost.total)),
    line(t(L, "cSave"), money(L, r.cost.save)),
    line(t(L, "cPay"), pay ? t(L, "yearsN", { n: fmt(pay, 1) }) : t(L, "noSaving")),
    "",
    t(L, "rDisclaimer"),
  ].join("\n");
}

function monthTable(r) {
  const L = S.lang, names = L === "ur" ? MONTHS.ur : MONTHS.en;
  const sum = a => a.reduce((x, y) => x + y, 0);
  const row = (m, rain, inn, dem) => { const bal = inn - dem; return `<td>${m}</td><td class="n">${fmt(rain, rain % 1 ? 1 : 0)}</td><td class="n">${fmt(round100(inn))}</td><td class="n">${fmt(round100(dem))}</td><td class="n ${bal >= 0 ? "pos" : "neg"}">${bal >= 0 ? "+" : "−"}${fmt(round100(Math.abs(bal)))}</td>`; };
  $("monthTable").innerHTML = `<thead><tr><th>${t(L, "colMonth")}</th><th class="n">${t(L, "colRain")}</th><th class="n">${t(L, "colCollected")}</th><th class="n">${t(L, "colDemand")}</th><th class="n">${t(L, "colBalance")}</th></tr></thead><tbody>` +
    r.inflow.map((v, i) => `<tr>${row(names[i], r.rain[i], v, r.demand[i])}</tr>`).join("") +
    `</tbody><tfoot class="year"><tr>${row(t(L, "colTotal"), sum(r.rain), sum(r.inflow), sum(r.demand))}</tr></tfoot>`;
}

// ---------- tabs (hash routing) ----------
const VIEWS = ["overview", "water", "cost", "recharge", "report", "training", "guides", "assistant"];
const LEARN = ["training", "guides", "assistant"];
let view = "overview";
function route() {
  const h = location.hash.replace("#", "").split("/")[0];
  view = VIEWS.includes(h) ? h : "overview";
  for (const v of VIEWS) $("v-" + v).hidden = v !== view;
  document.querySelectorAll(".tabs a").forEach(a => a.setAttribute("aria-selected", a.dataset.tab === view));
  document.body.classList.toggle("learn", LEARN.includes(view));
  if (view === "training") { renderTraining(); openFromHash(); } else openFromHash();
  if (view === "guides") renderGuides();
  if (view === "assistant") renderAssistant();
  if (!LEARN.includes(view)) update();
}
addEventListener("hashchange", () => { route(); window.scrollTo({ top: 0 }); });

// ---------- cost estimate ----------
const META = Object.fromEntries(RATE_ITEMS.map(i => [i.key, i]));
const GROUPS = [["conv", "gConv"], ["store", "gStore"], ["well", "gWell"], ["lab", "gLab"]];
const esc = v => String(v).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const unitOf = k => t(S.lang, "u_" + META[k].unit);
const itemName = k => META[k][S.lang] || META[k].en;

function renderBoq(r, wellText) {
  const L = S.lang, b = r.boq;
  $("specs").innerHTML = [
    t(L, "pipeLine", { n: b.outlets, size: L === "ur" ? "4 انچ (110 ملی میٹر)" : b.downpipe.size, a: fmt(b.roofFt2 / b.outlets), cap: fmt(b.downpipe.capacityFt2), mm: b.downpipe.designMmH, src: b.downpipe.src }),
    t(L, "storageLine", { n: b.tanks, v: fmt(r.tank) }),
    t(L, "wellLine", { w: wellText }),
  ].map(x => `<li>${esc(x)}</li>`).join("");
  const head = `<thead><tr><th>${t(L, "colItem")}</th><th>${t(L, "colQty")}</th><th>${t(L, "colUnit")}</th><th>${t(L, "colRate")}</th><th>${t(L, "colAmount")}</th></tr></thead>`;
  const body = GROUPS.map(([g, key]) => `<tr class="grp"><td colspan="4">${t(L, key)}</td><td class="n">${fmt(b.groups[g])}</td></tr>` +
    b.items.filter(i => i.group === g).map(i => {
      const rt = r.rates[i.key];
      const tag = rt.edited ? `<span class="tag">${t(L, "editedTag")}</span>` : rt.estimate ? `<span class="tag est">${t(L, "estimateTag")}</span>` : "";
      return `<tr><td>${esc(itemName(i.key))} ${tag}</td><td class="n">${fmt(i.qty, i.qty % 1 ? 2 : 0)}</td><td>${esc(unitOf(i.key))}</td><td class="n">${fmt(i.rate)}</td><td class="n">${fmt(i.amount)}</td></tr>`;
    }).join("")).join("");
  const foot = `<tfoot><tr><td colspan="4">${t(L, "subtotal")}</td><td class="n">${fmt(b.subtotal)}</td></tr>
    <tr><td colspan="4">${t(L, "contingency")} (${fmt(b.contingencyPct)}%)</td><td class="n">${fmt(b.contingency)}</td></tr>
    <tr class="grand"><td colspan="4">${t(L, "grandTotal")}</td><td class="n">${fmt(round100(b.total))}</td></tr></tfoot>`;
  $("boq").innerHTML = head + `<tbody>${body}</tbody>` + foot;
  $("boqTotalTop").textContent = money(L, b.total);
}

function renderRates(r, force) {
  r = r || lastResult; if (!r) return;
  const L = S.lang, tbl = $("ratesTable");
  if (!force && tbl.contains(document.activeElement)) return; // don't redraw while typing
  const keys = [...RATE_ITEMS.map(i => i.key)];
  tbl.innerHTML = `<thead><tr><th>${t(L, "colItem")}</th><th>${t(L, "colUnit")}</th><th>${t(L, "colRate")}</th><th>${t(L, "source")}</th></tr></thead><tbody>` +
    keys.map(k => {
      let rt = r.rates[k];
      const srcText = String(rt.src || "").replace(PBS.source, "PBS Monthly Review on Price Indices, Annex-III");
      rt = { ...rt, src: srcText };
      const src = rt.url ? `<a href="${esc(rt.url)}" target="_blank" rel="noopener">${esc(rt.src)}</a>` : esc(rt.src);
      const tags = (rt.estimate ? `<span class="tag est">${t(L, "estimateTag")}</span>` : "") + (rt.live ? `<span class="tag live">${t(L, "liveTag")}</span>` : "");
      return `<tr><td>${esc(itemName(k))}</td><td>${esc(unitOf(k))}</td>
        <td><input type="number" min="0" step="any" inputmode="decimal" data-rate="${k}" value="${Math.round(rt.rate * 100) / 100}" aria-label="${esc(itemName(k))}"${rt.edited ? ' class="edited"' : ""}></td>
        <td class="src"><span dir="ltr">${src}</span> <span class="asof">${t(L, "asOf", { d: esc(monthLabel(rt.asOf) || "–") })}</span> ${tags}</td></tr>`;
    }).join("") + "</tbody>";
}
// "2026-10" -> "Oct 2026" / "اکتوبر 2026"; full dates stay as they are
function monthLabel(s) {
  const m = /^(\d{4})-(\d{2})$/.exec(s || "");
  if (!m) return s;
  const names = S.lang === "ur" ? MONTHS.ur : MONTHS.en;
  return `${names[+m[2] - 1]} ${m[1]}`;
}

function renderRateStatus() {
  const L = S.lang, meta = ratesMeta || {};
  const m = monthLabel(meta.pbsMonth || PBS.asOf);
  let cls = "", label, hint;
  if (meta.live) {
    cls = "live";
    label = meta.sources?.pbs ? t(L, "rsLive", { m }) + (meta.sources?.sheet ? t(L, "rsSheet") : "") : t(L, "rsBundled", { m }) + t(L, "rsSheet");
    const when = meta.fetchedAt ? new Date(meta.fetchedAt).toLocaleString(L === "ur" ? "ur-PK" : "en-GB", { dateStyle: "medium", timeStyle: "short", numberingSystem: "latn" }) : "";
    hint = (meta.sources?.pbs ? t(L, "rsLiveHint", { m }) : t(L, "rsBundledHint", { m })) + (when ? " " + t(L, "rsChecked", { t: when }) : "");
  } else if (meta.offline) { cls = "off"; label = t(L, "rsOffline", { m }); hint = t(L, "rsOfflineHint", { m }); }
  else { label = t(L, "rsBundled", { m }); hint = t(L, "rsBundledHint", { m }); }
  const chip = $("rateChip"); chip.className = "rate-chip " + cls; $("rateChipText").textContent = label; chip.dataset.tip = hint;
  const pill = $("ratesStatus"); pill.className = "status-pill " + cls; pill.textContent = label;
  const h = $("ratesHint"); h.hidden = !meta.offline; h.textContent = meta.offline ? hint : "";
}

// tooltip for the rate chip; clicking it opens the rates on the cost page
const tip = $("rateChipTip");
function showTip() {
  const c = $("rateChip"), r = c.getBoundingClientRect();
  tip.textContent = c.dataset.tip || ""; tip.hidden = !tip.textContent;
  const w = Math.min(300, innerWidth - 24);
  tip.style.top = r.bottom + 8 + "px";
  tip.style.left = Math.max(12, Math.min(innerWidth - w - 12, r.left + r.width / 2 - w / 2)) + "px";
  tip.style.width = w + "px";
}
const hideTip = () => { tip.hidden = true; };
$("rateChip").addEventListener("mouseenter", showTip); $("rateChip").addEventListener("mouseleave", hideTip);
$("rateChip").addEventListener("focus", showTip); $("rateChip").addEventListener("blur", hideTip);
$("rateChip").addEventListener("click", () => { hideTip(); location.hash = "cost"; setTimeout(() => $("ratesCard").scrollIntoView({ behavior: "smooth", block: "start" }), 50); });

$("ratesTable").addEventListener("input", e => {
  const k = e.target.dataset.rate; if (!k) return;
  const v = Number(e.target.value);
  S.rates = { ...(S.rates || {}) };
  if (e.target.value === "" || !Number.isFinite(v)) delete S.rates[k]; else S.rates[k] = Math.max(0, v);
  e.target.classList.add("edited");
  if (k === "tank" || k === "tanker") S.tank = null;
  update();
});

// ---------- copy summary ----------
$("copy").addEventListener("click", () => {
  const txt = $("summary").textContent, msg = $("copyMsg");
  const fallback = () => { const rg = document.createRange(); rg.selectNodeContents($("summary")); const s = getSelection(); s.removeAllRanges(); s.addRange(rg); msg.textContent = t(S.lang, "selectHint"); };
  try { navigator.clipboard.writeText(txt).then(() => { msg.textContent = t(S.lang, "copied"); }, fallback); } catch { fallback(); }
});

// ---------- PDF report download ----------
async function download(lang) {
  const msg = $("dlMsg"), btns = [$("dlEn"), $("dlUr")];
  msg.className = "status";
  if (!API) { msg.textContent = t(S.lang, "noApi"); msg.className = "status err"; return; }
  btns.forEach(b => b.disabled = true);
  msg.textContent = t(S.lang, "preparing");
  try {
    const res = await fetch(`${API}/api/report?lang=${lang}`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ inputs: S, lang }),
    });
    if (!res.ok) {
      let m = ""; try { m = (await res.json()).error || ""; } catch {}
      throw new Error(m || `HTTP ${res.status}`);
    }
    const blob = await res.blob();
    const cd = res.headers.get("Content-Disposition") || "";
    const name = (cd.match(/filename="([^"]+)"/) || [])[1] || `RWH-Design-Report-${lang}.pdf`;
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 10000);
    msg.textContent = t(S.lang, "downloaded"); msg.className = "status ok";
  } catch (e) {
    console.error(e);
    msg.textContent = t(S.lang, "reportError"); msg.className = "status err";
  } finally {
    btns.forEach(b => b.disabled = false);
  }
}
$("dlEn").addEventListener("click", () => download("en"));
$("dlUr").addEventListener("click", () => download("ur"));

// ---------- boot ----------
$("resetAll").addEventListener("click", () => { S = { ...normalizeInputs({ ...DEFAULTS }), lang: S.lang }; applyLang(); update(); loadRates(); });
// inputs panel: always open on wide screens, collapsible on phones
const inputsBox = $("inputsBox"), wide = matchMedia("(min-width: 861px)");
inputsBox.querySelector("summary").addEventListener("click", e => { if (wide.matches) e.preventDefault(); });
const syncInputs = () => { inputsBox.open = wide.matches; };
wide.addEventListener("change", syncInputs); syncInputs(); // phones: results first, inputs one tap away

$("copyShare").addEventListener("click", async () => {
  const inp = $("shareUrl"); inp.select();
  try { await navigator.clipboard.writeText(inp.value); } catch { document.execCommand("copy"); }
  const b = $("copyShare"); b.textContent = t(S.lang, "linkCopied"); setTimeout(() => { b.textContent = t(S.lang, "copyLink"); }, 1800);
});
initLearn({ api: API, lang: () => S.lang });
initAssistant({ api: API, lang: () => S.lang, inputs: () => { const o = {}; for (const k of SHARE_KEYS) if (S[k] != null) o[k] = S[k]; return o; } });

applyLang();
route();
loadRates();
let rz; addEventListener("resize", () => { clearTimeout(rz); rz = setTimeout(update, 150); });
