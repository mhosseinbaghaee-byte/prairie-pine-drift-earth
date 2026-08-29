import { uid } from "./utils";

export type FolderId =
  | "inbox"
  | "projects"
  | "areas"
  | "resources"
  | "knowledge"
  | "content"
  | "people"
  | "daily"
  | "archive";

export type Note = {
  id: string;
  folder: FolderId;
  title: string;
  body: string;
  createdAt: string;
  updatedAt: string;
  source: "chat" | "daily" | "quiz" | "manual";
};

export const FOLDERS: { id: FolderId; code: string; label: string }[] = [
  { id: "inbox", code: "00", label: "ورودی" },
  { id: "projects", code: "01", label: "پروژه‌ها" },
  { id: "areas", code: "02", label: "حوزه‌ها" },
  { id: "resources", code: "03", label: "منابع" },
  { id: "knowledge", code: "04", label: "دانش" },
  { id: "content", code: "05", label: "محتوا" },
  { id: "people", code: "06", label: "افراد" },
  { id: "daily", code: "07", label: "یادداشت روزانه" },
  { id: "archive", code: "08", label: "آرشیو" },
];

const KEY = "pouya-vault-v1";

function read(): Note[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Note[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function write(notes: Note[]) {
  localStorage.setItem(KEY, JSON.stringify(notes));
}

export function listNotes(): Note[] {
  return read().sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export function saveNote(input: {
  folder: FolderId;
  title: string;
  body: string;
  source: Note["source"];
  id?: string;
}): Note {
  const notes = read();
  const now = new Date().toISOString();
  if (input.id) {
    const next = notes.map((n) =>
      n.id === input.id
        ? { ...n, title: input.title, body: input.body, folder: input.folder, updatedAt: now }
        : n,
    );
    write(next);
    return next.find((n) => n.id === input.id)!;
  }
  const note: Note = {
    id: uid(),
    folder: input.folder,
    title: input.title.trim() || "بدون عنوان",
    body: input.body,
    createdAt: now,
    updatedAt: now,
    source: input.source,
  };
  write([note, ...notes]);
  return note;
}

export function deleteNote(id: string) {
  write(read().filter((n) => n.id !== id));
}

export function titleFromBody(body: string) {
  const line = body
    .replace(/^#+\s*/, "")
    .split("\n")
    .map((l) => l.trim())
    .find(Boolean);
  if (!line) return "یادداشت جدید";
  return line.replace(/[*`]/g, "").slice(0, 72);
}
