// Builds the printable HTML for the design report (English or Urdu).
// Chromium renders this HTML to an A4 PDF in server.js.
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { CITIES, ROOFS, TANKS, ETA, STORM_M, FT2 } from "./shared/calc.js";
import { T, MONTHS, t, fmt, round100, money } from "./shared/i18n.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const font = f => readFileSync(path.join(here, "fonts", f)).toString("base64");
const FONTS_CSS = (() => {
  const face = (fam, file, w) => `@font-face{font-family:"${fam}";src:url(data:font/woff2;base64,${font(file)}) format("woff2");font-weight:${w};font-style:normal;font-display:block}`;
  return [
    face("Inter", "inter-latin-400-normal.woff2", 400),
    face("Inter", "inter-latin-600-normal.woff2", 600),
    face("Inter", "inter-latin-700-normal.woff2", 700),
    face("Noto Nastaliq Urdu", "noto-nastaliq-urdu-arabic-400-normal.woff2", 400),
    face("Noto Nastaliq Urdu", "noto-nastaliq-urdu-arabic-700-normal.woff2", 700),
  ].join("\n");
})();

const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const L = (lang, n) => t(lang, "litres", { n: fmt(round100(n)) });

function monthChartSVG(r, lang) {
  const W = 680, H = 220, Lm = 54, R = 12, Tm = 10, B = 30, iw = W - Lm - R, ih = H - Tm - B;
  const max = Math.max(...r.inflow, ...r.demand, 1);
  const p = Math.pow(10, Math.floor(Math.log10(max))), f = max / p;
  const mx = (f <= 1 ? 1 : f <= 2 ? 2 : f <= 2.5 ? 2.5 : f <= 5 ? 5 : 10) * p;
  const bw = iw / 12;
  let g = "";
  for (let i = 0; i <= 4; i++) {
    const y = Tm + ih - (ih * i) / 4, v = (mx * i) / 4 / 1000;
    g += `<line x1="${Lm}" x2="${W - R}" y1="${y}" y2="${y}" stroke="#d6e2e5"/><text x="${Lm - 6}" y="${y + 4}" text-anchor="end">${fmt(v, v % 1 ? 1 : 0)}k</text>`;
  }
  r.inflow.forEach((v, i) => {
    const x = Lm + i * bw, h = (ih * v) / mx, dh = (ih * r.demand[i]) / mx;
    g += `<rect x="${x + bw * 0.14}" y="${Tm + ih - h}" width="${bw * 0.42}" height="${Math.max(0, h)}" rx="2" fill="#2f8fd8"/>`;
    g += `<rect x="${x + bw * 0.58}" y="${Tm + ih - dh}" width="${bw * 0.28}" height="${Math.max(0, dh)}" rx="2" fill="#d9822b"/>`;
    g += `<text x="${x + bw / 2}" y="${H - 10}" text-anchor="middle" class="m">${esc(lang === "ur" ? MONTHS.ur[i] : MONTHS.en[i])}</text>`;
  });
  return `<svg viewBox="0 0 ${W} ${H}" class="chart" dir="ltr">${g}</svg>`;
}

