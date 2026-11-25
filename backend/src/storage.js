// Cloudflare R2 (S3-compatible) client shared by the video library and the admin settings.
import { S3Client, GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";

const E = process.env;
const clean = v => String(v ?? "").trim().replace(/^["']|["']$/g, "");
export const BUCKET = clean(E.R2_BUCKET);
const ENDPOINT = clean(E.R2_ENDPOINT) || (E.R2_ACCOUNT_ID ? `https://${clean(E.R2_ACCOUNT_ID)}.r2.cloudflarestorage.com` : "");
export const storageReady = !!(BUCKET && ENDPOINT && E.R2_ACCESS_KEY_ID && E.R2_SECRET_ACCESS_KEY);

export const s3 = storageReady ? new S3Client({
  region: "auto", endpoint: ENDPOINT, forcePathStyle: true,
  credentials: { accessKeyId: clean(E.R2_ACCESS_KEY_ID), secretAccessKey: clean(E.R2_SECRET_ACCESS_KEY) },
}) : null;

export async function readJson(key) {
  try {
    const out = await s3.send(new GetObjectCommand({ Bucket: BUCKET, Key: key }));
    return JSON.parse(await out.Body.transformToString());
  } catch (e) {
    if (e?.name === "NoSuchKey" || e?.$metadata?.httpStatusCode === 404) return null;
    throw e;
  }
}

export async function writeJson(key, obj) {
  await s3.send(new PutObjectCommand({ Bucket: BUCKET, Key: key, ContentType: "application/json", CacheControl: "no-store", Body: JSON.stringify(obj, null, 1) }));
}

export function httpErr(status, message) { const e = new Error(message); e.status = status; return e; }
