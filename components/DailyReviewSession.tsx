"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowRight, Check, Flag, X } from "lucide-react";
import { fetchJson } from "@/lib/http";
import { GRADE_OPTIONS, GRADE_PAYLOAD, introduceCard, isMastered, submitCardGrade, type Grade } from "@/lib/srs";
import { useCardSwipe } from "@/lib/use-card-swipe";
import DecorativeLayer from "@/components/ui/DecorativeLayer";
import GradeButtons from "@/components/GradeButtons";
import SwipeHint from "@/components/SwipeHint";
import PushPrompt from "@/components/PushPrompt";
import ReportDialog from "@/components/ReportDialog";
import SpeakButton from "@/components/SpeakButton";
import type { ReportReason } from "@/lib/report";

type ReviewCard = { id: string; front: string; back: string; interval?: number };
type Result = { cardId: string; front: string; back: string; grade: Grade; correct: boolean };

function gradeLabel(grade: Grade) {
  return GRADE_OPTIONS.find((option) => option.value === grade)?.label ?? grade;
}

function buildSavePayload(finalResults: Result[], exposed: number) {
  const gradedTotal = finalResults.length;
  const correctCount = finalResults.filter((result) => result.correct).length;
  const totalCards = gradedTotal > 0 ? gradedTotal : exposed;
  if (totalCards <= 0) return null;
  return {
    deckId: null,
    sessionType: "daily",
    totalCards,
    completed: totalCards,
    correct: gradedTotal > 0 ? correctCount : exposed,
    incorrect: gradedTotal > 0 ? gradedTotal - correctCount : 0,
    score: gradedTotal > 0 ? Math.round((correctCount / gradedTotal) * 100) : 100,
  };
}

function buildGradedQueue(justExposed: ReviewCard[], due: ReviewCard[]): ReviewCard[] {
  const combined = [...due, ...justExposed];
  for (let i = combined.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [combined[i], combined[j]] = [combined[j], combined[i]];
  }
  const exposedIds = new Set(justExposed.map((c) => c.id));
  if (combined.length > 1 && exposedIds.has(combined[0].id)) {
    const swapIndex = combined.findIndex((c, idx) => idx > 0 && !exposedIds.has(c.id));
    if (swapIndex > 0) [combined[0], combined[swapIndex]] = [combined[swapIndex], combined[0]];
  }
  return combined;
}

