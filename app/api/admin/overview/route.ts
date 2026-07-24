import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-guard";
import { utcStartOfDay } from "@/lib/date";
import { computeStreak } from "@/lib/streak";

const DAY_MS = 24 * 60 * 60 * 1000;
const WINDOW_DAYS = 30;

function dayKey(date: Date) {
  return utcStartOfDay(date).getTime();
}

function isoDay(key: number) {
  return new Date(key).toISOString().slice(0, 10);
}

function last30Days(todayKey: number) {
  return Array.from({ length: WINDOW_DAYS }, (_, i) => todayKey - (WINDOW_DAYS - 1 - i) * DAY_MS);
}

const LEARNING_REASON_LABEL: Record<string, string> = {
  topik: "TOPIK шалгалт",
  work: "Ажил",
  kcontent: "K-контент",
  travel: "Аялал",
};

export async function GET() {
  try {
    const admin = await requireAdmin();
    if (!admin) {
      return NextResponse.json({ error: "Хандах эрхгүй." }, { status: 403 });
    }

    const now = new Date();
    const todayStart = utcStartOfDay(now);
    const todayKey = todayStart.getTime();
    const windowStart = new Date(todayKey - (WINDOW_DAYS - 1) * DAY_MS);
    const sevenDaysAgo = new Date(todayKey - 6 * DAY_MS);
    const yesterday = new Date(todayKey - DAY_MS);
    const sevenDaysAgoEligible = new Date(todayKey - 7 * DAY_MS);

    const [
      totalUsers,
      verifiedUsers,
      newUsersToday,
      newUsers7d,
      totalDecks,
      publicDecks,
      totalCards,
      openReports,
      pushSubscribers,
      signupRows,
      sessionRows,
      allSessionDays,
      day1Eligible,
      day1Returned,
      day7Eligible,
      day7Returned,
      learningReasonRows,
      topDeckRows,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { emailVerified: { not: null } } }),
      prisma.user.count({ where: { createdAt: { gte: todayStart } } }),
      prisma.user.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
      prisma.deck.count(),
      prisma.deck.count({ where: { isPublic: true } }),
      prisma.card.count(),
      prisma.report.count({ where: { status: "open" } }),
      prisma.pushSubscription.findMany({ select: { userId: true }, distinct: ["userId"] }),
      prisma.user.findMany({ where: { createdAt: { gte: windowStart } }, select: { createdAt: true } }),
      prisma.testSession.findMany({
        where: { completedAt: { gte: windowStart } },
        select: { userId: true, completedAt: true, sessionType: true },
      }),
      prisma.testSession.findMany({
        where: { completedAt: { not: null } },
        select: { userId: true, completedAt: true },
      }),
      prisma.user.count({ where: { createdAt: { lte: yesterday } } }),
      prisma.event.count({ where: { type: "day1_return" } }),
      prisma.user.count({ where: { createdAt: { lte: sevenDaysAgoEligible } } }),
      prisma.event.count({ where: { type: "day7_return" } }),
      prisma.user.groupBy({ by: ["learningReason"], _count: { _all: true } }),
      prisma.deck.findMany({
        where: { isPublic: true },
        select: {
          id: true,
          name: true,
          author: { select: { name: true, email: true } },
          _count: { select: { cards: true, copies: true } },
        },
        orderBy: { copies: { _count: "desc" } },
        take: 8,
      }),
    ]);

    const days = last30Days(todayKey);

    const signupsByDay = new Map(days.map((d) => [d, 0]));
    for (const row of signupRows) {
      const key = dayKey(row.createdAt);
      if (signupsByDay.has(key)) signupsByDay.set(key, (signupsByDay.get(key) ?? 0) + 1);
    }

    const activeByDay = new Map<number, Set<string>>(days.map((d) => [d, new Set<string>()]));
    const sessionsByDayType = new Map<number, { daily: number; test: number; practice: number }>(
      days.map((d) => [d, { daily: 0, test: 0, practice: 0 }])
    );
    for (const row of sessionRows) {
      if (!row.completedAt) continue;
      const key = dayKey(row.completedAt);
      activeByDay.get(key)?.add(row.userId);
      const bucket = sessionsByDayType.get(key);
      if (bucket) {
        const type = row.sessionType === "daily" || row.sessionType === "test" ? row.sessionType : "practice";
        bucket[type]++;
      }
    }

    const sessions30 = sessionRows;
    const dau = new Set(
      sessions30.filter((s) => s.completedAt && s.completedAt.getTime() >= todayKey).map((s) => s.userId)
    ).size;
    const wau = new Set(
      sessions30.filter((s) => s.completedAt && s.completedAt.getTime() >= sevenDaysAgo.getTime()).map((s) => s.userId)
    ).size;
    const mau = new Set(sessions30.map((s) => s.userId)).size;

    const sessionsByUser = new Map<string, number[]>();
    for (const row of allSessionDays) {
      if (!row.completedAt) continue;
      const key = dayKey(row.completedAt);
      if (!sessionsByUser.has(row.userId)) sessionsByUser.set(row.userId, []);
      sessionsByUser.get(row.userId)!.push(key);
    }
    const streakBuckets = { "0": 0, "1-2": 0, "3-6": 0, "7-29": 0, "30+": 0 };
    for (const [, dayKeys] of sessionsByUser) {
      const streak = computeStreak(dayKeys, todayKey);
      if (streak === 0) streakBuckets["0"]++;
      else if (streak <= 2) streakBuckets["1-2"]++;
      else if (streak <= 6) streakBuckets["3-6"]++;
      else if (streak <= 29) streakBuckets["7-29"]++;
      else streakBuckets["30+"]++;
    }
    streakBuckets["0"] += Math.max(0, totalUsers - sessionsByUser.size);

    const topDeckIds = topDeckRows.map((d) => d.id);
    const ratingAggByDeck = topDeckIds.length
      ? await prisma.rating.groupBy({
          by: ["deckId"],
          where: { deckId: { in: topDeckIds } },
          _avg: { value: true },
          _count: { value: true },
        })
      : [];
    const ratingMap = new Map(ratingAggByDeck.map((r) => [r.deckId, { avg: r._avg.value ?? 0, count: r._count.value }]));

    return NextResponse.json({
      kpis: {
        totalUsers,
        verifiedUsers,
        newUsersToday,
        newUsers7d,
        dau,
        wau,
        mau,
        totalDecks,
        publicDecks,
        totalCards,
        openReports,
        pushSubscribers: pushSubscribers.length,
      },
      signupsByDay: days.map((d) => ({ date: isoDay(d), count: signupsByDay.get(d) ?? 0 })),
      activeByDay: days.map((d) => ({ date: isoDay(d), count: activeByDay.get(d)?.size ?? 0 })),
      sessionsByDay: days.map((d) => ({ date: isoDay(d), ...(sessionsByDayType.get(d) ?? { daily: 0, test: 0, practice: 0 }) })),
      retention: {
        day1Rate: day1Eligible > 0 ? Math.round((day1Returned / day1Eligible) * 100) : 0,
        day7Rate: day7Eligible > 0 ? Math.round((day7Returned / day7Eligible) * 100) : 0,
        day1Eligible,
        day7Eligible,
      },
      streakBuckets: [
        { label: "0", count: streakBuckets["0"] },
        { label: "1-2", count: streakBuckets["1-2"] },
        { label: "3-6", count: streakBuckets["3-6"] },
        { label: "7-29", count: streakBuckets["7-29"] },
        { label: "30+", count: streakBuckets["30+"] },
      ],
      learningReasons: learningReasonRows.map((row) => ({
        reason: row.learningReason ? LEARNING_REASON_LABEL[row.learningReason] ?? row.learningReason : "Тодорхойгүй",
        count: row._count._all,
      })),
      topDecks: topDeckRows.map((deck) => ({
        id: deck.id,
        name: deck.name,
        author: deck.author?.name || deck.author?.email || "Нэргүй",
        cards: deck._count.cards,
        copies: deck._count.copies,
        ratingAvg: ratingMap.get(deck.id)?.avg ?? 0,
        ratingCount: ratingMap.get(deck.id)?.count ?? 0,
      })),
    });
  } catch (error) {
    console.error("Admin overview гаргахад алдаа:", error);
    return NextResponse.json({ error: "Тайланг гаргаж чадсангүй." }, { status: 500 });
  }
}
