import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

export type StageMood = "intro" | "idle" | "think" | "talk" | "listen" | "lookdown";

export function PouyaStage({
  mood,
  caption,
  compact,
  immersive,
  showCaption = true,
}: {
  mood: StageMood;
  caption: string;
  compact?: boolean;
  /** Full-bleed character behind chat (Hooshang-style) */
  immersive?: boolean;
  showCaption?: boolean;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const src =
    mood === "intro"
      ? "/pouya/intro.mp4"
      : mood === "lookdown"
        ? "/pouya/idle.jpg"
        : "/pouya/talk.mp4";
  const isVideo = src.endsWith(".mp4");
  const loop = mood !== "intro" && isVideo;

  useEffect(() => {
    const el = videoRef.current;
    if (!el || !isVideo) return;
    el.loop = loop;
    if (el.getAttribute("src") !== src) {
      el.src = src;
    }
    void el.play().catch(() => undefined);
  }, [src, loop, mood, isVideo]);

  const moodLabel =
    mood === "intro"
      ? "ورود"
      : mood === "think"
        ? "در حال فکر"
        : mood === "talk"
          ? "در حال گفتن"
          : mood === "listen"
            ? "دارم گوش می‌دهم"
            : mood === "lookdown"
              ? "دارم می‌خونم"
              : "آماده";

  return (
    <section
      className={cn(
        "relative overflow-hidden bg-stage",
        immersive
          ? "absolute inset-0 size-full"
          : compact
            ? "h-[28vh] min-h-44 max-h-64 lg:h-full lg:max-h-none lg:min-h-0"
            : "h-[38vh] min-h-52 max-h-80 lg:h-full lg:max-h-none",
      )}
      aria-label="استودیوی پویا"
    >
      {isVideo ? (
        <video
          ref={videoRef}
          className={cn(
            "absolute inset-0 size-full object-cover transition-all duration-slow ease-out",
            mood === "lookdown" ? "object-[center_42%] scale-[1.06]" : "object-[center_18%]",
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
      ) : (
        <img
          src="/pouya/idle.jpg"
          alt=""
          className={cn(
            "absolute inset-0 size-full object-cover transition-all duration-slow ease-out",
            mood === "lookdown" ? "object-[center_48%] scale-[1.08]" : "object-[center_22%]",
          )}
        />
      )}
      <div
        className={cn(
          "pointer-events-none absolute inset-0",
          immersive ? "pouya-immersive-veil" : "stage-veil",
        )}
      />
      <div className="felt-grain pointer-events-none absolute inset-0" />
      {showCaption ? (
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
      ) : null}
    </section>
  );
}
