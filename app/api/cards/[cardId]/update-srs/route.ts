import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { MASTERY_INTERVAL } from "@/lib/srs";

function applySM2(
  easeFactor: number,
  interval: number,
  repetition: number,
  quality: number
) {
  let nextEaseFactor = easeFactor;
  let nextInterval = interval;
  let nextRepetition = repetition;

  if (quality < 3) {
    nextRepetition = 0;
    nextInterval = 1;
  } else {
    nextRepetition += 1;
    if (nextRepetition === 1) nextInterval = 1;
    else if (nextRepetition === 2) nextInterval = 6;
    else nextInterval = Math.max(1, Math.round(interval * easeFactor));
  }

  nextEaseFactor +=
    0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02);
  nextEaseFactor = Math.max(1.3, nextEaseFactor);

  const dueDate = new Date();
  dueDate.setUTCDate(dueDate.getUTCDate() + nextInterval);

  return {
    easeFactor: nextEaseFactor,
    interval: nextInterval,
    repetition: nextRepetition,
    dueDate,
  };
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ cardId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Нэвтрэх шаардлагатай." }, { status: 401 });
    }

    const body = await req.json();
    if (typeof body.correct !== "boolean") {
      return NextResponse.json({ error: "Давталтын дүн буруу байна." }, { status: 400 });
    }

    const { cardId } = await params;
    const card = await prisma.card.findFirst({
      where: {
        id: cardId,
        deck: { authorId: session.user.id },
      },
    });

    if (!card) {
      return NextResponse.json({ error: "Карт олдсонгүй." }, { status: 404 });
    }

    const requestedQuality =
      typeof body.quality === "number" && Number.isFinite(body.quality)
        ? Math.round(body.quality)
        : body.correct
          ? 4
          : 0;
    const quality = body.correct
      ? Math.min(5, Math.max(3, requestedQuality))
      : Math.min(2, Math.max(0, requestedQuality));

    const srsUpdate = applySM2(
      card.easeFactor,
      card.interval,
      card.repetition,
      quality
    );

    const updatedCard = await prisma.$transaction(async (tx) => {
      const updated = await tx.card.update({
        where: { id: cardId },
        data: { ...srsUpdate, introduced: true },
      });

      const [total, mastered] = await Promise.all([
        tx.card.count({ where: { deckId: card.deckId } }),
        tx.card.count({ where: { deckId: card.deckId, interval: { gte: MASTERY_INTERVAL } } }),
      ]);

      await tx.userProgress.upsert({
        where: {
          userId_deckId: {
            userId: session.user.id,
            deckId: card.deckId,
          },
        },
        create: {
          userId: session.user.id,
          deckId: card.deckId,
          mastered,
          total,
          streak: 0,
          lastStudy: new Date(),
        },
        update: {
          mastered,
          total,
          lastStudy: new Date(),
        },
      });

      return updated;
    });

    return NextResponse.json({ card: updatedCard });
  } catch (error) {
    console.error("Картын давталтын төлөв шинэчлэхэд алдаа:", error);
    return NextResponse.json({ error: "Картын давталтын төлөв шинэчилж чадсангүй." }, { status: 500 });
  }
}
