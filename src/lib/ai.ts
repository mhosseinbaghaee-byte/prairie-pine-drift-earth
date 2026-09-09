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
  /** data URL image (e.g. data:image/jpeg;base64,...) for the latest user message */
  image: z.string().max(6_500_000).optional(),
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

const GEMINI_MODELS = ["gemini-3.6-flash", "gemini-3.5-flash-lite", "gemini-2.5-flash", "gemini-2.0-flash"];
const DEFAULT_ORDER: ProviderId[] = ["openai", "gemini"];

function levelLine(level: Level) {
  if (level === "kid") return "سطح: خیلی ساده، جمله‌های کوتاه، مثل کتاب ابتدایی/متوسطه اول.";
  if (level === "teen") return "سطح: متوسط / دبیرستان. دقیق، با مثال روزمره و کتاب درسی.";
  return "سطح: عمیق.";
}

function textbookStyleRules(level: Level) {
  void level;
  return (
    `سبک آموزش (کتاب درسی ایران):\n` +
    `- ساده، مرحله‌به‌مرحله، واضح.\n` +
    `- مخفف‌های کتاب درسی مجاز: sin ، cos ، tan ، cot ، sec ، csc.\n` +
    `- کسر را ترجیحاً بالا–پایین بنویس (صورت روی خط، مخرج زیر خط).\n` +
    `- شکل افقی هم مجاز: (صورت) / (مخرج) یا با ÷.\n` +
    `- هرگز LaTeX خام ننویس: نه $...$ نه \\frac نه \\cos با بک‌اسلش.\n` +
    `- ضرب با × . توان: ۲² یا «۲ به توان ۲».`
  );
}

function parseDataUrl(dataUrl: string): { mime: string; b64: string } | null {
  const m = /^data:([^;]+);base64,(.+)$/s.exec(dataUrl.trim());
  if (!m) return null;
  const mime = m[1].toLowerCase();
  if (!mime.startsWith("image/")) return null;
  if (m[2].length < 32) return null;
  return { mime, b64: m[2] };
}

function sanitizeStudentMath(text: string, level: Level): string {
  void level;
  let t = text;

  t = t.replace(/\\frac\s*\{([^{}]*)\}\s*\{([^{}]*)\}/gi, (_m, a: string, b: string) => {
    const top = String(a).trim();
    const bot = String(b).trim();
    const w = Math.max(top.length, bot.length, 3);
    const line = "─".repeat(Math.min(w + 2, 16));
    return `\n  ${top}\n${line}\n  ${bot}\n`;
  });
  t = t.replace(/\\dfrac\s*\{([^{}]*)\}\s*\{([^{}]*)\}/gi, (_m, a: string, b: string) => {
    const top = String(a).trim();
    const bot = String(b).trim();
    const w = Math.max(top.length, bot.length, 3);
    const line = "─".repeat(Math.min(w + 2, 16));
    return `\n  ${top}\n${line}\n  ${bot}\n`;
  });

  t = t.replace(/\\cos\b/gi, "cos");
  t = t.replace(/\\sin\b/gi, "sin");
  t = t.replace(/\\tan\b/gi, "tan");
  t = t.replace(/\\cot\b/gi, "cot");
  t = t.replace(/\\sec\b/gi, "sec");
  t = t.replace(/\\csc\b/gi, "csc");
  t = t.replace(/\\theta\b/gi, "θ");
  t = t.replace(/\\pi\b/gi, "π");
  t = t.replace(/\\alpha\b/gi, "α");
  t = t.replace(/\\beta\b/gi, "β");

  t = t.replace(/\\times/gi, "×");
  t = t.replace(/\\div/gi, "÷");
  t = t.replace(/\\cdot/gi, "·");
  t = t.replace(/\\pm/gi, "±");
  t = t.replace(/\\leq/gi, "≤");
  t = t.replace(/\\geq/gi, "≥");
  t = t.replace(/\\neq/gi, "≠");
  t = t.replace(/\\approx/gi, "≈");
  t = t.replace(/\\sqrt\s*\{([^{}]*)\}/gi, "√($1)");
  t = t.replace(/\\text\s*\{([^{}]*)\}/gi, "$1");
  t = t.replace(/\\mathrm\s*\{([^{}]*)\}/gi, "$1");

  t = t.replace(/\$\$/g, "");
  t = t.replace(/\$/g, "");
  t = t.replace(/\\\[|\\\]/g, "");
  t = t.replace(/\\\(|\\\)/g, "");
  t = t.replace(/\\left|\\right/gi, "");
  t = t.replace(/\\,/g, " ");
  t = t.replace(/\\ /g, " ");
  t = t.replace(/\\[a-zA-Z]+/g, "");
  t = t.replace(/\{\s*\}/g, "");
  t = t.replace(/[ \t]*\n/g, "\n");
  t = t.replace(/\n{3,}/g, "\n\n");
  t = t.replace(/[ \t]{2,}/g, " ");
  t = t.replace(/(\d+)\^2/g, "$1²");
  t = t.replace(/(\d+)\^3/g, "$1³");
  t = t.replace(/\btimes\b/gi, "×");

  return t.trim();
}

