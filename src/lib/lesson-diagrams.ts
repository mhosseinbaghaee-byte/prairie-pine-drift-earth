/**
 * بانک شکل‌های آموزشی پویا
 * اولویت: تصویر رنگی ویکی‌مدیا کامنز + ذکر منبع؛ در نبود تصویر → SVG داخلی
 */

export type LessonDiagram = {
  id: string;
  title: string;
  subject: string;
  grades: string;
  keywords: string[];
  caption: string;
  imageUrl?: string;
  imageGallery?: { url: string; label: string }[];
  attribution?: string;
};

const WM = (file: string, width = 700) =>
  `https://commons.wikimedia.org/wiki/Special:FilePath/${file}?width=${width}`;

export const LESSON_DIAGRAMS: LessonDiagram[] = [
  {
    id: "neuron",
    title: "ساختار نورون",
    subject: "زیست‌شناسی",
    grades: "یازدهم",
    keywords: ["نورون", "neuron", "دندریت", "آکسون", "یاخته عصبی", "سلول عصبی"],
    caption: "دندریت پیام را می‌گیرد → جسم یاخته‌ای → آکسون پیام را می‌فرستد.",
    imageUrl: WM("Neuron_Hand-tuned.svg", 640),
    attribution: "ویکی‌مدیا کامنز — طرح نورون",
  },
  {
    id: "reflex",
    title: "مسیر رفلکس عصبی",
    subject: "زیست‌شناسی",
    grades: "یازدهم",
    keywords: ["رفلکس", "پاسخ انعکاسی", "نخاع", "گیرنده", "تنظیم عصبی"],
    caption: "گیرنده → عصب حسی → نخاع → عصب حرکتی → ماهیچه.",
    imageUrl: WM("Reflex_arc.svg", 700),
    attribution: "ویکی‌مدیا کامنز — قوس بازتابی",
  },
  {
    id: "cell",
    title: "سلول جانوری ساده",
    subject: "زیست‌شناسی",
    grades: "دهم",
    keywords: ["سلول جانوری", "یاخته جانوری", "غشا سیتوپلاسم", "animal cell"],
    caption: "غشا، سیتوپلاسم و هسته — سه بخش اصلی سلول جانوری.",
    imageUrl: WM("Animal_cell_structure.svg", 700),
    attribution: "ویکی‌مدیا کامنز — ساختار سلول جانوری",
  },
  {
    id: "plant_cell",
    title: "سلول گیاهی",
    subject: "زیست‌شناسی",
    grades: "دهم",
    keywords: ["سلول گیاهی", "دیواره سلولی", "کلروپلاست", "واکوئل"],
    caption: "دیواره سلولی، کلروپلاست و واکوئل بزرگ از ویژگی‌های سلول گیاهی‌اند.",
    imageUrl: WM("Plant_cell_structure-en.svg", 700),
    attribution: "ویکی‌مدیا کامنز — ساختار سلول گیاهی",
  },
  {
    id: "muscle_types",
    title: "انواع سلول ماهیچه",
    subject: "زیست‌شناسی",
    grades: "هشتم / دهم",
    keywords: [
      "سلول ماهیچه", "سلول ماهيچه", "یاخته ماهیچه", "ماهیچه اسکلتی", "ماهیچه قلبی", "ماهیچه صاف",
      "ماهيچه", "عضله", "انواع ماهیچه", "muscle", "skeletal muscle", "cardiac", "smooth muscle", "مخطط", "صفحات بینابینی",
    ],
    caption: "اسکلتی (مخطط، چند هسته) · قلبی (مخطط، انشعاب) · صاف (دوکی، یک هسته).",
    imageGallery: [
      { url: WM("Blausen_0801_SkeletalMuscle.png", 640), label: "اسکلتی (ارادی)" },
      { url: WM("Histology_of_cardiac_muscle.jpg", 640), label: "قلبی" },
      { url: WM("Histology_of_smooth_muscle.jpg", 640), label: "صاف" },
    ],
    attribution: "ویکی‌مدیا کامنز — Blausen و بافت‌شناسی آموزشی",
  },
  {
    id: "periodic_table",
    title: "جدول تناوبی (مندلیف)",
    subject: "شیمی",
    grades: "هشتم تا دوازدهم",
    keywords: [
      "جدول مندلیف", "جدول تناوبی", "جدول تناوبی عناصر", "جدول عناصر", "periodic table",
      "مندلیف", "عناصر شیمیایی", "گروه فلزی", "هالوژن", "گاز نجیب",
    ],
    caption: "عناصر بر اساس عدد اتمی در دوره‌ها (سطر) و گروه‌ها (ستون) چیده شده‌اند.",
    imageUrl: WM("Periodic_table_large.svg", 960),
    attribution: "ویکی‌مدیا کامنز — جدول تناوبی",
  },
  {
    id: "water_molecule",
    title: "مولکول آب",
    subject: "شیمی / علوم",
    grades: "ششم تا دهم",
    keywords: ["مولکول آب", "اتم آب", "H2O", "H₂O", "آب مولکول", "water molecule"],
    caption: "هر مولکول آب از دو اتم هیدروژن و یک اتم اکسیژن ساخته شده (H₂O).",
    imageUrl: WM("Water-3D-balls.png", 640),
    attribution: "ویکی‌مدیا کامنز — مدل مولکول آب",
  },
  {
    id: "gold_atom",
    title: "آرایش الکترونی طلا",
    subject: "شیمی",
    grades: "نهم تا دوازدهم",
    keywords: ["اتم طلا", "طلا", "gold atom", "آرایش الکترونی طلا", "عنصر طلا"],
    caption: "طلا عنصر با عدد اتمی ۷۹؛ لایه‌های الکترونی در تصویر دیده می‌شود.",
    imageUrl: WM("Electron_shell_079_gold.png", 640),
    attribution: "ویکی‌مدیا کامنز — لایه الکترونی طلا",
  },
  {
    id: "mercury_atom",
    title: "آرایش الکترونی جیوه",
    subject: "شیمی",
    grades: "نهم تا دوازدهم",
    keywords: ["اتم جیوه", "جیوه", "mercury", "آرایش الکترونی جیوه", "عنصر جیوه"],
    caption: "جیوه فلز مایع در دمای اتاق؛ عدد اتمی ۸۰.",
    imageUrl: WM("Electron_shell_080_mercury.png", 640),
    attribution: "ویکی‌مدیا کامنز — لایه الکترونی جیوه",
  },
  {
    id: "mercury_element",
    title: "جیوه مایع",
    subject: "شیمی",
    grades: "هشتم تا دهم",
    keywords: ["جیوه مایع", "فلز مایع", "liquid mercury"],
    caption: "جیوه تنها فلزی است که در دمای اتاق مایع است.",
    imageUrl: WM("Pouring_liquid_mercury_bionerd.jpg", 640),
    attribution: "ویکی‌مدیا کامنز — تصویر جیوه مایع",
  },
  {
    id: "earth_map",
    title: "نقشه کره زمین",
    subject: "جغرافیا",
    grades: "چهارم تا نهم",
    keywords: [
      "نقشه جهان", "نقشه زمین", "نقشه کره", "نقشه کره زمین", "کره زمین",
      "قاره", "اقیانوس", "جغرافیا نقشه", "world map", "شکل نقشه",
    ],
    caption: "نقشه جهان برای شناخت قاره‌ها و اقیانوس‌ها.",
    imageUrl: WM("World_map_blank_without_borders.svg", 900),
    attribution: "ویکی‌مدیا کامنز — نقشه جهان",
  },
  {
    id: "photosynthesis",
    title: "فتوسنتز",
    subject: "علوم / زیست",
    grades: "ششم تا دهم",
    keywords: ["فتوسنتز", "کلروفیل", "غذاسازی گیاه", "photosynthesis"],
    caption: "نور + آب + CO₂ → قند + اکسیژن (در کلروپلاست).",
    imageUrl: WM("Photosynthesis_equation.svg", 700),
    attribution: "ویکی‌مدیا کامنز — معادله فتوسنتز",
  },
  {
    id: "atom",
    title: "مدل ساده اتم",
    subject: "شیمی / علوم",
    grades: "هشتم تا دهم",
    keywords: ["مدل اتم", "مدل بور", "پروتون نوترون الکترون", "هسته اتم", "atom model", "Bohr"],
    caption: "هسته (پروتون و نوترون) + الکترون در اطراف.",
    imageUrl: WM("Bohr_atom_model.svg", 640),
    attribution: "ویکی‌مدیا کامنز — مدل بور اتم",
  },
  {
    id: "heart",
    title: "قلب انسان (چهار حفره)",
    subject: "زیست‌شناسی",
    grades: "هشتم / دهم",
    keywords: ["قلب", "شکل قلب", "ساختار قلب", "دهلیز", "بطن", "گردش خون", "قلب انسان", "heart"],
    caption: "دو دهلیز بالا و دو بطن پایین؛ خون را در بدن به گردش درمی‌آورد.",
    imageUrl: WM("Heart_diagram_blood_flow_en.svg", 900),
    attribution: "ویکی‌مدیا کامنز — نمودار قلب و جریان خون",
  },
  {
    id: "digestive",
    title: "مسیر گوارش",
    subject: "زیست‌شناسی",
    grades: "هشتم / دهم",
    keywords: ["گوارش", "معده", "روده", "مری", "دستگاه گوارش"],
    caption: "دهان → مری → معده → روده باریک → روده بزرگ.",
    imageUrl: WM("Digestive_system_diagram_en.svg", 700),
    attribution: "ویکی‌مدیا کامنز — دستگاه گوارش",
  },
  {
    id: "water_cycle",
    title: "چرخه آب",
    subject: "علوم",
    grades: "چهارم تا هفتم",
    keywords: ["چرخه آب", "تبخیر", "بارش", "میعان"],
    caption: "تبخیر → میعان → بارش → جریان روی زمین.",
    imageUrl: WM("Water_cycle.svg", 700),
    attribution: "ویکی‌مدیا کامنز — چرخه آب",
  },
  {
    id: "fraction",
    title: "کسر روی شکل",
    subject: "ریاضی",
    grades: "سوم تا ششم",
    keywords: ["کسر", "صورت کسر", "مخرج", "fraction"],
    caption: "کسر یعنی قسمت رنگی نسبت به کل شکل.",
    imageUrl: WM("Circle_Area.svg", 500),
    attribution: "ویکی‌مدیا کامنز — شکل کمکی کسر / مساحت",
  },
  {
    id: "triangle_types",
    title: "انواع مثلث",
    subject: "ریاضی",
    grades: "پنجم تا هشتم",
    keywords: ["مثلث", "متساوی‌الاضلاع", "قائم‌الزاویه", "متساوی‌الساقین"],
    caption: "مثلث‌ها را با ضلع و زاویه دسته‌بندی می‌کنیم.",
  },
  {
    id: "wave",
    title: "موج ساده",
    subject: "فیزیک",
    grades: "هشتم / یازدهم",
    keywords: ["موج", "طول موج", "دامنه", "فرکانس", "موج سینوسی"],
    caption: "دامنه ارتفاع موج و طول موج فاصلهٔ دو قلهٔ پشت‌سرهم است.",
    imageUrl: WM("Sine_wave.svg", 700),
    attribution: "ویکی‌مدیا کامنز — موج سینوسی",
  },
  {
    id: "circuit",
    title: "مدار ساده",
    subject: "فیزیک",
    grades: "هشتم / نهم",
    keywords: ["مدار", "مقاومت", "باتری", "جریان الکتریکی", "مدار سری"],
    caption: "باتری، کلید، لامپ و سیم یک مدار ساده می‌سازند.",
    imageUrl: WM("Basic_electric_circuit.svg", 700),
    attribution: "ویکی‌مدیا کامنز — مدار الکتریکی ساده",
  },
  {
    id: "dna",
    title: "ساختار ساده DNA",
    subject: "زیست‌شناسی",
    grades: "دوازدهم",
    keywords: ["DNA", "دی‌ان‌ای", "مارپیچ دوگانه", "ژنتیک"],
    caption: "دو رشتهٔ مارپیچ با بازهای مکمل.",
    imageUrl: WM("DNA_Structure%2BKey%2BLabelled.pn_NoBB.png", 700),
    attribution: "ویکی‌مدیا کامنز — ساختار DNA",
  },
  {
    id: "earth_layers",
    title: "لایه‌های زمین",
    subject: "علوم / زمین",
    grades: "پنجم تا هشتم",
    keywords: ["لایه‌های زمین", "هسته زمین", "گوشته", "پوسته زمین"],
    caption: "پوسته → گوشته → هسته خارجی → هسته داخلی.",
    imageUrl: WM("Earth_cutaway_schematic-en.svg", 700),
    attribution: "ویکی‌مدیا کامنز — برش لایه‌های زمین",
  },
];

export function diagramById(id: string): LessonDiagram | undefined {
  return LESSON_DIAGRAMS.find((d) => d.id === id);
}

function norm(s: string) {
  return s
    .toLowerCase()
    .replace(/\u200c/g, "")
    .replace(/[ي]/g, "ی")
    .replace(/[ك]/g, "ک")
    .replace(/\s+/g, " ")
    .trim();
}

export function matchDiagram(text: string): LessonDiagram | null {
  const t = norm(text);
  if (t.length < 2) return null;
  let best: LessonDiagram | null = null;
  let score = 0;
  for (const d of LESSON_DIAGRAMS) {
    let hits = 0;
    for (const k of d.keywords) {
      const key = norm(k);
      if (!key) continue;
      if (t.includes(key)) {
        hits += Math.max(2, Math.min(8, Math.floor(key.length / 2)));
      }
    }
    if (hits > score) {
      score = hits;
      best = d;
    }
  }
  return score > 0 ? best : null;
}

export function diagramTag(id: string) {
  return `[diagram:${id}]`;
}
