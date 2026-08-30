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
  mode: z.enum(["chat", "daily", "lesson", "live"]),
  lang: z.string().optional(),
});

const QuizInput = z.object({ topic: z.string().min(1).max(80), level: z.enum(["kid", "teen", "adult"]) });
const SpeakInput = z.object({ text: z.string().min(1).max(800) });
const FactInput = z.object({ level: z.enum(["kid", "teen", "adult"]) });

export type ChatMode = "chat" | "daily" | "lesson" | "live";
export type QuizQuestion = { q: string; options: [string, string, string, string]; correct: number; why: string };
export type QuizPayload = { topic: string; questions: QuizQuestion[] };

type ChatMsg = { role: "user" | "assistant"; content: string };
type ChatResult = { ok: true; text: string } | { ok: false; error: string };

type ProviderName = "xai" | "openai" | "anthropic" | "gemini";
const DEFAULT_PROVIDER_ORDER: ProviderName[] = ["gemini"];

function levelLine(level: Level) {
  if (level === "kid") return "سطح: خیلی ساده، تصویری، جمله‌های کوتاه. مثل توضیح برای یک کودک کنجکاو.";
  if (level === "teen") return "سطح: دبیرستان. دقیق، با مثال، بدون ساده‌سازی غلط.";
  return "سطح: عمیق. nuance، سازوکار، و محدودیت ادعا را بگو.";
}

const LANG_NAMES: Record<string, string> = {
  en: "English", fr: "French", de: "German", es: "Spanish", it: "Italian", tr: "Turkish",
  ar: "Arabic", ru: "Russian", zh: "Chinese (Mandarin)", ja: "Japanese", ko: "Korean", pt: "Portuguese",
};

function systemPrompt(level: Level, mode: ChatMode, lang?: string) {
  const base = `تو «پویا» هستی: مربی نمدی زنده برای آموزش و اطلاعات عمومی.
شخصیت: گرم، کنجکاو، کمی شوخ و صمیمی؛ مثل یک معلم استاپ‌موشن روی صحنه قرمز، نه یک ربات خشک.
قوانین سخت:
- به زبان کاربر جواب بده. اگر فارسی نوشت، فارسی روان و طبیعی بنویس.
- ${levelLine(level)}
- اول اصل مطلب را روشن بگو، بعد در صورت نیاز عمیق‌تر شو.
- واقعیت ساختگی نساز. اگر مطمئن نیستی، صریح بگو.
- لحن گفتاری و زنده. از ایموجی استفاده نکن.
- پاراگراف‌های کوتاه. پاسخ معمولاً ۱۸۰ تا ۷۰۰ کلمه باشد.`;

  if (mode === "daily") return `${base}

حالت مرور روزانه / مغز دوم:
مثل یک مصاحبه‌گر شخصی باش. هر نوبت ۳ تا ۵ سؤال کوتاه بپرس. موضوع‌ها: کار امروز، پیشرفت، تصمیم، یادگیری، ایده، پیگیری و تمرکز بعدی. چیزی اختراع نکن.`;
  if (mode === "lesson") return `${base}

حالت درس کوتاه:
عنوان، ایده اصلی، سه بخش کوتاه، یک مثال ملموس و یک سؤال پایانی برای فکر کردن بده.`;
  if (mode === "live") {
    const target = LANG_NAMES[lang ?? "en"] ?? "English";
    return `You are Pouya, a warm, slightly playful felt-character language coach.
Practice ${target} with a Persian-speaking learner.
Keep replies short and natural (1–4 sentences), mostly in ${target}. Correct important mistakes gently and explain corrections briefly in Persian. Ask one natural follow-up question. Adapt difficulty to ${level}. Never invent facts.`;
  }
  return `${base}

حالت گفتگو:
اگر سؤال باز است، پاسخ کامل بده و در پایان یک سؤال کوتاه برای ادامه گفتگو بپرس.`;
}

function providerOrder(): ProviderName[] {
  return ["gemini"];
}

async function readError(res: Response): Promise<string> {
  try {
    const body = (await res.json()) as { error?: { message?: string } | string; message?: string };
    if (typeof body.error === "string") return body.error;
    if (body.error?.message) return body.error.message;
    if (body.message) return body.message;
  } catch {}
  return `HTTP ${res.status}`;
}

