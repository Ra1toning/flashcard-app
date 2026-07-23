import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isPushConfigured, sendPush, type PushPayload } from "@/lib/push";
import { logEvent } from "@/lib/analytics";
import { utcStartOfDay, utcTomorrow } from "@/lib/date";
import { computeStreak } from "@/lib/streak";

const DAY_MS = 24 * 60 * 60 * 1000;

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
  const tomorrow = utcTomorrow(now);
  const dayIndex = Math.floor(todayStart.getTime() / DAY_MS);

  const users = await prisma.user.findMany({
    where: { pushSubscriptions: { some: {} } },
    select: {
      id: true,
      pushSubscriptions: { select: { id: true, endpoint: true, p256dh: true, auth: true } },
    },
  });

  let sent = 0;

  for (const user of users) {
    const alreadySent = await prisma.event.findFirst({
      where: { userId: user.id, type: "push_sent", createdAt: { gte: todayStart } },
      select: { id: true },
    });
    if (alreadySent) continue;

    const sessions = await prisma.testSession.findMany({
      where: { userId: user.id, sessionType: "daily", completedAt: { not: null } },
      select: { completedAt: true },
      orderBy: { completedAt: "desc" },
      take: 30,
    });
    const completedDates = sessions
      .map((item) => item.completedAt)
      .filter((date): date is Date => Boolean(date));

    if (completedDates.some((date) => date >= todayStart)) continue;

    const dueCards = await prisma.card.findMany({
      where: {
        deck: { authorId: user.id },
        introduced: true,
        dueDate: { lt: tomorrow },
      },
      select: { front: true, dueDate: true },
      orderBy: { dueDate: "asc" },
      take: 20,
    });
    if (dueCards.length === 0) continue;

    const overdue = dueCards.filter((card) => card.dueDate < todayStart).length;
    const dayKeys = [...new Set(completedDates.map((date) => utcStartOfDay(date).getTime()))];
    const streak = computeStreak(dayKeys, todayStart.getTime());

    const templates: Array<PushPayload & { tag: string }> = [];
    if (streak > 0) {
      templates.push({
        tag: "streak",
        title: "Дараалал тасрах гэж байна",
        body: `${streak} өдрийн дараалал өнөөдөр тасарна — 1 минут л хангалттай.`,
        url: "/test/daily?start=1",
      });
    }
    if (overdue > 0) {
      templates.push({
        tag: "loss",
        title: "Мартагдах ирмэг дээр",
        body: `${overdue} үг мартагдах ирмэг дээр байна. Богинохон давталт хийчих үү?`,
        url: "/test/daily?start=1",
      });
    }
    templates.push({
      tag: "curiosity",
      title: "Санаж байна уу?",
      body: `"${dueCards[0].front}" — энэ үгийн утгыг санаж байна уу?`,
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
      sent++;
      await logEvent(user.id, "push_sent", { template: template.tag });
    }
  }

  return NextResponse.json({ success: true, checked: users.length, sent });
}
