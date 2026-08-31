import { useEffect, useRef, useState, type RefObject } from "react";
import {
  Bookmark,
  BookOpen,
  Brain,
  GraduationCap,
  Languages,
  MessageCircle,
  Plus,
  Send,
  Trash2,
  Volume2,
  VolumeX,
} from "lucide-react";
import { toast } from "sonner";
import { askPouya, makeQuiz, speakPouya, type ChatMode, type QuizPayload } from "@/lib/ai";
import { localQuiz, localTutorReply } from "@/lib/library";
import {
  LEVELS,
  LANGUAGES,
  QUIZ_TOPICS,
  SCENARIOS,
  TOPICS,
  langById,
  type LangCode,
  type Level,
} from "@/lib/topics";
import {
  deleteNote,
  FOLDERS,
  listNotes,
  saveNote,
  titleFromBody,
  type FolderId,
  type Note,
} from "@/lib/vault";
import { cn } from "@/lib/utils";
import { PouyaStage, type StageMood } from "./pouya-stage";
import { RichText } from "./rich-text";
import { Button } from "./ui/button";
import { Input, Textarea } from "./ui/input";

type Tab = "chat" | "live" | "quiz" | "vault";
type ChatMsg = { role: "user" | "assistant"; content: string };

const INTRO_KEY = "pouya-intro-seen";