function systemPrompt(level: Level, mode: ChatMode, langId?: string, assistantId?: string, hasImage?: boolean) {
  const lang = langById(langId || "fa");
  const coach = assistantSystemExtra(assistantId);
  const vision =
    hasImage
      ? `\n- کاربر تصویر فرستاده است. حتماً همان تصویر را توصیف و تحلیل کن: نمودار ریاضی (sin/cos/tan/cot)، شکل هندسی، آناتومی زیست، عکس کتاب/جزوه، جدول یا هر شکل درسی.\n` +
        `- نگو «فقط شکل هندسی می‌فهمم». هر تصویر آموزشی را تا حد ممکن توضیح بده.\n` +
        `- اگر نمودار است: نام تابع، محورها، نقاط مهم، مجانب‌ها را بگو.\n` +
        `- اگر آناتومی/زیست است: نام اعضا و نقش ساده را بگو.\n` +
        `- اگر متن کتاب در تصویر است، بخوان و خلاصه/توضیح بده.`
      : "";
  const base =
    `تو «پویا» هستی: مربی زنده آموزش برای دانش‌آموزان ایران.\n` +
    `قوانین سخت:\n` +
    `- ${levelLine(level)}\n` +
    `- همیشه مستقیماً به همان سؤال کاربر جواب بده. موضوع را عوض نکن.\n` +
    `- اگر پرسید «چرخ چیست» درباره چرخ بگو؛ نرو سراغ درس تصادفی.\n` +
    `- اگر درباره خودت/مدل پرسید، صادقانه و کوتاه بگو: دستیار آموزشی این اپ هستی.\n` +
    `- فقط وقتی کاربر صریحاً درس کوتاه خواست، حالت درس کوتاه بگیر.\n` +
    `- زبان پاسخ = زبان پیام کاربر. اگر فارسی نوشت فقط فارسی (به‌جز مخفف‌های ریاضی مثل sin و cos).\n` +
    `- لحن گرم و کوتاه. ایموجی نگذار.\n` +
    `- برای رسم شکل هندسی ساده در متن می‌توانی از برچسب [shape:rhombus] و مشابه استفاده کنی — این فقط برای تولید شکل است، نه محدودیت فهم تصویر.\n` +
    `- ${textbookStyleRules(level)}` +
    vision +
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

type OpenAIContent =
  | string
  | Array<
      | { type: "text"; text: string }
      | { type: "image_url"; image_url: { url: string } }
    >;

async function callOpenAI(
  system: string,
  history: ChatMsg[],
  maxTokens: number,
  imageDataUrl?: string,
): Promise<ChatResult | null> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.log("[pouya-ai] openai: no OPENAI_API_KEY set, skipping");
    return null;
  }
  const model = process.env.OPENAI_MODEL || "gpt-4o-mini";
  let base = (process.env.OPENAI_BASE_URL || "https://api.openai.com/v1").replace(/\/$/, "");
  base = base.replace(/\/chat\/completions$/, "");
  const url = `${base}/chat/completions`;

  const messages: { role: string; content: OpenAIContent }[] = [{ role: "system", content: system }];
  const lastIdx = history.length - 1;
  for (let i = 0; i < history.length; i++) {
    const m = history[i];
    if (m.role === "user" && i === lastIdx && imageDataUrl) {
      messages.push({
        role: "user",
        content: [
          { type: "text", text: m.content },
          { type: "image_url", image_url: { url: imageDataUrl } },
        ],
      });
    } else {
      messages.push({ role: m.role, content: m.content });
    }
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), imageDataUrl ? 45000 : 15000);
    let res: Response;
    try {
      res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({
          model,
          messages,
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

async function callGemini(
  system: string,
  history: ChatMsg[],
  maxTokens: number,
  imageDataUrl?: string,
): Promise<ChatResult | null> {
  const apiKey = (process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || "").trim();
  if (!apiKey) {
    console.log("[pouya-ai] gemini: no GEMINI_API_KEY/GOOGLE_API_KEY set, skipping");
    return null;
  }
  const parsed = imageDataUrl ? parseDataUrl(imageDataUrl) : null;
  const models = [process.env.GEMINI_MODEL, ...GEMINI_MODELS].filter(Boolean) as string[];
  for (const model of models) {
    try {
      const contents = history.map((m, i) => {
        const isLastUser = m.role === "user" && i === history.length - 1 && parsed;
        if (isLastUser && parsed) {
          return {
            role: "user" as const,
            parts: [
              { text: m.content },
              { inline_data: { mime_type: parsed.mime, data: parsed.b64 } },
            ],
          };
        }
        return {
          role: (m.role === "assistant" ? "model" : "user") as "user" | "model",
          parts: [{ text: m.content }],
        };
      });

      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: system }] },
            contents,
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
  imageDataUrl?: string,
) {
  for (const id of DEFAULT_ORDER) {
    const result =
      id === "openai"
        ? await callOpenAI(system, history, maxTokens, imageDataUrl)
        : id === "gemini"
          ? await callGemini(system, history, maxTokens, imageDataUrl)
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
      const hasImage = Boolean(data.image && parseDataUrl(data.image));
      const result = await chatComplete(
        systemPrompt(data.level, data.mode, data.lang, data.assistantId, hasImage),
        data.messages,
        short ? 1024 : hasImage ? 2048 : 2048,
        () =>
          hasImage
            ? "تصویر را دیدم ولی الان اتصال مدل بینایی کامل نیست. یک‌بار دیگر بفرست یا بگو نمودار tan است یا شکل زیست — با متن هم کمکت می‌کنم."
            : localTutorReply({ messages: data.messages, mode: data.mode, lang: data.lang }),
        hasImage ? data.image : undefined,
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
