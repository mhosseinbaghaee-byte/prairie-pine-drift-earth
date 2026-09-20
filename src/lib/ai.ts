import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { localQuiz, localTutorReply, todayFact, type QuizPayload, type QuizQuestion } from "./library";
import { langById, type Level } from "./topics";
import { assistantSystemExtra } from "./assistants";
import { LESSON_DIAGRAMS, diagramTag, matchDiagram } from "./lesson-diagrams";
import {
  findWikiImage,
  looksVisual,
  queryFromPersian,
  resolveWikiTags,
  stripForeignImages,
  wikiMarkdown,
} from "./wiki-image";

const MessageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().min(1).max(12000),
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

// مدل‌های Gemini از env (GEMINI_MODELS، جداشده با کاما) خوانده می‌شود؛ مدل‌های ۲.۰ و ۱.۵ خاموش شده‌اند.
const DEFAULT_GEMINI_MODELS = ["gemini-3.5-flash", "gemini-3.1-flash-lite", "gemini-3-flash-preview", "gemini-2.5-flash"];
function geminiModels(): string[] {
  const raw = process.env.GEMINI_MODELS;
  const list = raw ? raw.split(",").map((s) => s.trim()).filter(Boolean) : [];
  return list.length ? list : DEFAULT_GEMINI_MODELS;
}
function logAi(...args: unknown[]) {
  console.error("[pouya-ai]", ...args);
}
/** ترتیب: Gemini (سریع fail) → لیارا/OpenAI → محلی */
const DEFAULT_ORDER: ProviderId[] = ["gemini", "openai"];

const DIAGRAM_IDS = LESSON_DIAGRAMS.map((d) => d.id).join(", ");

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
    `- مثل ربات کلمات کلیدی نباش؛ سؤال بچه را بفهم و کامل و مهربان جواب بده، حتی اگر موضوع از قبل پیش‌بینی نشده.\n` +
    `- برای توضیح تابع ریاضی ساده، در صورت مفید بودن [graph:عبارت] بگذار (مثل [graph:sin(x)]).\n` +
    `- برای نمایش تصویر واقعی یا شکل علمی (آناتومی، برش، ساختار، نقشه، اتم، سلول و…) در یک خط جدا و در انتهای پاسخ فقط تگ [wiki:عبارت جستجوی کوتاه انگلیسی] بگذار؛ مثل [wiki:brain axial section] یا [wiki:animal cell diagram]. حداکثر یک تگ، و فقط وقتی تصویر واقعاً کمک می‌کند. سیستم خودش تصویر را از ویکی‌مدیا پیدا و نشان می‌دهد.\n` +
    `- فقط اگر id دقیقاً یکی از این‌هاست می‌توانی به‌جای آن [diagram:id] بگذاری: ${DIAGRAM_IDS}. طرح ASCII و جمله «نمی‌توانم عکس بدهم» ممنوع.\n` +
    `- شکل اشتباه نگذار: اگر سؤال ماهیچه است [diagram:muscle_types]؛ سلول جانوری عمومی برای ماهیچه ممنوع.\n` +
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
  const key = process.env.LIARA_API_KEY || process.env.OPENAI_API_KEY;
  const baseUrl = (process.env.LIARA_BASE_URL || process.env.OPENAI_BASE_URL || "https://api.openai.com/v1")
    .trim()
    .replace(/\/+$/, "")
    .replace(/\/chat\/completions$/, "");
  const model = process.env.LIARA_MODEL || process.env.OPENAI_MODEL || "gpt-4o-mini";
  if (!key) {
    logAi("openai: OPENAI_API_KEY missing");
    return { ok: false, error: "no_openai_key" };
  }
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
    if (!res.ok) {
      const body = (await res.text().catch(() => "")).slice(0, 300);
      logAi("openai http", res.status, model, body);
      return { ok: false, error: `openai_${res.status}` };
    }
    const json = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    const text = json.choices?.[0]?.message?.content?.trim();
    if (!text) {
      logAi("openai empty response", model);
      return { ok: false, error: "openai_empty" };
    }
    return { ok: true, text, provider: "openai" };
  } catch (err) {
    clearTimeout(timeout);
    logAi("openai exception", err instanceof Error ? err.message : String(err));
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
  if (!key) {
    logAi("gemini: GEMINI_API_KEY missing");
    return { ok: false, error: "no_gemini_key" };
  }
  const parsed = imageDataUrl ? parseDataUrl(imageDataUrl) : null;
  const contents = history.map((m, i) => {
    const role = m.role === "assistant" ? "model" : "user";
    const parts: Array<{ text?: string; inlineData?: { mimeType: string; data: string } }> = [{ text: m.content }];
    if (parsed && m.role === "user" && i === history.length - 1) {
      parts.push({ inlineData: { mimeType: parsed.mime, data: parsed.b64 } });
    }
    return { role, parts };
  });
  // Gemini باید با نقش user شروع شود
  while (contents.length > 1 && contents[0].role === "model") contents.shift();
  const deadline = Date.now() + (imageDataUrl ? 20000 : 9000);
  for (const model of geminiModels()) {
    if (Date.now() > deadline) {
      logAi("gemini: deadline reached, skipping remaining models");
      break;
    }
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
      const controller = new AbortController();
      // تایم‌اوت کوتاه: اگر Gemini قطع بود زود برو لیارا (قبلاً ۴×۱۴ثانیه کل تابع را می‌کشت)
      const timeout = setTimeout(() => controller.abort(), imageDataUrl ? 12000 : 6000);
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-goog-api-key": key },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: system }] },
          contents,
          generationConfig: { maxOutputTokens: maxTokens, temperature: 0.5 },
        }),
        signal: controller.signal,
      });
      clearTimeout(timeout);
      if (res.status === 401 || res.status === 403) {
        const body = (await res.text().catch(() => "")).slice(0, 300);
        logAi("gemini auth error", res.status, model, body);
        return { ok: false, error: `gemini_auth_${res.status}` };
      }
      if (!res.ok) {
        const body = (await res.text().catch(() => "")).slice(0, 300);
        logAi("gemini http", res.status, model, body);
        continue;
      }
      const json = (await res.json()) as {
        candidates?: { content?: { parts?: { text?: string }[] } }[];
      };
      const text = json.candidates?.[0]?.content?.parts?.map((p) => p.text || "").join("").trim();
      if (text) return { ok: true, text, provider: `gemini:${model}` };
      logAi("gemini empty response", model);
    } catch (err) {
      logAi("gemini exception", model, err instanceof Error ? err.message : String(err));
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
    logAi("provider failed:", p, r.error);
  }
  logAi("all providers failed, order =", providerOrder().join(","));
  return { ok: false, error: "all_providers_failed" };
}

