import "@fontsource/inter/400.css";
import "@fontsource/inter/500.css";
import "@fontsource/inter/600.css";
import "@fontsource/sora/600.css";
import "@fontsource/sora/700.css";
import "@fontsource/jetbrains-mono/500.css";
import "@fontsource/noto-nastaliq-urdu/400.css";
import "@fontsource/noto-nastaliq-urdu/700.css";
import "./styles.css";

import { CITIES, ROOFS, TANKS, DEFAULTS, FT2, STORM_M, compute, normalizeInputs } from "./shared/calc.js";
import { MONTHS, t, fmt, round100, money } from "./shared/i18n.js";

const API = (import.meta.env.VITE_API_URL || "").replace(/\/+$/, "");
const STORE = "rwh-planner-v2";
const $ = id => document.getElementById(id);

// ---------- state ----------
let S = { ...DEFAULTS, lang: "en" };
try { const saved = JSON.parse(localStorage.getItem(STORE) || "null"); if (saved && typeof saved === "object") S = { ...S, ...saved }; } catch {}
S = { ...normalizeInputs(S), lang: S.lang === "ur" ? "ur" : "en" };
let lastResult = null;

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
}

function fillForm() {
  citySel.value = S.city; roofSel.value = S.roof;
  const rain = S.rain || CITIES[S.city].mm;
  rain.forEach((v, i) => { const el = $("m" + i); if (document.activeElement !== el) el.value = v; });
  const c = CITIES[S.city];
  $("src").innerHTML = `${t(S.lang, "source")}: <a href="${c.url}" target="_blank" rel="noopener">${t(S.lang, "climateTable", { city: c[S.lang] || c.en })}</a>, <span dir="ltr">${c.src}</span>.`;
  const a = $("area"); if (document.activeElement !== a) a.value = S.unit === "ft2" ? Math.round(S.area / FT2) : Math.round(S.area * 10) / 10;
  $("uM2").setAttribute("aria-pressed", S.unit === "m2"); $("uFt").setAttribute("aria-pressed", S.unit === "ft2");
  for (const k of ["people", "lpcd", "pTank", "pTanker", "pPlumb", "pWell", "houses"]) { const el = $(k); if (document.activeElement !== el) el.value = S[k]; }
}

// ---------- events ----------
$("lnEn").addEventListener("click", () => { S.lang = "en"; applyLang(); update(); });
$("lnUr").addEventListener("click", () => { S.lang = "ur"; applyLang(); update(); });
citySel.addEventListener("change", () => { S.city = citySel.value; S.rain = null; S.tank = null; fillForm(); update(); });
roofSel.addEventListener("change", () => { S.roof = roofSel.value; S.tank = null; update(); });
$("resetRain").addEventListener("click", () => { S.rain = null; S.tank = null; fillForm(); update(); });
$("area").addEventListener("input", e => { const v = parseFloat(e.target.value) || 0; S.area = S.unit === "ft2" ? v * FT2 : v; S.tank = null; update(); });
$("uM2").addEventListener("click", () => { S.unit = "m2"; fillForm(); update(); });
$("uFt").addEventListener("click", () => { S.unit = "ft2"; fillForm(); update(); });
for (const k of ["people", "lpcd", "pTank", "pTanker", "pPlumb", "pWell", "houses"]) {
  $(k).addEventListener("input", e => { const v = Number(e.target.value); S[k] = Number.isFinite(v) && v >= 0 ? v : 0; if (k === "people" || k === "lpcd") S.tank = null; update(); });
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
  const mx = Math.max(10, Math.ceil(Math.max(...pct) / 10) * 10);
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
  const L = S.lang, r = compute(S);
  lastResult = r;
  const c = CITIES[S.city], cityName = c[L] || c.en;
  const litres = n => t(L, "litres", { n: fmt(round100(n)) });
  const pay = r.cost.payback;
  const wellWord = r.well.wells > 1 ? t(L, "wellN") : t(L, "well1");
  const wellText = t(L, "wellText", { n: r.well.wells, wellWord, d: fmt(r.well.diameter, 1), depth: fmt(r.well.depth, 1) });

  $("hCity").textContent = t(L, "heroEyebrow", { city: cityName + (r.edited ? " " + t(L, "edited") : ""), area: fmt(r.A) });
  $("hHarvest").textContent = fmt(round100(r.harvest));
  $("hTankers").textContent = t(L, "tankersN", { n: fmt(r.tankersEquivalent, 1) });
  $("hMet").textContent = fmt(r.met) + "%";
  $("hRecharge").textContent = litres(r.sim.over);

  $("kRain").textContent = fmt(r.annualRain);
  $("kRainS").textContent = t(L, "mmYear") + (r.edited ? " " + t(L, "edited") : "");
  $("kUsed").textContent = fmt(round100(r.sim.used));
  const pill = $("kUsedPill"); pill.textContent = t(L, "pctDemand", { p: fmt(r.met) }); pill.className = "pill " + (r.met >= 50 ? "good" : "warn");
  $("kSave").textContent = fmt(round100(r.cost.save));
  $("kPay").textContent = pay ? t(L, "yrsShort", { n: fmt(pay, 1) }) : "–";
  $("kCost").textContent = t(L, "onTotal", { cost: money(L, r.cost.total) });

  $("tank").value = TANKS.indexOf(r.tank);
  $("tankOut").textContent = t(L, "litres", { n: fmt(r.tank) });
  $("reco").innerHTML = t(L, "reco", { v: `<b>${fmt(r.recommended)}</b>` });

  $("rOver").textContent = litres(r.well.overflow);
  $("rMonsoon").textContent = litres(r.well.monsoon);
  $("rStorm").textContent = t(L, "mm", { n: fmt(STORM_M * 1000) });
  $("rStore").textContent = t(L, "m3", { n: fmt(r.well.storm, 1) });
  $("rWell").textContent = wellText;

  $("cTank").textContent = money(L, r.cost.tank); $("cPlumb").textContent = money(L, r.cost.plumb); $("cWell").textContent = money(L, r.cost.well);
  $("cTotal").textContent = money(L, r.cost.total); $("cSave").textContent = money(L, r.cost.save);
  $("cPay").textContent = pay ? t(L, "yearsN", { n: fmt(pay, 1) }) : t(L, "noSaving");

  $("aHarvest").textContent = fmt(r.area.harvestML, 1);
  $("aTrips").textContent = fmt(r.area.tankerTrips);
  $("aRecharge").textContent = fmt(r.area.rechargeML, 1);
  $("aStorm").textContent = fmt(r.area.stormM3);

  monthChart(r); tankChart(r);
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
    line(t(L, "cTotal"), money(L, r.cost.total)),
    line(t(L, "cSave"), money(L, r.cost.save)),
    line(t(L, "cPay"), pay ? t(L, "yearsN", { n: fmt(pay, 1) }) : t(L, "noSaving")),
    "",
    t(L, "rDisclaimer"),
  ].join("\n");
}

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
applyLang();
update();
let rz; addEventListener("resize", () => { clearTimeout(rz); rz = setTimeout(update, 150); });
