import { useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { makeQuiz, type QuizPayload } from "@/lib/ai";
import { localQuiz } from "@/lib/library";
import type { QuizQuestion } from "@/lib/library-data";
import { QUIZ_TOPICS, type Level } from "@/lib/topics";
import {
  deleteNote, FOLDERS, listNotes, saveNote, type FolderId, type Note,
} from "@/lib/vault";
import {
  buildStudyPlan,
  deleteCustomQuiz,
  listCustomQuizzes,
  saveCustomQuiz,
  type CustomQuiz,
} from "@/lib/custom-quiz";
import { cn } from "@/lib/utils";
import { Button } from "./ui/button";
import { Input, Textarea } from "./ui/input";
import type { StageMood } from "./pouya-stage";

type QuizHome = "play" | "build" | "plan";

export function QuizPane({ level, setMood }: { level: Level; setMood: (m: StageMood) => void }) {
  const [home, setHome] = useState<QuizHome>("play");
  const [topic, setTopic] = useState(QUIZ_TOPICS[0]);
  const [custom, setCustom] = useState("");
  const [quiz, setQuiz] = useState<QuizPayload | null>(null);
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState<CustomQuiz[]>(() => listCustomQuizzes());

  // builder state
  const [bq, setBq] = useState("");
  const [opts, setOpts] = useState(["", "", "", ""]);
  const [correct, setCorrect] = useState(0);
  const [why, setWhy] = useState("");
  const [buildTopic, setBuildTopic] = useState("آزمون من");
  const [draftQs, setDraftQs] = useState<QuizQuestion[]>([]);

  // plan
  const [planSubject, setPlanSubject] = useState("زیست");
  const [planLines, setPlanLines] = useState<string[]>([]);

  async function start(payload?: QuizPayload) {
    setLoading(true);
    setMood("think");
    setQuiz(null);
    setIndex(0);
    setPicked(null);
    setScore(0);
    setDone(false);
    try {
      if (payload) {
        setQuiz(payload);
      } else {
        const res = await makeQuiz({ data: { topic: custom.trim() || topic, level } });
        const nextQuiz =
          res && typeof res === "object" && "ok" in res && res.ok && "quiz" in res && res.quiz
            ? res.quiz
            : localQuiz(custom.trim() || topic);
        setQuiz(nextQuiz);
      }
      setMood("talk");
      window.setTimeout(() => setMood("idle"), 1800);
    } catch {
      setQuiz(payload || localQuiz(custom.trim() || topic));
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

  function addDraftQuestion() {
    if (!bq.trim() || opts.some((o) => !o.trim())) {
      toast.error("سؤال و هر چهار گزینه لازم است.");
      return;
    }
    const q: QuizQuestion = {
      q: bq.trim(),
      options: [opts[0].trim(), opts[1].trim(), opts[2].trim(), opts[3].trim()],
      correct,
      why: why.trim() || "—",
    };
    setDraftQs((xs) => [...xs, q]);
    setBq("");
    setOpts(["", "", "", ""]);
    setCorrect(0);
    setWhy("");
    toast.success("سؤال اضافه شد.");
  }

  function persistCustom() {
    if (draftQs.length < 1) {
      toast.error("حداقل یک سؤال لازم است.");
      return;
    }
    const item = saveCustomQuiz({ topic: buildTopic, questions: draftQs });
    if (!item) return;
    setSaved(listCustomQuizzes());
    setDraftQs([]);
    toast.success("آزمون ذخیره شد.");
  }

  if (quiz) {
    if (done) {
      return (
        <div className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-4 px-4 py-6">
          <h2 className="font-display text-2xl font-medium">نتیجه</h2>
          <p className="text-lg">
            {score} از {quiz.questions.length}
          </p>
          <Button
            onClick={() => {
              setQuiz(null);
              setDone(false);
            }}
          >
            آزمون جدید
          </Button>
        </div>
      );
    }
    const q = quiz.questions[index];
    return (
      <div className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-4 px-4 py-6">
        <p className="text-xs text-fg-muted">
          سؤال {index + 1} از {quiz.questions.length}
        </p>
        <h2 className="font-display text-xl font-medium text-balance">{q.q}</h2>
        <div className="flex flex-col gap-2">
          {q.options.map((opt, i) => {
            const show = picked !== null;
            const isCorrect = i === q.correct;
            const selected = i === picked;
            return (
              <button
                key={i}
                type="button"
                onClick={() => choose(i)}
                disabled={picked !== null}
                className={cn(
                  "rounded-xl border px-4 py-3 text-right text-sm transition-colors",
                  show && isCorrect && "border-stage bg-cream text-ink",
                  show && selected && !isCorrect && "border-border bg-surface text-fg-muted line-through",
                  !show && "border-border bg-card hover:border-stage/40",
                )}
              >
                {opt}
              </button>
            );
          })}
        </div>
        {picked !== null ? (
          <div className="flex flex-col gap-3">
            <p className="text-pretty text-sm text-fg-muted">{q.why}</p>
            <Button onClick={next}>{index + 1 >= quiz.questions.length ? "نتیجه" : "سؤال بعد"}</Button>
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-4 overflow-y-auto px-4 py-6 sm:px-5">
      <div>
        <h2 className="font-display text-2xl font-medium">آزمون و برنامه</h2>
        <p className="mt-2 text-sm text-fg-muted">آزمون آماده، سازنده محلی، یا برنامه ۷روزه.</p>
      </div>

      <div className="flex gap-1 rounded-lg bg-surface p-1">
        {(
          [
            ["play", "آزمون"],
            ["build", "سازنده"],
            ["plan", "برنامه"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setHome(id)}
            className={cn(
              "h-9 flex-1 rounded-md text-sm",
              home === id ? "bg-cream text-ink" : "text-fg-muted",
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {home === "play" ? (
        <>
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
                  !custom && topic === t ? "border-stage bg-cream text-ink" : "border-border bg-card",
                )}
              >
                {t}
              </button>
            ))}
          </div>
          <Input value={custom} onChange={(e) => setCustom(e.target.value)} placeholder="موضوع دلخواه…" />
          <Button onClick={() => void start()} disabled={loading}>
            {loading ? "در حال ساخت…" : "شروع آزمون"}
          </Button>
          {saved.length > 0 ? (
            <div className="mt-2 flex flex-col gap-2">
              <p className="text-sm text-fg-muted">آزمون‌های ذخیره‌شده</p>
              {saved.map((s) => (
                <div key={s.id} className="flex items-center gap-2">
                  <Button className="flex-1" variant="outline" onClick={() => void start(s)}>
                    {s.topic} ({s.questions.length})
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      deleteCustomQuiz(s.id);
                      setSaved(listCustomQuizzes());
                    }}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              ))}
            </div>
          ) : null}
        </>
      ) : null}

      {home === "build" ? (
        <div className="flex flex-col gap-3">
          <Input value={buildTopic} onChange={(e) => setBuildTopic(e.target.value)} placeholder="عنوان آزمون" />
          <Textarea value={bq} onChange={(e) => setBq(e.target.value)} placeholder="متن سؤال" className="min-h-20" />
          {opts.map((o, i) => (
            <Input
              key={i}
              value={o}
              onChange={(e) => setOpts((xs) => xs.map((x, j) => (j === i ? e.target.value : x)))}
              placeholder={`گزینه ${i + 1}`}
            />
          ))}
          <label className="text-sm text-fg-muted">
            گزینه درست:{" "}
            <select
              className="ms-2 rounded-md border border-border bg-card px-2 py-1"
              value={correct}
              onChange={(e) => setCorrect(Number(e.target.value))}
            >
              {[0, 1, 2, 3].map((n) => (
                <option key={n} value={n}>
                  {n + 1}
                </option>
              ))}
            </select>
          </label>
          <Input value={why} onChange={(e) => setWhy(e.target.value)} placeholder="توضیح پاسخ (اختیاری)" />
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={addDraftQuestion}>
              افزودن سؤال
            </Button>
            <Button type="button" onClick={persistCustom}>
              ذخیره آزمون ({draftQs.length})
            </Button>
          </div>
        </div>
      ) : null}

      {home === "plan" ? (
        <div className="flex flex-col gap-3">
          <Input value={planSubject} onChange={(e) => setPlanSubject(e.target.value)} placeholder="مثلاً زیست یازدهم" />
          <Button
            type="button"
            onClick={() => {
              setPlanLines(buildStudyPlan(planSubject));
              toast.success("برنامه ساخته شد.");
            }}
          >
            ساخت برنامه ۷روزه
          </Button>
          {planLines.length > 0 ? (
            <ol className="list-decimal space-y-2 ps-5 text-sm text-fg-muted">
              {planLines.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ol>
          ) : null}
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
          <button
            key={f.id}
            type="button"
            onClick={() => {
              setFolder(f.id);
              setActive(null);
            }}
            className={cn(
              "h-9 shrink-0 rounded-md px-3 text-xs",
              folder === f.id ? "bg-cream text-ink" : "text-fg-muted hover:bg-surface",
            )}
          >
            {f.label}
          </button>
        ))}
        <div className="flex-1" />
        <Button size="sm" variant="outline" onClick={create}>
          <Plus className="size-4" /> جدید
        </Button>
      </div>
      <div className="flex min-h-0 flex-1 flex-col sm:flex-row">
        <ul className="max-h-48 shrink-0 overflow-y-auto border-b border-border sm:max-h-none sm:w-56 sm:border-b-0 sm:border-e">
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
                <Button
                  variant="outline"
                  onClick={() => {
                    deleteNote(active.id);
                    setActive(null);
                    refresh();
                  }}
                >
                  <Trash2 className="size-4" /> حذف
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
