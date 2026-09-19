# پویا — سند تحویل تیم (داخلی)

> **این سند برای اعضای تیم است.** کلید API را اینجا ننویسید.

آخرین به‌روزرسانی: ۲۰۲۶-۰۹-۱۹

---

## ۱) پروژه چیست؟

**پویا (Pouya)** اپ آموزشی فارسی‌محور با شخصیت انیمیشنی:

| بخش | کار |
|-----|-----|
| گفتگو | چت + پیوست عکس + تاریخچه محلی (زنگ/موضوع) |
| زبان | تمرین مکالمه |
| گفتگوی صوتی | TTS فقط گفتگو/صدا |
| آزمون | کوییز عمومی + سازنده آزمون محلی + برنامه ۷روزه |
| مغز دوم | یادداشت محلی |
| مربی‌ها | مربیان داخلی + **درس با شکل** |
| حساب | پروفایل + نقش دانش‌آموز/مربی (A1 محلی) + اشتراک آزمایشی |

**دیپلوی:** `https://prairie-pine-drift-earth.vercel.app/`  
**ریپو:** `mhosseinbaghaee-byte/prairie-pine-drift-earth` → شاخه `main`

---

## ۲) وضعیت ۲۰۲۶-۰۹-۱۹

### انجام‌شده
- UI موبایل، تم قرمز، ناوبری شیشه‌ای
- AI: جمینی اول → لیارا؛ TTS لیارا
- Vision پیوست عکس
- بانک شکل فاز ۱ + `[diagram:id]` + UI «درس با شکل»
- تاریخچه با فیلد `topic` (زنگ)
- نقش/کلاس محلی (`classroom-local.ts`) در تب حساب
- سازنده آزمون سفارشی + برنامه مرور ۷روزه (`custom-quiz.ts`)
- سند فاز A نقش‌ها

### عمداً انجام نشد
- اشتراک پرداخت واقعی
- انتقال کامل به لیارا (هاست/DB)
- بانک تصویر اسکن کتاب (مجوز هنوز کامل نشده)

### هشدار فنی
- فایل اصلی UI: `pouya-main-app.tsx` فقط re-export است؛ منطق در `pouya-main-core.tsx`
- هرگز فایل بزرگ را با محتوای خالی push نکنید

---

## ۳) معماری سریع

```
src/components/
  pouya-main-app.tsx      # export از core
  pouya-main-core.tsx     # state اصلی تب‌ها / send / voice
  pouya-chat-live.tsx
  lesson-pane.tsx         # درس با شکل
  coaches-pane.tsx        # مربی‌ها | درس با شکل
  account-pane.tsx        # نقش/کلاس A1
  pouya-quiz-vault.tsx
  rich-text.tsx           # shape + diagram
src/lib/
  ai.ts / lesson-diagrams.ts / chat-history.ts
  classroom-local.ts / custom-quiz.ts
docs/TEAM-HANDOFF.md / phase-a-roles.md
```

---

## ۴) Env (نام‌ها)

`OPENAI_API_KEY`, `OPENAI_BASE_URL`, `OPENAI_MODEL`, `OPENAI_TTS_*`, `GEMINI_API_KEY`

---

## ۵) قانون تیم

1. قبل از push بزرگ: typecheck + تست موبایل چت
2. کلید فقط Vercel
3. تغییر حساب‌ها با به‌روز کردن `phase-a-roles.md`
4. این سند را با هر milestone آپدیت کنید