function spokenSlice(text: string) {
  const clean = text
    .replace(/[#>*`]/g, "")
    .replace(/\*\*/g, "")
    .replace(/\s+/g, " ")
    .trim();
  if (clean.length <= 360) return clean;
  const cut = clean.slice(0, 360);
  const mark = Math.max(cut.lastIndexOf("."), cut.lastIndexOf("؟"), cut.lastIndexOf("!"), cut.lastIndexOf("?"));
  return mark > 80 ? cut.slice(0, mark + 1) : cut;
}

export function PouyaApp() {
  const [tab, setTab] = useState<Tab>("chat");
  const [level, setLevel] = useState<Level>("teen");
  const [voiceOn, setVoiceOn] = useState(true);
  const [mood, setMood] = useState<StageMood>("intro");
  const [mode, setMode] = useState<ChatMode>("chat");
  const [lang, setLang] = useState<LangCode>("en");
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [typed, setTyped] = useState("");
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const voiceActiveRef = useRef(false);
  const scrollerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const seen = sessionStorage.getItem(INTRO_KEY);
    if (seen) {
      setMood("idle");
      return;
    }
    const t = window.setTimeout(() => {
      sessionStorage.setItem(INTRO_KEY, "1");
      setMood("idle");
    }, 12500);
    return () => window.clearTimeout(t);
  }, []);

  useEffect(() => {
    scrollerRef.current?.scrollTo({ top: scrollerRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, typed, busy, tab]);

  const langLabel = LANGUAGES.find((l) => l.code === lang)?.label ?? "انگلیسی";

  const caption =
    mood === "intro"
      ? "سلام، من پویام."
      : busy
        ? "دارم فکر می‌کنم…"
        : tab === "quiz"
          ? "بزن بریم آزمون."
          : tab === "vault"
            ? "اینجا مغز دوم توست."
            : tab === "live"
              ? messages.length === 0
                ? `آمادهٔ تمرین ${langLabel}`
                : "گوش می‌دم…"
              : messages.length === 0
                ? "چی دوست داری امروز یاد بگیری؟"
                : "گوش می‌دم.";

  async function playVoice(text: string) {
    if (!voiceOn) return;
    const spoken = spokenSlice(text);
    try {
      const res = await speakPouya({ data: { text: spoken, lang: langById(lang).locale } });
      if (res.ok) {
        audioRef.current?.pause();
        window.speechSynthesis?.cancel();
        const url = `data:${res.mime};base64,${res.audio}`;
        const audio = new Audio(url);
        audioRef.current = audio;
        voiceActiveRef.current = true;
        setMood("talk");
        audio.onended = () => {
          voiceActiveRef.current = false;
          setMood("idle");
        };
        await audio.play();
        return;
      }
    } catch {
      voiceActiveRef.current = false;
    }
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(spoken);
    utter.lang = langById(lang).locale;
    utter.rate = 1;
    utter.onend = () => {
      voiceActiveRef.current = false;
      setMood("idle");
    };
    voiceActiveRef.current = true;
    setMood("talk");
    window.speechSynthesis.speak(utter);
  }

  function typeOut(text: string) {
    setTyped("");
    let i = 0;
    const step = Math.max(1, Math.ceil(text.length / 180));
    return new Promise<void>((resolve) => {
      const tick = () => {
        i = Math.min(text.length, i + step);
        setTyped(text.slice(0, i));
        if (i >= text.length) {
          resolve();
          return;
        }
        window.setTimeout(tick, 16);
      };
      tick();
    });
  }

  async function send(text: string, nextMode: ChatMode = mode, nextLang?: LangCode) {
    const content = text.trim();
    if (!content || busy) return;
    const useLang = nextLang ?? lang;
    setMode(nextMode);
    if (nextLang) setLang(nextLang);
    setDraft("");
    if (nextMode === "live") setTab("live");
    else setTab("chat");
    const history: ChatMsg[] = [...messages, { role: "user", content }];
    setMessages(history);
    setBusy(true);
    setMood("think");
    audioRef.current?.pause();
    voiceActiveRef.current = false;
    try {
      const res = await askPouya({
        data: {
          messages: history.slice(-12),
          level,
          mode: nextMode,
          lang: nextMode === "live" ? useLang : undefined,
        },
      });
      const reply =
        res && typeof res === "object" && "ok" in res && res.ok && "text" in res && typeof res.text === "string"
          ? res.text
          : localTutorReply({ messages: history.slice(-12), mode: nextMode, lang: useLang });
      setMood("talk");
      void playVoice(reply);
      await typeOut(reply);
      setMessages([...history, { role: "assistant", content: reply }]);
      setTyped("");
      if (!voiceActiveRef.current) setMood("idle");
    } catch {
      const reply = localTutorReply({ messages: history.slice(-12), mode: nextMode, lang: useLang });
      setMood("talk");
      void playVoice(reply);
      await typeOut(reply);
      setMessages([...history, { role: "assistant", content: reply }]);
      setTyped("");
      if (!voiceActiveRef.current) setMood("idle");
    } finally {
      setBusy(false);
    }
  }

  function newChat() {
    audioRef.current?.pause();
    voiceActiveRef.current = false;
    setMessages([]);
    setTyped("");
    setMode(tab === "live" ? "live" : "chat");
    setMood("idle");
  }

  function saveLast(folder: FolderId = "knowledge") {
    const last = [...messages].reverse().find((m) => m.role === "assistant");
    if (!last) {
      toast.error("هنوز پاسخی برای ذخیره نیست.");
      return;
    }
    saveNote({ folder, title: titleFromBody(last.content), body: last.content, source: "chat" });
    toast.success("در مغز دوم ذخیره شد.");
  }

  function startScenario(prompt: string) {
    void send(prompt, "live", lang);
  }

  return (
    <div className="flex min-h-dvh flex-col bg-background text-fg lg:h-dvh lg:flex-row" dir="ltr">
      <div className="relative lg:w-[42%] lg:shrink-0">
        <PouyaStage
          mood={mood}
          caption={caption}
          compact={(tab !== "chat" && tab !== "live") || messages.length > 0}
        />
      </div>

      <div className="flex min-h-0 min-w-0 flex-1 flex-col bg-background" dir="rtl">
        <header className="flex items-center gap-2 border-b border-border px-3 py-2.5 sm:px-5">
          <div className="min-w-0 flex-1">
            <p className="font-display text-base font-medium tracking-tight">پویا</p>
            <p className="text-xs text-fg-muted">مربی زنده دانش و زبان</p>
          </div>
          <nav className="flex rounded-lg bg-surface p-1" aria-label="بخش‌ها">
            {(
              [
                ["chat", "گفتگو", MessageCircle],
                ["live", "زبان", Languages],
                ["quiz", "آزمون", GraduationCap],
                ["vault", "مغز دوم", Brain],
              ] as const
            ).map(([id, label, Icon]) => (
              <button
                key={id}
                type="button"
                onClick={() => {
                  setTab(id);
                  if (id === "live") setMode("live");
                  else if (id === "chat") setMode("chat");
                }}
                className={cn(
                  "flex h-10 items-center gap-1.5 rounded-md px-2.5 text-sm transition-colors duration-quick",
                  tab === id ? "bg-cream text-ink" : "text-fg-muted hover:text-fg",
                )}
              >
                <Icon className="size-4" strokeWidth={1.75} />
                <span className="hidden sm:inline">{label}</span>
              </button>
            ))}
          </nav>
        </header>

        {tab === "chat" ? (
          <ChatPane
            messages={messages}
            typed={typed}
            busy={busy}
            draft={draft}
            setDraft={setDraft}
            level={level}
            setLevel={setLevel}
            voiceOn={voiceOn}
            setVoiceOn={setVoiceOn}
            mode={mode}
            scrollerRef={scrollerRef}
            onSend={(t) => void send(t)}
            onLesson={(t) => void send(t, "lesson")}
            onDaily={() => void send("مرور روزانه را شروع کن. از من سؤال بپرس.", "daily")}
            onFact={() => void askFact(level, send)}
            onNew={newChat}
            onSave={() => saveLast()}
          />
        ) : null}

        {tab === "live" ? (
          <LivePane
            messages={messages}
            typed={typed}
            busy={busy}
            draft={draft}
            setDraft={setDraft}
            level={level}
            setLevel={setLevel}
            voiceOn={voiceOn}
            setVoiceOn={setVoiceOn}
            lang={lang}
            setLang={setLang}
            scrollerRef={scrollerRef}
            onSend={(t) => void send(t, "live")}
            onScenario={startScenario}
            onNew={newChat}
            onSave={() => saveLast()}
          />
        ) : null}

        {tab === "quiz" ? <QuizPane level={level} setMood={setMood} /> : null}
        {tab === "vault" ? <VaultPane /> : null}
      </div>
    </div>
  );
}

async function askFact(level: Level, send: (t: string, m?: ChatMode) => Promise<void>) {
  await send("یک دانستی امروز غافلگیرکننده برایم بگو.", "chat");
  void level;
}

function ChatPane({
  messages,
  typed,
  busy,
  draft,
  setDraft,
  level,
  setLevel,
  voiceOn,
  setVoiceOn,
  mode,
  scrollerRef,
  onSend,
  onLesson,
  onDaily,
  onFact,
  onNew,
  onSave,
}: {
  messages: ChatMsg[];
  typed: string;
  busy: boolean;
  draft: string;
  setDraft: (v: string) => void;
  level: Level;
  setLevel: (v: Level) => void;
  voiceOn: boolean;
  setVoiceOn: (v: boolean) => void;
  mode: ChatMode;
  scrollerRef: RefObject<HTMLDivElement | null>;
  onSend: (t: string) => void;
  onLesson: (t: string) => void;
  onDaily: () => void;
  onFact: () => void;
  onNew: () => void;
  onSave: () => void;
}) {
  const empty = messages.length === 0 && !typed;

  return (
    <>
      <div className="flex flex-wrap items-center gap-2 border-b border-border px-3 py-2 sm:px-5">
        <div className="flex rounded-md bg-surface p-0.5">
          {LEVELS.map((l) => (
            <button
              key={l.id}
              type="button"
              title={l.hint}
              onClick={() => setLevel(l.id)}
              className={cn(
                "h-8 rounded-sm px-2.5 text-xs transition-colors",
                level === l.id ? "bg-cream text-ink" : "text-fg-muted hover:text-fg",
              )}
            >
              {l.label}
            </button>
          ))}
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setVoiceOn(!voiceOn)}
          aria-pressed={voiceOn}
          title={voiceOn ? "قطع صدا" : "روشن کردن صدا"}
        >
          {voiceOn ? <Volume2 className="size-4" /> : <VolumeX className="size-4" />}
          <span className="hidden sm:inline">{voiceOn ? "صدا روشن" : "بی‌صدا"}</span>
        </Button>
        <div className="flex-1" />
        <Button variant="ghost" size="sm" onClick={onNew}>
          گفتگوی تازه
        </Button>
        <Button variant="ghost" size="sm" onClick={onSave} disabled={!messages.some((m) => m.role === "assistant")}>
          <Bookmark className="size-4" />
          ذخیره
        </Button>
      </div>

      <div ref={scrollerRef} className="min-h-0 flex-1 overflow-y-auto px-3 py-4 sm:px-5">
        {empty ? (
          <div className="mx-auto flex max-w-xl flex-col gap-6 pt-2">
            <div>
              <h1 className="font-display text-2xl font-medium tracking-tight text-balance sm:text-3xl">
                آموزش زنده، نه جزوه خشک.
              </h1>
              <p className="mt-2 max-w-md text-sm leading-normal text-fg-muted text-pretty">
                بپرس، درس کوتاه بگیر، آزمون بده، یا مرور روزانه را شروع کن. پویا جواب را برایت نگه می‌دارد.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {TOPICS.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => onLesson(t.prompt)}
                  className="h-10 rounded-full border border-border bg-card px-3.5 text-sm text-fg transition-colors hover:border-stage/40 hover:bg-cream"
                >
                  {t.label}
                </button>
              ))}
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" onClick={onDaily}>
                <BookOpen className="size-4" />
                مرور روزانه
              </Button>
              <Button variant="outline" size="sm" onClick={onFact}>
                دانستی امروز
              </Button>
            </div>
          </div>
        ) : (
          <div className="mx-auto flex max-w-xl flex-col gap-4">
            {mode !== "chat" ? (
              <p className="text-xs text-fg-muted">
                {mode === "daily" ? "حالت مرور روزانه" : mode === "lesson" ? "حالت درس کوتاه" : ""}
              </p>
            ) : null}
            {messages.map((m, i) => (
              <Bubble key={i} role={m.role} text={m.content} />
            ))}
            {typed ? <Bubble role="assistant" text={typed} live /> : null}
            {busy && !typed ? (
              <div className="flex items-center gap-2 text-sm text-fg-muted">
                <span className="size-1.5 animate-pulse rounded-full bg-stage" />
                پویا دارد فکر می‌کند
              </div>
            ) : null}
          </div>
        )}
      </div>

      <form
        className="border-t border-border bg-background p-3 sm:px-5 sm:pb-4"
        onSubmit={(e) => {
          e.preventDefault();
          onSend(draft);
        }}
      >
        <div className="mx-auto flex max-w-xl items-end gap-2">
          <Textarea
            value={draft}
            rows={1}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                onSend(draft);
              }
            }}
            placeholder="بپرس، یا بگو چه چیزی را می‌خواهی بفهمی…"
            className="max-h-32 min-h-12 flex-1 rounded-lg py-3"
            disabled={busy}
          />
          <Button type="submit" size="icon" disabled={busy || !draft.trim()} aria-label="ارسال">
            <Send className="size-4" />
          </Button>
        </div>
      </form>
    </>
  );
}

