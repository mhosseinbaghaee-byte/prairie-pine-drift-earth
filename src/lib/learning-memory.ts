/**
 * حافظه بلندمدت آموزشی محلی (دستگاه کاربر)
 * برای شخصی‌سازی پاسخ و برنامه — هنوز ابری نیست.
 */

const KEY = "pouya-learning-memory-v1";
const MAX_EVENTS = 80;
const MAX_TOPICS = 24;

export type LearningEvent = {
  topic: string;
  kind: "ask" | "weak" | "strong" | "quiz";
  at: string;
};

export type LearningMemory = {
  events: LearningEvent[];
  /** تعداد پرسش هر موضوع */
  topicCounts: Record<string, number>;
  weakTopics: string[];
  strongTopics: string[];
  updatedAt: string;
};

function empty(): LearningMemory {
  return {
    events: [],
    topicCounts: {},
    weakTopics: [],
    strongTopics: [],
    updatedAt: new Date(0).toISOString(),
  };
}

function read(): LearningMemory {
  if (typeof window === "undefined") return empty();
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return empty();
    const p = JSON.parse(raw) as LearningMemory;
    return {
      ...empty(),
      ...p,
      events: Array.isArray(p.events) ? p.events : [],
      topicCounts: p.topicCounts || {},
      weakTopics: p.weakTopics || [],
      strongTopics: p.strongTopics || [],
    };
  } catch {
    return empty();
  }
}

function write(m: LearningMemory) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(KEY, JSON.stringify(m));
  } catch {
    /* ignore */
  }
}

/** الگوهای تزریق / یخ‌زدن که هرگز نباید موضوع یا brief شوند */
const BLOCKED =
  /(ignore\s+all|system\s*prompt|you\s+are\s+now|\bconstructor\b|Object\s*\(|function\s*\(|__proto__|prototype\s*=|eval\s*\(|<script|javascript:)/i;

/** استخراج موضوع ساده از متن کاربر — فقط کلمات ایمن */
export function inferTopic(text: string): string {
  const t = text.replace(/\s+/g, " ").trim();
  if (!t || BLOCKED.test(t)) return "عمومی";
  const line = t.split("\n").map((l) => l.trim()).find(Boolean) || t;
  const cleaned = line
    .replace(/\[تصویر[^\]]*\]/g, "")
    .replace(/https?:\/\/\S+/g, "")
    .replace(/[*`#_<>{}[\]()]/g, " ")
    .replace(/\b(constructor|prototype|__proto__|function|Object)\b/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!cleaned || BLOCKED.test(cleaned)) return "عمومی";
  // فقط حروف، اعداد، فاصله و علائم فارسی/انگلیسی رایج
  const safe = cleaned.replace(/[^\p{L}\p{N}\s\-_.،؟?]/gu, " ").replace(/\s+/g, " ").trim();
  return (safe.slice(0, 48) || "عمومی");
}

export function noteInteraction(input: {
  userText: string;
  kind?: LearningEvent["kind"];
  markWeak?: boolean;
  markStrong?: boolean;
}) {
  const topic = inferTopic(input.userText);
  if (topic === "عمومی" && input.userText.trim().length < 4) return read();
  const mem = read();
  const at = new Date().toISOString();
  const kind = input.kind || "ask";
  mem.events = [{ topic, kind, at }, ...mem.events].slice(0, MAX_EVENTS);
  mem.topicCounts[topic] = (mem.topicCounts[topic] || 0) + 1;

  const keys = Object.keys(mem.topicCounts).sort(
    (a, b) => (mem.topicCounts[b] || 0) - (mem.topicCounts[a] || 0),
  );
  if (keys.length > MAX_TOPICS) {
    for (const k of keys.slice(MAX_TOPICS)) delete mem.topicCounts[k];
  }

  if (input.markWeak && !mem.weakTopics.includes(topic)) {
    mem.weakTopics = [topic, ...mem.weakTopics].slice(0, 12);
    mem.strongTopics = mem.strongTopics.filter((x) => x !== topic);
  }
  if (input.markStrong && !mem.strongTopics.includes(topic)) {
    mem.strongTopics = [topic, ...mem.strongTopics].slice(0, 12);
    mem.weakTopics = mem.weakTopics.filter((x) => x !== topic);
  }
  mem.updatedAt = at;
  write(mem);
  return mem;
}

export function markTopicWeak(topic: string) {
  const mem = read();
  const t = inferTopic(topic);
  if (!t || t === "عمومی") return mem;
  mem.weakTopics = [t, ...mem.weakTopics.filter((x) => x !== t)].slice(0, 12);
  mem.strongTopics = mem.strongTopics.filter((x) => x !== t);
  mem.updatedAt = new Date().toISOString();
  write(mem);
  return mem;
}

export function markTopicStrong(topic: string) {
  const mem = read();
  const t = inferTopic(topic);
  if (!t || t === "عمومی") return mem;
  mem.strongTopics = [t, ...mem.strongTopics.filter((x) => x !== t)].slice(0, 12);
  mem.weakTopics = mem.weakTopics.filter((x) => x !== t);
  mem.updatedAt = new Date().toISOString();
  write(mem);
  return mem;
}

export function loadLearningMemory(): LearningMemory {
  return read();
}

export function clearLearningMemory() {
  write(empty());
}

/** متن کوتاه برای system prompt — فقط موضوعات پاک‌شده */
export function learningBriefForPrompt(): string {
  const m = read();
  const top = Object.entries(m.topicCounts)
    .filter(([k]) => k && k !== "عمومی" && !BLOCKED.test(k))
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([k, n]) => `${k} (${n})`);
  const weak = m.weakTopics.filter((t) => t && !BLOCKED.test(t)).slice(0, 5);
  const strong = m.strongTopics.filter((t) => t && !BLOCKED.test(t)).slice(0, 5);
  const parts: string[] = [];
  if (top.length) parts.push(`موضوعات پرتکرار: ${top.join("؛ ")}`);
  if (weak.length) parts.push(`نقاط ضعف اعلام‌شده: ${weak.join("؛ ")}`);
  if (strong.length) parts.push(`نقاط قوت: ${strong.join("؛ ")}`);
  return parts.join("\n").slice(0, 700);
}
