import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export type AppEventType =
  | "signup"
  | "first_review_completed"
  | "day1_return"
  | "day7_return"
  | "deck_created"
  | "deck_published"
  | "streak_broken"
  | "push_sent";

export async function logEvent(userId: string, type: AppEventType, metadata?: Prisma.InputJsonValue) {
  try {
    await prisma.event.create({ data: { userId, type, metadata } });
  } catch (error) {
    console.error("[analytics] event бүртгэхэд алдаа:", type, error);
  }
}

export async function logEventOnce(userId: string, type: AppEventType, metadata?: Prisma.InputJsonValue) {
  try {
    const existing = await prisma.event.findFirst({ where: { userId, type }, select: { id: true } });
    if (existing) return;
    await prisma.event.create({ data: { userId, type, metadata } });
  } catch (error) {
    console.error("[analytics] event бүртгэхэд алдаа:", type, error);
  }
}

export async function logStreakBroken(userId: string, lastActiveDay: number) {
  try {
    const existing = await prisma.event.findFirst({
      where: {
        userId,
        type: "streak_broken",
        metadata: { path: ["lastActiveDay"], equals: lastActiveDay },
      },
      select: { id: true },
    });
    if (existing) return;
    await prisma.event.create({ data: { userId, type: "streak_broken", metadata: { lastActiveDay } } });
  } catch (error) {
    console.error("[analytics] streak_broken бүртгэхэд алдаа:", error);
  }
}
