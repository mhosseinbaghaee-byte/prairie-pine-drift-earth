import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { localQuiz, localTutorReply, todayFact, type QuizPayload, type QuizQuestion } from "./library";
import { langById, type Level } from "./topics";
import { assistantSystemExtra } from "./assistants";
import { diagramTag, matchDiagram } from "./lesson-diagrams";

const MessageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().min(1).max(6000),
});

const ChatInput = z.object({
  messages: z.array(MessageSchema).min(1).max(16),
  image: z.string().max(6_500_000).optional(),
  level: z.enum(["kid", "teen", "adult"]).catch("teen"),
  mode: z.enum(["chat", "daily", "lesson", "live", "language"]).catch("chat"),
  lang: z.string().min(1).max(16).optional(),
  assistantId: z.string().min(1).max(40).optional(),
  learningBrief: z.string().max(800).optional(),
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
const DEFAULT_ORDER: ProviderId[] = ["gemini", "openai"];

function levelLine(level: Level) {
  if (level === "kid") return "سطح: خیلی ساده، جمله‌های کوتاه، مثل کتاب ابتدایی/متوسطه اول.";
  if (level === "teen") return "سطح: متوسط / دبیرستان. دقیق، با مثال روزمره و کتاب درسی.";
  return "سطح: بزرگسال یا پیشرفته؛ دقیق و منسجم.";
}

function textbookStyleRules(level: Level) {
  return (
    `سبک کتاب درسی فارسی:\n` +
    `- بدون LaTeX و بدون علامت دلار ($). هرگز $ یا $$ نگذار.\n` +
    `- sin/cos/tan/cot و π مجاز. کسر را ساده بنویس مثل (۱) ÷ (۲).\n` +
    `- به جای $2\\pi$ بنویس ۲π. به جای $x = \\pi/2$ بنویس x = π/2.\n` +
    (level === "kid" ? `- خیلی ساده و خودمانی.\n` : `- واضح و مرحله‌ای.\n`)
  );
}

function sanitizeStudentMath(text: string, level: Level): string {
  let t = text;
  t = t.replace(/\\frac\s*\{([^{}]*)\}\s*\{([^{}]*)\}/gi, "($1) ÷ ($2)");
  t = t.replace(/\\pi\b/gi, "π");
  t = t.replace(/\\times\b/gi, "×");
  t = t.replace(/\\cdot\b/gi, "·");
  t = t.replace(/\\leq\b/gi, "≤");
  t = t.replace(/\\geq\b/gi, "≥");
  t = t.replace(/\\neq\b/gi, "≠");
  t = t.replace(/\\infty\b/gi, "∞");
  t = t.replace(/\$\$([\s\S]*?)\$\$/g, "$1");
  t = t.replace(/\$([^$]+)\$/g, "$1");
  t = t.replace(/\$/g, "");
  t = t.replace(/\\[a-zA-Z]+/g, "");
  t = t.replace(/\\\[|\\\]/g, "");
  t = t.replace(/\\\(|\\\)/g, "");
  t = t.replace(/\{([^{}]*)\}/g, "$1");
  t = t.replace(/[ \t]+\n/g, "\n");
  t = t.replace(/\n{3,}/g, "\n\n");
  t = t.replace(/[ \t]{2,}/g, " ");
  return t.trim();
}

function parseDataUrl(dataUrl: string): { mime: string; b64: string } | null {
  const m = /^data:([^;]+);base64,(.+)$/s.exec(dataUrl);
  if (!m) return null;
  const mime = m[1].toLowerCase();
  if (!mime.startsWith("image/")) return null;
  return { mime, b64: m[2] };
}

function systemPrompt(
  level: Level,
  mode: ChatMode,
  langId?: string,
  assistantId?: string,
  hasImage?: boolean,
  learningBrief?: string,
) {
  const lang = langById(langId || "fa");
  const coach = assistantSystemExtra(assistantId);
  const vision = hasImage
    ? `\n- کاربر تصویر/جزوه/برگه فرستاده. تصویر را دقیق ببین و تحلیل کن.\n` +
      `- برگه امتحان یا تست: سؤال‌ها را بخوان، مرحله‌به‌مرحله حل کن.\n` +
      `- تمرین دست‌نویس: خطا را پیدا کن و راه درست را ساده بگو.\n` +
      `- نمودار: محورها و نقاط مهم؛ در صورت نیاز [graph:عبارت].\n` +
      `- نگو «فقط شکل هندسی می‌فهمم».`
    : "";
  const memory =
    learningBrief && learningBrief.trim()
      ? `\nحافظه یادگیری این دانش‌آموز (موضوع سؤال فعلی را عوض نکن):\n${learningBrief.trim()}\n`
      : "";
  const base =
    `تو «پویا» هستی: مربی زنده آموزش برای دانش‌آموزان ایران.\n` +
    `قوانین سخت:\n` +
    `- ${levelLine(level)}\n` +
    `- همیشه مستقیماً به همان سؤال کاربر جواب بده. موضوع را عوض نکن.\n` +
    `- برای توضیح تابع ریاضی ساده، در صورت مفید بودن [graph:عبارت] بگذار (مثل [graph:sin(x)]).\n` +
    `- زبان پاسخ = زبان پیام کاربر.\n` +
    `- ${textbookStyleRules(level)}` +
    vision +
    memory +
    (coach ? `\n\n${coach}` : "");
  if (mode === "live" || mode === "language") {
    return `${base}\nحالت تمرین زبان (${lang.native}).`;
  }
  return base;
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
): Promise<ChatResult> {
  const key = process.env.OPENAI_API_KEY;
  const baseUrl = (process.env.OPENAI_BASE_URL || "https://api.openai.com/v1").replace(/\/$/, "");
  const model = process.env.OPENAI_MODEL || "gpt-4o-mini";
  if (!key) return { ok: false, error: "no_openai_key" };
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
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), imageDataUrl ? 45000 : 15000);
  try {
    const res = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model, messages, max_tokens: maxTokens, temperature: 0.5 }),
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (!res.ok) return { ok: false, error: `openai_${res.status}` };
    const json = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    const text = json.choices?.[0]?.message?.content?.trim();
    if (!text) return { ok: false, error: "openai_empty" };
    return { ok: true, text, provider: "openai" };
  } catch {
    clearTimeout(timeout);
    return { ok: false, error: "openai_fail" };
  }
}

