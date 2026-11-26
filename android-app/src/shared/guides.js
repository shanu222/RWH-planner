// Technique guides (English + Urdu). Each guide links to a video category.
// Content follows common practice in PCRWR / UN-Habitat Pakistan rainwater harvesting guidance;
// it is general guidance, not a substitute for a site-specific design.

export const GUIDES = [
  {
    key: "rooftop", video: "rooftop", theme: 1,
    title: { en: "Rooftop rainwater harvesting", ur: "چھت سے بارانی پانی کا حصول" },
    summary: {
      en: "Rain falling on a roof is led through gutters and downpipes, filtered, and stored in a tank for household use.",
      ur: "چھت پر گرنے والی بارش کو پرنالوں اور ڈاؤن پائپ کے ذریعے جمع کر کے، فلٹر کرنے کے بعد گھریلو استعمال کے لیے ٹینک میں ذخیرہ کیا جاتا ہے۔",
    },
    when: {
      en: "Any building with a clean, hard roof (RCC, metal sheet or tiles). Most useful where supply is short or tanker water is bought.",
      ur: "صاف اور پختہ چھت (آر سی سی، دھاتی چادر یا ٹائل) والی ہر عمارت۔ وہاں سب سے زیادہ مفید جہاں پانی کی قلت ہو یا ٹینکر خریدا جاتا ہو۔",
    },
    points: {
      en: [
        "Slope the roof towards the outlets and keep it free of debris, bird droppings and stored materials.",
        "Use 4\" (110 mm) uPVC downpipes; plan one outlet for about every 1,000 sq ft of roof.",
        "Fit a first-flush diverter and a mesh screen before the tank.",
        "Size the tank with the planner: a larger tank is worth it only if the extra water repays its cost.",
      ],
      ur: [
        "چھت کی ڈھلوان نکاسی کے مقامات کی جانب رکھیں اور اسے کچرے، پرندوں کی بیٹ اور سامان سے پاک رکھیں۔",
        "4 انچ (110 ملی میٹر) یو پی وی سی ڈاؤن پائپ استعمال کریں؛ تقریباً ہر 1,000 مربع فٹ چھت کے لیے ایک نکاسی رکھیں۔",
        "ٹینک سے پہلے فرسٹ فلش ڈائیورٹر اور جالی دار فلٹر نصب کریں۔",
        "ٹینک کا سائز پلانر سے طے کریں: بڑا ٹینک اسی صورت میں موزوں ہے جب اضافی پانی اس کی لاگت پوری کر دے۔",
      ],
    },
    care: {
      en: ["Clean the roof and gutters before the monsoon.", "Check joints and downpipe clamps for leaks after heavy rain."],
      ur: ["مون سون سے پہلے چھت اور پرنالے صاف کریں۔", "تیز بارش کے بعد جوڑوں اور پائپ کے کلیمپ میں رساؤ چیک کریں۔"],
    },
  },
  {
    key: "firstflush", video: "rooftop", theme: 2,
    title: { en: "First flush and filtration", ur: "فرسٹ فلش اور فلٹریشن" },
    summary: {
      en: "The first rain of each storm washes dust and droppings off the roof. A first-flush diverter sends this dirty water away before the rest reaches the tank.",
      ur: "ہر بارش کا ابتدائی پانی چھت سے گرد اور بیٹ بہا لاتا ہے۔ فرسٹ فلش ڈائیورٹر اس گندے پانی کو الگ کر دیتا ہے تاکہ باقی صاف پانی ٹینک تک پہنچے۔",
    },
    when: { en: "Every rooftop system, especially where water is stored for domestic use.", ur: "ہر چھت والے نظام میں، خصوصاً جہاں پانی گھریلو استعمال کے لیے ذخیرہ کیا جائے۔" },
    points: {
      en: [
        "Divert roughly 1 litre for every square metre of roof at the start of each rain.",
        "Add a removable mesh screen (leaf filter) at the gutter or tank inlet.",
        "For recharge, pass water through a desilting chamber or gravel-and-sand filter first.",
      ],
      ur: [
        "ہر بارش کے آغاز میں چھت کے ہر مربع میٹر کے لیے تقریباً 1 لیٹر پانی الگ کریں۔",
        "پرنالے یا ٹینک کے داخلی مقام پر قابلِ صفائی جالی (پتوں کا فلٹر) لگائیں۔",
        "ری چارج کے لیے پانی کو پہلے ڈی سلٹنگ چیمبر یا بجری اور ریت کے فلٹر سے گزاریں۔",
      ],
    },
    care: {
      en: ["Empty the diverter after every rain so it resets.", "Wash or replace filter media before each monsoon."],
      ur: ["ہر بارش کے بعد ڈائیورٹر خالی کریں تاکہ وہ دوبارہ کام کے لیے تیار ہو۔", "ہر مون سون سے پہلے فلٹر کا مواد دھوئیں یا تبدیل کریں۔"],
    },
  },
  {
    key: "storage", video: "quality", theme: 2,
    title: { en: "Safe storage and water quality", ur: "محفوظ ذخیرہ اور پانی کا معیار" },
    summary: {
      en: "Harvested rainwater is usually clean enough for washing, cleaning and gardening. For drinking it must be treated and tested.",
      ur: "جمع شدہ بارانی پانی عموماً دھونے، صفائی اور باغبانی کے لیے موزوں ہوتا ہے۔ پینے کے لیے اسے صاف کرنا اور ٹیسٹ کروانا ضروری ہے۔",
    },
    when: { en: "Wherever harvested water is stored for more than a few days.", ur: "جہاں جمع شدہ پانی چند دن سے زیادہ ذخیرہ کیا جائے۔" },
    points: {
      en: [
        "Use an opaque, food-grade tank with a tight lid to stop algae and mosquitoes.",
        "Cover the overflow and vent with fine mesh.",
        "Draw water from just above the tank floor, not from the bottom sludge.",
        "Before drinking, boil or disinfect the water and have a sample tested at a PCRWR laboratory.",
      ],
      ur: [
        "کائی اور مچھروں سے بچاؤ کے لیے غیر شفاف، فوڈ گریڈ ٹینک اور مضبوط ڈھکن استعمال کریں۔",
        "اوور فلو اور ہوا کے سوراخ پر باریک جالی لگائیں۔",
        "پانی ٹینک کی تہہ سے ذرا اوپر سے نکالیں، نیچے جمی مٹی سے نہیں۔",
        "پینے سے پہلے پانی اُبالیں یا جراثیم سے پاک کریں اور اس کا نمونہ پی سی آر ڈبلیو آر کی لیبارٹری سے ٹیسٹ کروائیں۔",
      ],
    },
    care: {
      en: ["Clean and disinfect the tank once a year, ideally before the monsoon.", "Test drinking water at least once a year."],
      ur: ["ٹینک کو سال میں ایک بار، بہتر ہے مون سون سے پہلے، صاف اور جراثیم سے پاک کریں۔", "پینے کے پانی کا سال میں کم از کم ایک بار ٹیسٹ کروائیں۔"],
    },
  },
  {
    key: "rechargeWell", video: "recharge", theme: 1,
    title: { en: "Recharge well", ur: "ری چارج کنواں" },
    summary: {
      en: "Overflow from the tank is sent into a lined well filled with graded stone so that it soaks into the ground and raises the water table.",
      ur: "ٹینک سے زائد پانی کو ایک کنویں میں بھیجا جاتا ہے جو درجہ وار پتھر سے بھرا ہوتا ہے، تاکہ پانی زمین میں جذب ہو کر زیرِ زمین سطحِ آب بلند کرے۔",
    },
    when: {
      en: "Areas with falling groundwater and permeable soil, such as Islamabad, Rawalpindi and Lahore. Not where the water table is within about 3 m of the surface.",
      ur: "وہ علاقے جہاں زیرِ زمین پانی کی سطح گر رہی ہو اور مٹی پانی جذب کرنے والی ہو، جیسے اسلام آباد، راولپنڈی اور لاہور۔ جہاں سطحِ آب زمین سے تقریباً 3 میٹر کے اندر ہو وہاں نہیں۔",
    },
    points: {
      en: [
        "Only roof water and clean runoff. Never connect sewage, kitchen drains or paved areas with oil.",
        "Keep the well at least 3 m from foundations and well away from septic tanks and soak pits (15 m or more).",
        "Fill with boulders, then gravel, with a sand layer on top; put a desilting chamber before the well.",
        "Cover with a strong RCC slab; the planner sizes the well from the design storm.",
      ],
      ur: [
        "صرف چھت کا پانی اور صاف سطحی بہاؤ۔ سیوریج، کچن کی نالی یا تیل والی پختہ سطحوں کا پانی کبھی نہ ملائیں۔",
        "کنواں بنیادوں سے کم از کم 3 میٹر اور سیپٹک ٹینک یا سوک پٹ سے کافی فاصلے (15 میٹر یا زیادہ) پر رکھیں۔",
        "پہلے بڑے پتھر، پھر بجری اور اوپر ریت کی تہہ ڈالیں؛ کنویں سے پہلے ڈی سلٹنگ چیمبر بنائیں۔",
        "اوپر مضبوط آر سی سی سلیب رکھیں؛ پلانر ڈیزائن بارش کے مطابق کنویں کا سائز بتاتا ہے۔",
      ],
    },
    care: {
      en: ["Remove silt from the chamber and the top sand layer before and after the monsoon.", "If water stands for more than a day, wash or replace the sand layer."],
      ur: ["مون سون سے پہلے اور بعد میں چیمبر اور اوپر کی ریت سے مٹی نکالیں۔", "اگر پانی ایک دن سے زیادہ کھڑا رہے تو ریت کی تہہ دھوئیں یا تبدیل کریں۔"],
    },
  },
  {
    key: "rechargePit", video: "recharge", theme: 1,
    title: { en: "Recharge pits and trenches", ur: "ری چارج گڑھے اور خندقیں" },
    summary: {
      en: "Shallow pits or long trenches filled with stone collect runoff from lawns, streets and open plots and let it soak in.",
      ur: "پتھر سے بھرے کم گہرے گڑھے یا لمبی خندقیں لان، گلیوں اور کھلے پلاٹوں کا بہتا پانی جمع کر کے زمین میں جذب ہونے دیتی ہیں۔",
    },
    when: {
      en: "Open plots, parks, school grounds and roadside verges with sandy or loamy soil. Trenches suit long boundaries.",
      ur: "ریتلی یا بھربھری مٹی والے کھلے پلاٹ، پارک، اسکول کے میدان اور سڑک کے کنارے۔ لمبی حدود کے لیے خندق موزوں ہے۔",
    },
    points: {
      en: [
        "Place pits at the lowest point where water already collects.",
        "Typical pit: 1–2 m wide and 2–3 m deep; trench: 0.5–1 m wide and 1–1.5 m deep.",
        "Fill with boulders and gravel, with a coarse sand layer on top.",
      ],
      ur: [
        "گڑھا اس نچلے مقام پر بنائیں جہاں پانی پہلے ہی جمع ہوتا ہو۔",
        "عام گڑھا: 1 سے 2 میٹر چوڑا اور 2 سے 3 میٹر گہرا؛ خندق: 0.5 سے 1 میٹر چوڑی اور 1 سے 1.5 میٹر گہری۔",
        "بڑے پتھر اور بجری سے بھریں اور اوپر موٹی ریت کی تہہ ڈالیں۔",
      ],
    },
    care: {
      en: ["Clear silt and leaves from the top after each heavy rain.", "Keep vehicles off unlined trenches."],
      ur: ["ہر تیز بارش کے بعد اوپر سے مٹی اور پتے صاف کریں۔", "کچی خندقوں پر گاڑیاں نہ چلنے دیں۔"],
    },
  },
  {
    key: "paving", video: "climate", theme: 5,
    title: { en: "Permeable paving and rain gardens", ur: "پانی جذب کرنے والی فرش بندی اور رین گارڈن" },
    summary: {
      en: "Surfaces that let rain soak in reduce street flooding and recharge groundwater at the same time.",
      ur: "ایسی سطحیں جو بارش کو جذب ہونے دیں، گلیوں میں سیلابی پانی کم کرتی ہیں اور ساتھ ہی زیرِ زمین پانی کو ری چارج کرتی ہیں۔",
    },
    when: { en: "Driveways, parking areas, courtyards and green belts in towns that flood during the monsoon.", ur: "ڈرائیو وے، پارکنگ، صحن اور سبز پٹیاں، خصوصاً ان شہروں میں جہاں مون سون میں پانی کھڑا ہوتا ہے۔" },
    points: {
      en: [
        "Use grass pavers, open-jointed tiles or gravel instead of solid concrete where traffic allows.",
        "A rain garden is a planted hollow 15–30 cm deep that should drain within 1–2 days.",
        "Slope paved areas towards green areas rather than towards the street drain.",
      ],
      ur: [
        "جہاں ٹریفک اجازت دے وہاں ٹھوس کنکریٹ کے بجائے گراس پیور، کھلے جوڑ والی ٹائلیں یا بجری استعمال کریں۔",
        "رین گارڈن 15 سے 30 سینٹی میٹر گہرا پودوں والا گڑھا ہوتا ہے جس کا پانی 1 سے 2 دن میں جذب ہو جانا چاہیے۔",
        "پختہ سطحوں کی ڈھلوان گلی کی نالی کے بجائے سبزے کی طرف رکھیں۔",
      ],
    },
    care: {
      en: ["Sweep paver joints and remove silt once a year.", "Replant bare patches in rain gardens before the monsoon."],
      ur: ["سال میں ایک بار پیورز کے جوڑ صاف کریں اور مٹی نکالیں۔", "مون سون سے پہلے رین گارڈن کے خالی حصوں میں دوبارہ پودے لگائیں۔"],
    },
  },
  {
    key: "greywater", video: "reuse", theme: 4,
    title: { en: "Greywater reuse", ur: "استعمال شدہ پانی (گرے واٹر) کا دوبارہ استعمال" },
    summary: {
      en: "Water from showers, basins and washing machines can be filtered and reused for flushing toilets and watering gardens.",
      ur: "غسل خانے، واش بیسن اور واشنگ مشین کا پانی فلٹر کر کے فلش اور باغبانی کے لیے دوبارہ استعمال کیا جا سکتا ہے۔",
    },
    when: { en: "Homes, schools and mosques (wuzu water) where a large share of water goes to washing.", ur: "گھر، اسکول اور مساجد (وضو کا پانی) جہاں پانی کا بڑا حصہ دھونے میں استعمال ہوتا ہے۔" },
    points: {
      en: [
        "Keep toilet water out completely; kitchen water needs a grease trap or is better left out.",
        "Use a simple settling tank and gravel or sand filter; do not store untreated greywater for more than a day.",
        "Irrigate below the soil surface, and not on vegetables eaten raw.",
      ],
      ur: [
        "ٹوائلٹ کا پانی بالکل شامل نہ کریں؛ کچن کے پانی کے لیے گریس ٹریپ ضروری ہے، بہتر ہے اسے شامل نہ کیا جائے۔",
        "سادہ سیٹلنگ ٹینک اور بجری یا ریت کا فلٹر استعمال کریں؛ غیر صاف شدہ پانی ایک دن سے زیادہ ذخیرہ نہ کریں۔",
        "آبپاشی مٹی کی سطح کے نیچے کریں، اور کچی کھائی جانے والی سبزیوں پر استعمال نہ کریں۔",
      ],
    },
    care: {
      en: ["Clean the settling tank and grease trap monthly.", "Replace the top filter layer when flow slows down."],
      ur: ["سیٹلنگ ٹینک اور گریس ٹریپ ہر ماہ صاف کریں۔", "بہاؤ سست ہونے پر فلٹر کی اوپری تہہ تبدیل کریں۔"],
    },
  },
  {
    key: "watershed", video: "watershed", theme: 3,
    title: { en: "Check dams and karez", ur: "چیک ڈیم اور کاریز" },
    summary: {
      en: "Community-scale structures that slow flood water in nullahs and valleys and move groundwater by gravity, as karez have done in Balochistan for centuries.",
      ur: "اجتماعی سطح کے ڈھانچے جو نالوں اور وادیوں میں سیلابی پانی کی رفتار کم کرتے ہیں اور کشش ثقل سے زیرِ زمین پانی منتقل کرتے ہیں، جیسا کہ بلوچستان میں کاریز صدیوں سے کر رہے ہیں۔",
    },
    when: { en: "Hilly and arid areas such as the Potohar, Balochistan and the Thal, planned with the community and local authorities.", ur: "پہاڑی اور بنجر علاقے جیسے پوٹھوہار، بلوچستان اور تھل، جن کی منصوبہ بندی کمیونٹی اور مقامی حکام کے ساتھ کی جائے۔" },
    points: {
      en: [
        "Build a series of low stone or gabion check dams across a nullah rather than one large wall.",
        "Restore existing karez by desilting and lining with perforated pipe instead of drilling new tubewells nearby.",
        "Get approval from the irrigation or local government department before work starts.",
      ],
      ur: [
        "ایک بڑی دیوار کے بجائے نالے میں پتھر یا گیبیئن کے کئی چھوٹے چیک ڈیم بنائیں۔",
        "قریب نئے ٹیوب ویل لگانے کے بجائے موجود کاریز کو مٹی سے صاف کر کے سوراخ دار پائپ سے بحال کریں۔",
        "کام شروع کرنے سے پہلے محکمۂ آبپاشی یا مقامی حکومت سے منظوری لیں۔",
      ],
    },
    care: {
      en: ["Remove silt behind check dams after each flood season.", "Clean karez shafts and tunnels on a fixed community schedule."],
      ur: ["ہر سیلابی موسم کے بعد چیک ڈیم کے پیچھے جمع مٹی نکالیں۔", "کاریز کے کنوؤں اور سرنگوں کی صفائی کمیونٹی کے طے شدہ شیڈول کے مطابق کریں۔"],
    },
  },
];

