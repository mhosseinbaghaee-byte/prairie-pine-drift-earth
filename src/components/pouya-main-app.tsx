import { useEffect, useRef, useState, type RefObject } from "react";
import {
  Bookmark,
  BookOpen,
  Brain,
  GraduationCap,
  Languages,
  MessageCircle,
  Mic,
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
  localeForLangCode,
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
import { CoachesPane } from "./coaches-pane";
import { AccountPane } from "./account-pane";
import { loadProfile } from "@/lib/profile";
import type { Assistant } from "@/lib/assistants";
import { RichText } from "./rich-text";
import { Button } from "./ui/button";
import { Input, Textarea } from "./ui/input";
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
    if (introDone) {
      setMood((m) => (m === "intro" ? "idle" : m));
      return;
    }
    setMood("intro");
    const t = window.setTimeout(() => {
      sessionStorage.setItem(INTRO_KEY, "1");
      setIntroDone(true);
      setMood("idle");
    }, 14000);
    return () => window.clearTimeout(t);
  }, [introDone]);

  useEffect(() => {
    scrollerRef.current?.scrollTo({ top: scrollerRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, typed, busy, tab]);

  const langLabel = LANGUAGES.find((l) => l.code === lang)?.label ?? "انگلیسی";
  const immersiveChat = (tab === "chat" || tab === "live") && introDone;
  const effectiveMood: StageMood = !introDone ? "intro" : "idle";

  const caption =
    mood === "intro"
      ? "سلام، من پویام."
      : mood === "listen" || listening
        ? "دارم گوش می‌دهم… بگو."
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

  return (
    <div className="relative flex min-h-dvh flex-col bg-stage text-fg" dir="ltr">
      {!introDone ? (
        <button
          type="button"
          className="absolute inset-0 z-40 flex items-center justify-center bg-stage"
          onClick={() => {
            sessionStorage.setItem(INTRO_KEY, "1");
            setIntroDone(true);
            setMood("idle");
          }}
          aria-label="ورود به پویا"
        >
          <div className="relative aspect-[9/16] h-[min(100dvh,100svh)] w-auto max-w-[100vw] overflow-hidden bg-stage sm:h-auto sm:max-h-[min(100dvh,920px)] sm:w-full sm:max-w-[min(100vw,calc(100dvh*9/16))]">
            <PouyaStage mood="intro" caption="سلام، من پویام." immersive showCaption />
            <p className="pointer-events-none absolute inset-x-0 bottom-[12%] text-center text-sm text-cream/85 drop-shadow">
              برای ادامه لمس کن
            </p>
          </div>
        </button>
      ) : null}

      {immersiveChat ? (
        <PouyaStage mood={effectiveMood} caption={caption} immersive showCaption={false} />
      ) : null}

      <div
        className={cn(
          "relative z-10 flex min-h-0 min-w-0 flex-1 flex-col",
          immersiveChat ? "bg-transparent" : "bg-background lg:flex-row",
        )}
        dir="rtl"
      >
        {!immersiveChat ? (
          <div className="relative lg:w-[42%] lg:shrink-0">
            <PouyaStage mood={effectiveMood} caption={caption} compact={tab !== "chat" && tab !== "live"} />
          </div>
        ) : null}

        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
          <header
            className={cn(
              "flex items-center gap-2 px-3 py-2.5 sm:px-5",
              immersiveChat
                ? "border-b border-white/10 bg-stage/20 backdrop-blur-md"
                : "border-b border-border bg-background",
            )}
          >
            <div className="min-w-0 flex-1">
              <p className={cn("font-display text-base font-medium tracking-tight", immersiveChat && "text-cream")}>
                پویا
              </p>
              <p className={cn("text-xs", immersiveChat ? "text-cream/70" : "text-fg-muted")}>
                مربی زنده دانش و زبان
              </p>
            </div>
            <nav className={cn("pouya-glass-nav", immersiveChat && "pouya-glass-nav-on-red")} aria-label="بخش‌ها">
              {(
                [
                  ["chat", "گفتگو", MessageCircle],
                  ["coaches", "مربی‌ها", BookOpen],
                  ["live", "زبان", Languages],
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
                  className={cn("pouya-glass-tab", tab === id && "pouya-glass-tab-active")}
                  aria-current={tab === id ? "page" : undefined}
                >
                  <Icon className="size-4 shrink-0" strokeWidth={tab === id ? 2 : 1.75} />
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
    </div>
  );
}

async function askFact(level: Level, send: (t: string, m?: ChatMode) => Promise<void>) {
  await send("یک دانستی امروز غافلگیرکننده برایم بگو.", "chat");
  void level;
}
