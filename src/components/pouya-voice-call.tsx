import { MicOff, Minus, MoreVertical, Send, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Textarea } from "./ui/input";
import { PouyaVoiceOrb } from "./pouya-face-button";

export type VoicePhase = "idle" | "listen" | "think" | "talk";

export function PouyaVoiceCall({
  phase,
  muted,
  lastUser,
  lastAssistant,
  draft,
  setDraft,
  onClose,
  onToggleMute,
  onSend,
}: {
  phase: VoicePhase;
  muted: boolean;
  lastUser?: string;
  lastAssistant?: string;
  draft: string;
  setDraft: (v: string) => void;
  onClose: () => void;
  onToggleMute: () => void;
  onSend: (text: string) => void;
}) {
  const caption =
    muted
      ? "بی‌صدا"
      : phase === "listen"
        ? "دارم گوش می‌دهم…"
        : phase === "think"
          ? "دارم فکر می‌کنم…"
          : phase === "talk"
            ? lastAssistant || "پویا دارد حرف می‌زند"
            : "با پویا حرف بزن";

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col bg-stage-deep text-cream"
      dir="rtl"
      role="dialog"
      aria-modal="true"
      aria-label="گفتگوی صوتی با پویا"
    >
      <header className="flex shrink-0 items-center gap-3 px-4 pt-[max(0.75rem,env(safe-area-inset-top))] pb-2">
        <button
          type="button"
          className="inline-flex size-11 items-center justify-center rounded-full bg-ink/40 text-cream"
          aria-label="گزینه‌ها"
        >
          <MoreVertical className="size-5" />
        </button>
        <div className="min-w-0 flex-1 text-center">
          <p className="text-sm font-medium tracking-tight">پویا صدا</p>
        </div>
        <button
          type="button"
          className="inline-flex size-11 items-center justify-center rounded-full bg-ink/40 text-cream"
          aria-label="جمع کردن"
          onClick={onClose}
        >
          <Minus className="size-5" />
        </button>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto px-6 pt-4">
        {lastUser ? (
          <p className="mb-4 text-end text-sm text-cream/55">{lastUser}</p>
        ) : null}
        <p className="text-pretty text-start text-base leading-relaxed text-cream/90">
          {lastAssistant || "سلام. هر چیزی که تو ذهنت هست بگو تا کمکت کنم."}
        </p>
      </div>

      <div className="flex shrink-0 flex-col items-center gap-5 px-5 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <PouyaVoiceOrb phase={muted ? "idle" : phase} />
        <p className="text-center text-xs text-cream/60">{caption}</p>

        <div className="flex w-full items-center gap-2">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex size-12 shrink-0 items-center justify-center rounded-full bg-cream text-ink"
            aria-label="بستن گفتگوی صوتی"
          >
            <X className="size-5" />
          </button>
          <button
            type="button"
            onClick={onToggleMute}
            aria-pressed={muted}
            className={cn(
              "inline-flex size-12 shrink-0 items-center justify-center rounded-full",
              muted ? "bg-stage text-cream" : "bg-ink/50 text-cream",
            )}
            aria-label={muted ? "روشن کردن صدا" : "بی‌صدا"}
          >
            <MicOff className="size-5" />
          </button>
          <form
            className="flex min-w-0 flex-1 items-center gap-1 rounded-full bg-ink/45 py-1 ps-4 pe-1"
            onSubmit={(e) => {
              e.preventDefault();
              const t = draft.trim();
              if (!t) return;
              onSend(t);
            }}
          >
            <Textarea
              value={draft}
              rows={1}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  const t = draft.trim();
                  if (t) onSend(t);
                }
              }}
              placeholder="تایپ کن و بفرست…"
              className="max-h-16 min-h-10 w-full resize-none border-0 bg-transparent px-0 py-2 text-sm text-cream shadow-none placeholder:text-cream/45 focus-visible:ring-0"
            />
            <button
              type="submit"
              disabled={!draft.trim()}
              className="inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-cream text-ink disabled:opacity-40"
              aria-label="ارسال متن"
            >
              <Send className="size-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
