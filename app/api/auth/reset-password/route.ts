import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  try {
    const ip = getClientIp(req.headers);
    const limit = rateLimit(`reset-password:${ip}`, 10, 10 * 60 * 1000);
    if (!limit.success) {
      return NextResponse.json(
        { error: "Хэт олон оролдлого. Түр хүлээгээд дахин оролдоно уу." },
        { status: 429 }
      );
    }

    const { token, password } = await req.json();

    if (typeof token !== "string" || typeof password !== "string") {
      return NextResponse.json(
        { error: "Сэргээх холбоос болон нууц үг шаардлагатай." },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Нууц үг хамгийн багадаа 8 тэмдэгт байна." },
        { status: 400 }
      );
    }

    const resetToken = await prisma.verificationToken.findUnique({
      where: { token },
    });

    if (!resetToken) {
      return NextResponse.json(
        { error: "Сэргээх холбоос буруу эсвэл ашиглагдсан байна." },
        { status: 400 }
      );
    }

    if (resetToken.expires < new Date()) {
      await prisma.verificationToken.delete({
        where: { token },
      });

      return NextResponse.json(
        { error: "Сэргээх холбоосын хугацаа дууссан байна." },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: resetToken.identifier },
    });

    if (!user) {
      return NextResponse.json({ error: "Бүртгэл олдсонгүй." }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    await prisma.$transaction([
      prisma.user.update({
        where: { id: user.id },
        data: { password: hashedPassword },
      }),
      prisma.verificationToken.delete({
        where: { token },
      }),
    ]);

    return NextResponse.json({
      message: "Нууц үг амжилттай шинэчлэгдлээ.",
    });
  } catch (error) {
    console.error("Нууц үгийг сэргээхэд алдаа:", error);
    return NextResponse.json(
      { error: "Нууц үгийг шинэчилж чадсангүй." },
      { status: 500 }
    );
  }
}