async function callGemini(
  system: string,
  history: ChatMsg[],
  maxTokens: number,
  imageDataUrl?: string,
): Promise<ChatResult> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return { ok: false, error: "no_gemini_key" };
  const parsed = imageDataUrl ? parseDataUrl(imageDataUrl) : null;
  const contents = history.map((m, i) => {
    const role = m.role === "assistant" ? "model" : "user";
    const parts: Array<{ text?: string; inlineData?: { mimeType: string; data: string } }> = [{ text: m.content }];
    if (parsed && m.role === "user" && i === history.length - 1) {
      parts.push({ inlineData: { mimeType: parsed.mime, data: parsed.b64 } });
    }
    return { role, parts };
  });
  for (const model of GEMINI_MODELS) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: system }] },
          contents,
          generationConfig: { maxOutputTokens: maxTokens, temperature: 0.5 },
        }),
      });
      if (!res.ok) continue;
      const json = (await res.json()) as {
        candidates?: { content?: { parts?: { text?: string }[] } }[];
      };
      const text = json.candidates?.[0]?.content?.parts?.map((p) => p.text || "").join("").trim();
      if (text) return { ok: true, text, provider: `gemini:${model}` };
    } catch {
      /* next */
    }
  }
  return { ok: false, error: "gemini_fail" };
}

