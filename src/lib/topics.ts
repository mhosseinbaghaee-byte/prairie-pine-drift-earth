export type Level = "kid" | "teen" | "adult";

export const LEVELS: { id: Level; label: string; hint: string }[] = [
  { id: "kid", label: "ساده", hint: "سطح ابتدایی و توضیح ساده" },
  { id: "teen", label: "متوسط", hint: "متوسطه اول و دوم — دقیق با مثال" },
  { id: "adult", label: "عمیق", hint: "کنکور و جمع‌بندی پیشرفته" },
];

export type Topic = {
  id: string;
  label: string;
  prompt: string;
};

/** موضوعات چت — هم‌تراز دروس رسمی و مسیر کنکور */
export const TOPICS: Topic[] = [
  {
    id: "math",
    label: "ریاضی",
    prompt:
      "یک مبحث ریاضی کتاب درسی ایران (ابتدایی تا حسابان/گسسته یا ریاضی تجربی) را قدم‌به‌قدم درس بده.",
  },
  {
    id: "physics",
    label: "فیزیک",
    prompt: "یک مبحث فیزیک دهم تا دوازدهم را مفهومی با واحد و مثال عددی توضیح بده.",
  },
  {
    id: "chemistry",
    label: "شیمی",
    prompt: "یک مبحث شیمی دبیرستان را مفهومی درس بده و یک تمرین کوتاه بده.",
  },
  {
    id: "biology",
    label: "زیست",
    prompt: "یک گفتار زیست‌شناسی کنکور تجربی را ساخت‌یافته توضیح بده.",
  },
  {
    id: "farsi",
    label: "فارسی",
    prompt: "یک مهارت فارسی یا علوم و فنون ادبی کتاب درسی را با مثال کوتاه درس بده.",
  },
  {
    id: "arabic",
    label: "عربی",
    prompt: "یک نکته عربی متوسطه (ترجمه یا قواعد) را با تمرین کوتاه درس بده.",
  },
  {
    id: "english",
    label: "انگلیسی",
    prompt: "یک درس کوتاه انگلیسی سطح مدرسه با معنی فارسی و یک سؤال تمرینی بده.",
  },
  {
    id: "social",
    label: "مطالعات اجتماعی",
    prompt: "یک موضوع تاریخ، جغرافیا یا مدنی مرتبط با کتاب درسی ایران را کوتاه درس بده.",
  },
  {
    id: "konkur",
    label: "کنکور و نهایی",
    prompt:
      "برای آمادگی کنکور سراسری و امتحان نهایی یک راهنمای اولویت‌بندی واقع‌بینانه بده (با اشاره به نقش سوابق تحصیلی).",
  },
];

export const QUIZ_TOPICS = [
  "ریاضی",
  "فیزیک",
  "شیمی",
  "زیست‌شناسی",
  "فارسی و ادبیات",
  "عربی",
  "انگلیسی",
  "تاریخ ایران",
  "جغرافیا",
  "اطلاعات عمومی",
];

export type LangCode =
  | "en"
  | "fr"
  | "de"
  | "es"
  | "it"
  | "tr"
  | "ar"
  | "ru"
  | "zh"
  | "ja"
  | "ko"
  | "pt"
  | "hi";

export const LANGUAGES: {
  code: LangCode;
  label: string;
  native: string;
  flag: string;
  locale: string;
}[] = [
  { code: "en", label: "انگلیسی", native: "English", flag: "🇬🇧", locale: "en-US" },
  { code: "fr", label: "فرانسوی", native: "Français", flag: "🇫🇷", locale: "fr-FR" },
  { code: "de", label: "آلمانی", native: "Deutsch", flag: "🇩🇪", locale: "de-DE" },
  { code: "es", label: "اسپانیایی", native: "Español", flag: "🇪🇸", locale: "es-ES" },
  { code: "it", label: "ایتالیایی", native: "Italiano", flag: "🇮🇹", locale: "it-IT" },
  { code: "tr", label: "ترکی", native: "Türkçe", flag: "🇹🇷", locale: "tr-TR" },
  { code: "ar", label: "عربی", native: "العربية", flag: "🇸🇦", locale: "ar-SA" },
  { code: "ru", label: "روسی", native: "Русский", flag: "🇷🇺", locale: "ru-RU" },
  { code: "zh", label: "چینی", native: "中文", flag: "🇨🇳", locale: "zh-CN" },
  { code: "ja", label: "ژاپنی", native: "日本語", flag: "🇯🇵", locale: "ja-JP" },
  { code: "ko", label: "کره‌ای", native: "한국어", flag: "🇰🇷", locale: "ko-KR" },
  { code: "pt", label: "پرتغالی", native: "Português", flag: "🇵🇹", locale: "pt-BR" },
  { code: "hi", label: "هندی", native: "हिन्दी", flag: "🇮🇳", locale: "hi-IN" },
];

