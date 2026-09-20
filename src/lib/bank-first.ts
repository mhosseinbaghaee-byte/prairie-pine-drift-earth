import { localDaily, matchLesson, todayFact } from "./library-data";
import { localTutorReply } from "./library-reply";

type Msg = { role: "user" | "assistant"; content: string };

const GREET = ["سلام", "درود", "hi", "hello", "hey", "صبح بخیر", "عصر بخیر", "شب بخیر"];
const ACK = ["خوبی", "چطوری", "چه خبر", "مرسی", "ممنون", "باشه", "اوکی", "ok", "okay", "آره", "بله", "نه"];
// سؤال‌هایی که جواب کوتاه بانک کافی نیست و باید مدل واقعی جواب بدهد
const DEEP = /(کامل|بیشتر|عمیق|مفصل|مثال|چرا|چطور|چگونه|مقایسه|فرق|تفاوت|حل کن|محاسبه|بنویس|ترجمه|دوباره|ساده‌تر|ساده تر|\d|[۰-۹])/;

/**
 * اولویت اقتصادی: اگر بانک محلی «جواب مطمئن» دارد همان را برمی‌گرداند (بدون هزینه‌ی توکن)،
 * وگرنه null تا سراغ Gemini رایگان و بعد لیارا برویم.
 * تمرین زبان (live/language) هیچ‌وقت از بانک جواب نمی‌گیرد چون گفتگوی واقعی لازم دارد.
 */
export function bankReply(opts: {
  messages: Msg[];
  mode: "chat" | "daily" | "lesson" | "live" | "language";
  lang?: string;
}): string | null {
  const { messages, mode } = opts;
  if (mode === "live" || mode === "language") return null;
  if (mode === "daily") return localDaily(messages);
  const last = (messages[messages.length - 1]?.content ?? "").trim();
  if (!last || last.length > 100) return null;
  const lower = last.toLowerCase();

  if (last.includes("دانستی") || last.includes("غافلگیر")) return todayFact();

  const isGreeting = GREET.some(
    (g) => lower === g || lower.startsWith(g + " ") || lower.startsWith(g + "!") || lower.startsWith(g + "؟"),
  );
  const isAck = ACK.some((a) => lower === a || lower === a + "?" || lower === a + "؟");
  if (isGreeting || isAck) return localTutorReply({ messages, mode: "chat", lang: opts.lang });

  if (DEEP.test(last)) return null;
  const lesson = matchLesson(last);
  if (!lesson) return null;
  const text = `${lesson.title}\n\n${lesson.body}`;
  // اگر همین درس را قبلاً گفته‌ایم، کاربر جواب عمیق‌تری می‌خواهد → مدل
  const prev = [...messages].reverse().find((m) => m.role === "assistant")?.content ?? "";
  if (prev.startsWith(text.slice(0, 60))) return null;
  return text;
}