async function callGemini(system: string, history: ChatMsg[], maxTokens: number): Promise<ChatResult | null> {
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  if (!apiKey) return { ok: false, error: "Gemini API key is not configured on Vercel." };
  try {
    const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: system }] },
        contents: history.map((m) => ({ role: m.role === "assistant" ? "model" : "user", parts: [{ text: m.content }] })),
        generationConfig: { maxOutputTokens: maxTokens },
      }),
    });
    if (!res.ok) return { ok: false, error: `Gemini ${res.status}: ${await readError(res)}` };
    const body = (await res.json()) as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> };
    const text = (body.candidates?.[0]?.content?.parts ?? []).map((p) => p.text ?? "").join("").trim();
    return text ? { ok: true, text } : { ok: false, error: "Gemini returned an empty response" };
  } catch {
    return { ok: false, error: "Gemini network error" };
  }
}

async function chatComplete(system: string, history: ChatMsg[], maxTokens: number): Promise<ChatResult> {
  return (await callGemini(system, history, maxTokens)) ?? { ok: false, error: "Gemini is unavailable" };
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
    const system = `تو طراح آزمون آموزشی هستی. فقط JSON معتبر برگردان، بدون markdown.
شکل دقیق: {"topic":"string","questions":[{"q":"string","options":["a","b","c","d"],"correct":0,"why":"string"}]}
دقیقاً ۵ سؤال بساز. correct بین ۰ تا ۳. زبان فارسی روان. ${levelLine(data.level)}`;
    const result = await chatComplete(system, [{ role: "user", content: `آزمون آموزشی درباره: ${data.topic}` }], 1200);
    if (!result.ok) return result;
    const jsonText = result.text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
    try {
      const parsed = JSON.parse(jsonText) as QuizPayload;
      if (!Array.isArray(parsed.questions) || parsed.questions.length < 4) return { ok: false as const, error: "آزمون ناقص برگشت" };
      const questions = parsed.questions.slice(0, 5).map((q) => ({
        q: String(q.q ?? ""),
        options: (q.options ?? []).slice(0, 4).map(String) as QuizQuestion["options"],
        correct: Math.min(3, Math.max(0, Number(q.correct) || 0)),
        why: String(q.why ?? ""),
      }));
      if (questions.some((q) => !q.q || q.options.length !== 4)) return { ok: false as const, error: "ساختار آزمون نامعتبر است" };
      return { ok: true as const, quiz: { topic: parsed.topic || data.topic, questions } satisfies QuizPayload };
    } catch {
      return { ok: false as const, error: "نتوانستم آزمون را بخوانم" };
    }
  });

export const dailyFact = createServerFn({ method: "POST" })
  .validator((input: unknown) => FactInput.parse(input))
  .handler(async ({ data }) => chatComplete(
    `تو پویا هستی. یک دانستی امروز کوتاه، زنده و دقیق بنویس. فارسی روان. بدون ایموجی. ${levelLine(data.level)}`,
    [{ role: "user", content: "یک دانستی غافلگیرکننده و واقعی بگو." }],
    400,
  ));

async function speakOpenAI(text: string): Promise<{ ok: true; audio: string; mime: string } | null> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;
  try {
    const res = await fetch("https://api.openai.com/v1/audio/speech", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({ model: process.env.OPENAI_TTS_MODEL || "tts-1", voice: process.env.OPENAI_TTS_VOICE || "alloy", input: text, response_format: "mp3" }),
    });
    if (!res.ok) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    return { ok: true, audio: buf.toString("base64"), mime: "audio/mpeg" };
  } catch {
    return null;
  }
}

export const speakPouya = createServerFn({ method: "POST" })
  .validator((input: unknown) => SpeakInput.parse(input))
  .handler(async ({ data }) => {
    const text = data.text.replace(/[*_`#>-]/g, " ").replace(/\s+/g, " ").trim().slice(0, 420);
    const openai = await speakOpenAI(text);
    if (openai) return openai;
    return { ok: false as const, error: "unavailable" };
  });