/** بانک شکل فقط کمک بصری است — فهم سؤال با مدل واقعی است */
function attachDiagramIfUseful(userText: string, reply: string): string {
  if (/\[diagram:/i.test(reply)) return reply;
  const d = matchDiagram(userText) || matchDiagram(reply.slice(0, 280));
  if (!d) return reply;
  return `${reply}\n\n${diagramTag(d.id)}`;
}

export const askPouya = createServerFn({ method: "POST" })
  .validator((input: unknown) => ChatInput.parse(input))
  .handler(async ({ data }) => {
    try {
      const short = data.mode === "live" || data.mode === "language";
      const hasImage = Boolean(data.image && parseDataUrl(data.image));
      // تصاویر پاسخ‌های قبلی را برای مدل به «[تصویر]» تبدیل می‌کنیم تا توکن هدر نرود
      const history = data.messages.map((m) =>
        m.role === "assistant" ? { ...m, content: m.content.replace(/!\[[^\]]*\]\([^)]*\)/g, "[تصویر]") } : m,
      );
      const result = await chatComplete(
        systemPrompt(data.level, data.mode, data.lang, data.assistantId, hasImage, data.learningBrief),
        history,
        short ? 1024 : 2048,
        hasImage ? data.image : undefined,
      );
      if (result.ok) {
        let text = stripForeignImages(sanitizeStudentMath(result.text, data.level));
        const lastUser = [...data.messages].reverse().find((m) => m.role === "user")?.content || "";
        // ۱) تصویر واقعی از ویکی‌مدیا (تگ مدل)  ۲) اگر مدل تگ نگذاشت ولی کاربر تصویر خواسته  ۳) آخر: بانک شکل محلی
        const wiki = await resolveWikiTags(text);
        text = wiki.text;
        if (!wiki.found && !/\[diagram:/i.test(text)) {
          const q = looksVisual(lastUser) ? queryFromPersian(lastUser) : null;
          const img = q ? await findWikiImage(q) : null;
          text = img ? `${text}\n\n${wikiMarkdown(img)}` : attachDiagramIfUseful(lastUser, text);
        }
        return { ok: true as const, text, provider: result.provider };
      }
      const fallback = localTutorReply({
        messages: data.messages,
        mode: data.mode === "language" ? "live" : data.mode,
        lang: data.lang,
      });
      const lastUser = [...data.messages].reverse().find((m) => m.role === "user")?.content || "";
      // بدون مدل: تصویر را خودمان از ویکی‌مدیا پیدا می‌کنیم؛ اگر نشد، بانک شکل محلی
      const fq = queryFromPersian(lastUser);
      const fimg = fq ? await findWikiImage(fq) : null;
      return {
        ok: true as const,
        text: fimg ? `${fallback}\n\n${wikiMarkdown(fimg)}` : attachDiagramIfUseful(lastUser, fallback),
        provider: "local",
      };
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
      const text = data.text.replace(/[*_`#>-]/g, " ").replace(/\s+/g, " ").trim().slice(0, 900);
      if (!text) return { ok: false as const, error: "empty" };
      // کلید/آدرس TTS جدا از چت است (کلید چت روی TTS لیارا ۴۰۱ می‌دهد)؛ پس اولویت با متغیرهای TTS
      const key =
        process.env.LIARA_TTS_API_KEY ||
        process.env.OPENAI_TTS_KEY ||
        process.env.LIARA_API_KEY ||
        process.env.OPENAI_API_KEY;
      const baseUrl = (
        process.env.LIARA_TTS_BASE_URL ||
        process.env.OPENAI_TTS_BASE_URL ||
        process.env.LIARA_BASE_URL ||
        process.env.OPENAI_BASE_URL ||
        "https://api.openai.com/v1"
      )
        .trim()
        .replace(/\/+$/, "")
        .replace(/\/audio\/speech$/, "");
      if (!key) {
        logAi("tts: no TTS/OpenAI key configured");
        return { ok: false as const, error: "no_tts_key" };
      }
      // لیارا مدل را با پیشوند provider می‌خواهد (openai/tts-1)؛ OpenAI اصلی بدون پیشوند
      const models = [process.env.LIARA_TTS_MODEL, process.env.OPENAI_TTS_MODEL, "openai/tts-1", "tts-1"].filter(
        (m, idx, arr): m is string => Boolean(m) && arr.indexOf(m) === idx,
      );
      const voices = [process.env.LIARA_TTS_VOICE || process.env.OPENAI_TTS_VOICE || "echo", "onyx"].filter(
        (v, idx, arr) => arr.indexOf(v) === idx,
      );
      const deadline = Date.now() + 18000;
      for (const voice of voices) {
        for (const model of models) {
          if (Date.now() > deadline) {
            logAi("tts: deadline reached");
            return { ok: false as const, error: "tts_timeout" };
          }
          const controller = new AbortController();
          const timeout = setTimeout(() => controller.abort(), 9000);
          try {
            const res = await fetch(`${baseUrl}/audio/speech`, {
              method: "POST",
              headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
              body: JSON.stringify({ model, voice, input: text, response_format: "mp3" }),
              signal: controller.signal,
            });
            if (!res.ok) {
              const body = (await res.text().catch(() => "")).slice(0, 300);
              logAi("tts http", res.status, model, voice, body);
              if (res.status === 401 || res.status === 403 || res.status === 429) {
                return { ok: false as const, error: `tts_${res.status}` };
              }
              continue;
            }
            const ctype = (res.headers.get("content-type") || "").toLowerCase();
            if (ctype.includes("application/json")) {
              const body = (await res.json()) as { audio?: string; data?: string };
              const b64 = body.audio || body.data;
              if (b64) return { ok: true as const, audio: b64, mime: "audio/mpeg" };
              logAi("tts json without audio", model, voice);
              continue;
            }
            const buf = Buffer.from(await res.arrayBuffer());
            if (buf.length < 200) {
              logAi("tts tiny response", buf.length, model, voice);
              continue;
            }
            return { ok: true as const, audio: buf.toString("base64"), mime: ctype.startsWith("audio/") ? ctype : "audio/mpeg" };
          } catch (err) {
            logAi("tts exception", model, voice, err instanceof Error ? err.message : String(err));
          } finally {
            clearTimeout(timeout);
          }
        }
      }
      return { ok: false as const, error: "tts_unavailable" };
    } catch (err) {
      logAi("tts outer exception", err instanceof Error ? err.message : String(err));
      return { ok: false as const, error: "tts_fail" };
    }
  });

export const dailyFact = createServerFn({ method: "POST" })
  .validator((input: unknown) => FactInput.parse(input))
  .handler(async ({ data }) => {
    try {
      return { ok: true as const, text: todayFact() };
    } catch {
      return { ok: false as const, error: "unavailable" };
    }
  });
