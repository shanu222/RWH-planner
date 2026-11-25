// Admin sign-in: email + password, then a signed session token (12 h).
//   ADMIN_EMAIL, ADMIN_PASSWORD   the first admin account (from Railway variables)
//   SESSION_SECRET                long random string used to sign sessions and encrypt saved keys
// A password changed from the admin panel is stored (scrypt hash) in settings and replaces ADMIN_PASSWORD.
import crypto from "node:crypto";
import { getSettings, saveSettings } from "./settings.js";
import { httpErr } from "./storage.js";

const clean = v => String(v ?? "").trim().replace(/^["']|["']$/g, "");
const EMAIL = () => clean(process.env.ADMIN_EMAIL).toLowerCase();
const PASS = () => clean(process.env.ADMIN_PASSWORD);
const SECRET = () => process.env.SESSION_SECRET || "";
const SESSION_MS = 12 * 3600 * 1000;

export const adminConfigured = () => !!(EMAIL() && SECRET());
export const adminProblem = () => (!EMAIL() ? "ADMIN_EMAIL is not set." : !SECRET() ? "SESSION_SECRET is not set." : !PASS() ? "ADMIN_PASSWORD is not set." : "");

const eq = (a, b) => { const x = Buffer.from(String(a)), y = Buffer.from(String(b)); return x.length === y.length && crypto.timingSafeEqual(x, y); };

export function hashPassword(pw) {
  const salt = crypto.randomBytes(16);
  return `scrypt$${salt.toString("base64")}$${crypto.scryptSync(pw, salt, 32).toString("base64")}`;
}
function checkHash(pw, stored) {
  const [alg, s, h] = String(stored).split("$");
  if (alg !== "scrypt") return false;
  return eq(crypto.scryptSync(pw, Buffer.from(s, "base64"), 32).toString("base64"), h);
}

const sign = payload => crypto.createHmac("sha256", SECRET()).update(payload).digest("base64url");
export function issueToken(email) {
  const p = Buffer.from(JSON.stringify({ e: email, x: Date.now() + SESSION_MS })).toString("base64url");
  return `${p}.${sign(p)}`;
}
export function verifyToken(tok) {
  if (!SECRET() || typeof tok !== "string") return null;
  const [p, sig] = tok.split(".");
  if (!p || !sig || !eq(sig, sign(p))) return null;
  try { const d = JSON.parse(Buffer.from(p, "base64url").toString()); return d.x > Date.now() ? d : null; } catch { return null; }
}

export async function login(email, password) {
  const problem = adminProblem();
  if (problem && problem !== "ADMIN_PASSWORD is not set.") throw httpErr(503, `Admin is not configured. ${problem}`);
  const st = await getSettings();
  const okEmail = eq(String(email || "").trim().toLowerCase(), EMAIL());
  const okPass = st.passwordHash ? checkHash(String(password || ""), st.passwordHash) : !!PASS() && eq(String(password || ""), PASS());
  if (!okEmail || !okPass) throw httpErr(401, "Wrong email or password.");
  return { token: issueToken(EMAIL()), email: EMAIL(), expiresIn: SESSION_MS / 1000 };
}

export async function changePassword(current, next) {
  const st = await getSettings();
  const ok = st.passwordHash ? checkHash(String(current || ""), st.passwordHash) : !!PASS() && eq(String(current || ""), PASS());
  if (!ok) throw httpErr(400, "Current password is wrong.");
  if (String(next || "").length < 10) throw httpErr(400, "New password must be at least 10 characters.");
  const h = hashPassword(String(next));
  await saveSettings(s => { s.passwordHash = h; return s; });
}

export const passwordSource = async () => ((await getSettings()).passwordHash ? "admin" : "env");

export function sessionOf(req) {
  const h = req.get("authorization") || "";
  return verifyToken(h.startsWith("Bearer ") ? h.slice(7) : "");
}

// failed-login limiter
const fails = new Map();
export function loginAllowed(ip) {
  const now = Date.now(), list = (fails.get(ip) || []).filter(t => now - t < 600000);
  fails.set(ip, list); return list.length < 8;
}
export function loginFailed(ip) { const l = fails.get(ip) || []; l.push(Date.now()); fails.set(ip, l); }
