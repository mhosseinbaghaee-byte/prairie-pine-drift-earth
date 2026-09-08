# Pouya OS — Single Source of Truth

> هر تغییر بعدی را **فقط** بعد از خواندن این فایل انجام بده.
> هدف: جلوگیری از بازنویسی از صفر و باگ‌هایی مثل «تمرین زبان کار نمی‌کند».

**Repo:** `mhosseinbaghaee-byte/prairie-pine-drift-earth`  
**Live:** https://prairie-pine-drift-earth.vercel.app/  
**Stack:** TanStack Start (React 19 + Vite) + Tailwind v4 + Radix UI  
**Priority:** Mobile-first (Android / iPhone)

---

## 1) محصول چیست؟

پویا = مربی انیمیشنی آموزشی:

| تب | id | نقش |
|---|---|---|
| گفتگو | `chat` | درس کوتاه، دانستی، مرور روزانه، چیپ‌های موضوع |
| زبان | `live` | مکالمه زنده / سناریو / انتخاب زبان |
| مربی‌ها | `coaches` | دستیارهای تخصصی دروس |
| آزمون | `quiz` | کوییز ۵ سؤالی |
| مغز دوم | `vault` | یادداشت‌ها |
| حساب | `account` | پروفایل / اشتراک |

**ترتیب ناوبری (قفل):**  
`گفتگو → زبان → مربی‌ها → آزمون → مغز دوم → حساب`

**تم:** قرمز روشن (`bg-stage`) روی چت و زبان؛ تب‌های شیشه‌ای با حاشیه قرمز وقتی active.

**اینترو:** فقط یک بار (sessionStorage `pouya-intro-seen`). انیمیشن‌های اضافه در بقیه اپ حذف شده‌اند.

---

## 2) نقشه فایل‌های حیاتی (دست نزن مگر لازم)

```
src/components/pouya-main-app.tsx   # state اصلی، tab/mode، send، voice، openLivePractice
src/components/pouya-chat-live.tsx  # ChatPane + LivePane + چیپ‌ها (تمرین زبان)
src/components/ui/button.tsx        # type="button" پیش‌فرض + touch-manipulation
src/components/pouya-voice-call.tsx # صفحه تماس صوتی
src/components/pouya-face-button.tsx
src/components/coaches-pane.tsx
src/components/account-pane.tsx
src/components/pouya-quiz-vault.tsx
src/lib/ai.ts                       # askPouya / speakPouya / makeQuiz — multi-provider
src/lib/topics.ts                   # TOPICS, LEVELS, LANGUAGES, SCENARIOS
src/lib/assistants.ts               # ASSISTANTS (مربی‌ها)
src/lib/curriculum.ts               # مقاطع و دروس رسمی (بدون کپی متن کتاب)
src/lib/library-data.ts + library.ts # fallback محلی
src/styles.css                      # glass nav، تم قرمز
```

---

## 3) قوانین تغییر UI (تا باگ لمس تکرار نشود)

1. **هر دکمه تعاملی روی صفحه اصلی خالی:**
   - حتماً `type="button"`
   - کلاس `touch-manipulation` و حداقل ارتفاع لمس ~44px (`h-11`)
   - در صورت نیاز `preventDefault` + `stopPropagation`
2. **`Button` پیش‌فرض `type="button"` است** — فقط submit صریح `type="submit"` بگذار.
3. **چیپ «تمرین زبان»** → فقط `onLivePractice()` که در main این است:
   ```ts
   function openLivePractice() {
     setMode("live");
     setTab("live");
   }
   ```
   این prop از `ChatPane` با نام `onLivePractice` پاس می‌شود. **اسم را عوض نکن بدون به‌روزرسانی هر دو فایل.**
4. تب بالا «زبان» جدا از چیپ است: `setTab("live"); setMode("live")`.
5. قبل از هر PR موبایل: Hard refresh و تست لمس «تمرین زبان»، «مرور روزانه»، «دانستی امروز»، و همه چیپ‌های TOPICS.

---

