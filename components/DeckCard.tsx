"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import type { Deck } from "@/types";
import type { DeckDetail } from "@/app/deck/[id]/DeckClient";
import DecorativeLayer from "@/components/ui/DecorativeLayer";
import { fetchJson } from "@/lib/http";

export default function DeckCard({ deck }: { deck: Deck }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const progress = Math.min(100, Math.max(0, deck.progress || 0));
  const hasCards = deck.words > 0;
  const studyHref = hasCards ? `/review/test/${deck.id}` : `/deck/${deck.id}/edit`;
  const detailHref = `/deck/${deck.id}`;

  const prefetchDetail = () => {
    router.prefetch(detailHref);
    void queryClient.prefetchQuery({
      queryKey: ["deck", deck.id],
      queryFn: () => fetchJson<DeckDetail>(`/api/decks/${deck.id}`),
      staleTime: 45_000,
    });
  };

  return (
    <motion.article
      whileHover={{ y: -5 }}
      transition={{ duration: .18 }}
      className="group relative flex h-full min-h-[260px] flex-col overflow-hidden rounded-[20px] border border-white/80 bg-white/82 shadow-[0_8px_28px_rgba(31,42,68,.07)] backdrop-blur-xl transition hover:border-[#c8d5ee] hover:shadow-[0_22px_48px_rgba(31,42,68,.12)]"
    >
      <DecorativeLayer variant="deck" />
      <Link
        href={detailHref}
        onMouseEnter={prefetchDetail}
        onFocus={prefetchDetail}
        className="relative z-10 flex flex-1 flex-col p-5"
      >
        <div className="relative flex items-center justify-between gap-4 text-[11px] font-semibold text-[#858995]">
          <span>{deck.isPublic ? "Бусдад нээлттэй" : "Зөвхөн надад"}</span>
          <span>{deck.words} карт</span>
        </div>

        <div className="relative mt-5">
          <h3 className="line-clamp-2 text-xl font-bold leading-7 tracking-[-.035em] text-[#211f1a] transition group-hover:text-[#84530f]">
            {deck.name}
          </h3>
          <p className="mt-2 line-clamp-2 min-h-10 text-sm leading-5 text-[#777c89]">
            {deck.description || "Энэ багцад тайлбар оруулаагүй байна."}
          </p>
        </div>

        <div className="mt-auto pt-6">
          <div className="mb-2 flex items-center justify-between gap-3 text-xs">
            <span className="font-medium text-[#777c89]">
              {deck.dueToday > 0
                ? `${deck.dueToday} карт давтах`
                : progress > 0
                  ? "Суралцаж байна"
                  : hasCards
                    ? "Эхлэхэд бэлэн"
                    : "Карт нэмэх шаардлагатай"}
            </span>
            <span className="font-semibold text-[#303441]">{progress}%</span>
          </div>
          <div className="h-1 overflow-hidden rounded-full bg-[#eceef2]">
            <div
              className="h-full rounded-full bg-[#b7791f] transition-[width] duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </Link>

      <Link
        href={studyHref}
        className="relative z-10 flex h-12 items-center justify-between border-t border-[#e7dece] px-5 text-sm font-semibold text-[#84530f] transition hover:bg-[#fff6df]"
      >
        <span>{hasCards ? "Суралцах" : "Карт нэмэх"}</span>
        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
      </Link>
    </motion.article>
  );
}
