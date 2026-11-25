// What the AI is used for: a design assistant, a design review, and EN<->UR translation for the admin.
import { compute, normalizeInputs, CITIES, ROOFS } from "./shared/calc.js";
import { PLOTS } from "./shared/rates.js";
import { liveRates } from "./rates-live.js";
import { generate } from "./ai.js";

const money = n => "PKR " + Math.round(n).toLocaleString("en-US");
const L = n => Math.round(n).toLocaleString("en-US");

async function designFacts(rawInputs) {
  const inputs = normalizeInputs(rawInputs || {});
  const { rates } = await liveRates(inputs.city);
  const r = compute(inputs, rates);
  const plot = inputs.plot === "custom" ? "custom roof area" : (PLOTS.find(p => p.key === inputs.plot)?.en || inputs.plot);
  const pay = r.cost.payback;
  return {
    r,
    text: [
      `City: ${CITIES[inputs.city].en}. Plot: ${plot}, ${inputs.storeys} storey(s). Roof catchment: ${L(r.A)} m² (${ROOFS[inputs.roof].en}).`,
      `Household: ${inputs.people} people at ${inputs.lpcd} litres per person per day (${L(r.dem)} L/year demand).`,
      `Average annual rainfall: ${L(r.annualRain)} mm. Rainwater collected: ${L(r.harvest)} L/year.`,
      `Chosen tank: ${L(r.tank)} L (recommended ${L(r.recommended)} L). Demand met from the tank: ${Math.round(r.met)}% (${L(r.sim.used)} L/year).`,
      `Recharge well: ${r.well.wells} well(s), ${r.well.diameter.toFixed(1)} m wide, ${r.well.depth.toFixed(1)} m deep.`,
      `Estimated system cost: ${money(r.cost.total)} (incl. ${r.boq.contingencyPct}% contingency). Yearly saving at tanker rates: ${money(r.cost.save)}. Payback: ${pay ? pay.toFixed(1) + " years" : "no saving"}.`,
    ].join("\n"),
  };
}

const STYLE = {
  en: "Reply in clear, professional English.",
  ur: "Reply in formal, professional Pakistani Urdu (اردو) as used in Pakistani engineering and government documents. Keep numbers in Western digits (0-9) and units such as m², mm and litres in their usual form.",
};

const BASE = `You are the design assistant inside RWH Planner, a rooftop rainwater harvesting and groundwater recharge planning tool for Pakistan (cities include Islamabad, Rawalpindi, Lahore, Karachi, Peshawar, Quetta, Multan, Murree, Muzaffarabad, Abbottabad).
Rules:
- Only discuss rainwater harvesting, groundwater recharge, water storage, treatment, reuse and closely related building/plumbing topics. Politely decline anything else.
- Use the design numbers given below when they are relevant. Never invent numbers, prices, standards or rules. If you are not sure, say so and suggest asking a qualified engineer or PCRWR.
- Be practical and concise. Prefer short paragraphs and "-" bullet lists. No headings larger than bold text.
- You give planning guidance, not a stamped engineering design.`;

export async function chat({ messages, lang, inputs }) {
  const facts = await designFacts(inputs);
  const clean = (Array.isArray(messages) ? messages : []).slice(-8)
    .map(m => ({ role: m.role === "assistant" ? "assistant" : "user", content: String(m.content || "").slice(0, 1500) })).filter(m => m.content.trim());
  if (!clean.length || clean[clean.length - 1].role !== "user") { const e = new Error("Ask a question first."); e.status = 400; throw e; }
  const system = `${BASE}\n${STYLE[lang === "ur" ? "ur" : "en"]}\n\nThe user's current design:\n${facts.text}`;
  const out = await generate({ messages: [{ role: "system", content: system }, ...clean], maxTokens: 700, temperature: 0.4 });
  return { text: out.text, cached: out.cached };
}

export async function review({ lang, inputs }) {
  const facts = await designFacts(inputs);
  const prompt = `Review this rainwater harvesting design for a Pakistani household or building. Give:\n**Summary** (2 sentences)\n**What works well** (2-3 bullets)\n**Things to check** (3-4 bullets: sizing, cost, water quality, recharge safety, maintenance, roof or site issues that the numbers suggest)\n**Next steps** (3 bullets)\nKeep it under 230 words. Base every point on the numbers below.`;
  const system = `${BASE}\n${STYLE[lang === "ur" ? "ur" : "en"]}\n\nDesign:\n${facts.text}`;
  const out = await generate({ messages: [{ role: "system", content: system }, { role: "user", content: prompt }], maxTokens: 900, temperature: 0.3 });
  return { text: out.text, cached: out.cached };
}

// admin: professional translation between English and Urdu
export async function translate({ text, from, to }) {
  const src = String(text || "").trim().slice(0, 2000);
  if (!src) { const e = new Error("Nothing to translate."); e.status = 400; throw e; }
  const names = { en: "English", ur: "formal, professional Pakistani Urdu (اردو)" };
  const system = `You translate training-video titles and descriptions about rainwater harvesting and water management from ${from === "ur" ? "Urdu" : "English"} into ${names[to === "ur" ? "ur" : "en"]}. Return only the translation, with no quotes or notes. Keep technical terms accurate (recharge well, first-flush diverter, check dam, karez, uPVC). Keep numbers in Western digits.`;
  const out = await generate({ messages: [{ role: "system", content: system }, { role: "user", content: src }], maxTokens: 600, temperature: 0.2 });
  return { text: out.text.replace(/^["“”]+|["“”]+$/g, "") };
}
