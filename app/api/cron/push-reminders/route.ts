import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isPushConfigured, sendPush, type PushPayload } from "@/lib/push";
import { logEvent } from "@/lib/analytics";
import { utcStartOfDay, utcTomorrow } from "@/lib/date";
import { computeStreak } from "@/lib/streak";
import { mapWithConcurrency } from "@/lib/concurrency";

export const maxDuration = 60;

const CONCURRENCY = 20;
const DAY_MS = 24 * 60 * 60 * 1000;
const STREAK_LOOKBACK_MS = 60 * DAY_MS;

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Зөвшөөрөлгүй." }, { status: 401 });
  }

  if (!isPushConfigured()) {
    return NextResponse.json({ skipped: true, reason: "push not configured" });
  }

  const now = new Date();
  const todayStart = utcStartOfDay(now);
  const todayKey = todayStart.getTime();
  const tomorrow = utcTomorrow(now);
  const dayIndex = Math.floor(todayKey / DAY_MS);

  const users = await prisma.user.findMany({
    where: { pushSubscriptions: { some: {} } },
    select: {
      id: true,
      pushSubscriptions: { select: { id: true, endpoint: true, p256dh: true, auth: true } },
    },
  });

  const userIds = users.map((user) => user.id);

  const [alreadySentEvents, recentSessions, dueCards] = await Promise.all([
    prisma.event.findMany({
      where: { userId: { in: userIds }, type: "push_sent", createdAt: { gte: todayStart } },
      select: { userId: true },
    }),
    prisma.testSession.findMany({
      where: {
        userId: { in: userIds },
        sessionType: "daily",
        completedAt: { gte: new Date(todayKey - STREAK_LOOKBACK_MS) },
      },
      select: { userId: true, completedAt: true },
    }),
    prisma.card.findMany({
      where: { deck: { authorId: { in: userIds } }, introduced: true, dueDate: { lt: tomorrow } },
      select: { front: true, dueDate: true, deck: { select: { authorId: true } } },
      orderBy: { dueDate: "asc" },
    }),
  ]);

  const alreadySentSet = new Set(alreadySentEvents.map((event) => event.userId));

  const sessionDaysByUser = new Map<string, Set<number>>();
  for (const session of recentSessions) {
    if (!session.completedAt) continue;
    const dayKey = utcStartOfDay(session.completedAt).getTime();
    const days = sessionDaysByUser.get(session.userId) ?? new Set<number>();
    days.add(dayKey);
    sessionDaysByUser.set(session.userId, days);
  }

  const dueByUser = new Map<string, { count: number; overdue: number; earliestFront: string }>();
  for (const card of dueCards) {
    const authorId = card.deck.authorId;
    const isOverdue = card.dueDate < todayStart;
    const existing = dueByUser.get(authorId);
    if (!existing) {
      dueByUser.set(authorId, { count: 1, overdue: isOverdue ? 1 : 0, earliestFront: card.front });
    } else {
      existing.count += 1;
      if (isOverdue) existing.overdue += 1;
    }
  }

  const results = await mapWithConcurrency(users, CONCURRENCY, async (user) => {
    if (alreadySentSet.has(user.id)) return false;

    const sessionDays = sessionDaysByUser.get(user.id);
    if (sessionDays?.has(todayKey)) return false;

    const due = dueByUser.get(user.id);
    if (!due || due.count === 0) return false;

    const streak = computeStreak([...(sessionDays ?? [])], todayKey);

    const templates: Array<PushPayload & { tag: string }> = [];
    if (streak > 0) {
      templates.push({
        tag: "streak",
        title: "Дараалал тасрах гэж байна",
        body: `${streak} өдрийн дараалал өнөөдөр тасарна — 1 минут л хангалттай.`,
        url: "/test/daily?start=1",
      });
    }
    if (due.overdue > 0) {
      templates.push({
        tag: "loss",
        title: "Мартагдах ирмэг дээр",
        body: `${due.overdue} үг мартагдах ирмэг дээр байна. Богинохон давталт хийчих үү?`,
        url: "/test/daily?start=1",
      });
    }
    templates.push({
      tag: "curiosity",
      title: "Санаж байна уу?",
      body: `"${due.earliestFront}" — энэ үгийн утгыг санаж байна уу?`,
      url: "/test/daily?start=1",
    });

    const template = templates[dayIndex % templates.length];

    let delivered = false;
    for (const subscription of user.pushSubscriptions) {
      const result = await sendPush(subscription, template);
      if (result === "ok") delivered = true;
      if (result === "gone") {
        await prisma.pushSubscription.delete({ where: { id: subscription.id } }).catch(() => undefined);
      }
    }

    if (delivered) {
      await logEvent(user.id, "push_sent", { template: template.tag });
    }

    return delivered;
  });

  const sent = results.filter(Boolean).length;

  return NextResponse.json({ success: true, checked: users.length, sent });
}
