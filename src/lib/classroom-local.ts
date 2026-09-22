/**
 * فاز A1 — نقش و کلاس محلی (بدون سرور)
 * منبع حقیقت بعدی: DB؛ فعلاً فقط localStorage روی دستگاه.
 */

const KEY = "pouya-classrooms-v1";

export type LocalRole = "student" | "teacher";

export type LocalClassroom = {
  code: string;
  title: string;
  grade: string;
  ownerName: string;
  role: LocalRole;
  createdAt: string;
};

function read(): LocalClassroom[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as LocalClassroom[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function write(list: LocalClassroom[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(KEY, JSON.stringify(list.slice(0, 40)));
  } catch {
    /* ignore */
  }
}

export function listClassrooms(): LocalClassroom[] {
  return read().sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

function makeCode(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let s = "POUYA-";
  for (let i = 0; i < 4; i++) s += alphabet[Math.floor(Math.random() * alphabet.length)];
  return s;
}

export function createClassroom(input: {
  title: string;
  grade?: string;
  ownerName: string;
}): LocalClassroom {
  const item: LocalClassroom = {
    code: makeCode(),
    title: input.title.trim() || "کلاس پویا",
    grade: (input.grade || "").trim(),
    ownerName: input.ownerName.trim() || "مربی",
    role: "teacher",
    createdAt: new Date().toISOString(),
  };
  write([item, ...read().filter((c) => c.code !== item.code)]);
  return item;
}

/** فقط اگر کد واقعاً توسط معلم ساخته شده باشد موفق می‌شود — کلاس جعلی نمی‌سازد */
export function joinClassroom(input: {
  code: string;
  title?: string;
}): LocalClassroom | null {
  const code = input.code.trim().toUpperCase().replace(/\s+/g, "");
  if (code.length < 6) return null;
  const existing = read().find((c) => c.code.toUpperCase() === code);
  if (!existing) return null; // کد الکی → شکست
  const asStudent: LocalClassroom = { ...existing, role: "student" };
  write([asStudent, ...read().filter((c) => c.code.toUpperCase() !== code)]);
  return asStudent;
}

export function leaveClassroom(code: string) {
  write(read().filter((c) => c.code !== code));
}
