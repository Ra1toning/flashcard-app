import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

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
    const filter = new Set(["all", "rating", "popular", "new"]).has(requestedFilter)
      ? requestedFilter
      : "all";
    const requestedLimit = Number.parseInt(searchParams.get("limit") || "20", 10);
    const limit = Number.isFinite(requestedLimit) ? Math.min(50, Math.max(1, requestedLimit)) : 20;

    if (filter === "rating") {
      const grouped = await prisma.rating.groupBy({
        by: ["deckId"],
        where: { deck: { isPublic: true } },
        _avg: { value: true },
        _count: { value: true },
        orderBy: { _avg: { value: "desc" } },
        take: limit,
      });

      if (grouped.length === 0) {
        return NextResponse.json({ decks: [] });
      }

      const orderById = new Map<string, number>();
      grouped.forEach((row, index) => orderById.set(row.deckId, index));

      const rows = await prisma.deck.findMany({
        where: { id: { in: [...orderById.keys()] } },
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
