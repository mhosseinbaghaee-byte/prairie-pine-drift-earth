# Pouya change log (human)

## 2026-09-08
- Fix: «تمرین زبان» و چیپ‌های صفحه خالی روی موبایل
  - `pouya-chat-live.tsx`: native `button type="button"` + touch-manipulation + stopPropagation
  - `ui/button.tsx`: default `type="button"`
- Docs: `docs/POUYA_OS.md` به عنوان Single Source of Truth

## Earlier (session summary)
- Gemini model list updated for 2026 AI Studio keys
- spokenSlice raised to 900 chars (TTS cut-off)
- Navigation order: chat → live(زبان) → coaches → quiz → vault → account
- Red theme glass tabs; intro only once; no extra in-app animations
- curriculum.ts / assistants.ts / topics.ts aligned with Iranian school structure (no full textbook copy)
