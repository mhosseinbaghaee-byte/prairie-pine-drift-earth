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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type Section = "profile" | "account" | "plans";

export function AccountPane() {
  const [section, setSection] = useState<Section>("profile");
  const [profile, setProfile] = useState<UserProfile>(() => loadProfile());
  const [account, setAccount] = useState<LocalAccount>(() => loadAccount());
  const [sub, setSub] = useState<SubscriptionState>(() => loadSubscription());
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  useEffect(() => {
    const a = loadAccount();
    setAccount(a);
    setName(a.name);
    setEmail(a.email);
    setPhone(a.phone);
    setProfile(loadProfile());
    setSub(loadSubscription());
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

  const currentPlan = planById(sub.planId);

  return (
    <div className="mx-auto flex w-full max-w-xl flex-1 flex-col overflow-y-auto px-4 py-5 sm:px-5">
      <div className="mb-4">
        <h2 className="font-display text-2xl font-medium tracking-tight">حساب و شخصی‌سازی</h2>
        <p className="mt-1.5 text-sm text-fg-muted">سطح، هدف‌ها، حساب و اشتراک را اینجا تنظیم کن.</p>
      </div>

      <div className="mb-5 flex rounded-lg bg-surface p-1">
        {(
          [
            ["profile", "شخصی‌سازی"],
            ["account", "حساب"],
            ["plans", "اشتراک"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setSection(id)}
            className={cn(
              "h-9 flex-1 rounded-md text-sm transition-colors",
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

      {section === "plans" ? (
        <div className="flex flex-col gap-4">
          <div className="rounded-xl border border-stage/30 bg-cream/40 px-4 py-3 text-sm text-ink">
            بسته فعلی: <strong>{currentPlan.name}</strong>
            {sub.expiresAt ? (
              <span className="block text-xs text-ink/70 mt-1">
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
          <p className="text-xs text-fg-subtle text-pretty">
            پرداخت واقعی (زرین‌پال / بازار) بعداً وصل می‌شود؛ الان فعال‌سازی آزمایشی است.
          </p>
        </div>
      ) : null}
    </div>
  );
}
