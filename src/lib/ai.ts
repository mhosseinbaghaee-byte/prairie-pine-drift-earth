import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { localQuiz, localTutorReply, todayFact, type QuizPayload, type QuizQuestion } from "./library";
import { langById, type Level } from "./topics";
import { assistantSystemExtra } from "./assistants";

const MessageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().min(1).max(6000),
});

const ChatInput = z.object({
  messages: z.array(MessageSchema).min(1).max(16),
  level: z.enum(["kid", "teen", "adult"]).catch("teen"),
  mode: z.enum(["chat", "daily", "lesson", "live", "language"]).catch("chat"),
  lang: z.string().min(1).max(16).optional(),
  assistantId: z.string().min(1).max(40).optional(),
});

const QuizInput = z.object({
  topic: z.string().min(1).max(80),
  level: z.enum(["kid", "teen", "adult"]),
});

const SpeakInput = z.object({
  text: z.string().min(1).max(1200),
  lang: z.string().min(2).max(16).optional(),
});

const FactInput = z.object({
  level: z.enum(["kid", "teen", "adult"]),
});

export type ChatMode = "chat" | "daily" | "lesson" | "live" | "language";
export type { QuizQuestion, QuizPayload };

type ChatMsg = { role: "user" | "assistant"; content: string };
type ChatResult = { ok: true; text: string; provider?: string } | { ok: false; error: string };
type ProviderId = "openai" | "gemini";

// Gemini model names change; prefer current IDs first (see Google AI 404 messages).
const GEMINI_MODELS = ["gemini-3.6-flash", "gemini-3.5-flash-lite", "gemini-2.5-flash", "gemini-2.0-flash"];
const DEFAULT_ORDER: ProviderId[] = ["openai", "gemini"];

function levelLine(level: Level) {
  if (level === "kid") return "سطح: خیلی ساده، جمله‌های کوتاه، مثل کتاب ابتدایی/متوسطه اول.";
  if (level === "teen") return "سطح: متوسط / دبیرستان. دقیق، با مثال روزمره و کتاب درسی.";
  return "سطح: عمیق.";
}

function textbookStyleRules(level: Level) {
  if (level === "adult") {
    return (
      `- توضیح شفاف بنویس. از LaTeX خام مثل $...$ یا \\times یا \\text پرهیز کن؛ ` +
      `به‌جای آن از نماد ساده یونیکد استفاده کن: × ÷ ² ³ √.`
    );
  }
  return (
    `سبک آموزش (اجباری برای سطح ساده و متوسط):\n` +
    `- مثل کتاب درسی مدرسه ایران توضیح بده: ساده، مرحله‌به‌مرحله، واضح.\n` +
    `- هرگز LaTeX یا کد فرمول ننویس: نه $...$ نه \\times نه \\text نه \\frac نه کد انگلیسی times.\n` +
    `- ضرب: با علامت × یا کلمه «ضربدر».\n` +
    `- توان: بنویس «۲ به توان ۲» یا از نویسه ۲² استفاده کن (نه 2^2 داخل دلار).\n` +
    `- اعداد را ترجیحاً با رقم فارسی بنویس: ۱ ۲ ۳ …\n` +
    `- مثال درست: ۳ × ۲² = ۳ × ۴ = ۱۲\n` +
    `- مثال ممنوع: $3\\times2^2$ یا times 3$\\ 2^2$ یا \\text{ب.م.م}\n` +
    `- برای ب.م.م و ک.م.م همان واژه‌های فارسی کتاب را به کار ببر و با مثال عددی توضیح بده.\n` +
    `- اگر شک داری نماد پیچیده لازم است، به‌جایش با کلمه توضیح بده.`
  );
}

function sanitizeStudentMath(text: string, level: Level): string {
  if (level === "adult") return text;
  let t = text;
  t = t.replace(/\\times/gi, "×");
  t = t.replace(/\\div/gi, "÷");
  t = t.replace(/\\cdot/gi, "·");
  t = t.replace(/\\pm/gi, "±");
  t = t.replace(/\\leq/gi, "≤");
  t = t.replace(/\\geq/gi, "≥");
  t = t.replace(/\\neq/gi, "≠");
  t = t.replace(/\\approx/gi, "≈");
  t = t.replace(/\\sqrt\{([^}]*)\}/gi, "√($1)");
  t = t.replace(/\\frac\{([^}]*)\}\{([^}]*)\}/gi, "($1)÷($2)");
  t = t.replace(/\\text\{([^}]*)\}/gi, "$1");
  t = t.replace(/\\mathrm\{([^}]*)\}/gi, "$1");
  t = t.replace(/\$\$/g, "");
  t = t.replace(/\$/g, "");
  t = t.replace(/\\left|\\right/gi, "");
  t = t.replace(/\\,/g, " ");
  t = t.replace(/\\ /g, " ");
  t = t.replace(/(\d+)\^2/g, "$1²");
  t = t.replace(/(\d+)\^3/g, "$1³");
  t = t.replace(/\btimes\b/gi, "×");
  t = t.replace(/[ \t]+\n/g, "\n").replace(/\n{3,}/g, "\n\n");
  return t.trim();
}