function tankChartSVG(r, lang) {
  const W = 680, H = 190, Lm = 46, R = 16, Tm = 10, B = 30, iw = W - Lm - R, ih = H - Tm - B;
  const pct = r.curve.map(c => c.pct);
  const mx = Math.max(10, Math.ceil(Math.max(...pct) / 10) * 10);
  const xs = i => Lm + (iw * i) / (TANKS.length - 1), ys = v => Tm + ih - (ih * v) / mx;
  let g = "", d = "", a = `M${xs(0)},${Tm + ih}`;
  for (let i = 0; i <= 4; i++) { const y = Tm + ih - (ih * i) / 4; g += `<line x1="${Lm}" x2="${W - R}" y1="${y}" y2="${y}" stroke="#d6e2e5"/><text x="${Lm - 6}" y="${y + 4}" text-anchor="end">${fmt((mx * i) / 4)}%</text>`; }
  pct.forEach((v, i) => { d += `${i ? "L" : "M"}${xs(i)},${ys(v)}`; a += `L${xs(i)},${ys(v)}`; });
  a += `L${xs(TANKS.length - 1)},${Tm + ih}Z`;
  g += `<path d="${a}" fill="#0a7c8c" opacity=".12"/><path d="${d}" fill="none" stroke="#0a7c8c" stroke-width="2.5"/>`;
  TANKS.forEach((V, i) => { if (i % 2 === 0 || i === TANKS.length - 1) g += `<text x="${xs(i)}" y="${H - 10}" text-anchor="middle">${V / 1000}k</text>`; });
  g += `<line x1="${xs(r.recIdx)}" x2="${xs(r.recIdx)}" y1="${Tm}" y2="${Tm + ih}" stroke="#1f8a5b" stroke-dasharray="4 4"/>`;
  const si = TANKS.indexOf(r.tank);
  g += `<circle cx="${xs(si)}" cy="${ys(pct[si])}" r="6" fill="#fff" stroke="#0a7c8c" stroke-width="3"/>`;
  return `<svg viewBox="0 0 ${W} ${H}" class="chart" dir="ltr">${g}</svg>`;
}

