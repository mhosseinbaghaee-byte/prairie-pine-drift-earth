/**
 * جستجوی تصویر از ویکی‌مدیا — هر موضوع دیدنی؛ فقط محتوای جنسی فیلتر می‌شود.
 */

export type WikiImage = { url: string; alt: string; label: string };

const UA = "PouyaApp/1.0 (educational app; https://prairie-pine-drift-earth.vercel.app)";
const EN_BLOCK =
  /\b(nud(e|ity)|sex(ual|y)?|erotic|porn\w*|genital\w*|penis|vagina|vulva|breasts?\b|bikini|lingerie|hentai|xxx|nsfw)\b/i;
const FA_BLOCK = /(برهنه|پورن|سکس|آلت\s*تناسلی|شهوت|جنسی)/;
const JUNK_TITLE =
  /(logo|icon|flag of|coat of arms|signature|question mark|commons-|wikipedia-|wikimedia-|stub|placeholder|laurel|hardy)/i;
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
    4000,
  );
  const pages = (j?.query?.pages ?? []).slice().sort((a, b) => (a.index ?? 999) - (b.index ?? 999));
  for (const p of pages) {
    const info = p.imageinfo?.[0];
    if (!info) continue;
    if (!["image/jpeg", "image/png", "image/svg+xml"].includes(info.mime || "")) continue;
    if ((info.width ?? 0) < 280) continue;
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
    gsrlimit: "8",
    prop: "pageimages",
    piprop: "thumbnail",
    pithumbsize: "900",
  });
  const j = await getJson<{
    query?: { pages?: { title: string; index?: number; thumbnail?: { source?: string } }[] };
  }>(`https://fa.wikipedia.org/w/api.php?${params.toString()}`, 3000);
  const pages = (j?.query?.pages ?? []).slice().sort((a, b) => (a.index ?? 999) - (b.index ?? 999));
  for (const p of pages) {
    const src = p.thumbnail?.source || "";
    if (!src.startsWith(UPLOAD) || !src.includes("/wikipedia/commons/")) continue;
    if (FA_BLOCK.test(p.title) || JUNK_TITLE.test(p.title)) continue;
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
  if (!img) img = await commonsImage(`${q} map`);
  if (!img) img = await commonsImage(`${q} diagram`);
  if (!img) img = await commonsImage(`${q} anatomy`);
  if (!img && /[\u0600-\u06FF]/.test(q)) img = await faWikiImage(q);

  if (cache.size > 200) cache.clear();
  cache.set(key, { at: Date.now(), v: img });
  return img;
}

export function wikiMarkdown(img: WikiImage): string {
  return `![${img.alt}](${img.url})\n*${img.label}*`;
}

export function stripForeignImages(text: string): string {
  return text.replace(/!\[[^\]]*\]\(([^)]*)\)/g, (m, url: string) =>
    url.trim().startsWith(UPLOAD) ? m : "",
  );
}

export async function resolveWikiTags(text: string): Promise<{ text: string; found: boolean }> {
  const re = /\[wiki:([^\]]{1,120})\]/gi;
  const tags = [...text.matchAll(re)];
  if (!tags.length) return { text, found: false };
  const rawQuery = tags[0][1].replace(/[^\p{L}\p{N} -]/gu, " ").replace(/\s+/g, " ").trim().slice(0, 70);
  if (EN_BLOCK.test(rawQuery) || FA_BLOCK.test(rawQuery)) {
    return { text: text.replace(re, "").replace(/\n{3,}/g, "\n\n").trim(), found: false };
  }
  const q = /[\u0600-\u06FF]/.test(rawQuery)
    ? queryFromPersian(rawQuery, true) ?? rawQuery
    : rawQuery;
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
  /(عکس|تصویر|شکل|نمودار|برش|نقشه|ساختار|اجزا|نشان\s*بده|نشون\s*بده|نشونم|ببینم|دیاگرام|طرح|چهره|gallery|photo|picture|map|diagram|تصاویر)/i;

export function looksVisual(text: string): boolean {
  if (VISUAL_RE.test(text)) return true;
  if (/(را\s+)?(نشون|نشان)\s*(بده|بدهید|ده|نمیدی|نمیده)/.test(text)) return true;
  if (/\b(show|image|photo|picture|map of)\b/i.test(text)) return true;
  return false;
}

