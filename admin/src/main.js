import "@fontsource/inter/400.css";
import "@fontsource/inter/500.css";
import "@fontsource/inter/600.css";
import "@fontsource/noto-nastaliq-urdu/400.css";
import "./base.css";
import "./admin.css";
import { $, api, session, say } from "./api.js";
import { loadVideos } from "./videos.js";
import { loadRates } from "./rates.js";
import { loadAi } from "./ai.js";

const TABS = { videos: loadVideos, rates: loadRates, ai: loadAi, account: loadAccount };
let email = "";

async function loadAccount() {
  const a = await api("/api/admin/account");
  $("acctSub").textContent = `Signed in as ${a.email}. ` + (a.passwordSource === "env" ? "The password comes from the server setting ADMIN_PASSWORD. Changing it here stores a new one that replaces it." : "The password was changed here and is stored hashed.");
}
async function route() {
  const t = TABS[location.hash.slice(1)] ? location.hash.slice(1) : "videos";
  document.querySelectorAll("[data-tab]").forEach(a => a.setAttribute("aria-selected", a.dataset.tab === t));
  document.querySelectorAll(".view").forEach(v => (v.hidden = v.id !== "p-" + t));
  try { await TABS[t](); } catch (e) { const el = $("p-" + t).querySelector(".page-h p"); if (el) { el.textContent = e.message; el.className = "status err"; } }
}
function enter(who) {
  email = who; $("login").hidden = true; $("shell").hidden = false; $("who").textContent = who;
  document.body.classList.remove("admin-login"); route();
}
window.addEventListener("hashchange", () => { if (!$("shell").hidden) route(); });

$("loginForm").addEventListener("submit", async e => {
  e.preventDefault(); say($("loginMsg"), ""); $("loginBtn").disabled = true;
  try {
    const r = await api("/api/admin/login", { method: "POST", body: JSON.stringify({ email: $("email").value.trim(), password: $("password").value }) });
    session.set(r.token); $("password").value = ""; enter(r.email);
  } catch (err) { say($("loginMsg"), err.message, "err"); }
  finally { $("loginBtn").disabled = false; }
});
$("logout").addEventListener("click", () => { session.set(""); location.hash = ""; location.reload(); });

$("pwForm").addEventListener("submit", async e => {
  e.preventDefault();
  if ($("pwNew").value !== $("pwNew2").value) return say($("pwMsg"), "The new passwords do not match.", "err");
  try { await api("/api/admin/password", { method: "POST", body: JSON.stringify({ current: $("pwCur").value, next: $("pwNew").value }) }); $("pwForm").reset(); say($("pwMsg"), "Password changed.", "ok"); loadAccount(); }
  catch (err) { say($("pwMsg"), err.message, "err"); }
});

if (session.get()) api("/api/admin/me").then(r => enter(r.email)).catch(() => session.set(""));
