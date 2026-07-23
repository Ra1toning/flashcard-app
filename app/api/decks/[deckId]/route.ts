import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logEvent } from "@/lib/analytics";

type RouteContext = {
  params: Promise<{
    deckId: string;
  }>;
};

type NormalizedCard = {
  id?: string;
  korean: string;
  mongolian: string;
};

export async function GET(req: Request, context: RouteContext) {
  try {
    const session = await getServerSession(authOptions);

    const { deckId } = await context.params;

    if (!deckId) {
      return NextResponse.json({ error: "Багцын ID шаардлагатай." }, { status: 400 });
    }

    const deck = await prisma.deck.findUnique({
      where: {
        id: deckId,
      },
      include: {
        author: {
          select: {
            name: true,
            image: true,
            _count: { select: { decks: true } },
          },
        },
        cards: {
          orderBy: {
            createdAt: "asc",
          },
        },
        progress: {
          where: {
            userId: session?.user?.id ?? "",
          },
        },
      },
    });

    if (!deck) {
      return NextResponse.json({ error: "Багц олдсонгүй." }, { status: 404 });
    }

    const isOwner = deck.authorId === session?.user?.id;
    const isPublic = deck.isPublic;

    if (!isOwner && !isPublic) {
      return NextResponse.json({ error: "Энэ багцыг харах эрхгүй байна." }, { status: 403 });
    }

    const [ratingAgg, myRating] = await Promise.all([
      prisma.rating.aggregate({
        where: { deckId },
        _avg: { value: true },
        _count: { value: true },
      }),
      session?.user?.id
        ? prisma.rating.findUnique({
            where: { userId_deckId: { userId: session.user.id, deckId } },
            select: { value: true },
          })
        : Promise.resolve(null),
    ]);

    const progress = deck.progress[0];
    const totalCards = deck.cards.length;

    const deckDetail = {
      id: deck.id,
      name: deck.name,
      description: deck.description || "",
      emoji: deck.emoji,
      words: totalCards,
      mastered: progress?.mastered || 0,
      progress:
        totalCards > 0
          ? Math.round(((progress?.mastered || 0) / totalCards) * 100)
          : 0,
      streak: progress?.streak || 0,
      creator: {
        name: deck.author?.name || "Нэргүй хэрэглэгч",
        avatar: deck.author?.image || "",
        decksCreated: deck.author?._count.decks ?? 0,
      },
      createdAt: deck.createdAt.toISOString(),
      wordsList: deck.cards.map((card) => ({
        id: card.id,
        korean: card.front,
        mongolian: card.back,
        mastered: card.interval >= 21,
        dueDate: card.dueDate.toISOString(),
        easeFactor: card.easeFactor,
        interval: card.interval,
        repetition: card.repetition,
      })),
      isOwner,
      isPublic: deck.isPublic,
      rating: {
        average: ratingAgg._avg.value ?? 0,
        count: ratingAgg._count.value,
        mine: myRating?.value ?? 0,
      },
    };

    return NextResponse.json(deckDetail);
  } catch (error) {
    console.error("Багцын мэдээлэл авахад алдаа:", error);
    return NextResponse.json(
      { error: "Багцын мэдээллийг авч чадсангүй." },
      { status: 500 }
    );
  }
}

