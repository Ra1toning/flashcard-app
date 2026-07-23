"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight, CalendarClock, Layers3 } from "lucide-react";
import TestSession from "@/components/TestSession";
import DailyReviewSession from "@/components/DailyReviewSession";
import { StudySkeleton } from "@/components/ui/Skeletons";
import { fetchJson } from "@/lib/http";
import DecorativeLayer from "@/components/ui/DecorativeLayer";

interface Card {
  id: string;
  front: string;
  back: string;
  easeFactor: number;
  interval: number;
  repetition: number;
  introduced: boolean;
  dueDate: string;
  state: string;
}

type DailyResponse = {
  cards: Card[];
  streak: number;
  stats: { overdue: number; today: number; total: number };
};

const SESSION_LIMIT = 20;

function DailyTestPageContent() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const autoStart = searchParams.get("start") === "1";
  const [mode, setMode] = useState<"idle" | "self-grade" | "test">("idle");
  const dailyQuery = useQuery({
    queryKey: ["daily-review"],
    queryFn: () => fetchJson<DailyResponse>("/api/test/daily"),
  });

  const dueCards = useMemo(() => dailyQuery.data?.cards ?? [], [dailyQuery.data]);
  const newCards = useMemo(() => dueCards.filter((card) => !card.introduced), [dueCards]);
  const reviewCards = useMemo(() => dueCards.filter((card) => card.introduced), [dueCards]);
  const sessionExposure = newCards.slice(0, SESSION_LIMIT);
  const sessionReview = reviewCards.slice(0, Math.max(0, SESSION_LIMIT - sessionExposure.length));
  const sessionSize = sessionExposure.length + sessionReview.length;

  useEffect(() => {
    if (autoStart && mode === "idle" && !dailyQuery.isPending && sessionSize > 0) {
      setMode("self-grade");
    }
  }, [autoStart, mode, dailyQuery.isPending, sessionSize]);

  if (dailyQuery.isPending) return <StudySkeleton />;

  const streak = dailyQuery.data?.streak ?? 0;
  const dueTotal = dailyQuery.data?.stats.total ?? dueCards.length;

  if (mode === "self-grade" && sessionSize > 0) {
    return (
      <DailyReviewSession
        cards={sessionReview}
        exposureCards={sessionExposure}
        onExit={() => router.push("/dashboard")}
      />
    );
  }

  if (mode === "test" && sessionReview.length > 0) {
    return (
      <TestSession
        deckId="daily"
        deckName="Өнөөдрийн давталт"
        config={{ mode: "mixed", direction: "mixed", cards: sessionReview }}
        timeLimit={sessionReview.length * 25}
        onComplete={() => queryClient.invalidateQueries({ queryKey: ["daily-review"] })}
        onExit={() => router.push("/dashboard")}
      />
    );
  }

  return (
    <div className="app-shell app-content min-h-screen">
      <main className="page-canvas max-w-4xl">
        <button onClick={() => router.push("/dashboard")} className="btn-ghost mb-6 px-2 py-2 text-sm">
          <ArrowLeft className="h-4 w-4" /> Суралцах нүүр
        </button>

        {dailyQuery.isError ? (
          <div className="study-set-card px-6 py-12 text-center">
            <h1 className="font-bold">Өдрийн давталтыг ачаалж чадсангүй</h1>
            <p className="mt-2 text-sm text-[#737580]">{dailyQuery.error.message}</p>
            <button onClick={() => dailyQuery.refetch()} className="btn-primary mt-5 px-4 py-2.5 text-sm">Дахин оролдох</button>
          </div>
        ) : sessionSize > 0 ? (
          <>
            <header className="mb-6">
              <p className="eyebrow mb-2">Өнөөдрийн queue</p>
              <h1 className="text-3xl font-bold tracking-[-.04em]">{dueTotal} үг давтах хугацаа болсон</h1>
              <p className="mt-2 text-sm text-[#737580]">
                Энэ удаа {sessionSize} картыг тайван давтаарай.
                {sessionExposure.length > 0 && ` Үүнээс ${sessionExposure.length} нь шинэ үг.`}
              </p>
            </header>

            <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flashcard-surface relative overflow-hidden p-5 sm:p-7">
              <DecorativeLayer variant="review" />
              <div className="grid gap-7 sm:grid-cols-[1fr_240px] sm:items-center">
                <div className="relative">
                  <div className="flex gap-5 text-sm">
                    <span className="flex items-center gap-2"><Layers3 className="h-4 w-4 text-[#b7791f]" />{sessionSize} карт</span>
                    <span className="flex items-center gap-2"><CalendarClock className="h-4 w-4 text-[#e68a24]" />{streak} өдөр</span>
                  </div>
                  <h2 className="mt-6 text-2xl font-bold">Санаж, шалгаж, бататгаарай.</h2>
                  <p className="mt-2 text-sm leading-6 text-[#676b78]">Картаа эргүүлээд, хэр сайн санаснаа өөрөө үнэлээрэй.</p>
                  <div className="mt-6 flex flex-wrap items-center gap-3">
                    <button onClick={() => setMode("self-grade")} className="btn-primary px-5 py-3 text-sm">
                      Давталт эхлүүлэх <ArrowRight className="h-4 w-4" />
                    </button>
                    {sessionReview.length > 0 && (
                      <button onClick={() => setMode("test")} className="btn-secondary px-5 py-3 text-sm">
                        Тестээр шалгах
                      </button>
                    )}
                  </div>
                </div>
                <div className="relative mx-auto w-full max-w-[240px]">
                  <motion.div whileHover={{ y: -3, rotate: -.5 }} className="relative grid min-h-44 place-items-center rounded-2xl border border-white bg-white/90 p-5 text-center shadow-[0_18px_36px_rgba(41,54,83,.12)]">
                    <span className="absolute left-3 top-3 text-[10px] font-bold uppercase tracking-wider text-[#9a9daa]">Эхний карт</span>
                    <strong className="mt-4 text-2xl">{(sessionExposure[0] ?? sessionReview[0])?.front}</strong>
                    <span className="mt-4 text-xs text-[#8a8e9c]">Хариуг давталт эхэлсний дараа харна</span>
                  </motion.div>
                </div>
              </div>
            </motion.section>
          </>
        ) : (
          <section className="study-set-card px-6 py-12 text-center">
            <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-[#e8f5ee] text-[#238769]">
              <span className="text-xl font-bold">✓</span>
            </div>
            <h1 className="mt-5 text-xl font-bold">Өнөөдрийн давталт дууссан</h1>
            <p className="mt-2 text-sm text-[#737580]">Дараагийн давталт бэлэн болоход энд харагдана.</p>
            <div className="mt-5 flex flex-wrap justify-center gap-2">
              <button onClick={() => router.push("/discover")} className="btn-primary px-4 py-2.5 text-sm">Шинэ багц нээх</button>
              <button onClick={() => router.push("/library")} className="btn-secondary px-4 py-2.5 text-sm">Багцуудаа харах</button>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

export default function DailyTestPage() {
  return (
    <Suspense fallback={<StudySkeleton />}>
      <DailyTestPageContent />
    </Suspense>
  );
}