function LivePane({
  messages,
  typed,
  busy,
  draft,
  setDraft,
  level,
  setLevel,
  voiceOn,
  setVoiceOn,
  lang,
  setLang,
  scrollerRef,
  onSend,
  onScenario,
  onNew,
  onSave,
}: {
  messages: ChatMsg[];
  typed: string;
  busy: boolean;
  draft: string;
  setDraft: (v: string) => void;
  level: Level;
  setLevel: (v: Level) => void;
  voiceOn: boolean;
  setVoiceOn: (v: boolean) => void;
  lang: LangCode;
  setLang: (v: LangCode) => void;
  scrollerRef: RefObject<HTMLDivElement | null>;
  onSend: (t: string) => void;
  onScenario: (prompt: string) => void;
  onNew: () => void;
  onSave: () => void;
}) {
  const empty = messages.length === 0 && !typed;
  const currentLang = LANGUAGES.find((l) => l.code === lang);

  return (
    <>
      <div className="flex flex-wrap items-center gap-2 border-b border-border px-3 py-2 sm:px-5">
        <div className="flex rounded-md bg-surface p-0.5">
          {LEVELS.map((l) => (
            <button
              key={l.id}
              type="button"
              title={l.hint}
              onClick={() => setLevel(l.id)}
              className={cn(
                "h-8 rounded-sm px-2.5 text-xs transition-colors",
                level === l.id ? "bg-cream text-ink" : "text-fg-muted hover:text-fg",
              )}
            >
              {l.label}
            </button>
          ))}
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setVoiceOn(!voiceOn)}
          aria-pressed={voiceOn}
        >
          {voiceOn ? <Volume2 className="size-4" /> : <VolumeX className="size-4" />}
          <span className="hidden sm:inline">{voiceOn ? "صدا روشن" : "بی‌صدا"}</span>
        </Button>
        <div className="flex-1" />
        <Button variant="ghost" size="sm" onClick={onNew}>
          گفتگوی تازه
        </Button>
        <Button variant="ghost" size="sm" onClick={onSave} disabled={!messages.some((m) => m.role === "assistant")}>
          <Bookmark className="size-4" />
          ذخیره
        </Button>
      </div>

      <div ref={scrollerRef} className="min-h-0 flex-1 overflow-y-auto px-3 py-4 sm:px-5">
        {empty ? (
          <div className="mx-auto flex max-w-xl flex-col gap-6 pt-2">
            <div>
              <h1 className="font-display text-2xl font-medium tracking-tight text-balance sm:text-3xl">
                گفتگوی زنده · آموزش زبان
              </h1>
              <p className="mt-2 max-w-md text-sm leading-normal text-fg-muted text-pretty">
                زبان را انتخاب کن، یک سناریو بزن یا مستقیم شروع به حرف زدن کن. پویا با تو تمرین می‌کند،
                اشتباهات را نرم تصحیح می‌کند و توضیح کوتاه به فارسی می‌دهد.
              </p>
            </div>

            <div>
              <p className="mb-2 text-xs text-fg-muted">زبان هدف</p>
              <div className="flex flex-wrap gap-2">
                {LANGUAGES.map((l) => (
                  <button
                    key={l.code}
                    type="button"
                    onClick={() => setLang(l.code)}
                    className={cn(
                      "h-10 rounded-full border px-3.5 text-sm transition-colors",
                      lang === l.code
                        ? "border-stage bg-cream text-ink"
                        : "border-border bg-card hover:border-stage/40",
                    )}
                  >
                    <span className="me-1.5">{l.flag}</span>
                    {l.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="mb-2 text-xs text-fg-muted">
                سناریو برای {currentLang?.native ?? "English"}
              </p>
              <div className="flex flex-wrap gap-2">
                {SCENARIOS.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => onScenario(s.prompt)}
                    className="h-10 rounded-full border border-border bg-card px-3.5 text-sm text-fg transition-colors hover:border-stage/40 hover:bg-cream"
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="mx-auto flex max-w-xl flex-col gap-4">
            <p className="text-xs text-fg-muted">
              گفتگوی زنده · {currentLang?.flag} {currentLang?.label}
            </p>
            {messages.map((m, i) => (
              <Bubble key={i} role={m.role} text={m.content} />
            ))}
            {typed ? <Bubble role="assistant" text={typed} live /> : null}
            {busy && !typed ? (
              <div className="flex items-center gap-2 text-sm text-fg-muted">
                <span className="size-1.5 animate-pulse rounded-full bg-stage" />
                پویا دارد فکر می‌کند
              </div>
            ) : null}
          </div>
        )}
      </div>

      <form
        className="border-t border-border bg-background p-3 sm:px-5 sm:pb-4"
        onSubmit={(e) => {
          e.preventDefault();
          onSend(draft);
        }}
      >
        <div className="mx-auto flex max-w-xl items-end gap-2">
          <Textarea
            value={draft}
            rows={1}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                onSend(draft);
              }
            }}
            placeholder={`به ${currentLang?.native ?? "English"} یا فارسی بنویس…`}
            className="max-h-32 min-h-12 flex-1 rounded-lg py-3"
            disabled={busy}
          />
          <Button type="submit" size="icon" disabled={busy || !draft.trim()} aria-label="ارسال">
            <Send className="size-4" />
          </Button>
        </div>
      </form>
    </>
  );
}

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

