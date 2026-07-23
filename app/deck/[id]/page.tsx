"use client";

import { use } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import DeckClient, { type DeckDetail } from "@/app/deck/[id]/DeckClient";
import { StudySkeleton } from "@/components/ui/Skeletons";
import { fetchJson } from "@/lib/http";

export default function DeckPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const deckQuery = useQuery({
    queryKey: ["deck", id],
    queryFn: () => fetchJson<DeckDetail>(`/api/decks/${id}`),
  });

  if (deckQuery.isPending) return <StudySkeleton />;
  if (deckQuery.isError || !deckQuery.data) {
    return (
      <div className="app-shell app-content grid min-h-screen place-items-center px-4">
        <div className="study-set-card w-full max-w-md px-6 py-10 text-center">
          <h1 className="text-lg font-bold">{deckQuery.error?.message || "Багц олдсонгүй"}</h1>
          <div className="mt-5 flex justify-center gap-2">
            <button onClick={() => deckQuery.refetch()} className="btn-primary px-4 py-2.5 text-sm">Дахин оролдох</button>
            <Link href="/library" className="btn-secondary px-4 py-2.5 text-sm">Миний багцууд</Link>
          </div>
        </div>
      </div>
    );
  }

  return <DeckClient deck={deckQuery.data} />;
}