export function buildReportHTML(r, lang = "en") {
  const ur = lang === "ur";
  const S = r.inputs, city = CITIES[S.city], cityName = city[lang] || city.en;
  const roof = ROOFS[S.roof];
  const now = new Date();
  const dateStr = now.toLocaleDateString(ur ? "ur-PK" : "en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Karachi", numberingSystem: "latn" });
  const ref = "RWH-" + now.toISOString().slice(0, 10).replace(/-/g, "") + "-" + Math.random().toString(36).slice(2, 6).toUpperCase();
  const M = ur ? MONTHS.ur : MONTHS.enLong;
  const pay = r.cost.payback;
  const wellWord = r.well.wells > 1 ? t(lang, "wellN") : t(lang, "well1");
  const wellText = t(lang, "wellText", { n: r.well.wells, wellWord, d: fmt(r.well.diameter, 1), depth: fmt(r.well.depth, 1) });

  const rows = M.map((m, i) => `<tr><td>${esc(m)}</td><td>${fmt(r.rain[i], 1)}</td><td>${fmt(r.inflow[i])}</td><td>${fmt(r.demand[i])}</td><td>${fmt(r.sim.usedM[i])}</td><td>${fmt(r.sim.overM[i])}</td></tr>`).join("");
  const sum = a => a.reduce((x, y) => x + y, 0);

  const kv = arr => arr.map(([k, v]) => `<tr><th>${esc(k)}</th><td>${v}</td></tr>`).join("");

  return `<!doctype html><html lang="${ur ? "ur" : "en"}" dir="${ur ? "rtl" : "ltr"}"><head><meta charset="utf-8">
<style>
${FONTS_CSS}
@page{size:A4;margin:16mm 14mm 18mm}
*{box-sizing:border-box}
body{margin:0;color:#0f2a33;font-family:${ur ? '"Noto Nastaliq Urdu","Inter",sans-serif' : '"Inter",sans-serif'};font-size:${ur ? "10.2pt" : "9.6pt"};line-height:${ur ? "1.95" : "1.5"}}
.num,td,.fig b{font-family:"Inter","Noto Nastaliq Urdu",sans-serif;font-variant-numeric:tabular-nums}
h1,h2{margin:0;font-weight:700}
header{display:flex;justify-content:space-between;align-items:flex-start;gap:16px;border-bottom:3px solid #0a7c8c;padding-bottom:10px;margin-bottom:14px}
.brand{display:flex;gap:12px;align-items:center}
.brand svg{width:40px;height:40px;flex:none}
h1{font-size:${ur ? "17pt" : "18pt"};line-height:${ur ? "1.9" : "1.2"}}
.sub{color:#0a7c8c;font-weight:600;font-size:${ur ? "11pt" : "11pt"}}
.meta{font-size:${ur ? "8.4pt" : "8.4pt"};color:#4a6470;text-align:${ur ? "left" : "right"};line-height:${ur ? "1.9" : "1.6"}}
.meta b{color:#0f2a33}
h2{font-size:${ur ? "12pt" : "11.5pt"};color:#0a7c8c;margin:16px 0 6px;padding-bottom:3px;border-bottom:1px solid #d6e2e5;break-after:avoid}
.figs{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin:4px 0 6px}
.fig{border:1px solid #d6e2e5;border-radius:8px;padding:8px 10px;background:#f3f8f9}
.fig span{display:block;font-size:${ur ? "8pt" : "7.8pt"};color:#4a6470;line-height:${ur ? "1.9" : "1.4"}}
.fig b{display:block;font-size:14pt;color:#0a7c8c;margin-top:2px}
.fig i{font-style:normal;font-size:${ur ? "7.6pt" : "7.6pt"};color:#4a6470}
table{width:100%;border-collapse:collapse;margin:4px 0;break-inside:avoid}
th,td{padding:${ur ? "2px 8px" : "4px 8px"};border-bottom:1px solid #e3ecee;text-align:${ur ? "right" : "left"};vertical-align:middle}
table.kv th{width:52%;font-weight:400;color:#4a6470}
table.kv td{font-weight:600}
table.grid thead th{background:#0a7c8c;color:#fff;font-weight:600;font-size:${ur ? "8.6pt" : "8.2pt"}}
table.grid td{font-size:8.6pt}
table.grid td:not(:first-child),table.grid th:not(:first-child){text-align:${ur ? "left" : "right"}}
table.grid tfoot td{font-weight:700;border-top:2px solid #0a7c8c}
table.grid td:first-child{font-family:${ur ? '"Noto Nastaliq Urdu",sans-serif' : '"Inter",sans-serif'}}
.chart{width:100%;height:auto;margin:6px 0 2px}
.chart text{font-family:"Inter",sans-serif;font-size:10.5px;fill:#4a6470}
.chart text.m{font-family:${ur ? '"Noto Nastaliq Urdu","Inter",sans-serif' : '"Inter",sans-serif'};font-size:${ur ? "9.5px" : "10.5px"}}
.legend{display:flex;gap:16px;font-size:8pt;color:#4a6470}
.legend i{display:inline-block;width:10px;height:10px;border-radius:2px;margin-${ur ? "left" : "right"}:5px;vertical-align:middle}
.two{display:grid;grid-template-columns:1fr 1fr;gap:16px}
.callout{background:#d9eef1;border-radius:8px;padding:8px 12px;margin-top:6px}
.callout b{color:#0a7c8c}
ol{margin:4px 0;padding-${ur ? "right" : "left"}:18px}
li{margin-bottom:${ur ? "0" : "3px"}}
.note{font-size:${ur ? "8.4pt" : "8.2pt"};color:#4a6470}
.disc{break-inside:avoid;margin-top:12px;border:1px solid #e6c88f;background:#fbf4e6;border-radius:8px;padding:8px 12px;font-size:${ur ? "8.6pt" : "8.2pt"}}
.ltr{direction:ltr;unicode-bidi:isolate;display:inline-block}
.chart-cap{display:flex;justify-content:space-between;gap:12px;font-size:${ur ? "8pt" : "7.8pt"};color:#4a6470;margin-top:6px}
.keep{break-inside:avoid}
</style></head><body>
<header>
  <div class="brand">
    <svg viewBox="0 0 40 40"><path d="M20 3C14 12 8 18.5 8 25a12 12 0 0 0 24 0c0-6.5-6-13-12-22z" fill="#0a7c8c"/><path d="M14 26a6 6 0 0 0 6 6" stroke="#fff" stroke-width="2.4" fill="none" stroke-linecap="round"/></svg>
    <div><h1>${esc(t(lang, "rTitle"))}</h1><div class="sub">${esc(t(lang, "rSubtitle"))}</div></div>
  </div>
  <div class="meta">
    <div>${esc(t(lang, "rLocation"))}: <b>${esc(cityName)}</b></div>
    <div>${esc(t(lang, "rDate"))}: <b>${esc(dateStr)}</b></div>
    <div>${esc(t(lang, "rRef"))}: <b class="ltr">${ref}</b></div>
  </div>
</header>

<section>
<h2>${esc(t(lang, "rKeyFigures"))}</h2>
<div class="figs keep">
  <div class="fig"><span>${esc(t(lang, "rainCollected"))}</span><b>${fmt(round100(r.harvest))}</b><i>${esc(t(lang, "litresYear"))}</i></div>
  <div class="fig"><span>${esc(t(lang, "rSelectedTank"))}</span><b>${fmt(r.tank)}</b><i>${esc(ur ? "لیٹر" : "litres")}</i></div>
  <div class="fig"><span>${esc(t(lang, "demandMet"))}</span><b>${fmt(r.met)}%</b><i>${esc(t(lang, "rUsedYear"))}</i></div>
  <div class="fig"><span>${esc(t(lang, "cPay"))}</span><b>${pay ? fmt(pay, 1) : "–"}</b><i>${esc(ur ? "سال" : "years")}</i></div>
</div>
</section>

<section>
<h2>${esc(t(lang, "rSec1"))}</h2>
<table class="kv">${kv([
  [t(lang, "rCity"), esc(cityName)],
  [t(lang, "rAnnualRain"), esc(t(lang, "mm", { n: fmt(r.annualRain) })) + (r.edited ? " " + esc(t(lang, "edited")) : "")],
  [t(lang, "rRoofArea"), `${fmt(r.A)} ${esc(t(lang, "m2"))} <span class="note">(${fmt(r.A / FT2)} ${esc(t(lang, "ft2"))})</span>`],
  [t(lang, "rRoofSurface"), esc(roof[lang] || roof.en)],
  [t(lang, "rRunoff"), fmt(r.C, 2)],
  [t(lang, "rEta"), fmt(ETA, 2)],
  [t(lang, "rOccupants"), fmt(S.people)],
  [t(lang, "rPerCapita"), esc(t(lang, "litres", { n: fmt(S.lpcd) }))],
  [t(lang, "rDemand"), esc(L(lang, r.dem))],
])}</table>
</section>

<section>
<h2>${esc(t(lang, "rSec2"))}</h2>
<div class="keep"><div class="chart-cap"><div class="legend"><span><i style="background:#2f8fd8"></i>${esc(t(lang, "rainCollected"))}</span><span><i style="background:#d9822b"></i>${esc(t(lang, "householdDemand"))}</span></div><span>${esc(t(lang, "litresPerMonth"))}</span></div>
${monthChartSVG(r, lang)}</div>
<table class="grid">
<thead><tr><th>${esc(t(lang, "rMonth"))}</th><th>${esc(t(lang, "rRainMm"))}</th><th>${esc(t(lang, "rCollected"))}</th><th>${esc(t(lang, "rDemandL"))}</th><th>${esc(t(lang, "rUsed"))}</th><th>${esc(t(lang, "rOverflow"))}</th></tr></thead>
<tbody>${rows}</tbody>
<tfoot><tr><td>${esc(t(lang, "rTotal"))}</td><td>${fmt(r.annualRain, 1)}</td><td>${fmt(r.harvest)}</td><td>${fmt(r.dem)}</td><td>${fmt(r.sim.used)}</td><td>${fmt(r.sim.over)}</td></tr></tfoot>
</table>
</section>

<section>
<h2>${esc(t(lang, "rSec3"))}</h2>
<div class="two keep">
<table class="kv">${kv([
  [t(lang, "rSelectedTank"), esc(t(lang, "litres", { n: fmt(r.tank) }))],
  [t(lang, "rRecommendedTank"), esc(t(lang, "litres", { n: fmt(r.recommended) }))],
  [t(lang, "rUsedYear"), esc(L(lang, r.sim.used))],
  [t(lang, "rDemandMet"), fmt(r.met) + "%"],
])}</table>
<div class="note">${esc(t(lang, "reco", { v: fmt(r.recommended) }))}</div>
</div>
<div class="keep"><div class="chart-cap"><span>${esc(t(lang, "rTankCurve"))}</span><span>${esc(t(lang, "tankAxisLong"))}</span></div>
${tankChartSVG(r, lang)}</div>
</section>

<section>
<h2>${esc(t(lang, "rSec4"))}</h2>
<div class="two keep">
<table class="kv">${kv([
  [t(lang, "overflowYear"), esc(L(lang, r.well.overflow))],
  [t(lang, "monsoonOverflow"), esc(L(lang, r.well.monsoon))],
  [t(lang, "rStormDepth"), esc(t(lang, "mm", { n: fmt(STORM_M * 1000) }))],
  [t(lang, "stormStorage"), esc(t(lang, "m3", { n: fmt(r.well.storm, 1) }))],
])}</table>
<div>
<div class="callout">${esc(t(lang, "suggestedWell"))}: <b>${esc(wellText)}</b></div>
<p class="note">${esc(t(lang, "rechargeNote"))}</p>
</div>
</div>
</section>

<section>
<h2>${esc(t(lang, "rSec5"))}</h2>
<div class="two keep">
<table class="kv">${kv([
  [t(lang, "cTank"), esc(money(lang, r.cost.tank))],
  [t(lang, "cPlumb"), esc(money(lang, r.cost.plumb))],
  [t(lang, "cWell"), esc(money(lang, r.cost.well))],
  [t(lang, "cTotal"), esc(money(lang, r.cost.total))],
  [t(lang, "cSave"), esc(money(lang, r.cost.save))],
  [t(lang, "cPay"), pay ? esc(t(lang, "yearsN", { n: fmt(pay, 1) })) : esc(t(lang, "noSaving"))],
])}</table>
<p class="note">${esc(t(lang, "costNote"))}</p>
</div>
</section>

<section>
<h2>${esc(t(lang, "rSec6"))}</h2>
<p class="note">${esc(t(lang, "houses"))}: <b class="num">${fmt(r.area.houses)}</b></p>
<div class="figs keep">
  <div class="fig"><span>${esc(t(lang, "aHarvest"))}</span><b>${fmt(r.area.harvestML, 1)}</b><i>${esc(t(lang, "mlYear"))}</i></div>
  <div class="fig"><span>${esc(t(lang, "aTrips"))}</span><b>${fmt(r.area.tankerTrips)}</b><i>${esc(t(lang, "tripsYear"))}</i></div>
  <div class="fig"><span>${esc(t(lang, "aRecharge"))}</span><b>${fmt(r.area.rechargeML, 1)}</b><i>${esc(t(lang, "mlYear"))}</i></div>
  <div class="fig"><span>${esc(t(lang, "aStorm"))}</span><b>${fmt(r.area.stormM3)}</b><i>${esc(t(lang, "stormUnit"))}</i></div>
</div>
</section>

<section>
<h2>${esc(t(lang, "rSec7"))}</h2>
<ol class="note">
<li>${esc(t(lang, "rM1"))}</li><li>${esc(t(lang, "rM2"))}</li><li>${esc(t(lang, "rM3"))}</li><li>${esc(t(lang, "rM4"))}</li><li>${esc(t(lang, "rM5"))}</li>
<li>${r.edited ? esc(t(lang, "rM6edited")) : esc(t(lang, "rM6", { src: city.src, city: cityName })) + ` <span class="ltr">${esc(city.url)}</span>`}</li>
</ol>
<div class="disc">${esc(t(lang, "rDisclaimer"))}</div>
</section>
</body></html>`;
}

export function footerTemplate(lang) {
  const ur = lang === "ur";
  return `<div style="width:100%;font-family:Arial,sans-serif;font-size:7.5px;color:#7a9098;padding:0 14mm;display:flex;justify-content:space-between;direction:ltr">
<span>RWH Planner · ${ur ? "Design Report (Urdu)" : "Design Report"}</span>
<span>Page <span class="pageNumber"></span> of <span class="totalPages"></span></span></div>`;
}

export { T };
