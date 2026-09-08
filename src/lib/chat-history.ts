import { uid } from "./utils";

export type StoredChatMsg = {
  role: "user" | "assistant";
  content: string;
};

export type ChatSession = {
  id: string;
  title: string;
  messages: StoredChatMsg[];
  createdAt: string;
  updatedAt: string;
};

const KEY = "pouya-chat-history-v1";
const MAX_SESSIONS = 40;
const MAX_MSGS = 40;

function read(): ChatSession[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as ChatSession[];
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch {
    return [];
  }
}

function write(list: ChatSession[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(KEY, JSON.stringify(list.slice(0, MAX_SESSIONS)));
  } catch {
    try {
      localStorage.setItem(KEY, JSON.stringify(list.slice(0, Math.floor(MAX_SESSIONS / 2))));
    } catch {
      /* ignore */
    }
  }
}

export function listChatSessions(): ChatSession[] {
  return read().sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export function getChatSession(id: string): ChatSession | undefined {
  return read().find((s) => s.id === id);
}

export function titleFromMessages(messages: StoredChatMsg[]): string {
  const firstUser = messages.find((m) => m.role === "user")?.content?.trim();
  if (firstUser) {
    const line = firstUser.split("\n").map((l) => l.trim()).find(Boolean) || firstUser;
    return line.replace(/[*`#_]/g, "").slice(0, 48) || "گفتگو";
  }
  const firstAsst = messages.find((m) => m.role === "assistant")?.content?.trim();
  if (firstAsst) return firstAsst.replace(/[*`#_]/g, "").slice(0, 48);
  return "گفتگوی تازه";
}

/** Strip heavy image payloads before persist */
export function serializeMessages(
  messages: Array<{ role: "user" | "assistant"; content: string; image?: string }>,
): StoredChatMsg[] {
  return messages.slice(-MAX_MSGS).map((m) => ({
    role: m.role,
    content: m.image ? `${m.content}\n[تصویر پیوست]` : m.content,
  }));
}

export function upsertChatSession(input: {
  id?: string;
  messages: Array<{ role: "user" | "assistant"; content: string; image?: string }>;
}): ChatSession | null {
  const msgs = serializeMessages(input.messages);
  if (!msgs.some((m) => m.role === "assistant")) return null;
  const now = new Date().toISOString();
  const list = read();
  if (input.id) {
    const idx = list.findIndex((s) => s.id === input.id);
    if (idx >= 0) {
      const next: ChatSession = {
        ...list[idx],
        messages: msgs,
        title: titleFromMessages(msgs),
        updatedAt: now,
      };
      list[idx] = next;
      write(list);
      return next;
    }
  }
  const session: ChatSession = {
    id: input.id || uid(),
    title: titleFromMessages(msgs),
    messages: msgs,
    createdAt: now,
    updatedAt: now,
  };
  write([session, ...list.filter((s) => s.id !== session.id)]);
  return session;
}

export function deleteChatSession(id: string) {
  write(read().filter((s) => s.id !== id));
}

export function formatSessionDate(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleString("fa-IR", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
}
