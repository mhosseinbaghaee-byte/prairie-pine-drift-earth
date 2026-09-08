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
type ProviderId = "xai" | "anthropic" | "openai" | "gemini";

const XAI_MODELS = ["grok-4.5", "grok-4-fast", "grok-3"];
const GEMINI_MODELS = [
  "gemini-3.5-flash",
  "gemini-3.1-flash-lite",
  "gemini-2.5-flash",
  "gemini-2.5-flash-lite",
  "gemini-2.0-flash",
];
const DEFAULT_ORDER: ProviderId[] = ["gemini", "openai", "anthropic", "xai"];

function levelLine(level: Level) {
  if (level === "kid") return "سطح: خیلی ساده، تصویری، جمله‌های کوتاه. مثل توضیح برای یک کودک کنجکاو.";
  if (level === "teen") return "سطح: دبیرستان. دقیق، با مثال، بدون ساده‌سازی غلط.";
  return "سطح: عمیق. nuance، سازوکار، و محدودیت ادعا را بگو.";
}

function systemPrompt(level: Level, mode: ChatMode, langId?: string, assistantId?: string) {
  const lang = langById(langId || "fa");
  const coach = assistantSystemExtra(assistantId);
  const base = `تو «پویا» هستی: مربی نمدی زنده برای آموزش، اطلاعات عمومی، و آموزش زبان.\nشخصیت: گرم، کنجکاو، کمی شوخ، صمیمی — مثل یک معلم استاپ‌موشن روی صحنه قرمز، نه یک ربات خشک.\nقوانین سخت:\n- ${levelLine(level)}\n- اول اصل مطلب را روشن بگو، بعد در صورت نیاز عمیق‌تر شو.\n- از تشبیه ملموس استفاده کن.\n- واقعیت ساختگی نساز. اگر مطمئن نیستی، صریح بگو.\n- لحن گفتاری و زنده. از ایموجی استفاده نکن.\n- پاراگراف‌های کوتاه.` + (coach ? `\n\n${coach}` : "");

  if (mode === "live") {
    return `${base}\n\nحالت گفتگوی زنده صوتی:\nزبان گفتگو: ${lang.native} (${lang.locale}).\nتقریباً همه پاسخ را به همین زبان بگو.\nجواب را کوتاه نگه دار: ۲ تا ۵ جمله، مناسب خواندن با صدا. حداکثر ۹۰ کلمه.\nدر پایان یک سؤال کوتاه بپرس تا مکالمه ادامه پیدا کند.\nاگر کاربر اشتباه زبانی داشت، طبیعی تصحیح کن بدون خجالت دادن.`;
  }
  if (mode === "language") {
    return `${base}\n\nحالت آموزش زبان:\nزبان هدف: ${lang.native} (${lang.locale}).\nزبان مادری کاربر معمولاً فارسی است.\nساختار هر پاسخ:\n1) پاسخ یا ادامه مکالمه به زبان هدف\n2) یک خط آوانگاری ساده اگر لازم است\n3) معنی فارسی در یک جمله\n4) تصحیح کوتاه در صورت نیاز\n5) یک سؤال یا تمرین بعدی\nنوبت را کوتاه نگه دار.`;
  }
  if (mode === "daily") {
    return `${base}\n\nحالت مرور روزانه / مغز دوم:\nهر نوبت ۳ تا ۵ سؤال کوتاه. موضوع: کار امروز، پیشرفت، تصمیم، یادگیری.\nزبان: اگر کاربر فارسی نوشت فارسی.`;
  }
  if (mode === "lesson") {
    return `${base}\n\nحالت درس کوتاه:\n1) عنوان 2) ایده اصلی 3) سه بخش 4) مثال 5) سؤال پایانی\nبه زبان کاربر جواب بده.`;
  }
  return `${base}\n\nحالت گفتگو:\nبه زبان کاربر جواب بده. اگر فارسی نوشت، فارسی روان بنویس.`;
}

async function readError(res: Response): Promise<string> {
  try {
    const body = (await res.json()) as {
      error?: { message?: string } | string;
      message?: string;
      code?: string;
    };
    if (typeof body.error === "string") return body.error;
    if (body.error && typeof body.error === "object" && body.error.message) return body.error.message;
    if (body.message) return body.message;
    if (body.code) return body.code;
  } catch {
    /* ignore */
  }
  return `HTTP ${res.status}`;
}

function isQuotaStatus(status: number) {
  return status === 401 || status === 402 || status === 403 || status === 429;
}

function providerOrder(): ProviderId[] {
  const raw = (process.env.AI_PROVIDER_ORDER || "").trim().toLowerCase();
  if (!raw) return DEFAULT_ORDER;
  const allowed = new Set<ProviderId>(DEFAULT_ORDER);
  const parsed = raw
    .split(/[,|\s]+/)
    .map((s) => s.trim())
    .filter((s): s is ProviderId => allowed.has(s as ProviderId));
  const rest = DEFAULT_ORDER.filter((p) => !parsed.includes(p));
  return parsed.length ? [...parsed, ...rest] : DEFAULT_ORDER;
}

