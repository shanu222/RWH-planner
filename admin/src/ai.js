import { $, esc, api, say } from "./api.js";
const NAMES = { openai: "OpenAI", gemini: "Google Gemini", openrouter: "OpenRouter" };
let view = null, order = [];
const nameOf = p => NAMES[p] || (view.custom.find(c => c.id === p) || {}).name || p;
const PRESETS = {
  "": ["Choose a service…", "", ""],
  openai: ["OpenAI (another key)", "https://api.openai.com/v1", "gpt-4.1-mini"],
  gemini: ["Google Gemini (another key)", "https://generativelanguage.googleapis.com/v1beta/openai", "gemini-2.5-flash"],
  groq: ["Groq", "https://api.groq.com/openai/v1", "llama-3.3-70b-versatile"],
  deepseek: ["DeepSeek", "https://api.deepseek.com/v1", "deepseek-chat"],
  mistral: ["Mistral", "https://api.mistral.ai/v1", "mistral-small-latest"],
  together: ["Together AI", "https://api.together.xyz/v1", "meta-llama/Llama-3.3-70B-Instruct-Turbo"],
  xai: ["xAI", "https://api.x.ai/v1", "grok-3-mini"],
  other: ["Other (OpenAI-compatible)", "", ""],
};

export async function loadAi() {
  view = await api("/api/admin/ai");
  $("aiStorageWarn").hidden = view.storage; order = [...view.order];
  $("aiEnabled").checked = view.enabled; $("aiFallback").checked = view.fallback; $("aiCache").checked = view.cache; $("aiLogging").checked = view.logging;
  $("aiRetries").value = view.maxRetries; $("aiTimeout").value = Math.round(view.timeoutMs / 1000); $("aiTtl").value = view.cacheTtl;
  renderOrder(); renderProviders();
}

function renderOrder() {
  $("aiOrder").innerHTML = order.map((p, i) => `<span class="chip" data-p="${p}"><b>${i + 1}</b> ${esc(nameOf(p))}
    <button type="button" class="icon-btn sm" data-mv="-1" ${i === 0 ? "disabled" : ""} aria-label="Move earlier">←</button>
    <button type="button" class="icon-btn sm" data-mv="1" ${i === order.length - 1 ? "disabled" : ""} aria-label="Move later">→</button></span>`).join("");
}
$("aiOrder").addEventListener("click", e => {
  const b = e.target.closest("[data-mv]"); if (!b) return;
  const p = b.closest("[data-p]").dataset.p, i = order.indexOf(p), j = i + Number(b.dataset.mv);
  [order[i], order[j]] = [order[j], order[i]]; renderOrder();
});

function customCard(c) {
  return `<section class="card prov" data-p="${c.id}" data-custom="1">
    <div class="card-h"><h2>${esc(c.name)}</h2><span class="status-pill ${c.set ? "live" : "off"}">${c.set ? "Key set by admin" : "No key"}</span></div>
    <p class="muted small">Current key <code>${esc(c.hint)}</code></p>
    <div class="row2 eq"><label class="field"><span>Name</span><input type="text" class="cn" value="${esc(c.name)}" maxlength="40"></label>
    <label class="field"><span>API base URL</span><input type="url" class="cu" value="${esc(c.baseUrl)}"></label></div>
    <label class="field"><span>New API key</span><input type="text" class="k secret" autocomplete="off" autocapitalize="off" spellcheck="false" data-lpignore="true" data-1p-ignore name="apikey-${c.id}" placeholder="Leave empty to keep the current key"></label>
    <label class="field"><span>Models, one per line (tried in order)</span><textarea class="m" rows="3">${esc(c.models.join("\n"))}</textarea></label>
    <div class="ed-actions"><button class="btn" data-act="test">Test key</button><button class="btn primary" data-act="save">Save</button><button class="btn danger" data-act="remove">Delete provider</button></div>
    <p class="status" role="status"></p></section>`;
}

function renderProviders() {
  $("provGrid").innerHTML = view.custom.map(customCard).join("") + Object.entries(view.providers).map(([p, v]) => `<section class="card prov" data-p="${p}">
    <div class="card-h"><h2>${NAMES[p]}</h2><span class="status-pill ${v.set ? "live" : "off"}">${v.set ? (v.source === "env" ? "Key from server settings" : "Key set by admin") : "No key"}</span></div>
    <p class="muted small">${v.set ? `Current key <code>${esc(v.hint)}</code>` : "Add a key to use this provider."}</p>
    <label class="field"><span>New API key</span><input type="text" class="k secret" autocomplete="off" autocapitalize="off" spellcheck="false" data-lpignore="true" data-1p-ignore name="apikey-${p}" placeholder="${v.set ? "Leave empty to keep the current key" : "Paste key"}"></label>
    ${p === "openrouter"
      ? `<label class="field"><span>Models, one per line (tried in order)</span><textarea class="m" rows="5">${esc(v.models.join("\n"))}</textarea></label>`
      : `<div class="row2 eq"><label class="field"><span>Model</span><input type="text" class="m1" value="${esc(v.model)}"></label><label class="field"><span>Fallback model</span><input type="text" class="m2" value="${esc(v.fallbackModel || "")}"></label></div>`}
    <div class="ed-actions"><button class="btn" data-act="test">Test key</button><button class="btn primary" data-act="save">Save</button>${v.source === "admin" ? `<button class="btn danger" data-act="remove">Remove key</button>` : ""}</div>
    <p class="status" role="status"></p></section>`).join("");
}