export const THEMES = [
  { n: 1, en: "Groundwater recharge and water harvesting", ur: "زیرِ زمین پانی کی ری چارج اور بارانی پانی کا حصول" },
  { n: 2, en: "Water treatment and quality management", ur: "پانی کی صفائی اور معیار کا انتظام" },
  { n: 3, en: "Sustainable water supply infrastructure", ur: "پائیدار فراہمیِ آب کا ڈھانچہ" },
  { n: 4, en: "Wastewater management and reuse", ur: "استعمال شدہ پانی کا انتظام اور دوبارہ استعمال" },
  { n: 5, en: "Climate-resilient water infrastructure", ur: "موسمیاتی لحاظ سے پائیدار آبی ڈھانچہ" },
];

// Seasonal maintenance calendar (Pakistan monsoon: July–September)
export const CALENDAR = [
  {
    key: "pre", when: { en: "Before the monsoon · May–June", ur: "مون سون سے پہلے · مئی تا جون" },
    tasks: {
      en: ["Clean the roof, gutters and downpipes", "Wash the filter screen and reset the first-flush diverter", "Clean and disinfect the storage tank", "Desilt the recharge chamber and top sand layer"],
      ur: ["چھت، پرنالے اور ڈاؤن پائپ صاف کریں", "فلٹر کی جالی دھوئیں اور فرسٹ فلش ڈائیورٹر دوبارہ ترتیب دیں", "ذخیرے کا ٹینک صاف اور جراثیم سے پاک کریں", "ری چارج چیمبر اور اوپر کی ریت سے مٹی نکالیں"],
    },
  },
  {
    key: "during", when: { en: "During the monsoon · July–September", ur: "مون سون کے دوران · جولائی تا ستمبر" },
    tasks: {
      en: ["Empty the first-flush diverter after each rain", "Check for leaks and blocked outlets after heavy storms", "Make sure the overflow drains to the recharge well, not to the foundation"],
      ur: ["ہر بارش کے بعد فرسٹ فلش ڈائیورٹر خالی کریں", "تیز بارش کے بعد رساؤ اور بند نکاسی چیک کریں", "یقینی بنائیں کہ اوور فلو بنیاد کے بجائے ری چارج کنویں میں جائے"],
    },
  },
  {
    key: "post", when: { en: "After the monsoon · October", ur: "مون سون کے بعد · اکتوبر" },
    tasks: {
      en: ["Desilt the recharge well chamber again", "Note the tank level to plan dry-season use", "Repair cracked plaster or loose pipe clamps"],
      ur: ["ری چارج کنویں کا چیمبر دوبارہ صاف کریں", "خشک موسم کی منصوبہ بندی کے لیے ٹینک کی سطح نوٹ کریں", "ٹوٹا پلستر یا ڈھیلے کلیمپ مرمت کریں"],
    },
  },
  {
    key: "winter", when: { en: "Winter rains · December–March", ur: "سردیوں کی بارشیں · دسمبر تا مارچ" },
    tasks: {
      en: ["Clean gutters after leaf fall", "Have drinking water tested once a year", "Check the tank lid, vent mesh and overflow screen"],
      ur: ["پتے گرنے کے بعد پرنالے صاف کریں", "پینے کے پانی کا سالانہ ٹیسٹ کروائیں", "ٹینک کا ڈھکن، ہوا کی جالی اور اوور فلو کی جالی چیک کریں"],
    },
  },
];
