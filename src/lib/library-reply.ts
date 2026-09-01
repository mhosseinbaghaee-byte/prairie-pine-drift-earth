import { LESSONS, matchLesson, todayFact, localDaily, localLanguage } from "./library";

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

  const greetings = ["سلام", "درود", "hi", "hello", "hey", "صبح بخیر", "عصر بخیر", "شب بخیر"];
  const isGreeting = greetings.some((g) => lastLower === g || lastLower.startsWith(g + " ") || lastLower.startsWith(g + "!") || lastLower.startsWith(g + "؟"));
  const ack = ["خوبی", "خوبی؟", "چطوری", "چطوری؟", "چه خبر", "چه خبر؟", "مرسی", "ممنون", "باشه", "اوکی", "ok", "okay", "آره", "بله", "نه"];
  const isAck = ack.some((a) => lastLower === a || lastLower === a + "?" || lastLower === a + "؟");

  if (isGreeting) {
    if (userTurns.length <= 1) {
      return `سلام! من پویام — مربی زنده‌ات.\n\nچی دوست داری الان؟\n• یک مفهوم علمی یا تاریخی\n• تمرین زبان\n• آزمون کوتاه\n• یا مرور روزانه\n\nهمین‌جا بپرس، یا از دکمه‌های بالا یکی را بزن.`;
    }
    return `سلام دوباره. ادامه بدهیم؟ موضوع قبلی را باز کنیم یا چیز تازه‌ای بپرسی.`;
  }

  if (isAck) {
    return `خوبم، ممنون. آماده‌ام.\n\nاگر بخواهی می‌توانم:\n1) یک درس خیلی کوتاه بگویم\n2) ازت سؤال امتحانی بپرسم\n3) با هم زبان تمرین کنیم\n\nکدام را می‌خواهی؟ یا مستقیم سؤالت را بنویس.`;
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

  if (last.length >= 2 && last.length <= 80) {
    const variants = [
      `خوب پرسیدی. برای جواب دقیق‌تر یک موضوع مشخص بگو — مثلاً «گرانش چیست؟» یا «خزر دریا است یا دریاچه؟»\n\nیا از موضوع‌های علوم، تاریخ، ریاضی، زبان یکی را انتخاب کن.`,
      `متوجه شدم. اگر منظورت درس کوتاه است، موضوع را با یک کلمه بگو: نور، گرانش، اینترنت، خواب، صفر، خزر، نوروز…\n\nمن همان‌جا برایت بازش می‌کنم.`,
      `الان روی درس‌های آماده‌ام هستم. یک موضوع مشخص بپرس — مثلاً «اینترنت چطور کار می‌کند؟»`,
    ];
    const idx = Math.abs(hashStr(last + String(userTurns.length))) % variants.length;
    const pick = variants[idx];
    if (pick !== prevAssistant) return pick;
    return variants[(idx + 1) % variants.length];
  }

  return `من پویام. درس کوتاه، آزمون، تمرین زبان، یا مرور روزانه.\n\nموضوع را مشخص بپرس — مثلاً «گرانش چیست؟» یا «خزر دریا است یا دریاچه؟»\nاگر میکروفون را بزنی با صدا هم حرف می‌زنیم.`;
}

function hashStr(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return h;
}