export default function DailyReviewSession({
  cards,
  exposureCards = [],
  onExit,
}: {
  cards: ReviewCard[];
  exposureCards?: ReviewCard[];
  onExit: () => void;
}) {
  const queryClient = useQueryClient();
  const finishing = useRef(false);
  const beaconSent = useRef(false);
  const resultsRef = useRef<Result[]>([]);
  const exposedRef = useRef(0);
  const [exposureIndex, setExposureIndex] = useState(0);
  const [exposedCount, setExposedCount] = useState(0);
  const [phaseIntro, setPhaseIntro] = useState(false);
  const [gradedQueue, setGradedQueue] = useState<ReviewCard[]>(cards);
  const [justExposedCount, setJustExposedCount] = useState(0);
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [results, setResults] = useState<Result[]>([]);
  const [summary, setSummary] = useState(false);
  const [savingResults, setSavingResults] = useState(false);
  const [saveWarning, setSaveWarning] = useState("");
  const [resultFilter, setResultFilter] = useState<"all" | "correct" | "wrong">("all");
  const [reportedCards, setReportedCards] = useState<Set<string>>(new Set());
  const [reportCardId, setReportCardId] = useState<string | null>(null);
  const [reportError, setReportError] = useState("");
  const [toast, setToast] = useState("");

  const total = exposureCards.length + cards.length;
  const inExposure = exposureIndex < exposureCards.length;
  const current = inExposure ? exposureCards[exposureIndex] : gradedQueue[index];

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

  async function finish(finalResults: Result[], exposed: number) {
    if (finishing.current) return;
    finishing.current = true;
    setSummary(true);
    setSavingResults(true);
    const payload = buildSavePayload(finalResults, exposed);
    if (payload && !beaconSent.current) {
      try {
        const response = await fetch("/api/test/save-session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!response.ok) setSaveWarning((warning) => warning || "Хичээлийн дүнг хадгалж чадсангүй.");
      } catch {
        setSaveWarning((warning) => warning || "Давталтын дүнг сүлжээнд хадгалж чадсангүй.");
      }
    }
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["daily-review"] }),
      queryClient.invalidateQueries({ queryKey: ["decks"] }),
      queryClient.invalidateQueries({ queryKey: ["user-stats"] }),
    ]);
    setSavingResults(false);
  }

  resultsRef.current = results;
  exposedRef.current = exposedCount;

  useEffect(() => {
    function persistOnHide() {
      if (beaconSent.current || finishing.current) return;
      if (typeof navigator === "undefined" || typeof navigator.sendBeacon !== "function") return;
      const payload = buildSavePayload(resultsRef.current, exposedRef.current);
      if (!payload) return;
      const blob = new Blob([JSON.stringify(payload)], { type: "application/json" });
      if (navigator.sendBeacon("/api/test/save-session", blob)) beaconSent.current = true;
    }
    function onVisibility() {
      if (document.visibilityState === "hidden") persistOnHide();
    }
    window.addEventListener("pagehide", persistOnHide);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.removeEventListener("pagehide", persistOnHide);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  const introduceMutation = useMutation({
    mutationFn: async (card: ReviewCard) => ({ card, ok: await introduceCard(card.id) }),
    onSuccess: ({ ok }) => {
      if (!ok) setSaveWarning((warning) => warning || "Зарим шинэ үгийг хадгалж чадсангүй.");
      const nextExposed = exposedCount + 1;
      setExposedCount(nextExposed);
      const wasLast = exposureIndex >= exposureCards.length - 1;
      setExposureIndex((currentIndex) => currentIndex + 1);
      setFlipped(false);
      if (wasLast) {
        setJustExposedCount(exposureCards.length);
        setGradedQueue(buildGradedQueue(exposureCards, cards));
        setPhaseIntro(true);
      }
    },
  });

  const gradeMutation = useMutation({
    mutationFn: async ({ card, grade }: { card: ReviewCard; grade: Grade }) => ({
      card,
      grade,
      outcome: await submitCardGrade(card.id, grade),
    }),
    onSuccess: ({ card, grade, outcome }) => {
      if (!outcome.ok) setSaveWarning((warning) => warning || "Зарим картын дараагийн давталтыг хадгалж чадсангүй.");
      const wasMastered = isMastered(card.interval ?? 0);
      if (outcome.ok && !wasMastered && isMastered(outcome.interval ?? 0)) {
        flashToast(`🎉 "${card.front}" үгийг эзэмшлээ!`);
      }
      const result: Result = { cardId: card.id, front: card.front, back: card.back, grade, correct: GRADE_PAYLOAD[grade].correct };
      const nextResults = [...results, result];
      setResults(nextResults);
      if (index >= gradedQueue.length - 1) {
        void finish(nextResults, exposedCount);
      } else {
        setIndex((currentIndex) => currentIndex + 1);
        setFlipped(false);
      }
    },
  });

  function acknowledge() {
    if (!current || introduceMutation.isPending) return;
    introduceMutation.mutate(current);
  }

  function handleGrade(grade: Grade) {
    if (!current || gradeMutation.isPending) return;
    gradeMutation.mutate({ card: current, grade });
  }

  function finishNow() {
    if (gradeMutation.isPending || introduceMutation.isPending) return;
    if (results.length === 0 && exposedCount === 0) { onExit(); return; }
    void finish(results, exposedCount);
  }

  const swipe = useCardSwipe({
    cardId: current?.id ?? "",
    enabled: Boolean(current) && flipped && (inExposure ? !introduceMutation.isPending : !gradeMutation.isPending),
    leftEnabled: !inExposure,
    onCommitRight: () => { if (inExposure) acknowledge(); else handleGrade("good"); },
    onCommitLeft: () => handleGrade("again"),
  });

  const progress = total ? ((exposedCount + results.length) / total) * 100 : 0;
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
            <h1 className="text-3xl font-bold tracking-tight">
              {results.length > 0
                ? `${results.length} үг давтлаа${accuracy === 100 ? " 🎉" : ""}`
                : `${exposedCount} шинэ үгтэй танилцлаа`}
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              Өдрийн давталт
              {results.length > 0 ? ` · ${accuracy}% сайн санасан` : ""}
              {results.length > 0 && exposedCount > 0 ? ` · ${exposedCount} шинэ үг` : ""}
            </p>
            {savingResults && <div className="mt-4 flex items-center gap-2 text-sm text-[#737580]"><span className="h-2 w-2 animate-pulse rounded-full bg-[#b7791f]" />Дүнг хадгалж байна...</div>}
            {saveWarning && (
              <div className="mt-5 rounded-lg border border-amber-300/20 bg-amber-300/8 px-4 py-3 text-sm text-amber-100">
                {saveWarning}
              </div>
            )}
            {results.length > 0 && (
              <>
                <div className="mt-7 grid grid-cols-3 gap-2">
                  {([
                    ["correct", "Санасан", results.filter((item) => item.correct).length],
                    ["wrong", "Мартсан", results.filter((item) => !item.correct).length],
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
                      {resultFilter === "wrong" ? "Бүгдийг санасан байна!" : "Харуулах үр дүн алга."}
                    </div>
                  ) : filteredResults.map((result) => (
                    <div key={result.cardId} className="flex items-center justify-between gap-3 rounded-lg border border-[#e4e5e9] bg-[#fafafa] px-4 py-3">
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-medium">{result.front}</div>
                        <div className="mt-1 truncate text-xs text-slate-500">{result.back} · {gradeLabel(result.grade)}</div>
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
              </>
            )}
            {results.length === 0 && exposedCount > 0 && (
              <p className="mt-5 text-sm leading-6 text-[#676b78]">
                Эдгээр үг маргаашийн давталтад орж ирнэ. Тогтмол эргэж ирвэл хамгийн хурдан тогтооно.
              </p>
            )}
            <PushPrompt />
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

  if (phaseIntro) {
    return (
      <div className="app-shell app-content min-h-screen px-4 py-5 sm:py-8">
        <DecorativeLayer variant="review" />
        <div className="relative z-10 mx-auto grid min-h-[70vh] max-w-3xl place-items-center">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flashcard-surface w-full p-8 text-center">
            <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-[#e8f5ee] text-2xl">👍</div>
            <h1 className="mt-5 text-2xl font-bold">{exposedCount} шинэ үгтэй танилцлаа</h1>
            <p className="mt-2 text-sm leading-6 text-[#676b78]">
              Одоо саяхан үзсэн үгсээ шалгацгаая — санаж байгаа эсэхээ өөрөө үнэлээрэй.
              {cards.length > 0 && ` Өмнөх ${cards.length} үгтэй хамт нийт ${gradedQueue.length} карт.`}
            </p>
            <button onClick={() => setPhaseIntro(false)} className="btn-primary mt-6 px-5 py-3 text-sm">
              Шалгалт эхлүүлэх <ArrowRight className="h-4 w-4" />
            </button>
          </motion.div>
        </div>
      </div>
    );
  }

  const pendingGrade = gradeMutation.isPending ? gradeMutation.variables?.grade ?? null : null;

  return (
    <div className="app-shell app-content min-h-screen px-4 py-5 sm:py-8">
      <DecorativeLayer variant="review" />
      <div className="relative z-10 mx-auto max-w-3xl">
        <div className="mb-5 flex items-center gap-4">
          <button onClick={finishNow} className="btn-ghost shrink-0 px-3 py-2 text-sm">
            {results.length + exposedCount > 0 ? "Хадгалаад гарах" : "Гарах"}
          </button>
          <div className="flex-1">
            <div className="mb-2 flex justify-between text-xs text-[#777985]">
              <span>
                {inExposure
                  ? `Шинэ үг · ${exposureIndex + 1} / ${exposureCards.length}`
                  : `Давталт · ${index + 1} / ${gradedQueue.length}`}
              </span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-[#e6dfd3]"><motion.div className="h-full rounded-full bg-[#b7791f]" animate={{ width: `${progress}%` }} transition={{ duration: .2 }} /></div>
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.section
            key={current.id}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: .18 }}
            className="relative"
          >
            <SpeakButton text={current.front} className="absolute right-4 top-16 z-10" />
            <SwipeHint side="right" opacity={swipe.rightOpacity} label={inExposure ? "Ойлголоо" : undefined} />
            {!inExposure && <SwipeHint side="left" opacity={swipe.leftOpacity} />}
            <motion.button
              whileTap={{ scale: .995 }}
              {...swipe.dragProps}
              onClick={() => { if (swipe.consumeDrag()) return; setFlipped((value) => !value); }}
              className="flashcard-surface relative min-h-[330px] w-full touch-pan-y overflow-hidden text-center"
            >
              <DecorativeLayer variant="flashcard" />
              <div className="flex items-center justify-between border-b border-[#e4e6eb] px-5 py-3 text-[10px] font-bold uppercase tracking-[.14em] text-[#8c909c]">
                <span className={inExposure ? "text-[#9a6418]" : undefined}>
                  {inExposure ? "Шинэ үг" : flipped ? "Ар тал" : "Нүүр тал"}
                </span>
                <span>
                  {inExposure
                    ? `${exposureIndex + 1} / ${exposureCards.length}`
                    : `${index + 1} / ${gradedQueue.length}`}
                </span>
              </div>
              <div className="grid min-h-[270px] place-items-center px-6 py-10">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={flipped ? "back" : "front"}
                    initial={{ opacity: 0, rotateX: -14, y: 6 }}
                    animate={{ opacity: 1, rotateX: 0, y: 0 }}
                    exit={{ opacity: 0, rotateX: 14, y: -6 }}
                    transition={{ duration: .18 }}
                  >
                    <div className="text-4xl font-bold tracking-[-.04em] sm:text-5xl">
                      {flipped ? current.back : current.front}
                    </div>
                    {!flipped && (
                      <div className="mt-6 text-xs text-[#818591]">
                        {inExposure ? "Шинэ үг — дарж утгыг нь үзээрэй" : "Утгыг нь санаж байна уу? Дарж шалгаарай"}
                      </div>
                    )}
                  </motion.div>
                </AnimatePresence>
              </div>
            </motion.button>

            {flipped && (inExposure ? (
              <div className="mt-4">
                <button
                  onClick={acknowledge}
                  disabled={introduceMutation.isPending}
                  className="btn-primary w-full justify-center px-4 py-3.5 disabled:opacity-50"
                >
                  {introduceMutation.isPending ? "..." : "Ойлголоо"}
                </button>
                <p className="mt-2 text-center text-xs text-[#818591]">Дараа шатанд дахин давтаж, тогтоосон эсэхийг баталгаажуулна.</p>
              </div>
            ) : (
              <GradeButtons onGrade={handleGrade} disabled={gradeMutation.isPending} pendingGrade={pendingGrade} />
            ))}
          </motion.section>
        </AnimatePresence>
      </div>

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
