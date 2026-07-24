import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-guard";

export async function GET(req: Request) {
  try {
    const admin = await requireAdmin();
    if (!admin) {
      return NextResponse.json({ error: "Хандах эрхгүй." }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") || "open";
    const where = status === "all" ? {} : { status };

    const reports = await prisma.report.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 200,
    });

    const deckIds = [...new Set(reports.map((r) => r.deckId).filter((id): id is string => Boolean(id)))];
    const cardIds = [...new Set(reports.filter((r) => r.targetType === "card").map((r) => r.targetId))];
    const reporterIds = [...new Set(reports.map((r) => r.reporterId).filter((id): id is string => Boolean(id)))];

    const [decks, cards, reporters] = await Promise.all([
      deckIds.length ? prisma.deck.findMany({ where: { id: { in: deckIds } }, select: { id: true, name: true } }) : [],
      cardIds.length ? prisma.card.findMany({ where: { id: { in: cardIds } }, select: { id: true, front: true, back: true } }) : [],
      reporterIds.length ? prisma.user.findMany({ where: { id: { in: reporterIds } }, select: { id: true, name: true, email: true } }) : [],
    ]);

    const deckMap = new Map(decks.map((d) => [d.id, d.name]));
    const cardMap = new Map(cards.map((c) => [c.id, `${c.front} → ${c.back}`]));
    const reporterMap = new Map(reporters.map((r) => [r.id, r.name || r.email]));

    return NextResponse.json({
      reports: reports.map((report) => ({
        id: report.id,
        targetType: report.targetType,
        category: report.category,
        detail: report.detail,
        status: report.status,
        createdAt: report.createdAt.toISOString(),
        deckName: report.deckId ? deckMap.get(report.deckId) ?? null : null,
        target: report.targetType === "card" ? cardMap.get(report.targetId) ?? null : deckMap.get(report.targetId) ?? null,
        deckId: report.deckId,
        reporter: report.reporterId ? reporterMap.get(report.reporterId) ?? "Устгагдсан хэрэглэгч" : "Нэвтрээгүй хэрэглэгч",
      })),
    });
  } catch (error) {
    console.error("Report queue гаргахад алдаа:", error);
    return NextResponse.json({ error: "Жагсаалтыг гаргаж чадсангүй." }, { status: 500 });
  }
}
