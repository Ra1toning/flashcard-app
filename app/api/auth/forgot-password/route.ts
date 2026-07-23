import { NextResponse, after } from "next/server";
import { prisma } from "../../../../lib/prisma";
import { sendEmail, passwordResetEmail, isEmailConfigured } from "@/lib/email";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import crypto from "crypto";

const GENERIC_MESSAGE = "Хэрэв и-мэйл бүртгэлтэй бол сэргээх холбоос илгээгдсэн.";

export async function POST(req: Request) {
  try {
    const ip = getClientIp(req.headers);
    const limit = rateLimit(`forgot-password:${ip}`, 3, 10 * 60 * 1000);
    if (!limit.success) {
      return NextResponse.json(
        { error: "Хэт олон оролдлого. Түр хүлээгээд дахин оролдоно уу." },
        { status: 429 }
      );
    }

    const { email } = await req.json();
    const normalizedEmail = typeof email === "string" ? email.trim().toLowerCase() : "";

    if (!normalizedEmail) {
      return NextResponse.json({ error: "И-мэйл шаардлагатай." }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user || !user.password) {
      return NextResponse.json({ message: GENERIC_MESSAGE });
    }

    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetTokenExpiry = new Date(Date.now() + 3600000);

    await prisma.verificationToken.deleteMany({
      where: { identifier: normalizedEmail },
    });
    await prisma.verificationToken.create({
      data: {
        identifier: normalizedEmail,
        token: resetToken,
        expires: resetTokenExpiry,
      },
    });

    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
    const resetUrl = `${baseUrl}/auth/reset-password?token=${resetToken}`;

    const { subject, html, text } = passwordResetEmail(resetUrl);

    after(async () => {
      const sent = await sendEmail({ to: normalizedEmail, subject, html, text });
      if (!sent && !isEmailConfigured()) {
        console.info(`[dev] Password reset link: ${resetUrl}`);
      }
    });

    return NextResponse.json({ message: GENERIC_MESSAGE });
  } catch (error) {
    console.error("Нууц үгийг сэргээхэд алдаа:", error);
    return NextResponse.json(
      { error: "Сэргээх хүсэлтийг боловсруулж чадсангүй." },
      { status: 500 }
    );
  }
}
