// Composes Play Store graphics from REAL app screenshots (captured from the emulator with scripts/capture.sh):
//   store-listing/raw/<set>/NN.png  ->  store-listing/graphics/<set>/NN.png (device frame + caption)
// plus the 1024x500 feature graphic. Rendered with headless Chromium/Edge so Urdu (Nastaliq) is shaped correctly.
// Usage: node scripts/store-graphics.mjs   (set CHROME=path to chrome/msedge if not the default Edge path)
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { createRequire } from "node:module";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
// puppeteer-core is already a dependency of the backend (PDF reports); reuse it instead of adding it here
const puppeteer = createRequire(path.join(ROOT, "../backend/package.json"))("puppeteer-core");
const RAW = path.join(ROOT, "store-listing/raw"), OUT = path.join(ROOT, "store-listing/graphics");
const CHROME = process.env.CHROME || "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe";
const font = p => pathToFileURL(path.join(ROOT, "node_modules/@expo-google-fonts", p)).href;
const CSS_FONTS = `
@font-face { font-family: Inter; font-weight: 400; src: url(${font("inter/400Regular/Inter_400Regular.ttf")}); }
@font-face { font-family: Inter; font-weight: 600; src: url(${font("inter/600SemiBold/Inter_600SemiBold.ttf")}); }
@font-face { font-family: Inter; font-weight: 800; src: url(${font("inter/700Bold/Inter_700Bold.ttf")}); }
@font-face { font-family: Nastaliq; font-weight: 400; src: url(${font("noto-nastaliq-urdu/500Medium/NotoNastaliqUrdu_500Medium.ttf")}); }
@font-face { font-family: Nastaliq; font-weight: 700; src: url(${font("noto-nastaliq-urdu/700Bold/NotoNastaliqUrdu_700Bold.ttf")}); }`;

export const CAPTIONS = {
  en: [
    ["Know how much rain your roof can collect", "Live results for your city"],
    ["Plan by plot, roof and household", "Marla, kanal or exact roof area"],
    ["Find the right tank size", "Reliability and payback for every size"],
    ["Cost estimate at live PBS rates", "Every rate with its source and date"],
    ["PDF reports in English and Urdu", "Save and share on WhatsApp or email"],
    ["Learn from training videos", "Rooftop harvesting, recharge wells and more"],
    ["Monsoon maintenance made easy", "Seasonal calendar with reminders"],
    ["Ask the AI design assistant", "Clear, labelled AI guidance"],
  ],
  ur: [
    ["جانیں آپ کی چھت کتنا پانی جمع کر سکتی ہے", "آپ کے شہر کے لیے فوری نتائج"],
    ["پلاٹ، چھت اور گھر کے مطابق منصوبہ", "مرلہ، کنال یا چھت کا اصل رقبہ"],
    ["ٹینک کا موزوں سائز معلوم کریں", "ہر سائز کے لیے اعتماد اور لاگت کی واپسی"],
    ["پی بی ایس کے تازہ نرخوں پر لاگت", "ہر نرخ کا ماخذ اور تاریخ"],
    ["اردو اور انگریزی میں پی ڈی ایف رپورٹ", "واٹس ایپ یا ای میل پر شیئر کریں"],
    ["تربیتی ویڈیوز سے سیکھیں", "چھت کا پانی، ری چارج کنویں اور بہت کچھ"],
    ["مون سون کی آسان دیکھ بھال", "یاد دہانیوں کے ساتھ موسمی کیلنڈر"],
    ["اے آئی ڈیزائن معاون سے پوچھیں", "واضح اور نشان زد اے آئی رہنمائی"],
  ],
  tablet: [
    ["Plan, price and report on one screen", "Two-pane layout for tablets"],
    ["Cost estimate at live PBS rates", "Every rate with its source and date"],
    ["Training videos for every step", "Rooftop harvesting, recharge wells and more"],
    ["Monsoon maintenance made easy", "Seasonal calendar with reminders"],
  ],
};

const bg = `background: radial-gradient(1200px 700px at 85% -10%, rgba(79,214,220,.35), transparent 60%), linear-gradient(165deg, #0E6B76 0%, #0B5C66 45%, #063840 100%);`;
const drops = `<svg style="position:absolute;inset:0;opacity:.07" width="100%" height="100%"><defs><pattern id="p" width="90" height="120" patternUnits="userSpaceOnUse"><path d="M30 20c-9 12-16 21-16 29a16 16 0 0 0 32 0c0-8-7-17-16-29z" fill="#fff"/></pattern></defs><rect width="100%" height="100%" fill="url(#p)"/></svg>`;

function phoneHTML(img, [title, sub], lang) {
  const ur = lang === "ur";
  return `<!doctype html><html><head><meta charset="utf-8"><style>${CSS_FONTS}
  html,body{margin:0;width:1080px;height:1920px;overflow:hidden}
  body{${bg}position:relative;font-family:${ur ? "Nastaliq" : "Inter"};color:#fff}
  .cap{position:absolute;top:${ur ? 70 : 96}px;left:70px;right:70px;text-align:center}
  h1{margin:0;font-weight:${ur ? 700 : 800};font-size:${ur ? 52 : 74}px;line-height:${ur ? 1.8 : 1.12};letter-spacing:${ur ? 0 : -1.5}px}
  p{margin:${ur ? 0 : 18}px 0 0;font-size:${ur ? 34 : 36}px;line-height:${ur ? 2 : 1.3};color:#C4ECEE;font-weight:400}
  .dev{position:absolute;left:50%;bottom:-120px;transform:translateX(-50%);width:760px;height:1600px;border-radius:84px;background:#0b1214;padding:20px;box-sizing:border-box;
       box-shadow:0 40px 90px rgba(0,0,0,.45), inset 0 0 0 3px #2a3b40}
  .dev img{width:100%;height:auto;border-radius:66px;display:block}
  .cam{position:absolute;top:44px;left:50%;width:22px;height:22px;margin-left:-11px;border-radius:50%;background:#000;box-shadow:0 0 0 3px #1c2a2e}
  </style></head><body>${drops}<div class="cap" dir="${ur ? "rtl" : "ltr"}" lang="${ur ? "ur" : "en"}"><h1>${title}</h1><p>${sub}</p></div><div class="dev"><img src="${img}"><div class="cam"></div></div></body></html>`;
}

