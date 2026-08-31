export type Level = "kid" | "teen" | "adult";

export const LEVELS: { id: Level; label: string; hint: string }[] = [
  { id: "kid", label: "ساده", hint: "مثل توضیح برای یک کنجکاو ده ساله" },
  { id: "teen", label: "متوسط", hint: "دقیق، با مثال و کمی عمق" },
  { id: "adult", label: "عمیق", hint: "دانشگاهی، با nuance و منبع فکر" },
];

export type Topic = {
  id: string;
  label: string;
  prompt: string;
};

export const TOPICS: Topic[] = [
  {
    id: "science",
    label: "علوم",
    prompt: "یک درس کوتاه و زنده درباره یک مفهوم علمی جذاب بده که خیلی‌ها اشتباه می‌فهمند.",
  },
  {
    id: "history",
    label: "تاریخ",
    prompt: "یک داستان تاریخی کمترشنیده‌شده بگو و توضیح بده چرا هنوز به کار امروز می‌آید.",
  },
  {
    id: "geo",
    label: "جغرافیا",
    prompt: "یک جای شگفت‌انگیز روی زمین را معرفی کن و بگو چه چیزی آن را خاص کرده.",
  },
  {
    id: "math",
    label: "ریاضی",
    prompt: "یک ایده ریاضی را طوری توضیح بده که حس کشف داشته باشد، نه فرمول خشک.",
  },
  {
    id: "lang",
    label: "زبان",
    prompt: "یک نکته زبانی فارسی یا مقایسه فارسی و انگلیسی که enticing باشد درس بده.",
  },
  {
    id: "health",
    label: "سلامت",
    prompt: "یک باور رایج درباره بدن یا مغز را بررسی کن و نسخه دقیق‌ترش را بگو.",
  },
  {
    id: "tech",
    label: "فناوری",
    prompt: "یک مفهوم فناوری را ساده، درست و بدون هیاهو توضیح بده.",
  },
  {
    id: "culture",
    label: "فرهنگ",
    prompt: "یک تکه از فرهنگ ایران یا جهان را باز کن؛ معنی، ریشه، و یک جزئیات غافلگیرکننده.",
  },
  {
    id: "gk",
    label: "اطلاعات عمومی",
    prompt: "یک واقعیت عمومی جذاب بگو، بعد لایه‌های پشت آن را باز کن تا فقط حفظی نباشد.",
  },
];

export const QUIZ_TOPICS = [
  "اطلاعات عمومی",
  "علوم",
  "تاریخ ایران",
  "جغرافیای جهان",
  "فضا",
  "بدن انسان",
  "ادبیات فارسی",
  "فناوری",
];

/** Languages Pouya can teach / practice live conversation in */
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
  | "pt";

export const LANGUAGES: {
  code: LangCode;
  label: string;
  native: string;
  flag: string;
}[] = [
  { code: "en", label: "انگلیسی", native: "English", flag: "🇬🇧" },
  { code: "fr", label: "فرانسوی", native: "Français", flag: "🇫🇷" },
  { code: "de", label: "آلمانی", native: "Deutsch", flag: "🇩🇪" },
  { code: "es", label: "اسپانیایی", native: "Español", flag: "🇪🇸" },
  { code: "it", label: "ایتالیایی", native: "Italiano", flag: "🇮🇹" },
  { code: "tr", label: "ترکی", native: "Türkçe", flag: "🇹🇷" },
  { code: "ar", label: "عربی", native: "العربية", flag: "🇸🇦" },
  { code: "ru", label: "روسی", native: "Русский", flag: "🇷🇺" },
  { code: "zh", label: "چینی", native: "中文", flag: "🇨🇳" },
  { code: "ja", label: "ژاپنی", native: "日本語", flag: "🇯🇵" },
  { code: "ko", label: "کره‌ای", native: "한국어", flag: "🇰🇷" },
  { code: "pt", label: "پرتغالی", native: "Português", flag: "🇵🇹" },
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
