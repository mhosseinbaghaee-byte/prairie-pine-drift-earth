import { useEffect, useRef, useState } from "react";
import {
  Bookmark,
  BookOpen,
  Brain,
  GraduationCap,
  Languages,
  MessageCircle,
  Volume2,
  VolumeX,
} from "lucide-react";
import { toast } from "sonner";
import { askPouya, speakPouya, type ChatMode } from "@/lib/ai";
import { localTutorReply } from "@/lib/library";
import {
  LEVELS,
  langById,
  localeForLangCode,
  type LangCode,
  type Level,
} from "@/lib/topics";
import {
  saveNote,
  titleFromBody,
  type FolderId,
} from "@/lib/vault";
import { cn } from "@/lib/utils";
import { PouyaStage, type StageMood } from "./pouya-stage";
import { CoachesPane } from "./coaches-pane";
import { AccountPane } from "./account-pane";
import { loadProfile } from "@/lib/profile";
import type { Assistant } from "@/lib/assistants";
import { ChatPane, LivePane, QuizPane, VaultPane } from "./pouya-panes";

type Tab = "chat" | "live" | "quiz" | "vault" | "coaches" | "account";
type ChatMsg = { role: "user" | "assistant"; content: string };

type BrowserSpeechRecognition = {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  onresult: ((ev: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
  start: () => void;
  stop: () => void;
};

type SpeechRecognitionCtor = new () => BrowserSpeechRecognition;

function getSpeechRecognition(): SpeechRecognitionCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as Window & {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  };
  return w.SpeechRecognition || w.webkitSpeechRecognition || null;
}

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

export function PouyaMainApp() {
  const [tab, setTab] = useState<Tab>("chat");
  const [level, setLevel] = useState<Level>("teen");
  const [voiceOn, setVoiceOn] = useState(true);
  const [mood, setMood] = useState<StageMood>("idle");
  const [mode, setMode] = useState<ChatMode>("chat");
  const [lang, setLang] = useState<LangCode>("en");
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [typed, setTyped] = useState("");
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const voiceActiveRef = useRef(false);
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const recRef = useRef<BrowserSpeechRecognition | null>(null);
  const [listening, setListening] = useState(false);
  const [assistantId, setAssistantId] = useState<string | undefined>(() => {
    if (typeof window === "undefined") return undefined;
    const pref = loadProfile().preferredAssistantId;
    return pref || undefined;
  });
  const [typingFocus, setTypingFocus] = useState(false);
  const [introDone, setIntroDone] = useState(() => {
    if (typeof window === "undefined") return false;
    return sessionStorage.getItem(INTRO_KEY) === "1";
  });

  useEffect(() => {
    scrollerRef.current?.scrollTo({ top: scrollerRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, typed, busy, tab]);

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
          assistantId,
        },
      });
      const reply =
        res && typeof res === "object" && "ok" in res && res.ok && "text" in res && typeof res.text === "string"
          ? res.text
          : localTutorReply({ messages: history.slice(-12), mode: nextMode, lang: useLang });
      setMood("talk");
      void playVoice(reply);
      setMessages([...history, { role: "assistant", content: reply }]);
      setTyped("");
      if (!voiceActiveRef.current) setMood("idle");
    } catch {
      const reply = localTutorReply({ messages: history.slice(-12), mode: nextMode, lang: useLang });
      setMood("talk");
      void playVoice(reply);
      setMessages([...history, { role: "assistant", content: reply }]);
      setTyped("");
      if (!voiceActiveRef.current) setMood("idle");
    } finally {
      setBusy(false);
    }
  }

  function newChat() {
    stopMic();
    audioRef.current?.pause();
    voiceActiveRef.current = false;
    setMessages([]);
    setTyped("");
    setMode(tab === "live" ? "live" : "chat");
    setMood("idle");
  }

  function stopMic() {
    try {
      recRef.current?.stop();
    } catch {
      /* ignore */
    }
    recRef.current = null;
    setListening(false);
  }

  function toggleMic(forMode: ChatMode = mode) {
    const SR = getSpeechRecognition();
    if (!SR) {
      toast.error("برای میکروفون از Chrome یا Edge استفاده کن.");
      return;
    }
    if (listening) {
      stopMic();
      setMood("idle");
      return;
    }
    if (busy) return;
    const rec = new SR();
    const locale = forMode === "live" ? localeForLangCode(lang) : "fa-IR";
    rec.lang = locale;
    rec.interimResults = false;
    rec.continuous = false;
    rec.onresult = (ev) => {
      const said = (ev.results[0]?.[0]?.transcript || "").trim();
      if (said) {
        const nextMode: ChatMode = forMode === "live" ? "live" : "chat";
        void send(said, nextMode);
      }
    };
    rec.onend = () => {
      setListening(false);
      recRef.current = null;
      if (!busy && !voiceActiveRef.current) setMood("idle");
    };
    rec.onerror = () => {
      setListening(false);
      recRef.current = null;
      setMood("idle");
    };
    recRef.current = rec;
    setListening(true);
    setMood("listen");
    try {
      window.speechSynthesis?.cancel();
      audioRef.current?.pause();
      rec.start();
    } catch {
      toast.error("میکروفون شروع نشد. دسترسی را چک کن.");
      stopMic();
      setMood("idle");
    }
  }

  useEffect(() => {
    return () => {
      try {
        recRef.current?.stop();
      } catch {
        /* ignore */
      }
    };
  }, []);

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

  const redShell = tab === "chat" || tab === "live";

  function finishIntro() {
    sessionStorage.setItem(INTRO_KEY, "1");
    setIntroDone(true);
  }

  if (!introDone) {
    return (
      <button
        type="button"
        className="relative flex min-h-dvh w-full items-center justify-center bg-stage"
        onClick={finishIntro}
        aria-label="ورود به پویا"
      >
        <div className="relative aspect-[9/16] h-[min(100dvh,100svh)] w-auto max-w-[100vw] overflow-hidden bg-stage sm:h-auto sm:max-h-[min(100dvh,920px)] sm:w-full sm:max-w-[min(100vw,calc(100dvh*9/16))]">
          <PouyaStage
            mood="intro"
            caption={"سلام من پویا هستم\nمربی زنده دانش و زبان"}
            immersive
            showCaption
          />
          <p className="pointer-events-none absolute inset-x-0 bottom-[6%] text-center text-xs text-cream/80 drop-shadow">
            برای ادامه لمس کن
          </p>
        </div>
      </button>
    );
  }

  return (
    <div
      className={cn(
        "flex min-h-dvh flex-col text-fg",
        redShell ? "bg-stage" : "bg-background",
      )}
      dir="rtl"
    >
      <header
        className={cn(
          "flex shrink-0 flex-col gap-2 px-3 pt-[max(0.65rem,env(safe-area-inset-top))] pb-2 sm:px-4",
          redShell
            ? "border-b border-white/10 bg-stage-deep/30 backdrop-blur-md"
            : "border-b border-border bg-card/80 backdrop-blur-md",
        )}
      >
        <nav
          className={cn(
            "pouya-glass-nav w-full justify-between",
            redShell && "pouya-glass-nav-on-red",
          )}
          aria-label="بخش‌ها"
        >
          {(
            [
              ["chat", "گفتگو", MessageCircle],
              ["live", "زبان", Languages],
              ["coaches", "مربی‌ها", BookOpen],
              ["quiz", "آزمون", GraduationCap],
              ["vault", "مغز دوم", Brain],
              ["account", "حساب", Bookmark],
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
              className={cn("pouya-glass-tab shrink-0", tab === id && "pouya-glass-tab-active")}
              aria-current={tab === id ? "page" : undefined}
              title={label}
            >
              <Icon className="size-4 shrink-0" strokeWidth={tab === id ? 2 : 1.75} />
              <span className="sr-only">{label}</span>
            </button>
          ))}
        </nav>

        {redShell ? (
          <div className="flex items-center gap-2">
            <div className="flex rounded-full border border-white/25 bg-white/15 p-0.5 backdrop-blur-md">
              {LEVELS.map((l) => (
                <button
                  key={l.id}
                  type="button"
                  title={l.hint}
                  onClick={() => setLevel(l.id)}
                  className={cn(
                    "h-8 min-h-8 rounded-full px-3 text-xs transition",
                    level === l.id ? "bg-white text-ink" : "text-cream/85 hover:text-cream",
                  )}
                >
                  {l.label}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setVoiceOn(!voiceOn)}
              className="inline-flex size-9 items-center justify-center rounded-full text-cream hover:bg-white/15"
              aria-pressed={voiceOn}
              aria-label={voiceOn ? "قطع صدا" : "روشن کردن صدا"}
            >
              {voiceOn ? <Volume2 className="size-4" /> : <VolumeX className="size-4" />}
            </button>
          </div>
        ) : null}
      </header>

      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
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
            listening={listening}
            scrollerRef={scrollerRef}
            onSend={(t) => void send(t)}
            onLesson={(t) => void send(t, "lesson")}
            onDaily={() => void send("مرور روزانه را شروع کن. از من سؤال بپرس.", "daily")}
            onFact={() => void askFact(level, send)}
            onMic={() => toggleMic("chat")}
            onLivePractice={() => {
              setTab("live");
              setMode("live");
            }}
            onNew={newChat}
            onSave={() => saveLast()}
            onTypingFocus={setTypingFocus}
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
            listening={listening}
            scrollerRef={scrollerRef}
            onSend={(t) => void send(t, "live")}
            onScenario={startScenario}
            onMic={() => toggleMic("live")}
            onNew={newChat}
            onSave={() => saveLast()}
            onTypingFocus={setTypingFocus}
          />
        ) : null}

        {tab === "quiz" ? (
          <div className="min-h-0 flex-1 overflow-y-auto bg-background">
            <QuizPane level={level} setMood={setMood} />
          </div>
        ) : null}
        {tab === "vault" ? (
          <div className="min-h-0 flex-1 overflow-y-auto bg-background">
            <VaultPane />
          </div>
        ) : null}
        {tab === "coaches" ? (
          <div className="min-h-0 flex-1 overflow-y-auto bg-background">
            <CoachesPane
              activeId={assistantId}
              onSelect={(a: Assistant) => setAssistantId(a.id)}
              onStart={(a: Assistant) => {
                setAssistantId(a.id);
                setTab("chat");
                setMode("chat");
                void send(a.starter, "lesson");
              }}
            />
          </div>
        ) : null}
        {tab === "account" ? (
          <div className="min-h-0 flex-1 overflow-y-auto bg-background">
            <AccountPane />
          </div>
        ) : null}
      </div>
    </div>
  );
}

async function askFact(level: Level, send: (t: string, m?: ChatMode) => Promise<void>) {
  await send("یک دانستی امروز غافلگیرکننده برایم بگو.", "chat");
  void level;
}
