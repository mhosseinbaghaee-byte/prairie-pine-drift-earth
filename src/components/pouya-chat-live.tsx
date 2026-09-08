import { type RefObject, useRef, useState } from "react";
import { Bookmark, BookOpen, History, Languages, Mic, Plus, Send, Trash2, X } from "lucide-react";
import {
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
import { PouyaFaceButton } from "./pouya-face-button";

type ChatMsg = { role: "user" | "assistant"; content: string; image?: string };
export type ChatAttachment = { name: string; mime: string; dataUrl: string };

function Bubble({ role, text, image, live }: { role: "user" | "assistant"; text: string; image?: string; live?: boolean }) {
  const mine = role === "user";
  return (
    <article
      className={cn(
        "max-w-[88%] rounded-2xl px-4 py-3 text-sm leading-normal shadow-sm",
        mine ? "ms-auto bg-stage text-cream" : "border border-white/40 bg-white/85 text-ink backdrop-blur-md",
        live && "opacity-95",
      )}
    >
      {image ? (
        <img src={image} alt="پیوست" className={cn("mb-2 max-h-48 w-auto max-w-full rounded-xl object-contain", mine ? "border border-white/20" : "border border-border/40")} />
      ) : null}
      {mine ? <p className="text-pretty">{text}</p> : <RichText text={text} />}
    </article>
  );
}

function ActionBar({
  onNew,
  onSave,
  canSave,
  onHistory,
}: {
  onNew: () => void;
  onSave: () => void;
  canSave: boolean;
  onHistory?: () => void;
}) {
  return (
    <div className="flex items-center gap-1 px-3 py-2 sm:px-4">
      <Button type="button" variant="ghost" size="sm" onClick={onSave} disabled={!canSave} className="gap-1 text-cream/90 hover:bg-white/15 hover:text-cream">
        <Bookmark className="size-4" />
        ذخیره
      </Button>
      {onHistory ? (
        <Button type="button" variant="ghost" size="sm" onClick={onHistory} className="gap-1 text-cream/90 hover:bg-white/15 hover:text-cream" aria-label="تاریخچه گفتگو">
          <History className="size-4" />
          تاریخچه
        </Button>
      ) : null}
      <div className="min-w-0 flex-1" />
      <Button type="button" variant="ghost" size="sm" onClick={onNew} className="text-cream/90 hover:bg-white/15 hover:text-cream">
        گفتگوی تازه
      </Button>
    </div>
  );
}

export type HistoryItem = { id: string; title: string; when: string };

function HistorySheet({
  open,
  items,
  activeId,
  onClose,
  onOpen,
  onDelete,
}: {
  open: boolean;
  items: HistoryItem[];
  activeId?: string;
  onClose: () => void;
  onOpen: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/50 p-3 sm:items-center" role="dialog" aria-modal="true" aria-label="تاریخچه گفتگو">
      <div className="flex max-h-[75dvh] w-full max-w-md flex-col overflow-hidden rounded-2xl border border-white/20 bg-stage-deep text-cream shadow-xl">
        <div className="flex items-center gap-2 border-b border-white/10 px-4 py-3">
          <History className="size-4 opacity-80" />
          <p className="flex-1 text-sm font-medium">تاریخچه گفتگو</p>
          <button type="button" className="rounded-full p-2 hover:bg-white/10" onClick={onClose} aria-label="بستن">
            <X className="size-4" />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto p-2">
          {items.length === 0 ? (
            <p className="px-3 py-8 text-center text-sm text-cream/60">هنوز گفتگویی ذخیره نشده.</p>
          ) : (
            <ul className="space-y-1">
              {items.map((it) => (
                <li key={it.id} className={cn("flex items-stretch gap-1 rounded-xl", activeId === it.id && "bg-white/10")}>
                  <button type="button" className="min-w-0 flex-1 rounded-xl px-3 py-2.5 text-start hover:bg-white/10" onClick={() => onOpen(it.id)}>
                    <p className="truncate text-sm font-medium">{it.title}</p>
                    <p className="mt-0.5 text-xs text-cream/55">{it.when}</p>
                  </button>
                  <button type="button" className="shrink-0 rounded-xl px-3 text-cream/50 hover:bg-white/10 hover:text-cream" aria-label="حذف" onClick={() => onDelete(it.id)}>
                    <Trash2 className="size-4" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

const chipClass =
  "inline-flex h-11 min-h-11 items-center justify-center gap-1.5 rounded-full border border-white/30 bg-white/15 px-3.5 text-sm text-cream backdrop-blur-md touch-manipulation select-none hover:bg-white/25 active:scale-[0.98]";

export function ChatPane({
  messages, typed, busy, draft, setDraft, level, setLevel, voiceOn, setVoiceOn, mode, listening,
  scrollerRef, onSend, onLesson, onDaily, onFact, onMic, onLivePractice, onNew, onSave, onTypingFocus, onVoiceCall,
  historyItems, historyOpen, setHistoryOpen, activeSessionId, onOpenHistoryItem, onDeleteHistoryItem,
}: {
  messages: ChatMsg[]; typed: string; busy: boolean; draft: string; setDraft: (v: string) => void;
  level: Level; setLevel: (v: Level) => void; voiceOn: boolean; setVoiceOn: (v: boolean) => void;
  mode: ChatMode; listening: boolean; scrollerRef: RefObject<HTMLDivElement | null>;
  onSend: (t: string, attachment?: ChatAttachment) => void; onLesson: (t: string) => void; onDaily: () => void; onFact: () => void;
  onMic: () => void; onLivePractice: () => void; onNew: () => void; onSave: () => void;
  onTypingFocus?: (focused: boolean) => void;
  onVoiceCall?: () => void;
  historyItems?: HistoryItem[];
  historyOpen?: boolean;
  setHistoryOpen?: (v: boolean) => void;
  activeSessionId?: string;
  onOpenHistoryItem?: (id: string) => void;
  onDeleteHistoryItem?: (id: string) => void;
}) {
  const empty = messages.length === 0 && !typed;
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [pending, setPending] = useState<ChatAttachment | null>(null);
  void level; void setLevel; void voiceOn; void setVoiceOn;

  function pickFile(file: File | null | undefined) {
    if (!file) return;
    const okImage = file.type.startsWith("image/");
    const okText = file.type.startsWith("text/") || /\.txt$/i.test(file.name);
    if (!okImage && !okText) {
      window.alert("فعلاً عکس جزوه (JPG/PNG) یا فایل متنی را بفرست.");
      return;
    }
    if (file.size > 4 * 1024 * 1024) {
      window.alert("حجم فایل حداکثر ۴ مگابایت باشد.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = String(reader.result || "");
      if (!dataUrl) return;
      setPending({ name: file.name, mime: file.type || "application/octet-stream", dataUrl });
    };
    reader.readAsDataURL(file);
  }

  function submitChat() {
    const text = draft.trim() || (pending ? `این ${pending.mime.startsWith("image/") ? "عکس/جزوه" : "فایل"} را بررسی کن و توضیح بده.` : "");
    if (!text && !pending) return;
    onSend(text, pending || undefined);
    setPending(null);
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <ActionBar
        onNew={onNew}
        onSave={onSave}
        canSave={messages.some((m) => m.role === "assistant")}
        onHistory={setHistoryOpen ? () => setHistoryOpen(true) : undefined}
      />
      <HistorySheet
        open={Boolean(historyOpen)}
        items={historyItems || []}
        activeId={activeSessionId}
        onClose={() => setHistoryOpen?.(false)}
        onOpen={(id) => { onOpenHistoryItem?.(id); setHistoryOpen?.(false); }}
        onDelete={(id) => onDeleteHistoryItem?.(id)}
      />
      <div ref={scrollerRef} className="min-h-0 flex-1 overflow-y-auto px-3 py-3 sm:px-5">
        {empty ? (
          <div className="mx-auto flex w-full max-w-xl min-w-0 flex-col gap-5 pt-4 text-center">
            <div className="px-1">
              <h1 className="font-display text-2xl font-medium tracking-tight text-cream drop-shadow-sm sm:text-3xl">چی دوست داری یاد بگیری؟</h1>
              <p className="mt-2 text-sm text-cream/75">بپرس، درس کوتاه بگیر، یا با صدا حرف بزن.</p>
            </div>
            <div className="flex flex-wrap justify-center gap-2">
              {TOPICS.map((t) => (
                <button key={t.id} type="button" onClick={() => onLesson(t.prompt)} className={chipClass}>{t.label}</button>
              ))}
            </div>
            <div className="flex flex-wrap justify-center gap-2">
              <button type="button" onClick={(e) => { e.preventDefault(); e.stopPropagation(); onLivePractice(); }} className={chipClass} aria-label="تمرین زبان">
                <Languages className="size-4 shrink-0" /> تمرین زبان
              </button>
              <button type="button" onClick={(e) => { e.preventDefault(); e.stopPropagation(); onDaily(); }} className={chipClass} aria-label="مرور روزانه">
                <BookOpen className="size-4 shrink-0" /> مرور روزانه
              </button>
              <button type="button" onClick={(e) => { e.preventDefault(); e.stopPropagation(); onFact(); }} className={chipClass} aria-label="دانستی امروز">
                دانستی امروز
              </button>
            </div>
          </div>
        ) : (
          <div className="mx-auto flex max-w-xl flex-col gap-3 pb-2">
            {mode !== "chat" ? (
              <p className="text-center text-xs text-cream/70">{mode === "daily" ? "حالت مرور روزانه" : mode === "lesson" ? "حالت درس کوتاه" : ""}</p>
            ) : null}
            {messages.map((m, i) => <Bubble key={i} role={m.role} text={m.content} image={m.image} />)}
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
      <form className="pouya-glass-composer mx-3 mb-3 sm:mx-5 sm:mb-4" onSubmit={(e) => { e.preventDefault(); submitChat(); }}>
        {pending ? (
          <div className="mb-2 flex items-center gap-2 rounded-xl border border-border/50 bg-white/70 px-2 py-1.5">
            {pending.mime.startsWith("image/") ? (
              <img src={pending.dataUrl} alt="" className="size-12 rounded-lg object-cover" />
            ) : (
              <span className="text-xs text-fg-muted">📄 {pending.name}</span>
            )}
            <span className="min-w-0 flex-1 truncate text-xs text-fg-muted">{pending.name}</span>
            <button type="button" className="rounded-full p-1 text-fg-muted hover:bg-black/5" onClick={() => setPending(null)} aria-label="حذف پیوست">
              <X className="size-4" />
            </button>
          </div>
        ) : null}
        <Textarea
          value={draft}
          rows={2}
          onChange={(e) => setDraft(e.target.value)}
          onFocus={() => onTypingFocus?.(true)}
          onBlur={() => onTypingFocus?.(false)}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submitChat(); } }}
          placeholder={listening ? "دارم گوش می‌دهم…" : "بپرس یا عکس جزوه را پیوست کن…"}
          className="max-h-36 min-h-14 w-full resize-none border-0 bg-transparent px-1 py-1 text-base text-ink shadow-none placeholder:text-fg-subtle focus-visible:ring-0"
          disabled={busy}
        />
        <div className="mt-1 flex items-center gap-2">
          <input ref={fileRef} type="file" accept="image/*,text/plain,.txt" className="hidden" onChange={(e) => { pickFile(e.target.files?.[0]); e.target.value = ""; }} />
          <Button type="button" size="icon" variant="outline" disabled={busy} onClick={() => fileRef.current?.click()} aria-label="پیوست فایل یا عکس" className="rounded-full border-border/60 bg-white/70">
            <Plus className="size-4" />
          </Button>
          <PouyaFaceButton onClick={onVoiceCall} label="گفتگوی صوتی با پویا" disabled={busy} />
          <Button type="button" size="icon" variant={listening ? "default" : "outline"} onClick={onMic} disabled={busy} aria-label="میکروفون" className={cn("rounded-full", listening ? "bg-stage text-cream hover:bg-stage-deep" : "border-border/60 bg-white/70")}>
            <Mic className="size-4" />
          </Button>
          <div className="flex-1" />
          <Button type="submit" size="icon" disabled={busy || (!draft.trim() && !pending)} aria-label="ارسال" className="rounded-full bg-stage text-cream hover:bg-stage-deep">
            <Send className="size-4" />
          </Button>
        </div>
      </form>
    </div>
  );
}

export function LivePane({
  messages, typed, busy, draft, setDraft, level, setLevel, voiceOn, setVoiceOn, lang, setLang,
  listening, scrollerRef, onSend, onScenario, onMic, onNew, onSave, onTypingFocus, onVoiceCall,
}: {
  messages: ChatMsg[]; typed: string; busy: boolean; draft: string; setDraft: (v: string) => void;
  level: Level; setLevel: (v: Level) => void; voiceOn: boolean; setVoiceOn: (v: boolean) => void;
  lang: LangCode; setLang: (v: LangCode) => void; listening: boolean;
  scrollerRef: RefObject<HTMLDivElement | null>; onSend: (t: string) => void;
  onScenario: (prompt: string) => void; onMic: () => void; onNew: () => void; onSave: () => void;
  onTypingFocus?: (focused: boolean) => void;
  onVoiceCall?: () => void;
}) {
  const empty = messages.length === 0 && !typed;
  const currentLang = LANGUAGES.find((l) => l.code === lang);
  void level; void setLevel; void voiceOn; void setVoiceOn;
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <ActionBar onNew={onNew} onSave={onSave} canSave={messages.some((m) => m.role === "assistant")} />
      <div ref={scrollerRef} className="min-h-0 flex-1 overflow-y-auto px-3 py-3 sm:px-5">
        {empty ? (
          <div className="mx-auto flex max-w-xl flex-col gap-5 pt-4">
            <div className="text-center">
              <h1 className="font-display text-2xl font-medium text-cream sm:text-3xl">گفتگوی زنده · زبان</h1>
              <p className="mt-2 text-sm text-cream/75">زبان را انتخاب کن و حرف بزن.</p>
            </div>
            <div className="flex flex-wrap justify-center gap-2">
              {LANGUAGES.map((l) => (
                <button key={l.code} type="button" onClick={() => setLang(l.code)} className={cn("h-11 min-h-11 rounded-full border px-3.5 text-sm backdrop-blur-md touch-manipulation", lang === l.code ? "border-white bg-white text-ink" : "border-white/30 bg-white/15 text-cream")}>
                  <span className="me-1.5">{l.flag}</span>{l.label}
                </button>
              ))}
            </div>
            <div className="flex flex-wrap justify-center gap-2">
              {SCENARIOS.map((s) => (
                <button key={s.id} type="button" onClick={() => onScenario(s.prompt)} className={chipClass}>{s.label}</button>
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
        <Textarea value={draft} rows={2} onChange={(e) => setDraft(e.target.value)} onFocus={() => onTypingFocus?.(true)} onBlur={() => onTypingFocus?.(false)}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); onSend(draft); } }}
          placeholder={listening ? "دارم گوش می‌دهم…" : `به ${currentLang?.native ?? "English"} یا فارسی بنویس…`}
          className="max-h-36 min-h-14 w-full resize-none border-0 bg-transparent px-1 py-1 text-base text-ink shadow-none focus-visible:ring-0" disabled={busy} />
        <div className="mt-1 flex items-center gap-2">
          <PouyaFaceButton onClick={onVoiceCall} label="گفتگوی صوتی با پویا" disabled={busy} />
          <Button type="button" size="icon" variant={listening ? "default" : "outline"} onClick={onMic} disabled={busy} className={cn("rounded-full", listening ? "bg-stage text-cream hover:bg-stage-deep" : "border-border/60 bg-white/70")}>
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
