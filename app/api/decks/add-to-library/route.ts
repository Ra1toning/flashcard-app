import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Зөвшөөрөлгүй хандалт" }, { status: 401 });
    }

    const { deckId } = await req.json();

    if (!deckId) {
      return NextResponse.json({ error: "Багцын ID шаардлагатай." }, { status: 400 });
    }

    const originalDeck = await prisma.deck.findUnique({
      where: { id: deckId },
      include: {
        cards: true,
      },
    });

    if (!originalDeck) {
      return NextResponse.json({ error: "Багц олдсонгүй." }, { status: 404 });
    }

    if (!originalDeck.isPublic && originalDeck.authorId !== session.user.id) {
      return NextResponse.json({ error: "Энэ багцыг хуулах эрхгүй байна." }, { status: 403 });
    }

    const existingCopy = await prisma.deck.findFirst({
      where: { authorId: session.user.id, copiedFromId: originalDeck.id },
      select: { id: true },
    });

    if (existingCopy) {
      return NextResponse.json({ success: true, deckId: existingCopy.id, alreadySaved: true });
    }

    const newDeck = await prisma.$transaction(async (tx) => {
      const createdDeck = await tx.deck.create({
        data: {
          name: originalDeck.name,
          emoji: originalDeck.emoji,
          description: originalDeck.description,
          isPublic: false,
          authorId: session.user.id,
          copiedFromId: originalDeck.id,
        },
      });

      if (originalDeck.cards.length > 0) {
        await tx.card.createMany({
          data: originalDeck.cards.map((card) => ({
            front: card.front,
            back: card.back,
            deckId: createdDeck.id,
          })),
        });
      }

      await tx.userProgress.create({
        data: {
          userId: session.user.id,
          deckId: createdDeck.id,
          mastered: 0,
          total: originalDeck.cards.length,
          streak: 0,
        },
      });

      return createdDeck;
    });

    return NextResponse.json({
      success: true,
      deckId: newDeck.id
    });

  } catch (error) {
    console.error("Багцыг сан руу нэмэхэд алдаа гарлаа:", error);
    return NextResponse.json(
      { error: "Багцыг сан руу нэмж чадсангүй." },
      { status: 500 }
    );
  }
}
