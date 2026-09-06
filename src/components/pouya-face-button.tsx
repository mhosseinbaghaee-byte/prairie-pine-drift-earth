import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

const GLANCES = [
  { start: 0.95, end: 2.35 },
  { start: 4.05, end: 5.55 },
  { start: 5.9, end: 6.65 },
  { start: 7.0, end: 8.4 },
  { start: 8.8, end: 9.85 },
  { start: 0.05, end: 0.72 },
] as const;

const IDLES = [0.12, 3.15, 7.9];

function rand(min: number, max: number) {
  return min + Math.random() * (max - min);
}

function pick<T>(arr: readonly T[], avoid?: T): T {
  if (arr.length === 1) return arr[0] as T;
  let next = arr[Math.floor(Math.random() * arr.length)] as T;
  if (avoid !== undefined) {
    let guard = 0;
    while (next === avoid && guard < 6) {
      next = arr[Math.floor(Math.random() * arr.length)] as T;
      guard += 1;
    }
  }
  return next;
}

function PouyaLivingHead() {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let cancelled = false;
    const timers: number[] = [];
    let lastStart = -1;

    const later = (fn: () => void, ms: number) => {
      const id = window.setTimeout(fn, ms);
      timers.push(id);
    };

    const freezeIdle = () => {
      if (cancelled) return;
      el.pause();
      try {
        el.currentTime = pick(IDLES);
      } catch {
        /* ignore seek */
      }
    };

    const schedule = () => {
      if (cancelled || reduced) return;
      const longStill = Math.random() < 0.42;
      later(playGlance, longStill ? rand(4800, 15000) : rand(1100, 4600));
    };

    const playGlance = () => {
      if (cancelled) return;
      const g = pick(GLANCES, GLANCES.find((x) => x.start === lastStart));
      lastStart = g.start;
      const dur = Math.max(0.4, (g.end - g.start) * rand(0.72, 1.18));
      try {
        el.currentTime = g.start;
      } catch {
        /* ignore */
      }
      void el.play().catch(() => undefined);
      later(() => {
        freezeIdle();
        if (!cancelled && Math.random() < 0.16) {
          later(playGlance, rand(180, 700));
        } else {
          schedule();
        }
      }, dur * 1000);
    };

    const onReady = () => {
      freezeIdle();
      if (!reduced) schedule();
    };

    if (el.readyState >= 1) onReady();
    else el.addEventListener("loadedmetadata", onReady, { once: true });

    return () => {
      cancelled = true;
      timers.forEach((id) => window.clearTimeout(id));
      el.pause();
    };
  }, []);

  return (
    <video
      ref={ref}
      src="/pouya/glance.mp4"
      poster="/pouya/idle.jpg"
      muted
      playsInline
      preload="auto"
      aria-hidden
    />
  );
}

export function PouyaFaceButton({
  onClick,
  label,
  className,
  disabled,
}: {
  onClick?: () => void;
  label: string;
  className?: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className={cn(
        "pouya-face-btn size-11 min-h-11 shrink-0 rounded-full",
        className,
      )}
    >
      <PouyaLivingHead />
    </button>
  );
}

export function PouyaVoiceOrb({
  phase,
}: {
  phase: "idle" | "listen" | "think" | "talk";
}) {
  return (
    <div className={cn("pouya-voice-orb", `is-${phase}`)} aria-hidden>
      <div className="pouya-voice-orb-ring" />
      <div className="pouya-voice-orb-core">
        <PouyaLivingHead />
      </div>
    </div>
  );
}
