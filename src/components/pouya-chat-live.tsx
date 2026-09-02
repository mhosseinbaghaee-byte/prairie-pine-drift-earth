import { type RefObject } from "react";
import { Bookmark, BookOpen, Languages, Mic, Send, Volume2, VolumeX } from "lucide-react";
import {
  LEVELS,
  LANGUAGES,
  SCENARIOS,
  TOPICS,
  type LangCode,
  type Level,
} from "@/lib/topics";
import { cn } from "@/lib/utils";
import { RichText } from "./rich-text";
import { Button } from "./ui/button";
import { Textarea } from "./ui/input";
import type { ChatMode } from "@/lib/ai";

type ChatMsg = { role: "user" | "assistant"; content: string };

function Bubble({ role, text, live }: { role: "user" | "assistant"; text: string; live?: boolean }) {
  const mine = role === "user";
  return (
    <article
      className={cn(
        "max-w-[88%] rounded-2xl px-4 py-3 text-sm leading-normal shadow-sm",
        mine
          ? "ms-auto bg-stage text-cream"
          : "border border-white/40 bg-white/85 text-ink backdrop-blur-md",
        live && "opacity-95",
      )}
    >
      {mine ? <p className="text-pretty">{text}</p> : <RichText text={text} />}
    </article>
  );
}

function RedShellToolbar({
  level,
  setLevel,
  voiceOn,
  setVoiceOn,
  onNew,
  onSave,
  canSave,
}: {
  level: Level;
  setLevel: (v: Level) => void;
  voiceOn: boolean;
  setVoiceOn: (v: boolean) => void;
  onNew: () => void;
  onSave: () => void;
  canSave: boolean;
}) {
  return (
    <div className="flex items-center gap-3 px-3 py-2.5 sm:px-4">
      <div className="flex items-center gap-2">
        <div className="flex rounded-full border border-white/25 bg-white/15 p-0.5 backdrop-blur-md">
          {LEVELS.map((l) => (
            <button
              key={l.id}
              type="button"
              title={l.hint}
              onClick={() => setLevel(l.id)}
              className={cn(
                "h-8 rounded-full px-2.5 text-xs transition",
                level === l.id ? "bg-white text-ink" : "text-cream/85 hover:text-cream",
              )}
            >
              {l.label}
            </button>
          ))}
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setVoiceOn(!voiceOn)}
          className="size-9 shrink-0 text-cream hover:bg-white/15 hover:text-cream"
          aria-pressed={voiceOn}
          aria-label={voiceOn ? "قطع صدا" : "روشن کردن صدا"}
        >
          {voiceOn ? <Volume2 className="size-4" /> : <VolumeX className="size-4" />}
        </Button>
      </div>
      <div className="min-w-0 flex-1" />
      <div className="flex items-center gap-1.5">
        <Button variant="ghost" size="sm" onClick={onNew} className="text-cream/90 hover:bg-white/15 hover:text-cream">
          گفتگوی تازه
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={onSave}
          disabled={!canSave}
          className="gap-1 text-cream/90 hover:bg-white/15 hover:text-cream"
        >
          <Bookmark className="size-4" />
          ذخیره
        </Button>
      </div>
    </div>
  );
}

