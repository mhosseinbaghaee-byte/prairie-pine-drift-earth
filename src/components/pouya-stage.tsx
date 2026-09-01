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
  const isIntro = mood === "intro";

  useEffect(() => {
    const el = videoRef.current;
    if (!el || !isIntro) return;
    el.loop = false;
    void el.play().catch(() => undefined);
  }, [isIntro]);

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
      {isIntro ? (
        <video
          ref={videoRef}
          className="absolute inset-0 size-full object-cover object-center"
          poster="/pouya/idle.jpg"
          src="/pouya/intro.mp4"
          muted
          playsInline
          autoPlay
          preload="auto"
        />
      ) : (
        <img
          src="/pouya/idle.jpg"
          alt=""
          className="absolute inset-0 size-full object-cover object-center"
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
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center p-6">
          <p
            className={cn(
              "max-w-[18rem] text-center text-balance font-display font-medium text-cream drop-shadow-md",
              isIntro ? "text-xl sm:text-2xl" : "text-sm sm:text-base",
            )}
          >
            {caption}
          </p>
        </div>
      ) : null}
    </section>
  );
}