async function callXai(
  messages: { role: "system" | "user" | "assistant"; content: string }[],
  maxTokens: number,
): Promise<ChatResult | null> {
  const apiKey = process.env.XAI_API_KEY;
  if (!apiKey) return null;
  let last = "xAI unavailable";
  for (const model of XAI_MODELS) {
    try {
      const res = await fetch("https://api.x.ai/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({ model, messages, max_tokens: maxTokens, temperature: 0.7 }),
      });
      if (isQuotaStatus(res.status)) return { ok: false, error: `quota:${res.status}` };
      if (!res.ok) {
        last = await readError(res);
        continue;
      }
      const body = (await res.json()) as { choices?: { message?: { content?: string } }[] };
      const text = body.choices?.[0]?.message?.content?.trim() ?? "";
      if (text) return { ok: true, text, provider: "xai" };
      last = "empty";
    } catch {
      last = "network";
    }
  }
  return { ok: false, error: last };
}

async function callAnthropic(system: string, history: ChatMsg[], maxTokens: number): Promise<ChatResult | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;
  try {
    const model = process.env.ANTHROPIC_MODEL || "claude-sonnet-4-5";
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model,
        max_tokens: maxTokens,
        system,
        messages: history.map((m) => ({
          role: m.role === "assistant" ? "assistant" : "user",
          content: m.content,
        })),
      }),
    });
    if (isQuotaStatus(res.status)) return { ok: false, error: `quota:${res.status}` };
    if (!res.ok) return { ok: false, error: await readError(res) };
    const body = (await res.json()) as { content?: Array<{ type?: string; text?: string }> };
    const text = (body.content ?? [])
      .filter((p) => p.type === "text" || typeof p.text === "string")
      .map((p) => p.text ?? "")
      .join("")
      .trim();
    return text ? { ok: true, text, provider: "anthropic" } : { ok: false, error: "empty" };
  } catch {
    return { ok: false, error: "network" };
  }
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
  const models = [process.env.GEMINI_MODEL, ...GEMINI_MODELS].filter(
    (m, i, arr): m is string => Boolean(m) && arr.indexOf(m) === i,
  );
  let last = "gemini unavailable";
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
      if (isQuotaStatus(res.status)) {
        last = `quota:${res.status}`;
        continue;
      }
      if (!res.ok) {
        last = await readError(res);
        continue;
      }
      const body = (await res.json()) as {
        candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
      };
      const text = (body.candidates?.[0]?.content?.parts ?? []).map((p) => p.text ?? "").join("").trim();
      if (text) return { ok: true, text, provider: "gemini" };
      last = "empty";
    } catch {
      last = "network";
    }
  }
  return { ok: false, error: last };
}

async function runProvider(
  id: ProviderId,
  system: string,
  history: ChatMsg[],
  maxTokens: number,
): Promise<ChatResult | null> {
  if (id === "xai") return callXai([{ role: "system", content: system }, ...history], maxTokens);
  if (id === "anthropic") return callAnthropic(system, history, maxTokens);
  if (id === "openai") return callOpenAI(system, history, maxTokens);
  if (id === "gemini") return callGemini(system, history, maxTokens);
  return null;
}

async function chatComplete(
  system: string,
  history: ChatMsg[],
  maxTokens: number,
  fallback: () => string,
): Promise<{ ok: true; text: string; provider?: string }> {
  const order = providerOrder();
  const errors: string[] = [];
  for (const id of order) {
    try {
      const result = await runProvider(id, system, history, maxTokens);
      if (!result) {
        errors.push(`${id}:missing-key`);
        continue;
      }
      if (result.ok && result.text) return { ok: true, text: result.text, provider: result.provider || id };
      if (!result.ok) errors.push(`${id}:${result.error}`);
    } catch {
      errors.push(`${id}:throw`);
    }
  }
  console.error("[pouya-ai] all providers failed → local", errors.join(" | "));
  return { ok: true, text: fallback(), provider: "local" };
}

