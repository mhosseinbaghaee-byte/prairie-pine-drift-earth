import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { localQuiz, localTutorReply, todayFact, type QuizPayload, type QuizQuestion } from "./library";
import { langById, type Level } from "./topics";
import { assistantSystemExtra } from "./assistants";
import { LESSON_DIAGRAMS, diagramTag, matchDiagram } from "./lesson-diagrams";
import { bankReply } from "./bank-first";
import { brainLookup, brainRemember, isBankWorthyQuestion } from "./pouya-brain";
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
type ProviderId = "bank" | "openai" | "gemini";

const DEFAULT_GEMINI_MODELS = ["gemini-2.0-flash", "gemini-2.5-flash", "gemini-1.5-flash"];
function geminiModels(): string[] {
  const raw = process.env.GEMINI_MODELS;
  const list = raw ? raw.split(",").map((s) => s.trim()).filter(Boolean) : [];
  return list.length ? list : DEFAULT_GEMINI_MODELS;
}
function logAi(...args: unknown[]) {
  console.error("[pouya-ai]", ...args);
}
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
    (level === "kid" ? `- خیلی ساده و خودمانی.\n` : `- واضح و مرحله‌ای.\n`)
  );
}

function sanitizeStudentMath(text: string, level: Level): string {
  let t = text;
  t = t.replace(/\\frac\s*\{([^{}]*)\}\s*\{([^{}]*)\}/gi, "($1) ÷ ($2)");
  t = t.replace(/\\pi\b/gi, "π");
  t = t.replace(/\\times\b/gi, "×");
  t = t.replace(/\\cdot\b/gi, "·");
  t = t.replace(/\$\$([\s\S]*?)\$\$/g, "$1");
  t = t.replace(/\$([^$]+)\$/g, "$1");
  t = t.replace(/\$/g, "");
  t = t.replace(/\\[a-zA-Z]+/g, "");
  t = t.replace(/\\\[|\\\]/g, "");
  t = t.replace(/\\\(|\\\)/g, "");
  t = t.replace(/\{([^{}]*)\}/g, "$1");
  t = t.replace(/\n{3,}/g, "\n\n");
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
    ? `\n- کاربر تصویر فرستاده؛ دقیق ببین و تحلیل کن. نگو فقط شکل هندسی می‌فهمم.`
    : "";
  const memory =
    learningBrief && learningBrief.trim()
      ? `\nحافظه یادگیری:\n${learningBrief.trim()}\n`
      : "";
  const base =
    `تو «پویا» هستی: مربی زنده آموزش برای دانش‌آموزان ایران.\n` +
    `قوانین:\n` +
    `- ${levelLine(level)}\n` +
    `- مستقیم به همان سؤال جواب بده.\n` +
    `- مثل ربات کلمات کلیدی نباش.\n` +
    `- اگر کاربر عکس/شکل/نقشه خواست: هرگز نگو «نمی‌توانم تصویر نشان دهم». در انتهای پاسخ فقط یک تگ [wiki:عبارت انگلیسی دقیق] بگذار (مثل [wiki:Iran map] یا [wiki:brain anatomy]). هرگز متن [تصویر] ننویس.\n` +
    `- فقط محتوای جنسی ممنوع است.\n` +
    `- در صورت نیاز [diagram:id] از این‌ها: ${DIAGRAM_IDS}\n` +
    `- زبان پاسخ = زبان پیام کاربر.\n` +
    `- ${textbookStyleRules(level)}` +
    vision +
    memory +
    (coach ? `\n\n${coach}` : "");
  if (mode === "live" || mode === "language") return `${base}\nحالت تمرین زبان (${lang.native}).`;
  return base;
}

type OpenAIContent =
  | string
  | Array<{ type: "text"; text: string } | { type: "image_url"; image_url: { url: string } }>;

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
    } else messages.push({ role: m.role, content: m.content });
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
  while (contents.length > 1 && contents[0].role === "model") contents.shift();
  const deadline = Date.now() + (imageDataUrl ? 20000 : 9000);
  for (const model of geminiModels()) {
    if (Date.now() > deadline) break;
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
      const controller = new AbortController();
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
      if (res.status === 401 || res.status === 403) return { ok: false, error: `gemini_auth_${res.status}` };
      if (!res.ok) continue;
      const json = (await res.json()) as { candidates?: { content?: { parts?: { text?: string }[] } }[] };
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
  const valid = parts.filter((p) => p === "bank" || p === "openai" || p === "gemini");
  return valid.length ? valid : DEFAULT_ORDER;
}

