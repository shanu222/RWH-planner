// Share links use the same ?d= format as the web app, so a link opens the same design on the website or in the app.
import { Share } from "react-native";
import type { Inputs } from "./store";

export const SHARE_KEYS = ["city", "plot", "marlaSize", "storeys", "area", "unit", "roof", "people", "lpcd", "houses", "tank", "rain", "contingency", "rates"] as const;

function utf8Encode(s: string) {
  const out: number[] = [];
  for (const ch of s) {
    let c = ch.codePointAt(0)!;
    if (c < 0x80) out.push(c);
    else if (c < 0x800) out.push(0xc0 | (c >> 6), 0x80 | (c & 63));
    else if (c < 0x10000) out.push(0xe0 | (c >> 12), 0x80 | ((c >> 6) & 63), 0x80 | (c & 63));
    else { out.push(0xf0 | (c >> 18), 0x80 | ((c >> 12) & 63), 0x80 | ((c >> 6) & 63), 0x80 | (c & 63)); }
  }
  return out;
}
function utf8Decode(bytes: number[]) {
  let s = "", i = 0;
  while (i < bytes.length) {
    const b = bytes[i++];
    if (b < 0x80) s += String.fromCharCode(b);
    else if (b < 0xe0) s += String.fromCharCode(((b & 31) << 6) | (bytes[i++] & 63));
    else if (b < 0xf0) s += String.fromCharCode(((b & 15) << 12) | ((bytes[i++] & 63) << 6) | (bytes[i++] & 63));
    else { const c = ((b & 7) << 18) | ((bytes[i++] & 63) << 12) | ((bytes[i++] & 63) << 6) | (bytes[i++] & 63); s += String.fromCodePoint(c); }
  }
  return s;
}
const B64 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";
function b64url(bytes: number[]) {
  let s = "";
  for (let i = 0; i < bytes.length; i += 3) {
    const n = (bytes[i] << 16) | ((bytes[i + 1] ?? 0) << 8) | (bytes[i + 2] ?? 0);
    s += B64[(n >> 18) & 63] + B64[(n >> 12) & 63] + (i + 1 < bytes.length ? B64[(n >> 6) & 63] : "") + (i + 2 < bytes.length ? B64[n & 63] : "");
  }
  return s;
}
function unb64url(s: string) {
  const clean = s.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  const out: number[] = [];
  for (let i = 0; i < clean.length; i += 4) {
    const v = [0, 1, 2, 3].map(j => B64.indexOf(clean[i + j] ?? "A"));
    if (v.some(x => x < 0)) throw new Error("bad link");
    const n = (v[0] << 18) | (v[1] << 12) | (v[2] << 6) | v[3];
    out.push((n >> 16) & 255);
    if (i + 2 < clean.length) out.push((n >> 8) & 255);
    if (i + 3 < clean.length) out.push(n & 255);
  }
  return out;
}

export function encodeDesign(inputs: Inputs) {
  const o: Record<string, unknown> = {};
  for (const k of SHARE_KEYS) if ((inputs as Record<string, unknown>)[k] != null) o[k] = (inputs as Record<string, unknown>)[k];
  return b64url(utf8Encode(JSON.stringify(o)));
}

export function decodeDesign(d: string): Partial<Inputs> | null {
  try {
    const json = JSON.parse(utf8Decode(unb64url(d)));
    if (!json || typeof json !== "object") return null;
    const out: Record<string, unknown> = {};
    for (const k of SHARE_KEYS) out[k] = k in json ? json[k] : (k === "rates" || k === "rain" || k === "tank" ? null : undefined);
    for (const k of Object.keys(out)) if (out[k] === undefined) delete out[k];
    return out as Partial<Inputs>;
  } catch { return null; }
}

export const designUrl = (webUrl: string, inputs: Inputs) => `${webUrl.replace(/\/+$/, "")}/?d=${encodeDesign(inputs)}#overview`;

export async function shareText(message: string, title?: string) {
  try { await Share.share({ message, title }); } catch {}
}
