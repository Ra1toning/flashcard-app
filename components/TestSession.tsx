"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Check,
  Clock3,
  Flag,
  Keyboard,
  ListChecks,
  RotateCcw,
  X,
} from "lucide-react";
import { fetchJson } from "@/lib/http";
import DecorativeLayer from "@/components/ui/DecorativeLayer";
import ReportDialog from "@/components/ReportDialog";
import type { ReportReason } from "@/lib/report";

type TestMode = "typing" | "mcq" | "mixed";
type Direction = "front-to-back" | "back-to-front" | "mixed";
type Card = {
  id: string;
  front: string;
  back: string;
  easeFactor: number;
  interval: number;
  repetition: number;
  state: string;
  dueDate: string;
};
type Question = {
  card: Card;
  mode: "typing" | "mcq";
  direction: "front-to-back" | "back-to-front";
  prompt: string;
  answer: string;
  choices: string[];
};
type Result = {
  cardId: string;
  prompt: string;
  answer: string;
  userAnswer: string;
  correct: boolean;
  quality: number;
  timeTaken: number;
};

function shuffle<T>(items: T[]) {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index--) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
  }
  return copy;
}

function normalize(value: string) {
  return value.trim().toLocaleLowerCase().replace(/\s+/g, " ");
}

function distance(a: string, b: string) {
  const matrix = Array.from({ length: b.length + 1 }, (_, row) =>
    Array.from({ length: a.length + 1 }, (_, column) => row === 0 ? column : column === 0 ? row : 0)
  );
  for (let row = 1; row <= b.length; row++) {
    for (let column = 1; column <= a.length; column++) {
      matrix[row][column] = Math.min(
        matrix[row - 1][column] + 1,
        matrix[row][column - 1] + 1,
        matrix[row - 1][column - 1] + (a[column - 1] === b[row - 1] ? 0 : 1)
      );
    }
  }
  return matrix[b.length][a.length];
}

