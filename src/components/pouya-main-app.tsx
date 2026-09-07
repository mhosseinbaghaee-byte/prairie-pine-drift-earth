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
import { askPouya, speakPouya, type ChatMode } from "../lib/ai";
import { localTutorReply } from "../lib/library";
import { loadProfile } from "../lib/profile";
import { LANGUAGES, langById, type LangCode, type Level } from "../lib/topics";
import { cn } from "../lib/utils";
import { AccountPane } from "./account-pane";
import { CoachesPane } from "./coaches-pane";
import { PouyaFaceButton } from "./pouya-face-button";
import { PouyaQuizVault } from "./pouya-quiz-vault";
import { PouyaStage, type StageMood } from "./pouya-stage";
import { RichText } from "./rich-text";
import { Button } from "./ui/button";

type Tab = "chat" | "live" | "quiz" | "vault" | "coaches" | "account";
type ChatMsg = { role: "user" | "assistant"; content: string };

type BrowserSpeechRecognition = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((ev: { results: { [index: number]: { [index: number]: { transcript: string }; isFinal: boolean }; length: number } }) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
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
