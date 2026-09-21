# پویا (Pouya)

اپ آموزشی فارسی‌محور با شخصیت انیمیشنی **پویا** — مربی زنده دانش و زبان برای دانش‌آموزان ایران.

**اولویت محصول:** موبایل / اسمارت‌فون  
**دیپلوی فعلی:** [prairie-pine-drift-earth.vercel.app](https://prairie-pine-drift-earth.vercel.app/)

> اسناد داخلی تیم: [`docs/TEAM-HANDOFF.md`](./docs/TEAM-HANDOFF.md) · نقش‌ها: [`docs/phase-a-roles.md`](./docs/phase-a-roles.md)  
> ریپو را بدون تصمیم عمدی Public نکنید. **هرگز کلید API را در README یا کد نگذارید.**

---

## امکانات

| بخش | توضیح |
|-----|--------|
| **گفتگو** | چت متنی، پیوست عکس/جزوه، تاریخچه محلی |
| **زبان** | تمرین مکالمه |
| **مربی‌ها** | انتخاب دستیار / شروع درس |
| **آزمون** | کوییز محلی |
| **مغز دوم** | یادداشت‌ها (Vault) |
| **حساب** | پروفایل / اسکلت نقش مربی–دانش‌آموز |
| **مکالمه صوتی** | فقط با باز کردن کله پویا — TTS پولی |
| **تصویر** | بانک شکل درسی + جستجوی ویکی‌مدیا (فقط محتوای جنسی فیلتر) |

**صدا در چت عادی خاموش است** (نه TTS سرور، نه صدای مرورگر).

---

## معماری جواب (هوش + بانک)

```
سؤال کاربر
    │
    ├─۱─ مغز یادگیرنده (pouya-brain)  → اگر قبلاً یاد گرفته، رایگان
    ├─۲─ بانک ثابت (bank-first)       → سلام / درس خیلی کوتاه
    ├─۳─ Gemini (رایگان)              → فهم و جواب هوشمند
    ├─۴─ لیارا / OpenAI-compatible    → اگر Gemini قطع بود
    └─۵─ پاسخ محلی (library-reply)    → آخرین امید
         │
         └─ تصویر: بانک شکل → ویکی‌مدیا اینترنت
              └─ جواب خوب مدل در مغز ذخیره می‌شود (دفعه بعد رایگان‌تر)
```

---

## پشته فنی

| بخش | فناوری |
|-----|--------|
| فریم‌ورک | TanStack Start (React 19 + Vite) |
| استایل | Tailwind CSS v4 |
| UI | Radix UI + lucide-react |
| AI | `src/lib/ai.ts` — Gemini → لیارا → محلی |
| تصویر | `src/lib/wiki-image.ts` + `src/lib/lesson-diagrams.ts` |
| دیپلوی | Vercel |

---

## ساختار مهم کد

```
src/
  components/
    pouya-main-core.tsx   # هسته UI، تب‌ها، چت، مکالمه صوتی
    pouya-panes.tsx       # Chat / Live / Quiz / Vault
    rich-text.tsx         # رندر متن، نمودار، زوم تصویر
    pouya-voice-call.tsx  # باکس مکالمه صوتی
  lib/
    ai.ts                 # askPouya / speakPouya / makeQuiz
    pouya-brain.ts        # حافظه یادگیرنده (server warm)
    bank-first.ts         # بانک ثابت کوتاه
    wiki-image.ts         # جستجوی تصویر اینترنت
    lesson-diagrams.ts    # بانک شکل درسی
    library-*.ts          # پاسخ/داده محلی
    chat-history.ts       # تاریخچه چت (localStorage)
    learning-memory.ts    # حافظه یادگیری کاربر (کلاینت)
  routes/
    index.tsx             # ورود به اپ
docs/
  TEAM-HANDOFF.md
  phase-a-roles.md
```

---

## متغیرهای محیطی (Vercel)

| کلید | نقش |
|------|-----|
| `GEMINI_API_KEY` | Gemini (اولویت اول چت) |
| `GEMINI_MODELS` | اختیاری — مثلاً `gemini-2.0-flash,gemini-2.5-flash,gemini-1.5-flash` |
| `AI_PROVIDER_ORDER` | پیشنهاد: `gemini,openai` |
| `OPENAI_API_KEY` | کلید لیارا / OpenAI-compatible |
| `OPENAI_BASE_URL` | آدرس API لیارا |
| `OPENAI_MODEL` | مدل لیارا (مثلاً `gpt-4o-mini`) |
| `OPENAI_TTS_KEY` | کلید TTS (مکالمه صوتی) |
| `OPENAI_TTS_MODEL` / `OPENAI_TTS_VOICE` | اختیاری — پیش‌فرض `tts-1` / `echo` |

کلیدها فقط در پنل Vercel (یا `.env` محلی غیرکامیت).

---

## اجرا محلی

```bash
npm install
npm run dev
```

اسکریپت‌های مفید: `build` · `typecheck` · `preview`

---

## اصول محصول (خلاصه)

1. **هوشمند باشد** — سؤال بچه را بفهمد؛ مثل ربات کلمات کلیدی نباشد.
2. **مقرون‌به‌صرفه** — Gemini اول؛ بانک/مغز برای تکرار؛ TTS فقط در مکالمه صوتی.
3. **تصویر باز** — هر موضوع دیدنی از اینترنت (ویکی)؛ فقط جنسی فیلتر.
4. **موبایل اول** — UI برای گوشی.
5. **تمیزکاری** — مسیر جواب واحد؛ از لایه‌های متضاد پرهیز شود.

---

## وضعیت و بدهی فنی

- حساب مربی/دانش‌آموز: معماری در `docs/phase-a-roles.md` — پیاده‌سازی کامل بعداً
- مغز یادگیرنده: حافظه instance روی Vercel (warm)؛ پایدارسازی ابری در آینده
- Auth / DB اسکلت در `src/lib/auth` و `app-data` — بخشی از اسکفولد

جزئیات برای اعضای تیم: **`docs/TEAM-HANDOFF.md`**
