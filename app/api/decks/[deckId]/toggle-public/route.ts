import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logEvent } from "@/lib/analytics";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ deckId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Зөвшөөрөлгүй хандалт" }, { status: 401 });
    }

    const { deckId } = await params;

    const deck = await prisma.deck.findUnique({
      where: { id: deckId },
    });

    if (!deck) {
      return NextResponse.json({ error: "Дек олдсонгүй" }, { status: 404 });
    }

    if (deck.authorId !== session.user.id) {
      return NextResponse.json({ error: "Зөвшөөрөлгүй хандалт" }, { status: 403 });
    }

    const updatedDeck = await prisma.deck.update({
      where: { id: deckId },
      data: {
        isPublic: !deck.isPublic,
      },
    });

    if (!deck.isPublic && updatedDeck.isPublic) {
      await logEvent(session.user.id, "deck_published", { deckId });
    }

    return NextResponse.json({ deck: updatedDeck, success: true });
  } catch (err) {
    console.error("Дек нийтийн статусыг өөрчлөхэд алдаа гарлаа:", err);
    return NextResponse.json(
      { error: "Дэкийг шинэчлэхэд амжилтгүй боллоо" },
      { status: 500 }
    );
  }
}
