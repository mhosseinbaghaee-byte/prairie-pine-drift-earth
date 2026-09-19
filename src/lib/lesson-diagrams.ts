/**
 * بانک شکل‌های آموزشی پویا — فاز ۱
 * SVG + در صورت وجود تصویر آزاد ویکی‌مدیا کامنز
 */

export type LessonDiagram = {
  id: string;
  title: string;
  subject: string;
  grades: string;
  keywords: string[];
  caption: string;
  /** تصویر آموزشی از ویکی‌مدیا کامنز (اختیاری) */
  imageUrl?: string;
  /** چند تصویر کنار هم (مثلاً سه نوع ماهیچه) */
  imageGallery?: { url: string; label: string }[];
  /** ذکر منبع آزاد — الزامی وقتی imageUrl/gallery هست */
  attribution?: string;
};

export const LESSON_DIAGRAMS: LessonDiagram[] = [
  {
    id: "neuron",
    title: "ساختار نورون",
    subject: "زیست‌شناسی",
    grades: "یازدهم",
    keywords: ["نورون", "neuron", "دندریت", "آکسون", "یاخته عصبی", "سلول عصبی"],
    caption: "دندریت پیام را می‌گیرد → جسم یاخته‌ای → آکسون پیام را می‌فرستد.",
    imageUrl: "https://commons.wikimedia.org/wiki/Special:FilePath/Neuron_Hand-tuned.svg?width=640",
    attribution: "منبع: ویکی‌مدیا کامنز — طرح نورون (آزاد)",
  },
  {
    id: "reflex",
    title: "مسیر رفلکس عصبی",
    subject: "زیست‌شناسی",
    grades: "یازدهم",
    keywords: ["رفلکس", "پاسخ انعکاسی", "نخاع", "گیرنده", "تنظیم عصبی"],
    caption: "گیرنده → عصب حسی → نخاع → عصب حرکتی → ماهیچه.",
  },
  {
    id: "cell",
    title: "سلول جانوری ساده",
    subject: "زیست‌شناسی",
    grades: "دهم",
    keywords: ["سلول جانوری", "یاخته جانوری", "غشا سیتوپلاسم", "animal cell"],
    caption: "غشا، سیتوپلاسم و هسته — سه بخش اصلی سلول جانوری.",
  },
  {
    id: "plant_cell",
    title: "سلول گیاهی",
    subject: "زیست‌شناسی",
    grades: "دهم",
    keywords: ["سلول گیاهی", "دیواره سلولی", "کلروپلاست", "واکوئل"],
    caption: "دیواره سلولی، کلروپلاست و واکوئل بزرگ از ویژگی‌های سلول گیاهی‌اند.",
  },
  {
    id: "muscle_types",
    title: "انواع سلول ماهیچه",
    subject: "زیست‌شناسی",
    grades: "هشتم / دهم",
    keywords: [
      "سلول ماهیچه",
      "سلول ماهيچه",
      "یاخته ماهیچه",
      "ماهیچه اسکلتی",
      "ماهیچه قلبی",
      "ماهیچه صاف",
      "ماهيچه",
      "عضله",
      "انواع ماهیچه",
      "muscle",
      "skeletal muscle",
      "cardiac",
      "smooth muscle",
      "مخطط",
      "صفحات بینابینی",
    ],
    caption: "اسکلتی (مخطط، چند هسته) · قلبی (مخطط، انشعاب) · صاف (دوکی، یک هسته).",
    imageGallery: [
      {
        url: "https://commons.wikimedia.org/wiki/Special:FilePath/Blausen_0801_SkeletalMuscle.png?width=640",
        label: "اسکلتی (ارادی) — طرح رنگی",
      },
      {
        url: "https://commons.wikimedia.org/wiki/Special:FilePath/Histology_of_cardiac_muscle.jpg?width=640",
        label: "قلبی — زیر میکروسکوپ",
      },
      {
        url: "https://commons.wikimedia.org/wiki/Special:FilePath/Histology_of_smooth_muscle.jpg?width=640",
        label: "صاف — زیر میکروسکوپ",
      },
    ],
    attribution: "منبع تصاویر: ویکی‌مدیا کامنز (آزاد) — Blausen Medical و بافت‌شناسی آموزشی",
  },
  {
    id: "photosynthesis",
    title: "فتوسنتز",
    subject: "علوم / زیست",
    grades: "ششم تا دهم",
    keywords: ["فتوسنتز", "کلروفیل", "غذاسازی گیاه", "photosynthesis"],
    caption: "نور + آب + CO₂ → قند + اکسیژن (در کلروپلاست).",
  },
  {
    id: "atom",
    title: "مدل ساده اتم",
    subject: "شیمی / علوم",
    grades: "هشتم تا دهم",
    keywords: ["اتم", "پروتون", "نوترون", "الکترون", "هسته اتم"],
    caption: "هسته (پروتون و نوترون) + الکترون در اطراف.",
  },
  {
    id: "heart",
    title: "قلب انسان (چهار حفره)",
    subject: "زیست‌شناسی",
    grades: "هشتم / دهم",
    keywords: ["قلب", "دهلیز", "بطن", "گردش خون"],
    caption: "دو دهلیز بالا و دو بطن پایین؛ خون را در بدن به گردش درمی‌آورد.",
  },
  {
    id: "digestive",
    title: "مسیر گوارش",
    subject: "زیست‌شناسی",
    grades: "هشتم / دهم",
    keywords: ["گوارش", "معده", "روده", "مری", "دستگاه گوارش"],
    caption: "دهان → مری → معده → روده باریک → روده بزرگ.",
  },
  {
    id: "water_cycle",
    title: "چرخه آب",
    subject: "علوم",
    grades: "چهارم تا هفتم",
    keywords: ["چرخه آب", "تبخیر", "بارش", "میعان", "آب"],
    caption: "تبخیر → میعان → بارش → جریان روی زمین.",
  },
  {
    id: "fraction",
    title: "کسر روی شکل",
    subject: "ریاضی",
    grades: "سوم تا ششم",
    keywords: ["کسر", "صورت کسر", "مخرج", "fraction"],
    caption: "کسر یعنی قسمت رنگی نسبت به کل شکل.",
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
    keywords: ["موج", "طول موج", "دامنه", "فرکانس", "sin"],
    caption: "دامنه ارتفاع موج و طول موج فاصلهٔ دو قلهٔ پشت‌سرهم است.",
  },
  {
    id: "circuit",
    title: "مدار ساده",
    subject: "فیزیک",
    grades: "هشتم / نهم",
    keywords: ["مدار", "مقاومت", "باتری", "جریان الکتریکی"],
    caption: "باتری، کلید، لامپ و سیم یک مدار ساده می‌سازند.",
  },
  {
    id: "dna",
    title: "ساختار ساده DNA",
    subject: "زیست‌شناسی",
    grades: "دوازدهم",
    keywords: ["DNA", "دی‌ان‌ای", "مارپیچ دوگانه", "ژنتیک"],
    caption: "دو رشتهٔ مارپیچ با بازهای مکمل.",
  },
  {
    id: "earth_layers",
    title: "لایه‌های زمین",
    subject: "علوم / زمین",
    grades: "پنجم تا هشتم",
    keywords: ["لایه‌های زمین", "هسته زمین", "گوشته", "پوسته زمین"],
    caption: "پوسته → گوشته → هسته خارجی → هسته داخلی.",
  },
];

export function diagramById(id: string): LessonDiagram | undefined {
  return LESSON_DIAGRAMS.find((d) => d.id === id);
}

/** بهترین شکل مطابق متن سؤال کاربر */
export function matchDiagram(text: string): LessonDiagram | null {
  const t = text.toLowerCase().trim();
  if (t.length < 2) return null;
  let best: LessonDiagram | null = null;
  let score = 0;
  for (const d of LESSON_DIAGRAMS) {
    let hits = 0;
    for (const k of d.keywords) {
      const key = k.toLowerCase();
      if (t.includes(key)) {
        hits += Math.max(1, Math.min(6, Math.floor(key.length / 2)));
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