function tabletHTML(img, [title, sub], W, H) {
  return `<!doctype html><html><head><meta charset="utf-8"><style>${CSS_FONTS}
  html,body{margin:0;width:${W}px;height:${H}px;overflow:hidden}
  body{${bg}position:relative;font-family:Inter;color:#fff}
  .cap{position:absolute;top:${H * 0.06}px;left:0;right:0;text-align:center}
  h1{margin:0;font-weight:800;font-size:${H * 0.058}px;letter-spacing:-1px}
  p{margin:${H * 0.012}px 0 0;font-size:${H * 0.028}px;color:#C4ECEE}
  .dev{position:absolute;left:50%;top:${H * 0.24}px;transform:translateX(-50%);width:${W * 0.78}px;border-radius:${H * 0.045}px;background:#0b1214;padding:${H * 0.018}px;box-sizing:border-box;box-shadow:0 30px 80px rgba(0,0,0,.45), inset 0 0 0 3px #2a3b40}
  .dev img{width:100%;display:block;border-radius:${H * 0.028}px}
  </style></head><body>${drops}<div class="cap"><h1>${title}</h1><p>${sub}</p></div><div class="dev"><img src="${img}"></div></body></html>`;
}

function featureHTML(icon, shot) {
  return `<!doctype html><html><head><meta charset="utf-8"><style>${CSS_FONTS}
  html,body{margin:0;width:1024px;height:500px;overflow:hidden}
  body{${bg}position:relative;font-family:Inter;color:#fff}
  .l{position:absolute;left:64px;top:96px;width:560px}
  .mark{width:92px;height:92px;border-radius:22px;box-shadow:0 10px 30px rgba(0,0,0,.3)}
  h1{font-size:52px;line-height:1.08;margin:26px 0 10px;font-weight:800;letter-spacing:-1px}
  p{font-size:23px;margin:0;color:#C4ECEE;line-height:1.35}
  .ur{font-family:Nastaliq;font-size:24px;margin-top:6px;direction:rtl;text-align:left;color:#fff}
  .ph{position:absolute;right:56px;top:46px;width:300px;border-radius:38px;background:#0b1214;padding:10px;transform:rotate(6deg);box-shadow:0 30px 60px rgba(0,0,0,.45), inset 0 0 0 2px #2a3b40}
  .ph img{width:100%;border-radius:30px;display:block}
  </style></head><body>${drops}<div class="l"><img class="mark" src="${icon}"><h1>RWH Planner</h1><p>Rooftop rainwater harvesting for Pakistan: tank size, cost and payback.</p><div class="ur">بارانی پانی پلانر</div></div>
  <div class="ph"><img src="${shot}"></div></body></html>`;
}

async function shoot(browser, html, W, H, out) {
  const page = await browser.newPage();
  await page.setViewport({ width: W, height: H, deviceScaleFactor: 1 });
  const tmp = path.join(ROOT, "store-listing/.tmp.html");
  fs.writeFileSync(tmp, html);
  await page.goto(pathToFileURL(tmp).href, { waitUntil: "load" });
  await page.evaluate(() => document.fonts.ready);
  fs.mkdirSync(path.dirname(out), { recursive: true });
  await page.screenshot({ path: out, type: "png", clip: { x: 0, y: 0, width: W, height: H } });
  await page.close();
  fs.unlinkSync(tmp);
  console.log("wrote", path.relative(ROOT, out));
}

const list = dir => (fs.existsSync(dir) ? fs.readdirSync(dir).filter(f => f.endsWith(".png")).sort() : []);
const url = p => pathToFileURL(p).href;

const browser = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ["--allow-file-access-from-files", "--force-color-profile=srgb"] });
try {
  for (const lang of ["en", "ur"]) {
    const files = list(path.join(RAW, `phone-${lang}`));
    for (let i = 0; i < files.length; i++) {
      await shoot(browser, phoneHTML(url(path.join(RAW, `phone-${lang}`, files[i])), CAPTIONS[lang][i] || ["", ""], lang), 1080, 1920, path.join(OUT, `phone-${lang}`, files[i]));
    }
  }
  for (const [set, W, H] of [["tablet-7", 1920, 1080], ["tablet-10", 2560, 1440]]) {
    const files = list(path.join(RAW, set));
    for (let i = 0; i < files.length; i++) await shoot(browser, tabletHTML(url(path.join(RAW, set, files[i])), CAPTIONS.tablet[i] || ["", ""], W, H), W, H, path.join(OUT, set, files[i]));
  }
  const first = list(path.join(RAW, "phone-en"))[0];
  if (first) await shoot(browser, featureHTML(url(path.join(ROOT, "assets/icon.png")), url(path.join(RAW, "phone-en", first))), 1024, 500, path.join(OUT, "feature-graphic.png"));
} finally {
  await browser.close();
}
