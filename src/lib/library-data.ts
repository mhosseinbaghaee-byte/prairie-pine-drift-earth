export type QuizQuestion = {
  q: string;
  options: [string, string, string, string];
  correct: number;
  why: string;
};
export type QuizPayload = { topic: string; questions: QuizQuestion[] };

export type Lesson = {
  id: string;
  title: string;
  keywords: string[];
  body: string;
};

export const LESSONS: Lesson[] = [
  {
    id: "light",
    title: "نور چیست؟",
    keywords: ["نور", "light", "فوتون", "رنگ", "چشم", "علمی", "علوم"],
    body: `نور موج الکترومغناطیسی است — و همزمان بسته‌های انرژی به نام فوتون.\n\nچشم تو رنگ را «نمی‌بیند»؛ طول‌موج را ترجمه می‌کند.\n\nحالا بگو: اگر چشم انسان فروسرخ را هم می‌دید، شب برایت چطور می‌شد؟`,
  },
  {
    id: "gravity",
    title: "گرانش، ساده و دقیق",
    keywords: ["گرانش", "جاذبه", "نیوتن", "اینشتین", "وزن"],
    body: `گرانش یعنی جرم، فضا-زمان را خم می‌کند و چیزها در آن خمیدگی «می‌افتند».\n\nسؤال: اگر زمین ناگهان از چرخش بایستد، گرانش چه می‌شود؟`,
  },
  {
    id: "internet",
    title: "اینترنت؛ بسته‌هایی که راه گم نمی‌کنند",
    keywords: ["اینترنت", "شبکه", "ip", "فناوری", "وب"],
    body: `اینترنت یک چیز نیست؛ توافق است. داده به بسته‌های کوچک تقسیم می‌شود، هر بسته آدرس دارد، مسیر را خودش پیدا می‌کند.\n\nIP مثل پلاک خانه است، DNS مثل دفترچه تلفن.\n\nمی‌خواهی فرق اینترنت و وب را با یک مثال روزمره باز کنیم؟`,
  },
  {
    id: "caspian",
    title: "دریای خزر؛ دریا یا دریاچه؟",
    keywords: ["خزر", "کاسپین", "دریا", "جغرافیا", "مازندران"],
    body: `خزر بزرگ‌ترین پهنهٔ آبی محصور دنیاست. به اقیانوس وصل نیست، پس از نظر فنی دریاچه است.\n\nکدام ساحلش را دیده‌ای؟`,
  },
  {
    id: "zero",
    title: "صفر؛ عددی که نبود، بعد همه‌چیز شد",
    keywords: ["صفر", "ریاضی", "عدد", "هند", "خوارزمی"],
    body: `صفر دو شغل دارد: جای خالی در ارزش مکانی، و خودِ عدد.\n\nاگر صفر اختراع نمی‌شد، حسابداری امروز ممکن بود؟`,
  },
  {
    id: "sleep",
    title: "خواب؛ مغز دارد فایل‌ها را مرتب می‌کند",
    keywords: ["خواب", "مغز", "سلامت", "حافظه", "بیداری"],
    body: `خواب خاموشی نیست. در خواب عمیق، مغز مواد زائد را بهتر می‌شوید.\n\nچند ساعت معمولاً می‌خوابی؟`,
  },
];

export const LOCAL_QUIZZES: Record<string, QuizPayload> = {
  "اطلاعات عمومی": {
    topic: "اطلاعات عمومی",
    questions: [
      {
        q: "بزرگ‌ترین پهنهٔ آبی محصور جهان کدام است؟",
        options: ["دریاچه ویکتوریا", "دریای خزر", "دریاچه بایکال", "دریای مرده"],
        correct: 1,
        why: "خزر به اقیانوس وصل نیست پس دریاچه حساب می‌شود.",
      },
      {
        q: "فوتون چیست؟",
        options: ["ذرهٔ نور", "واحد صدا", "نوعی سلول", "قمر زمین"],
        correct: 0,
        why: "نور هم موج است هم بستهٔ انرژی.",
      },
      {
        q: "نوروز با کدام پدیدهٔ نجومی هم‌زمان است؟",
        options: ["انقلاب تابستانی", "اعتدال بهاری", "ماه گرفتگی", "حضیض خورشیدی"],
        correct: 1,
        why: "تحویل سال لحظهٔ اعتدال بهاری است.",
      },
      {
        q: "صفر در ارزش مکانی چه کار می‌کند؟",
        options: ["عدد را منفی می‌کند", "جای خالی مرتبه را نشان می‌دهد", "فقط برای اعشار است", "هیچ نقشی ندارد"],
        correct: 1,
        why: "بدون صفر، ۱۰ و ۱ از هم تشخیص داده نمی‌شوند.",
      },
      {
        q: "چرا آسمان در روز آبی دیده می‌شود؟",
        options: ["اقیانوس منعکس می‌شود", "پراکندگی نور آبی در هوا", "ازن آبی است", "چشم ما فقط آبی می‌بیند"],
        correct: 1,
        why: "مولکول‌های هوا نور آبی را بیشتر پخش می‌کنند.",
      },
    ],
  },
};

