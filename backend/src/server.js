// RWH Planner API – runs on Railway.
// Endpoints:
//   GET  /api/health              service status
//   GET  /api/cities              rainfall data, roof types, tank sizes, plot sizes
//   GET  /api/rates?city=…         live published rates for the cost estimate (with sources)
//   POST /api/calculate           full design calculation for the given inputs
//   POST /api/report?lang=en|ur   A4 PDF design report (English or Urdu)
import express from "express";
import cors from "cors";
import puppeteer from "puppeteer-core";
import { CITIES, ROOFS, TANKS, DEFAULTS, compute, normalizeInputs } from "./shared/calc.js";
import { PLOTS, RATE_ITEMS, DOWNPIPE } from "./shared/rates.js";
import { liveRates } from "./rates-live.js";
import { buildReportHTML, footerTemplate } from "./report.js";

const PORT = Number(process.env.PORT) || 8080;
const ALLOWED = (process.env.ALLOWED_ORIGINS || "*").split(",").map(s => s.trim()).filter(Boolean);
const CHROME = process.env.PUPPETEER_EXECUTABLE_PATH || "/usr/bin/chromium";
const RATE_LIMIT = Number(process.env.REPORT_RATE_LIMIT) || 20; // reports per IP per 10 minutes

const app = express();
app.disable("x-powered-by");
app.set("trust proxy", 1);
app.use(express.json({ limit: "50kb" }));
app.use(cors({
  origin(origin, cb) {
    if (!origin || ALLOWED.includes("*") || ALLOWED.includes(origin)) return cb(null, true);
    // allow Vercel preview URLs of the same project when a wildcard pattern is given, e.g. https://rwh-planner-*.vercel.app
    const ok = ALLOWED.some(a => a.includes("*") && new RegExp("^" + a.replace(/[.+?^${}()|[\]\\]/g, "\\$&").replace(/\*/g, "[^.]+") + "$").test(origin));
    return cb(ok ? null : new Error("Origin not allowed"), ok);
  },
  exposedHeaders: ["Content-Disposition"],
}));

// --- tiny in-memory rate limiter for the report endpoint ---
const hits = new Map();
function limit(req, res, next) {
  const key = req.ip, now = Date.now(), win = 10 * 60 * 1000;
  const list = (hits.get(key) || []).filter(t => now - t < win);
  if (list.length >= RATE_LIMIT) return res.status(429).json({ error: "Too many reports. Please wait a few minutes and try again." });
  list.push(now); hits.set(key, list); next();
}
setInterval(() => { const now = Date.now(); for (const [k, v] of hits) if (!v.some(t => now - t < 600000)) hits.delete(k); }, 600000).unref();

// --- shared headless Chromium ---
let browserPromise = null;
function getBrowser() {
  if (!browserPromise) {
    browserPromise = puppeteer.launch({
      executablePath: CHROME,
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage", "--disable-gpu", "--font-render-hinting=none"],
    }).then(b => { b.on("disconnected", () => { browserPromise = null; }); return b; })
      .catch(e => { browserPromise = null; throw e; });
  }
  return browserPromise;
}

app.get("/", (req, res) => res.json({ name: "RWH Planner API", docs: "/api/health" }));

app.get("/api/health", (req, res) => res.json({ ok: true, service: "rwh-planner-api", time: new Date().toISOString() }));

app.get("/api/cities", (req, res) => {
  res.set("Cache-Control", "public, max-age=3600");
  res.json({ cities: CITIES, roofs: ROOFS, tanks: TANKS, plots: PLOTS, rateItems: RATE_ITEMS, downpipe: DOWNPIPE, defaults: DEFAULTS });
});

app.get("/api/rates", async (req, res) => {
  const city = CITIES[req.query.city] ? req.query.city : "islamabad";
  res.set("Cache-Control", "public, max-age=300");
  res.json(await liveRates(city));
});

app.post("/api/calculate", async (req, res) => {
  const inputs = normalizeInputs(req.body || {});
  const { rates } = await liveRates(inputs.city);
  res.json(compute(inputs, rates));
});

app.post("/api/report", limit, async (req, res) => {
  const lang = (req.query.lang || req.body?.lang) === "ur" ? "ur" : "en";
  const inputs = normalizeInputs(req.body?.inputs || req.body || {});
  const { rates } = await liveRates(inputs.city);
  const r = compute(inputs, rates);
  let page;
  try {
    const browser = await getBrowser();
    page = await browser.newPage();
    await page.setContent(buildReportHTML(r, lang), { waitUntil: "load", timeout: 30000 });
    await page.evaluateHandle("document.fonts.ready");
    const pdf = await page.pdf({
      format: "A4", printBackground: true, preferCSSPageSize: true,
      displayHeaderFooter: true, headerTemplate: "<div></div>", footerTemplate: footerTemplate(lang),
      margin: { top: "16mm", bottom: "18mm", left: "14mm", right: "14mm" },
    });
    const name = `RWH-Design-Report-${CITIES[inputs.city].en}-${lang === "ur" ? "Urdu" : "English"}.pdf`;
    res.set({ "Content-Type": "application/pdf", "Content-Disposition": `attachment; filename="${name}"`, "Cache-Control": "no-store" });
    res.send(Buffer.from(pdf));
  } catch (e) {
    console.error("report failed:", e);
    res.status(500).json({ error: "Report generation failed." });
  } finally {
    if (page) page.close().catch(() => {});
  }
});

app.use((err, req, res, next) => {
  if (err && err.message === "Origin not allowed") return res.status(403).json({ error: "Origin not allowed" });
  console.error(err);
  res.status(500).json({ error: "Server error" });
});

app.listen(PORT, () => console.log(`RWH Planner API listening on :${PORT} (origins: ${ALLOWED.join(", ")})`));

for (const sig of ["SIGTERM", "SIGINT"]) process.on(sig, async () => {
  try { if (browserPromise) (await browserPromise).close(); } catch {}
  process.exit(0);
});
