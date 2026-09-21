/**
 * جستجوی تصویر از ویکی‌مدیا — هر موضوع دیدنی؛ فقط محتوای جنسی فیلتر می‌شود.
 */

export type WikiImage = { url: string; alt: string; label: string };

const UA = "PouyaApp/1.0 (educational app; https://prairie-pine-drift-earth.vercel.app)";
/** فقط محتوای جنسی — بقیه موضوعات آزاد */
const EN_BLOCK =
  /\b(nud(e|ity)|sex(ual|y)?|erotic|porn\w*|genital\w*|penis|vagina|vulva|breasts?\b|bikini|lingerie|hentai|xxx|nsfw)\b/i;
const FA_BLOCK = /(برهنه|پورن|سکس|آلت\s*تناسلی|شهوت|جنسی)/;
const JUNK_TITLE = /(logo|icon|flag of|coat of arms|signature|question mark|commons-|wikipedia-|wikimedia-|stub|placeholder)/i;
const UPLOAD = "https://upload.wikimedia.org/";

const cache = new Map<string, { at: number; v: WikiImage | null }>();
const TTL_MS = 6 * 60 * 60 * 1000;

async function getJson<T>(url: string, ms: number): Promise<T | null> {
  const c = new AbortController();
  const t = setTimeout(() => c.abort(), ms);
  try {
    const r = await fetch(url, {
      headers: { "User-Agent": UA, "Api-User-Agent": UA, Accept: "application/json" },
      signal: c.signal,
    });
    if (!r.ok) return null;
    return (await r.json()) as T;
  } catch {
    return null;
  } finally {
    clearTimeout(t);
  }
}

