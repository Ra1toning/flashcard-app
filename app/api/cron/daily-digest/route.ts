import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendEmail, isEmailConfigured, dailyDigestEmail } from "@/lib/email";

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Зөвшөөрөлгүй." }, { status: 401 });
  }

  if (!isEmailConfigured()) {
    return NextResponse.json({ skipped: true, reason: "email not configured" });
  }

  const now = new Date();
  const reviewUrl = `${process.env.NEXTAUTH_URL || "https://nudleye.vercel.app"}/test/daily`;

  const users = await prisma.user.findMany({
    where: {
      decks: { some: { cards: { some: { dueDate: { lte: now } } } } },
    },
    select: {
      email: true,
      name: true,
      decks: {
        select: {
          cards: { where: { dueDate: { lte: now } }, select: { id: true } },
        },
      },
    },
  });

  let sent = 0;
  for (const user of users) {
    const dueCount = user.decks.reduce((sum, deck) => sum + deck.cards.length, 0);
    if (dueCount === 0) continue;

    const { subject, html, text } = dailyDigestEmail(user.name, dueCount, reviewUrl);
    const ok = await sendEmail({ to: user.email, subject, html, text });
    if (ok) sent++;
  }

  return NextResponse.json({ success: true, checked: users.length, sent });
}
