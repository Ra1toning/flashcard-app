import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { sendEmail, isEmailConfigured, verifyEmailEmail } from "@/lib/email";

const VERIFY_PREFIX = "verify:";
const VERIFY_TTL_MS = 24 * 60 * 60 * 1000;

export async function sendVerificationEmail(email: string, name: string | null): Promise<boolean> {
  const identifier = VERIFY_PREFIX + email;
  const token = crypto.randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + VERIFY_TTL_MS);

  await prisma.verificationToken.deleteMany({ where: { identifier } });
  await prisma.verificationToken.create({ data: { identifier, token, expires } });

  const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
  const verifyUrl = `${baseUrl}/auth/verify-email?token=${token}`;
  const { subject, html, text } = verifyEmailEmail(verifyUrl, name);
  const sent = await sendEmail({ to: email, subject, html, text });

  if (!sent && !isEmailConfigured()) {
    console.info(`[dev] Verify email link: ${verifyUrl}`);
  }
  return sent;
}

export async function consumeVerificationToken(
  token: string
): Promise<{ ok: true; email: string } | { ok: false; error: string }> {
  const record = await prisma.verificationToken.findUnique({ where: { token } });

  if (!record || !record.identifier.startsWith(VERIFY_PREFIX)) {
    return { ok: false, error: "Холбоос буруу эсвэл ашиглагдсан байна." };
  }

  if (record.expires < new Date()) {
    await prisma.verificationToken.delete({ where: { token } }).catch(() => undefined);
    return { ok: false, error: "Холбоосын хугацаа дууссан байна. Дахин илгээж болно." };
  }

  const email = record.identifier.slice(VERIFY_PREFIX.length);

  const user = await prisma.user.findUnique({ where: { email }, select: { id: true } });
  if (!user) {
    await prisma.verificationToken.delete({ where: { token } }).catch(() => undefined);
    return { ok: false, error: "Бүртгэл олдсонгүй." };
  }

  await prisma.$transaction([
    prisma.user.update({ where: { email }, data: { emailVerified: new Date() } }),
    prisma.verificationToken.deleteMany({ where: { identifier: VERIFY_PREFIX + email } }),
  ]);

  return { ok: true, email };
}
