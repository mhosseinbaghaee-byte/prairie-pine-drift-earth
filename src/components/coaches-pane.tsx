import { ASSISTANTS, type Assistant } from "@/lib/assistants";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function CoachesPane({
  activeId,
  onSelect,
  onStart,
}: {
  activeId?: string;
  onSelect: (a: Assistant) => void;
  onStart: (a: Assistant) => void;
}) {
  return (
    <div className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-5 overflow-y-auto px-4 py-6 sm:px-5">
      <div>
        <h2 className="font-display text-2xl font-medium tracking-tight">مربی‌های پویا</h2>
        <p className="mt-2 text-sm leading-normal text-fg-muted text-pretty">
          هر مربی تخصص و لحن خودش را دارد. یکی را انتخاب کن تا گفتگو با همان نقش شروع شود.
        </p>
      </div>
      <ul className="flex flex-col gap-3">
        {ASSISTANTS.map((a) => {
          const active = activeId === a.id;
          return (
            <li key={a.id}>
              <button
                type="button"
                onClick={() => onSelect(a)}
                className={cn(
                  "flex w-full flex-col gap-1 rounded-xl border px-4 py-3.5 text-right transition-colors",
                  active
                    ? "border-stage bg-cream text-ink"
                    : "border-border bg-card hover:border-stage/40",
                )}
              >
                <div className="flex items-center gap-2">
                  <span className="text-lg" aria-hidden>
                    {a.emoji}
                  </span>
                  <span className="font-medium">{a.label}</span>
                </div>
                <p className={cn("text-xs", active ? "text-ink/70" : "text-fg-muted")}>
                  {a.tagline}
                </p>
                <p className={cn("text-sm leading-normal", active ? "text-ink/80" : "text-fg-muted")}>
                  {a.description}
                </p>
                {active ? (
                  <div className="mt-2">
                    <Button
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        onStart(a);
                      }}
                    >
                      شروع گفتگو با این مربی
                    </Button>
                  </div>
                ) : null}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
