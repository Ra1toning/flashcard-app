import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { sendEmail, isEmailConfigured, escapeHtml } from "@/lib/email";
import { REPORT_REASON_VALUES, reportReasonLabel } from "@/lib/report";

export async function POST(req: Request, { params }: { params: Promise<{ cardId: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    const ip = getClientIp(req.headers);
    const limit = rateLimit(`card-report:${ip}`, 15, 10 * 60 * 1000);
    if (!limit.success) {
      return NextResponse.json(
        { error: "Хэт олон мэдээлэл илгээлээ. Түр хүлээгээд дахин оролдоно уу." },
        { status: 429 }
      );
    }

    const { cardId } = await params;
    const body = await req.json().catch(() => ({}));
    const category = typeof body.category === "string" && REPORT_REASON_VALUES.includes(body.category)
      ? body.category
      : null;
    const detail = typeof body.detail === "string" ? body.detail.trim().slice(0, 500) : "";

    if (!category) {
      return NextResponse.json({ error: "Мэдээлэх шалтгаанаа сонгоно уу." }, { status: 400 });
    }

    const card = await prisma.card.findUnique({
      where: { id: cardId },
      select: { id: true, front: true, back: true, deck: { select: { id: true, name: true, isPublic: true, authorId: true } } },
    });

    if (!card || (!card.deck.isPublic && card.deck.authorId !== session?.user?.id)) {
      return NextResponse.json({ error: "Карт олдсонгүй." }, { status: 404 });
    }

    const reporterId = session?.user?.id ?? null;
    const reporter = session?.user?.email ?? "Нэвтрээгүй хэрэглэгч";

    await prisma.report.create({
      data: { targetType: "card", targetId: card.id, deckId: card.deck.id, reporterId, category, detail: detail || null },
    });

    const adminEmail = process.env.ADMIN_EMAIL;
    if (isEmailConfigured() && adminEmail) {
      await sendEmail({
        to: adminEmail,
        subject: `[Nudleye] Карт мэдэгдсэн: ${card.front} → ${card.back}`,
        text: `Card ID: ${card.id}\nБагц: ${card.deck.name}\n${card.front} → ${card.back}\nШалтгаан: ${reportReasonLabel(category)}\nТайлбар: ${detail || "-"}\nМэдэгдсэн: ${reporter}`,
        html: `
          <div style="font-family: system-ui, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px; color: #0f172a;">
            <h2 style="margin: 0 0 16px;">Карт мэдэгдсэн</h2>
            <p><strong>Багц:</strong> ${escapeHtml(card.deck.name)}</p>
            <p><strong>Карт:</strong> ${escapeHtml(card.front)} → ${escapeHtml(card.back)}</p>
            <p><strong>Шалтгаан:</strong> ${escapeHtml(reportReasonLabel(category))}</p>
            <p><strong>Тайлбар:</strong> ${escapeHtml(detail || "-")}</p>
            <p><strong>Мэдэгдсэн:</strong> ${escapeHtml(reporter)}</p>
          </div>
        `,
      });
    } else {
      console.warn(`[report] Card ${card.id} (${card.front} → ${card.back}) — ${category} — ${detail || "-"} by ${reporter}`);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Карт мэдэгдэхэд алдаа:", error);
    return NextResponse.json({ error: "Мэдээллийг илгээж чадсангүй." }, { status: 500 });
  }
}
