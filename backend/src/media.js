// Training video library backed by Cloudflare R2 (S3-compatible).
//   R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET   storage
//   R2_PUBLIC_URL   optional public bucket URL (r2.dev or custom domain); otherwise signed links are used
//   R2_ENDPOINT     optional, overrides https://<account>.r2.cloudflarestorage.com (used for local testing)
//   (admin access is handled in auth.js)
//
// The catalogue lives in the bucket as catalog.json. Until something is saved it is the starter list
// from shared/videos.js. Uploaded files go to videos/<id>.<ext> and thumbs/<id>.jpg.
import { GetObjectCommand, PutObjectCommand, DeleteObjectCommand, HeadObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import crypto from "node:crypto";
import { SEED_VIDEOS, VIDEO_CATEGORIES, VIDEO_LANGS, MAX_UPLOAD_BYTES, VIDEO_TYPES } from "./shared/videos.js";

import { s3, BUCKET, storageReady } from "./storage.js";
export { storageReady };
const PUBLIC = String(process.env.R2_PUBLIC_URL || "").trim().replace(/^["']|["']$/g, "").replace(/\/+$/, "");

const CATALOG_KEY = "catalog.json";
const CAT_KEYS = VIDEO_CATEGORIES.map(c => c.key);
let catalog = null, catalogAt = 0;
const CATALOG_TTL = 60 * 1000;

async function readCatalog(force = false) {
  if (!storageReady) return structuredClone(SEED_VIDEOS);
  if (!force && catalog && Date.now() - catalogAt < CATALOG_TTL) return catalog;
  try {
    const out = await s3.send(new GetObjectCommand({ Bucket: BUCKET, Key: CATALOG_KEY }));
    const data = JSON.parse(await out.Body.transformToString());
    catalog = Array.isArray(data.videos) ? data.videos : [];
  } catch (e) {
    if (e?.name !== "NoSuchKey" && e?.$metadata?.httpStatusCode !== 404) { console.error("catalog read:", e.message); if (catalog) return catalog; }
    catalog = structuredClone(SEED_VIDEOS);
  }
  catalogAt = Date.now();
  return catalog;
}

async function writeCatalog(videos) {
  await s3.send(new PutObjectCommand({
    Bucket: BUCKET, Key: CATALOG_KEY, ContentType: "application/json", CacheControl: "no-store",
    Body: JSON.stringify({ updatedAt: new Date().toISOString(), videos }, null, 1),
  }));
  catalog = videos; catalogAt = Date.now();
}

// ---------- oEmbed enrichment for embedded videos (thumbnail + duration) ----------
const oembed = new Map();
async function enrich(v) {
  if (v.type === "youtube") return { thumb: `https://i.ytimg.com/vi/${v.ref}/hqdefault.jpg` };
  if (v.type !== "vimeo") return {};
  const hit = oembed.get(v.ref);
  if (hit && Date.now() - hit.at < 24 * 3600e3) return hit.data;
  try {
    const res = await fetch(`https://vimeo.com/api/oembed.json?url=${encodeURIComponent("https://vimeo.com/" + v.ref)}&width=640`, { signal: AbortSignal.timeout(6000) });
    const j = res.ok ? await res.json() : {};
    const data = { thumb: j.thumbnail_url || null, duration: j.duration || null };
    oembed.set(v.ref, { at: Date.now(), data });
    return data;
  } catch { oembed.set(v.ref, { at: Date.now() - 23 * 3600e3, data: {} }); return {}; }
}

const fileUrl = key => (PUBLIC ? `${PUBLIC}/${key.split("/").map(encodeURIComponent).join("/")}` : null);

export async function publicVideos(apiBase) {
  const list = (await readCatalog()).filter(v => v.published).sort((a, b) => (a.order ?? 1e9) - (b.order ?? 1e9) || String(b.createdAt).localeCompare(String(a.createdAt)));
  const out = await Promise.all(list.map(async v => {
    const base = pick(v);
    if (v.type === "file") {
      base.src = fileUrl(v.key) || `${apiBase}/api/videos/${v.id}/stream`;
      base.thumb = v.thumbKey ? (fileUrl(v.thumbKey) || `${apiBase}/api/videos/${v.id}/thumb`) : null;
    } else {
      const extra = await enrich(v);
      base.thumb = v.thumb || extra.thumb || null;
      base.duration = v.duration || extra.duration || null;
    }
    return base;
  }));
  return { categories: VIDEO_CATEGORIES, languages: VIDEO_LANGS, videos: out, uploads: storageReady };
}

function pick(v) {
  const { id, type, ref, category, lang, subtitles, title, desc, source, sourceUrl, duration, createdAt, size } = v;
  return { id, type, ref, category, lang, subtitles, title, desc, source, sourceUrl, duration, createdAt, size };
}

export async function signedGet(id, kind) {
  if (!storageReady) return null;
  const v = (await readCatalog()).find(x => x.id === id && x.type === "file");
  const key = kind === "thumb" ? v?.thumbKey : v?.key;
  if (!v || !key) return null;
  return getSignedUrl(s3, new GetObjectCommand({ Bucket: BUCKET, Key: key }), { expiresIn: 3 * 3600 });
}

// ---------- admin ----------
export async function adminList() { return { videos: await readCatalog(true), categories: VIDEO_CATEGORIES, languages: VIDEO_LANGS, storage: storageReady, publicUrl: !!PUBLIC }; }

const EXT = { "video/mp4": "mp4", "video/webm": "webm", "video/quicktime": "mov" };
export async function presignUpload({ kind, contentType, size }) {
  if (!storageReady) throw httpErr(503, "Storage is not configured (R2 variables missing).");
  const id = "v" + Date.now().toString(36) + crypto.randomBytes(3).toString("hex");
  let key;
  if (kind === "thumb") {
    if (!/^image\/(jpeg|png|webp)$/.test(contentType)) throw httpErr(400, "Thumbnail must be JPEG, PNG or WebP.");
    if (size > 5 * 1024 ** 2) throw httpErr(400, "Thumbnail is larger than 5 MB.");
    key = `thumbs/${id}.${contentType.split("/")[1].replace("jpeg", "jpg")}`;
  } else {
    if (!VIDEO_TYPES.includes(contentType)) throw httpErr(400, "Video must be MP4, WebM or MOV.");
    if (!(size > 0) || size > MAX_UPLOAD_BYTES) throw httpErr(400, "Video must be smaller than 2 GB.");
    key = `videos/${id}.${EXT[contentType]}`;
  }
  const url = await getSignedUrl(s3, new PutObjectCommand({ Bucket: BUCKET, Key: key, ContentType: contentType }), { expiresIn: 3600 });
  return { key, url, id };
}

const clean = (s, n) => String(s ?? "").replace(/[\u0000-\u001f]/g, " ").trim().slice(0, n);
export async function saveVideo(body) {
  if (!storageReady) throw httpErr(503, "Storage is not configured (R2 variables missing).");
  const list = [...await readCatalog(true)];
  const i = body.id ? list.findIndex(v => v.id === body.id) : -1;
  const prev = i >= 0 ? list[i] : null;
  const type = prev?.type || body.type;
  if (!["file", "youtube", "vimeo"].includes(type)) throw httpErr(400, "Unknown video type.");
  const v = {
    ...(prev || {}),
    id: prev?.id || body.id || "v" + Date.now().toString(36) + crypto.randomBytes(3).toString("hex"),
    type,
    category: CAT_KEYS.includes(body.category) ? body.category : prev?.category || "rooftop",
    lang: VIDEO_LANGS[body.lang] ? body.lang : prev?.lang || "ur",
    subtitles: body.subtitles ? clean(body.subtitles, 8) : undefined,
    title: { en: clean(body.title?.en, 140), ur: clean(body.title?.ur, 140) },
    desc: { en: clean(body.desc?.en, 1200), ur: clean(body.desc?.ur, 1200) },
    source: clean(body.source, 160), sourceUrl: /^https?:\/\//.test(body.sourceUrl || "") ? clean(body.sourceUrl, 400) : "",
    published: !!body.published,
    order: Number.isFinite(+body.order) ? +body.order : prev?.order ?? list.length,
    updatedAt: new Date().toISOString(), createdAt: prev?.createdAt || new Date().toISOString(),
  };
  if (!v.title.en && !v.title.ur) throw httpErr(400, "Add a title in English or Urdu.");
  if (type === "file") {
    if (!prev) {
      if (!/^videos\/[\w.-]+$/.test(body.key || "")) throw httpErr(400, "Upload the video file first.");
      try { const h = await s3.send(new HeadObjectCommand({ Bucket: BUCKET, Key: body.key })); v.size = h.ContentLength; }
      catch { throw httpErr(400, "The uploaded file was not found in storage. Check the bucket CORS policy and try again."); }
      v.key = body.key;
    }
    if (body.thumbKey && /^thumbs\/[\w.-]+$/.test(body.thumbKey)) v.thumbKey = body.thumbKey;
    if (Number.isFinite(+body.duration) && +body.duration > 0) v.duration = Math.round(+body.duration);
  } else {
    const ref = parseEmbed(type, body.ref || body.url || prev?.ref);
    if (!ref) throw httpErr(400, `Paste a valid ${type === "youtube" ? "YouTube" : "Vimeo"} link.`);
    v.ref = ref;
    if (Number.isFinite(+body.duration) && +body.duration > 0) v.duration = Math.round(+body.duration);
  }
  if (i >= 0) list[i] = v; else list.push(v);
  await writeCatalog(list);
  return v;
}

export function parseEmbed(type, s) {
  s = String(s || "").trim();
  if (type === "youtube") {
    const m = s.match(/(?:youtu\.be\/|v=|embed\/|shorts\/|live\/)([\w-]{11})/) || s.match(/^([\w-]{11})$/);
    return m ? m[1] : null;
  }
  const m = s.match(/vimeo\.com\/(?:video\/)?(\d{6,12})/) || s.match(/^(\d{6,12})$/);
  return m ? m[1] : null;
}

export async function deleteVideo(id) {
  if (!storageReady) throw httpErr(503, "Storage is not configured.");
  const list = [...await readCatalog(true)];
  const v = list.find(x => x.id === id);
  if (!v) throw httpErr(404, "Video not found.");
  for (const key of [v.key, v.thumbKey].filter(Boolean)) await s3.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key })).catch(() => {});
  await writeCatalog(list.filter(x => x.id !== id));
}

export async function reorder(ids) {
  const list = [...await readCatalog(true)];
  ids.forEach((id, n) => { const v = list.find(x => x.id === id); if (v) v.order = n; });
  await writeCatalog(list);
}

function httpErr(status, message) { const e = new Error(message); e.status = status; return e; }
