"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight, CalendarClock, Layers3 } from "lucide-react";
import TestSession from "@/components/TestSession";
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
  dueDate: string;
  state: string;
}

type DailyResponse = {
  cards: Card[];
  streak: number;
};

export default function DailyTestPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [sessionStarted, setSessionStarted] = useState(false);
  const dailyQuery = useQuery({
    queryKey: ["daily-review"],
    queryFn: () => fetchJson<DailyResponse>("/api/test/daily"),
  });

  if (dailyQuery.isPending) return <StudySkeleton />;

  const dueCards = dailyQuery.data?.cards ?? [];
  const streak = dailyQuery.data?.streak ?? 0;

  if (sessionStarted && dueCards.length > 0) {
    const sessionCards = dueCards.slice(0, 20);
    return (
      <TestSession
        deckId="daily"
        deckName="Өнөөдрийн давталт"
        config={{ mode: "mixed", direction: "mixed", cards: sessionCards }}
        timeLimit={sessionCards.length * 25}
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
        ) : dueCards.length > 0 ? (
          <>
            <header className="mb-6">
              <p className="eyebrow mb-2">Өнөөдрийн queue</p>
              <h1 className="text-3xl font-bold tracking-[-.04em]">{dueCards.length} үг давтахад бэлэн байна</h1>
              <p className="mt-2 text-sm text-[#737580]">Энэ удаа 20 хүртэл картыг тайван давтаарай.</p>
            </header>

            <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flashcard-surface relative overflow-hidden p-5 sm:p-7">
              <DecorativeLayer variant="review" />
              <div className="grid gap-7 sm:grid-cols-[1fr_240px] sm:items-center">
                <div className="relative">
                  <div className="flex gap-5 text-sm">
                    <span className="flex items-center gap-2"><Layers3 className="h-4 w-4 text-[#b7791f]" />{Math.min(dueCards.length, 20)} карт</span>
                    <span className="flex items-center gap-2"><CalendarClock className="h-4 w-4 text-[#e68a24]" />{streak} өдөр</span>
                  </div>
                  <h2 className="mt-6 text-2xl font-bold">Санаж, шалгаж, бататгаарай.</h2>
                  <p className="mt-2 text-sm leading-6 text-[#676b78]">Хариултаа оруулаад, мэдлэгээ шууд шалгаарай.</p>
                  <button onClick={() => setSessionStarted(true)} className="btn-primary mt-6 px-5 py-3 text-sm">
                    Давталт эхлүүлэх <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
                <div className="relative mx-auto w-full max-w-[240px]">
                  <motion.div whileHover={{ y: -3, rotate: -.5 }} className="relative grid min-h-44 place-items-center rounded-2xl border border-white bg-white/90 p-5 text-center shadow-[0_18px_36px_rgba(41,54,83,.12)]">
                    <span className="absolute left-3 top-3 text-[10px] font-bold uppercase tracking-wider text-[#9a9daa]">Эхний карт</span>
                    <strong className="mt-4 text-2xl">{dueCards[0]?.front}</strong>
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
            <button onClick={() => router.push("/library")} className="btn-secondary mt-5 px-4 py-2.5 text-sm">Багцуудаа харах</button>
          </section>
        )}
      </main>
    </div>
  );
}
