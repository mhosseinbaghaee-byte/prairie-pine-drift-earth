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

const ROLE_KEY = "pouya-role-v1";
const ROLE_PROFILE_KEY = "pouya-role-profile-v1";

type Section = "personal" | "account" | "class" | "plans";

type RoleProfile = {
  /** دانش‌آموز */
  grade: string;
  school: string;
  /** مربی */
  subjects: string;
  teachGrades: string;
};

const DEFAULT_ROLE_PROFILE: RoleProfile = {
  grade: "",
  school: "",
  subjects: "",
  teachGrades: "",
};

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

function loadRoleProfile(): RoleProfile {
  if (typeof window === "undefined") return { ...DEFAULT_ROLE_PROFILE };
  try {
    const raw = localStorage.getItem(ROLE_PROFILE_KEY);
    if (!raw) return { ...DEFAULT_ROLE_PROFILE };
    return { ...DEFAULT_ROLE_PROFILE, ...(JSON.parse(raw) as object) };
  } catch {
    return { ...DEFAULT_ROLE_PROFILE };
  }
}

function saveRoleProfile(patch: Partial<RoleProfile>): RoleProfile {
  const next = { ...loadRoleProfile(), ...patch };
  try {
    localStorage.setItem(ROLE_PROFILE_KEY, JSON.stringify(next));
  } catch {
    /* ignore */
  }
  return next;
}

const STUDENT_GRADES = [
  "ابتدایی",
  "هفتم",
  "هشتم",
  "نهم",
  "دهم",
  "یازدهم",
  "دوازدهم",
  "کنکور",
] as const;

const TEACHER_SUBJECT_HINTS = [
  "ریاضی",
  "فیزیک",
  "شیمی",
  "زیست",
  "زبان",
  "ادبیات",
  "عربی",
  "علوم",
] as const;