export function ChatPane({
  messages, typed, busy, draft, busy, draft, setDraft, level, setLevel, voiceOn, setVoiceOn, mode, listening,
  scrollerRef, onSend, onLesson, onDaily, onFact, onMic, onLivePractice, onNew, onSave, onTypingFocus,
}: {
  messages: ChatMsg[]; typed: string; busy: boolean; draft: string; setDraft: (v: string) => void;
  level: Level; setLevel: (v: Level) => void; voiceOn: boolean; setVoiceOn: (v: boolean) => void;
  mode: ChatMode; listening: boolean; scrollerRef: RefObject<HTMLDivElement | null>;
  onSend: (t: string) => void; onLesson: (t: string) => void; onDaily: () => void; onFact: () => void;
  onMic: () => void; onLivePractice: () => void; onNew: () => void; onSave: () => void;
  onTypingFocus?: (focused: boolean) => void;
}) {
  const empty = messages.length === 0 && !typed;
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <RedShellToolbar
        level={level}
        setLevel={setLevel}
        voiceOn={voiceOn}
        setVoiceOn={setVoiceOn}
        onNew={onNew}
        onSave={onSave}
        canSave={messages.some((m) => m.role === "assistant")}
      />

      <div ref={scrollerRef} className="min-h-0 flex-1 overflow-y-auto px-3 py-3 sm:px-5">
        {empty ? (
          <div className="mx-auto flex max-w-xl flex-col gap-5 pt-6 text-center">
            <div>
              <h1 className="font-display text-2xl font-medium tracking-tight text-cream drop-shadow-sm sm:text-3xl">چی دوست داری یاد بگیری؟</h1>
              <p className="mt-2 text-sm text-cream/75">بپرس، درس کوتاه بگیر، یا با صدا حرف بزن.</p>
            </div>
            <div className="flex flex-wrap justify-center gap-2">
              {TOPICS.map((t) => (
                <button key={t.id} type="button" onClick={() => onLesson(t.prompt)}
                  className="h-10 rounded-full border border-white/30 bg-white/15 px-3.5 text-sm text-cream backdrop-blur-md hover:bg-white/25">
                  {t.label}
                </button>
              ))}
            </div>
            <div className="flex flex-wrap justify-center gap-2">
              <Button variant="outline" size="sm" onClick={onLivePractice} className="border-white/30 bg-white/10 text-cream hover:bg-white/20 hover:text-cream">
                <Languages className="size-4" /> تمرین زبان
              </Button>
              <Button variant="outline" size="sm" onClick={onDaily} className="border-white/30 bg-white/10 text-cream hover:bg-white/20 hover:text-cream">
                <BookOpen className="size-4" /> مرور روزانه
              </Button>
              <Button variant="outline" size="sm" onClick={onFact} className="border-white/30 bg-white/10 text-cream hover:bg-white/20 hover:text-cream">
                دانستی امروز
              </Button>
            </div>
          </div>
        ) : (
          <div className="mx-auto flex max-w-xl flex-col gap-3 pb-2">
            {mode !== "chat" ? (
              <p className="text-center text-xs text-cream/70">
                {mode === "daily" ? "حالت مرور روزانه" : mode === "lesson" ? "حالت درس کوتاه" : ""}
              </p>
            ) : null}
            {messages.map((m, i) => <Bubble key={i} role={m.role} text={m.content} />)}
            {typed ? <Bubble role="assistant" text={typed} live /> : null}
            {busy && !typed ? (
              <div className="flex items-center gap-2 text-sm text-cream/80">
                <span className="size-1.5 rounded-full bg-cream" />
                پویا دارد فکر می‌کند
              </div>
            ) : null}
          </div>
        )}
      </div>

      <form
        className="pouya-glass-composer mx-3 mb-3 sm:mx-5 sm:mb-4"
        onSubmit={(e) => { e.preventDefault(); onSend(draft); }}
      >
        <Textarea
          value={draft}
          rows={2}
          onChange={(e) => setDraft(e.target.value)}
          onFocus={() => onTypingFocus?.(true)}
          onBlur={() => onTypingFocus?.(false)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              onSend(draft);
            }
          }}
          placeholder={listening ? "دارم گوش می‌دهم…" : "پرسیدن سوال…"}
          className="max-h-36 min-h-14 w-full resize-none border-0 bg-transparent px-1 py-1 text-base text-ink shadow-none placeholder:text-fg-subtle focus-visible:ring-0"
          disabled={busy}
        />
        <div className="mt-1 flex items-center gap-2">
          <Button
            type="button"
            size="icon"
            variant={listening ? "default" : "outline"}
            onClick={onMic}
            disabled={busy}
            aria-label="میکروفون"
            className={cn(
              "rounded-full",
              listening ? "bg-stage text-cream hover:bg-stage-deep" : "border-border/60 bg-white/70",
            )}
          >
            <Mic className="size-4" />
          </Button>
          <div className="flex-1" />
          <Button
            type="submit"
            size="icon"
            disabled={busy || !draft.trim()}
            aria-label="ارسال"
            className="rounded-full bg-stage text-cream hover:bg-stage-deep"
          >
            <Send className="size-4" />
          </Button>
        </div>
      </form>
    </div>
  );
}