function systemPrompt(level: Level, mode: ChatMode, langId?: string, assistantId?: string) {
  const lang = langById(langId || "fa");
  const coach = assistantSystemExtra(assistantId);
  const base =
    `تو «پویا» هستی: مربی زنده آموزش برای دانش‌آموزان ایران.\n` +
    `قوانین سخت:\n` +
    `- ${levelLine(level)}\n` +
    `- همیشه مستقیماً به همان سؤال کاربر جواب بده. موضوع را عوض نکن.\n` +
    `- اگر پرسید «چرخ چیست» درباره چرخ بگو؛ نرو سراغ درس تصادفی.\n` +
    `- اگر درباره خودت/مدل/از کجا بلدی پرسید، صادقانه و کوتاه بگو: دستیار آموزشی این اپ هستی و جواب از مدل AI می‌آید.\n` +
    `- فقط وقتی کاربر صریحاً درس کوتاه یا لیست موضوع خواست، حالت درس کوتاه بگیر.\n` +
    `- زبان پاسخ = زبان پیام کاربر. اگر فارسی نوشت فقط فارسی.\n` +
    `- لحن گرم و کوتاه. ایموجی نگذار.\n` +
    `- برای شکل هندسی از برچسب [shape:rhombus] و مشابه استفاده کن.\n` +
    `- ${textbookStyleRules(level)}` +
    (coach ? `\n\n${coach}` : "");
  if (mode === "live" || mode === "language") {
    return `${base}\nحالت تمرین زبان (${lang.native}). اگر کاربر فارسی خواست، فارسی جواب بده.`;
  }
  if (mode === "lesson") {
    return `${base}\nحالت درس کوتاه: عنوان، ایده اصلی، سه بخش ساده، مثال عددی، سؤال پایانی. بدون LaTeX.`;
  }
  return `${base}\nحالت گفتگو: مستقیم، مفید، به سبک کتاب درسی.`;
}

async function readError(res: Response) {
  try {
    const body = (await res.json()) as { error?: { message?: string } | string; message?: string };
    if (typeof body.error === "string") return body.error;
    if (body.error && typeof body.error === "object" && body.error.message) return body.error.message;
    if (body.message) return body.message;
  } catch {}
  return `HTTP ${res.status}`;
}

function isQuotaStatus(status: number) {
  return status === 401 || status === 402 || status === 403 || status === 429;
}

async function callOpenAI(system: string, history: ChatMsg[], maxTokens: number): Promise<ChatResult | null> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.log("[pouya-ai] openai: no OPENAI_API_KEY set, skipping");
    return null;
  }
  const model = process.env.OPENAI_MODEL || "gpt-4o-mini";
  let base = (process.env.OPENAI_BASE_URL || "https://api.openai.com/v1").replace(/\/$/, "");
  base = base.replace(/\/chat\/completions$/, "");
  const url = `${base}/chat/completions`;
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    let res: Response;
    try {
      res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({
          model,
          messages: [{ role: "system", content: system }, ...history],
          max_tokens: maxTokens,
          temperature: 0.7,
        }),
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeout);
    }
    if (isQuotaStatus(res.status)) {
      console.error(`[pouya-ai] openai quota/auth error: status=${res.status} url=${url} model=${model}`);
      return { ok: false, error: `quota:${res.status}` };
    }
    if (!res.ok) {
      const msg = await readError(res);
      console.error(`[pouya-ai] openai http error: status=${res.status} url=${url} model=${model} msg=${msg}`);
      return { ok: false, error: msg };
    }
    const body = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    const text = body.choices?.[0]?.message?.content?.trim() ?? "";
    if (!text) console.error(`[pouya-ai] openai empty response: url=${url} model=${model}`);
    return text ? { ok: true, text, provider: "openai" } : { ok: false, error: "empty" };
  } catch (err) {
    const reason = err instanceof Error ? `${err.name}: ${err.message}` : String(err);
    console.error(`[pouya-ai] openai network error: url=${url} model=${model} reason=${reason}`);
    return { ok: false, error: "network" };
  }
}

