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
  // Keep enough text for full TTS (was 360 → mid-sentence cuts)
  if (clean.length <= 900) return clean;
  const cut = clean.slice(0, 900);
  const mark = Math.max(cut.lastIndexOf("."), cut.lastIndexOf("؟"), cut.lastIndexOf("!"), cut.lastIndexOf("?"));
  return mark > 80 ? cut.slice(0, mark + 1) : cut;
}
