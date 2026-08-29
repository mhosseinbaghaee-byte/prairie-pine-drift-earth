import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { Level } from "./topics";

const MessageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().min(1).max(6000),
});

const ChatInput = z.object({
  messages: z.array(MessageSchema).min(1).max(16),
  level: z.enum(["kid", "teen", "adult"]),
  mode: z.enum(["chat", "daily", "lesson"]),
});

const QuizInput = z.object({
  topic: z.string().min(1).max(80),
  level: z.enum(["kid", "teen", "adult"]),
});

const SpeakInput = z.object({
  text: z.string().min(1).max(800),
});

const FactInput = z.object({
  level: z.enum(["kid", "teen", "adult"]),
});

export type ChatMode = "chat" | "daily" | "lesson";
export type QuizQuestion = {
  q: string;
  options: [string, string, string, string];
  correct: number;
  why: string;
};
export type QuizPayload = { topic: string; questions: QuizQuestion[] };

function levelLine(level: Level) {
  if (level === "kid") return "سطح: خیلی ساده، تصویری، جمله‌های کوتاه. مثل توضیح برای یک کودک کنجکاو.";
  if (level === "teen") return "سطح: دبیرستان. دقیق، با مثال، بدون ساده‌سازی غلط.";
  return "سطح: عمیق. nuance، سازوکار، و محدودیت ادعا را بگو.";
}

function systemPrompt(level: Level, mode: ChatMode) {
  const base = `تو «پویا» هستی: مربی نمدی زنده برای آموزش و اطلاعات عمومی.
شخصیت: گرم، کنجکاو، کمی شوخ، صمیمی — مثل یک معلم استاپ‌موشن روی صحنه قرمز، نه یک ربات خشک.
قوانین سخت:
- به زبان کاربر جواب بده. اگر فارسی نوشت، فارسی روان و طبیعی بنویس.
- ${levelLine(level)}
- اول اصل مطلب را روشن بگو، بعد در صورت نیاز عمیق‌تر شو.
- از تشبیه ملموس استفاده کن.
- واقعیت ساختگی نساز. اگر مطمئن نیستی، صریح بگو.
- لحن گفتاری و زنده. از ایموجی استفاده نکن.
- پاراگراف‌های کوتاه. در صورت نیاز لیست.
- پاسخ را بین ۱۸۰ تا ۷۰۰ کلمه نگه دار مگر اینکه کاربر خلاصه بخواهد.`;

  if (mode === "daily") {
    return `${base}

حالت مرور روزانه / مغز دوم:
مثل یک مصاحبه‌گر شخصی باش. هر نوبت ۳ تا ۵ سؤال کوتاه بپرس — نه بیشتر.
موضوع سؤال‌ها: کار امروز، پیشرفت، تصمیم، یادگیری، ایده، افراد، پیگیری، تمرکز بعدی.
اگر جواب کلی بود یک follow-up مفید بپرس.
وقتی اطلاعات کافی شد، یک یادداشت روزانه ساخت‌یافته پیشنهاد بده با عنوان‌های:
کارهای امروز / پیشرفت‌ها / تصمیمات / ایده‌ها / یادگیری‌ها / پیگیری‌ها / تمرکز بعدی
فقط بخش‌هایی را بنویس که محتوا دارند. اطلاعات را از حرف‌های کاربر بساز، چیزی اختراع نکن.
در پایان بپرس کدام بخش را در مغز دوم ذخیره کند.`;
  }

  if (mode === "lesson") {
    return `${base}

حالت درس کوتاه:
ساختار ثابت:
1) عنوان یک خطی
2) ایده اصلی در دو جمله
3) سه بخش کوتاه با زیرعنوان
4) یک مثال ملموس
5) یک سؤال پایانی برای فکر کردن
زنده و پویا بنویس، نه جزوه.`;
  }

  return `${base}

حالت گفتگو:
اگر سؤال باز است، یک پاسخ کامل بده و در آخر یک سؤال کوتاه بپرس تا گفتگو ادامه پیدا کند.
اگر کاربر خواست آزمون یا درس، همان را بده.`;
}

