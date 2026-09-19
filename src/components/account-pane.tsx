import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  GOAL_OPTIONS,
  loadAccount,
  loadProfile,
  openAccount,
  saveProfile,
  type LocalAccount,
  type UserProfile,
} from "@/lib/profile";
import {
  PLANS,
  activatePlan,
  loadSubscription,
  planById,
  type PlanId,
  type SubscriptionState,
} from "@/lib/subscription";
import { LEVELS, type Level } from "@/lib/topics";
import { ASSISTANTS } from "@/lib/assistants";
import {
  createClassroom,
  joinClassroom,
  leaveClassroom,
  listClassrooms,
  type LocalClassroom,
  type LocalRole,
} from "@/lib/classroom-local";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type Section = "profile" | "account" | "roles" | "plans";

const ROLE_KEY = "pouya-role-v1";

function loadRole(): LocalRole | "" {
  if (typeof window === "undefined") return "";
  try {
    const r = localStorage.getItem(ROLE_KEY);
    return r === "teacher" || r === "student" ? r : "";
  } catch {
    return "";
  }
}

function saveRole(role: LocalRole | "") {
  if (typeof window === "undefined") return;
  try {
    if (!role) localStorage.removeItem(ROLE_KEY);
    else localStorage.setItem(ROLE_KEY, role);
  } catch {
    /* ignore */
  }
}