function providerOrder(): ProviderId[] {
  const raw = process.env.AI_PROVIDER_ORDER;
  if (!raw) return DEFAULT_ORDER;
  const parts = raw.split(",").map((s) => s.trim().toLowerCase()).filter(Boolean) as ProviderId[];
  const valid = parts.filter((p) => p === "openai" || p === "gemini");
  return valid.length ? valid : DEFAULT_ORDER;
}

async function chatComplete(
  system: string,
  history: ChatMsg[],
  maxTokens: number,
  imageDataUrl?: string,
): Promise<ChatResult> {
  for (const p of providerOrder()) {
    const r =
      p === "openai"
        ? await callOpenAI(system, history, maxTokens, imageDataUrl)
        : await callGemini(system, history, maxTokens, imageDataUrl);
    if (r.ok) return r;
  }
  return { ok: false, error: "all_providers_failed" };
}

function attachDiagramIfUseful(userText: string, reply: string): string {
  if (/\[diagram:/i.test(reply)) return reply;
  const d = matchDiagram(userText);
  if (!d) return reply;
  return `${reply}\n\n${diagramTag(d.id)}`;
}

export const askPouya = createServerFn({ method: "POST" })
  .validator((input: unknown) => ChatInput.parse(input))
  .handler(async ({ data }) => {
    try {
      const short = data.mode === "live" || data.mode === "language";
      const hasImage = Boolean(data.image && parseDataUrl(data.image));
      const result = await chatComplete(
        systemPrompt(data.level, data.mode, data.lang, data.assistantId, hasImage, data.learningBrief),
        data.messages,
        short ? 1024 : 2048,
        hasImage ? data.image : undefined,
      );
      if (result.ok) {
        let text = sanitizeStudentMath(result.text, data.level);
        const lastUser = [...data.messages].reverse().find((m) => m.role === "user")?.content || "";
        text = attachDiagramIfUseful(lastUser, text);
        return { ok: true as const, text, provider: result.provider };
      }
      const fallback = localTutorReply({
        messages: data.messages,
        mode: data.mode === "language" ? "live" : data.mode,
        lang: data.lang,
      });
      return { ok: true as const, text: fallback, provider: "local" };
    } catch {
      return { ok: false as const, error: "handler_error" };
    }
  });

export const makeQuiz = createServerFn({ method: "POST" })
  .validator((input: unknown) => QuizInput.parse(input))
  .handler(async ({ data }) => {
    try {
      const quiz = localQuiz(data.topic);
      return { ok: true as const, quiz };
    } catch {
      return { ok: false as const, error: "quiz_fail" };
    }
  });

export const speakPouya = createServerFn({ method: "POST" })
  .validator((input: unknown) => SpeakInput.parse(input))
  .handler(async ({ data }) => {
    try {
      const key = process.env.OPENAI_TTS_KEY || process.env.OPENAI_API_KEY;
      const baseUrl = (process.env.OPENAI_TTS_BASE_URL || process.env.OPENAI_BASE_URL || "https://api.openai.com/v1").replace(
        /\/$/,
        "",
      );
      const model = process.env.OPENAI_TTS_MODEL || "tts-1";
      const voice = process.env.OPENAI_TTS_VOICE || "echo";
      if (!key) return { ok: false as const, error: "no_tts_key" };
      const res = await fetch(`${baseUrl}/audio/speech`, {
        method: "POST",
        headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
        body: JSON.stringify({ model, voice, input: data.text.slice(0, 900) }),
      });
      if (!res.ok) return { ok: false as const, error: `tts_${res.status}` };
      const buf = Buffer.from(await res.arrayBuffer());
      return { ok: true as const, audio: buf.toString("base64"), mime: "audio/mpeg" };
    } catch {
      return { ok: false as const, error: "tts_fail" };
    }
  });

export const dailyFact = createServerFn({ method: "POST" })
  .validator((input: unknown) => FactInput.parse(input))
  .handler(async ({ data }) => {
    try {
      return { ok: true as const, text: todayFact(data.level) };
    } catch {
      return { ok: false as const, error: "unavailable" };
    }
  });
