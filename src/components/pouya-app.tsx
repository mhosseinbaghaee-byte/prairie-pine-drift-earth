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

type Tab = "chat" | "live" | "quiz" | "vault" | "coaches" | "account";
type ChatMsg = { role: "user" | "assistant"; content: string };

// TEMPORARY: file was corrupted; full restore continues in next commits if truncated
export function PouyaApp() {
  return (
    <div className="flex min-h-dvh flex-col bg-background text-fg" dir="rtl">
      <header className="flex items-center gap-2 border-b border-border px-3 py-2.5">
        <div className="min-w-0 flex-1">
          <p className="font-display text-base font-medium">پویا</p>
          <p className="text-xs text-fg-muted">در حال بازیابی… لطفاً چند ثانیه صبر کن</p>
        </div>
      </header>
      <div className="flex flex-1 flex-col">
        <AccountPane />
      </div>
    </div>
  );
}