export default function TestSession({
  deckId,
  deckName,
  config,
  timeLimit,
  onComplete,
  onExit,
}: {
  deckId: string;
  deckName: string;
  config: { mode: TestMode; direction: Direction; cards: Card[] };
  timeLimit: number;
  onComplete: (results: { results: Result[]; totalTime: number; timeExpired: boolean }) => void;
  onExit: () => void;
}) {
  const queryClient = useQueryClient();
  const startedAt = useRef(Date.now());
  const questionStartedAt = useRef(Date.now());
  const finishing = useRef(false);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [index, setIndex] = useState(0);
  const [answer, setAnswer] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [correct, setCorrect] = useState(false);
  const [results, setResults] = useState<Result[]>([]);
  const [remaining, setRemaining] = useState(timeLimit);
  const [summary, setSummary] = useState(false);
  const [saveWarning, setSaveWarning] = useState("");
  const [savingResults, setSavingResults] = useState(false);
  const [resultFilter, setResultFilter] = useState<"all" | "correct" | "wrong">("all");
  const [reportedCards, setReportedCards] = useState<Set<string>>(new Set());
  const [reportCardId, setReportCardId] = useState<string | null>(null);
  const [reportError, setReportError] = useState("");
  const [toast, setToast] = useState("");

  function flashToast(message: string) {
    setToast(message);
    window.setTimeout(() => setToast(""), 3000);
  }

  const reportMutation = useMutation({
    mutationFn: ({ cardId, category, detail }: { cardId: string; category: ReportReason; detail: string }) => fetchJson<{ success: boolean }>(`/api/cards/${cardId}/report`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ category, detail }),
    }),
    onSuccess: (_data, variables) => {
      setReportedCards((current) => new Set(current).add(variables.cardId));
      setReportCardId(null);
      setReportError("");
      flashToast("Мэдэгдсэнд баярлалаа. Бид шалгаж үзье.");
    },
    onError: (error) => setReportError(error instanceof Error ? error.message : "Мэдээллийг илгээж чадсангүй."),
  });

  useEffect(() => {
    const generated = config.cards.map((card) => {
      const direction = config.direction === "mixed"
        ? (Math.random() > 0.5 ? "front-to-back" : "back-to-front")
        : config.direction;
      const canUseMcq = config.cards.length >= 4;
      let mode: "typing" | "mcq" = config.mode === "mixed"
        ? (canUseMcq && Math.random() > 0.5 ? "mcq" : "typing")
        : config.mode === "mcq" && !canUseMcq ? "typing" : config.mode;
      const prompt = direction === "front-to-back" ? card.front : card.back;
      const expected = direction === "front-to-back" ? card.back : card.front;

      let choices: string[] = [];
      if (mode === "mcq") {
        const seen = new Set<string>([normalize(expected)]);
        const distractors: string[] = [];
        for (const item of shuffle(config.cards)) {
          if (item.id === card.id) continue;
          const value = direction === "front-to-back" ? item.back : item.front;
          const key = normalize(value);
          if (seen.has(key)) continue;
          seen.add(key);
          distractors.push(value);
          if (distractors.length === 3) break;
        }
        if (distractors.length >= 2) {
          choices = shuffle([expected, ...distractors]);
        } else {
          mode = "typing";
        }
      }

      return { card, direction, mode, prompt, answer: expected, choices } as Question;
    });
    setQuestions(shuffle(generated));
  }, [config]);

  async function finish(finalResults: Result[], expired: boolean) {
    if (finishing.current) return;
    finishing.current = true;
    setSummary(true);
    setSavingResults(true);
    const totalTime = Date.now() - startedAt.current;
    if (finalResults.length > 0) {
      try {
        const updateResponses = await Promise.all(finalResults.map((result) =>
          fetch(`/api/cards/${result.cardId}/update-srs`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ correct: result.correct, quality: result.quality }),
          })
        ));
        if (updateResponses.some((response) => !response.ok)) {
          setSaveWarning("Зарим картын дараагийн давталтыг хадгалж чадсангүй.");
        }
        const correctCount = finalResults.filter((result) => result.correct).length;
        const sessionResponse = await fetch("/api/test/save-session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            deckId: deckId === "daily" ? null : deckId,
            sessionType: deckId === "daily" ? "daily" : "test",
            totalCards: finalResults.length,
            completed: finalResults.length,
            correct: correctCount,
            incorrect: finalResults.length - correctCount,
            score: Math.round((correctCount / finalResults.length) * 100),
            timeSpent: Math.floor(totalTime / 1000),
          }),
        });
        if (!sessionResponse.ok) {
          setSaveWarning("Хичээлийн дүнг хадгалж чадсангүй.");
        }
      } catch {
        setSaveWarning("Давталтын дүнг сүлжээнд хадгалж чадсангүй.");
      }
    }
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["daily-review"] }),
      queryClient.invalidateQueries({ queryKey: ["decks"] }),
      queryClient.invalidateQueries({ queryKey: ["user-stats"] }),
      deckId !== "daily" ? queryClient.invalidateQueries({ queryKey: ["deck", deckId] }) : Promise.resolve(),
    ]);
    setSavingResults(false);
    onComplete({ results: finalResults, totalTime, timeExpired: expired });
  }

  useEffect(() => {
    if (timeLimit <= 0 || summary) return;
    const timer = window.setInterval(() => {
      setRemaining((current) => {
        if (current <= 1) {
          window.clearInterval(timer);
          void finish(results, true);
          return 0;
        }
        return current - 1;
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [timeLimit, summary, results]);

  const current = questions[index];
  const progress = questions.length ? ((index + (submitted ? 1 : 0)) / questions.length) * 100 : 0;

  function submit() {
    if (!current || submitted || !answer.trim()) return;
    const userValue = normalize(answer);
    const expected = normalize(current.answer);
    const typoDistance = current.mode === "typing" ? distance(userValue, expected) : Number.POSITIVE_INFINITY;
    const isCorrect = userValue === expected || (expected.length > 4 && typoDistance <= 1);
    const result: Result = {
      cardId: current.card.id,
      prompt: current.prompt,
      answer: current.answer,
      userAnswer: answer,
      correct: isCorrect,
      quality: isCorrect ? (userValue === expected ? 5 : 4) : 1,
      timeTaken: Date.now() - questionStartedAt.current,
    };
    setCorrect(isCorrect);
    setSubmitted(true);
    setResults((currentResults) => [...currentResults, result]);
  }

  function advance() {
    const nextResults = results;
    if (index >= questions.length - 1) {
      void finish(nextResults, false);
      return;
    }
    setIndex((currentIndex) => currentIndex + 1);
    setAnswer("");
    setSubmitted(false);
    setCorrect(false);
    questionStartedAt.current = Date.now();
  }

  useEffect(() => {
    function handleKey(event: KeyboardEvent) {
      if (event.key !== "Enter" || summary) return;
      if (submitted) advance();
      else submit();
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  });

  const accuracy = useMemo(() => results.length
    ? Math.round((results.filter((result) => result.correct).length / results.length) * 100)
    : 0, [results]);
  const filteredResults = useMemo(() => {
    if (resultFilter === "all") return results;
    return results.filter((result) => resultFilter === "correct" ? result.correct : !result.correct);
  }, [results, resultFilter]);

  if (!current && !summary) {
    return <div className="app-shell app-content grid min-h-screen place-items-center"><div className="skeleton-pulse h-[380px] w-[min(92vw,720px)] rounded-2xl" /></div>;
  }

  if (summary) {
    return (
      <div className="app-shell app-content min-h-screen px-4 py-10">
        <DecorativeLayer variant="review" />
        <div className="relative z-10 mx-auto max-w-3xl">
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .2 }} className="flashcard-surface p-6 sm:p-8">
            <div className="eyebrow mb-3">Давталт дууссан</div>
            <h1 className="text-3xl font-bold tracking-tight">{results.length} картыг амжилттай давтлаа</h1>
            <p className="mt-2 text-sm text-slate-500">{deckName} · {accuracy}% зөв хариулт</p>
            {savingResults && <div className="mt-4 flex items-center gap-2 text-sm text-[#737580]"><span className="h-2 w-2 animate-pulse rounded-full bg-[#b7791f]" />Дүнг хадгалж байна...</div>}
            {saveWarning && (
              <div className="mt-5 rounded-lg border border-amber-300/20 bg-amber-300/8 px-4 py-3 text-sm text-amber-100">
                {saveWarning}
              </div>
            )}
            <div className="mt-7 grid grid-cols-3 gap-2">
              {([
                ["correct", "Зөв", results.filter((item) => item.correct).length],
                ["wrong", "Буруу", results.filter((item) => !item.correct).length],
                [null, "Оноо", `${accuracy}%`],
              ] as const).map(([key, label, value]) => {
                const clickable = key !== null;
                const active = clickable && resultFilter === key;
                return (
                  <button
                    key={label}
                    type="button"
                    disabled={!clickable}
                    onClick={() => key && setResultFilter((current) => current === key ? "all" : key)}
                    className={`metric-card w-full text-center transition ${clickable ? "hover:-translate-y-0.5" : "cursor-default"} ${active ? "ring-2 ring-[#b7791f]" : ""}`}
                  >
                    <div className="font-mono text-2xl font-semibold">{value}</div>
                    <div className="mt-1 text-xs text-slate-600">{label}</div>
                  </button>
                );
              })}
            </div>
            {resultFilter !== "all" && (
              <button onClick={() => setResultFilter("all")} className="mt-2 text-xs font-semibold text-[#84530f] underline underline-offset-2">
                Бүгдийг харах ({results.length})
              </button>
            )}

            <div className="mt-4 space-y-2">
              {filteredResults.length === 0 ? (
                <div className="rounded-lg border border-dashed border-[#d8dbe2] px-4 py-8 text-center text-sm text-slate-500">
                  {resultFilter === "wrong" ? "Алдаагүй! Бүх хариулт зөв байлаа." : "Харуулах үр дүн алга."}
                </div>
              ) : filteredResults.map((result) => (
                <div key={result.cardId} className="flex items-center justify-between gap-3 rounded-lg border border-[#e4e5e9] bg-[#fafafa] px-4 py-3">
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium">{result.prompt}</div>
                    {result.correct ? (
                      <div className="mt-1 truncate text-xs text-emerald-700">{result.answer}</div>
                    ) : (
                      <div className="mt-1 truncate text-xs">
                        <span className="text-rose-500">{result.userAnswer || "Хариулаагүй"}</span>
                        <span className="mx-1.5 text-slate-400">→</span>
                        <span className="text-emerald-700">{result.answer}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <button
                      type="button"
                      onClick={() => { setReportError(""); setReportCardId(result.cardId); }}
                      disabled={reportedCards.has(result.cardId)}
                      aria-label="Энэ картад алдаа байвал мэдэгд"
                      title={reportedCards.has(result.cardId) ? "Мэдэгдсэн" : "Энэ картад алдаа байвал мэдэгд"}
                      className={`transition ${reportedCards.has(result.cardId) ? "text-[#8bc7ad]" : "text-[#c3c6cf] hover:text-[#a84040]"}`}
                    >
                      <Flag className="h-3.5 w-3.5" />
                    </button>
                    {result.correct ? <Check className="h-4 w-4 text-emerald-400" /> : <X className="h-4 w-4 text-rose-300" />}
                  </div>
                </div>
              ))}
            </div>
            <button onClick={onExit} className="btn-primary mt-7 w-full justify-center px-4 py-3">Нүүр хуудас руу буцах</button>
          </motion.div>
        </div>

        <ReportDialog
          open={reportCardId !== null}
          onOpenChange={(open) => { if (!open) { setReportCardId(null); setReportError(""); } }}
          onSubmit={(payload) => reportCardId && reportMutation.mutate({ cardId: reportCardId, ...payload })}
          pending={reportMutation.isPending}
          error={reportError}
          title="Карт мэдэгдэх"
          subtitle="Энэ картын агуулгад алдаа байвал шалтгааныг сонгож мэдэгдээрэй."
        />

        <AnimatePresence>
          {toast && (
            <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 18 }}
              role="status" aria-live="polite"
              className="app-toast fixed bottom-5 left-4 right-4 z-[60] rounded-2xl border px-4 py-3.5 text-sm font-semibold shadow-2xl backdrop-blur-xl sm:left-auto sm:max-w-md">
              {toast}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <div className="app-shell app-content min-h-screen px-4 py-5 sm:py-8">
      <DecorativeLayer variant="review" />
      <div className="relative z-10 mx-auto max-w-3xl">
        <div className="mb-5 flex items-center gap-4">
          <button onClick={onExit} className="btn-ghost shrink-0 px-3 py-2 text-sm">Гарах</button>
          <div className="flex-1">
            <div className="mb-2 flex justify-between text-xs text-[#777985]">
              <span>{deckName} · {index + 1} / {questions.length}</span>
              <span className="flex items-center gap-1"><Clock3 className="h-3.5 w-3.5" />{Math.floor(remaining / 60)}:{String(remaining % 60).padStart(2, "0")}</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-[#e6dfd3]"><motion.div className="h-full rounded-full bg-[#b7791f]" animate={{ width: `${progress}%` }} transition={{ duration: .2 }} /></div>
          </div>
        </div>

        <AnimatePresence mode="wait">
        <motion.section
          key={index}
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -10 }}
          transition={{ duration: .18 }}
          className=""
        >
          <motion.div whileHover={{ y: -2 }} className="flashcard-surface overflow-hidden">
            <DecorativeLayer variant="flashcard" />
            <div className="flex items-center justify-between border-b border-[#e7e8ed] px-5 py-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#858895]">
              <span className="flex items-center gap-1.5">
                {current.mode === "typing" ? <Keyboard className="h-3.5 w-3.5" /> : <ListChecks className="h-3.5 w-3.5" />}
                {current.mode === "typing" ? "Хариултаа бичнэ үү" : "Зөв хариултаа сонгоно уу"}
              </span>
              <span className="tracking-normal text-[#a9adb8]">{index + 1} / {questions.length}</span>
            </div>
            <div className="grid min-h-[220px] place-items-center px-6 py-9 text-center">
              <div>
                <motion.h1 layout className="text-4xl font-bold tracking-[-.04em] sm:text-5xl">{current.prompt}</motion.h1>
                {current.mode === "typing" && submitted ? (
                  <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-6 border-t border-[#e6e7ec] pt-5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#9699a5]">Зөв хариулт</span>
                    <div className="mt-1.5 text-2xl font-bold text-[#238769]">{current.answer}</div>
                  </motion.div>
                ) : !submitted ? (
                  <p className="mt-4 text-sm text-[#858895]">{current.mode === "typing" ? "Санаж байгаагаа бичнэ үү" : "Доороос зөв хариултыг сонгоно уу"}</p>
                ) : null}
              </div>
            </div>
          </motion.div>

          {current.mode === "typing" ? (
            <div className="relative mt-4">
              <input autoFocus disabled={submitted} value={answer} onChange={(event) => setAnswer(event.target.value)}
                className={`field py-3.5 text-center text-lg ${submitted ? correct ? "border-[#8bc7ad] bg-[#eff9f4] text-[#17694f]" : "border-[#e0aaaa] bg-[#fff2f0] text-[#a84040]" : ""}`}
                placeholder="Хариултаа бичнэ үү" />
            </div>
          ) : (
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              {current.choices.map((choice, choiceIndex) => {
                const isAnswer = choice === current.answer;
                const isPicked = answer === choice;
                const stateClass = !submitted
                  ? (isPicked
                    ? "border-[#d4a451] bg-[#fff3d2] shadow-[0_8px_20px_rgba(183,121,31,.1)]"
                    : "border-[#ded7ca] bg-white/80 hover:-translate-y-0.5 hover:border-[#c8baa3] hover:bg-white")
                  : isAnswer
                    ? "border-[#8bc7ad] bg-[#eff9f4] text-[#17694f]"
                    : isPicked
                      ? "border-[#e0aaaa] bg-[#fff2f0] text-[#a84040]"
                      : "border-[#e6e2d8] bg-white/40 text-[#9a9da8] opacity-70";
                return (
                  <motion.button whileTap={submitted ? undefined : { scale: .985 }} key={`${choice}-${choiceIndex}`} disabled={submitted} onClick={() => setAnswer(choice)}
                    className={`flex items-center gap-3 rounded-2xl border px-4 py-3.5 text-left text-sm shadow-sm transition ${stateClass}`}>
                    <span className="grid h-6 w-6 shrink-0 place-items-center rounded-md bg-black/[.05] font-mono text-xs">{choiceIndex + 1}</span>
                    <span className="flex-1">{choice}</span>
                    {submitted && isAnswer && <Check className="h-4 w-4 shrink-0 text-[#238769]" />}
                    {submitted && isPicked && !isAnswer && <X className="h-4 w-4 shrink-0 text-[#c84b4b]" />}
                  </motion.button>
                );
              })}
            </div>
          )}

          <AnimatePresence>
          {submitted && (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className={`mt-4 flex items-center gap-3 rounded-lg border px-4 py-3 ${correct ? "border-[#b7dccb] bg-[#eff9f4]" : "border-[#efcaca] bg-[#fff2f0]"}`}>
              {correct ? <Check className="h-5 w-5 text-[#238769]" /> : <RotateCcw className="h-5 w-5 text-[#c84b4b]" />}
              <div><div className="text-sm font-semibold">{correct ? "Зөв байна! 🎉" : "Дахин нэг давтаад үзье"}</div>{!correct && <div className="mt-0.5 text-xs text-[#737580]">Таны хариулт: {answer}</div>}</div>
            </motion.div>
          )}
          </AnimatePresence>

          <button onClick={submitted ? advance : submit} disabled={!submitted && !answer.trim()}
            className="btn-primary mt-4 w-full justify-center px-4 py-3 disabled:opacity-40">
            {submitted ? (index === questions.length - 1 ? "Дүн харах" : "Дараах") : "Хариулт шалгах"}
          </button>
        </motion.section>
        </AnimatePresence>
      </div>
    </div>
  );
}
