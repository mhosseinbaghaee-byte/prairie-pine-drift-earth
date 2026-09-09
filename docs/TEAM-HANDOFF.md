# پویا — سند تحویل تیم (داخلی)

> **این سند برای اعضای تیم است.** ریپو را Public نکنید مگر عمداً تصمیم گرفته شود.  
> کلید API، توکن Vercel/Liara، و رمزها را اینجا ننویسید — فقط در Vercel Env / مدیر پروژه.

آخرین به‌روزرسانی: ۲۰۲۶-۰۹-۰۹

---

## ۱) پروژه چیست؟

**پویا (Pouya)** اپ آموزشی فارسی‌محور با شخصیت انیمیشنی است:

| بخش | کار |
|-----|-----|
| گفتگو | چت متنی با پویا + پیوست عکس/متن جزوه |
| زبان | تمرین مکالمه زنده |
| گفتگوی صوتی | صفحه تمام‌صفحه با تایپ/میکروفون + TTS |
| آزمون | کوییز موضوعی |
| مغز دوم (Vault) | یادداشت‌های محلی |
| مربی‌ها | انتخاب مربی موضوعی |
| حساب | پروفایل/اشتراک (پایه) |
| تاریخچه | ذخیره محلی گفتگوها |

**اولویت UX:** موبایل (اسمارت‌فون)، تم قرمز، ناوبری شیشه‌ای.

**دیپلوی زنده:** `https://prairie-pine-drift-earth.vercel.app/`  
**ریپو:** `mhosseinbaghaee-byte/prairie-pine-drift-earth` (شاخه `main` → Vercel)

---

## ۲) چی بود → چی شد (خلاصه مسیر)

### نقطه شروع
- ایده: مربی زنده دانش و زبان با چت + کوییز + Vault
- استک: TanStack Start (React 19 + Vite) + Tailwind v4 + Radix
- AI چندفروشنده در `src/lib/ai.ts`

### کارهای اصلی انجام‌شده
1. **UI موبایل:** تب‌ها (گفتگو → زبان → مربی‌ها → آزمون → مغز دوم → حساب)، تم قرمز، حذف انیمیشن‌های اضافه به‌جز اینتروی ورودی
2. **گفتگوی صوتی:** آیکون سر پویا → صفحه صدا؛ دکمه ارسال متن برای تایپ
3. **صدا (TTS):** از طریق Liara/OpenAI-compatible (`OPENAI_BASE_URL` + `tts-1` / echo)؛ فقط تب گفتگو + گفتگوی صوتی (برای صرفه‌جویی توکن)
4. **چت AI:** اتصال به Liara (OpenAI-compatible) و Gemini به‌عنوان fallback؛ کلیدها فقط در Vercel Env
5. **پیوست (+):** عکس جزوه / فایل متنی در کامپوزر چت
6. **شکل‌های هندسی:** رندر `[shape:rhombus]` و مشابه در `rich-text.tsx`
7. **تاریخچه گفتگو:** `src/lib/chat-history.ts` + دکمه تاریخچه در UI (localStorage)
8. **معماری نقش مربی/دانش‌آموز:** فقط سند — `docs/phase-a-roles.md` (هنوز کد حساب دو‌نقشه پیاده نشده)

### باگ‌های مهم و درس‌ها
| مشکل | علت | رفع |
|------|-----|-----|
| دکمه تمرین زبان / سر پویا کار نمی‌کرد | handler/prop قطع شده بود | بازیابی `pouya-main-app` |
| فایل‌ها با PLACEHOLDER خالی شدند | push اشتباه محتوا | restore از کامیت خوب |
| TTS صدای زن انگلیسی | کلید/مدل TTS جدا یا fallback مرورگر | `OPENAI_TTS_*` + voice echo + تشخیص فارسی |
| جواب انگلیسی در صدا | mode=live اجبار زبان | voice با mode=chat + قانون فارسی |
| جواب پرت (مثلاً سؤال مدل → درس کوتاه) | وقتی API fail می‌شود `localTutorReply` موضوع را می‌دزدید | اصلاح fallback + system prompt (۲۰۲۶-۰۹-۰۹) |
| TTS همه‌جا توکن می‌سوزاند | playVoice روی همه تب‌ها | محدود به تب گفتگو + voice call؛ بلندگو پیش‌فرض خاموش |