export type Scenario = {
  id: string;
  label: string;
  prompt: string;
};

export const SCENARIOS: Scenario[] = [
  {
    id: "cafe",
    label: "کافه",
    prompt: "Let's role-play ordering coffee and chatting in a café. You start as the barista.",
  },
  {
    id: "airport",
    label: "فرودگاه",
    prompt: "Role-play at the airport: check-in, security, or asking for directions. You start.",
  },
  {
    id: "hotel",
    label: "هتل",
    prompt: "Role-play checking into a hotel and asking about facilities. You are the receptionist.",
  },
  {
    id: "job",
    label: "مصاحبه شغلی",
    prompt: "Practice a job interview. You are the interviewer. Keep questions natural.",
  },
  {
    id: "daily",
    label: "زندگی روزمره",
    prompt: "Casual daily conversation: weather, plans, hobbies. Keep it natural and friendly.",
  },
  {
    id: "travel",
    label: "سفر",
    prompt: "Talk about travel plans, asking for recommendations and directions.",
  },
  {
    id: "shopping",
    label: "خرید",
    prompt: "Role-play shopping for clothes or groceries. You are the shop assistant.",
  },
  {
    id: "class",
    label: "کلاس درس",
    prompt: "Role-play a short classroom dialogue in the target language. You are the teacher.",
  },
  {
    id: "free",
    label: "آزاد",
    prompt: "Free conversation. Wait for the learner to start or gently open a topic.",
  },
];

export type Lang = {
  id: string;
  label: string;
  native: string;
  locale: string;
  dir: "rtl" | "ltr";
};

export const LANGS: Lang[] = [
  { id: "fa", label: "فارسی", native: "فارسی", locale: "fa-IR", dir: "rtl" },
  { id: "en", label: "English", native: "English", locale: "en-US", dir: "ltr" },
  { id: "ar", label: "عربی", native: "العربية", locale: "ar-SA", dir: "rtl" },
  { id: "fr", label: "فرانسوی", native: "Français", locale: "fr-FR", dir: "ltr" },
  { id: "de", label: "آلمانی", native: "Deutsch", locale: "de-DE", dir: "ltr" },
  { id: "es", label: "اسپانیایی", native: "Español", locale: "es-ES", dir: "ltr" },
  { id: "tr", label: "ترکی", native: "Türkçe", locale: "tr-TR", dir: "ltr" },
  { id: "it", label: "ایتالیایی", native: "Italiano", locale: "it-IT", dir: "ltr" },
  { id: "pt", label: "پرتغالی", native: "Português", locale: "pt-BR", dir: "ltr" },
  { id: "ru", label: "روسی", native: "Русский", locale: "ru-RU", dir: "ltr" },
  { id: "zh", label: "چینی", native: "中文", locale: "zh-CN", dir: "ltr" },
  { id: "ja", label: "ژاپنی", native: "日本語", locale: "ja-JP", dir: "ltr" },
  { id: "ko", label: "کره‌ای", native: "한국어", locale: "ko-KR", dir: "ltr" },
  { id: "hi", label: "هندی", native: "हिन्दी", locale: "hi-IN", dir: "ltr" },
];

export function langById(id: string) {
  return LANGS.find((l) => l.id === id) ?? LANGS[0];
}

export function localeForLangCode(code: LangCode | string) {
  const fromTeach = LANGUAGES.find((l) => l.code === code);
  if (fromTeach) return fromTeach.locale;
  return langById(code).locale;
}
