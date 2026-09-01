import { cn } from "@/lib/utils";

/** Mood kept for API compatibility with callers; media is always static. */
export type StageMood = "intro" | "idle" | "think" | "talk" | "listen" | "lookdown";

export function PouyaStage({
  caption,
  compact,
  immersive,
  showCaption = true,
}: {
  mood?: StageMood;
  caption: string;
  compact?: boolean;
  /** Full-bleed character behind chat */
  immersive?: boolean;
  showCaption?: boolean;
}) {
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
      <img
        src="/pouya/idle.jpg"
        alt=""
        className="absolute inset-0 size-full object-cover object-center"
        draggable={false}
      />
      <div
        className={cn(
          "pointer-events-none absolute inset-0",
          immersive ? "pouya-immersive-veil" : "stage-veil",
        )}
      />
      <div className="felt-grain pointer-events-none absolute inset-0" />
      {showCaption ? (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center p-6">
          <p className="max-w-[18rem] text-center text-balance font-display text-sm font-medium text-cream drop-shadow-md sm:text-base">
            {caption}
          </p>
        </div>
      ) : null}
    </section>
  );
}
