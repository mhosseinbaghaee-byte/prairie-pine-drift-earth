import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { Level } from "./topics";
import type { LangCode } from "./topics";

const MessageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().min(1).max(6000),
});

const ChatInput = z.object({
  messages: z.array(MessageSchema).min(1).max(16),
  level: z.enum(["kid", "teen", "adult"]),
  mode: z.enum(["chat", "daily", "lesson", "live"]),
  lang: z.string().optional(), // target language code when mode === "live"
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

export type ChatMode = "chat" | "daily" | "lesson" | "live";
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

const LANG_NAMES: Record<string, string> = {
  en: "English",
  fr: "French",
  de: "German",
  es: "Spanish",
  it: "Italian",
  tr: "Turkish",
  ar: "Arabic",
  ru: "Russian",
  zh: "Chinese (Mandarin)",
  ja: "Japanese",
  ko: "Korean",
  pt: "Portuguese",
};

function systemPrompt(level: Level, mode: ChatMode, lang?: string) {
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

  if (mode === "live") {
    const target = LANG_NAMES[lang ?? "en"] ?? "English";
    return `You are «پویا» (Pouya), a warm, slightly playful felt-character language coach on a red stage.

Your job right now is LIVE CONVERSATION PRACTICE and language teaching for ${target}.

Core rules:
1. The learner's native language is Persian (Farsi). They may write in Persian, ${target}, or mixed.
2. Most of your spoken replies should be in ${target} so they get maximum practice.
3. When you correct a mistake or explain grammar/vocab, briefly switch to clear Persian so they understand, then continue in ${target}.
4. Keep turns short and natural (1–4 sentences). This is conversation, not a lecture.
5. Gently correct important mistakes: show the better version, explain why in one short Persian sentence if needed, then keep the conversation flowing.
6. Ask one natural follow-up question almost every turn so the dialogue continues.
7. Adapt difficulty to the learner's level (${level}).
8. Never invent facts. Stay friendly and encouraging.
9. If the learner asks for translation, grammar tip, or "how do I say X", answer clearly then return to conversation.
10. Personality: warm, curious, a little humorous — never robotic or overly formal.

Start or continue the conversation naturally based on the history.`;
  }

  return `${base}

حالت گفتگو:
اگر سؤال باز است، یک پاسخ کامل بده و در آخر یک سؤال کوتاه بپرس تا گفتگو ادامه پیدا کند.
اگر کاربر خواست آزمون یا درس، همان را بده.`;
}

// ---------------------------------------------------------------------------
// Multi-provider AI layer
//
// The app no longer depends on a single vendor. Each provider below reads its
// own API key from the environment; only providers with a key set are tried.
// Order of attempts is controlled by AI_PROVIDER_ORDER (comma separated,
// e.g. "anthropic,openai,xai,gemini"). If unset, the default order below is
// used. The first provider that returns a successful, non-empty response
// wins — if it fails or its key is missing, the next one in line is tried
// automatically, so the app keeps working even if one vendor is down, out of
// quota, or simply not configured.
// ---------------------------------------------------------------------------

type ChatMsg = { role: "user" | "assistant"; content: string };
type ChatResult = { ok: true; text: string } | { ok: false; error: string };

const DEFAULT_PROVIDER_ORDER = ["anthropic", "openai", "xai", "gemini"] as const;
type ProviderName = (typeof DEFAULT_PROVIDER_ORDER)[number];

function providerOrder(): ProviderName[] {
  const raw = process.env.AI_PROVIDER_ORDER;
  if (!raw) return [...DEFAULT_PROVIDER_ORDER];
  const list = raw
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter((s): s is ProviderName => (DEFAULT_PROVIDER_ORDER as readonly string[]).includes(s));
  return list.length ? list : [...DEFAULT_PROVIDER_ORDER];
}

async function callXai(system: string, history: ChatMsg[], maxTokens: number): Promise<ChatResult | null> {
  const apiKey = process.env.XAI_API_KEY;
  if (!apiKey) return null;
  try {
    const res = await fetch("https://api.x.ai/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: process.env.XAI_MODEL || "grok-4.5",
        messages: [{ role: "system", content: system }, ...history],
        max_tokens: maxTokens,
        temperature: 0.75,
      }),
    });
    if (!res.ok) return { ok: false, error: res.status === 403 ? "quota" : "unavailable" };
    const body = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    const text = body.choices?.[0]?.message?.content?.trim() ?? "";
    if (!text) return { ok: false, error: "empty response" };
    return { ok: true, text };
  } catch {
    return { ok: false, error: "unavailable" };
  }
}

