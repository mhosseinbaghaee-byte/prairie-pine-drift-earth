import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

export type StageMood = "intro" | "idle" | "think" | "talk" | "listen" | "lookdown";

export function PouyaStage({
  mood = "idle",
  caption,
  compact,
  immersive,
  showCaption = true,
}: {
  mood?: StageMood;
  caption: string;
  compact?: boolean;
  immersive?: boolean;
  showCaption?: boolean;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const isIntro = mood === "intro";

  useEffect(() => {
    const el = videoRef.current;
    if (!el || !isIntro) return;
    el.loop = true;
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
          loop
          preload="auto"
        />
      ) : (
        <img
          src="/pouya/idle.jpg"
          alt=""
          className="absolute inset-0 size-full object-cover object-center"
          draggable={false}
        />
      )}
      <div
        className={cn(
          "pointer-events-none absolute inset-0",
          immersive ? "pouya-immersive-veil" : "stage-veil",
        )}
      />
      {showCaption ? (
        <div className="pointer-events-none absolute inset-x-0 bottom-[14%] flex items-center justify-center px-6">
          <p className="max-w-[20rem] text-center text-balance font-display text-base font-medium leading-relaxed text-cream drop-shadow-md sm:text-lg">
            {caption}
          </p>
        </div>
      ) : null}
    </section>
  );
}
