import { LESSONS, matchLesson, todayFact, localDaily, localLanguage } from "./library-data";

// پوشش گسترده‌تر: عبارت مستقیم، محاوره‌ای، روش آسیب، و نشانه‌ی سوءاستفاده/گرومینگ.
export const SAFETY_RE =
  /(خودمو?\s*بکشم|خودکشی|خودزنی|آسیب.{0,4}به.{0,4}خود(م)?|زندگی.{0,6}(تمومه|بسه)|نمی.?خوام\s*(دیگه\s*)?زنده(\s*باشم|\s*بمونم)?|زنده\s*بودن.{0,6}(بسه|سخته)|می.?خوام\s*بمیرم|بمیرم\s*بهتره|بمیرم|قرص.{0,20}بمیرم|بمیرم.{0,20}قرص|کتک|می.?زنتم|سوءاستفاده|عکس.{0,12}(بد|نامناسب|برهنه)|فیلم.{0,12}(بد|نامناسب)|مجبورم\s*کرد|دست\s*(بهم|به من)\s*زد)/;

export function safetyReply(): string {
  return (
    "متأسفم که این حس را داری. تو تنها نیستی.\n\n" +
    "لطفاً با یک بزرگ‌تر مورد اعتماد حرف بزن یا با اورژانس اجتماعی (۱۲۳) تماس بگیر.\n" +
    "من جای انسان واقعی نیستم، اما برای سؤال درسی اینجام."
  );
}

export function localTutorReply(opts: {
  messages: { role: "user" | "assistant"; content: string }[];
  mode: "chat" | "daily" | "lesson" | "live" | "language";
  lang?: string;
}): string {
  const lastRaw = opts.messages[opts.messages.length - 1]?.content ?? "";
  const last = lastRaw.trim();
  if (SAFETY_RE.test(last)) return safetyReply();
  const lastLower = last.toLowerCase();
  const prevAssistant = [...opts.messages].reverse().find((m) => m.role === "assistant")?.content ?? "";
  const userTurns = opts.messages.filter((m) => m.role === "user");

  if (opts.mode === "daily") return localDaily(opts.messages);
  if (opts.mode === "live" || opts.mode === "language") return localLanguage(opts.lang || "fa", last, opts.messages.length);
  if (last.includes("دانستی") || last.includes("غافلگیر")) return todayFact();

  const metaHints = ["مدل","هوش مصنوعی","از کجا","کی هستی","کیستی","چه مدلی","api","جی‌پی‌تی","gpt","gemini","claude","grok","گروک","ربات","چت‌بات","چت بات"];
  if (metaHints.some((h) => lastLower.includes(h.toLowerCase()) || last.includes(h))) {
    return "من پویا هستم؛ مربی آموزشی همین اپ.\n\nجواب‌هایم از مدل هوش مصنوعی می‌آید. من انسان نیستم و حافظه شخصی واقعی ندارم.\nهر سؤالی داری همان را بپرس; مستقیم جواب می‌دهم.";
  }

  const greetings = ["سلام","درود","hi","hello","hey","صبح بخیر","عصر بخیر","شب بخیر"];
  const isGreeting = greetings.some((g) => lastLower === g || lastLower.startsWith(g+" ") || lastLower.startsWith(g+"!") || lastLower.startsWith(g+"؟"));
  const ack = ["خوبی","خوبی؟","چطوری","چطوری؟","چه خبر","چه خبر؟","مرسی","ممنون","باشه","اوکی","ok","okay","آره","بله","نه"];
  const isAck = ack.some((a) => lastLower === a || lastLower === a+"?" || lastLower === a+"؟");

  if (isGreeting) {
    if (userTurns.length <= 1) return `سلام! من پویام — مربی زنده‌ات.\n\nچی دوست داری الان؟\n• یک مفهوم علمی یا تاریخی\n• تمرین زبان\n• آزمون کوتاه\n• یا مرور روزانه`;
    return `سلام دوباره. ادامه بدهیم؟ موضوع قبلی را باز کنیم یا چیز تازه‌ای بپرسی.`;
  }
  if (isAck) return `خوبم، ممنون. آماده‌ام.\n\nسؤالت را مستقیم بنویس.`;

  const lesson = matchLesson(last);
  if (lesson) {
    const replyText = `${lesson.title}\n\n${lesson.body}`;
    if (replyText === prevAssistant) return `همین موضوع را یک‌بار گفتم. می‌خواهی عمیق‌ترش کنم؟`;
    return replyText;
  }
  if (opts.mode === "lesson") {
    const pick = LESSONS[Math.floor(Date.now() / 86_400_000) % LESSONS.length];
    return `${pick.title}\n\n${pick.body}`;
  }
  if (last.length >= 2) {
    return `سؤالت را گرفتم: «${last.slice(0,120)}».\n\nالان اتصال مدل کامل در دسترس نیست؛ با دانش آماده‌ام جواب می‌دهم.\nاگر منظورت تعریف همان موضوع است، یک‌بار دیگر با جمله کامل بپرس.`;
  }
  return `من پویام. موضوع را مشخص بپرس.`;
}