$("provGrid").addEventListener("click", async e => {
  const b = e.target.closest("button[data-act]"); if (!b) return;
  const card = b.closest(".prov"), p = card.dataset.p, custom = !!card.dataset.custom, out = card.querySelector(".status"), typed = card.querySelector(".k").value.trim();
  const lines = () => card.querySelector(".m").value.split("\n").map(s => s.trim()).filter(Boolean);
  const models = () => p === "openrouter" ? { openrouter: lines() } : { [p]: card.querySelector(".m1").value, [p + "Fallback"]: card.querySelector(".m2").value };
  b.disabled = true;
  try {
    if (b.dataset.act === "test") {
      say(out, "Testing…");
      if (custom) await api("/api/admin/ai", { method: "PUT", body: JSON.stringify({ custom: { id: p, name: card.querySelector(".cn").value, baseUrl: card.querySelector(".cu").value, models: lines() } }) });
      const r = await api("/api/admin/ai/test", { method: "POST", body: JSON.stringify({ provider: p, key: typed || undefined }) });
      say(out, r.ok ? `Works · ${r.model} · ${r.ms} ms${typed ? " (key not saved yet)" : ""}` : "Failed: " + r.message, r.ok ? "ok" : "err");
    } else if (b.dataset.act === "save") {
      const body = custom ? { custom: { id: p, name: card.querySelector(".cn").value, baseUrl: card.querySelector(".cu").value, key: typed, models: lines() } } : { keys: typed ? { [p]: typed } : {}, models: models() };
      await api("/api/admin/ai", { method: "PUT", body: JSON.stringify(body) });
      await loadAi(); say($("provGrid").querySelector(`[data-p="${p}"] .status`), "Saved.", "ok");
    } else if (custom ? confirm("Delete this provider and its key?") : confirm("Remove the key stored by the admin? The server setting (if any) will be used instead.")) {
      await api("/api/admin/ai", { method: "PUT", body: JSON.stringify(custom ? { removeCustom: p } : { keys: { [p]: null } }) });
      await loadAi();
    }
  } catch (err) { say(out, err.message, "err"); }
  finally { b.disabled = false; }
});

// ---------- add a new provider ----------
const preset = $("apPreset");
preset.innerHTML = Object.entries(PRESETS).map(([k, v]) => `<option value="${k}">${v[0]}</option>`).join("");
preset.addEventListener("change", () => {
  const [name, url, model] = PRESETS[preset.value];
  if (!preset.value) return;
  if (preset.value !== "other") { $("apName").value = name.replace(/ \(another key\)/, " (extra)"); $("apUrl").value = url; $("apModels").value = model; }
  else { $("apName").value = ""; $("apUrl").value = ""; $("apModels").value = ""; }
});
$("addProvForm").addEventListener("submit", async e => {
  e.preventDefault(); const out = $("apMsg");
  try {
    const custom = { name: $("apName").value, baseUrl: $("apUrl").value, key: $("apKey").value, models: $("apModels").value.split("\n").map(s => s.trim()).filter(Boolean) };
    await api("/api/admin/ai", { method: "PUT", body: JSON.stringify({ custom }) });
    const added = (await api("/api/admin/ai")).custom.find(c => c.name === custom.name.trim().slice(0, 40));
    if (added) { const r = await api("/api/admin/ai/test", { method: "POST", body: JSON.stringify({ provider: added.id }) }); say(out, r.ok ? `Added. Key works (${r.model}).` : "Added, but the test failed: " + r.message, r.ok ? "ok" : "err"); }
    $("addProvForm").reset(); await loadAi();
  } catch (err) { say(out, err.message, "err"); }
});

$("aiForm").addEventListener("submit", async e => {
  e.preventDefault();
  try {
    await api("/api/admin/ai", { method: "PUT", body: JSON.stringify({
      enabled: $("aiEnabled").checked, fallback: $("aiFallback").checked, cache: $("aiCache").checked, logging: $("aiLogging").checked,
      order, maxRetries: Number($("aiRetries").value), timeoutMs: Number($("aiTimeout").value) * 1000, cacheTtl: Number($("aiTtl").value) }) });
    say($("aiMsg"), "Saved.", "ok");
  } catch (err) { say($("aiMsg"), err.message, "err"); }
});
$("aiClear").addEventListener("click", async () => { await api("/api/admin/ai/clear-cache", { method: "POST" }); say($("aiMsg"), "Cache cleared.", "ok"); });
