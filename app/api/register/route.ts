import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { createStarterDeck } from "@/lib/starter-deck";
import { logEvent } from "@/lib/analytics";
import bcrypt from "bcryptjs";

const LEARNING_REASONS = new Set(["topik", "work", "kcontent", "travel"]);

export async function POST(req: Request) {
  try {
    const ip = getClientIp(req.headers);
    const limit = rateLimit(`register:${ip}`, 5, 10 * 60 * 1000);
    if (!limit.success) {
      return NextResponse.json(
        { error: "Хэт олон оролдлого. Түр хүлээгээд дахин оролдоно уу." },
        { status: 429 }
      );
    }

    const { name, email, password, learningReason } = await req.json();
    const normalizedName = typeof name === "string" ? name.trim() : "";
    const normalizedEmail = typeof email === "string" ? email.trim().toLowerCase() : "";
    const normalizedReason =
      typeof learningReason === "string" && LEARNING_REASONS.has(learningReason) ? learningReason : null;

    if (normalizedName.length < 2 || !normalizedEmail || typeof password !== "string") {
      return NextResponse.json(
        { error: "Нэр, и-мэйл, нууц үгээ бүрэн оруулна уу." },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Нууц үг хамгийн багадаа 8 тэмдэгт байна." },
        { status: 400 }
      );
    }

    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Энэ и-мэйлээр бүртгэл үүссэн байна." },
        { status: 409 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        name: normalizedName,
        email: normalizedEmail,
        password: hashedPassword,
        learningReason: normalizedReason,
      },
    });

    const { password: _, ...userWithoutPassword } = user;

    try {
      await createStarterDeck(user.id);
    } catch (seedError) {
      console.error("Starter deck seed хийхэд алдаа:", seedError);
    }

    await logEvent(user.id, "signup", { method: "credentials", reason: normalizedReason });

    return NextResponse.json(
      { message: "Хэрэглэгч амжилттай үүсгэгдсэн", user: userWithoutPassword },
      { status: 201 }
    );
  } catch (error) {
    console.error("Бүртгүүлэхэд алдаа:", error);
    return NextResponse.json(
      { error: "Серверийн алдаа" },
      { status: 500 }
    );
  }
}