## 4) AI و Env

**ترتیب پیش‌فرض provider:** `gemini → openai → anthropic → xai`  
قابل override با `AI_PROVIDER_ORDER`.

| متغیر | نقش |
|---|---|
| `GEMINI_API_KEY` یا `GOOGLE_API_KEY` | اصلی |
| `OPENAI_API_KEY` + اختیاری `OPENAI_BASE_URL` | OpenAI / Liara سازگار |
| `ANTHROPIC_API_KEY` | Claude |
| `XAI_API_KEY` | Grok + TTS (`zagan`) — اعتبار لازم |
| `GEMINI_MODEL` / `OPENAI_MODEL` / `ANTHROPIC_MODEL` | اختیاری |

**مدل‌های Gemini فعلی در کد:**  
`gemini-3.5-flash`, `gemini-3.1-flash-lite`, `gemini-2.5-flash`, `gemini-2.5-flash-lite`, `gemini-2.0-flash`

**Fallback:** اگر همه providerها fail شوند → `localTutorReply` (کتابخانه محلی). پاسخ نباید خالی بماند.

**TTS:** `spokenSlice` تا ۹۰۰ کاراکتر؛ اولویت xAI TTS سپس `speechSynthesis` مرورگر.

**maxTokens:** live/language ≈ 1024؛ lesson ≈ 2500؛ بقیه ≈ 2048.

---

## 5) داده آموزشی (بدون کپی کتاب)

- `curriculum.ts` = ساختار مقاطع + پرامپت (نه متن کتاب).
- `assistants.ts` / `topics.ts` = هم‌تراز chap.sch.ir و مسیر کنکور.
- متن کامل کتاب درسی **هرگز** داخل ریپو نرود (حق نشر).

---

## 6) باگ‌های شناخته‌شده و وضعیت

| مورد | وضعیت | یادداشت |
|---|---|---|
| دکمه «تمرین زبان» بی‌اثر روی موبایل | **Fixed** (commit بعد از 13b6c38) | native button + type + touch |
| پاسخ نصفه TTS | **Fixed** | spokenSlice 900 |
| Gemini silent fallback | **Improved** | مدل‌های 2026 + لاگ |
| کلید xAI بدون اعتبار | محدودیت خارجی | TTS/Grok نیاز به credit دارد |
| کپی متن کتاب | ممنوع | فقط خلاصه/پرامپت |

---

## 7) سیاست تصمیم (Decision policy)

1. **یک مسیر واحد:** تغییر state تب/حالت فقط از `pouya-main-app.tsx`.
2. **UI خالی چت** فقط در `pouya-chat-live.tsx` (ChatPane).
3. **هر feature جدید:** ابتدا یک خط در بخش «Backlog» همین فایل، بعد کد.
4. **Redeploy:** push به `main` → Vercel auto؛ همیشه Hard refresh موبایل بعد از دیپلوی.
5. **عدم بازنویسی کل فایل** مگر corruption؛ ترجیح patch کوچک.

---

## 8) Backlog فعلی (اولویت)

1. اتصال پایدار کلید AI (Gemini / در صورت نیاز Liara OpenAI-compatible).
2. غنی‌سازی `curriculum` با خلاصه فصل‌به‌فصل (نه متن کتاب) برای پایه‌های پرتقاضا.
3. اشتراک / حساب واقعی (Stripe یا درگاه ایران) وقتی محصول پایدار شد.
4. QA موبایل بعد از هر تغییر UI.

---

## 9) چک‌لیست قبل از هر تغییر

- [ ] این فایل را خواندم
- [ ] فایل‌های متاثر را شناختم (حداکثر ۲–۳ فایل)
- [ ] دکمه/لمس موبایل را در نظر گرفتم
- [ ] env جدید اگر لازم است در Vercel هم ست می‌شود
- [ ] بعد از push، سایت را روی موبایل Hard refresh کردم

---

*آخرین به‌روزرسانی OS: 2026-09-08 — پس از فیکس تمرین زبان و مستندسازی معماری.*