async function grokChat(
  messages: { role: "system" | "user" | "assistant"; content: string }[],
  maxTokens: number,
) {
  const apiKey = process.env.XAI_API_KEY;
  if (!apiKey) return { ok: false as const, error: "AI is not available" };

  const res = await fetch("https://api.x.ai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "grok-4.5",
      messages,
      max_tokens: maxTokens,
      temperature: 0.7,
    }),
  });

  if (!res.ok) {
    if (res.status === 403) return { ok: false as const, error: "quota" };
    return { ok: false as const, error: "unavailable" };
  }
  const body = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const text = body.choices?.[0]?.message?.content?.trim() ?? "";
  if (!text) return { ok: false as const, error: "پاسخ خالی آمد" };
  return { ok: true as const, text };
}

export const askPouya = createServerFn({ method: "POST" })
  .validator((input: unknown) => ChatInput.parse(input))
  .handler(async ({ data }) => {
    return grokChat(
      [
        { role: "system", content: systemPrompt(data.level, data.mode) },
        ...data.messages,
      ],
      data.mode === "lesson" ? 900 : 800,
    );
  });

export const makeQuiz = createServerFn({ method: "POST" })
  .validator((input: unknown) => QuizInput.parse(input))
  .handler(async ({ data }) => {
    const result = await grokChat(
      [
        {
          role: "system",
          content: `تو طراح آزمون آموزشی هستی. فقط JSON معتبر برگردان، بدون markdown و بدون توضیح اضافه.
شکل دقیق:
{"topic":"string","questions":[{"q":"string","options":["a","b","c","d"],"correct":0,"why":"string"}]}
قوانین:
- دقیقاً ۵ سؤال چهارگزینه‌ای
- correct ایندکس ۰ تا ۳ است
- گزینه‌ها کوتاه و متمایز
- why یک توضیح ۲ تا ۳ جمله‌ای درست و آموزنده
- زبان فارسی روان
- ${levelLine(data.level)}
- واقعیت ساختگی نساز`,
        },
        {
          role: "user",
          content: `آزمون اطلاعات عمومی / آموزشی درباره: ${data.topic}`,
        },
      ],
      1200,
    );
    if (!result.ok) return result;

    const jsonText = result.text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
    try {
      const parsed = JSON.parse(jsonText) as QuizPayload;
      if (!Array.isArray(parsed.questions) || parsed.questions.length < 4) {
        return { ok: false as const, error: "آزمون ناقص برگشت" };
      }
      const questions = parsed.questions.slice(0, 5).map((q) => ({
        q: String(q.q ?? ""),
        options: (q.options ?? []).slice(0, 4).map(String) as QuizQuestion["options"],
        correct: Math.min(3, Math.max(0, Number(q.correct) || 0)),
        why: String(q.why ?? ""),
      }));
      if (questions.some((q) => !q.q || q.options.length !== 4)) {
        return { ok: false as const, error: "ساختار آزمون نامعتبر است" };
      }
      return {
        ok: true as const,
        quiz: { topic: parsed.topic || data.topic, questions } satisfies QuizPayload,
      };
    } catch {
      return { ok: false as const, error: "نتوانستم آزمون را بخوانم" };
    }
  });

export const dailyFact = createServerFn({ method: "POST" })
  .validator((input: unknown) => FactInput.parse(input))
  .handler(async ({ data }) => {
    return grokChat(
      [
        {
          role: "system",
          content: `تو پویا هستی. یک «دانستی امروز» کوتاه، زنده و دقیق بنویس.
ساختار: عنوان یک خطی، بعد ۳ تا ۵ جمله، بعد یک جمله «چرا مهم است».
فارسی روان. بدون ایموجی. ${levelLine(data.level)} واقعیت ساختگی نساز.`,
        },
        { role: "user", content: "دانستی امروز را بگو؛ موضوع را خودت انتخاب کن، غافلگیرکننده باشد." },
      ],
      400,
    );
  });

export const speakPouya = createServerFn({ method: "POST" })
  .validator((input: unknown) => SpeakInput.parse(input))
  .handler(async ({ data }) => {
    const apiKey = process.env.XAI_API_KEY;
    if (!apiKey) return { ok: false as const, error: "AI is not available" };

    const text = data.text.replace(/[*_`#>-]/g, " ").replace(/\s+/g, " ").trim().slice(0, 420);
    const res = await fetch("https://api.x.ai/v1/tts", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        text,
        voice_id: "zagan",
        language: "auto",
        output_format: { codec: "mp3", sample_rate: 24000, bit_rate: 96000 },
        speed: 1.0,
      }),
    });
    if (!res.ok) return { ok: false as const, error: "unavailable" };
    const buf = Buffer.from(await res.arrayBuffer());
    return { ok: true as const, audio: buf.toString("base64"), mime: "audio/mpeg" };
  });
