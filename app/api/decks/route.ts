import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logEvent } from "@/lib/analytics";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Зөвшөөрөлгүй хандалт" }, { status: 401 });
    }

    const body = await req.json();
    const { name, emoji, description, isPublic, words } = body;

    const normalizedName = typeof name === "string" ? name.trim() : "";
    const normalizedDescription = typeof description === "string" ? description.trim() : "";
    const normalizedWords = Array.isArray(words)
      ? words.map((word) => ({
          korean: typeof word?.korean === "string" ? word.korean.trim() : "",
          mongolian: typeof word?.mongolian === "string" ? word.mongolian.trim() : "",
        }))
      : [];

    if (!normalizedName || normalizedName.length > 80) {
      return NextResponse.json(
        { error: "Багцын нэр 1-80 тэмдэгт байна." },
        { status: 400 }
      );
    }

    if (normalizedDescription.length > 300) {
      return NextResponse.json({ error: "Тайлбар 300 тэмдэгтээс урт байж болохгүй." }, { status: 400 });
    }

    if (normalizedWords.length > 500 || normalizedWords.some((word) => !word.korean || !word.mongolian || word.korean.length > 200 || word.mongolian.length > 200)) {
      return NextResponse.json(
        { error: "Карт бүрийн хоёр талыг 200 тэмдэгт хүртэл бөглөж, нэг багцад 500 хүртэл карт оруулна уу." },
        { status: 400 }
      );
    }

    if (normalizedWords.length > 0) {
      const deck = await prisma.deck.create({
        data: {
          name: normalizedName,
          description: normalizedDescription,
          emoji: typeof emoji === "string" && emoji.trim() ? emoji.trim() : "📚",
          isPublic: isPublic === true,
          authorId: session.user.id,
          cards: {
            create: normalizedWords.map((word) => ({
              front: word.korean,
              back: word.mongolian,
              easeFactor: 2.5,
              interval: 1,
              repetition: 0,
              dueDate: new Date(),
            })),
          },
          progress: {
            create: {
              userId: session.user.id,
              mastered: 0,
              total: normalizedWords.length,
              streak: 0,
            },
          },
        },
        include: {
          cards: true,
        },
      });

      await logEvent(session.user.id, "deck_created", { deckId: deck.id, cards: normalizedWords.length });
      if (deck.isPublic) await logEvent(session.user.id, "deck_published", { deckId: deck.id });

      return NextResponse.json({
        id: deck.id,
        success: true,
        message: "Багц амжилттай үүсгэгдлээ.",
      });
    }

    const deck = await prisma.deck.create({
      data: {
        name: normalizedName,
        emoji: typeof emoji === "string" && emoji.trim() ? emoji.trim() : "📚",
        description: normalizedDescription || null,
        isPublic: isPublic === true,
        authorId: session.user.id,
        progress: {
          create: {
            userId: session.user.id,
            mastered: 0,
            total: 0,
            streak: 0,
          },
        },
      },
    });

    await logEvent(session.user.id, "deck_created", { deckId: deck.id, cards: 0 });
    if (deck.isPublic) await logEvent(session.user.id, "deck_published", { deckId: deck.id });

    return NextResponse.json({
      id: deck.id,
      success: true,
      message: "Хоосон багц амжилттай үүсгэгдлээ."
    });
  } catch (err) {
    console.error("Багц үүсгэхэд алдаа:", err);
    return NextResponse.json(
      { error: "Багц үүсгэж чадсангүй." },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Зөвшөөрөлгүй хандалт" }, { status: 401 });
    }

    const now = new Date();

    const decks = await prisma.deck.findMany({
      where: {
        authorId: session.user.id,
      },
      include: {
        _count: {
          select: {
            cards: true,
          },
        },
        cards: {
          where: {
            dueDate: { lte: now },
          },
          select: {
            id: true,
          },
        },
        progress: {
          where: {
            userId: session.user.id,
          },
        },
      },
      orderBy: {
        updatedAt: "desc",
      },
    });

    const transformedDecks = decks.map((deck) => {
      const progress = deck.progress[0];
      const totalCards = deck._count.cards;
      const dueToday = deck.cards.length;

      return {
        id: deck.id,
        name: deck.name,
        emoji: deck.emoji,
        description: deck.description,
        words: totalCards,
        mastered: progress?.mastered || 0,
        progress: totalCards > 0 
          ? Math.round(((progress?.mastered || 0) / totalCards) * 100)
          : 0,
        streak: progress?.streak || 0,
        dueToday: dueToday,
        author: session.user.name || "You",
        isPublic: deck.isPublic,
        createdAt: deck.createdAt.toISOString(),
        updatedAt: deck.updatedAt.toISOString(),
      };
    });

    return NextResponse.json({
      myDecks: transformedDecks,
      success: true,
    });
  } catch (error) {
    console.error("Цомог авахад алдаа:", error);
    return NextResponse.json(
      { error: "Цомог авахад амжилтгүй" },
      { status: 500 }
    );
  }
}
