// AI layer: OpenAI, Gemini and OpenRouter behind one function, with provider order, model fallback,
// retries, timeout, response cache and optional logging. Only AI settings are read here.
//
// Railway variables (defaults; the admin Settings page can override every one of them):
//   OPENAI_API_KEY, OPENAI_MODEL, OPENAI_FALLBACK_MODEL
//   GEMINI_API_KEY, GEMINI_MODEL, GEMINI_FALLBACK_MODEL
//   OPENROUTER_API_KEY, OPENROUTER_MODELS (comma-separated)
//   AI_PROVIDER_ORDER, AI_FALLBACK_ENABLED, AI_MAX_RETRIES, AI_TIMEOUT_MS,
//   AI_CACHE_ENABLED, AI_CACHE_TTL (seconds), AI_LOGGING, AI_LOG_LEVEL
import crypto from "node:crypto";
import { getSettings, seal, unseal } from "./settings.js";
import { httpErr } from "./storage.js";

export const PROVIDERS = ["openai", "gemini", "openrouter"];
const isCustom = id => /^c_[a-z0-9]{4,12}$/.test(id);
const E = process.env;
const env = n => String(E[n] ?? "").trim().replace(/^["']|["']$/g, "");
const bool = (v, d) => (v === undefined || v === null || v === "" ? d : /^(1|true|yes|on)$/i.test(String(v)));
const num = (v, d, lo, hi) => { if (v === "" || v === null || v === undefined) return d; const n = Number(v); return Number.isFinite(n) ? Math.min(hi, Math.max(lo, n)) : d; };
const list = s => String(s || "").split(",").map(x => x.trim()).filter(Boolean);

const BASES = {
  openai: env("OPENAI_BASE_URL") || "https://api.openai.com/v1",
  gemini: env("GEMINI_BASE_URL") || "https://generativelanguage.googleapis.com/v1beta",
  openrouter: env("OPENROUTER_BASE_URL") || "https://openrouter.ai/api/v1",
};

// ---------- configuration (admin settings over environment) ----------
export async function aiConfig() {
  const st = (await getSettings()).ai || {};
  const keys = {};
  for (const p of PROVIDERS) {
    const sealed = st.keys?.[p];
    const own = sealed ? unseal(sealed) : "";
    const fromEnv = env(p.toUpperCase() + "_API_KEY");
    keys[p] = own ? { key: own, source: "admin" } : fromEnv ? { key: fromEnv, source: "env" } : { key: "", source: null };
  }
  const custom = (st.custom || []).map(c => ({ id: c.id, name: c.name, baseUrl: c.baseUrl, key: c.key ? unseal(c.key) : "", models: c.models || [] }));
  for (const c of custom) keys[c.id] = { key: c.key, source: "admin" };
  const m = st.models || {};
  const models = {
    openai: { primary: m.openai || env("OPENAI_MODEL") || "gpt-4.1", fallback: m.openaiFallback ?? (env("OPENAI_FALLBACK_MODEL") || "gpt-4.1-mini") },
    gemini: { primary: m.gemini || env("GEMINI_MODEL") || "gemini-2.5-flash", fallback: m.geminiFallback ?? (env("GEMINI_FALLBACK_MODEL") || "gemini-2.0-flash") },
    openrouter: { list: m.openrouter?.length ? m.openrouter : list(env("OPENROUTER_MODELS")).length ? list(env("OPENROUTER_MODELS")) : ["meta-llama/llama-3.3-70b-instruct:free"] },
  };
  const valid = [...PROVIDERS, ...custom.map(c => c.id)];
  let order = (st.order?.length ? st.order : list(env("AI_PROVIDER_ORDER"))).filter(p => valid.includes(p));
  if (!order.length) order = [...PROVIDERS];
  for (const id of valid) if (!order.includes(id) && (st.order?.length ? true : isCustom(id))) order.push(id);
  for (const c of custom) models[c.id] = { list: c.models };
  return {
    enabled: st.enabled !== false,
    keys, models, order, custom,
    fallback: st.fallback ?? bool(env("AI_FALLBACK_ENABLED"), true),
    maxRetries: num(st.maxRetries ?? env("AI_MAX_RETRIES"), 3, 0, 5),
    timeoutMs: num(st.timeoutMs ?? env("AI_TIMEOUT_MS"), 45000, 5000, 120000),
    cache: st.cache ?? bool(env("AI_CACHE_ENABLED"), true),
    cacheTtl: num(st.cacheTtl ?? env("AI_CACHE_TTL"), 3600, 0, 86400),
    logging: st.logging ?? bool(env("AI_LOGGING"), true),
  };
}

export async function aiAvailable() {
  const c = await aiConfig();
  return c.enabled && c.order.some(p => c.keys[p].key);
}

// ---------- provider calls ----------
const retryable = s => s === 429 || s >= 500 || s === 0 || s === 408;

async function post(url, headers, body, timeoutMs) {
  let res;
  try { res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json", ...headers }, body: JSON.stringify(body), signal: AbortSignal.timeout(timeoutMs) }); }
  catch (e) { throw Object.assign(new Error(e.name === "TimeoutError" ? "timed out" : "network error: " + e.message), { status: 0 }); }
  const text = await res.text();
  let json = null; try { json = JSON.parse(text); } catch {}
  if (!res.ok) {
    const msg = json?.error?.message || json?.error || text.slice(0, 200) || "HTTP " + res.status;
    throw Object.assign(new Error(`${typeof msg === "string" ? msg : JSON.stringify(msg)}`.slice(0, 300)), { status: res.status });
  }
  return json;
}

const CALLS = {
  async openai({ key, model, messages, maxTokens, temperature, timeoutMs }) {
    const j = await post(`${BASES.openai}/chat/completions`, { Authorization: "Bearer " + key }, { model, messages, max_tokens: maxTokens, temperature }, timeoutMs);
    return j?.choices?.[0]?.message?.content || "";
  },
  async openrouter({ key, model, messages, maxTokens, temperature, timeoutMs }) {
    const j = await post(`${BASES.openrouter}/chat/completions`, { Authorization: "Bearer " + key, "HTTP-Referer": "https://rwh-planner.vercel.app", "X-Title": "RWH Planner" }, { model, messages, max_tokens: maxTokens, temperature }, timeoutMs);
    return j?.choices?.[0]?.message?.content || "";
  },
  async gemini({ key, model, messages, maxTokens, temperature, timeoutMs }) {
    const sys = messages.filter(m => m.role === "system").map(m => m.content).join("\n\n");
    const contents = messages.filter(m => m.role !== "system").map(m => ({ role: m.role === "assistant" ? "model" : "user", parts: [{ text: m.content }] }));
    const generationConfig = { maxOutputTokens: maxTokens, temperature };
    if (/2\.5-flash/.test(model)) generationConfig.thinkingConfig = { thinkingBudget: 0 };
    const body = { contents, generationConfig };
    if (sys) body.systemInstruction = { parts: [{ text: sys }] };
    const j = await post(`${BASES.gemini}/models/${encodeURIComponent(model)}:generateContent`, { "x-goog-api-key": key }, body, timeoutMs);
    return (j?.candidates?.[0]?.content?.parts || []).map(p => p.text || "").join("");
  },
};

// Any OpenAI-compatible service the admin adds (Groq, DeepSeek, Mistral, Together, xAI, another OpenAI or Gemini key, ...)
async function compat({ base, key, model, messages, maxTokens, temperature, timeoutMs }) {
  const j = await post(`${base.replace(/\/+$/, "")}/chat/completions`, { Authorization: "Bearer " + key }, { model, messages, max_tokens: maxTokens, temperature }, timeoutMs);
  return j?.choices?.[0]?.message?.content || "";
}
const callFor = (cfg, p) => {
  if (!isCustom(p)) return args => CALLS[p](args);
  const c = cfg.custom.find(x => x.id === p);
  return args => compat({ base: c.baseUrl, ...args });
};

function modelsFor(cfg, p) {
  if (p === "openrouter" || isCustom(p)) { const l = cfg.models[p].list; return cfg.fallback ? l : l.slice(0, 1); }
  const m = cfg.models[p];
  return cfg.fallback && m.fallback && m.fallback !== m.primary ? [m.primary, m.fallback] : [m.primary];
}

const cache = new Map();
const log = (cfg, o) => { if (cfg.logging) console.log(JSON.stringify({ ai: true, ...o })); };

// messages: [{role: "system"|"user"|"assistant", content}]
export async function generate({ messages, maxTokens = 700, temperature = 0.4, cacheable = true }) {
  const cfg = await aiConfig();
  if (!cfg.enabled) throw httpErr(503, "AI features are switched off.");
  const usable = cfg.order.filter(p => cfg.keys[p].key);
  if (!usable.length) throw httpErr(503, "AI is not configured.");

  const ck = crypto.createHash("sha256").update(JSON.stringify([messages, maxTokens, temperature])).digest("hex");
  if (cfg.cache && cacheable && cfg.cacheTtl > 0) {
    const hit = cache.get(ck);
    if (hit && Date.now() - hit.at < cfg.cacheTtl * 1000) return { ...hit.value, cached: true };
  }

  const deadline = Date.now() + cfg.timeoutMs * 1.5;
  const errors = [];
  for (const p of cfg.fallback ? usable : usable.slice(0, 1)) {
    for (const model of modelsFor(cfg, p)) {
      for (let attempt = 0; attempt <= cfg.maxRetries; attempt++) {
        const left = deadline - Date.now();
        if (left < 2000) { errors.push(`${p}/${model}: out of time`); break; }
        const t0 = Date.now();
        try {
          const text = (await callFor(cfg, p)({ key: cfg.keys[p].key, model, messages, maxTokens, temperature, timeoutMs: Math.min(cfg.timeoutMs, left) })).trim();
          if (!text) throw Object.assign(new Error("empty answer"), { status: 502 });
          log(cfg, { provider: p, model, ms: Date.now() - t0, ok: true, attempt });
          const value = { text, provider: p, model, cached: false };
          if (cfg.cache && cacheable && cfg.cacheTtl > 0) { cache.set(ck, { at: Date.now(), value }); if (cache.size > 400) cache.delete(cache.keys().next().value); }
          return value;
        } catch (e) {
          log(cfg, { provider: p, model, ms: Date.now() - t0, ok: false, status: e.status ?? 0, error: e.message, attempt });
          errors.push(`${p}/${model}: ${e.message}`);
          if (!retryable(e.status ?? 0) || attempt === cfg.maxRetries) break;
          await new Promise(r => setTimeout(r, Math.min(4000, 500 * 2 ** attempt)));
        }
      }
    }
  }
  console.error("AI failed:", errors.join(" | "));
  throw httpErr(502, "The AI service is busy right now. Please try again in a moment.");
}

// ---------- admin: test a provider (optionally with a key that is not saved yet) ----------
export async function testProvider(p, keyOverride) {
  const cfg = await aiConfig();
  if (!cfg.keys[p]) throw httpErr(400, "Unknown provider.");
  const key = (keyOverride && String(keyOverride).trim()) || cfg.keys[p].key;
  if (!key) return { ok: false, provider: p, message: "No key set for this provider." };
  const model = (isCustom(p) || p === "openrouter") ? cfg.models[p].list[0] : cfg.models[p].primary;
  if (!model) return { ok: false, provider: p, message: "Add at least one model name first." };
  const t0 = Date.now();
  try {
    const text = await callFor(cfg, p)({ key, model, messages: [{ role: "user", content: "Reply with the single word OK." }], maxTokens: 64, temperature: 0, timeoutMs: Math.min(cfg.timeoutMs, 30000) });
    return text.trim() ? { ok: true, provider: p, model, ms: Date.now() - t0, message: "Key works." } : { ok: false, provider: p, model, ms: Date.now() - t0, message: "The provider answered with nothing." };
  } catch (e) {
    const hint = e.status === 401 || e.status === 403 ? " The key was rejected." : e.status === 429 ? " Rate limit or no credit on this key." : e.status === 404 ? " Model name not found." : "";
    return { ok: false, provider: p, model, ms: Date.now() - t0, status: e.status ?? 0, message: e.message + hint };
  }
}

// ---------- admin: settings view and update ----------
const mask = k => (k ? (k.length > 12 ? k.slice(0, 4) + "…" + k.slice(-4) : "••••") : "");

export async function aiSettingsView() {
  const c = await aiConfig();
  return {
    enabled: c.enabled, order: c.order, fallback: c.fallback, maxRetries: c.maxRetries, timeoutMs: c.timeoutMs, cache: c.cache, cacheTtl: c.cacheTtl, logging: c.logging,
    custom: c.custom.map(x => ({ id: x.id, name: x.name, baseUrl: x.baseUrl, models: x.models, set: !!x.key, hint: mask(x.key) })),
    providers: Object.fromEntries(PROVIDERS.map(p => [p, {
      set: !!c.keys[p].key, source: c.keys[p].source, hint: mask(c.keys[p].key),
      ...(p === "openrouter" ? { models: c.models.openrouter.list } : { model: c.models[p].primary, fallbackModel: c.models[p].fallback }),
    }])),
  };
}

// Only public https endpoints (no localhost or private addresses) unless AI_ALLOW_LOCAL=1 (used for tests).
function checkBaseUrl(u) {
  let url; try { url = new URL(String(u || "").trim()); } catch { throw httpErr(400, "Enter the provider's API base URL, for example https://api.groq.com/openai/v1"); }
  const local = /^(localhost|127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|169\.254\.|0\.|\[)/i.test(url.hostname) || !url.hostname.includes(".");
  if (!env("AI_ALLOW_LOCAL") && (url.protocol !== "https:" || local)) throw httpErr(400, "The base URL must be a public https address.");
  if (url.username || url.password || url.search || url.hash) throw httpErr(400, "Remove credentials and query text from the base URL.");
  return url.href.replace(/\/+$/, "");
}

// body: { keys: {p: "new key" | "" (leave) | null (remove admin key)}, models, order, fallback, ... }
export async function saveAiSettings(saveSettings, body) {
  // a browser may autofill the admin password into a key field; never store it as a key
  const pw = env("ADMIN_PASSWORD");
  const typed = [...Object.values(body.keys || {}), body.custom?.key].filter(v => typeof v === "string" && v.trim());
  if (pw && typed.some(v => v.trim() === pw)) throw httpErr(400, "That is your admin password, not an API key. Your browser may have filled it in. Clear the field and paste the key.");
  await saveSettings(s => {
    const a = s.ai = s.ai || {};
    a.keys = a.keys || {};
    for (const p of PROVIDERS) {
      const v = body.keys?.[p];
      if (v === null) delete a.keys[p];
      else if (typeof v === "string" && v.trim()) a.keys[p] = seal(v.trim());
    }
    a.models = a.models || {};
    const ms = body.models || {};
    const str = (v, n = 80) => String(v ?? "").trim().slice(0, n);
    if ("openai" in ms) a.models.openai = str(ms.openai);
    if ("openaiFallback" in ms) a.models.openaiFallback = str(ms.openaiFallback);
    if ("gemini" in ms) a.models.gemini = str(ms.gemini);
    if ("geminiFallback" in ms) a.models.geminiFallback = str(ms.geminiFallback);
    if ("openrouter" in ms) a.models.openrouter = (Array.isArray(ms.openrouter) ? ms.openrouter : list(ms.openrouter)).map(x => str(x, 120)).filter(Boolean).slice(0, 10);
    // add, edit or remove OpenAI-compatible providers
    a.custom = a.custom || [];
    if (body.removeCustom) {
      a.custom = a.custom.filter(x => x.id !== body.removeCustom);
      if (a.order) a.order = a.order.filter(x => x !== body.removeCustom);
    }
    if (body.custom) {
      const c = body.custom, name = str(c.name, 40), baseUrl = checkBaseUrl(c.baseUrl);
      if (!name) throw httpErr(400, "Give the provider a name.");
      const models = (Array.isArray(c.models) ? c.models : list(String(c.models || "").replace(/\n/g, ","))).map(x => str(x, 120)).filter(Boolean).slice(0, 10);
      if (!models.length) throw httpErr(400, "Add at least one model name.");
      const prev = c.id ? a.custom.find(x => x.id === c.id) : null;
      if (c.id && !prev) throw httpErr(404, "Provider not found.");
      if (!prev && a.custom.length >= 8) throw httpErr(400, "You can add up to 8 extra providers.");
      if (!prev && !(typeof c.key === "string" && c.key.trim())) throw httpErr(400, "Paste the API key.");
      const rec = prev || { id: "c_" + crypto.randomBytes(4).toString("hex") };
      Object.assign(rec, { name, baseUrl, models });
      if (typeof c.key === "string" && c.key.trim()) rec.key = seal(c.key.trim());
      if (!prev) a.custom.push(rec);
      if (a.order && !a.order.includes(rec.id)) a.order.push(rec.id);
    }
    const validIds = [...PROVIDERS, ...a.custom.map(x => x.id)];
    if (Array.isArray(body.order)) a.order = body.order.filter(p => validIds.includes(p));
    for (const k of ["enabled", "fallback", "cache", "logging"]) if (typeof body[k] === "boolean") a[k] = body[k];
    if (body.maxRetries != null) a.maxRetries = num(body.maxRetries, 3, 0, 5);
    if (body.timeoutMs != null) a.timeoutMs = num(body.timeoutMs, 45000, 5000, 120000);
    if (body.cacheTtl != null) a.cacheTtl = num(body.cacheTtl, 3600, 0, 86400);
    return s;
  });
  cache.clear();
}

export const clearAiCache = () => cache.clear();