async function callGemini(system: string, history: ChatMsg[], maxTokens: number): Promise<ChatResult | null> {
  const apiKey = (process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || "").trim();
  if (!apiKey) {
    console.log("[pouya-ai] gemini: no GEMINI_API_KEY/GOOGLE_API_KEY set, skipping");
    return null;
  }
  const models = [process.env.GEMINI_MODEL, ...GEMINI_MODELS].filter(Boolean) as string[];
  for (const model of models) {
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: system }] },
            contents: history.map((m) => ({
              role: m.role === "assistant" ? "model" : "user",
              parts: [{ text: m.content }],
            })),
            generationConfig: { maxOutputTokens: maxTokens, temperature: 0.7 },
          }),
        },
      );
      if (!res.ok) {
        const msg = await readError(res);
        console.error(`[pouya-ai] gemini http error: model=${model} status=${res.status} msg=${msg}`);
        continue;
      }
      const body = (await res.json()) as {
        candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
      };
      const text = (body.candidates?.[0]?.content?.parts ?? []).map((p) => p.text ?? "").join("").trim();
      if (text) return { ok: true, text, provider: "gemini" };
      console.error(`[pouya-ai] gemini empty response: model=${model}`);
    } catch (err) {
      const reason = err instanceof Error ? `${err.name}: ${err.message}` : String(err);
      console.error(`[pouya-ai] gemini network error: model=${model} reason=${reason}`);
    }
  }
  return { ok: false, error: "gemini" };
}

async function chatComplete(
  system: string,
  history: ChatMsg[],
  maxTokens: number,
  fallback: () => string,
) {
  for (const id of DEFAULT_ORDER) {
    const result =
      id === "openai"
        ? await callOpenAI(system, history, maxTokens)
        : id === "gemini"
          ? await callGemini(system, history, maxTokens)
          : null;
    if (result?.ok && result.text) return { ok: true as const, text: result.text, provider: result.provider || id };
    if (result && !result.ok) console.error(`[pouya-ai] provider "${id}" failed: ${result.error}`);
  }
  console.error("[pouya-ai] all providers failed -> using local fallback");
  return { ok: true as const, text: fallback(), provider: "local" };
}

export const askPouya = createServerFn({ method: "POST" })
  .validator((input: unknown) => ChatInput.parse(input))
  .handler(async ({ data }) => {
    try {
      const short = data.mode === "live" || data.mode === "language";
      const result = await chatComplete(
        systemPrompt(data.level, data.mode, data.lang, data.assistantId),
        data.messages,
        short ? 1024 : 2048,
        () => localTutorReply({ messages: data.messages, mode: data.mode, lang: data.lang }),
      );
      if (result.ok && result.text) {
        return { ...result, text: sanitizeStudentMath(result.text, data.level) };
      }
      return result;
    } catch (err) {
      console.error("[pouya-ai] askPouya threw:", err instanceof Error ? err.message : err);
      return {
        ok: true as const,
        text: sanitizeStudentMath(
          localTutorReply({ messages: data.messages, mode: data.mode, lang: data.lang }),
          data.level,
        ),
        provider: "local",
      };
    }
  });

export const makeQuiz = createServerFn({ method: "POST" })
  .validator((input: unknown) => QuizInput.parse(input))
  .handler(async ({ data }) => {
    return { ok: true as const, quiz: localQuiz(data.topic) };
  });

export const dailyFact = createServerFn({ method: "POST" })
  .validator((input: unknown) => FactInput.parse(input))
  .handler(async ({ data }) => {
    void data;
    return { ok: true as const, text: todayFact(), provider: "local" };
  });

export const speakPouya = createServerFn({ method: "POST" })
  .validator((input: unknown) => SpeakInput.parse(input))
  .handler(async ({ data }) => {
    try {
      const text = data.text.replace(/[*_`#>-]/g, " ").replace(/\s+/g, " ").trim().slice(0, 900);
      if (!text) return { ok: false as const, error: "empty" };
      const openaiKey = process.env.OPENAI_TTS_KEY || process.env.OPENAI_API_KEY;
      if (!openaiKey) return { ok: false as const, error: "unavailable" };
      const base = (process.env.OPENAI_TTS_BASE_URL || process.env.OPENAI_BASE_URL || "https://api.openai.com/v1").replace(
        /\/$/,
        "",
      );
      const models = ["openai/tts-1", "tts-1"];
      for (const model of models) {
        for (const voice of ["echo", "onyx"]) {
          try {
            const res = await fetch(`${base}/audio/speech`, {
              method: "POST",
              headers: { "Content-Type": "application/json", Authorization: `Bearer ${openaiKey}` },
              body: JSON.stringify({ model, voice, input: text, response_format: "mp3" }),
            });
            if (!res.ok) continue;
            const buf = Buffer.from(await res.arrayBuffer());
            if (buf.length < 200) continue;
            return { ok: true as const, audio: buf.toString("base64"), mime: "audio/mpeg" };
          } catch {}
        }
      }
      return { ok: false as const, error: "unavailable" };
    } catch {
      return { ok: false as const, error: "unavailable" };
    }
  });
