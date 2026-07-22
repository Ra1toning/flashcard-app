"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { useQueries } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { ArrowRight, Flame, Layers3, Plus } from "lucide-react";
import DeckList from "@/components/DeckList";
import StatsGrid from "@/components/StatsGrid";
import { DashboardSkeleton } from "@/components/ui/Skeletons";
import { fetchJson } from "@/lib/http";
import type { Deck } from "@/types";
import DecorativeLayer from "@/components/ui/DecorativeLayer";

type DailyData = {
  stats: { overdue: number; today: number; upcoming: number; total: number };
  recommendation: string;
  streak: number;
  cards?: Array<{ front: string; back: string }>;
};

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const [decksQuery, dailyQuery] = useQueries({
    queries: [
      {
        queryKey: ["decks"],
        queryFn: () => fetchJson<{ myDecks: Deck[] }>("/api/decks"),
        enabled: status === "authenticated",
      },
      {
        queryKey: ["daily-review"],
        queryFn: () => fetchJson<DailyData>("/api/test/daily"),
        enabled: status === "authenticated",
      },
    ],
  });

  if (status === "loading" || decksQuery.isPending || dailyQuery.isPending) return <DashboardSkeleton />;
  if (!session) return null;

  const decks = decksQuery.data?.myDecks ?? [];
  const daily = dailyQuery.data ?? {
    stats: { overdue: 0, today: 0, upcoming: 0, total: 0 },
    recommendation: "Өнөөдрийн даалгавар бэлэн байна.",
    streak: 0,
  };
  const dueCount = daily.stats.total;
  const sample = daily.cards?.[0];
  const streakAtRisk = daily.streak > 0 && dueCount > 0;

  return (
    <div className="app-shell app-content">
      <main className="page-canvas">
        <header className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="eyebrow mb-2">Суралцах нүүр</p>
            <h1 className="text-3xl font-bold tracking-[-0.04em] sm:text-4xl">
              Сайн уу, {session.user?.name?.split(" ")[0] || "Суралцагч"}.
            </h1>
            <p className="mt-2 text-sm text-[#737580]">Өнөөдрийн жижиг зорилгоо биелүүлцгээе.</p>
          </div>
          <Link href="/deck/create" className="btn-secondary w-fit px-4 py-2.5 text-sm">
            <Plus className="h-4 w-4" /> Шинэ багц
          </Link>
        </header>

        {(decksQuery.isError || dailyQuery.isError) && (
          <div className="mb-4 rounded-lg border border-[#efcaca] bg-[#fff2f0] px-4 py-3 text-sm text-[#a84040]">
            Зарим мэдээллийг шинэчилж чадсангүй. Хуудсыг дахин оролдоно уу.
          </div>
        )}

        <section className="grid gap-5 lg:grid-cols-[1.5fr_.5fr]">
          <motion.article initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="relative overflow-hidden rounded-[24px] border border-white/80 bg-gradient-to-br from-[#fff4d6]/90 via-[#fffdf8]/94 to-[#f7eedc]/90 p-5 shadow-[0_20px_55px_rgba(65,48,24,.11)] backdrop-blur-xl sm:p-7">
            <DecorativeLayer variant="review" />
            <div className="relative z-10 grid gap-6 sm:grid-cols-[1fr_210px] sm:items-center">
              <div className="relative">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[.12em] text-[#9a6418]">
                  <span className="h-2 w-2 rounded-full bg-[#e68a24]" />
                  Өнөөдрийн даалгавар
                </div>
                <h2 className="mt-3 text-2xl font-bold tracking-[-.035em]">
                  {dueCount > 0 ? `Өнөөдөр ${dueCount} үг давтах үлдлээ` : "Өнөөдрийн давтах үг дууссан байна 🎉"}
                </h2>
                <p className="mt-2 max-w-xl text-sm leading-6 text-[#596175]">{daily.recommendation}</p>
                <div className="mt-5 flex flex-wrap items-center gap-4">
                  <Link href="/test/daily" className="btn-primary px-4 py-2.5 text-sm">
                    Давталт эхлүүлэх <ArrowRight className="h-4 w-4" />
                  </Link>
                  <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold ${
                    daily.streak === 0 ? "bg-[#f1f2f5] text-[#777985]" : streakAtRisk ? "bg-[#fff0d6] text-[#9a6418]" : "bg-[#fde8d0] text-[#c2560a]"
                  }`}>
                    <Flame className={`h-3.5 w-3.5 ${daily.streak > 0 ? "fill-current" : ""}`} />
                    {daily.streak} өдөр дараалсан
                  </span>
                </div>
                {streakAtRisk && (
                  <p className="mt-3 text-xs font-semibold text-[#c2560a]">
                    Дарааллаа хадгалаарай! Өнөөдрийн {dueCount} үгээ давтвал streak үргэлжилнэ.
                  </p>
                )}
              </div>

              <div className="relative mx-auto w-full max-w-[210px]">
                <motion.div whileHover={{ y: -3, rotate: -.5 }} className="relative grid min-h-40 place-items-center rounded-2xl border border-white bg-white/90 p-5 text-center shadow-[0_18px_35px_rgba(40,55,90,.11)]">
                  <span className="absolute left-3 top-3 text-[10px] font-bold uppercase tracking-wider text-[#9297a7]">Дараагийн үг</span>
                  <strong className="mt-4 text-xl">{sample?.front || (dueCount ? "Санаж чадав уу?" : "Маш сайн!")}</strong>
                  <span className="mt-3 text-xs text-[#8a8e9c]">{sample ? "Өнөөдөр энд хүргээд зогсох уу?" : "Маргааш үргэлжлүүлье"}</span>
                </motion.div>
              </div>
            </div>
          </motion.article>

          <aside className="study-set-card p-5">
            <div className="mb-4 flex items-center gap-2">
              <Layers3 className="h-4 w-4 text-[#b7791f]" />
              <h2 className="font-bold">Сүүлийн ахиц</h2>
            </div>
            <StatsGrid />
          </aside>
        </section>

        <section className="mt-8">
          <div className="mb-4 flex items-end justify-between">
            <div>
              <p className="eyebrow">Үргэлжлүүлэн сурах</p>
              <h2 className="mt-1 text-xl font-bold">Идэвхтэй багцууд</h2>
            </div>
            <Link href="/library" className="text-sm font-semibold text-[#84530f]">Бүгдийг харах</Link>
          </div>
          {decks.length > 0 ? (
            <DeckList decks={decks.slice(0, 6)} />
          ) : (
            <div className="study-set-card relative overflow-hidden px-6 py-10 text-center">
              <DecorativeLayer variant="empty" />
              <h3 className="font-bold">Суралцах багц алга байна</h3>
              <p className="mt-2 text-sm text-[#737580]">Өөрийн багцыг үүсгэх эсвэл хуваалцсан багцаас хадгалж эхлээрэй.</p>
              <div className="mt-5 flex justify-center gap-2">
                <Link href="/deck/create" className="btn-primary px-4 py-2.5 text-sm">Багц үүсгэх</Link>
                <Link href="/discover" className="btn-secondary px-4 py-2.5 text-sm">Хуваалцсан багцууд</Link>
              </div>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
