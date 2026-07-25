import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { computeStreak, getCompletedDayKeys } from "@/lib/streak";
import { isMastered } from "@/lib/srs";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Нэвтрэх шаардлагатай." }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        decks: {
          select: {
            cards: { select: { interval: true } },
          },
        },
        testSessions: {
          select: {
            createdAt: true,
            correct: true,
            totalCards: true,
          },
          orderBy: {
            createdAt: "desc",
          },
          take: 120,
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "Бүртгэл олдсонгүй." }, { status: 404 });
    }

    let totalWords = 0;
    let mastered = 0;

    for (const deck of user.decks) {
      totalWords += deck.cards.length;
      mastered += deck.cards.filter((c) => isMastered(c.interval)).length;
    }

    const completedDays = await getCompletedDayKeys(session.user.id);
    const streak = computeStreak(completedDays);

    const recentTests = user.testSessions.slice(0, 10);
    let totalCorrect = 0;
    let totalAttempts = 0;

    for (const test of recentTests) {
      totalCorrect += test.correct;
      totalAttempts += test.totalCards;
    }

    const accuracy = totalAttempts > 0
      ? Math.round((totalCorrect / totalAttempts) * 100)
      : 0;

    return NextResponse.json({
      totalWords,
      mastered,
      streak,
      accuracy,
    });
  } catch (err) {
    console.error("Хэрэглэгчийн үзүүлэлт авахад алдаа:", err);
    return NextResponse.json({ error: "Суралцах үзүүлэлтийг авч чадсангүй." }, { status: 500 });
  }
}
