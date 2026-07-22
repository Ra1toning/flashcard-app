"use client";

import { use, useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Keyboard, Layers3, ListChecks } from "lucide-react";
import TestSession from "@/components/TestSession";
import { StudySkeleton } from "@/components/ui/Skeletons";
import { fetchJson } from "@/lib/http";
import type { DeckDetail } from "@/app/deck/[id]/DeckClient";
import DecorativeLayer from "@/components/ui/DecorativeLayer";

type TestMode = "typing" | "mcq" | "mixed";
type Direction = "front-to-back" | "back-to-front" | "mixed";
type Card = {
  id: string; front: string; back: string; easeFactor: number;
  interval: number; repetition: number; state: string; dueDate: string;
};

export default function DeckTestPage({ params }: { params: Promise<{ testId: string }> }) {
  const { testId } = use(params);
  const router = useRouter();
  const [mode, setMode] = useState<TestMode>("typing");
  const [direction, setDirection] = useState<Direction>("mixed");
  const [count, setCount] = useState(10);
  const [sessionCards, setSessionCards] = useState<Card[] | null>(null);
  const deckQuery = useQuery({
    queryKey: ["deck", testId],
    queryFn: () => fetchJson<DeckDetail>(`/api/decks/${testId}`),
  });

  const cards = useMemo(() => (deckQuery.data?.wordsList ?? []).map((word) => ({
    id: word.id,
    front: word.korean,
    back: word.mongolian,
    easeFactor: 2.5,
    interval: 1,
    repetition: 0,
    state: "review",
    dueDate: new Date().toISOString(),
  })), [deckQuery.data]);

  useEffect(() => {
    if (cards.length) setCount((current) => Math.min(current, cards.length));
  }, [cards.length]);

  if (deckQuery.isPending) return <StudySkeleton />;
  if (deckQuery.isError || !deckQuery.data || cards.length === 0) {
    return (
      <div className="app-shell app-content grid min-h-screen place-items-center px-4">
        <div className="study-set-card w-full max-w-md px-6 py-10 text-center">
          <h1 className="text-lg font-bold">{deckQuery.error?.message || "Энэ багцад үг байхгүй байна."}</h1>
          <button onClick={() => router.back()} className="btn-secondary mt-5 px-4 py-2.5 text-sm">Буцах</button>
        </div>
      </div>
    );
  }

  const deck = deckQuery.data;
  const canUseMcq = cards.length >= 4;
  const timeLimit = count * (mode === "typing" ? 30 : mode === "mcq" ? 15 : 25);
  const formattedTime = `${Math.max(1, Math.ceil(timeLimit / 60))} минут`;

  if (sessionCards) {
    return (
      <TestSession
        deckId={deck.id}
        deckName={deck.name}
        config={{ mode, direction, cards: sessionCards }}
        timeLimit={timeLimit}
        onComplete={() => undefined}
        onExit={() => router.push("/dashboard")}
      />
    );
  }

  const modes = [
    { value: "typing" as const, label: "Бичиж шалгах", description: "Хариултаа өөрөө бичнэ", icon: Keyboard },
    { value: "mcq" as const, label: "Сонгож шалгах", description: "4 хариултаас сонгоно", icon: ListChecks },
    { value: "mixed" as const, label: "Холимог", description: "Хоёр хэлбэр ээлжилнэ", icon: Layers3 },
  ];

  return (
    <div className="app-shell app-content min-h-screen">
      <main className="page-canvas max-w-4xl">
        <button onClick={() => router.back()} className="btn-ghost mb-6 px-2 py-2 text-sm"><ArrowLeft className="h-4 w-4" />Багц руу буцах</button>
        <header className="mb-7">
          <p className="eyebrow mb-2">Суралцах session</p>
          <h1 className="text-3xl font-bold tracking-[-.04em]">{deck.name}</h1>
          <p className="mt-2 text-sm text-[#737580]">Хэрхэн шалгуулах болон хэдэн карт давтахаа сонгоно уу.</p>
        </header>

        <div className="grid gap-5 lg:grid-cols-[1fr_250px]">
          <section className="study-set-card p-5 shadow-[0_18px_45px_rgba(31,42,68,.08)] sm:p-6">
            <label className="label">Шалгах хэлбэр</label>
            <div className="grid gap-2 sm:grid-cols-3">
              {modes.map(({ value, label, description, icon: Icon }) => {
                const disabled = value !== "typing" && !canUseMcq;
                return (
                  <motion.button whileHover={disabled ? undefined : { y: -2 }} whileTap={disabled ? undefined : { scale: .985 }} key={value} disabled={disabled} onClick={() => setMode(value)}
                    className={`rounded-2xl border p-4 text-left transition disabled:cursor-not-allowed disabled:opacity-35 ${mode === value ? "border-[#d4a451] bg-gradient-to-br from-[#fff1c7] to-white shadow-[0_10px_24px_rgba(183,121,31,.1)]" : "border-[#ded7ca] bg-white/75 hover:border-[#c8baa3] hover:bg-white"}`}>
                    <Icon className="h-4 w-4 text-[#b7791f]" />
                    <div className="mt-3 text-sm font-bold">{label}</div>
                    <div className="mt-1 text-xs leading-5 text-[#777b87]">{description}</div>
                  </motion.button>
                );
              })}
            </div>
            {!canUseMcq && <p className="mt-2 text-xs text-[#a76516]">Сонгох хэлбэрт хамгийн багадаа 4 карт хэрэгтэй.</p>}

            <div className="mt-6">
              <label className="label">Картын чиглэл</label>
              <div className="grid grid-cols-3 gap-2">
                {([
                  ["front-to-back", "Асуух → Хариу"],
                  ["back-to-front", "Хариу → Асуух"],
                  ["mixed", "Холимог"],
                ] as const).map(([value, label]) => (
                  <button key={value} onClick={() => setDirection(value)}
                    className={`rounded-xl border px-3 py-2.5 text-sm font-medium transition ${direction === value ? "border-[#d4a451] bg-[#fff1c7] text-[#84530f] shadow-sm" : "border-[#ded7ca] bg-white/65 text-[#686158] hover:bg-white"}`}>
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-6">
              <div className="mb-3 flex justify-between"><label className="label mb-0">Картын тоо</label><span className="font-mono text-sm font-bold text-[#84530f]">{count}</span></div>
              <input type="range" min={1} max={Math.min(50, cards.length)} value={count} onChange={(event) => setCount(Number(event.target.value))} className="w-full accent-[#b7791f]" />
              <div className="mt-2 flex justify-between text-xs text-[#9295a1]"><span>1</span><span>{Math.min(50, cards.length)}</span></div>
            </div>
          </section>

          <motion.aside initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} className="flashcard-surface h-fit p-5">
            <DecorativeLayer variant="review" />
            <span className="text-[10px] font-bold uppercase tracking-[.14em] text-[#9295a1]">Session тойм</span>
            <div className="mt-5 space-y-3 text-sm">
              <div className="flex justify-between"><span className="text-[#777b87]">Карт</span><strong>{count}</strong></div>
              <div className="flex justify-between"><span className="text-[#777b87]">Хугацаа</span><strong>{formattedTime}</strong></div>
              <div className="flex justify-between"><span className="text-[#777b87]">Чиглэл</span><strong>{direction === "mixed" ? "Холимог" : direction === "front-to-back" ? "Урагш" : "Урвуу"}</strong></div>
            </div>
            <button onClick={() => setSessionCards([...cards].sort(() => Math.random() - 0.5).slice(0, count))} className="btn-primary mt-6 w-full px-4 py-3">
              Эхлүүлэх <ArrowRight className="h-4 w-4" />
            </button>
          </motion.aside>
        </div>
      </main>
    </div>
  );
}