export function AccountPane() {
  const [section, setSection] = useState<Section>("profile");
  const [profile, setProfile] = useState<UserProfile>(() => loadProfile());
  const [account, setAccount] = useState<LocalAccount>(() => loadAccount());
  const [sub, setSub] = useState<SubscriptionState>(() => loadSubscription());
  const [role, setRole] = useState<LocalRole | "">(() => loadRole());
  const [classes, setClasses] = useState<LocalClassroom[]>(() => listClassrooms());
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [classTitle, setClassTitle] = useState("");
  const [joinCode, setJoinCode] = useState("");

  useEffect(() => {
    const a = loadAccount();
    setAccount(a);
    setName(a.name);
    setEmail(a.email);
    setPhone(a.phone);
    setProfile(loadProfile());
    setSub(loadSubscription());
    setRole(loadRole());
    setClasses(listClassrooms());
  }, []);

  function persistProfile(patch: Partial<UserProfile>) {
    const next = saveProfile(patch);
    setProfile(next);
    toast.success("تنظیمات شخصی ذخیره شد.");
  }

  function toggleGoal(goal: string) {
    const has = profile.goals.includes(goal);
    const goals = has ? profile.goals.filter((g) => g !== goal) : [...profile.goals, goal].slice(0, 4);
    persistProfile({ goals });
  }

  function submitAccount(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !email.includes("@")) {
      toast.error("نام و ایمیل معتبر لازم است.");
      return;
    }
    const next = openAccount({ name, email, phone });
    setAccount(next);
    setProfile(loadProfile());
    toast.success("حساب محلی باز شد.");
  }

  function buy(planId: PlanId) {
    if (planId !== "free" && !account.opened) {
      toast.error("اول حساب را باز کن، بعد بسته را انتخاب کن.");
      setSection("account");
      return;
    }
    setSub(activatePlan(planId));
    toast.success(`بسته «${planById(planId).name}» فعال شد (آزمایشی تا اتصال درگاه).`);
  }

  function pickRole(r: LocalRole) {
    setRole(r);
    saveRole(r);
    toast.success(r === "teacher" ? "نقش مربی ذخیره شد." : "نقش دانش‌آموز ذخیره شد.");
  }

  function onCreateClass() {
    if (role !== "teacher") {
      toast.error("اول نقش مربی را انتخاب کن.");
      return;
    }
    const c = createClassroom({
      title: classTitle || "کلاس پویا",
      ownerName: account.name || profile.displayName || "مربی",
    });
    setClasses(listClassrooms());
    setClassTitle("");
    toast.success(`کلاس ساخته شد — کد: ${c.code}`);
  }

  function onJoinClass() {
    if (role !== "student") {
      toast.error("اول نقش دانش‌آموز را انتخاب کن.");
      return;
    }
    const c = joinClassroom({ code: joinCode });
    if (!c) {
      toast.error("کد کلاس معتبر نیست.");
      return;
    }
    setClasses(listClassrooms());
    setJoinCode("");
    toast.success(`به کلاس ${c.code} پیوستی.`);
  }

  const currentPlan = planById(sub.planId);

  return (
    <div className="mx-auto flex w-full max-w-xl flex-1 flex-col overflow-y-auto px-4 py-5 sm:px-5">
      <div className="mb-4">
        <h2 className="font-display text-2xl font-medium tracking-tight">حساب و شخصی‌سازی</h2>
        <p className="mt-1.5 text-sm text-fg-muted">سطح، نقش، کلاس و اشتراک را اینجا تنظیم کن.</p>
      </div>

      <div className="mb-5 flex flex-wrap rounded-lg bg-surface p-1">
        {(
          [
            ["profile", "شخصی"],
            ["account", "حساب"],
            ["roles", "نقش/کلاس"],
            ["plans", "اشتراک"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setSection(id)}
            className={cn(
              "h-9 min-w-[4.5rem] flex-1 rounded-md text-sm transition-colors",
              section === id ? "bg-cream text-ink" : "text-fg-muted hover:text-fg",
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {section === "profile" ? (
        <div className="flex flex-col gap-5">
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="text-fg-muted">نام نمایشی</span>
            <Input
              value={profile.displayName}
              onChange={(e) => setProfile((p) => ({ ...p, displayName: e.target.value }))}
              onBlur={() => persistProfile({ displayName: profile.displayName })}
              placeholder="مثلاً آرمین"
            />
          </label>
          <div>
            <p className="mb-2 text-sm text-fg-muted">سطح پیش‌فرض</p>
            <div className="flex flex-wrap gap-2">
              {LEVELS.map((l) => (
                <button
                  key={l.id}
                  type="button"
                  title={l.hint}
                  onClick={() => persistProfile({ level: l.id as Level })}
                  className={cn(
                    "h-9 rounded-full border px-3 text-sm",
                    profile.level === l.id ? "border-stage bg-cream text-ink" : "border-border bg-card hover:border-stage/40",
                  )}
                >
                  {l.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="mb-2 text-sm text-fg-muted">هدف‌های یادگیری (تا ۴)</p>
            <div className="flex flex-wrap gap-2">
              {GOAL_OPTIONS.map((g) => {
                const on = profile.goals.includes(g);
                return (
                  <button
                    key={g}
                    type="button"
                    onClick={() => toggleGoal(g)}
                    className={cn(
                      "h-9 rounded-full border px-3 text-sm",
                      on ? "border-stage bg-cream text-ink" : "border-border bg-card hover:border-stage/40",
                    )}
                  >
                    {g}
                  </button>
                );
              })}
            </div>
          </div>
          <div>
            <p className="mb-2 text-sm text-fg-muted">مربی محبوب</p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => persistProfile({ preferredAssistantId: "" })}
                className={cn(
                  "h-9 rounded-full border px-3 text-sm",
                  !profile.preferredAssistantId ? "border-stage bg-cream text-ink" : "border-border bg-card",
                )}
              >
                پیش‌فرض
              </button>
              {ASSISTANTS.map((a) => (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => persistProfile({ preferredAssistantId: a.id })}
                  className={cn(
                    "h-9 rounded-full border px-3 text-sm",
                    profile.preferredAssistantId === a.id
                      ? "border-stage bg-cream text-ink"
                      : "border-border bg-card hover:border-stage/40",
                  )}
                >
                  {a.emoji} {a.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : null}

      {section === "account" ? (
        <div className="flex flex-col gap-4">
          {account.opened ? (
            <div className="rounded-xl border border-border bg-card p-4 text-sm">
              <p className="font-medium">حساب فعال (محلی)</p>
              <p className="mt-2 text-fg-muted">نام: {account.name}</p>
              <p className="text-fg-muted">ایمیل: {account.email}</p>
              {account.phone ? <p className="text-fg-muted">موبایل: {account.phone}</p> : null}
              <p className="mt-2 text-xs text-fg-subtle">داده روی این دستگاه است؛ ورود ابری در نسخه بعد.</p>
            </div>
          ) : (
            <form className="flex flex-col gap-3" onSubmit={submitAccount}>
              <p className="text-sm text-fg-muted">برای خرید اشتراک، حساب ساده باز کن.</p>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="نام" required />
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="ایمیل" required />
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="موبایل (اختیاری)" />
              <Button type="submit">افتتاح حساب</Button>
            </form>
          )}
        </div>
      ) : null}

      {section === "roles" ? (
        <div className="flex flex-col gap-4">
          <p className="text-sm text-fg-muted text-pretty">
            فاز A1 محلی: نقش و کد کلاس روی همین دستگاه ذخیره می‌شود (هنوز سرور مشترک نیست).
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => pickRole("student")}
              className={cn(
                "h-10 flex-1 rounded-full border text-sm",
                role === "student" ? "border-stage bg-cream text-ink" : "border-border bg-card",
              )}
            >
              دانش‌آموز
            </button>
            <button
              type="button"
              onClick={() => pickRole("teacher")}
              className={cn(
                "h-10 flex-1 rounded-full border text-sm",
                role === "teacher" ? "border-stage bg-cream text-ink" : "border-border bg-card",
              )}
            >
              مربی
            </button>
          </div>

          {role === "teacher" ? (
            <div className="flex flex-col gap-2 rounded-xl border border-border bg-card p-3">
              <p className="text-sm font-medium">ساخت کلاس</p>
              <Input value={classTitle} onChange={(e) => setClassTitle(e.target.value)} placeholder="عنوان کلاس" />
              <Button type="button" onClick={onCreateClass}>
                صدور کد کلاس
              </Button>
            </div>
          ) : null}

          {role === "student" ? (
            <div className="flex flex-col gap-2 rounded-xl border border-border bg-card p-3">
              <p className="text-sm font-medium">پیوستن با کد</p>
              <Input value={joinCode} onChange={(e) => setJoinCode(e.target.value)} placeholder="مثلاً POUYA-7K3M" />
              <Button type="button" onClick={onJoinClass}>
                عضویت در کلاس
              </Button>
            </div>
          ) : null}

          <div>
            <p className="mb-2 text-sm text-fg-muted">کلاس‌های این دستگاه</p>
            {classes.length === 0 ? (
              <p className="text-sm text-fg-subtle">هنوز کلاسی نیست.</p>
            ) : (
              <ul className="flex flex-col gap-2">
                {classes.map((c) => (
                  <li key={c.code} className="flex items-center justify-between gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm">
                    <div>
                      <p className="font-medium">{c.title}</p>
                      <p className="text-xs text-fg-muted">
                        {c.code} · {c.role === "teacher" ? "مربی" : "دانش‌آموز"}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        leaveClassroom(c.code);
                        setClasses(listClassrooms());
                      }}
                    >
                      حذف
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      ) : null}

      {section === "plans" ? (
        <div className="flex flex-col gap-4">
          <div className="rounded-xl border border-stage/30 bg-cream/40 px-4 py-3 text-sm text-ink">
            بسته فعلی: <strong>{currentPlan.name}</strong>
            {sub.expiresAt ? (
              <span className="mt-1 block text-xs text-ink/70">
                تا {new Date(sub.expiresAt).toLocaleDateString("fa-IR")}
              </span>
            ) : null}
          </div>
          {PLANS.map((p) => (
            <article
              key={p.id}
              className={cn(
                "rounded-xl border p-4",
                p.badge ? "border-stage bg-card shadow-sm" : "border-border bg-card",
                sub.planId === p.id && "ring-2 ring-stage/40",
              )}
            >
              <div className="flex items-baseline justify-between gap-2">
                <h3 className="font-display text-lg font-medium">{p.name}</h3>
                {p.badge ? <span className="text-xs text-stage">{p.badge}</span> : null}
              </div>
              <p className="mt-1 text-sm">
                <span className="font-medium">{p.priceLabel}</span>
                <span className="text-fg-muted"> / {p.period}</span>
              </p>
              <ul className="mt-3 flex flex-col gap-1.5 text-sm text-fg-muted">
                {p.features.map((f) => (
                  <li key={f}>• {f}</li>
                ))}
              </ul>
              <Button
                className="mt-4 w-full"
                variant={sub.planId === p.id ? "outline" : "default"}
                disabled={sub.planId === p.id}
                onClick={() => buy(p.id)}
              >
                {sub.planId === p.id ? "فعال است" : p.id === "free" ? "فعال‌سازی رایگان" : "خرید / فعال‌سازی"}
              </Button>
            </article>
          ))}
          <p className="text-pretty text-xs text-fg-subtle">
            پرداخت واقعی بعداً؛ الان فعال‌سازی آزمایشی است.
          </p>
        </div>
      ) : null}
    </div>
  );
}
