// AI assistant: chat and design review. Hidden when the API reports that AI is not available.
import { t } from "./shared/i18n.js";

const $ = id => document.getElementById(id);
const esc = v => String(v ?? "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

let API = "", getLang = () => "en", getInputs = () => ({}), available = null, enabled = () => true;
let history = [], busy = false;

// small safe markdown: **bold**, "- " bullets, paragraphs
export function md(text) {
  const out = []; let list = [];
  const inline = s => esc(s).replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  const flush = () => { if (list.length) { out.push("<ul>" + list.map(x => `<li>${inline(x)}</li>`).join("") + "</ul>"); list = []; } };
  for (const line of String(text).split(/\r?\n/)) {
    const m = line.match(/^\s*(?:[-*•]|\d+[.)])\s+(.*)$/);
    if (m) list.push(m[1]);
    else { flush(); if (line.trim()) out.push(`<p>${inline(line.trim())}</p>`); }
  }
  flush(); return out.join("");
}

async function post(path, body) {
  const res = await fetch(API + path, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body), signal: AbortSignal.timeout(90000) });
  const j = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(j.error || "HTTP " + res.status);
  return j;
}

export async function initAssistant(opts) {
  API = opts.api; getLang = opts.lang; getInputs = opts.inputs; if (opts.enabled) enabled = opts.enabled;
  $("chatForm").addEventListener("submit", e => { e.preventDefault(); send($("chatInput").value); });
  $("chatClear").addEventListener("click", () => { history = []; renderChat(); });
  $("chatChips").addEventListener("click", e => { const b = e.target.closest("button[data-q]"); if (b) send(b.textContent); });
  $("reviewBtn").addEventListener("click", review);
  if (!API) return;
  try {
    const r = await fetch(`${API}/api/ai/status`, { signal: AbortSignal.timeout(15000) });
    available = r.ok && (await r.json()).available;
  } catch { available = false; }
  $("tabAssistant").hidden = !available || !enabled();
}

export function renderAssistant() {
  const L = getLang();
  $("chatInput").placeholder = t(L, "aiPlaceholder");
  $("chatChips").innerHTML = history.length ? "" : ["aiS1", "aiS2", "aiS3", "aiS4"].map(k => `<button type="button" class="chip" data-q="1">${esc(t(L, k))}</button>`).join("");
  if (available === false) { $("chatLog").innerHTML = `<p class="muted">${esc(t(L, "aiUnavailable"))}</p>`; }
  else renderChat();
}

function renderChat() {
  const L = getLang();
  $("chatChips").innerHTML = history.length ? "" : ["aiS1", "aiS2", "aiS3", "aiS4"].map(k => `<button type="button" class="chip" data-q="1">${esc(t(L, k))}</button>`).join("");
  $("chatLog").innerHTML = history.map(m => `<div class="msg ${m.role}"><span class="who">${esc(t(L, m.role === "user" ? "aiYou" : "aiBot"))}</span><div class="bub ${m.error ? "err" : ""}">${m.role === "user" ? `<p>${esc(m.content)}</p>` : md(m.content)}</div></div>`).join("")
    + (busy ? `<div class="msg assistant"><span class="who">${esc(t(L, "aiBot"))}</span><div class="bub typing">${esc(t(L, "aiThinking"))}</div></div>` : "");
  const log = $("chatLog"); log.scrollTop = log.scrollHeight;
}

async function send(q) {
  q = String(q || "").trim(); if (!q || busy) return;
  const L = getLang();
  history.push({ role: "user", content: q }); $("chatInput").value = ""; busy = true; $("chatSend").disabled = true; renderChat();
  try {
    const msgs = history.filter(m => !m.error).map(({ role, content }) => ({ role, content }));
    const r = await post("/api/ai/chat", { messages: msgs, lang: L, inputs: getInputs() });
    history.push({ role: "assistant", content: r.text });
  } catch (e) { history.push({ role: "assistant", content: e.message && !/HTTP|fetch|timed/i.test(e.message) ? e.message : t(L, "aiError"), error: true }); }
  busy = false; $("chatSend").disabled = false; renderChat(); $("chatInput").focus();
}

async function review() {
  const L = getLang(), out = $("reviewOut"), b = $("reviewBtn");
  b.disabled = true; out.innerHTML = `<p class="muted typing">${esc(t(L, "aiReviewing"))}</p>`;
  try { out.innerHTML = md((await post("/api/ai/review", { lang: L, inputs: getInputs() })).text); }
  catch (e) { out.innerHTML = `<p class="err-text">${esc(/HTTP|fetch|timed/i.test(e.message) ? t(L, "aiError") : e.message)}</p>`; }
  b.disabled = false;
}
