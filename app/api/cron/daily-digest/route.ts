import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendEmail, isEmailConfigured, dailyDigestEmail } from "@/lib/email";
import { utcTomorrow } from "@/lib/date";
import { mapWithConcurrency } from "@/lib/concurrency";

export const maxDuration = 60;

const CONCURRENCY = 8;

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Зөвшөөрөлгүй." }, { status: 401 });
  }

  if (!isEmailConfigured()) {
    return NextResponse.json({ skipped: true, reason: "email not configured" });
  }

  const tomorrow = utcTomorrow();
  const reviewUrl = `${process.env.NEXTAUTH_URL || "https://nudleye.vercel.app"}/test/daily`;

  const users = await prisma.user.findMany({
    where: {
      decks: { some: { cards: { some: { dueDate: { lt: tomorrow } } } } },
    },
    select: {
      email: true,
      name: true,
      decks: {
        select: {
          cards: { where: { dueDate: { lt: tomorrow } }, select: { id: true } },
        },
      },
    },
  });

  const results = await mapWithConcurrency(users, CONCURRENCY, async (user) => {
    const dueCount = user.decks.reduce((sum, deck) => sum + deck.cards.length, 0);
    if (dueCount === 0) return false;

    const { subject, html, text } = dailyDigestEmail(user.name, dueCount, reviewUrl);
    return sendEmail({ to: user.email, subject, html, text });
  });

  const sent = results.filter(Boolean).length;

  return NextResponse.json({ success: true, checked: users.length, sent });
}
