import { NextResponse, after } from "next/server";
import { prisma } from "@/lib/prisma";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { sendVerificationEmail } from "@/lib/verify-email";

const GENERIC_MESSAGE = "Хэрэв и-мэйл бүртгэлтэй бөгөөд баталгаажаагүй бол шинэ холбоос илгээгдсэн.";

export async function POST(req: Request) {
  try {
    const ip = getClientIp(req.headers);
    const limit = rateLimit(`resend-verify:${ip}`, 3, 10 * 60 * 1000);
    if (!limit.success) {
      return NextResponse.json(
        { error: "Хэт олон оролдлого. Түр хүлээгээд дахин оролдоно уу." },
        { status: 429 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const normalizedEmail = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
    if (!normalizedEmail) {
      return NextResponse.json({ error: "И-мэйл шаардлагатай." }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: { name: true, emailVerified: true, password: true },
    });

    if (user && !user.emailVerified && user.password) {
      after(async () => {
        await sendVerificationEmail(normalizedEmail, user.name);
      });
    }

    return NextResponse.json({ message: GENERIC_MESSAGE });
  } catch (error) {
    console.error("Баталгаажуулах и-мэйл дахин илгээхэд алдаа:", error);
    return NextResponse.json({ error: "Илгээж чадсангүй." }, { status: 500 });
  }
}