async function callOpenAI(system: string, history: ChatMsg[], maxTokens: number): Promise<ChatResult | null> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;
  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || "gpt-4o-mini",
        messages: [{ role: "system", content: system }, ...history],
        max_tokens: maxTokens,
        temperature: 0.75,
      }),
    });
    if (!res.ok) return { ok: false, error: res.status === 429 ? "quota" : "unavailable" };
    const body = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    const text = body.choices?.[0]?.message?.content?.trim() ?? "";
    if (!text) return { ok: false, error: "empty response" };
    return { ok: true, text };
  } catch {
    return { ok: false, error: "unavailable" };
  }
}

async function callAnthropic(system: string, history: ChatMsg[], maxTokens: number): Promise<ChatResult | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;
  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: process.env.ANTHROPIC_MODEL || "claude-sonnet-4-5",
        system,
        messages: history,
        max_tokens: maxTokens,
        temperature: 0.75,
      }),
    });
    if (!res.ok) return { ok: false, error: res.status === 429 ? "quota" : "unavailable" };
    const body = (await res.json()) as { content?: { type: string; text?: string }[] };
    const text = (body.content ?? [])
      .filter((b) => b.type === "text")
      .map((b) => b.text ?? "")
      .join("")
      .trim();
    if (!text) return { ok: false, error: "empty response" };
    return { ok: true, text };
  } catch {
    return { ok: false, error: "unavailable" };
  }
}

async function callGemini(system: string, history: ChatMsg[], maxTokens: number): Promise<ChatResult | null> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  try {
    const model = process.env.GEMINI_MODEL || "gemini-2.0-flash";
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: system }] },
          contents: history.map((m) => ({
            role: m.role === "assistant" ? "model" : "user",
            parts: [{ text: m.content }],
          })),
          generationConfig: { maxOutputTokens: maxTokens, temperature: 0.75 },
        }),
      },
    );
    if (!res.ok) return { ok: false, error: res.status === 429 ? "quota" : "unavailable" };
    const body = (await res.json()) as {
      candidates?: { content?: { parts?: { text?: string }[] } }[];
    };
    const text = (body.candidates?.[0]?.content?.parts ?? [])
      .map((p) => p.text ?? "")
      .join("")
      .trim();
    if (!text) return { ok: false, error: "empty response" };
    return { ok: true, text };
  } catch {
    return { ok: false, error: "unavailable" };
  }
}

const PROVIDERS: Record<ProviderName, typeof callXai> = {
  xai: callXai,
  openai: callOpenAI,
  anthropic: callAnthropic,
  gemini: callGemini,
};

/**
 * Try each configured AI provider in order until one succeeds.
 * Providers with no API key set are skipped silently. A provider that
 * returns an error (quota, network, empty response) is logged and the next
 * one is tried. If every provider fails, the last error is returned.
 */
async function chatComplete(system: string, history: ChatMsg[], maxTokens: number): Promise<ChatResult> {
  let lastError = "AI is not available";
  let triedAny = false;

  for (const name of providerOrder()) {
    const call = PROVIDERS[name];
    const result = await call(system, history, maxTokens);
    if (result === null) continue; // no API key for this provider
    triedAny = true;
    if (result.ok) return result;
    console.error(`[pouya-ai] provider "${name}" failed:`, result.error);
    lastError = result.error;
  }

  if (!triedAny) {
    return {
      ok: false,
      error:
        "No AI provider is configured. Set at least one of ANTHROPIC_API_KEY, OPENAI_API_KEY, XAI_API_KEY, or GEMINI_API_KEY.",
    };
  }
  return { ok: false, error: lastError };
}