---

## ۳) معماری کد (نقشه سریع)

```
src/
  components/
    pouya-main-app.tsx     # state اصلی، send، voice، تاریخچه، تب‌ها
    pouya-chat-live.tsx    # ChatPane / LivePane، + پیوست، تاریخچه UI
    pouya-voice-call.tsx   # صفحه گفتگوی صوتی + دکمه ارسال
    pouya-quiz-vault.tsx   # آزمون + مغز دوم
    rich-text.tsx          # markdown سبک + shape SVG
    coaches-pane.tsx / account-pane.tsx
  lib/
    ai.ts                  # askPouya / speakPouya / makeQuiz — OpenAI(Liara)+Gemini
    library-reply.ts       # fallback محلی وقتی API نیست
    library-data.ts        # درس‌های آماده / matchLesson
    chat-history.ts        # localStorage sessions
    vault.ts               # یادداشت‌ها
    topics.ts / assistants.ts / curriculum.ts
    auth/                  # Better Auth (فعلاً اغلب خاموش در env)
docs/
  phase-a-roles.md         # نقشه نقش مربی/دانش‌آموز
  TEAM-HANDOFF.md          # همین فایل
```

**جریان چت:**  
`ChatPane` → `send()` در main → `askPouya` (server fn) → OpenAI/Liara سپس Gemini → اگر fail → `localTutorReply`.

**جریان صدا:**  
`playVoice` فقط اگر `tab==="chat" && voiceOn` یا `voiceCall` باز باشد → `speakPouya` → TTS Liara/OpenAI یا Web Speech.

---

## ۴) متغیرهای محیطی (Vercel) — نام‌ها نه مقادیر

| متغیر | نقش |
|--------|-----|
| `OPENAI_API_KEY` | کلید چت Liara/OpenAI-compatible |
| `OPENAI_BASE_URL` | مثلاً `https://ai.liara.ir/api/.../v1` |
| `OPENAI_MODEL` | مثلاً `openai/gpt-4o-mini` |
| `OPENAI_TTS_KEY` | اختیاری؛ اگر TTS کلید جدا دارد |
| `OPENAI_TTS_BASE_URL` / `OPENAI_TTS_MODEL` / `OPENAI_TTS_VOICE` | اختیاری |
| `GEMINI_API_KEY` | fallback |
| `AI_PROVIDER_ORDER` | اختیاری |

**هرگز** کلید را در README یا کامیت نگذارید.

---

## ۵) وضعیت فعلی قابلیت‌ها

| قابلیت | وضعیت |
|--------|--------|
| چت فارسی | کار می‌کند (وابسته به کلید) |
| Fallback محلی | اصلاح‌شده — موضوع را ندزدد |
| TTS مردانه | وابسته به کلید TTS |
| پیوست عکس | UI هست؛ vision کامل چندموداله محدود |
| تاریخچه | محلی روی دستگاه |
| آزمون / Vault | محلی |
| حساب دو‌نقشه مربی/دانش‌آموز | فقط معماری (فاز A) |
| Auth واقعی چندکاربره ابری | آماده در کدبیس؛ پیش‌فرض اغلب خاموش |

---

## ۶) بدهی فنی / کارهای بعدی پیشنهادی

1. اطمینان از پایدار بودن کلید Liara و لاگ `[pouya-ai]` در Vercel
2. Vision واقعی برای عکس جزوه (image_url در messages)
3. فاز A1–A2 نقش و کد کلاس (طبق `phase-a-roles.md`)
4. همگام‌سازی تاریخچه با حساب بعد از auth
5. تست E2E موبایل (Chrome Android)
6. جلوگیری از تکرار push با محتوای خالی/PLACEHOLDER

---

## ۷) دستورات محلی

```bash
npm install
npm run dev      # :8080
npm run build
npm run typecheck
npm test
```

---

## ۸) قانون همکاری تیم

- قبل از push بزرگ: `npm run typecheck` و یک تست دستی چت روی موبایل
- کلید و توکن فقط در داشبورد Vercel / مدیر
- تغییر معماری حساب‌ها فقط بعد از به‌روز کردن `docs/phase-a-roles.md`
- این سند را با هر milestone مهم آپدیت کنید

— پایان سند داخلی —
