// Training video library: categories and the starter catalogue.
// Starter videos are public films embedded from their original hosts (verified on TheWaterChannel).
// Videos uploaded through the admin page are stored in Cloudflare R2 and listed in catalog.json there.

export const VIDEO_CATEGORIES = [
  { key: "rooftop",    en: "Rooftop harvesting",          ur: "چھت سے بارانی پانی کا حصول" },
  { key: "recharge",   en: "Groundwater recharge",        ur: "زیرِ زمین پانی کی ری چارج" },
  { key: "quality",    en: "Water treatment and quality", ur: "پانی کی صفائی اور معیار" },
  { key: "supply",     en: "Water supply infrastructure", ur: "فراہمیِ آب کا نظام" },
  { key: "reuse",      en: "Wastewater and reuse",        ur: "استعمال شدہ پانی کا دوبارہ استعمال" },
  { key: "watershed",  en: "Traditional and watershed",   ur: "روایتی اور آبگیری نظام" },
  { key: "climate",    en: "Climate-resilient design",    ur: "موسمیاتی لحاظ سے پائیدار ڈیزائن" },
  { key: "maintenance",en: "Operation and maintenance",   ur: "دیکھ بھال اور مرمت" },
];

export const VIDEO_LANGS = { en: { en: "English", ur: "انگریزی" }, ur: { en: "Urdu", ur: "اردو" }, ar: { en: "Arabic", ur: "عربی" }, other: { en: "Other", ur: "دیگر" } };

export const MAX_UPLOAD_BYTES = 2 * 1024 ** 3; // 2 GB per video
export const VIDEO_TYPES = ["video/mp4", "video/webm", "video/quicktime"];

const twc = "TheWaterChannel";
export const SEED_VIDEOS = [
  {
    id: "seed-rooftop-rural", type: "youtube", ref: "vukZHS9xYtQ", category: "rooftop", lang: "en", subtitles: "en",
    title: { en: "Rooftop rainwater for rural drinking water", ur: "دیہی علاقوں میں پینے کے لیے چھت کا بارانی پانی" },
    desc: {
      en: "How a rooftop rainwater system gives rural households safe drinking water close to home, and where it fits alongside other sources.",
      ur: "چھت پر بارانی پانی جمع کرنے کا نظام دیہی گھرانوں کو گھر کے قریب پینے کا محفوظ پانی کیسے فراہم کرتا ہے، اور یہ دیگر ذرائع کے ساتھ کہاں موزوں ہے۔",
    },
    source: `Zenrainman · ${twc}`, sourceUrl: "https://thewaterchannel.tv/videos/rooftop-rainwater-for-rural-drinking-water/",
  },
  {
    id: "seed-recharge-well", type: "youtube", ref: "DBKctWEzy0c", category: "recharge", lang: "en",
    title: { en: "Constructing a recharge well", ur: "ری چارج کنویں کی تعمیر" },
    desc: {
      en: "Step-by-step construction of a well that sends rooftop rainwater into the ground: depth by soil type, keeping silt out of the pipe, and a load-bearing cover slab.",
      ur: "چھت کے بارانی پانی کو زمین میں اتارنے والے کنویں کی مرحلہ وار تعمیر: مٹی کی قسم کے مطابق گہرائی، پائپ میں مٹی جانے سے بچاؤ، اور مضبوط ڈھکن سلیب۔",
    },
    source: `Sekhar Raghavan, India Water Portal · ${twc}`, sourceUrl: "https://thewaterchannel.tv/videos/simple-steps-to-achieve-water-sufficiency-constructing-a-recharge-well/",
  },
  {
    id: "seed-recharge-pit", type: "youtube", ref: "5HrD5bAObRM", category: "recharge", lang: "en",
    title: { en: "Making a recharge pit", ur: "ری چارج گڑھا بنانے کا طریقہ" },
    desc: {
      en: "Building a pit at the lowest point of a plot to capture surface runoff, placing it near bores, and cleaning silt from the top after rains.",
      ur: "پلاٹ کے سب سے نچلے حصے میں سطحی بہاؤ روکنے کے لیے گڑھے کی تعمیر، بور کے قریب اس کا مقام، اور بارش کے بعد اوپر جمع مٹی کی صفائی۔",
    },
    source: `Zenrainman · ${twc}`, sourceUrl: "https://thewaterchannel.tv/videos/rainwater-harvesting-techniques-making-a-recharge-pit/",
  },
  {
    id: "seed-karez", type: "vimeo", ref: "174797328", category: "watershed", lang: "ur", subtitles: "en",
    title: { en: "Shells or pearls: restoring a karez in Balochistan", ur: "سیپ یا موتی: بلوچستان میں کاریز کی بحالی" },
    desc: {
      en: "IUCN Pakistan shows how a clogged karez in Qila Iskan Khan was cleaned and lined with perforated uPVC pipe, bringing back the village's water supply.",
      ur: "آئی یو سی این پاکستان کی یہ فلم دکھاتی ہے کہ قلعہ اسکان خان میں بند کاریز کو صاف کر کے سوراخ دار یو پی وی سی پائپ سے کیسے بحال کیا گیا، جس سے گاؤں کی آبی فراہمی واپس آئی۔",
    },
    source: `IUCN Pakistan · ${twc}`, sourceUrl: "https://thewaterchannel.tv/videos/shells-or-pearls/",
  },
  {
    id: "seed-check-dams", type: "vimeo", ref: "128985845", category: "watershed", lang: "ar",
    title: { en: "Check dams: slowing floods, recharging groundwater", ur: "چیک ڈیم: سیلابی ریلے کی رفتار کم کرنا اور زیرِ زمین پانی کی ری چارج" },
    desc: {
      en: "Good practice from Wadi Qaradha, Yemen: small check dams slow flash floods, protect farmland and raise the water table.",
      ur: "وادی قرضہ، یمن کی ایک مثال: چھوٹے چیک ڈیم سیلابی ریلوں کی رفتار کم کرتے، زرعی زمین کو بچاتے اور زیرِ زمین پانی کی سطح بلند کرتے ہیں۔",
    },
    source: `MetaMeta, Sana'a University WEC · ${twc}`, sourceUrl: "https://thewaterchannel.tv/videos/bani-hoshaish-good-practices-check-dams/",
  },
  {
    id: "seed-greywater", type: "vimeo", ref: "178466252", category: "reuse", lang: "ar", subtitles: "en",
    title: { en: "From waste to water: household greywater reuse", ur: "فضلے سے پانی تک: گھریلو استعمال شدہ پانی کا دوبارہ استعمال" },
    desc: {
      en: "A low-cost household system that treats water from sinks and showers for safe garden irrigation, as adopted in Palestine, Jordan and Lebanon.",
      ur: "سنک اور غسل خانے کے پانی کو باغبانی کے لیے محفوظ بنانے والا کم لاگت گھریلو نظام، جو فلسطین، اردن اور لبنان میں اپنایا گیا۔",
    },
    source: `IDRC · ${twc}`, sourceUrl: "https://thewaterchannel.tv/videos/from-waste-to-water-greywater-reuse-in-the-middle-east/",
  },
].map((v, i) => ({ ...v, published: true, order: i, createdAt: "2026-11-25T00:00:00Z" }));
