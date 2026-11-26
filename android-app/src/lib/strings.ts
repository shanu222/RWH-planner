// App-only text (English + Urdu). Anything not here falls back to the shared web/report text in shared/i18n.js.
import { t as sharedT } from "../shared/i18n.js";

export type Lang = "en" | "ur";

const EN = {
  // tabs
  tPlanner: "Planner", tCost: "Cost", tLearn: "Learn", tAssistant: "Assistant", tMore: "More",
  // onboarding
  obLangTitle: "Choose your language", obLangSub: "You can change it any time in Settings.",
  ob1Title: "Catch the rain on your roof", ob1Body: "Every millimetre of rain on one square metre of roof gives a litre of water. Plan a system that collects it, stores it and recharges the ground.",
  ob2Title: "Know the size, cost and payback", ob2Body: "Live results for your city's rainfall: how much you can harvest, the right tank, a full cost estimate at current rates and how fast it pays back.",
  ob3Title: "Where is your building?", ob3Body: "We use your city's long-term monthly rainfall. You can change the city later.",
  next: "Next", back: "Back", skip: "Skip", getStarted: "Get started",
  // common
  retry: "Try again", cancel: "Cancel", save: "Save", delete: "Delete", rename: "Rename", duplicate: "Duplicate", share: "Share", open: "Open", close: "Close", done: "Done", reset: "Reset",
  offline: "You are offline. Showing saved data; the planner still works with the published rates.",
  offlineShort: "Offline", lastUpdated: "Updated {t}", justNow: "just now",
  errTitle: "Something went wrong", errNet: "Could not reach the server. Check your connection and try again.",
  // planner
  plannerTitle: "Rainwater planner", plannerSub: "Results update as you change the inputs.",
  heroCollect: "Rainwater you can collect", perYear: "litres a year", heroTankers: "≈ {n} water tankers (1,000 gal)",
  kMet: "Demand met", kTank: "Tank", kPayback: "Payback", kSaving: "Saving / year", kCost: "System cost",
  roofSection: "Roof", rainSection: "Rainfall", useSection: "Water use", tankSection: "Storage tank",
  roofType: "Roof surface", customRoof: "Custom", areaLabel: "Roof area ({u})", storeysLabel: "Storeys",
  cityLabel: "City", annualRainShort: "{n} mm a year", editMonthly: "Edit monthly rainfall", hideMonthly: "Hide monthly rainfall",
  peopleLabel: "People in the household", lpcdLabel: "Litres per person per day",
  tankAuto: "Auto", recommendedShort: "Recommended", tankHint: "Recommended {v}: the largest size where each step up still pays for itself in saved water within 10 years.",
  reliability: "Reliability", reliabilityBody: "{p}% of the household's non-drinking demand is met from the tank in an average year.",
  waterSaved: "Water saved, month by month", collected: "Collected", demand: "Demand", used: "Used from tank",
  tankCurveTitle: "Reliability by tank size", wellTitle: "Recharge well", wellBody: "{n} {w} · {d} m wide · {depth} m deep. Takes {o} of overflow a year back into the ground.",
  saveDesign: "Save design", shareLink: "Share link", makeReport: "PDF report", resetInputs: "Reset inputs",
  savedToast: "Design saved to My designs.", sharedOpened: "Opened a shared design.", openShared: "Open the shared design?", openSharedBody: "This replaces the inputs in the planner. Your saved designs are not changed.",
  designNamePrompt: "Name this design", defaultDesignName: "{city} · {plot}",
  // cost
  costScreenTitle: "Cost estimate", costScreenSub: "Bill of quantities at current rates. Tap a rate to change it.",
  badgeLive: "Live", badgeAdmin: "Admin update", badgeSheet: "Rate sheet", badgePbs: "PBS {m}", badgeBundled: "Published rates", badgeOffline: "Offline · saved rates",
  srcLabel: "Source", asOfLabel: "As of {d}", editRate: "Rate (PKR)", rateEdited: "edited", liveTagPbs: "PBS live", liveTagSheet: "sheet", liveTagAdmin: "admin",
  qtyLine: "{q} {u} × {r}", contingencyLabel: "Contingency {p}%", resetRatesBtn: "Reset rates", ratesFrom: "Rates for {city}",
  // reports
  reportsTitle: "Reports", reportsSub: "PDF design reports saved on this phone.", newReport: "Create a report",
  reportEnglish: "English PDF", reportUrdu: "Urdu PDF", reportMaking: "Preparing your report…", reportSaved: "Report saved.",
  reportFail: "Could not create the report. Check your connection and try again.", noReports: "No reports yet", noReportsBody: "Create a PDF of your current design in English or Urdu.",
  // learn
  learnTitle: "Learn", segVideos: "Videos", segGuides: "Guides", segCalendar: "Calendar",
  searchVideos: "Search videos", allCats: "All", noVideos: "No videos match", noVideosBody: "Try another word or category.",
  videosOff: "Training videos are not available right now.", watchOn: "Watch on {s}", sourceBy: "Source: {s}",
  minutes: "{n} min", playerError: "This video could not be played.",
  guideWhen: "When to use it", guidePoints: "How to do it", guideCare: "Care and maintenance", relatedVideos: "Related videos",
  calTitle: "Seasonal maintenance", calSub: "Pakistan's monsoon runs July to September. Keep the system clean so the first rain is safe to store.",
  remindersTitle: "Maintenance reminders", remindersBody: "Get a notification at the start of each season with the tasks to do.",
  remindersOn: "Reminders are on", remindersOff: "Reminders are off", remindersDenied: "Notifications are blocked. Allow them in Android settings.",
  testReminder: "Send a test reminder", testSent: "A test reminder will arrive in a few seconds.",
  reminderTitle: "RWH maintenance: {when}",
  // assistant
  asTitle: "Design assistant", asSub: "Ask about your rainwater design. Answers use your current planner inputs.",
  reviewBtn: "Review my design", reviewing: "Reviewing your design…", reviewTitle: "AI design review",
  aiLabel: "AI-generated", typing: "Assistant is typing", newChat: "New chat",
  // more
  moreTitle: "More", myDesigns: "My designs", myDesignsSub: "Saved on this phone", reportsLink: "Reports", settingsLink: "Settings",
  shareApp: "Share the app", rateApp: "Rate the app", aboutLink: "About RWH Planner",
  noDesigns: "No saved designs", noDesignsBody: "Save a design from the planner to compare options later.",
  loadDesign: "Load", designLoaded: "Design loaded in the planner.", confirmDelete: "Delete “{n}”?", confirmDeleteBody: "This cannot be undone.",
  copySuffix: "copy",
  // settings
  settingsTitle: "Settings", sLanguage: "Language", sUnits: "Units", sArea: "Area", sVolume: "Volume", litresU: "Litres", gallonsU: "Gallons",
  sTheme: "Theme", themeSystem: "System", themeLight: "Light", themeDark: "Dark",
  sData: "Data", clearCache: "Clear cache", clearCacheBody: "Removes saved rates, videos list and thumbnails. Your designs and reports are kept.", cacheCleared: "Cache cleared.",
  sAds: "Ads", adPrivacy: "Ad privacy choices", removeAds: "Remove ads", removeAdsBody: "An ad-free option is planned. Ads keep the app free.",
  sAbout: "About", privacy: "Privacy policy", terms: "Terms of use", contact: "Contact us", version: "Version {v} ({c})",
  langRestart: "The app restarts to switch the layout direction.",
  // update / announcement
  updateTitle: "Please update RWH Planner", updateBody: "This version is no longer supported. Update to keep using the planner with the latest rates.", updateBtn: "Update on Google Play",
  updateAvailable: "A new version is available.", updateNow: "Update",
  dismiss: "Dismiss", learnMore: "Learn more",
};

