/**
 * مغز/بانک یادگیرنده پویا
 * - جواب کامل از بانک → بدون هزینه توکن
 * - جواب از AI → ذخیره برای دفعه بعد
 * - تصویر: اول بانک شکل، بعد ویکی (کَش در حافظه)
 * توجه: روی Vercel حافظه در حافظه‌ی instance است؛ با warm reuse کار می‌کند.
 * کلاینت هم می‌تواند همان را در localStorage نگه دارد (فاز بعد).
 */

export type BrainEntry = {
  q: string;
  a: string;
  imageUrl?: string;
  hits: number;
  updatedAt: number;
};

const MAX = 300;
const qa = new Map<string, BrainEntry>();
const imgCache = new Map<string, string>(); // query -> url

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

/** فقط برای سؤال‌های کوتاه تعریفی — نه گفتگوی عمیق */
export function isBankWorthyQuestion(q: string): boolean {
  const t = q.trim();
  if (t.length < 4 || t.length > 120) return false;
  if (/(کامل|مفصل|عمیق|مثال|چرا|چطور|چگونه|مقایسه|حل کن|محاسبه|ترجمه)/.test(t)) return false;
  return true;
}

export function brainLookup(question: string): BrainEntry | null {
  const key = normalizeQ(question);
  if (!key || key.length < 3) return null;
  const hit = qa.get(key);
  if (hit) {
    hit.hits += 1;
    return hit;
  }
  // تطبیق نرم: کلید داخل سؤال یا برعکس
  for (const [k, v] of qa) {
    if (k.length < 6) continue;
    if (key.includes(k) || k.includes(key)) {
      v.hits += 1;
      return v;
    }
  }
  return null;
}

export function brainRemember(question: string, answer: string, imageUrl?: string): void {
  if (!isBankWorthyQuestion(question)) return;
  if (!answer || answer.length < 40) return;
  // پیام‌های «مدل در دسترس نیست» را ذخیره نکن
  if (/اتصال مدل|در دسترس نیست|دانش آماده‌ام/.test(answer)) return;
  const key = normalizeQ(question);
  if (!key) return;
  qa.set(key, {
    q: question.trim().slice(0, 200),
    a: answer.slice(0, 4000),
    imageUrl,
    hits: (qa.get(key)?.hits || 0) + 1,
    updatedAt: Date.now(),
  });
  if (qa.size > MAX) {
    // حذف قدیمی‌ترین
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
