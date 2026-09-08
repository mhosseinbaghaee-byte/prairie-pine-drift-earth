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
import { PouyaVoiceCall, type VoicePhase } from "./pouya-voice-call";

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
  if (clean.length <= 900) return clean;
  const cut = clean.slice(0, 900);
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
  const messagesRef = useRef<ChatMsg[]>([]);
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
  const [voiceCall, setVoiceCall] = useState(false);
  const [callMuted, setCallMuted] = useState(false);
  const [voicePhase, setVoicePhase] = useState<VoicePhase>("idle");
  const voiceCallRef = useRef(false);
  const callMutedRef = useRef(false);
  const busyRef = useRef(false);

  useEffect(() => {
    scrollerRef.current?.scrollTo({ top: scrollerRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, typed, busy, tab]);
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  async function playVoice(text: string) {
    if (!voiceOn && !voiceCallRef.current) return;
    const spoken = spokenSlice(text);
    const finish = () => {
      voiceActiveRef.current = false;
      setMood("idle");
      if (voiceCallRef.current) setVoicePhase(callMutedRef.current ? "idle" : "listen");
    };
    const hasFa = /[\u0600-\u06FF]/.test(spoken);
    const speakLang = hasFa ? "fa-IR" : langById(lang).locale;
    try {
      const res = await speakPouya({ data: { text: spoken, lang: speakLang } });
      if (res && typeof res === "object" && "ok" in res && res.ok && "audio" in res && res.audio) {
        audioRef.current?.pause();
        window.speechSynthesis?.cancel();
        const url = `data:${(res as { mime?: string }).mime || "audio/mpeg"};base64,${res.audio}`;
        const audio = new Audio(url);
        audioRef.current = audio;
        voiceActiveRef.current = true;
        setMood("talk");
        if (voiceCallRef.current) setVoicePhase("talk");
        await new Promise<void>((resolve) => {
          audio.onended = () => { finish(); resolve(); };
          audio.onerror = () => { finish(); resolve(); };
          void audio.play().catch(() => { finish(); resolve(); });
        });
        return;
      }
    } catch {
      voiceActiveRef.current = false;
    }
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(spoken);
    utter.lang = speakLang;
    utter.rate = 0.95;
    utter.pitch = 0.9;
    const voices = window.speechSynthesis.getVoices();
    const lang2 = speakLang.slice(0, 2).toLowerCase();
    const pool = voices.filter((v) => v.lang.toLowerCase().startsWith(lang2));
    const prefer =
      pool.find((v) => /male|mohammad|farid|davood|reza|hossein|nasser|dariush|hamid/i.test(v.name)) ||
      pool.find((v) => !/female|woman|girl|sara|nazanin|zira|samantha|victoria/i.test(v.name)) ||
      voices.find((v) => v.lang.toLowerCase().startsWith("fa")) ||
      pool[0];
    if (prefer) utter.voice = prefer;
    await new Promise<void>((resolve) => {
      utter.onend = () => { finish(); resolve(); };
      utter.onerror = () => { finish(); resolve(); };
      voiceActiveRef.current = true;
      setMood("talk");
      if (voiceCallRef.current) setVoicePhase("talk");
      window.speechSynthesis.speak(utter);
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
    busyRef.current = true;
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
      busyRef.current = false;
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
    try { recRef.current?.stop(); } catch { /* ignore */ }
    recRef.current = null;
    setListening(false);
  }

  function toggleMic(forMode: ChatMode = mode) {
    const SR = getSpeechRecognition();
    if (!SR) { toast.error("برای میکروفون از Chrome یا Edge استفاده کن."); return; }
    if (listening) { stopMic(); setMood("idle"); return; }
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

  function startCallListen() {
    if (!voiceCallRef.current || callMutedRef.current || busyRef.current) return;
    const SR = getSpeechRecognition();
    if (!SR) { toast.error("برای گفتگوی صوتی از Chrome یا Edge استفاده کن."); return; }
    stopMic();
    const rec = new SR();
    rec.lang = "fa-IR";
    rec.interimResults = false;
    rec.continuous = false;
    rec.onresult = (ev) => {
      const said = (ev.results[0]?.[0]?.transcript || "").trim();
      if (said) void sendVoice(said);
    };
    rec.onend = () => {
      setListening(false);
      recRef.current = null;
      if (voiceCallRef.current && !callMutedRef.current && !busyRef.current && !voiceActiveRef.current) {
        window.setTimeout(() => startCallListen(), 280);
      }
    };
    rec.onerror = () => {
      setListening(false);
      recRef.current = null;
      if (voiceCallRef.current) setVoicePhase("idle");
    };
    recRef.current = rec;
    setListening(true);
    setMood("listen");
    setVoicePhase("listen");
    try {
      window.speechSynthesis?.cancel();
      audioRef.current?.pause();
      rec.start();
    } catch {
      toast.error("میکروفون شروع نشد. دسترسی را چک کن.");
      stopMic();
      setVoicePhase("idle");
    }
  }

  async function sendVoice(text: string) {
    const content = text.trim();
    if (!content || busyRef.current) return;
    stopMic();
    setDraft("");
    const history: ChatMsg[] = [...messagesRef.current, { role: "user", content }];
    setMessages(history);
    setBusy(true);
    busyRef.current = true;
    setMood("think");
    setVoicePhase("think");
    audioRef.current?.pause();
    voiceActiveRef.current = false;
    try {
      const res = await askPouya({
        data: {
          messages: history.slice(-12),
          level,
          mode: "live",
          lang,
          assistantId,
        },
      });
      const reply =
        res && typeof res === "object" && "ok" in res && res.ok && "text" in res && typeof res.text === "string"
          ? res.text
          : localTutorReply({ messages: history.slice(-12), mode: "live", lang });
      setMessages([...history, { role: "assistant", content: reply }]);
      setMood("talk");
      setVoicePhase("talk");
      await playVoice(reply);
    } catch {
      const reply = localTutorReply({ messages: history.slice(-12), mode: "live", lang });
      setMessages([...history, { role: "assistant", content: reply }]);
      await playVoice(reply);
    } finally {
      setBusy(false);
      busyRef.current = false;
      if (voiceCallRef.current && !callMutedRef.current) startCallListen();
      else if (voiceCallRef.current) setVoicePhase("idle");
    }
  }

  async function openVoiceCall() {
    stopMic();
    setVoiceOn(true);
    voiceCallRef.current = true;
    callMutedRef.current = false;
    setCallMuted(false);
    setVoiceCall(true);
    setVoicePhase("talk");
    const greeting = "سلام، من پویا هستم. هر چیزی که تو ذهنت هست بگو تا کمکت کنم.";
    if (!messagesRef.current.length) {
      setMessages([{ role: "assistant", content: greeting }]);
      await playVoice(greeting);
    }
    if (voiceCallRef.current && !callMutedRef.current) startCallListen();
  }

  function closeVoiceCall() {
    voiceCallRef.current = false;
    callMutedRef.current = false;
    stopMic();
    audioRef.current?.pause();
    window.speechSynthesis?.cancel();
    voiceActiveRef.current = false;
    setVoiceCall(false);
    setCallMuted(false);
    setVoicePhase("idle");
    setMood("idle");
  }

  function toggleCallMute() {
    const next = !callMutedRef.current;
    callMutedRef.current = next;
    setCallMuted(next);
    if (next) {
      stopMic();
      audioRef.current?.pause();
      window.speechSynthesis?.cancel();
      setVoicePhase("idle");
    } else {
      startCallListen();
    }
  }

  useEffect(() => {
    return () => {
      try { recRef.current?.stop(); } catch { /* ignore */ }
    };
  }, []);

  function saveLast(folder: FolderId = "knowledge") {
    const last = [...messages].reverse().find((m) => m.role === "assistant");
    if (!last) { toast.error("هنوز پاسخی برای ذخیره نیست."); return; }
    saveNote({ folder, title: titleFromBody(last.content), body: last.content, source: "chat" });
    toast.success("در مغز دوم ذخیره شد.");
  }

  function startScenario(prompt: string) {
    void send(prompt, "live", lang);
  }

  function openLivePractice() {
    setMode("live");
    setTab("live");
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
        "flex min-h-dvh w-full min-w-0 flex-col overflow-x-hidden text-fg",
        redShell ? "bg-stage" : "bg-background",
      )}
      dir="rtl"
    >
      <header
        className={cn(
          "flex w-full shrink-0 flex-col gap-2 px-3 pt-[max(0.55rem,env(safe-area-inset-top))] pb-2 sm:px-4",
          redShell
            ? "border-b border-white/10 bg-stage-deep/30 backdrop-blur-md"
            : "border-b border-border bg-card/80 backdrop-blur-md",
        )}
      >
        <nav className={cn("pouya-glass-nav w-full min-w-0", redShell && "pouya-glass-nav-on-red")} aria-label="بخش‌ها">
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
              className={cn("pouya-glass-tab", tab === id && "pouya-glass-tab-active")}
              aria-current={tab === id ? "page" : undefined}
              title={label}
            >
              <Icon className="size-4 shrink-0" strokeWidth={tab === id ? 2 : 1.75} />
              <span className="sr-only">{label}</span>
            </button>
          ))}
        </nav>

        {redShell ? (
          <div className="flex w-full min-w-0 items-center gap-2">
            <div className="flex min-w-0 flex-1 rounded-full border border-white/25 bg-white/15 p-0.5 backdrop-blur-md">
              {LEVELS.map((l) => (
                <button
                  key={l.id}
                  type="button"
                  title={l.hint}
                  onClick={() => setLevel(l.id)}
                  className={cn(
                    "h-8 min-h-8 min-w-0 flex-1 rounded-full px-2 text-xs transition",
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
              className="inline-flex size-9 shrink-0 items-center justify-center rounded-full text-cream hover:bg-white/15"
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
            onFact={() => void send("یک دانستی امروز غافلگیرکننده برایم بگو.", "chat")}
            onLivePractice={openLivePractice}
            onMic={() => toggleMic("chat")}
            onVoiceCall={() => void openVoiceCall()}
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
            listening={listening}
            scrollerRef={scrollerRef}
            onSend={(t) => void send(t, "live")}
            onScenario={startScenario}
            onMic={() => toggleMic("live")}
            onNew={newChat}
            onSave={() => saveLast()}
          />
        ) : null}

        {tab === "quiz" ? <QuizPane level={level} /> : null}
        {tab === "vault" ? <VaultPane /> : null}
        {tab === "coaches" ? (
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
        ) : null}
        {tab === "account" ? <AccountPane /> : null}
      </div>

      {voiceCall ? (
        <PouyaVoiceCall
          phase={voicePhase}
          muted={callMuted}
          lastUser={[...messages].reverse().find((m) => m.role === "user")?.content}
          lastAssistant={[...messages].reverse().find((m) => m.role === "assistant")?.content}
          draft={draft}
          setDraft={setDraft}
          onClose={closeVoiceCall}
          onToggleMute={toggleCallMute}
          onSend={(t) => void sendVoice(t)}
        />
      ) : null}
    </div>
  );
}
