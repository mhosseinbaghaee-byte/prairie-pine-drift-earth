import { LESSONS, matchLesson, todayFact, localDaily, localLanguage } from "./library-data";

export function localTutorReply(opts: {
  messages: { role: "user" | "assistant"; content: string }[];
  mode: "chat" | "daily" | "lesson" | "live" | "language";
  lang?: string;
}): string {
  const lastRaw = opts.messages[opts.messages.length - 1]?.content ?? "";
  const last = lastRaw.trim();
  const lastLower = last.toLowerCase();
  const prevAssistant = [...opts.messages].reverse().find((m) => m.role === "assistant")?.content ?? "";
  const userTurns = opts.messages.filter((m) => m.role === "user");

  if (opts.mode === "daily") return localDaily(opts.messages);
  if (opts.mode === "live" || opts.mode === "language") {
    return localLanguage(opts.lang || "fa", last, opts.messages.length);
  }
  if (last.includes("دانستی") || last.includes("غافلگیر")) return todayFact();

  // سؤالات درباره خود پویا / مدل — نباید برود سراغ درس کوتاه
  const metaHints = [
    "مدل",
    "هوش مصنوعی",
    "از کجا",
    "کی هستی",
    "کیستی",
    "چه مدلی",
    "api",
    "جی‌پی‌تی",
    "gpt",
    "gemini",
    "claude",
    "grok",
    "گروک",
    "ربات",
    "چت‌بات",
    "چت بات",
  ];
  if (metaHints.some((h) => lastLower.includes(h.toLowerCase()) || last.includes(h))) {
    return (
      "من پویا هستم؛ مربی آموزشی همین اپ.\n\n" +
      "جواب‌هایم از مدل هوش مصنوعی می‌آید (وقتی کلید سرویس وصل باشد). " +
      "من انسان نیستم و حافظه شخصی واقعی ندارم — روی همین گفتگو کمکت می‌کنم.\n\n" +
      "هر سؤالی داری همان را بپرس؛ مستقیم جواب می‌دهم."
    );
  }

  const greetings = ["سلام", "درود", "hi", "hello", "hey", "صبح بخیر", "عصر بخیر", "شب بخیر"];
  const isGreeting = greetings.some(
    (g) =>
      lastLower === g ||
      lastLower.startsWith(g + " ") ||
      lastLower.startsWith(g + "!") ||
      lastLower.startsWith(g + "؟"),
  );
  const ack = ["خوبی", "خوبی؟", "چطوری", "چطوری؟", "چه خبر", "چه خبر؟", "مرسی", "ممنون", "باشه", "اوکی", "ok", "okay", "آره", "بله", "نه"];
  const isAck = ack.some((a) => lastLower === a || lastLower === a + "?" || lastLower === a + "؟");

  if (isGreeting) {
    if (userTurns.length <= 1) {
      return `سلام! من پویام — مربی زنده‌ات.\n\nچی دوست داری الان؟\n• یک مفهوم علمی یا تاریخی\n• تمرین زبان\n• آزمون کوتاه\n• یا مرور روزانه\n\nهمین‌جا بپرس، یا از دکمه‌های بالا یکی را بزن.`;
    }
    return `سلام دوباره. ادامه بدهیم؟ موضوع قبلی را باز کنیم یا چیز تازه‌ای بپرسی.`;
  }

  if (isAck) {
    return `خوبم، ممنون. آماده‌ام.\n\nسؤالت را مستقیم بنویس — مثلاً «چرخ چیست؟» یا «گرانش یعنی چه؟»`;
  }

  const lesson = matchLesson(last);
  if (lesson) {
    const replyText = `${lesson.title}\n\n${lesson.body}`;
    if (replyText === prevAssistant) {
      return `همین موضوع را یک‌بار گفتم. می‌خواهی عمیق‌ترش کنم، مثال روزمره بزنم، یا برویم سراغ موضوع بعدی؟`;
    }
    return replyText;
  }

  if (opts.mode === "lesson") {
    const pick = LESSONS[Math.floor(Date.now() / 86_400_000) % LESSONS.length];
    return `${pick.title}\n\n${pick.body}`;
  }

  // پاسخ عمومی: موضوع را عوض نکن؛ از کاربر بخواه واضح‌تر بپرسد فقط اگر خیلی مبهم است
  if (last.length >= 2) {
    return (
      `سؤالت را گرفتم: «${last.slice(0, 120)}».\n\n` +
      `الان اتصال مدل کامل در دسترس نیست؛ با دانش آماده‌ام جواب می‌دهم.\n` +
      `اگر منظورت تعریف یا توضیح همان موضوع است، یک‌بار دیگر با جمله کامل بپرس — مثلاً «چرخ چیست و چه کاربردی دارد؟» تا دقیق‌تر جواب بدهم.`
    );
  }

  return `من پویام. موضوع را مشخص بپرس — مثلاً «چرخ چیست؟» یا «گرانش یعنی چه؟»\nاگر میکروفون را بزنی با صدا هم حرف می‌زنیم.`;
}
