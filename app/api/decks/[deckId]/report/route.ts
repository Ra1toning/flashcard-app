import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { sendEmail, isEmailConfigured, escapeHtml } from "@/lib/email";
import { REPORT_REASON_VALUES, reportReasonLabel } from "@/lib/report";

export async function POST(req: Request, { params }: { params: Promise<{ deckId: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    const ip = getClientIp(req.headers);
    const limit = rateLimit(`deck-report:${ip}`, 8, 10 * 60 * 1000);
    if (!limit.success) {
      return NextResponse.json(
        { error: "Хэт олон мэдээлэл илгээлээ. Түр хүлээгээд дахин оролдоно уу." },
        { status: 429 }
      );
    }

    const { deckId } = await params;
    const body = await req.json().catch(() => ({}));
    const category = typeof body.category === "string" && REPORT_REASON_VALUES.includes(body.category)
      ? body.category
      : null;
    const detail = typeof body.detail === "string" ? body.detail.trim().slice(0, 500) : "";

    if (!category) {
      return NextResponse.json({ error: "Мэдээлэх шалтгаанаа сонгоно уу." }, { status: 400 });
    }

    const deck = await prisma.deck.findUnique({
      where: { id: deckId },
      select: { id: true, name: true, isPublic: true },
    });

    if (!deck || !deck.isPublic) {
      return NextResponse.json({ error: "Багц олдсонгүй." }, { status: 404 });
    }

    const reporterId = session?.user?.id ?? null;
    const reporter = session?.user?.email ?? "Нэвтрээгүй хэрэглэгч";

    await prisma.report.create({
      data: { targetType: "deck", targetId: deck.id, deckId: deck.id, reporterId, category, detail: detail || null },
    });

    const adminEmail = process.env.ADMIN_EMAIL;
    if (isEmailConfigured() && adminEmail) {
      await sendEmail({
        to: adminEmail,
        subject: `[Nudleye] Багц мэдэгдсэн: ${deck.name}`,
        text: `Deck ID: ${deck.id}\nНэр: ${deck.name}\nШалтгаан: ${reportReasonLabel(category)}\nТайлбар: ${detail || "-"}\nМэдэгдсэн: ${reporter}`,
        html: `
          <div style="font-family: system-ui, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px; color: #0f172a;">
            <h2 style="margin: 0 0 16px;">Багц мэдэгдсэн</h2>
            <p><strong>Нэр:</strong> ${escapeHtml(deck.name)}</p>
            <p><strong>Шалтгаан:</strong> ${escapeHtml(reportReasonLabel(category))}</p>
            <p><strong>Тайлбар:</strong> ${escapeHtml(detail || "-")}</p>
            <p><strong>Мэдэгдсэн:</strong> ${escapeHtml(reporter)}</p>
          </div>
        `,
      });
    } else {
      console.warn(`[report] Deck ${deck.id} (${deck.name}) — ${category} — ${detail || "-"} by ${reporter}`);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Багц мэдэгдэхэд алдаа:", error);
    return NextResponse.json({ error: "Мэдээллийг илгээж чадсангүй." }, { status: 500 });
  }
}
