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
        "max-w-[92%] rounded-xl px-4 py-3 text-sm leading-normal",
        mine ? "bg-stage text-cream" : "ms-auto border border-border bg-card text-fg",
        live && "opacity-95",
      )}
    >
      {mine ? <p className="text-pretty">{text}</p> : <RichText text={text} />}
    </article>
  );
}

export function ChatPane({
  messages, typed, busy, draft, setDraft, level, setLevel, voiceOn, setVoiceOn, mode, listening,
  scrollerRef, onSend, onLesson, onDaily, onFact, onMic, onLivePractice, onNew, onSave,
}: {
  messages: ChatMsg[]; typed: string; busy: boolean; draft: string; setDraft: (v: string) => void;
  level: Level; setLevel: (v: Level) => void; voiceOn: boolean; setVoiceOn: (v: boolean) => void;
  mode: ChatMode; listening: boolean; scrollerRef: RefObject<HTMLDivElement | null>;
  onSend: (t: string) => void; onLesson: (t: string) => void; onDaily: () => void; onFact: () => void;
  onMic: () => void; onLivePractice: () => void; onNew: () => void; onSave: () => void;
}) {
  const empty = messages.length === 0 && !typed;
  return (
    <>
      <div className="flex flex-wrap items-center gap-2 border-b border-border px-3 py-2 sm:px-5">
        <div className="flex rounded-md bg-surface p-0.5">
          {LEVELS.map((l) => (
            <button key={l.id} type="button" title={l.hint} onClick={() => setLevel(l.id)}
              className={cn("h-8 rounded-sm px-2.5 text-xs transition-colors", level === l.id ? "bg-cream text-ink" : "text-fg-muted hover:text-fg")}>
              {l.label}
            </button>
          ))}
        </div>
        <Button variant="ghost" size="sm" onClick={() => setVoiceOn(!voiceOn)} aria-pressed={voiceOn}>
          {voiceOn ? <Volume2 className="size-4" /> : <VolumeX className="size-4" />}
        </Button>
        <div className="flex-1" />
        <Button variant="ghost" size="sm" onClick={onNew}>گفتگوی تازه</Button>
        <Button variant="ghost" size="sm" onClick={onSave} disabled={!messages.some((m) => m.role === "assistant")}>
          <Bookmark className="size-4" /> ذخیره
        </Button>
      </div>
      <div ref={scrollerRef} className="min-h-0 flex-1 overflow-y-auto px-3 py-4 sm:px-5">
        {empty ? (
          <div className="mx-auto flex max-w-xl flex-col gap-6 pt-2">
            <div>
              <h1 className="font-display text-2xl font-medium tracking-tight sm:text-3xl">آموزش زنده، نه جزوه خشک.</h1>
              <p className="mt-2 max-w-md text-sm text-fg-muted">بپرس، درس کوتاه بگیر، یا مرور روزانه را شروع کن.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {TOPICS.map((t) => (
                <button key={t.id} type="button" onClick={() => onLesson(t.prompt)}
                  className="h-10 rounded-full border border-border bg-card px-3.5 text-sm hover:border-stage/40 hover:bg-cream">
                  {t.label}
                </button>
              ))}
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" onClick={onLivePractice}><Languages className="size-4" /> تمرین زبان</Button>
              <Button variant="outline" size="sm" onClick={onDaily}><BookOpen className="size-4" /> مرور روزانه</Button>
              <Button variant="outline" size="sm" onClick={onFact}>دانستی امروز</Button>
            </div>
          </div>
        ) : (
          <div className="mx-auto flex max-w-xl flex-col gap-4">
            {mode !== "chat" ? <p className="text-xs text-fg-muted">{mode === "daily" ? "حالت مرور روزانه" : mode === "lesson" ? "حالت درس کوتاه" : ""}</p> : null}
            {messages.map((m, i) => <Bubble key={i} role={m.role} text={m.content} />)}
            {typed ? <Bubble role="assistant" text={typed} live /> : null}
            {busy && !typed ? <div className="flex items-center gap-2 text-sm text-fg-muted"><span className="size-1.5 animate-pulse rounded-full bg-stage" />پویا دارد فکر می‌کند</div> : null}
          </div>
        )}
      </div>
      <form className="border-t border-border p-3 sm:px-5 sm:pb-4" onSubmit={(e) => { e.preventDefault(); onSend(draft); }}>
        <div className="mx-auto flex max-w-xl items-end gap-2">
          <Button type="button" size="icon" variant={listening ? "default" : "outline"} onClick={onMic} disabled={busy} aria-label="میکروفون"
            className={listening ? "bg-stage-deep text-cream hover:bg-stage" : undefined}><Mic className="size-4" /></Button>
          <Textarea value={draft} rows={1} onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); onSend(draft); } }}
            placeholder={listening ? "دارم گوش می‌دهم…" : "بپرس، یا نگه دار و حرف بزن…"}
            className="max-h-32 min-h-12 flex-1 rounded-lg py-3" disabled={busy} />
          <Button type="submit" size="icon" disabled={busy || !draft.trim()} aria-label="ارسال"><Send className="size-4" /></Button>
        </div>
      </form>
    </>
  );
}

