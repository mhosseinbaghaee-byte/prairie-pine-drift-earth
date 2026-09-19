import { uid } from "./utils";
import type { QuizPayload, QuizQuestion } from "./library-data";

const KEY = "pouya-custom-quizzes-v1";

export type CustomQuiz = QuizPayload & {
  id: string;
  createdAt: string;
};

function read(): CustomQuiz[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as CustomQuiz[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function write(list: CustomQuiz[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(KEY, JSON.stringify(list.slice(0, 30)));
  } catch {
    /* ignore */
  }
}

export function listCustomQuizzes(): CustomQuiz[] {
  return read().sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function saveCustomQuiz(input: {
  topic: string;
  questions: QuizQuestion[];
}): CustomQuiz | null {
  if (!input.topic.trim() || input.questions.length < 1) return null;
  const item: CustomQuiz = {
    id: uid(),
    topic: input.topic.trim(),
    questions: input.questions.slice(0, 20),
    createdAt: new Date().toISOString(),
  };
  write([item, ...read()]);
  return item;
}

export function deleteCustomQuiz(id: string) {
  write(read().filter((q) => q.id !== id));
}

/** برنامه مرور ساده ۷ روزه برای کنکور/نهایی */
export function buildStudyPlan(subject: string): string[] {
  const s = subject.trim() || "درس";
  return [
    `روز ۱: مرور مفهومی ${s} (۱ فصل / خلاصه دست‌نویس)`,
    `روز ۲: مثال‌های کتاب ${s} — ۵ تمرین حل‌شده`,
    `روز ۳: تست آموزشی ${s} (۲۰ سؤال) + بررسی غلط‌ها`,
    `روز ۴: جمع‌بندی فرمول/کلیدواژه ${s}`,
    `روز ۵: آزمون زمان‌دار کوتاه ${s}`,
    `روز ۶: مرور غلط‌های روز ۳ و ۵`,
    `روز ۷: استراحت فعال + یک آزمون جامع کوتاه`,
  ];
}