function stripHtml(s: string): string {
  return s.replace(/<[^>]*>/g, " ").replace(/&[a-z#0-9]+;/gi, " ").replace(/\s+/g, " ").trim();
}
function cleanLabel(s: string, max = 80): string {
  return s.replace(/[*[\]()`<>\r\n]/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
}
function safeUrl(u: string): string {
  return u.replace(/\(/g, "%28").replace(/\)/g, "%29").replace(/\s/g, "%20");
}

type CommonsPage = {
  title: string;
  index?: number;
  imageinfo?: {
    thumburl?: string;
    url?: string;
    mime?: string;
    width?: number;
    extmetadata?: Record<string, { value?: string }>;
  }[];
};

async function commonsImage(q: string): Promise<WikiImage | null> {
  const params = new URLSearchParams({
    action: "query",
    format: "json",
    formatversion: "2",
    generator: "search",
    gsrsearch: q,
    gsrnamespace: "6",
    gsrlimit: "20",
    prop: "imageinfo",
    iiprop: "url|mime|size|extmetadata",
    iiurlwidth: "900",
    iiextmetadatafilter: "LicenseShortName|Artist|Categories|NonFree",
  });
  const j = await getJson<{ query?: { pages?: CommonsPage[] } }>(
    `https://commons.wikimedia.org/w/api.php?${params.toString()}`,
    3500,
  );
  const pages = (j?.query?.pages ?? []).slice().sort((a, b) => (a.index ?? 999) - (b.index ?? 999));
  for (const p of pages) {
    const info = p.imageinfo?.[0];
    if (!info) continue;
    if (!["image/jpeg", "image/png", "image/svg+xml"].includes(info.mime || "")) continue;
    if ((info.width ?? 0) < 300) continue;
    const thumb = info.thumburl || info.url || "";
    if (!thumb.startsWith(UPLOAD)) continue;
    const name = p.title.replace(/^File:/i, "").replace(/\.[a-z0-9]+$/i, "").replace(/_/g, " ");
    if (JUNK_TITLE.test(name) || EN_BLOCK.test(name)) continue;
    const meta = info.extmetadata ?? {};
    if (meta.NonFree?.value) continue;
    const license = stripHtml(meta.LicenseShortName?.value || "");
    if (!license) continue;
    if (EN_BLOCK.test(meta.Categories?.value || "")) continue;
    const artist = cleanLabel(stripHtml(meta.Artist?.value || ""), 40);
    return {
      url: safeUrl(thumb),
      alt: cleanLabel(name, 60) || "تصویر",
      label: `ویکی‌مدیا — ${cleanLabel(name, 60)}${artist ? " — " + artist : ""}`,
    };
  }
  return null;
}

async function faWikiImage(q: string): Promise<WikiImage | null> {
  const params = new URLSearchParams({
    action: "query",
    format: "json",
    formatversion: "2",
    generator: "search",
    gsrsearch: q,
    gsrnamespace: "0",
    gsrlimit: "6",
    prop: "pageimages",
    piprop: "thumbnail",
    pithumbsize: "900",
  });
  const j = await getJson<{
    query?: { pages?: { title: string; index?: number; thumbnail?: { source?: string } }[] };
  }>(`https://fa.wikipedia.org/w/api.php?${params.toString()}`, 2500);
  const pages = (j?.query?.pages ?? []).slice().sort((a, b) => (a.index ?? 999) - (b.index ?? 999));
  for (const p of pages) {
    const src = p.thumbnail?.source || "";
    if (!src.startsWith(UPLOAD) || !src.includes("/wikipedia/commons/")) continue;
    if (FA_BLOCK.test(p.title)) continue;
    return {
      url: safeUrl(src),
      alt: cleanLabel(p.title, 60),
      label: `ویکی‌پدیا — ${cleanLabel(p.title, 60)}`,
    };
  }
  return null;
}

export async function findWikiImage(query: string): Promise<WikiImage | null> {
  const q = query.trim().slice(0, 90);
  if (q.length < 2) return null;
  if (EN_BLOCK.test(q) || FA_BLOCK.test(q)) return null;
  const key = q.toLowerCase();
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < TTL_MS) return hit.v;
  let img = await commonsImage(q);
  if (!img && /[\u0600-\u06FF]/.test(q)) img = await faWikiImage(q);
  if (!img && /[\u0600-\u06FF]/.test(q)) img = await commonsImage(q + " diagram");
  if (cache.size > 200) cache.clear();
  cache.set(key, { at: Date.now(), v: img });
  return img;
}

export function wikiMarkdown(img: WikiImage): string {
  return `![${img.alt}](${img.url})\n*${img.label}*`;
}

export function stripForeignImages(text: string): string {
  return text.replace(/!\[[^\]]*\]\(([^)]*)\)/g, (m, url: string) => (url.trim().startsWith(UPLOAD) ? m : ""));
}

export async function resolveWikiTags(text: string): Promise<{ text: string; found: boolean }> {
  const re = /\[wiki:([^\]]{1,120})\]/gi;
  const tags = [...text.matchAll(re)];
  if (!tags.length) return { text, found: false };
  const rawQuery = tags[0][1].replace(/[^\p{L}\p{N} -]/gu, " ").replace(/\s+/g, " ").trim().slice(0, 70);
  if (EN_BLOCK.test(rawQuery) || FA_BLOCK.test(rawQuery)) {
    return { text: text.replace(re, "").replace(/\n{3,}/g, "\n\n").trim(), found: false };
  }
  const q = /[\u0600-\u06FF]/.test(rawQuery) ? (queryFromPersian(rawQuery, true) ?? rawQuery) : rawQuery;
  const img = q ? await findWikiImage(q) : null;
  let used = false;
  const out = text.replace(re, () => {
    if (img && !used) {
      used = true;
      return `\n\n${wikiMarkdown(img)}\n\n`;
    }
    return "";
  });
  return { text: out.replace(/\n{3,}/g, "\n\n").trim(), found: Boolean(img) };
}

const VISUAL_RE =
  /(عکس|تصویر|شکل|نمودار|برش|نقشه|ساختار|اجزا|نشان\s*بده|نشون\s*بده|نشونم|ببینم|دیاگرام|طرح|چهره|gallery|photo|picture|map|diagram)/i;

