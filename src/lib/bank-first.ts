import { localDaily, matchLesson, todayFact } from "./library-data";
import { localTutorReply } from "./library-reply";
import { looksVisual } from "./wiki-image";

type Msg = { role: "user" | "assistant"; content: string };

const GREET = ["سلام", "درود", "hi", "hello", "hey", "صبح بخیر", "عصر بخیر", "شب بخیر"];
// این‌ها بدون توجه به تاریخچه، همیشه گفتگوی کوچک‌اند
const ACK = ["خوبی", "چطوری", "چه خبر", "مرسی", "ممنون"];
// این‌ها معمولاً جواب به سؤال قبلیـ پویا هستند (مثلاً «می‌خوای تمرین سخت‌تر بدم؟») —
// فقط وقتی این اولین پیام گفتگوست (بدون سابقه) بانک جوابشان را می‌دهد، وگرنه باید مدل با توجه به تاریخچه جواب بدهد.
const CONTEXTUAL_ACK = ["باشه", "اوکی", "ok", "okay", "آره", "بله", "نه"];
// عبارت‌هایی که یعنی کاربر جزئیات دقیق‌تری از یک موضوع کلی می‌خواهد —
// نسخه‌ی خاص («قانون دوم نیوتن») یا زندگی‌نامه («نیوتن کی بود؟») را نباید با متن کلیـ بانک جواب داد.
const DEEP =
  /(کامل|بیشتر|عمیق|مفصل|مثال|چرا|چطور|چگونه|مقایسه|فرق|تفاوت|حل کن|محاسبه|بنویس|ترجمه|دوباره|ساده‌تر|ساده تر|دوم|سوم|چهارم|پنجم|کی بود|چه کسی بود|کجا متولد|کجا به دنیا آمد|چند سالش بود|جمع|تفریق|ضرب|تقسیم|هم‌مخرج|\d|[۰-۹])/;

/**
 * فقط سلام/درس خیلی کوتاه — سؤال تصویری یا عمیق هرگز از بانک برنمی‌گردد.
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

  // سؤال تصویری / نشان بده → مدل + ویکی، نه سلام بانک
  if (looksVisual(last)) return null;

  const lower = last.toLowerCase();
  if (last.includes("دانستی") || last.includes("غافلگیر")) return todayFact();

  const greetWord = GREET.find(
    (g) => lower === g || lower.startsWith(g + " ") || lower.startsWith(g + "!") || lower.startsWith(g + "؟"),
  );
  const isAck = ACK.some((a) => lower === a || lower === a + "?" || lower === a + "؟");
  const isContextualAck = CONTEXTUAL_ACK.some((a) => lower === a || lower === a + "?" || lower === a + "؟");
  if (greetWord) {
    // «سلام اتم چیست» یا «سلام یه سوال دارم» فقط سلام نیست — هر چیزی جز یک تکه‌ی خیلی کوتاه بعد از سلام یعنی سؤال واقعی
    const rest = last.slice(greetWord.length).replace(/^[!،؛۔.\s]+/, "").trim();
    const restIsTrivial = rest.length <= 3 || ACK.some((a) => rest.toLowerCase().startsWith(a));
    if (rest && !restIsTrivial) return null;
    return localTutorReply({ messages, mode: "chat", lang: opts.lang });
  }
  if (isAck) return localTutorReply({ messages, mode: "chat", lang: opts.lang });
  // «بله/نه/باشه» تقریباً همیشه جواب یک سؤالـ پیشتر است، نه گفتگوی کوچک — بگذار مدل با توجه به تاریخچه جواب بدهد
  if (isContextualAck) return null;

  if (DEEP.test(last)) return null;
  const lesson = matchLesson(last);
  if (!lesson) return null;
  const text = `${lesson.title}\n\n${lesson.body}`;
  const prev = [...messages].reverse().find((m) => m.role === "assistant")?.content ?? "";
  if (prev.startsWith(text.slice(0, 60))) return null;
  return text;
}