export function AccountPane() {
  const [role, setRole] = useState<LocalRole | "">(() => loadRole());
  const [section, setSection] = useState<Section>("personal");
  const [profile, setProfile] = useState<UserProfile>(() => loadProfile());
  const [roleProfile, setRoleProfile] = useState<RoleProfile>(() => loadRoleProfile());
  const [account, setAccount] = useState<LocalAccount>(() => loadAccount());
  const [sub, setSub] = useState<SubscriptionState>(() => loadSubscription());
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
    setRoleProfile(loadRoleProfile());
    setSub(loadSubscription());
    setRole(loadRole());
    setClasses(listClassrooms());
  }, []);

  function pickRole(r: LocalRole) {
    setRole(r);
    saveRole(r);
    setSection("personal");
    toast.success(r === "teacher" ? "وارد فضای مربی شدی." : "وارد فضای دانش‌آموز شدی.");
  }

  function changeRole() {
    setRole("");
    saveRole("");
    setSection("personal");
  }

  function persistProfile(patch: Partial<UserProfile>) {
    const next = saveProfile(patch);
    setProfile(next);
    toast.success("ذخیره شد.");
  }

  function persistRoleProfile(patch: Partial<RoleProfile>) {
    const next = saveRoleProfile(patch);
    setRoleProfile(next);
    toast.success("ذخیره شد.");
  }

  function toggleGoal(goal: string) {
    const has = profile.goals.includes(goal);
    const goals = has ? profile.goals.filter((g) => g !== goal) : [...profile.goals, goal].slice(0, 4);
    persistProfile({ goals });
  }

  function submitAccount(e: React.FormEvent) {
    e.preventDefault();
    if (!role) {
      toast.error("اول نوع کاربری را انتخاب کن.");
      return;
    }
    if (!name.trim() || !email.trim() || !email.includes("@")) {
      toast.error("نام و ایمیل معتبر لازم است.");
      return;
    }
    const next = openAccount({ name, email, phone });
    setAccount(next);
    setProfile(loadProfile());
    toast.success(
      role === "teacher" ? "حساب مربی باز شد (محلی)." : "حساب دانش‌آموز باز شد (محلی).",
    );
  }

  function buy(planId: PlanId) {
    if (planId !== "free" && !account.opened) {
      toast.error("اول حساب را باز کن، بعد بسته را انتخاب کن.");
      setSection("account");
      return;
    }
    setSub(activatePlan(planId));
    toast.success(`بسته «${planById(planId).name}» فعال شد (آزمایشی).`);
  }

  function onCreateClass() {
    if (role !== "teacher") return;
    const c = createClassroom({
      title: classTitle || "کلاس پویا",
      grade: roleProfile.teachGrades,
      ownerName: account.name || profile.displayName || "مربی",
    });
    setClasses(listClassrooms());
    setClassTitle("");
    toast.success(`کلاس ساخته شد — کد: ${c.code}`);
  }

  function onJoinClass() {
    if (role !== "student") return;
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

  /* ——— انتخاب نقش (قبل از هر چیز) ——— */
  if (!role) {
    return (
      <div className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-5 overflow-y-auto px-4 py-6 sm:px-5">
        <div>
          <h2 className="font-display text-2xl font-medium tracking-tight">افتتاح حساب</h2>
          <p className="mt-2 text-sm text-fg-muted text-pretty">
            اول بگو دانش‌آموزی یا مربی. بعد بخش شخصی مخصوص همان نقش باز می‌شود.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => pickRole("student")}
            className="flex flex-col gap-2 rounded-2xl border border-border bg-card p-5 text-right transition hover:border-stage/50 hover:bg-cream/40"
          >
            <span className="text-2xl" aria-hidden>
              🎒
            </span>
            <span className="font-display text-lg font-medium">دانش‌آموز</span>
            <span className="text-sm leading-relaxed text-fg-muted">
              درس بخوان، به کلاس مدرسه وصل شو، سطح و هدف یادگیری‌ات را تنظیم کن.
            </span>
          </button>
          <button
            type="button"
            onClick={() => pickRole("teacher")}
            className="flex flex-col gap-2 rounded-2xl border border-border bg-card p-5 text-right transition hover:border-stage/50 hover:bg-cream/40"
          >
            <span className="text-2xl" aria-hidden>
              🧑‍🏫
            </span>
            <span className="font-display text-lg font-medium">مربی / معلم</span>
            <span className="text-sm leading-relaxed text-fg-muted">
              کلاس بساز، کد بده، تخصص و مقطع تدریس را مشخص کن.
            </span>
          </button>
        </div>
        <p className="text-xs text-fg-subtle">فعلاً داده روی همین دستگاه است؛ ورود ابری بعداً.</p>
      </div>
    );
  }

  const tabs =
    role === "teacher"
      ? ([
          ["personal", "شخصی مربی"],
          ["account", "حساب"],
          ["class", "کلاس‌ها"],
          ["plans", "اشتراک"],
        ] as const)
      : ([
          ["personal", "شخصی دانش‌آموز"],
          ["account", "حساب"],
          ["class", "کلاس من"],
          ["plans", "اشتراک"],
        ] as const);

  return (
    <div className="mx-auto flex w-full max-w-xl flex-1 flex-col overflow-y-auto px-4 py-5 sm:px-5">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl font-medium tracking-tight">
            {role === "teacher" ? "فضای مربی" : "فضای دانش‌آموز"}
          </h2>
          <p className="mt-1 text-sm text-fg-muted">
            {role === "teacher"
              ? "پروفایل تدریس، حساب و کلاس‌هایت."
              : "پروفایل یادگیری، حساب و کلاس مدرسه."}
          </p>
        </div>
        <button
          type="button"
          onClick={changeRole}
          className="shrink-0 rounded-full border border-border px-3 py-1.5 text-xs text-fg-muted hover:border-stage/40"
        >
          تغییر نقش
        </button>
      </div>

      <div className="mb-5 flex flex-wrap rounded-lg bg-surface p-1">
        {tabs.map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setSection(id)}
            className={cn(
              "h-9 min-w-[4.2rem] flex-1 rounded-md px-1 text-xs transition-colors sm:text-sm",
              section === id ? "bg-cream text-ink" : "text-fg-muted hover:text-fg",
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ——— شخصی دانش‌آموز ——— */}
      {section === "personal" && role === "student" ? (
        <div className="flex flex-col gap-5">
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="text-fg-muted">نام نمایشی</span>
            <Input
              value={profile.displayName}
              onChange={(e) => setProfile((p) => ({ ...p, displayName: e.target.value }))}
              onBlur={() => persistProfile({ displayName: profile.displayName })}
              placeholder="مثلاً سارا"
            />
          </label>

          <div>
            <p className="mb-2 text-sm text-fg-muted">پایه / مقطع</p>
            <div className="flex flex-wrap gap-2">
              {STUDENT_GRADES.map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => persistRoleProfile({ grade: g })}
                  className={cn(
                    "h-9 rounded-full border px-3 text-sm",
                    roleProfile.grade === g
                      ? "border-stage bg-cream text-ink"
                      : "border-border bg-card hover:border-stage/40",
                  )}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>

          <label className="flex flex-col gap-1.5 text-sm">
            <span className="text-fg-muted">مدرسه (اختیاری)</span>
            <Input
              value={roleProfile.school}
              onChange={(e) => setRoleProfile((p) => ({ ...p, school: e.target.value }))}
              onBlur={() => persistRoleProfile({ school: roleProfile.school })}
              placeholder="نام مدرسه"
            />
          </label>

          <div>
            <p className="mb-2 text-sm text-fg-muted">سطح پاسخ پویا</p>
            <div className="flex flex-wrap gap-2">
              {LEVELS.map((l) => (
                <button
                  key={l.id}
                  type="button"
                  title={l.hint}
                  onClick={() => persistProfile({ level: l.id as Level })}
                  className={cn(
                    "h-9 rounded-full border px-3 text-sm",
                    profile.level === l.id
                      ? "border-stage bg-cream text-ink"
                      : "border-border bg-card hover:border-stage/40",
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
            <p className="mb-2 text-sm text-fg-muted">مربی محبوب داخل اپ</p>
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

      {/* ——— شخصی مربی ——— */}
      {section === "personal" && role === "teacher" ? (
        <div className="flex flex-col gap-5">
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="text-fg-muted">نام نمایشی مربی</span>
            <Input
              value={profile.displayName}
              onChange={(e) => setProfile((p) => ({ ...p, displayName: e.target.value }))}
              onBlur={() => persistProfile({ displayName: profile.displayName })}
              placeholder="مثلاً استاد رضایی"
            />
          </label>

          <div>
            <p className="mb-2 text-sm text-fg-muted">درس‌های تخصص (چندتایی)</p>
            <div className="mb-2 flex flex-wrap gap-2">
              {TEACHER_SUBJECT_HINTS.map((s) => {
                const list = roleProfile.subjects
                  .split(/[،,]/)
                  .map((x) => x.trim())
                  .filter(Boolean);
                const on = list.includes(s);
                return (
                  <button
                    key={s}
                    type="button"
                    onClick={() => {
                      const next = on ? list.filter((x) => x !== s) : [...list, s];
                      persistRoleProfile({ subjects: next.join("، ") });
                    }}
                    className={cn(
                      "h-9 rounded-full border px-3 text-sm",
                      on ? "border-stage bg-cream text-ink" : "border-border bg-card hover:border-stage/40",
                    )}
                  >
                    {s}
                  </button>
                );
              })}
            </div>
            <Input
              value={roleProfile.subjects}
              onChange={(e) => setRoleProfile((p) => ({ ...p, subjects: e.target.value }))}
              onBlur={() => persistRoleProfile({ subjects: roleProfile.subjects })}
              placeholder="یا خودت بنویس: ریاضی، فیزیک…"
            />
          </div>

          <label className="flex flex-col gap-1.5 text-sm">
            <span className="text-fg-muted">مقطع تدریس</span>
            <Input
              value={roleProfile.teachGrades}
              onChange={(e) => setRoleProfile((p) => ({ ...p, teachGrades: e.target.value }))}
              onBlur={() => persistRoleProfile({ teachGrades: roleProfile.teachGrades })}
              placeholder="مثلاً دهم تا دوازدهم / کنکور"
            />
          </label>

          <div>
            <p className="mb-2 text-sm text-fg-muted">سطح پیش‌فرض توضیح برای دانش‌آموزان</p>
            <div className="flex flex-wrap gap-2">
              {LEVELS.map((l) => (
                <button
                  key={l.id}
                  type="button"
                  title={l.hint}
                  onClick={() => persistProfile({ level: l.id as Level })}
                  className={cn(
                    "h-9 rounded-full border px-3 text-sm",
                    profile.level === l.id
                      ? "border-stage bg-cream text-ink"
                      : "border-border bg-card hover:border-stage/40",
                  )}
                >
                  {l.label}
                </button>
              ))}
            </div>
          </div>

          <p className="text-xs text-fg-subtle text-pretty">
            ساخت کلاس و صدور کد در زبانه «کلاس‌ها» است. جزوه و آزمون اختصاصی کلاس در فاز بعد وصل می‌شود.
          </p>
        </div>
      ) : null}

      {/* ——— حساب ——— */}
      {section === "account" ? (
        <div className="flex flex-col gap-4">
          <p className="text-sm text-fg-muted">
            نقش فعلی: <strong>{role === "teacher" ? "مربی" : "دانش‌آموز"}</strong>
          </p>
          {account.opened ? (
            <div className="rounded-xl border border-border bg-card p-4 text-sm">
              <p className="font-medium">حساب فعال (محلی)</p>
              <p className="mt-2 text-fg-muted">نام: {account.name}</p>
              <p className="text-fg-muted">ایمیل: {account.email}</p>
              {account.phone ? <p className="text-fg-muted">موبایل: {account.phone}</p> : null}
              <p className="mt-2 text-xs text-fg-subtle">داده روی این دستگاه است.</p>
            </div>
          ) : (
            <form className="flex flex-col gap-3" onSubmit={submitAccount}>
              <p className="text-sm text-fg-muted">
                {role === "teacher"
                  ? "برای مدیریت کلاس و اشتراک، حساب مربی باز کن."
                  : "برای عضویت در کلاس و اشتراک، حساب دانش‌آموز باز کن."}
              </p>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="نام" required />
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ایمیل"
                required
              />
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="موبایل (اختیاری)" />
              <Button type="submit">
                {role === "teacher" ? "افتتاح حساب مربی" : "افتتاح حساب دانش‌آموز"}
              </Button>
            </form>
          )}
        </div>
      ) : null}

      {/* ——— کلاس ——— */}
      {section === "class" ? (
        <div className="flex flex-col gap-4">
          {role === "teacher" ? (
            <div className="flex flex-col gap-2 rounded-xl border border-border bg-card p-3">
              <p className="text-sm font-medium">ساخت کلاس جدید</p>
              <Input
                value={classTitle}
                onChange={(e) => setClassTitle(e.target.value)}
                placeholder="عنوان کلاس — مثلاً زیست یازدهم"
              />
              <Button type="button" onClick={onCreateClass}>
                صدور کد کلاس
              </Button>
            </div>
          ) : (
            <div className="flex flex-col gap-2 rounded-xl border border-border bg-card p-3">
              <p className="text-sm font-medium">پیوستن با کد مربی</p>
              <Input
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value)}
                placeholder="مثلاً POUYA-7K3M"
              />
              <Button type="button" onClick={onJoinClass}>
                عضویت در کلاس
              </Button>
            </div>
          )}

          <div>
            <p className="mb-2 text-sm text-fg-muted">
              {role === "teacher" ? "کلاس‌های ساخته‌شده" : "کلاس‌های عضو"}
            </p>
            {classes.length === 0 ? (
              <p className="text-sm text-fg-subtle">هنوز کلاسی نیست.</p>
            ) : (
              <ul className="flex flex-col gap-2">
                {classes.map((c) => (
                  <li
                    key={c.code}
                    className="flex items-center justify-between gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm"
                  >
                    <div>
                      <p className="font-medium">{c.title}</p>
                      <p className="text-xs text-fg-muted">{c.code}</p>
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

      {/* ——— اشتراک ——— */}
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
          <p className="text-pretty text-xs text-fg-subtle">پرداخت واقعی بعداً؛ الان آزمایشی است.</p>
        </div>
      ) : null}
    </div>
  );
}
