import type { Level } from "./topics";
import type { AssistantId } from "./assistants";

const PROFILE_KEY = "pouya-profile-v1";
const SESSION_KEY = "pouya-local-session-v1";

export type UserProfile = {
  displayName: string;
  email: string;
  /** Learning goal free text */
  goal: string;
  defaultLevel: Level;
  preferredAssistantId: AssistantId;
  voiceOn: boolean;
  /** ISO created */
  createdAt: string;
  updatedAt: string;
};

export type LocalSession = {
  email: string;
  displayName: string;
  signedInAt: string;
};

const defaultProfile = (): UserProfile => {
  const now = new Date().toISOString();
  return {
    displayName: "",
    email: "",
    goal: "",
    defaultLevel: "teen",
    preferredAssistantId: "pouya",
    voiceOn: true,
    createdAt: now,
    updatedAt: now,
  };
};

export function loadProfile(): UserProfile {
  if (typeof window === "undefined") return defaultProfile();
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    if (!raw) return defaultProfile();
    return { ...defaultProfile(), ...JSON.parse(raw) } as UserProfile;
  } catch {
    return defaultProfile();
  }
}

export function saveProfile(patch: Partial<UserProfile>): UserProfile {
  const cur = loadProfile();
  const next: UserProfile = {
    ...cur,
    ...patch,
    updatedAt: new Date().toISOString(),
    createdAt: cur.createdAt || new Date().toISOString(),
  };
  if (typeof window !== "undefined") {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(next));
  }
  return next;
}

export function loadLocalSession(): LocalSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as LocalSession;
  } catch {
    return null;
  }
}

/** Lightweight local account (until Better Auth + DB is enabled in production). */
export function signInLocal(email: string, displayName: string): LocalSession {
  const session: LocalSession = {
    email: email.trim().toLowerCase(),
    displayName: displayName.trim() || email.split("@")[0] || "کاربر",
    signedInAt: new Date().toISOString(),
  };
  if (typeof window !== "undefined") {
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  }
  saveProfile({ email: session.email, displayName: session.displayName });
  return session;
}

export function signOutLocal() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(SESSION_KEY);
}

export function isSignedInLocal(): boolean {
  return Boolean(loadLocalSession());
}
