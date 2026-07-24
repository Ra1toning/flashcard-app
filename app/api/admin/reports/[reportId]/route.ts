import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-guard";

const ALLOWED_STATUSES = new Set(["open", "reviewed", "dismissed"]);

export async function PATCH(req: Request, { params }: { params: Promise<{ reportId: string }> }) {
  try {
    const admin = await requireAdmin();
    if (!admin) {
      return NextResponse.json({ error: "Хандах эрхгүй." }, { status: 403 });
    }

    const { reportId } = await params;
    const body = await req.json().catch(() => ({}));
    const status = typeof body.status === "string" && ALLOWED_STATUSES.has(body.status) ? body.status : null;
    if (!status) {
      return NextResponse.json({ error: "Төлөв буруу байна." }, { status: 400 });
    }

    const report = await prisma.report.update({
      where: { id: reportId },
      data: { status },
    });

    return NextResponse.json({ success: true, report });
  } catch (error) {
    console.error("Мэдэгдэл шинэчлэхэд алдаа:", error);
    return NextResponse.json({ error: "Шинэчилж чадсангүй." }, { status: 500 });
  }
}
