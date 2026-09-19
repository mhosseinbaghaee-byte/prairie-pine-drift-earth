import { useState } from "react";
import { ASSISTANTS, type Assistant } from "@/lib/assistants";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { LessonPane } from "./lesson-pane";

type View = "coaches" | "lessons";

export function CoachesPane({
  activeId,
  onSelect,
  onStart,
  onAskLesson,
}: {
  activeId?: string;
  onSelect: (a: Assistant) => void;
  onStart: (a: Assistant) => void;
  onAskLesson?: (prompt: string) => void;
}) {
  const [view, setView] = useState<View>("coaches");

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="mx-auto flex w-full max-w-xl gap-1 px-4 pt-4 sm:px-5">
        {(
          [
            ["coaches", "مربی‌ها"],
            ["lessons", "درس با شکل"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setView(id)}
            className={cn(
              "h-9 flex-1 rounded-full border text-sm",
              view === id ? "border-stage bg-cream text-ink" : "border-border bg-card text-fg-muted",
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {view === "lessons" ? <LessonPane onAsk={onAskLesson} /> : null}

      {view === "coaches" ? (
        <div className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-5 overflow-y-auto px-4 py-5 sm:px-5">
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
                    <p className={cn("text-xs", active ? "text-ink/70" : "text-fg-muted")}>{a.tagline}</p>
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
      ) : null}
    </div>
  );
}
