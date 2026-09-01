import { useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { makeQuiz, type QuizPayload } from "@/lib/ai";
import { localQuiz } from "@/lib/library";
import { QUIZ_TOPICS, type Level } from "@/lib/topics";
import {
  deleteNote, FOLDERS, listNotes, saveNote, type FolderId, type Note,
} from "@/lib/vault";
import { cn } from "@/lib/utils";
import { Button } from "./ui/button";
import { Input, Textarea } from "./ui/input";
import type { StageMood } from "./pouya-stage";

export function QuizPane({ level, setMood }: { level: Level; setMood: (m: StageMood) => void }) {
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
      return;
    }
    setIndex((x) => x + 1);
    setPicked(null);
  }

  if (!quiz) {
    return (
      <div className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-5 px-4 py-6 sm:px-5">
        <div>
          <h2 className="font-display text-2xl font-medium">آزمون کوتاه</h2>
          <p className="mt-2 text-sm text-fg-muted">موضوع را انتخاب کن یا خودت بنویس.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {QUIZ_TOPICS.map((t) => (
            <button key={t} type="button" onClick={() => { setTopic(t); setCustom(""); }}
              className={cn("h-10 rounded-full border px-3.5 text-sm", !custom && topic === t ? "border-stage bg-cream text-ink" : "border-border bg-card")}>
              {t}
            </button>
          ))}
        </div>
        <Input value={custom} onChange={(e) => setCustom(e.target.value)} placeholder="موضوع دلخواه…" />
        <Button onClick={() => void start()} disabled={loading}>{loading ? "در حال ساخت…" : "شروع آزمون"}</Button>
      </div>
    );
  }

  if (done) {
    return (
      <div className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-4 px-4 py-6">
        <h2 className="font-display text-2xl font-medium">نتیجه</h2>
        <p className="text-lg">{score} از {quiz.questions.length}</p>
        <Button onClick={() => { setQuiz(null); setDone(false); }}>آزمون جدید</Button>
      </div>
    );
  }

  const q = quiz.questions[index];
  return (
    <div className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-4 px-4 py-6">
      <p className="text-xs text-fg-muted">سؤال {index + 1} از {quiz.questions.length}</p>
      <h2 className="font-display text-xl font-medium text-balance">{q.q}</h2>
      <div className="flex flex-col gap-2">
        {q.options.map((opt, i) => {
          const show = picked !== null;
          const correct = i === q.correct;
          const selected = i === picked;
          return (
            <button key={i} type="button" onClick={() => choose(i)} disabled={picked !== null}
              className={cn("rounded-xl border px-4 py-3 text-right text-sm transition-colors",
                show && correct && "border-stage bg-cream text-ink",
                show && selected && !correct && "border-border bg-surface text-fg-muted line-through",
                !show && "border-border bg-card hover:border-stage/40")}>
              {opt}
            </button>
          );
        })}
      </div>
      {picked !== null ? (
        <div className="flex flex-col gap-3">
          <p className="text-sm text-fg-muted text-pretty">{q.why}</p>
          <Button onClick={next}>{index + 1 >= quiz.questions.length ? "نتیجه" : "سؤال بعد"}</Button>
        </div>
      ) : null}
    </div>
  );
}

export function VaultPane() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [folder, setFolder] = useState<FolderId>("inbox");
  const [active, setActive] = useState<Note | null>(null);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");

  function refresh() {
    setNotes(listNotes());
  }

  useEffect(() => {
    refresh();
  }, []);

  function open(n: Note) {
    setActive(n);
    setTitle(n.title);
    setBody(n.body);
    setFolder(n.folder);
  }

  function create() {
    const n = saveNote({ folder, title: "یادداشت جدید", body: "", source: "manual" });
    refresh();
    open(n);
  }

  function persist() {
    if (!active) return;
    saveNote({ id: active.id, folder, title, body, source: active.source });
    refresh();
    toast.success("ذخیره شد.");
  }

  const visible = notes.filter((n) => n.folder === folder);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex items-center gap-2 overflow-x-auto border-b border-border px-3 py-2">
        {FOLDERS.map((f) => (
          <button key={f.id} type="button" onClick={() => { setFolder(f.id); setActive(null); }}
            className={cn("h-9 shrink-0 rounded-md px-3 text-xs", folder === f.id ? "bg-cream text-ink" : "text-fg-muted hover:bg-surface")}>
            {f.label}
          </button>
        ))}
        <div className="flex-1" />
        <Button size="sm" variant="outline" onClick={create}><Plus className="size-4" /> جدید</Button>
      </div>
      <div className="flex min-h-0 flex-1 flex-col sm:flex-row">
        <ul className="max-h-48 shrink-0 overflow-y-auto border-b border-border sm:max-h-none sm:w-56 sm:border-b-0 sm:border-e">
          {visible.length === 0 ? (
            <li className="px-4 py-6 text-sm text-fg-muted">این پوشه خالی است.</li>
          ) : (
            visible.map((n) => (
              <li key={n.id}>
                <button type="button" onClick={() => open(n)}
                  className={cn("flex w-full flex-col gap-0.5 px-4 py-3 text-right text-sm hover:bg-surface", active?.id === n.id && "bg-cream text-ink")}>
                  <span className="truncate font-medium">{n.title}</span>
                </button>
              </li>
            ))
          )}
        </ul>
        <div className="flex min-h-0 flex-1 flex-col gap-3 p-4">
          {active ? (
            <>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} />
              <Textarea value={body} onChange={(e) => setBody(e.target.value)} className="min-h-40 flex-1" />
              <div className="flex gap-2">
                <Button onClick={persist}>ذخیره</Button>
                <Button variant="outline" onClick={() => { deleteNote(active.id); setActive(null); refresh(); }}>
                  <Trash2 className="size-4" /> حذف
                </Button>
              </div>
            </>
          ) : (
            <div className="flex flex-1 flex-col items-start justify-center gap-3 text-sm text-fg-muted">
              <p>یادداشتی انتخاب نشده.</p>
              <Button variant="outline" onClick={create}>ساخت یادداشت</Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
