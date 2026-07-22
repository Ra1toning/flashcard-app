import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

const TRENDING_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;

const deckInclude = {
  author: { select: { name: true } },
  _count: { select: { cards: true, copies: true } },
} satisfies Prisma.DeckInclude;

type DeckWithCounts = Prisma.DeckGetPayload<{ include: typeof deckInclude }>;
type RatingSummary = { average: number; count: number };

async function serializeDecks(decks: DeckWithCounts[]) {
  const ids = decks.map((deck) => deck.id);
  const ratingRows = ids.length
    ? await prisma.rating.groupBy({
        by: ["deckId"],
        where: { deckId: { in: ids } },
        _avg: { value: true },
        _count: { value: true },
      })
    : [];
  const ratingMap = new Map<string, RatingSummary>(
    ratingRows.map((row) => [row.deckId, { average: row._avg.value ?? 0, count: row._count.value }])
  );

  return decks.map((deck) => ({
    id: deck.id,
    name: deck.name,
    emoji: deck.emoji,
    description: deck.description,
    author: deck.author.name || "Нэргүй хэрэглэгч",
    words: deck._count.cards,
    users: deck._count.copies,
    isPublic: deck.isPublic,
    createdAt: deck.createdAt.toISOString(),
    rating: ratingMap.get(deck.id) ?? { average: 0, count: 0 },
  }));
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const requestedFilter = searchParams.get("filter") || "all";
    const filter = new Set(["all", "trending", "popular", "new"]).has(requestedFilter)
      ? requestedFilter
      : "all";
    const requestedLimit = Number.parseInt(searchParams.get("limit") || "20", 10);
    const limit = Number.isFinite(requestedLimit) ? Math.min(50, Math.max(1, requestedLimit)) : 20;

    if (filter === "trending") {
      const since = new Date(Date.now() - TRENDING_WINDOW_MS);
      const grouped = await prisma.deck.groupBy({
        by: ["copiedFromId"],
        where: { copiedFromId: { not: null }, createdAt: { gte: since } },
        _count: { copiedFromId: true },
        orderBy: { _count: { copiedFromId: "desc" } },
        take: limit,
      });

      const orderById = new Map<string, number>();
      grouped.forEach((row, index) => {
        if (row.copiedFromId) orderById.set(row.copiedFromId, index);
      });

      if (orderById.size === 0) {
        return NextResponse.json({ decks: [] });
      }

      const rows = await prisma.deck.findMany({
        where: { id: { in: [...orderById.keys()] }, isPublic: true },
        include: deckInclude,
      });
      rows.sort((a, b) => (orderById.get(a.id) ?? 0) - (orderById.get(b.id) ?? 0));
      return NextResponse.json({ decks: await serializeDecks(rows) });
    }

    const orderBy: Prisma.DeckOrderByWithRelationInput[] =
      filter === "popular"
        ? [{ copies: { _count: "desc" } }, { createdAt: "desc" }]
        : [{ createdAt: "desc" }];

    const decks = await prisma.deck.findMany({
      where: { isPublic: true },
      include: deckInclude,
      orderBy,
      take: limit,
    });

    return NextResponse.json({ decks: await serializeDecks(decks) });
  } catch (error) {
    console.error("Хуваалцсан багцууд ачаалахад алдаа:", error);
    return NextResponse.json(
      { error: "Хуваалцсан багцуудыг ачаалж чадсангүй." },
      { status: 500 }
    );
  }
}
