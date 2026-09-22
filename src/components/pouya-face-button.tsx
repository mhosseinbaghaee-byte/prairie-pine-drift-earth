import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

/** Peak poses from glance.mp4 — same 4-direction clip as cursor-scrub-video. */
const KEYS = [
  { angle: 0, t: 4.95 },
  { angle: 90, t: 9.35 },
  { angle: 180, t: 1.85 },
  { angle: 270, t: 7.95 },
] as const;
const NEUTRAL_T = 0.18;
const BLINK_T = 6.28;
const DEADZONE = 0.1;
const TAU = 0.18;
const GLANCE_SRC = "/pouya/glance.mp4";

function rand(min: number, max: number) {
  return min + Math.random() * (max - min);
}

function angleDiff(a: number, b: number) {
  return ((((a - b) % 360) + 540) % 360) - 180;
}

function nearestKeyTime(angle: number): number {
  let bestT: number = KEYS[0]!.t;
  let bestD = 999;
  for (const k of KEYS) {
    const d = Math.abs(angleDiff(angle, k.angle));
    if (d < bestD) {
      bestD = d;
      bestT = k.t;
    }
  }
  return bestT;
}

function PouyaLivingHead({ track = "window" }: { track?: "window" | "idle" }) {
  const ref = useRef<HTMLVideoElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  /** تا دیده نشود، ۲.۷MB را روی موبایل نکش */
  const [active, setActive] = useState(false);

  useEffect(() => {
    const root = wrapRef.current;
    if (!root || active) return;
    let done = false;
    const arm = () => {
      if (done) return;
      done = true;
      setActive(true);
    };
    const onInteract = () => arm();
    window.addEventListener("pointerdown", onInteract, { once: true, passive: true });
    window.addEventListener("touchstart", onInteract, { once: true, passive: true });
    let io: IntersectionObserver | null = null;
    if (typeof IntersectionObserver !== "undefined") {
      io = new IntersectionObserver(
        (entries) => {
          if (entries.some((e) => e.isIntersecting)) arm();
        },
        { rootMargin: "120px", threshold: 0.01 },
      );
      io.observe(root);
    } else {
      const t = window.setTimeout(arm, 2000);
      return () => {
        window.clearTimeout(t);
        window.removeEventListener("pointerdown", onInteract);
        window.removeEventListener("touchstart", onInteract);
      };
    }
    return () => {
      io?.disconnect();
      window.removeEventListener("pointerdown", onInteract);
      window.removeEventListener("touchstart", onInteract);
    };
  }, [active]);

  useEffect(() => {
    if (!active) return;
    const el = ref.current;
    if (!el) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let cancelled = false;
    let ready = false;
    let seeking = false;
    let current = NEUTRAL_T;
    let target = NEUTRAL_T;
    let lastPointer = 0;
    let wanderAt = performance.now() + rand(1800, 5200);
    let raf = 0;

    const onSeeking = () => {
      seeking = true;
    };
    const onSeeked = () => {
      seeking = false;
    };
    const onReady = () => {
      ready = true;
    };

    el.addEventListener("seeking", onSeeking);
    el.addEventListener("seeked", onSeeked);
    el.addEventListener("loadedmetadata", onReady);
    el.addEventListener("canplay", onReady);
    el.src = GLANCE_SRC;
    el.preload = "metadata";
    el.load();

    const setPointerTarget = (clientX: number, clientY: number) => {
      lastPointer = performance.now();
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const dx = clientX - vw / 2;
      const dy = clientY - vh / 2;
      const normX = Math.abs(dx) / Math.max(1, vw / 2);
      const normY = Math.abs(dy) / Math.max(1, vh / 2);
      const norm = Math.min(1, Math.max(normX, normY * 1.15));
      let angle = (Math.atan2(dy, dx) * 180) / Math.PI;
      if (angle < 0) angle += 360;
      const deadT = Math.max(0, Math.min(1, (norm - DEADZONE) / (1 - DEADZONE)));
      const eased = deadT * deadT * (3 - 2 * deadT);
      target = NEUTRAL_T + (nearestKeyTime(angle) - NEUTRAL_T) * eased;
    };

    const onMove = (e: PointerEvent) => {
      if (reduced || track === "idle") return;
      setPointerTarget(e.clientX, e.clientY);
    };

    if (track === "window" && !reduced) {
      window.addEventListener("pointermove", onMove, { passive: true });
      window.addEventListener("pointerdown", onMove, { passive: true });
    }

    const tick = () => {
      if (cancelled) return;
      const now = performance.now();
      if (!reduced && now - lastPointer > 2400 && now >= wanderAt) {
        const roll = Math.random();
        if (roll < 0.55) target = NEUTRAL_T;
        else if (roll < 0.68) target = BLINK_T;
        else target = KEYS[Math.floor(Math.random() * KEYS.length)]!.t;
        wanderAt = now + rand(2200, 11000);
      }
      if (ready && Number.isFinite(el.duration) && el.duration > 0) {
        const alpha = 1 - Math.exp(-(1 / 60) / TAU);
        current += (target - current) * alpha;
        const t = Math.max(0, Math.min(el.duration - 0.04, current));
        if (!seeking && Math.abs(el.currentTime - t) > 0.012) {
          el.currentTime = t;
        }
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerdown", onMove);
      el.removeEventListener("seeking", onSeeking);
      el.removeEventListener("seeked", onSeeked);
      el.removeEventListener("loadedmetadata", onReady);
      el.removeEventListener("canplay", onReady);
      el.pause();
    };
  }, [track, active]);

  return (
    <div ref={wrapRef} className="size-full">
      {active ? (
        <video
          ref={ref}
          poster="/pouya/idle.jpg"
          muted
          playsInline
          preload="metadata"
          disableRemotePlayback
          aria-hidden
          className="size-full object-cover"
        />
      ) : (
        <img
          src="/pouya/idle.jpg"
          alt=""
          className="size-full object-cover"
          draggable={false}
        />
      )}
    </div>
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
      <PouyaLivingHead track="window" />
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
        <PouyaLivingHead track="window" />
      </div>
    </div>
  );
}