export const askPouya = createServerFn({ method: "POST" })
  .validator((input: unknown) => ChatInput.parse(input))
  .handler(async ({ data }) => {
    try {
      const short = data.mode === "live" || data.mode === "language";
      const maxTokens = short ? 1024 : data.mode === "lesson" ? 2500 : 2048;
      return await chatComplete(
        systemPrompt(data.level, data.mode, data.lang, data.assistantId),
        data.messages,
        maxTokens,
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
    try {
      const result = await chatComplete(
        `تو طراح آزمون آموزشی هستی. فقط JSON معتبر برگردان.\n{"topic":"string","questions":[{"q":"string","options":["a","b","c","d"],"correct":0,"why":"string"]}\nدقیقاً ۵ سؤال. ${levelLine(data.level)}`,
        [{ role: "user", content: `آزمون درباره: ${data.topic}` }],
        2500,
        () => "",
      );
      if (result.text) {
        const jsonText = result.text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
        try {
          const parsed = JSON.parse(jsonText) as QuizPayload;
          if (Array.isArray(parsed.questions) && parsed.questions.length >= 4) {
            const questions = parsed.questions.slice(0, 5).map((q) => ({
              q: String(q.q ?? ""),
              options: (q.options ?? []).slice(0, 4).map(String) as QuizQuestion["options"],
              correct: Math.min(3, Math.max(0, Number(q.correct) || 0)),
              why: String(q.why ?? ""),
            }));
            if (!questions.some((q) => !q.q || q.options.length !== 4)) {
              return { ok: true as const, quiz: { topic: parsed.topic || data.topic, questions } };
            }
          }
        } catch {
          /* local */
        }
      }
    } catch {
      /* local */
    }
    return { ok: true as const, quiz: localQuiz(data.topic) };
  });

export const dailyFact = createServerFn({ method: "POST" })
  .validator((input: unknown) => FactInput.parse(input))
  .handler(async ({ data }) => {
    try {
      return await chatComplete(
        `تو پویا هستی. یک دانستی امروز کوتاه و دقیق بنویس. فارسی. ${levelLine(data.level)}`,
        [{ role: "user", content: "دانستی امروز را بگو." }],
        1024,
        () => todayFact(),
      );
    } catch {
      return { ok: true as const, text: todayFact(), provider: "local" };
    }
  });

function ttsLanguage(raw?: string) {
  const v = (raw || "auto").toLowerCase();
  if (v === "auto" || v.startsWith("fa")) return "auto";
  if (v.startsWith("en")) return "en";
  if (v.startsWith("ar")) return "ar-SA";
  return "auto";
}

export const speakPouya = createServerFn({ method: "POST" })
  .validator((input: unknown) => SpeakInput.parse(input))
  .handler(async ({ data }) => {
    try {
      const text = data.text.replace(/[*_`#>-]/g, " ").replace(/\s+/g, " ").trim().slice(0, 900);
      if (!text) return { ok: false as const, error: "empty" };

      // Prefer dedicated TTS key (Liara may issue per-model keys); fall back to chat key.
      const openaiKey = process.env.OPENAI_TTS_KEY || process.env.OPENAI_API_KEY;
      if (openaiKey) {
        const base = (
          process.env.OPENAI_TTS_BASE_URL ||
          process.env.OPENAI_BASE_URL ||
          "https://api.openai.com/v1"
        ).replace(/\/$/, "");
        const isLiara = /ai\.liara\.ir/i.test(base);
        const models = [
          process.env.OPENAI_TTS_MODEL,
          isLiara ? "openai/tts-1" : "tts-1",
          "openai/tts-1",
          "tts-1",
          "openai/tts-1-hd",
          "tts-1-hd",
        ].filter((m, i, arr): m is string => Boolean(m) && arr.indexOf(m) === i);
        const voices = [process.env.OPENAI_TTS_VOICE || "echo", "onyx", "alloy"];

        for (const model of models) {
          for (const voice of voices) {
            try {
              const res = await fetch(`${base}/audio/speech`, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${openaiKey}`,
                },
                body: JSON.stringify({ model, voice, input: text, response_format: "mp3" }),
              });
              if (!res.ok) {
                console.error("[pouya-tts] fail", model, voice, res.status, await readError(res));
                continue;
              }
              const ctype = (res.headers.get("content-type") || "").toLowerCase();
              if (ctype.includes("application/json")) {
                const body = (await res.json()) as { audio?: string; data?: string };
                const b64 = body.audio || body.data;
                if (b64) {
                  console.info("[pouya-tts] ok json", model, voice);
                  return { ok: true as const, audio: b64, mime: "audio/mpeg" };
                }
                continue;
              }
              const buf = Buffer.from(await res.arrayBuffer());
              if (buf.length < 200) continue;
              console.info("[pouya-tts] ok", model, voice, buf.length);
              return { ok: true as const, audio: buf.toString("base64"), mime: "audio/mpeg" };
            } catch (err) {
              console.error("[pouya-tts] network", model, voice, err);
            }
          }
        }
      }

      const xaiKey = process.env.XAI_API_KEY;
      if (xaiKey) {
        const res = await fetch("https://api.x.ai/v1/tts", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${xaiKey}` },
          body: JSON.stringify({
            text,
            voice_id: "zagan",
            language: ttsLanguage(data.lang),
            output_format: { codec: "mp3", sample_rate: 24000, bit_rate: 96000 },
            speed: 1.0,
          }),
        });
        if (res.ok) {
          const buf = Buffer.from(await res.arrayBuffer());
          if (buf.length > 200) {
            return { ok: true as const, audio: buf.toString("base64"), mime: "audio/mpeg" };
          }
        }
      }

      return { ok: false as const, error: "unavailable" };
    } catch (err) {
      console.error("[pouya-tts] throw", err);
      return { ok: false as const, error: "unavailable" };
    }
  });