export function looksVisual(text: string): boolean {
  if (VISUAL_RE.test(text)) return true;
  if (/(را\s+)?(نشون|نشان)\s*(بده|بدهید|ده)/.test(text)) return true;
  if (/\b(show|image|photo|picture|map of)\b/i.test(text)) return true;
  return false;
}

const FA_EN: [string, string][] = [
  ["ستون فقرات", "vertebral column"], ["منظومه شمسی", "solar system"], ["دستگاه گوارش", "digestive system"],
  ["دستگاه عصبی", "nervous system"], ["دستگاه تنفس", "respiratory system"], ["دستگاه گردش خون", "circulatory system"],
  ["جدول تناوبی", "periodic table"], ["چرخه آب", "water cycle"],
  ["سلول گیاهی", "plant cell"], ["سلول جانوری", "animal cell"], ["دی ان ای", "DNA"], ["فتوسنتز", "photosynthesis"],
  ["برش افقی", "axial section"], ["برش عرضی", "cross section"], ["برش", "section"],
  ["مغز", "brain"], ["قلب", "heart"], ["ریه", "lung"], ["کلیه", "kidney"], ["کبد", "liver"], ["معده", "stomach"],
  ["استخوان", "bone"], ["ماهیچه", "muscle"], ["عضله", "muscle"], ["سلول", "cell"], ["نورون", "neuron"],
  ["اتم", "atom"], ["مولکول", "molecule"], ["خورشید", "sun"], ["ماه", "moon"], ["زمین", "earth"],
  ["نقشه", "map"], ["سیاه چاله", "black hole"], ["سیاه‌چاله", "black hole"], ["ابر کومولوس", "cumulus cloud"],
  ["کومولوس", "cumulus"], ["آمریکا", "United States map"], ["ایالات متحده", "United States map"],
  ["نقشه آمریکا", "United States map"], ["کهکشان", "galaxy"], ["مریخ", "Mars"], ["مشتری", "Jupiter"],
];

const FILLER = new Set(
  ("با توضیح کامل بده بدین بگو رو را از این آن یک چیست چی هست است نشون نشان بدید عکس تصویر شکل نمودار ساختار اجزا و در به برای ببینم چطور چگونه کار می‌کند میکند")
    .split(" "),
);

const norm = (s: string) =>
  s.replace(/\u200c/g, " ").replace(/[؟?!.,،؛:()«»"']/g, " ").replace(/\s+/g, " ").trim();

/** از متن کاربر عبارت جستجو می‌سازد — ازپیش‌تعریف لازم نیست */
export function queryFromPersian(text: string, loose = false): string | null {
  let t = norm(text);
  const subjects: string[] = [];
  const mods: string[] = [];
  const keys = [...FA_EN].sort((a, b) => norm(b[0]).length - norm(a[0]).length);
  for (const [fa, en] of keys) {
    const k = norm(fa);
    let hit = false;
    if (k.includes(" ")) {
      if (t.includes(k)) {
        hit = true;
        t = t.replace(k, " ");
      }
    } else {
      const toks = t.split(" ");
      const idx = toks.findIndex(
        (x) => x === k || x === k + "ها" || x === k + "های" || x === k + "ی" || x === k + "ام",
      );
      if (idx >= 0) {
        hit = true;
        toks.splice(idx, 1);
        t = toks.join(" ");
      }
    }
    if (hit) (en.includes("section") ? mods : subjects).push(en);
  }
  const terms = [...subjects.slice(0, 2), ...mods.slice(0, 1)];
  if (terms.length) return terms.join(" ");
  if (!loose && !looksVisual(text)) return null;
  const rest = norm(text)
    .split(" ")
    .filter((w) => w.length > 1 && !FILLER.has(w))
    .slice(0, 6)
    .join(" ");
  return rest.length >= 2 ? rest : null;
}
