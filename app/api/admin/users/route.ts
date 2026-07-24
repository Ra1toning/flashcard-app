import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-guard";
import type { Prisma } from "@prisma/client";

const PAGE_SIZE = 25;

export async function GET(req: Request) {
  try {
    const admin = await requireAdmin();
    if (!admin) {
      return NextResponse.json({ error: "Хандах эрхгүй." }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const q = (searchParams.get("q") || "").trim();
    const verified = searchParams.get("verified") || "all";
    const role = searchParams.get("role") || "all";
    const page = Math.max(1, Number.parseInt(searchParams.get("page") || "1", 10) || 1);

    const where: Prisma.UserWhereInput = {};
    if (q) {
      where.OR = [
        { email: { contains: q, mode: "insensitive" } },
        { name: { contains: q, mode: "insensitive" } },
      ];
    }
    if (verified === "yes") where.emailVerified = { not: null };
    if (verified === "no") where.emailVerified = null;
    if (role === "USER" || role === "ADMIN") where.role = role;

    const [total, users] = await Promise.all([
      prisma.user.count({ where }),
      prisma.user.findMany({
        where,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          emailVerified: true,
          learningReason: true,
          createdAt: true,
          _count: { select: { decks: true } },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * PAGE_SIZE,
        take: PAGE_SIZE,
      }),
    ]);

    return NextResponse.json({
      users: users.map((user) => ({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        verified: Boolean(user.emailVerified),
        learningReason: user.learningReason,
        createdAt: user.createdAt.toISOString(),
        deckCount: user._count.decks,
      })),
      page,
      pageSize: PAGE_SIZE,
      total,
      totalPages: Math.max(1, Math.ceil(total / PAGE_SIZE)),
    });
  } catch (error) {
    console.error("Хэрэглэгч хайхад алдаа:", error);
    return NextResponse.json({ error: "Хайлт хийж чадсангүй." }, { status: 500 });
  }
}