const UR: Partial<Record<keyof typeof EN, string>> = {
  tPlanner: "پلانر", tCost: "لاگت", tLearn: "سیکھیں", tAssistant: "معاون", tMore: "مزید",
  obLangTitle: "اپنی زبان منتخب کریں", obLangSub: "آپ اسے کسی بھی وقت ترتیبات میں تبدیل کر سکتے ہیں۔",
  ob1Title: "اپنی چھت پر برسنے والی بارش محفوظ کریں", ob1Body: "ایک مربع میٹر چھت پر ایک ملی میٹر بارش سے ایک لیٹر پانی حاصل ہوتا ہے۔ ایسا نظام بنائیں جو یہ پانی جمع کرے، ذخیرہ کرے اور زیرِ زمین پانی کو بحال کرے۔",
  ob2Title: "سائز، لاگت اور واپسی کی مدت جانیں", ob2Body: "آپ کے شہر کی بارش کے مطابق فوری نتائج: کتنا پانی جمع ہو سکتا ہے، موزوں ٹینک، موجودہ نرخوں پر مکمل لاگت کا تخمینہ اور لاگت کی واپسی کی مدت۔",
  ob3Title: "آپ کی عمارت کس شہر میں ہے؟", ob3Body: "ہم آپ کے شہر کی طویل مدتی ماہانہ بارش استعمال کرتے ہیں۔ شہر بعد میں بھی تبدیل کیا جا سکتا ہے۔",
  next: "آگے", back: "پیچھے", skip: "چھوڑیں", getStarted: "شروع کریں",
  retry: "دوبارہ کوشش کریں", cancel: "منسوخ", save: "محفوظ کریں", delete: "حذف کریں", rename: "نام تبدیل کریں", duplicate: "نقل بنائیں", share: "شیئر کریں", open: "کھولیں", close: "بند کریں", done: "ٹھیک ہے", reset: "دوبارہ ترتیب دیں",
  offline: "آپ آف لائن ہیں۔ محفوظ شدہ معلومات دکھائی جا رہی ہیں؛ پلانر شائع شدہ نرخوں کے ساتھ بدستور کام کرتا ہے۔",
  offlineShort: "آف لائن", lastUpdated: "اپ ڈیٹ: {t}", justNow: "ابھی",
  errTitle: "کوئی خرابی پیش آ گئی", errNet: "سرور سے رابطہ نہیں ہو سکا۔ انٹرنیٹ کنکشن چیک کر کے دوبارہ کوشش کریں۔",
  plannerTitle: "بارانی پانی پلانر", plannerSub: "اندراجات تبدیل کرنے پر نتائج ساتھ ساتھ اپ ڈیٹ ہوتے ہیں۔",
  heroCollect: "جمع ہونے والا بارانی پانی", perYear: "لیٹر سالانہ", heroTankers: "≈ {n} واٹر ٹینکر (1,000 گیلن)",
  kMet: "ضرورت کی تکمیل", kTank: "ٹینک", kPayback: "لاگت کی واپسی", kSaving: "سالانہ بچت", kCost: "نظام کی لاگت",
  roofSection: "چھت", rainSection: "بارش", useSection: "پانی کا استعمال", tankSection: "ذخیرے کا ٹینک",
  roofType: "چھت کی سطح", customRoof: "اپنی مرضی", areaLabel: "چھت کا رقبہ ({u})", storeysLabel: "منزلیں",
  cityLabel: "شہر", annualRainShort: "{n} ملی میٹر سالانہ", editMonthly: "ماہانہ بارش میں ترمیم کریں", hideMonthly: "ماہانہ بارش چھپائیں",
  peopleLabel: "گھر کے افراد", lpcdLabel: "فی کس یومیہ لیٹر",
  tankAuto: "خودکار", recommendedShort: "تجویز کردہ", tankHint: "تجویز کردہ {v}: وہ سب سے بڑا سائز جس میں ہر اگلا سائز دس سال کے اندر بچائے گئے پانی سے اپنی لاگت پوری کر لیتا ہے۔",
  reliability: "اعتماد", reliabilityBody: "ایک اوسط سال میں گھر کی پینے کے علاوہ ضرورت کا {p} فیصد ٹینک سے پورا ہوتا ہے۔",
  waterSaved: "ماہانہ بچایا گیا پانی", collected: "جمع شدہ", demand: "ضرورت", used: "ٹینک سے استعمال",
  tankCurveTitle: "ٹینک کے سائز کے لحاظ سے اعتماد", wellTitle: "ری چارج کنواں", wellBody: "{n} {w} · قطر {d} میٹر · گہرائی {depth} میٹر۔ سالانہ {o} زائد پانی زمین میں واپس جاتا ہے۔",
  saveDesign: "ڈیزائن محفوظ کریں", shareLink: "لنک شیئر کریں", makeReport: "پی ڈی ایف رپورٹ", resetInputs: "اندراجات دوبارہ ترتیب دیں",
  savedToast: "ڈیزائن 'میرے ڈیزائن' میں محفوظ ہو گیا۔", sharedOpened: "شیئر کیا گیا ڈیزائن کھول دیا گیا۔", openShared: "شیئر کیا گیا ڈیزائن کھولیں؟", openSharedBody: "اس سے پلانر کے موجودہ اندراجات تبدیل ہو جائیں گے۔ آپ کے محفوظ ڈیزائن متاثر نہیں ہوں گے۔",
  designNamePrompt: "اس ڈیزائن کا نام رکھیں", defaultDesignName: "{city} · {plot}",
  costScreenTitle: "لاگت کا تخمینہ", costScreenSub: "موجودہ نرخوں پر مقدار اور لاگت کا گوشوارہ۔ نرخ تبدیل کرنے کے لیے اس پر ٹیپ کریں۔",
  badgeLive: "تازہ", badgeAdmin: "ایڈمن اپ ڈیٹ", badgeSheet: "ریٹ شیٹ", badgePbs: "پی بی ایس {m}", badgeBundled: "شائع شدہ نرخ", badgeOffline: "آف لائن · محفوظ نرخ",
  srcLabel: "ماخذ", asOfLabel: "بتاریخ {d}", editRate: "نرخ (روپے)", rateEdited: "ترمیم شدہ", liveTagPbs: "پی بی ایس", liveTagSheet: "شیٹ", liveTagAdmin: "ایڈمن",
  qtyLine: "{q} {u} × {r}", contingencyLabel: "ہنگامی اخراجات {p} فیصد", resetRatesBtn: "نرخ بحال کریں", ratesFrom: "{city} کے نرخ",
  reportsTitle: "رپورٹیں", reportsSub: "اس فون پر محفوظ پی ڈی ایف ڈیزائن رپورٹیں۔", newReport: "رپورٹ بنائیں",
  reportEnglish: "انگریزی پی ڈی ایف", reportUrdu: "اردو پی ڈی ایف", reportMaking: "رپورٹ تیار کی جا رہی ہے…", reportSaved: "رپورٹ محفوظ ہو گئی۔",
  reportFail: "رپورٹ تیار نہیں ہو سکی۔ انٹرنیٹ کنکشن چیک کر کے دوبارہ کوشش کریں۔", noReports: "ابھی کوئی رپورٹ نہیں", noReportsBody: "اپنے موجودہ ڈیزائن کی پی ڈی ایف انگریزی یا اردو میں بنائیں۔",
  learnTitle: "سیکھیں", segVideos: "ویڈیوز", segGuides: "رہنما", segCalendar: "کیلنڈر",
  searchVideos: "ویڈیوز تلاش کریں", allCats: "تمام", noVideos: "کوئی ویڈیو نہیں ملی", noVideosBody: "کوئی اور لفظ یا زمرہ آزمائیں۔",
  videosOff: "تربیتی ویڈیوز اس وقت دستیاب نہیں۔", watchOn: "{s} پر دیکھیں", sourceBy: "ماخذ: {s}",
  minutes: "{n} منٹ", playerError: "یہ ویڈیو نہیں چل سکی۔",
  guideWhen: "کب استعمال کریں", guidePoints: "طریقہ کار", guideCare: "دیکھ بھال", relatedVideos: "متعلقہ ویڈیوز",
  calTitle: "موسمی دیکھ بھال", calSub: "پاکستان میں مون سون جولائی سے ستمبر تک رہتا ہے۔ نظام صاف رکھیں تاکہ پہلی بارش کا پانی محفوظ طریقے سے ذخیرہ ہو۔",
  remindersTitle: "دیکھ بھال کی یاد دہانیاں", remindersBody: "ہر موسم کے آغاز پر ضروری کاموں کی اطلاع حاصل کریں۔",
  remindersOn: "یاد دہانیاں فعال ہیں", remindersOff: "یاد دہانیاں بند ہیں", remindersDenied: "اطلاعات بند ہیں۔ انہیں اینڈرائیڈ کی ترتیبات میں اجازت دیں۔",
  testReminder: "آزمائشی یاد دہانی بھیجیں", testSent: "آزمائشی یاد دہانی چند سیکنڈ میں موصول ہوگی۔",
  reminderTitle: "دیکھ بھال: {when}",
  asTitle: "ڈیزائن معاون", asSub: "اپنے بارانی پانی کے ڈیزائن کے بارے میں سوال کریں۔ جوابات آپ کے موجودہ اندراجات پر مبنی ہوتے ہیں۔",
  reviewBtn: "میرے ڈیزائن کا جائزہ لیں", reviewing: "آپ کے ڈیزائن کا جائزہ لیا جا رہا ہے…", reviewTitle: "اے آئی ڈیزائن جائزہ",
  aiLabel: "اے آئی سے تیار کردہ", typing: "معاون جواب لکھ رہا ہے", newChat: "نئی گفتگو",
  moreTitle: "مزید", myDesigns: "میرے ڈیزائن", myDesignsSub: "اس فون پر محفوظ", reportsLink: "رپورٹیں", settingsLink: "ترتیبات",
  shareApp: "ایپ شیئر کریں", rateApp: "ایپ کی درجہ بندی کریں", aboutLink: "آر ڈبلیو ایچ پلانر کے بارے میں",
  noDesigns: "کوئی محفوظ ڈیزائن نہیں", noDesignsBody: "مختلف آپشنز کا موازنہ کرنے کے لیے پلانر سے ڈیزائن محفوظ کریں۔",
  loadDesign: "کھولیں", designLoaded: "ڈیزائن پلانر میں کھول دیا گیا۔", confirmDelete: "“{n}” حذف کریں؟", confirmDeleteBody: "یہ عمل واپس نہیں ہو سکتا۔",
  copySuffix: "نقل",
  settingsTitle: "ترتیبات", sLanguage: "زبان", sUnits: "اکائیاں", sArea: "رقبہ", sVolume: "حجم", litresU: "لیٹر", gallonsU: "گیلن",
  sTheme: "تھیم", themeSystem: "سسٹم", themeLight: "روشن", themeDark: "تاریک",
  sData: "ڈیٹا", clearCache: "کیش صاف کریں", clearCacheBody: "محفوظ نرخ، ویڈیوز کی فہرست اور تصاویر حذف ہو جائیں گی۔ آپ کے ڈیزائن اور رپورٹیں محفوظ رہیں گی۔", cacheCleared: "کیش صاف ہو گیا۔",
  sAds: "اشتہارات", adPrivacy: "اشتہارات سے متعلق رازداری کے انتخاب", removeAds: "اشتہارات ہٹائیں", removeAdsBody: "اشتہارات کے بغیر ورژن زیرِ غور ہے۔ اشتہارات کی بدولت ایپ مفت ہے۔",
  sAbout: "تعارف", privacy: "رازداری کی پالیسی", terms: "استعمال کی شرائط", contact: "رابطہ کریں", version: "ورژن {v} ({c})",
  langRestart: "سمتِ تحریر تبدیل کرنے کے لیے ایپ دوبارہ شروع ہوگی۔",
  updateTitle: "براہِ کرم آر ڈبلیو ایچ پلانر اپ ڈیٹ کریں", updateBody: "یہ ورژن اب معاون نہیں۔ تازہ ترین نرخوں کے ساتھ پلانر استعمال کرنے کے لیے ایپ اپ ڈیٹ کریں۔", updateBtn: "گوگل پلے پر اپ ڈیٹ کریں",
  updateAvailable: "نیا ورژن دستیاب ہے۔", updateNow: "اپ ڈیٹ",
  dismiss: "بند کریں", learnMore: "مزید جانیں",
};

export type Key = keyof typeof EN | string;

export function tr(lang: Lang, key: Key, vars: Record<string, string | number> = {}): string {
  const own = (lang === "ur" ? (UR as Record<string, string>)[key] : undefined) ?? (EN as Record<string, string>)[key];
  if (own == null) return sharedT(lang, key, vars);
  return own.replace(/\{(\w+)\}/g, (_, k) => (vars[k] != null ? String(vars[k]) : `{${k}}`));
}