async function chatComplete(
  system: string,
  history: ChatMsg[],
  maxTokens: number,
  imageDataUrl?: string,
): Promise<ChatResult> {
  for (const p of providerOrder()) {
    if (p === "bank") continue;
    const r =
      p === "openai"
        ? await callOpenAI(system, history, maxTokens, imageDataUrl)
        : await callGemini(system, history, maxTokens, imageDataUrl);
    if (r.ok) return r;
  }
  return { ok: false, error: "all_providers_failed" };
}

async function withLocalVisual(lastUser: string, text: string): Promise<string> {
  text = text
    .replace(/\[تصویر\]/g, "")
    .replace(/متاسفانه[^\n]{0,80}تصویر[^\n]{0,120}/gi, "")
    .replace(/نمی\s*توانم[^\n]{0,40}تصویر[^\n]{0,80}/gi, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  if (/\[diagram:/i.test(text) || /!\[[^\]]*\]\(https?:\/\//i.test(text)) return text;
  const d = matchDiagram(lastUser);
  if (d) return `${text}\n\n${diagramTag(d.id)}`;
  const q = queryFromPersian(lastUser, true);
  if (!q || q.length < 2) return text;
  const img = await findWikiImage(q);
  return img ? `${text}\n\n${wikiMarkdown(img)}` : text;
}

export const askPouya = createServerFn({ method: "POST" })
  .validator((input: unknown) => ChatInput.parse(input))
  .handler(async ({ data }) => {
    try {
      const short = data.mode === "live" || data.mode === "language";
      const hasImage = Boolean(data.image && parseDataUrl(data.image));
      const lastUser = [...data.messages].reverse().find((m) => m.role === "user")?.content || "";
      const history = data.messages.map((m) =>
        m.role === "assistant" ? { ...m, content: m.content.replace(/!\[[^\]]*\]\([^)]*\)/g, "[تصویر]") } : m,
      );

      if (!hasImage && !short && isBankWorthyQuestion(lastUser)) {
        const learned = brainLookup(lastUser);
        if (learned?.a) {
          return { ok: true as const, text: await withLocalVisual(lastUser, learned.a), provider: "brain" };
        }
      }

      if (!hasImage && !short) {
        const b = bankReply({ messages: data.messages, mode: data.mode, lang: data.lang });
        if (b) return { ok: true as const, text: await withLocalVisual(lastUser, b), provider: "bank" };
      }

      const result = await chatComplete(
        systemPrompt(data.level, data.mode, data.lang, data.assistantId, hasImage, data.learningBrief),
        history,
        short ? 1024 : 2048,
        hasImage ? data.image : undefined,
      );

      if (result.ok) {
        let text = stripForeignImages(sanitizeStudentMath(result.text, data.level));
        const wiki = await resolveWikiTags(text);
        text = wiki.text;
        if (!/!\[[^\]]*\]\(https?:\/\//i.test(text)) {
          text = await withLocalVisual(lastUser, text);
        } else {
          text = text.replace(/\[تصویر\]/g, "").trim();
        }
        brainRemember(lastUser, text);
        return { ok: true as const, text, provider: result.provider };
      }

      const fallback = localTutorReply({
        messages: data.messages,
        mode: data.mode === "language" ? "live" : data.mode,
        lang: data.lang,
      });
      return { ok: true as const, text: await withLocalVisual(lastUser, fallback), provider: "local" };
    } catch {
      return { ok: false as const, error: "handler_error" };
    }
  });

export const makeQuiz = createServerFn({ method: "POST" })
  .validator((input: unknown) => QuizInput.parse(input))
  .handler(async ({ data }) => {
    try {
      return { ok: true as const, quiz: localQuiz(data.topic) };
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
      if (!key) return { ok: false as const, error: "no_tts_key" };
      const model = process.env.OPENAI_TTS_MODEL || "tts-1";
      const voice = process.env.OPENAI_TTS_VOICE || "echo";
      const res = await fetch(`${baseUrl}/audio/speech`, {
        method: "POST",
        headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
        body: JSON.stringify({ model, voice, input: text, response_format: "mp3" }),
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
      return { ok: true as const, text: todayFact() };
    } catch {
      return { ok: false as const, error: "unavailable" };
    }
  });
