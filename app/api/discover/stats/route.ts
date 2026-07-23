import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const [totalDecks, totalCards, totalUsers] = await Promise.all([
      prisma.deck.count({ where: { isPublic: true } }),
      prisma.card.count({ where: { deck: { isPublic: true } } }),
      prisma.user.count(),
    ]);

    return NextResponse.json({
      totalDecks,
      totalCards,
      totalUsers,
    });
  } catch (err) {
    console.error("Статистик авахэд алдаа гарлаа:", err);
    return NextResponse.json(
      { error: "Статистикийг авахэд амжилтгүй боллоо" },
      { status: 500 }
    );
  }
}
