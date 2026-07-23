import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { utcStartOfDay } from "@/lib/date";

const DAY_MS = 24 * 60 * 60 * 1000;

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Нэвтрэх шаардлагатай." }, { status: 401 });
    }

    const viewer = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });
    if (viewer?.role !== "ADMIN") {
      return NextResponse.json({ error: "Хандах эрхгүй." }, { status: 403 });
    }

    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        learningReason: true,
        createdAt: true,
        testSessions: { select: { createdAt: true }, orderBy: { createdAt: "desc" }, take: 1 },
        events: { select: { createdAt: true }, orderBy: { createdAt: "desc" }, take: 1 },
      },
      orderBy: { createdAt: "desc" },
      take: 500,
    });

    const todayKey = utcStartOfDay(new Date()).getTime();

    const rows = users.map((user) => {
      const lastSession = user.testSessions[0]?.createdAt ?? null;
      const lastEvent = user.events[0]?.createdAt ?? null;
      const lastActiveAt =
        lastSession && lastEvent
          ? (lastSession > lastEvent ? lastSession : lastEvent)
          : lastSession ?? lastEvent;

      return {
        id: user.id,
        name: user.name,
        email: user.email,
        learningReason: user.learningReason,
        signedUpAt: user.createdAt.toISOString(),
        daysSinceSignup: Math.floor((todayKey - utcStartOfDay(user.createdAt).getTime()) / DAY_MS),
        lastActiveAt: lastActiveAt?.toISOString() ?? null,
        daysSinceLastActive: lastActiveAt
          ? Math.floor((todayKey - utcStartOfDay(lastActiveAt).getTime()) / DAY_MS)
          : null,
      };
    });

    return NextResponse.json({ users: rows });
  } catch (error) {
    console.error("Retention тайлан гаргахад алдаа:", error);
    return NextResponse.json({ error: "Тайланг гаргаж чадсангүй." }, { status: 500 });
  }
}