function QuizPane({
  level,
  setMood,
}: {
  level: Level;
  setMood: (m: StageMood) => void;
}) {
  const [topic, setTopic] = useState(QUIZ_TOPICS[0]);
  const [custom, setCustom] = useState("");
  const [quiz, setQuiz] = useState<QuizPayload | null>(null);
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  async function start() {
    setLoading(true);
    setMood("think");
    setQuiz(null);
    setIndex(0);
    setPicked(null);
    setScore(0);
    setDone(false);
    try {
      const res = await makeQuiz({ data: { topic: custom.trim() || topic, level } });
      const nextQuiz =
        res && typeof res === "object" && "ok" in res && res.ok && "quiz" in res && res.quiz
          ? res.quiz
          : localQuiz(custom.trim() || topic);
      setQuiz(nextQuiz);
      setMood("talk");
      window.setTimeout(() => setMood("idle"), 1800);
    } catch {
      setQuiz(localQuiz(custom.trim() || topic));
      setMood("talk");
      window.setTimeout(() => setMood("idle"), 1800);
    } finally {
      setLoading(false);
    }
  }

  function choose(i: number) {
    if (picked !== null || !quiz) return;
    setPicked(i);
    if (i === quiz.questions[index].correct) setScore((s) => s + 1);
  }

  function next() {
    if (!quiz) return;
    if (index + 1 >= quiz.questions.length) {
      setDone(true);
      const finalScore = score;
      saveNote({
        folder: "knowledge",
        title: `آزمون ${quiz.topic} — ${finalScore}/${quiz.questions.length}`,
        body: `نتیجه آزمون «${quiz.topic}»: ${finalScore} از ${quiz.questions.length}.`,
        source: "quiz",
      });
      return;
    }
    setIndex((n) => n + 1);
    setPicked(null);
  }

  if (done && quiz) {
    return (
      <div className="mx-auto flex w-full max-w-xl flex-1 flex-col justify-center gap-5 px-5 py-8">
        <p className="text-xs text-fg-muted">پایان آزمون</p>
        <h2 className="font-display text-3xl font-medium tracking-tight">
          {score} از {quiz.questions.length}
        </h2>
        <p className="text-sm text-fg-muted">نتیجه در مغز دوم، پوشه دانش، ذخیره شد.</p>
        <Button onClick={() => setQuiz(null)}>آزمون تازه</Button>
      </div>
    );
  }

  if (quiz) {
    const q = quiz.questions[index];
    return (
      <div className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-5 overflow-y-auto px-5 py-6">
        <div className="flex items-baseline justify-between gap-3">
          <p className="text-xs text-fg-muted">{quiz.topic}</p>
          <p className="tabular-nums text-xs text-fg-muted">
            {index + 1} / {quiz.questions.length}
          </p>
        </div>
        <h2 className="font-display text-xl font-medium tracking-tight text-balance">{q.q}</h2>
        <div className="flex flex-col gap-2">
          {q.options.map((opt, i) => {
            const show = picked !== null;
            const right = i === q.correct;
            const mine = i === picked;
            return (
              <button
                key={i}
                type="button"
                onClick={() => choose(i)}
                className={cn(
                  "min-h-12 rounded-lg border px-4 py-3 text-right text-sm transition-colors",
                  !show && "border-border bg-card hover:border-stage/40",
                  show && right && "border-stage bg-cream text-ink",
                  show && mine && !right && "border-border bg-surface text-fg-muted line-through",
                  show && !mine && !right && "border-border bg-card text-fg-muted",
                )}
              >
                {opt}
              </button>
            );
          })}
        </div>
        {picked !== null ? (
          <div className="space-y-3">
            <p className="text-sm leading-normal text-fg-muted text-pretty">{q.why}</p>
            <Button onClick={next}>{index + 1 >= quiz.questions.length ? "نتیجه" : "سؤال بعد"}</Button>
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-6 px-5 py-8">
      <div>
        <h2 className="font-display text-2xl font-medium tracking-tight">آزمون زنده</h2>
        <p className="mt-2 text-sm text-fg-muted">موضوع را انتخاب کن؛ پویا پنج سؤال چهارگزینه‌ای می‌سازد.</p>
      </div>
      <div className="flex flex-wrap gap-2">
        {QUIZ_TOPICS.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => {
              setTopic(t);
              setCustom("");
            }}
            className={cn(
              "h-10 rounded-full border px-3.5 text-sm",
              topic === t && !custom ? "border-stage bg-cream text-ink" : "border-border bg-card hover:border-stage/40",
            )}
          >
            {t}
          </button>
        ))}
      </div>
      <Input
        value={custom}
        onChange={(e) => setCustom(e.target.value)}
        placeholder="یا موضوع دلخواه بنویس…"
      />
      <Button onClick={() => void start()} disabled={loading}>
        {loading ? "در حال ساخت آزمون…" : "شروع آزمون"}
      </Button>
    </div>
  );
}

