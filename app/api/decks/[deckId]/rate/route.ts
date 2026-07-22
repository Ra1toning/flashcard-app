import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request, { params }: { params: Promise<{ deckId: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Үнэлгээ өгөхийн тулд нэвтэрнэ үү." }, { status: 401 });
    }

    const { deckId } = await params;
    const body = await req.json().catch(() => ({}));
    const value = Number(body.value);
    if (!Number.isInteger(value) || value < 1 || value > 5) {
      return NextResponse.json({ error: "Үнэлгээ 1-5 хооронд байна." }, { status: 400 });
    }

    const deck = await prisma.deck.findUnique({
      where: { id: deckId },
      select: { id: true, isPublic: true, authorId: true },
    });

    if (!deck || !deck.isPublic) {
      return NextResponse.json({ error: "Багц олдсонгүй." }, { status: 404 });
    }
    if (deck.authorId === session.user.id) {
      return NextResponse.json({ error: "Өөрийн багцад үнэлгээ өгөх боломжгүй." }, { status: 403 });
    }

    await prisma.rating.upsert({
      where: { userId_deckId: { userId: session.user.id, deckId } },
      create: { userId: session.user.id, deckId, value },
      update: { value },
    });

    const agg = await prisma.rating.aggregate({
      where: { deckId },
      _avg: { value: true },
      _count: { value: true },
    });

    return NextResponse.json({
      success: true,
      rating: {
        average: agg._avg.value ?? 0,
        count: agg._count.value,
        mine: value,
      },
    });
  } catch (error) {
    console.error("Үнэлгээ хадгалахад алдаа:", error);
    return NextResponse.json({ error: "Үнэлгээг хадгалж чадсангүй." }, { status: 500 });
  }
}