export const FACTS = [
  "اختاپوس سه قلب دارد و خونش آبی است.",
  "مغز تو حدود بیست وات انرژی می‌خواهد — مثل یک لامپ کم‌مصرف.",
  "صدای تندر بعد از برق می‌آید چون نور سریع‌تر از صداست.",
  "موز از نظر گیاه‌شناسی توت است.",
];

const LANG_OPENERS: Record<string, string> = {
  fa: `سلام. من پویام. امروز می‌خواهی چه چیزی را بفهمی؟`,
  en: `Hello — I'm Pouya.\nLet's practice English.`,
};

export function matchLesson(text: string): Lesson | null {
  const t = text.toLowerCase().trim();
  if (t.length < 2) return null;
  let best: Lesson | null = null;
  let score = 0;
  for (const lesson of LESSONS) {
    let hits = 0;
    for (const k of lesson.keywords) {
      const key = k.toLowerCase();
      if (key.length <= 2) {
        if (new RegExp(`(^|[^\\p{L}\\p{N}])${key}([^\\p{L}\\p{N}]|$)`, "u").test(t)) hits += 1;
      } else if (t.includes(key)) {
        hits += key.length >= 4 ? 2 : 1;
      }
    }
    if (hits > score) {
      score = hits;
      best = lesson;
    }
  }
  return score > 0 ? best : null;
}

export function lessonByTopicLabel(label: string): Lesson | null {
  const map: Record<string, string> = {
    علوم: "light",
    تاریخ: "achaemenid",
    جغرافیا: "caspian",
    ریاضی: "zero",
    زبان: "persian",
    سلامت: "sleep",
    فناوری: "internet",
    فرهنگ: "nowruz",
    "اطلاعات عمومی": "moon",
  };
  const id = map[label];
  return LESSONS.find((l) => l.id === id) ?? null;
}

export function todayFact() {
  const i = Math.floor(Date.now() / 86_400_000) % FACTS.length;
  return `دانستی امروز\n\n${FACTS[i]}\n\nاگر خواستی، بگو عمیق‌ترش کنم.`;
}

export function localQuiz(topic: string): QuizPayload {
  if (LOCAL_QUIZZES[topic]) return LOCAL_QUIZZES[topic];
  return LOCAL_QUIZZES["اطلاعات عمومی"];
}

export function localDaily(messages: { role: string; content: string }[]) {
  const userTurns = messages.filter((m) => m.role === "user");
  if (userTurns.length <= 1) {
    return `بزن بریم مرور روزانه.\n\n1) امروز روی چه کارهایی وقت گذاشتی؟\n2) چه چیزی تمام شد؟\n3) چیزی یاد گرفتی؟\n4) فردا روی چه تمرکز کنی؟`;
  }
  const answers = userTurns.slice(1).map((m) => m.content.trim()).filter(Boolean).join("\n\n");
  return `از حرف‌هایت یک پیش‌نویس ساختم.\n\n## کارهای امروز\n${answers || "—"}\n\nاگر بخشی کم است بگو تا کاملش کنیم.`;
}

export function localLanguage(lang: string, last: string, turns: number) {
  const opener = LANG_OPENERS[lang] ?? LANG_OPENERS.en;
  if (turns <= 1) return opener;
  if (lang === "fa") {
    return `خوب گفتی. یک قدم جلوتر:\n\nجمله را کامل کن: «امروز می‌خواهم …… یاد بگیرم.»`;
  }
  return `${opener}\n\nYou said: «${last.slice(0, 180)}»\n\nKeep going in the same language.`;
}