export function LivePane({
  messages, typed, busy, draft, setDraft, level, setLevel, voiceOn, setVoiceOn, lang, setLang,
  listening, scrollerRef, onSend, onScenario, onMic, onNew, onSave,
}: {
  messages: ChatMsg[]; typed: string; busy: boolean; draft: string; setDraft: (v: string) => void;
  level: Level; setLevel: (v: Level) => void; voiceOn: boolean; setVoiceOn: (v: boolean) => void;
  lang: LangCode; setLang: (v: LangCode) => void; listening: boolean;
  scrollerRef: RefObject<HTMLDivElement | null>; onSend: (t: string) => void;
  onScenario: (prompt: string) => void; onMic: () => void; onNew: () => void; onSave: () => void;
}) {
  const empty = messages.length === 0 && !typed;
  const currentLang = LANGUAGES.find((l) => l.code === lang);
  return (
    <>
      <div className="flex flex-wrap items-center gap-2 border-b border-border px-3 py-2 sm:px-5">
        <div className="flex rounded-md bg-surface p-0.5">
          {LEVELS.map((l) => (
            <button key={l.id} type="button" onClick={() => setLevel(l.id)}
              className={cn("h-8 rounded-sm px-2.5 text-xs", level === l.id ? "bg-cream text-ink" : "text-fg-muted")}>{l.label}</button>
          ))}
        </div>
        <Button variant="ghost" size="sm" onClick={() => setVoiceOn(!voiceOn)}>
          {voiceOn ? <Volume2 className="size-4" /> : <VolumeX className="size-4" />}
        </Button>
        <div className="flex-1" />
        <Button variant="ghost" size="sm" onClick={onNew}>گفتگوی تازه</Button>
        <Button variant="ghost" size="sm" onClick={onSave} disabled={!messages.some((m) => m.role === "assistant")}>
          <Bookmark className="size-4" /> ذخیره
        </Button>
      </div>
      <div ref={scrollerRef} className="min-h-0 flex-1 overflow-y-auto px-3 py-4 sm:px-5">
        {empty ? (
          <div className="mx-auto flex max-w-xl flex-col gap-6 pt-2">
            <div>
              <h1 className="font-display text-2xl font-medium sm:text-3xl">گفتگوی زنده · آموزش زبان</h1>
              <p className="mt-2 text-sm text-fg-muted">زبان را انتخاب کن، سناریو بزن یا مستقیم حرف بزن.</p>
            </div>
            <div>
              <p className="mb-2 text-xs text-fg-muted">زبان هدف</p>
              <div className="flex flex-wrap gap-2">
                {LANGUAGES.map((l) => (
                  <button key={l.code} type="button" onClick={() => setLang(l.code)}
                    className={cn("h-10 rounded-full border px-3.5 text-sm", lang === l.code ? "border-stage bg-cream text-ink" : "border-border bg-card")}>
                    <span className="me-1.5">{l.flag}</span>{l.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="mb-2 text-xs text-fg-muted">سناریو برای {currentLang?.native ?? "English"}</p>
              <div className="flex flex-wrap gap-2">
                {SCENARIOS.map((s) => (
                  <button key={s.id} type="button" onClick={() => onScenario(s.prompt)}
                    className="h-10 rounded-full border border-border bg-card px-3.5 text-sm hover:bg-cream">{s.label}</button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="mx-auto flex max-w-xl flex-col gap-4">
            <p className="text-xs text-fg-muted">گفتگوی زنده · {currentLang?.flag} {currentLang?.label}</p>
            {messages.map((m, i) => <Bubble key={i} role={m.role} text={m.content} />)}
            {typed ? <Bubble role="assistant" text={typed} live /> : null}
            {busy && !typed ? <div className="text-sm text-fg-muted">پویا دارد فکر می‌کند</div> : null}
          </div>
        )}
      </div>
      <form className="border-t border-border p-3 sm:px-5 sm:pb-4" onSubmit={(e) => { e.preventDefault(); onSend(draft); }}>
        <div className="mx-auto flex max-w-xl items-end gap-2">
          <Button type="button" size="icon" variant={listening ? "default" : "outline"} onClick={onMic} disabled={busy}><Mic className="size-4" /></Button>
          <Textarea value={draft} rows={1} onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); onSend(draft); } }}
            placeholder={listening ? "دارم گوش می‌دهم…" : `به ${currentLang?.native ?? "English"} یا فارسی بنویس…`}
            className="max-h-32 min-h-12 flex-1 rounded-lg py-3" disabled={busy} />
          <Button type="submit" size="icon" disabled={busy || !draft.trim()}><Send className="size-4" /></Button>
        </div>
      </form>
    </>
  );
}
