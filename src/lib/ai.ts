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

const GEMINI_MODELS = ["gemini-2.5-flash", "gemini-2.5-flash-lite", "gemini-2.0-flash"];
const DEFAULT_ORDER: ProviderId[] = ["openai", "gemini"];

function levelLine(level: Level) {
  if (level === "kid") return "سطح: خیلی ساده، جمله‌های کوتاه.";
  if (level === "teen") return "سطح: دبیرستان. دقیق، با مثال.";
  return "سطح: عمیق.";
}

function systemPrompt(level: Level, mode: ChatMode, langId?: string, assistantId?: string) {
  const lang = langById(langId || "fa");
  const coach = assistantSystemExtra(assistantId);
  const base =
    `تو «پویا» هستی: مربی زنده آموزش.\n` +
    `قوانین:\n- ${levelLine(level)}\n` +
    `- زبان پاسخ = زبان پیام کاربر. اگر فارسی نوشت فقط فارسی.\n` +
    `- لحن گرم و کوتاه. ایموجی نگذار.\n` +
    `- برای شکل هندسی از برچسب [shape:rhombus] و مشابه استفاده کن.` +
    (coach ? `\n\n${coach}` : "");
  if (mode === "live" || mode === "language") {
    return `${base}\nحالت تمرین زبان (${lang.native}). اگر کاربر فارسی خواست، فارسی جواب بده.`;
  }
  return `${base}\nحالت گفتگو: همیشه به زبان کاربر جواب بده.`;
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
  if (!apiKey) return null;
  try {
    const model = process.env.OPENAI_MODEL || "gpt-4o-mini";
    const base = (process.env.OPENAI_BASE_URL || "https://api.openai.com/v1").replace(/\/$/, "");
    const res = await fetch(`${base}/chat/completions`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model,
        messages: [{ role: "system", content: system }, ...history],
        max_tokens: maxTokens,
        temperature: 0.7,
      }),
    });
    if (isQuotaStatus(res.status)) return { ok: false, error: `quota:${res.status}` };
    if (!res.ok) return { ok: false, error: await readError(res) };
    const body = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    const text = body.choices?.[0]?.message?.content?.trim() ?? "";
    return text ? { ok: true, text, provider: "openai" } : { ok: false, error: "empty" };
  } catch {
    return { ok: false, error: "network" };
  }
}

async function callGemini(system: string, history: ChatMsg[], maxTokens: number): Promise<ChatResult | null> {
  const apiKey = (process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || "").trim();
  if (!apiKey) return null;
  for (const model of [process.env.GEMINI_MODEL, ...GEMINI_MODELS].filter(Boolean) as string[]) {
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
      if (!res.ok) continue;
      const body = (await res.json()) as {
        candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
      };
      const text = (body.candidates?.[0]?.content?.parts ?? []).map((p) => p.text ?? "").join("").trim();
      if (text) return { ok: true, text, provider: "gemini" };
    } catch {}
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
  }
  return { ok: true as const, text: fallback(), provider: "local" };
}

export const askPouya = createServerFn({ method: "POST" })
  .validator((input: unknown) => ChatInput.parse(input))
  .handler(async ({ data }) => {
    try {
      const short = data.mode === "live" || data.mode === "language";
      return await chatComplete(
        systemPrompt(data.level, data.mode, data.lang, data.assistantId),
        data.messages,
        short ? 1024 : 2048,
        () => localTutorReply({ messages: data.messages, mode: data.mode, lang: data.lang }),
      );
    } catch {
      return {
        ok: true as const,
        text: localTutorReply({ messages: data.messages, mode: data.mode, lang: data.lang }),
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
