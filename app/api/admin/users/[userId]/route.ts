import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-guard";

export async function PATCH(req: Request, { params }: { params: Promise<{ userId: string }> }) {
  try {
    const admin = await requireAdmin();
    if (!admin) {
      return NextResponse.json({ error: "Хандах эрхгүй." }, { status: 403 });
    }

    const { userId } = await params;
    const body = await req.json().catch(() => ({}));

    if (body.action === "verify") {
      const user = await prisma.user.update({
        where: { id: userId },
        data: { emailVerified: new Date() },
        select: { id: true, emailVerified: true },
      });
      return NextResponse.json({ success: true, user });
    }

    if (body.action === "unverify") {
      const user = await prisma.user.update({
        where: { id: userId },
        data: { emailVerified: null },
        select: { id: true, emailVerified: true },
      });
      return NextResponse.json({ success: true, user });
    }

    if (body.action === "setRole") {
      const role = body.role === "ADMIN" ? "ADMIN" : body.role === "USER" ? "USER" : null;
      if (!role) {
        return NextResponse.json({ error: "Эрх буруу байна." }, { status: 400 });
      }
      if (userId === admin.id && role === "USER") {
        return NextResponse.json({ error: "Өөрийн админ эрхээ бууруулах боломжгүй." }, { status: 400 });
      }
      const user = await prisma.user.update({
        where: { id: userId },
        data: { role },
        select: { id: true, role: true },
      });
      return NextResponse.json({ success: true, user });
    }

    return NextResponse.json({ error: "Үйлдэл буруу байна." }, { status: 400 });
  } catch (error) {
    console.error("Хэрэглэгч шинэчлэхэд алдаа:", error);
    return NextResponse.json({ error: "Шинэчилж чадсангүй." }, { status: 500 });
  }
}
