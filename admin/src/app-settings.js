// "App settings" tab: remote config read by the website and the Android app (GET /api/app-config).
import { $, api, say } from "./api.js";

const checks = {
  annOn: c => c.announcement.enabled, fAi: c => c.features.ai, fVideos: c => c.features.videos, fReminders: c => c.features.reminders,
  adsOn: c => c.ads.enabled, adResults: c => c.ads.placements.results, adCost: c => c.ads.placements.cost,
  adVideos: c => c.ads.placements.videos, adInter: c => c.ads.placements.interstitial,
};
const values = {
  annEn: c => c.announcement.en, annUr: c => c.announcement.ur, annLink: c => c.announcement.link,
  uBanner: c => c.ads.units.banner, uVideos: c => c.ads.units.videos, uInter: c => c.ads.units.interstitial,
  iGap: c => c.ads.interstitialMinSeconds, iMax: c => c.ads.interstitialMaxPerSession,
  minV: c => c.minVersionCode, latestV: c => c.latestVersionCode,
  storeUrl: c => c.playStoreUrl, webUrl: c => c.webUrl, shareEn: c => c.shareMessage.en, shareUr: c => c.shareMessage.ur,
};
const AD_FIELDS = ["adResults", "adCost", "adVideos", "adInter", "uBanner", "uVideos", "uInter", "iGap", "iMax"];

function fill(c, storage) {
  if (storage !== undefined) $("appStorageWarn").hidden = !!storage;
  for (const [id, f] of Object.entries(checks)) $(id).checked = !!f(c);
  for (const [id, f] of Object.entries(values)) $(id).value = f(c) ?? "";
  const sync = () => AD_FIELDS.forEach(id => ($(id).disabled = !$("adsOn").checked));
  $("adsOn").onchange = sync; sync();
  say($("appMsg"), c.updatedAt ? "Last saved " + new Date(c.updatedAt).toLocaleString() : "Not saved yet: the defaults are in use.");
}

export async function loadAppSettings() {
  const r = await api("/api/admin/app-config");
  fill(r.config, r.storage);
}

$("appForm").addEventListener("submit", async e => {
  e.preventDefault();
  const v = id => $(id).value.trim(), c = id => $(id).checked;
  const body = {
    announcement: { enabled: c("annOn"), en: v("annEn"), ur: v("annUr"), link: v("annLink") },
    features: { ai: c("fAi"), videos: c("fVideos"), reminders: c("fReminders") },
    ads: {
      enabled: c("adsOn"),
      placements: { results: c("adResults"), cost: c("adCost"), videos: c("adVideos"), interstitial: c("adInter") },
      units: { banner: v("uBanner"), videos: v("uVideos"), interstitial: v("uInter") },
      interstitialMinSeconds: Number(v("iGap")), interstitialMaxPerSession: Number(v("iMax")),
    },
    minVersionCode: Number(v("minV")), latestVersionCode: Number(v("latestV")),
    playStoreUrl: v("storeUrl"), webUrl: v("webUrl"), shareMessage: { en: v("shareEn"), ur: v("shareUr") },
  };
  $("appSave").disabled = true; say($("appMsg"), "Saving…");
  try {
    const r = await api("/api/admin/app-config", { method: "PUT", body: JSON.stringify(body) });
    fill(r.config);
    say($("appMsg"), "Saved. The website and the app pick this up within a few minutes.", "ok");
  } catch (err) { say($("appMsg"), err.message, "err"); }
  finally { $("appSave").disabled = false; }
});