export async function PATCH(req: Request, context: RouteContext) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Нэвтрэх шаардлагатай." }, { status: 401 });
    }

    const { deckId } = await context.params;

    if (!deckId) {
      return NextResponse.json({ error: "Багцын ID шаардлагатай." }, { status: 400 });
    }

    const body = await req.json();
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const description = typeof body.description === "string" ? body.description.trim() : "";
    const emoji = typeof body.emoji === "string" && body.emoji.trim() ? body.emoji.trim() : "📚";
    const cards: NormalizedCard[] | null = Array.isArray(body.cards)
      ? body.cards.map((card: { id?: unknown; korean?: unknown; mongolian?: unknown }) => ({
          id: typeof card.id === "string" ? card.id : undefined,
          korean: typeof card.korean === "string" ? card.korean.trim() : "",
          mongolian: typeof card.mongolian === "string" ? card.mongolian.trim() : "",
        }))
      : null;

    if (!name || name.length > 80) {
      return NextResponse.json({ error: "Багцын нэр 1-80 тэмдэгт байна." }, { status: 400 });
    }
    if (description.length > 300) {
      return NextResponse.json({ error: "Тайлбар 300 тэмдэгтээс урт байж болохгүй." }, { status: 400 });
    }
    if (cards && (cards.length > 500 || cards.some((card) => !card.korean || !card.mongolian || card.korean.length > 200 || card.mongolian.length > 200))) {
      return NextResponse.json(
        { error: "Карт бүрийн хоёр талыг 200 тэмдэгт хүртэл бөглөж, нэг багцад 500 хүртэл карт оруулна уу." },
        { status: 400 }
      );
    }

    const deck = await prisma.deck.findUnique({
      where: { id: deckId },
      include: {
        cards: true,
        progress: {
          where: { userId: session.user.id },
        },
      },
    });

    if (!deck || deck.authorId !== session.user.id) {
      return NextResponse.json({ error: "Энэ багцыг засах эрхгүй байна." }, { status: 403 });
    }

    await prisma.$transaction(async (tx) => {
      await tx.deck.update({
        where: { id: deckId },
        data: {
          name,
          description,
          emoji,
          isPublic: body.isPublic === true,
        },
      });

      if (cards) {
        const existingCardIds = deck.cards.map((c) => c.id);
        const newCards = cards.filter((card) =>
          !card.id || !existingCardIds.includes(card.id)
        );

        if (newCards.length > 0) {
          await tx.card.createMany({
            data: newCards.map((card) => ({
              deckId,
              front: card.korean,
              back: card.mongolian,
              easeFactor: 2.5,
              interval: 0,
              repetition: 0,
              dueDate: new Date(),
            })),
          });
        }

        const updatedCardIds = cards
          .filter((card) => card.id && existingCardIds.includes(card.id))
          .map((card) => card.id as string);

        const cardsToDelete = existingCardIds.filter(
          (id) => !updatedCardIds.includes(id)
        );

        if (cardsToDelete.length > 0) {
          await tx.card.deleteMany({
            where: {
              id: { in: cardsToDelete },
            },
          });
        }

        const cardsToUpdate = cards.filter((card) =>
          card.id && existingCardIds.includes(card.id)
        );

        for (const card of cardsToUpdate) {
          const original = deck.cards.find((existing) => existing.id === card.id);
          const contentChanged = original && (original.front !== card.korean || original.back !== card.mongolian);
          await tx.card.update({
            where: { id: card.id },
            data: contentChanged
              ? { front: card.korean, back: card.mongolian, easeFactor: 2.5, interval: 1, repetition: 0, dueDate: new Date() }
              : { front: card.korean, back: card.mongolian },
          });
        }

        const mastered = await tx.card.count({ where: { deckId, interval: { gte: 21 } } });

        await tx.userProgress.upsert({
          where: {
            userId_deckId: {
              userId: session.user.id,
              deckId,
            },
          },
          create: {
            userId: session.user.id,
            deckId,
            mastered,
            total: cards.length,
            streak: 0,
          },
          update: {
            total: cards.length,
            mastered,
          },
        });
      }
    });

    if (!deck.isPublic && body.isPublic === true) {
      await logEvent(session.user.id, "deck_published", { deckId });
    }

    const updatedDeck = await prisma.deck.findUnique({
      where: { id: deckId },
      include: {
        cards: true,
      },
    });

    return NextResponse.json({
      success: true,
      deck: updatedDeck,
    });
  } catch (error) {
    console.error("Багц шинэчлэхэд алдаа:", error);
    return NextResponse.json(
      { error: "Багцыг шинэчилж чадсангүй." },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request, context: RouteContext) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Нэвтрэх шаардлагатай." }, { status: 401 });
    }

    const { deckId } = await context.params;

    if (!deckId) {
      return NextResponse.json({ error: "Багцын ID шаардлагатай." }, { status: 400 });
    }

    const deck = await prisma.deck.findUnique({
      where: { id: deckId },
    });

    if (!deck || deck.authorId !== session.user.id) {
      return NextResponse.json({ error: "Энэ багцыг устгах эрхгүй байна." }, { status: 403 });
    }

    await prisma.deck.delete({
      where: { id: deckId },
    });

    return NextResponse.json({
      success: true,
      message: "Багц устгагдлаа.",
    });
  } catch (error) {
    console.error("Багц устгахад алдаа:", error);
    return NextResponse.json(
      { error: "Багцыг устгаж чадсангүй." },
      { status: 500 }
    );
  }
}
