// Admin-editable settings, stored in the R2 bucket as settings.json.
// Secrets (AI keys) are encrypted with AES-256-GCM using a key derived from SESSION_SECRET.
// Anything not set here falls back to the Railway environment variables.
import crypto from "node:crypto";
import { readJson, writeJson, storageReady, httpErr } from "./storage.js";

const KEY = "settings.json";
let cache = null, cacheAt = 0;
const TTL = 30 * 1000;

const secretKey = () => {
  const s = process.env.SESSION_SECRET || "";
  if (!s) throw httpErr(503, "SESSION_SECRET is not set on the server.");
  return crypto.scryptSync(s, "rwh-settings-v1", 32);
};

export function seal(text) {
  const iv = crypto.randomBytes(12);
  const c = crypto.createCipheriv("aes-256-gcm", secretKey(), iv);
  const ct = Buffer.concat([c.update(String(text), "utf8"), c.final()]);
  return "v1:" + Buffer.concat([iv, c.getAuthTag(), ct]).toString("base64");
}

export function unseal(s) {
  try {
    const b = Buffer.from(String(s).replace(/^v1:/, ""), "base64");
    const d = crypto.createDecipheriv("aes-256-gcm", secretKey(), b.subarray(0, 12));
    d.setAuthTag(b.subarray(12, 28));
    return Buffer.concat([d.update(b.subarray(28)), d.final()]).toString("utf8");
  } catch { return ""; }
}

export async function getSettings(force = false) {
  if (!force && cache && Date.now() - cacheAt < TTL) return cache;
  let s = null;
  if (storageReady) { try { s = await readJson(KEY); } catch (e) { console.error("settings read:", e.message); if (cache) return cache; } }
  cache = s || {}; cacheAt = Date.now();
  return cache;
}

// patch(current) mutates and returns the new settings object
export async function saveSettings(patch) {
  if (!storageReady) throw httpErr(503, "Storage is not configured (R2 variables missing), so settings cannot be saved.");
  const next = patch(structuredClone(await getSettings(true))) || {};
  next.updatedAt = new Date().toISOString();
  await writeJson(KEY, next);
  cache = next; cacheAt = Date.now();
  return next;
}