const FA_EN: [string, string][] = [
  ["نقشه ایران", "Iran map"],
  ["نقشه آمریکا", "United States map"],
  ["نقشه جهان", "world map"],
  ["برش افقی مغز", "brain axial section"],
  ["برش عمودی مغز", "brain sagittal section"],
  ["برش مغز", "brain section anatomy"],
  ["تصویر مغز", "brain anatomy"],
  ["عکس مغز", "brain anatomy"],
  ["اتم رادیواکتیو", "radioactive atom diagram"],
  ["اتم پرتوزا", "radioactive atom diagram"],
  ["جدول تناوبی", "periodic table"],
  ["سیاه چاله", "black hole"],
  ["سیاه‌چاله", "black hole"],
  ["ابر کومولوس", "cumulus cloud"],
  ["سلول گیاهی", "plant cell"],
  ["سلول جانوری", "animal cell"],
  ["منظومه شمسی", "solar system"],
  ["دستگاه گوارش", "digestive system"],
  ["دستگاه عصبی", "nervous system"],
  ["دستگاه تنفس", "respiratory system"],
  ["دستگاه گردش خون", "circulatory system"],
  ["ستون فقرات", "vertebral column"],
  ["چرخه آب", "water cycle"],
  ["دی ان ای", "DNA"],
  ["فتوسنتز", "photosynthesis"],
  ["ایالات متحده", "United States map"],
  ["اکتینیوم", "actinium element"],
  ["رادیواکتیو", "radioactivity diagram"],
  ["مغز", "brain anatomy"],
  ["قلب", "heart anatomy"],
  ["ریه", "lung anatomy"],
  ["کلیه", "kidney anatomy"],
  ["کبد", "liver anatomy"],
  ["معده", "stomach anatomy"],
  ["استخوان", "bone anatomy"],
  ["ماهیچه", "muscle anatomy"],
  ["عضله", "muscle anatomy"],
  ["سلول", "cell biology"],
  ["نورون", "neuron diagram"],
  ["اتم", "atom diagram"],
  ["مولکول", "molecule diagram"],
  ["خورشید", "sun"],
  ["ماه", "moon"],
  ["زمین", "Earth"],
  ["کهکشان", "galaxy"],
  ["مریخ", "Mars"],
  ["مشتری", "Jupiter"],
  ["آمریکا", "United States map"],
  ["ایران", "Iran map"],
  ["نقشه", "map"],
  ["برش", "section anatomy"],
  ["کومولوس", "cumulus"],
];

const FILLER = new Set(
  (
    "با توضیح کامل بده بدین بگو رو را از این آن یک چیست چی هست است نشون نشان بدید " +
    "عکس تصویر شکل نمودار ساختار اجزا و در به برای ببینم چطور چگونه کار می‌کند میکند " +
    "سلام درود پویا لطفا میشه خواهشا نشونم نشون نمیدی چرا نمیدی کو"
  ).split(" "),
);

const norm = (s: string) =>
  s.replace(/\u200c/g, " ").replace(/[؟?!.,،؛:()«»"']/g, " ").replace(/\s+/g, " ").trim();

export function queryFromPersian(text: string, loose = false): string | null {
  let t = norm(text);
  const found: string[] = [];
  const keys = [...FA_EN].sort((a, b) => norm(b[0]).length - norm(a[0]).length);
  for (const [fa, en] of keys) {
    const k = norm(fa);
    if (k.includes(" ")) {
      if (t.includes(k)) {
        found.push(en);
        t = t.replace(k, " ");
      }
    } else {
      const toks = t.split(" ").filter(Boolean);
      const idx = toks.findIndex(
        (x) => x === k || x === k + "ها" || x === k + "های" || x === k + "ی" || x === k + "ام",
      );
      if (idx >= 0) {
        found.push(en);
        toks.splice(idx, 1);
        t = toks.join(" ");
      }
    }
    if (found.length >= 2) break;
  }
  if (found.length) return found.slice(0, 2).join(" ");

  if (!loose && !looksVisual(text)) return null;
  const rest = norm(text)
    .split(" ")
    .filter((w) => w.length > 1 && !FILLER.has(w))
    .slice(0, 5)
    .join(" ");
  return rest.length >= 2 ? rest : null;
}
