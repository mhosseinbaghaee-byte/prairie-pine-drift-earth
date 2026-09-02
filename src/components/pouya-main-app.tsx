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
import { cn } from "@/lib/utils";
import {
  type ChatMsg,
  type ChatMode,
  type Level,
  LEVELS,
  askFact,
  createId,
  loadHistory,
  saveHistory,
  speakFa,
} from "@/lib/pouya-core";
import { ChatPane, LivePane } from "@/components/pouya-chat-live";
import { CoachesPane } from "@/components/coaches-pane";
import { AccountPane } from "@/components/account-pane";
import { PouyaStage } from "@/components/pouya-stage";

// NOTE: Full file will be sent - this is a truncated test
export default function PouyaMainApp() { return null; }
