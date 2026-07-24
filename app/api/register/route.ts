import { NextResponse, after } from "next/server";
import { prisma } from "../../../lib/prisma";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { createStarterDeck } from "@/lib/starter-deck";
import { logEvent } from "@/lib/analytics";
import { sendVerificationEmail } from "@/lib/verify-email";
import bcrypt from "bcryptjs";

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

    const { name, email, password } = await req.json();
    const normalizedName = typeof name === "string" ? name.trim() : "";
    const normalizedEmail = typeof email === "string" ? email.trim().toLowerCase() : "";

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
      },
    });

    const { password: _, ...userWithoutPassword } = user;

    try {
      await createStarterDeck(user.id);
    } catch (seedError) {
      console.error("Starter deck seed хийхэд алдаа:", seedError);
    }

    await logEvent(user.id, "signup", { method: "credentials" });

    after(async () => {
      await sendVerificationEmail(normalizedEmail, normalizedName);
    });

    return NextResponse.json(
      { message: "Хэрэглэгч амжилттай үүсгэгдсэн", user: userWithoutPassword, requiresVerification: true },
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
