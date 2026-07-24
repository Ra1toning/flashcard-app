import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const LEARNING_REASONS = new Set(["topik", "work", "kcontent", "travel"]);

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Нэвтрэх шаардлагатай." }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { learningReason: true },
    });

    return NextResponse.json({ learningReason: user?.learningReason ?? null });
  } catch (error) {
    console.error("Бүртгэлийн мэдээлэл авахад алдаа:", error);
    return NextResponse.json({ error: "Мэдээлэл авч чадсангүй." }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Нэвтрэх шаардлагатай." }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const learningReason = typeof body.learningReason === "string" && LEARNING_REASONS.has(body.learningReason)
      ? body.learningReason
      : null;

    if (!learningReason) {
      return NextResponse.json({ error: "Шалтгаан буруу байна." }, { status: 400 });
    }

    await prisma.user.update({
      where: { id: session.user.id },
      data: { learningReason },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Бүртгэлийн мэдээлэл шинэчлэхэд алдаа:", error);
    return NextResponse.json({ error: "Шинэчилж чадсангүй." }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Нэвтрэх шаардлагатай." }, { status: 401 });
    }

    await prisma.user.delete({ where: { id: session.user.id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Бүртгэл устгахад алдаа:", error);
    return NextResponse.json({ error: "Бүртгэлийг устгаж чадсангүй." }, { status: 500 });
  }
}
