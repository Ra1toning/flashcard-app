import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { utcTomorrow } from "@/lib/date";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ cardId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Нэвтрэх шаардлагатай." }, { status: 401 });
    }

    const { cardId } = await params;
    const card = await prisma.card.findFirst({
      where: {
        id: cardId,
        deck: { authorId: session.user.id },
      },
      select: { id: true, introduced: true },
    });

    if (!card) {
      return NextResponse.json({ error: "Карт олдсонгүй." }, { status: 404 });
    }

    if (!card.introduced) {
      await prisma.card.update({
        where: { id: cardId },
        data: { introduced: true, dueDate: utcTomorrow() },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Картыг танилцуулахад алдаа:", error);
    return NextResponse.json({ error: "Картыг танилцуулж чадсангүй." }, { status: 500 });
  }
}
