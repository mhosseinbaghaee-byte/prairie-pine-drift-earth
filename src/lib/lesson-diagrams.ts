/**
 * بانک شکل‌های آموزشی پویا — فاز ۱
 * شکل‌ها SVG آموزشی اصلی هستند (کپی اسکن کتاب درسی نیستند).
 * هم‌راستا با مباحث پرتکرار کتاب‌های رسمی؛ قابل گسترش مرحله‌به‌مرحله.
 */

export type LessonDiagram = {
  id: string;
  title: string;
  subject: string;
  grades: string;
  keywords: string[];
  caption: string;
};

export const LESSON_DIAGRAMS: LessonDiagram[] = [
  {
    id: "neuron",
    title: "ساختار نورون",
    subject: "زیست‌شناسی",
    grades: "یازدهم",
    keywords: ["نورون", "neuron", "دندریت", "آکسون", "یاخته عصبی", "سلول عصبی"],
    caption: "دندریت پیام را می‌گیرد → جسم یاخته‌ای → آکسون پیام را می‌فرستد.",
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
    keywords: ["سلول", "یاخته", "هسته", "غشا", "سیتوپلاسم", "cell"],
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
    caption: "تبخیر → میعان → بارش → جریان سطحی؛ چرخه تکرار می‌شود.",
  },
  {
    id: "fraction",
    title: "کسر روی دایره",
    subject: "ریاضی",
    grades: "سوم تا ششم",
    keywords: ["کسر", "صورت", "مخرج", "یک چهارم", "یک دوم"],
    caption: "کل به قسمت‌های برابر تقسیم می‌شود؛ صورت = قسمت برداشته‌شده.",
  },
  {
    id: "triangle_types",
    title: "انواع مثلث",
    subject: "ریاضی / هندسه",
    grades: "پنجم تا هشتم",
    keywords: ["مثلث", "متساوی‌الاضلاع", "قائم‌الزاویه", "متساوی‌الساقین"],
    caption: "از روی ضلع یا زاویه نام‌گذاری می‌شود.",
  },
  {
    id: "wave",
    title: "موج ساده (سینوسی)",
    subject: "فیزیک",
    grades: "یازدهم",
    keywords: ["موج", "طول موج", "دامنه", "فرکانس", "سینوسی"],
    caption: "دامنه = بلندی موج؛ طول موج = فاصله دو قله پشت‌سرهم.",
  },
  {
    id: "circuit",
    title: "مدار ساده",
    subject: "فیزیک",
    grades: "نهم / دهم",
    keywords: ["مدار", "مقاومت", "باتری", "جریان", "الکتریسیته"],
    caption: "منبع ولتاژ + سیم + مصرف‌کننده؛ مسیر بسته لازم است.",
  },
  {
    id: "dna",
    title: "DNA دوبرابرمارپیچ (ساده)",
    subject: "زیست‌شناسی",
    grades: "دوازدهم",
    keywords: ["dna", "دی‌ان‌ای", "ژن", "وارثت", "مارپیچ"],
    caption: "دو رشته مارپیچ؛ اطلاعات وراثتی را نگه می‌دارد.",
  },
  {
    id: "earth_layers",
    title: "لایه‌های زمین",
    subject: "زمین‌شناسی / علوم",
    grades: "پنجم تا یازدهم",
    keywords: ["پوسته", "گوشته", "هسته زمین", "لایه زمین"],
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
      if (t.includes(key)) hits += key.length >= 4 ? 2 : 1;
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
