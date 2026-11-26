// RWH Planner – remote app configuration (ads, announcement, feature switches, minimum version).
// The admin edits it in the "App settings" tab; the API serves it at GET /api/app-config.
// The web app and the Android app both read it, so a change applies everywhere without a new build.
// Edit here only; `npm run sync` copies this file into every app.

// Real AdMob ad unit IDs for the Android app (publisher ca-app-pub-3753880887983252).
// The admin can change them at any time. Development builds always use Google's test IDs instead.
export const ADMOB_UNITS = {
  banner: "ca-app-pub-3753880887983252/3055994358",
  videos: "ca-app-pub-3753880887983252/3055994358",
  interstitial: "ca-app-pub-3753880887983252/4480309550",
};

export const AD_PLACEMENTS = ["results", "cost", "videos", "interstitial"];
export const FEATURES = ["ai", "videos", "reminders"];

export const DEFAULT_APP_CONFIG = {
  ads: {
    enabled: true,
    placements: { results: true, cost: true, videos: true, interstitial: true },
    units: { ...ADMOB_UNITS },
    interstitialMinSeconds: 180,
    interstitialMaxPerSession: 3,
  },
  minVersionCode: 1,
  latestVersionCode: 1,
  announcement: { enabled: false, id: "", en: "", ur: "", link: "" },
  features: { ai: true, videos: true, reminders: true },
  playStoreUrl: "https://play.google.com/store/apps/details?id=com.resiliencetech.rwhplanner",
  webUrl: "https://rwh-planner.vercel.app",
  shareMessage: {
    en: "I planned my rooftop rainwater harvesting system with RWH Planner. Try it free:",
    ur: "میں نے اپنی چھت کے بارانی پانی کے نظام کی منصوبہ بندی RWH پلانر سے کی ہے۔ آپ بھی مفت آزمائیں:",
  },
};

const AD_UNIT_RE = /^ca-app-pub-\d{16}\/\d{10}$/;
const URL_RE = /^https:\/\/[^\s"<>]+$/i;
const str = (v, max) => String(v ?? "").trim().slice(0, max);
const bool = (v, d) => (typeof v === "boolean" ? v : d);
const int = (v, lo, hi, d) => { const n = Math.round(Number(v)); return Number.isFinite(n) ? Math.min(hi, Math.max(lo, n)) : d; };

// Merge any stored/received object onto the defaults and check it.
// Returns { config, errors }. `errors` is empty when everything is valid.
export function validateAppConfig(raw = {}) {
  const D = DEFAULT_APP_CONFIG, r = raw && typeof raw === "object" ? raw : {}, errors = [];
  const ads = r.ads || {}, pl = ads.placements || {}, un = ads.units || {}, an = r.announcement || {}, fe = r.features || {}, sm = r.shareMessage || {};

  const units = {};
  for (const k of Object.keys(D.ads.units)) {
    const v = str(un[k] ?? D.ads.units[k], 60);
    if (v && !AD_UNIT_RE.test(v)) errors.push(`Ad unit "${k}" must look like ca-app-pub-0000000000000000/0000000000.`);
    units[k] = AD_UNIT_RE.test(v) ? v : D.ads.units[k];
  }
  const link = str(an.link, 500);
  if (link && !URL_RE.test(link)) errors.push("The announcement link must start with https://.");
  const store = str(r.playStoreUrl ?? D.playStoreUrl, 300);
  if (store && !URL_RE.test(store)) errors.push("The Play Store URL must start with https://.");
  const web = str(r.webUrl ?? D.webUrl, 300);
  if (web && !URL_RE.test(web)) errors.push("The web app URL must start with https://.");
  const annEn = str(an.en, 280), annUr = str(an.ur, 280), annOn = bool(an.enabled, false);
  if (annOn && !annEn && !annUr) errors.push("Write the announcement text (English or Urdu) before switching it on.");
  const minV = int(r.minVersionCode, 1, 1e9, D.minVersionCode), latest = int(r.latestVersionCode, 1, 1e9, Math.max(minV, D.latestVersionCode));
  if (latest < minV) errors.push("The latest version code cannot be lower than the minimum supported version code.");

  const config = {
    ads: {
      enabled: bool(ads.enabled, D.ads.enabled),
      placements: Object.fromEntries(AD_PLACEMENTS.map(k => [k, bool(pl[k], D.ads.placements[k])])),
      units,
      interstitialMinSeconds: int(ads.interstitialMinSeconds, 60, 86400, D.ads.interstitialMinSeconds),
      interstitialMaxPerSession: int(ads.interstitialMaxPerSession, 0, 10, D.ads.interstitialMaxPerSession),
    },
    minVersionCode: minV,
    latestVersionCode: Math.max(latest, minV),
    announcement: {
      enabled: annOn && !!(annEn || annUr), en: annEn, ur: annUr, link: URL_RE.test(link) ? link : "",
      // changes whenever the text changes, so a dismissed banner comes back for a new message
      id: str(an.id, 40) || hash(annEn + "|" + annUr + "|" + link),
    },
    features: Object.fromEntries(FEATURES.map(k => [k, bool(fe[k], D.features[k])])),
    playStoreUrl: URL_RE.test(store) ? store : D.playStoreUrl,
    webUrl: URL_RE.test(web) ? web : D.webUrl,
    shareMessage: { en: str(sm.en ?? D.shareMessage.en, 300) || D.shareMessage.en, ur: str(sm.ur ?? D.shareMessage.ur, 300) || D.shareMessage.ur },
  };
  if (typeof r.updatedAt === "string") config.updatedAt = r.updatedAt;
  return { config, errors };
}

function hash(s) {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0;
  return "a" + (h >>> 0).toString(36);
}
