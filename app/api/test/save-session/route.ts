import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logEventOnce } from "@/lib/analytics";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Нэвтрэх шаардлагатай." }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (!user) {
      return NextResponse.json({ error: "Бүртгэл олдсонгүй." }, { status: 404 });
    }

    const body = await req.json();
    const {
      deckId,
      sessionType,
      totalCards,
      completed,
      correct,
      incorrect,
      score,
    } = body;

    const allowedSessionTypes = new Set(["practice", "test", "daily"]);
    const normalizedTotal = Number(totalCards);
    const normalizedCompleted = Number(completed);
    const normalizedCorrect = Number(correct);
    const normalizedIncorrect = Number(incorrect);
    const normalizedScore = Number(score);

    if (
      !allowedSessionTypes.has(sessionType) ||
      !Number.isInteger(normalizedTotal) ||
      normalizedTotal <= 0 ||
      !Number.isInteger(normalizedCompleted) ||
      normalizedCompleted < 0 ||
      normalizedCompleted > normalizedTotal ||
      !Number.isInteger(normalizedCorrect) ||
      !Number.isInteger(normalizedIncorrect) ||
      normalizedCorrect < 0 ||
      normalizedIncorrect < 0 ||
      normalizedCorrect + normalizedIncorrect !== normalizedCompleted ||
      !Number.isFinite(normalizedScore) ||
      normalizedScore < 0 ||
      normalizedScore > 100
    ) {
      return NextResponse.json({ error: "Давталтын дүнгийн мэдээлэл буруу байна." }, { status: 400 });
    }

    const normalizedDeckId = typeof deckId === "string" && deckId.trim() ? deckId.trim() : null;

    if (normalizedDeckId) {
      const deck = await prisma.deck.findFirst({
        where: { id: normalizedDeckId, authorId: user.id },
        select: { id: true },
      });

      if (!deck) {
        return NextResponse.json({ error: "Багц олдсонгүй." }, { status: 404 });
      }
    }

    const testSession = await prisma.testSession.create({
      data: {
        userId: user.id,
        deckId: normalizedDeckId || undefined,
        sessionType,
        totalCards: normalizedTotal,
        completed: normalizedCompleted,
        correct: normalizedCorrect,
        incorrect: normalizedIncorrect,
        score: normalizedScore,
        completedAt: new Date(),
      },
    });

    await logEventOnce(user.id, "first_review_completed", { sessionId: testSession.id });

    return NextResponse.json({
      success: true,
      session: testSession,
    });
  } catch (err) {
    console.error("Давталтын дүн хадгалахад алдаа:", err);
    return NextResponse.json({ error: "Давталтын дүнг хадгалж чадсангүй." }, { status: 500 });
  }
}
