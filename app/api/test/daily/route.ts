import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { utcStartOfDay } from "@/lib/date";
import { computeStreak, getCompletedDayKeys } from "@/lib/streak";
import { logEventOnce, logStreakBroken } from "@/lib/analytics";

const DAY_MS = 24 * 60 * 60 * 1000;
const DAILY_CARD_LIMIT = 50;

function statePriority(repetition: number, interval: number) {
  if (repetition === 0) return { state: "new" as const, priority: 3 };
  if (interval === 1 && repetition > 2) return { state: "lapse" as const, priority: 0 };
  if (repetition <= 2) return { state: "learning" as const, priority: 1 };
  return { state: "review" as const, priority: 2 };
}

function getRecommendation(overdue: number, today: number) {
  if (overdue > 20) return "Давтах цаг нь болсон хэдэн үг байна. Эхлээд тэдгээрийг хамтдаа бататгая.";
  if (today > 30) return "Өнөөдрийн даалгавар олон тул богино хэсгүүдэд хувааж сураарай.";
  if (overdue === 0 && today === 0) return "Өнөөдрийн даалгавар алга. Дараагийн даалгаварыг урьдчилж бэлмээр байна уу?.";
  return "Бэлдэх цаг нь болсон үгсээсээ эхлээд өнөөдрийн бэлтгэлээ эхлээрэй.";
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Нэвтрэх шаардлагатай." }, { status: 401 });
    }

    const today = utcStartOfDay(new Date());
    const tomorrow = new Date(today.getTime() + DAY_MS);

    const cards = await prisma.card.findMany({
      where: {
        deck: { authorId: session.user.id },
        dueDate: { lt: tomorrow },
      },
      select: {
        id: true,
        front: true,
        back: true,
        easeFactor: true,
        interval: true,
        repetition: true,
        introduced: true,
        dueDate: true,
        deckId: true,
      },
      orderBy: { dueDate: "asc" },
    });

    let overdue = 0;
    let dueToday = 0;

    const rankedCards = cards.map((card) => {
      const dueDay = utcStartOfDay(card.dueDate);
      const { state, priority } = statePriority(card.repetition, card.interval);
      const dayOffset = Math.floor((dueDay.getTime() - today.getTime()) / DAY_MS);

      if (card.dueDate < today) overdue++;
      else dueToday++;

      return {
        ...card,
        dueDate: card.dueDate.toISOString(),
        state,
        urgency: dayOffset * 10 + priority,
      };
    });

    rankedCards.sort((a, b) => a.urgency - b.urgency);

    const completedDays = await getCompletedDayKeys(session.user.id);

    const streak = computeStreak(completedDays, today.getTime());

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { createdAt: true },
    });
    if (user) {
      const daysSinceSignup = Math.floor((today.getTime() - utcStartOfDay(user.createdAt).getTime()) / DAY_MS);
      if (daysSinceSignup === 1) await logEventOnce(session.user.id, "day1_return");
      if (daysSinceSignup === 7) await logEventOnce(session.user.id, "day7_return");
    }
    if (streak === 0 && completedDays.length > 0) {
      await logStreakBroken(session.user.id, completedDays[0]);
    }

    return NextResponse.json({
      cards: rankedCards.slice(0, DAILY_CARD_LIMIT),
      stats: {
        overdue,
        today: dueToday,
        total: overdue + dueToday,
      },
      streak,
      recommendation: getRecommendation(overdue, dueToday),
    });
  } catch (error) {
    console.error("Өдрийн давталт ачаалахад алдаа:", error);
    return NextResponse.json({ error: "Өдрийн давталтыг ачаалж чадсангүй." }, { status: 500 });
  }
}
