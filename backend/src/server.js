// RWH Planner API – runs on Railway.
// Endpoints:
//   GET  /api/health              service status
//   GET  /api/cities              rainfall data, roof types, tank sizes, plot sizes
//   GET  /api/rates?city=…         live rates for the cost estimate (PBS monthly file + rate sheet), with sources
//   GET  /api/rates/status        where the live rates came from, and any fetch error
//   POST /api/calculate           full design calculation for the given inputs
//   POST /api/report?lang=en|ur   A4 PDF design report (English or Urdu)
//   GET  /api/videos              published training videos
//   GET  /api/videos/:id/stream   redirect to the video file (signed R2 link)
//   /api/admin/*                  video management (Authorization: Bearer ADMIN_TOKEN)
import express from "express";
import cors from "cors";
import puppeteer from "puppeteer-core";
import { CITIES, ROOFS, TANKS, DEFAULTS, compute, normalizeInputs } from "./shared/calc.js";
import { PLOTS, RATE_ITEMS, DOWNPIPE } from "./shared/rates.js";
import { liveRates, ratesStatus } from "./rates-live.js";
import { buildReportHTML, footerTemplate } from "./report.js";
import { publicVideos, signedGet, isAdmin, adminConfigured, adminList, presignUpload, saveVideo, deleteVideo, reorder, storageReady } from "./media.js";

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

app.get("/api/health", (req, res) => res.json({ ok: true, service: "rwh-planner-api", storage: storageReady, admin: adminConfigured(), time: new Date().toISOString() }));

app.get("/api/cities", (req, res) => {
  res.set("Cache-Control", "public, max-age=3600");
  res.json({ cities: CITIES, roofs: ROOFS, tanks: TANKS, plots: PLOTS, rateItems: RATE_ITEMS, downpipe: DOWNPIPE, defaults: DEFAULTS });
});

app.get("/api/rates", async (req, res) => {
  const city = CITIES[req.query.city] ? req.query.city : "islamabad";
  res.set("Cache-Control", "public, max-age=300");
  res.json(await liveRates(city));
});

app.get("/api/rates/status", (req, res) => { res.set("Cache-Control", "no-store"); res.json(ratesStatus()); });

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

// ---------- training videos ----------
const apiBase = req => `${req.protocol}://${req.get("host")}`;
const wrap = fn => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

app.get("/api/videos", wrap(async (req, res) => {
  res.set("Cache-Control", "public, max-age=60");
  res.json(await publicVideos(apiBase(req)));
}));
for (const kind of ["stream", "thumb"]) {
  app.get(`/api/videos/:id/${kind}`, wrap(async (req, res) => {
    const url = await signedGet(req.params.id, kind);
    if (!url) return res.status(404).json({ error: "Not found" });
    res.set("Cache-Control", "private, max-age=3000");
    res.redirect(302, url);
  }));
}

// admin: token check with a limit on failed attempts
const fails = new Map();
function admin(req, res, next) {
  if (!adminConfigured()) return res.status(503).json({ error: "Admin is not configured. Set ADMIN_TOKEN on the server." });
  const key = req.ip, now = Date.now();
  const list = (fails.get(key) || []).filter(t => now - t < 600000);
  if (list.length >= 10) return res.status(429).json({ error: "Too many failed attempts. Try again in 10 minutes." });
  if (!isAdmin(req)) { list.push(now); fails.set(key, list); return res.status(401).json({ error: "Wrong admin token." }); }
  next();
}
app.get("/api/admin/videos", admin, wrap(async (req, res) => { res.set("Cache-Control", "no-store"); res.json(await adminList()); }));
app.post("/api/admin/uploads", admin, wrap(async (req, res) => res.json(await presignUpload(req.body || {}))));
app.post("/api/admin/videos", admin, wrap(async (req, res) => res.json(await saveVideo(req.body || {}))));
app.delete("/api/admin/videos/:id", admin, wrap(async (req, res) => { await deleteVideo(req.params.id); res.json({ ok: true }); }));
app.post("/api/admin/order", admin, wrap(async (req, res) => { await reorder(Array.isArray(req.body?.ids) ? req.body.ids : []); res.json({ ok: true }); }));

app.use((err, req, res, next) => {
  if (err && err.status) return res.status(err.status).json({ error: err.message });
  if (err && err.message === "Origin not allowed") return res.status(403).json({ error: "Origin not allowed" });
  console.error(err);
  res.status(500).json({ error: "Server error" });
});

app.listen(PORT, () => console.log(`RWH Planner API listening on :${PORT} (origins: ${ALLOWED.join(", ")})`));

for (const sig of ["SIGTERM", "SIGINT"]) process.on(sig, async () => {
  try { if (browserPromise) (await browserPromise).close(); } catch {}
  process.exit(0);
});