export const askPouya = createServerFn({ method: "POST" })
  .validator((input: unknown) => ChatInput.parse(input))
  .handler(async ({ data }) => {
    const maxTokens = data.mode === "lesson" ? 900 : data.mode === "live" ? 450 : 800;
    return chatComplete(systemPrompt(data.level, data.mode, data.lang), data.messages, maxTokens);
  });

export const makeQuiz = createServerFn({ method: "POST" })
  .validator((input: unknown) => QuizInput.parse(input))
  .handler(async ({ data }) => {
    const system = `تو طراح آزمون آموزشی هستی. فقط JSON معتبر برگردان، بدون markdown و بدون توضیح اضافه.
شکل دقیق:
{"topic":"string","questions":[{"q":"string","options":["a","b","c","d"],"correct":0,"why":"string"}]}
قوانین:
- دقیقاً ۵ سؤال چهارگزینه‌ای
- correct ایندکس ۰ تا ۳ است
- گزینه‌ها کوتاه و متمایز
- why یک توضیح ۲ تا ۳ جمله‌ای درست و آموزنده
- زبان فارسی روان
- ${levelLine(data.level)}
- واقعیت ساختگی نساز`;

    const result = await chatComplete(
      system,
      [{ role: "user", content: `آزمون اطلاعات عمومی / آموزشی درباره: ${data.topic}` }],
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
    const system = `تو پویا هستی. یک «دانستی امروز» کوتاه، زنده و دقیق بنویس.
ساختار: عنوان یک خطی، بعد ۳ تا ۵ جمله، بعد یک جمله «چرا مهم است».
فارسی روان. بدون ایموجی. ${levelLine(data.level)} واقعیت ساختگی نساز.`;

    return chatComplete(
      system,
      [{ role: "user", content: "دانستی امروز را بگو؛ موضوع را خودت انتخاب کن، غافلگیرکننده باشد." }],
      400,
    );
  });

// ---------------------------------------------------------------------------
// Text-to-speech
//
// Only xAI and OpenAI are wired for TTS today (Anthropic and Gemini don't
// offer a comparable simple TTS endpoint at time of writing). xAI is tried
// first if configured, then OpenAI. If neither key is present, voice is
// simply unavailable and the app falls back to text-only silently.
// ---------------------------------------------------------------------------

async function speakXai(text: string): Promise<{ ok: true; audio: string; mime: string } | null> {
  const apiKey = process.env.XAI_API_KEY;
  if (!apiKey) return null;
  const res = await fetch("https://api.x.ai/v1/tts", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      text,
      voice_id: "zagan",
      language: "auto",
      output_format: { codec: "mp3", sample_rate: 24000, bit_rate: 96000 },
      speed: 1.0,
    }),
  });
  if (!res.ok) return null;
  const buf = Buffer.from(await res.arrayBuffer());
  return { ok: true, audio: buf.toString("base64"), mime: "audio/mpeg" };
}

async function speakOpenAI(text: string): Promise<{ ok: true; audio: string; mime: string } | null> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;
  const res = await fetch("https://api.openai.com/v1/audio/speech", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: process.env.OPENAI_TTS_MODEL || "tts-1",
      voice: process.env.OPENAI_TTS_VOICE || "alloy",
      input: text,
      response_format: "mp3",
    }),
  });
  if (!res.ok) return null;
  const buf = Buffer.from(await res.arrayBuffer());
  return { ok: true, audio: buf.toString("base64"), mime: "audio/mpeg" };
}

export const speakPouya = createServerFn({ method: "POST" })
  .validator((input: unknown) => SpeakInput.parse(input))
  .handler(async ({ data }) => {
    const text = data.text.replace(/[*_`#>-]/g, " ").replace(/\s+/g, " ").trim().slice(0, 420);

    const xai = await speakXai(text);
    if (xai) return xai;

    const openai = await speakOpenAI(text);
    if (openai) return openai;

    return { ok: false as const, error: "unavailable" };
  });
