import { useMemo, useState } from "react";
import { LESSON_DIAGRAMS } from "@/lib/lesson-diagrams";
import { LessonDiagramSvg } from "./lesson-diagram-svg";
import { cn } from "@/lib/utils";
import { Button } from "./ui/button";

/** UI درس با شکل — شبیه تجربه مربا، روی بانک SVG پویا */
export function LessonPane({ onAsk }: { onAsk?: (prompt: string) => void }) {
  const subjects = useMemo(() => {
    const set = new Set(LESSON_DIAGRAMS.map((d) => d.subject));
    return ["همه", ...Array.from(set)];
  }, []);
  const [subject, setSubject] = useState("همه");
  const [activeId, setActiveId] = useState(LESSON_DIAGRAMS[0]?.id ?? "neuron");

  const list = LESSON_DIAGRAMS.filter((d) => subject === "همه" || d.subject === subject);
  const active = LESSON_DIAGRAMS.find((d) => d.id === activeId) ?? list[0];

  return (
    <div className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-4 overflow-y-auto px-4 py-5 sm:px-5">
      <div>
        <h2 className="font-display text-2xl font-medium tracking-tight">درس با شکل</h2>
        <p className="mt-1.5 text-sm text-fg-muted text-pretty">
          شکل آموزشی را ببین، بعد اگر خواستی از پویا توضیح بخواه.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {subjects.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setSubject(s)}
            className={cn(
              "h-9 rounded-full border px-3 text-xs",
              subject === s ? "border-stage bg-cream text-ink" : "border-border bg-card text-fg-muted",
            )}
          >
            {s}
          </button>
        ))}
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {list.map((d) => (
          <button
            key={d.id}
            type="button"
            onClick={() => setActiveId(d.id)}
            className={cn(
              "h-9 shrink-0 rounded-full border px-3 text-xs",
              active?.id === d.id ? "border-stage bg-cream text-ink" : "border-border bg-card",
            )}
          >
            {d.title}
          </button>
        ))}
      </div>

      {active ? (
        <article className="rounded-2xl border border-border bg-card p-3 shadow-sm">
          <div className="mb-2 flex items-baseline justify-between gap-2">
            <h3 className="font-medium">{active.title}</h3>
            <span className="text-[11px] text-fg-muted">
              {active.subject} · {active.grades}
            </span>
          </div>
          <LessonDiagramSvg id={active.id} />
          <p className="mt-2 text-center text-sm text-fg-muted">{active.caption}</p>
          {onAsk ? (
            <Button
              className="mt-3 w-full"
              variant="outline"
              onClick={() => onAsk(`${active.title} را ساده و مثل کتاب درسی توضیح بده.`)}
            >
              توضیح از پویا
            </Button>
          ) : null}
        </article>
      ) : null}
    </div>
  );
}
