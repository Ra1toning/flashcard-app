"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useQueryClient } from "@tanstack/react-query";
import { fetchJson } from "@/lib/http";
import type { Deck } from "@/types";

const routes = [
  "/dashboard",
  "/library",
  "/discover",
  "/deck/create",
  "/test/daily",
  "/profile",
];

type DailyData = {
  stats: { overdue: number; today: number; upcoming: number; total: number };
  recommendation: string;
  streak: number;
};

export default function DevRouteWarmer() {
  const { status } = useSession();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (process.env.NODE_ENV !== "development" || status !== "authenticated") return;

    let cancelled = false;

    const warmRoutes = async () => {
      // Compile likely destinations after the first screen is interactive, not after the first click.
      for (const route of routes) {
        if (cancelled) return;
        await fetch(route, { credentials: "same-origin" }).catch(() => undefined);
      }

      if (cancelled) return;

      const decks = await queryClient.fetchQuery({
        queryKey: ["decks"],
        queryFn: () => fetchJson<{ myDecks: Deck[] }>("/api/decks"),
        staleTime: 45_000,
      }).catch(() => null);

      await Promise.allSettled([
        queryClient.prefetchQuery({
          queryKey: ["daily-review"],
          queryFn: () => fetchJson<DailyData>("/api/test/daily"),
          staleTime: 45_000,
        }),
        queryClient.prefetchQuery({
          queryKey: ["discover", "all"],
          queryFn: () => fetchJson("/api/discover?filter=all&limit=30"),
          staleTime: 45_000,
        }),
        queryClient.prefetchQuery({
          queryKey: ["discover-stats"],
          queryFn: () => fetchJson("/api/discover/stats"),
          staleTime: 2 * 60_000,
        }),
        queryClient.prefetchQuery({
          queryKey: ["user-stats"],
          queryFn: () => fetchJson("/api/stats/user"),
          staleTime: 60_000,
        }),
      ]);

      const firstDeck = decks?.myDecks[0];
      if (firstDeck && !cancelled) {
        await fetch(`/deck/${firstDeck.id}`, { credentials: "same-origin" }).catch(() => undefined);
      }
    };

    const start = () => void warmRoutes();
    const idleId = window.requestIdleCallback(start, { timeout: 1_500 });

    return () => {
      cancelled = true;
      window.cancelIdleCallback(idleId);
    };
  }, [queryClient, status]);

  return null;
}
