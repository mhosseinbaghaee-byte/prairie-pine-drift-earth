/**
 * مغز یادگیرنده پویا
 * - کلید = سطح + مربی + سؤال نرمال‌شده (نه تطبیق نرم)
 * - جواب شخصی‌سازی‌شده ذخیره نمی‌شود
 */

export type BrainEntry = {
  q: string;
  a: string;
  level?: string;
  assistantId?: string;
  imageUrl?: string;
  hits: number;
  updatedAt: number;
};

const MAX = 300;
const qa = new Map<string, BrainEntry>();
const imgCache = new Map<string, string>();

export function normalizeQ(s: string): string {
  return s
    .toLowerCase()
    .replace(/\u200c/g, "")
    .replace(/[ي]/g, "ی")
    .replace(/[ك]/g, "ک")
    .replace(/[؟?!.،,;:«»"'\s]+/g, " ")
    .trim()
    .slice(0, 200);
}

function cacheKey(question: string, level?: string, assistantId?: string): string {
  return `${level || "teen"}|${assistantId || ""}|${normalizeQ(question)}`;
}

export function isBankWorthyQuestion(q: string): boolean {
  const t = q.trim();
  if (t.length < 4 || t.length > 100) return false;
  if (/(کامل|مفصل|عمیق|مثال|چرا|چطور|چگونه|مقایسه|حل کن|محاسبه|ترجمه)/.test(t)) return false;
  if (/(من|اسمم|سلام\s+\S+\s+جان|ناراحتم|خوشحالم)/.test(t) && t.length < 30) return false;
  return true;
}

function looksPersonalized(answer: string): boolean {
  return /(جان|عزیزم|اسمت|برای تو|سلام\s+\S+)/.test(answer);
}

export function brainLookup(
  question: string,
  level?: string,
  assistantId?: string,
): BrainEntry | null {
  const key = cacheKey(question, level, assistantId);
  if (!key || normalizeQ(question).length < 3) return null;
  const hit = qa.get(key);
  if (hit) {
    hit.hits += 1;
    return hit;
  }
  return null;
}

export function brainRemember(
  question: string,
  answer: string,
  opts?: { level?: string; assistantId?: string; imageUrl?: string },
): void {
  if (!isBankWorthyQuestion(question)) return;
  if (!answer || answer.length < 40) return;
  if (/اتصال مدل|در دسترس نیست|دانش آماده‌ام|نمی.?توانم.*تصویر/.test(answer)) return;
  if (looksPersonalized(answer)) return;
  const key = cacheKey(question, opts?.level, opts?.assistantId);
  if (!key) return;
  qa.set(key, {
    q: question.trim().slice(0, 200),
    a: answer.slice(0, 4000),
    level: opts?.level,
    assistantId: opts?.assistantId,
    imageUrl: opts?.imageUrl,
    hits: (qa.get(key)?.hits || 0) + 1,
    updatedAt: Date.now(),
  });
  if (qa.size > MAX) {
    let oldest = "";
    let t = Infinity;
    for (const [k, v] of qa) {
      if (v.updatedAt < t) {
        t = v.updatedAt;
        oldest = k;
      }
    }
    if (oldest) qa.delete(oldest);
  }
}

export function imageCacheGet(query: string): string | undefined {
  return imgCache.get(normalizeQ(query));
}

export function imageCacheSet(query: string, url: string): void {
  const k = normalizeQ(query);
  if (k && url) imgCache.set(k, url);
  if (imgCache.size > 200) {
    const first = imgCache.keys().next().value;
    if (first) imgCache.delete(first);
  }
}