export function LivePane({
  messages, typed, busy, draft, setDraft, level, setLevel, voiceOn, setVoiceOn, lang, setLang,
  listening, scrollerRef, onSend, onScenario, onMic, onNew, onSave, onTypingFocus,
}: {
  messages: ChatMsg[]; typed: string; busy: boolean; draft: string; setDraft: (v: string) => void;
  level: Level; setLevel: (v: Level) => void; voiceOn: boolean; setVoiceOn: (v: boolean) => void;
  lang: LangCode; setLang: (v: LangCode) => void; listening: boolean;
  scrollerRef: RefObject<HTMLDivElement | null>; onSend: (t: string) => void;
  onScenario: (prompt: string) => void; onMic: () => void; onNew: () => void; onSave: () => void;
  onTypingFocus?: (focused: boolean) => void;
}) {
  const empty = messages.length === 0 && !typed;
  const currentLang = LANGUAGES.find((l) => l.code === lang);
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <RedShellToolbar
        level={level}
        setLevel={setLevel}
        voiceOn={voiceOn}
        setVoiceOn={setVoiceOn}
        onNew={onNew}
        onSave={onSave}
        canSave={messages.some((m) => m.role === "assistant")}
      />
      <div ref={scrollerRef} className="min-h-0 flex-1 overflow-y-auto px-3 py-3 sm:px-5">
        {empty ? (
          <div className="mx-auto flex max-w-xl flex-col gap-5 pt-4">
            <div className="text-center">
              <h1 className="font-display text-2xl font-medium text-cream sm:text-3xl">گفتگوی زنده · زبان</h1>
              <p className="mt-2 text-sm text-cream/75">زبان را انتخاب کن و حرف بزن.</p>
            </div>
            <div className="flex flex-wrap justify-center gap-2">
              {LANGUAGES.map((l) => (
                <button key={l.code} type="button" onClick={() => setLang(l.code)}
                  className={cn("h-10 rounded-full border px-3.5 text-sm backdrop-blur-md", lang === l.code ? "border-white bg-white text-ink" : "border-white/30 bg-white/15 text-cream")}>
                  <span className="me-1.5">{l.flag}</span>{l.label}
                </button>
              ))}
            </div>
            <div className="flex flex-wrap justify-center gap-2">
              {SCENARIOS.map((s) => (
                <button key={s.id} type="button" onClick={() => onScenario(s.prompt)}
                  className="h-10 rounded-full border border-white/30 bg-white/15 px-3.5 text-sm text-cream backdrop-blur-md hover:bg-white/25">{s.label}</button>
              ))}
            </div>
          </div>
        ) : (
          <div className="mx-auto flex max-w-xl flex-col gap-3">
            <p className="text-center text-xs text-cream/70">گفتگوی زنده · {currentLang?.flag} {currentLang?.label}</p>
            {messages.map((m, i) => <Bubble key={i} role={m.role} text={m.content} />)}
            {typed ? <Bubble role="assistant" text={typed} live /> : null}
            {busy && !typed ? <div className="text-sm text-cream/80">پویا دارد فکر می‌کند</div> : null}
          </div>
        )}
      </div>
      <form className="pouya-glass-composer mx-3 mb-3 sm:mx-5 sm:mb-4" onSubmit={(e) => { e.preventDefault(); onSend(draft); }}>
        <Textarea value={draft} rows={2} onChange={(e) => setDraft(e.target.value)}
          onFocus={() => onTypingFocus?.(true)} onBlur={() => onTypingFocus?.(false)}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); onSend(draft); } }}
          placeholder={listening ? "دارم گوش می‌دهم…" : `به ${currentLang?.native ?? "English"} یا فارسی بنویس…`}
          className="max-h-36 min-h-14 w-full resize-none border-0 bg-transparent px-1 py-1 text-base text-ink shadow-none focus-visible:ring-0"
          disabled={busy} />
        <div className="mt-1 flex items-center gap-2">
          <Button type="button" size="icon" variant={listening ? "default" : "outline"} onClick={onMic} disabled={busy}
            className={cn("rounded-full", listening ? "bg-stage text-cream hover:bg-stage-deep" : "border-border/60 bg-white/70")}>
            <Mic className="size-4" />
          </Button>
          <div className="flex-1" />
          <Button type="submit" size="icon" disabled={busy || !draft.trim()} className="rounded-full bg-stage text-cream hover:bg-stage-deep">
            <Send className="size-4" />
          </Button>
        </div>
      </form>
    </div>
  );
}
