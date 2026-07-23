"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import * as Tabs from "@radix-ui/react-tabs";
import { Plus, Search } from "lucide-react";
import DeckCard from "@/components/DeckCard";
import { MotionItem, PageMotion } from "@/components/ui/Motion";
import type { Deck } from "@/types";
import DecorativeLayer from "@/components/ui/DecorativeLayer";

type Filter = "all" | "active" | "completed";

export default function Library({ myDecks, refreshing = false }: { myDecks: Deck[]; refreshing?: boolean }) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const filtered = useMemo(() => myDecks.filter((deck) => {
    const matchesQuery = deck.name.toLowerCase().includes(query.trim().toLowerCase());
    const matchesFilter = filter === "all" || (filter === "completed" ? deck.progress >= 100 : deck.progress < 100);
    return matchesQuery && matchesFilter;
  }), [myDecks, query, filter]);

  const totalWords = myDecks.reduce((sum, deck) => sum + deck.words, 0);
  const mastered = myDecks.reduce((sum, deck) => sum + deck.mastered, 0);

  return (
    <PageMotion>
      <MotionItem className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <div className="eyebrow mb-3">Таны суралцах материал</div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-[-0.04em] sm:text-4xl">Миний сан</h1>
            {refreshing && <span className="h-2 w-2 animate-pulse rounded-full bg-[#b7791f]" title="Шинэчилж байна" />}
          </div>
          <p className="mt-2 text-[#74727c]">Үүсгэсэн болон хадгалсан багцуудаа нэг дороос нээж, үргэлжлүүлэн сураарай.</p>
        </div>
        <Link href="/deck/create" className="btn-primary w-fit px-4 py-2.5 text-sm"><Plus className="h-4 w-4" aria-hidden="true" />Шинэ багц</Link>
      </MotionItem>

      <MotionItem className="mb-5 flex flex-wrap gap-2">
        {[
          ["Багц", myDecks.length],
          ["Нийт үг", totalWords],
          ["Эзэмшсэн", mastered],
        ].map(([label, value]) => (
          <div key={String(label)} className="flex items-baseline gap-2 rounded-full border border-white/80 bg-white/65 px-3.5 py-2 shadow-sm backdrop-blur-xl">
            <div className="text-lg font-bold tracking-tight">{value}</div>
            <div className="text-xs text-[#777985]">{label}</div>
          </div>
        ))}
      </MotionItem>

      <MotionItem>
        <Tabs.Root value={filter} onValueChange={(value) => setFilter(value as Filter)}>
          <div className="mb-5 flex flex-col gap-2 rounded-[20px] border border-white/80 bg-white/72 p-2 shadow-[0_12px_34px_rgba(32,43,70,.07)] backdrop-blur-xl sm:flex-row sm:items-center">
            <div className="relative min-w-0 flex-1">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8c919d]" aria-hidden="true" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                className="h-10 w-full rounded-xl bg-[#f7f8fa] pl-10 pr-4 text-sm outline-none transition placeholder:text-[#999da7] hover:bg-[#f3f5f8] focus:bg-white focus:ring-2 focus:ring-[#cbd8fa]"
                placeholder="Багцын нэрээр хайх..."
              />
            </div>
            <Tabs.List className="grid grid-cols-3 rounded-xl bg-[#f0f1f4] p-1 sm:flex">
              {([
                ["all", "Бүгд"],
                ["active", "Суралцаж буй"],
                ["completed", "Дууссан"],
              ] as const).map(([value, label]) => (
                <Tabs.Trigger key={value} value={value} className="whitespace-nowrap rounded-lg px-3 py-2 text-xs font-bold text-[#777168] transition hover:text-[#302b24] data-[state=active]:bg-white data-[state=active]:text-[#84530f] data-[state=active]:shadow-sm">
                  {label}
                </Tabs.Trigger>
              ))}
            </Tabs.List>
          </div>
        </Tabs.Root>
      </MotionItem>

      <MotionItem>
        {filtered.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
            {filtered.map((deck) => <DeckCard key={deck.id} deck={deck} />)}
          </div>
        ) : (
          <div className="learning-card relative overflow-hidden px-6 py-16 text-center">
            <DecorativeLayer variant="empty" />
            <h2 className="text-xl font-extrabold">{myDecks.length === 0 ? "Одоогоор багц алга байна" : "Багц олдсонгүй"}</h2>
            <p className="mt-2 text-sm text-[#777681]">{myDecks.length === 0 ? "Өөрийн багц үүсгэх эсвэл хуваалцсан багцаас хадгалж эхлээрэй." : "Хайлт эсвэл шүүлтүүрээ өөрчилнө үү."}</p>
            {myDecks.length === 0 && (
              <div className="relative mt-5 flex justify-center gap-2">
                <Link href="/deck/create" className="btn-primary px-5 py-3 text-sm">Багц үүсгэх</Link>
                <Link href="/discover" className="btn-secondary px-5 py-3 text-sm">Хуваалцсан багцууд</Link>
              </div>
            )}
          </div>
        )}
      </MotionItem>
    </PageMotion>
  );
}