function VaultPane() {
  const [notes, setNotes] = useState<Note[]>(() => (typeof window === "undefined" ? [] : listNotes()));
  const [folder, setFolder] = useState<FolderId | "all">("all");
  const [active, setActive] = useState<Note | null>(null);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");

  function refresh() {
    const all = listNotes();
    setNotes(all);
    if (active) setActive(all.find((n) => n.id === active.id) ?? null);
  }

  const visible = notes.filter((n) => folder === "all" || n.folder === folder);

  function open(note: Note) {
    setActive(note);
    setTitle(note.title);
    setBody(note.body);
  }

  function create() {
    const note = saveNote({
      folder: folder === "all" ? "inbox" : folder,
      title: "یادداشت جدید",
      body: "",
      source: "manual",
    });
    refresh();
    open(note);
  }

  function persist() {
    if (!active) return;
    saveNote({ id: active.id, folder: active.folder, title, body, source: active.source });
    refresh();
    toast.success("ذخیره شد.");
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
      <aside className="border-b border-border lg:w-56 lg:border-b-0 lg:border-s">
        <div className="flex items-center justify-between px-3 py-3">
          <p className="text-xs text-fg-muted">پوشه‌ها</p>
          <Button variant="ghost" size="icon" className="size-9 min-h-9" onClick={create} aria-label="یادداشت تازه">
            <Plus className="size-4" />
          </Button>
        </div>
        <div className="flex gap-1 overflow-x-auto px-2 pb-2 lg:flex-col lg:overflow-visible">
          <FolderBtn active={folder === "all"} onClick={() => setFolder("all")} label="همه" />
          {FOLDERS.map((f) => (
            <FolderBtn
              key={f.id}
              active={folder === f.id}
              onClick={() => setFolder(f.id)}
              label={`${f.code} ${f.label}`}
            />
          ))}
        </div>
      </aside>
      <div className="flex min-h-0 min-w-0 flex-1 flex-col md:flex-row">
        <ul className="max-h-48 overflow-y-auto border-b border-border md:max-h-none md:w-56 md:border-b-0 md:border-s">
          {visible.length === 0 ? (
            <li className="px-4 py-6 text-sm text-fg-muted">این پوشه خالی است.</li>
          ) : (
            visible.map((n) => (
              <li key={n.id}>
                <button
                  type="button"
                  onClick={() => open(n)}
                  className={cn(
                    "flex w-full flex-col gap-0.5 px-4 py-3 text-right text-sm hover:bg-surface",
                    active?.id === n.id && "bg-cream text-ink",
                  )}
                >
                  <span className="truncate font-medium">{n.title}</span>
                  <span className={cn("text-xs", active?.id === n.id ? "text-ink/60" : "text-fg-subtle")}>
                    {FOLDERS.find((f) => f.id === n.folder)?.label}
                  </span>
                </button>
              </li>
            ))
          )}
        </ul>
        <div className="flex min-h-0 flex-1 flex-col gap-3 p-4">
          {active ? (
            <>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} />
              <Textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                className="min-h-40 flex-1 font-body"
              />
              <div className="flex gap-2">
                <Button onClick={persist}>ذخیره</Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    deleteNote(active.id);
                    setActive(null);
                    refresh();
                  }}
                >
                  <Trash2 className="size-4" />
                  حذف
                </Button>
              </div>
            </>
          ) : (
            <div className="flex flex-1 flex-col items-start justify-center gap-3 text-sm text-fg-muted">
              <p>یادداشتی انتخاب نشده.</p>
              <Button variant="outline" onClick={create}>
                ساخت یادداشت
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function FolderBtn({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "h-9 shrink-0 rounded-md px-3 text-xs transition-colors",
        active ? "bg-cream text-ink" : "text-fg-muted hover:bg-surface hover:text-fg",
      )}
    >
      {label}
    </button>
  );
}
