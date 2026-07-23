"use client";

import { useQuery } from "@tanstack/react-query";
import Library from "@/components/Library";
import { LibrarySkeleton } from "@/components/ui/Skeletons";
import { fetchJson } from "@/lib/http";
import type { Deck } from "@/types";

export default function LibraryPage() {
  const decksQuery = useQuery({
    queryKey: ["decks"],
    queryFn: () => fetchJson<{ myDecks: Deck[] }>("/api/decks"),
  });

  if (decksQuery.isPending) return <LibrarySkeleton />;

  return (
    <div className="app-shell app-content">
      <main className="page-canvas">
        {decksQuery.isError ? (
          <div className="study-set-card px-5 py-10 text-center text-sm text-[#c84b4b]">
            <p>{decksQuery.error.message}</p>
            <button onClick={() => decksQuery.refetch()} className="btn-secondary mt-4 px-4 py-2 text-sm">Дахин оролдох</button>
          </div>
        ) : (
          <Library myDecks={decksQuery.data?.myDecks ?? []} refreshing={decksQuery.isFetching} />
        )}
      </main>
    </div>
  );
}
