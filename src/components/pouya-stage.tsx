import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

export type StageMood = "intro" | "idle" | "think" | "talk" | "listen";

export function PouyaStage({
  mood,
  caption,
  compact,
}: {
  mood: StageMood;
  caption: string;
  compact?: boolean;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const src = mood === "intro" ? "/pouya/intro.mp4" : "/pouya/talk.mp4";
  const loop = mood !== "intro";

  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;
    el.loop = loop;
    if (el.getAttribute("src") !== src) {
      el.src = src;
    }
    const play = () => {
      void el.play().catch(() => undefined);
    };
    play();
  }, [src, loop, mood]);

  const moodLabel =
    mood === "intro"
      ? "ورود"
      : mood === "think"
        ? "در حال فکر"
        : mood === "talk"
          ? "در حال گفتن"
          : mood === "listen"
            ? "دارم گوش می‌دهم"
            : "آماده";

  return (
    <section
      className={cn(
        "relative overflow-hidden bg-stage",
        compact
          ? "h-[28vh] min-h-44 max-h-64 lg:h-full lg:max-h-none lg:min-h-0"
          : "h-[38vh] min-h-52 max-h-80 lg:h-full lg:max-h-none",
      )}
      aria-label="استودیوی پویا"
    >
      <video
        ref={videoRef}
        className={cn(
          "absolute inset-0 size-full object-cover object-[center_18%] transition-transform duration-slow ease-out",
          mood === "think" && "scale-[1.04]",
          (mood === "talk" || mood === "listen") && "scale-[1.02]",
        )}
        poster="/pouya/idle.jpg"
        src={src}
        muted
        playsInline
        autoPlay
        preload="auto"
      />
      <div className="stage-veil pointer-events-none absolute inset-0" />
      <div className="felt-grain pointer-events-none absolute inset-0" />
      <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 p-4 lg:p-6">
        <p
          className={cn(
            "max-w-[28rem] text-balance font-display text-sm font-medium text-cream/95 drop-shadow-sm sm:text-base",
            mood === "think" && "shimmer-text",
          )}
        >
          {caption}
        </p>
        <span className="hidden rounded-full border border-cream/20 bg-ink/25 px-3 py-1 text-xs text-cream/80 backdrop-blur-sm sm:inline">
          {moodLabel}
        </span>
      </div>
    </section>
  );
}
