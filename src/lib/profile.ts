import type { Level } from "./topics";
import type { AssistantId } from "./assistants";

const PROFILE_KEY = "pouya-profile-v1";
const ACCOUNT_KEY = "pouya-account-v1";
const SUB_KEY = "pouya-subscription-v1";

export type PlanId = "free" | "plus" | "pro";

export type SubscriptionPlan = {
  id: PlanId;
  name: string;
  priceLabel: string;
  period: string;
  credits: number;
  features: string[];
  highlighted?: boolean;
};

export const PLANS: SubscriptionPlan[] = [
  {
    id: "free",
    name: "رایگان",
    priceLabel: "۰ تومان",
    period: "همیشه",
    credits: 30,
    features: ["چت آموزشی پایه", "کوییز و Vault محلی", "۳ مربی اصلی", "۳۰ پیام ماهانه (تقریبی)"],
  },
  {
    id: "plus",
    name: "پلاس",
    priceLabel: "۱۴۹٬۰۰۰ تومان",
    period: "ماهانه",
    credits: 400,
    highlighted: true,
    features: ["همه مربی‌ها", "۴۰۰ اعتبار پیام", "صدا و گفتگوی زنده بیشتر", "اولویت مدل‌های بهتر", "پشتیبانی در اولویت"],
  },
  {
    id: "pro",
    name: "حرفه‌ای",
    priceLabel: "۲۹۹٬۰۰۰ تومان",
    period: "ماهانه",
    credits: 1200,
    features: ["همه امکانات پلاس", "۱۲۰۰ اعتبار پیام", "تحلیل فایل آموزشی (به‌زودی)", "چند پروفایل یادگیرنده", "گزارش پیشرفت ماهانه"],
  },
];

export type UserProfile = {
  displayName: string;
  level: Level;
  goals: string[];
  preferredAssistantId: AssistantId | "";
  voiceOn: boolean;
  dailyReminder: boolean;
  updatedAt: string;
};

export type LocalAccount = {
  opened: boolean;
  email: string;
  name: string;
  phone: string;
  createdAt: string;
};

export type LocalSubscription = {
  planId: PlanId;
  creditsRemaining: number;
  startedAt: string;
  expiresAt: string | null;
  pendingPlanId?: PlanId;
};

const DEFAULT_PROFILE: UserProfile = {
  displayName: "",
  level: "teen",
  goals: [],
  preferredAssistantId: "",
  voiceOn: true,
  dailyReminder: false,
  updatedAt: new Date(0).toISOString(),
};

const DEFAULT_ACCOUNT: LocalAccount = {
  opened: false,
  email: "",
  name: "",
  phone: "",
  createdAt: "",
};

function defaultSub(): LocalSubscription {
  return {
    planId: "free",
    creditsRemaining: PLANS[0].credits,
    startedAt: new Date().toISOString(),
    expiresAt: null,
  };
}

function safeParse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    return { ...fallback, ...(JSON.parse(raw) as object) } as T;
  } catch {
    return fallback;
  }
}

export function loadProfile(): UserProfile {
  if (typeof window === "undefined") return { ...DEFAULT_PROFILE };
  return safeParse(localStorage.getItem(PROFILE_KEY), { ...DEFAULT_PROFILE });
}

export function saveProfile(patch: Partial<UserProfile>): UserProfile {
  const next: UserProfile = {
    ...loadProfile(),
    ...patch,
    updatedAt: new Date().toISOString(),
  };
  localStorage.setItem(PROFILE_KEY, JSON.stringify(next));
  return next;
}

export function loadAccount(): LocalAccount {
  if (typeof window === "undefined") return { ...DEFAULT_ACCOUNT };
  return safeParse(localStorage.getItem(ACCOUNT_KEY), { ...DEFAULT_ACCOUNT });
}

export function openAccount(input: { name: string; email: string; phone?: string }): LocalAccount {
  const next: LocalAccount = {
    opened: true,
    name: input.name.trim(),
    email: input.email.trim().toLowerCase(),
    phone: (input.phone || "").trim(),
    createdAt: new Date().toISOString(),
  };
  localStorage.setItem(ACCOUNT_KEY, JSON.stringify(next));
  if (next.name) saveProfile({ displayName: next.name });
  return next;
}

export function loadSubscription(): LocalSubscription {
  if (typeof window === "undefined") return defaultSub();
  const s = safeParse(localStorage.getItem(SUB_KEY), defaultSub());
  if (!PLANS.some((p) => p.id === s.planId)) return defaultSub();
  return s;
}

export function saveSubscription(patch: Partial<LocalSubscription>): LocalSubscription {
  const next = { ...loadSubscription(), ...patch };
  localStorage.setItem(SUB_KEY, JSON.stringify(next));
  return next;
}

export function activatePlan(planId: PlanId): LocalSubscription {
  const plan = PLANS.find((p) => p.id === planId) ?? PLANS[0];
  const started = new Date();
  const expires =
    planId === "free" ? null : new Date(started.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();
  return saveSubscription({
    planId: plan.id,
    creditsRemaining: plan.credits,
    startedAt: started.toISOString(),
    expiresAt: expires,
    pendingPlanId: undefined,
  });
}

export function planById(id: PlanId) {
  return PLANS.find((p) => p.id === id) ?? PLANS[0];
}

export const GOAL_OPTIONS = [
  "زبان خارجی",
  "علوم و کنکور",
  "مهارت مطالعه",
  "اطلاعات عمومی",
  "ریاضی",
  "تاریخ و فرهنگ",
] as const;
