export type PlanId = "free" | "plus" | "pro";

export type Plan = {
  id: PlanId;
  name: string;
  priceLabel: string;
  priceToman: number;
  period: "ماهانه";
  badge?: string;
  features: string[];
  limits: {
    chatsPerDay: number | "∞";
    coaches: "basic" | "all";
    voice: boolean;
    quiz: boolean;
    vault: boolean;
    priorityModels: boolean;
  };
};

export const PLANS: Plan[] = [
  {
    id: "free",
    name: "رایگان",
    priceLabel: "۰ تومان",
    priceToman: 0,
    period: "ماهانه",
    features: [
      "چت آموزشی با پویا",
      "مربی‌های پایه (علوم، تاریخ، ریاضی، زبان)",
      "کوییز و Vault محلی",
      "حدود ۳۰ گفتگو در روز",
    ],
    limits: {
      chatsPerDay: 30,
      coaches: "basic",
      voice: true,
      quiz: true,
      vault: true,
      priorityModels: false,
    },
  },
  {
    id: "plus",
    name: "پلاس",
    priceLabel: "۱۴۹٬۰۰۰ تومان",
    priceToman: 149_000,
    period: "ماهانه",
    badge: "پیشنهادی",
    features: [
      "همه امکانات رایگان",
      "همه مربی‌ها (سلامت، قصه‌گو و …)",
      "گفتگوی بیشتر (حدود ۲۰۰ در روز)",
      "اولویت مدل‌های بهتر در صف",
      "ذخیره هوشمند خلاصه جلسات",
    ],
    limits: {
      chatsPerDay: 200,
      coaches: "all",
      voice: true,
      quiz: true,
      vault: true,
      priorityModels: true,
    },
  },
  {
    id: "pro",
    name: "حرفه‌ای",
    priceLabel: "۲۹۹٬۰۰۰ تومان",
    priceToman: 299_000,
    period: "ماهانه",
    features: [
      "همه امکانات پلاس",
      "استفاده تقریباً نامحدود آموزشی",
      "دسترسی زودهنگام به مربی‌های جدید",
      "پشتیبانی اولویت‌دار",
    ],
    limits: {
      chatsPerDay: "∞",
      coaches: "all",
      voice: true,
      quiz: true,
      vault: true,
      priorityModels: true,
    },
  },
];

const SUB_KEY = "pouya-subscription-v1";
const USAGE_KEY = "pouya-usage-v1";

export type SubscriptionState = {
  planId: PlanId;
  /** ISO date when paid plan expires; null = free forever */
  expiresAt: string | null;
  /** Last activated package id for UI */
  lastCheckoutPlanId?: PlanId;
};

export type UsageState = {
  day: string; // YYYY-MM-DD
  chats: number;
};

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

export function loadSubscription(): SubscriptionState {
  if (typeof window === "undefined") {
    return { planId: "free", expiresAt: null };
  }
  try {
    const raw = localStorage.getItem(SUB_KEY);
    if (!raw) return { planId: "free", expiresAt: null };
    const parsed = JSON.parse(raw) as SubscriptionState;
    if (parsed.planId !== "free" && parsed.expiresAt) {
      if (new Date(parsed.expiresAt).getTime() < Date.now()) {
        const free: SubscriptionState = { planId: "free", expiresAt: null };
        localStorage.setItem(SUB_KEY, JSON.stringify(free));
        return free;
      }
    }
    return parsed;
  } catch {
    return { planId: "free", expiresAt: null };
  }
}

export function saveSubscription(state: SubscriptionState) {
  if (typeof window === "undefined") return;
  localStorage.setItem(SUB_KEY, JSON.stringify(state));
}

/** Activate a plan locally for 30 days (placeholder until payment gateway). */
export function activatePlan(planId: PlanId): SubscriptionState {
  const expires =
    planId === "free"
      ? null
      : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
  const next: SubscriptionState = {
    planId,
    expiresAt: expires,
    lastCheckoutPlanId: planId,
  };
  saveSubscription(next);
  return next;
}

export function planById(id: PlanId): Plan {
  return PLANS.find((p) => p.id === id) ?? PLANS[0];
}

export function loadUsage(): UsageState {
  if (typeof window === "undefined") return { day: todayKey(), chats: 0 };
  try {
    const raw = localStorage.getItem(USAGE_KEY);
    if (!raw) return { day: todayKey(), chats: 0 };
    const parsed = JSON.parse(raw) as UsageState;
    if (parsed.day !== todayKey()) return { day: todayKey(), chats: 0 };
    return parsed;
  } catch {
    return { day: todayKey(), chats: 0 };
  }
}

export function incrementChatUsage(): UsageState {
  const cur = loadUsage();
  const next = { day: todayKey(), chats: cur.chats + 1 };
  if (typeof window !== "undefined") {
    localStorage.setItem(USAGE_KEY, JSON.stringify(next));
  }
  return next;
}

export function canUseChat(planId: PlanId): { ok: boolean; remaining: number | "∞" } {
  const plan = planById(planId);
  const limit = plan.limits.chatsPerDay;
  if (limit === "∞") return { ok: true, remaining: "∞" };
  const usage = loadUsage();
  const remaining = Math.max(0, limit - usage.chats);
  return { ok: remaining > 0, remaining };
}

export function canUseAssistant(
  planId: PlanId,
  minPlan: "free" | "plus" | "pro",
): boolean {
  const rank = { free: 0, plus: 1, pro: 2 } as const;
  return rank[planId] >= rank[minPlan];
}
