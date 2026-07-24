type SendEmailArgs = {
  to: string;
  subject: string;
  html: string;
  text?: string;
};

export function isEmailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY && process.env.EMAIL_FROM);
}

const HTML_ESCAPES: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};

export function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => HTML_ESCAPES[char]);
}

export async function sendEmail({ to, subject, html, text }: SendEmailArgs): Promise<boolean> {
  if (!isEmailConfigured()) {
    console.warn("[email] RESEND_API_KEY/EMAIL_FROM тохируулаагүй — илгээлгүй өнгөрлөө.");
    return false;
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from: process.env.EMAIL_FROM, to, subject, html, text }),
    });

    if (!res.ok) {
      console.error("[email] илгээх амжилтгүй:", res.status, await res.text());
      return false;
    }
    return true;
  } catch (error) {
    console.error("[email] илгээхэд алдаа:", error);
    return false;
  }
}

export function passwordResetEmail(resetUrl: string): { subject: string; html: string; text: string } {
  return {
    subject: "Nudleye — Нууц үг сэргээх",
    text: `Нууц үгээ сэргээхийн тулд доорх холбоосоор орно уу (1 цагийн дотор хүчинтэй):\n${resetUrl}\n\nХэрэв та энэ хүсэлтийг илгээгээгүй бол энэ и-мэйлийг үл хэрэгсээрэй.`,
    html: `
      <div style="font-family: system-ui, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px; color: #0f172a;">
        <h2 style="margin: 0 0 16px;">Нууц үг сэргээх</h2>
        <p style="color: #475569; line-height: 1.6;">
          Та Nudleye дээрх нууц үгээ сэргээх хүсэлт илгээсэн. Доорх товчийг дарж шинэ нууц үгээ тохируулна уу.
          Энэ холбоос <strong>1 цагийн дотор</strong> хүчинтэй.
        </p>
        <p style="margin: 24px 0;">
          <a href="${resetUrl}" style="background: #9a6418; color: #fff; padding: 12px 20px; border-radius: 8px; text-decoration: none; display: inline-block;">
            Нууц үг сэргээх
          </a>
        </p>
        <p style="color: #94a3b8; font-size: 13px; line-height: 1.6;">
          Хэрэв товч ажиллахгүй бол энэ холбоосыг хуулж браузерт оруулна уу:<br />
          <span style="word-break: break-all;">${resetUrl}</span>
        </p>
        <p style="color: #94a3b8; font-size: 13px; margin-top: 24px;">
          Хэрэв та энэ хүсэлтийг илгээгээгүй бол энэ и-мэйлийг үл хэрэгсээрэй.
        </p>
      </div>
    `,
  };
}

export function verifyEmailEmail(verifyUrl: string, name: string | null): { subject: string; html: string; text: string } {
  const greeting = name ? `Сайн байна уу, ${name}` : "Сайн байна уу";
  return {
    subject: "Nudleye — И-мэйлээ баталгаажуулна уу",
    text: `${greeting}!\n\nNudleye-д бүртгүүлсэнд баярлалаа. Бүртгэлээ ашиглахын тулд и-мэйлээ баталгаажуулна уу (24 цагийн дотор хүчинтэй):\n${verifyUrl}\n\nХэрэв та энэ бүртгэлийг үүсгээгүй бол энэ и-мэйлийг үл хэрэгсээрэй.`,
    html: `
      <div style="font-family: system-ui, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px; color: #0f172a;">
        <h2 style="margin: 0 0 16px;">И-мэйлээ баталгаажуулна уу</h2>
        <p style="color: #475569; line-height: 1.6;">
          ${escapeHtml(greeting)}! Nudleye-д бүртгүүлсэнд баярлалаа. Бүртгэлээ ашиглахын өмнө доорх товчийг дарж и-мэйлээ баталгаажуулна уу.
          Энэ холбоос <strong>24 цагийн дотор</strong> хүчинтэй.
        </p>
        <p style="margin: 24px 0;">
          <a href="${verifyUrl}" style="background: #9a6418; color: #fff; padding: 12px 20px; border-radius: 8px; text-decoration: none; display: inline-block;">
            И-мэйл баталгаажуулах
          </a>
        </p>
        <p style="color: #94a3b8; font-size: 13px; line-height: 1.6;">
          Хэрэв товч ажиллахгүй бол энэ холбоосыг хуулж браузерт оруулна уу:<br />
          <span style="word-break: break-all;">${verifyUrl}</span>
        </p>
        <p style="color: #94a3b8; font-size: 13px; margin-top: 24px;">
          Хэрэв та энэ бүртгэлийг үүсгээгүй бол энэ и-мэйлийг үл хэрэгсээрэй.
        </p>
      </div>
    `,
  };
}

export function dailyDigestEmail(
  name: string | null,
  dueCount: number,
  reviewUrl: string
): { subject: string; html: string; text: string } {
  const greeting = name ? `Сайн байна уу, ${name}` : "Сайн байна уу";
  return {
    subject: `Nudleye — Өнөөдөр ${dueCount} үг давтах уу?`,
    text: `${greeting}!\n\nӨнөөдөр ${dueCount} үг давтах хугацаа болсон байна. Streak-ээ бүү тас, доорх холбоосоор ороод давт:\n${reviewUrl}`,
    html: `
      <div style="font-family: system-ui, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px; color: #0f172a;">
        <h2 style="margin: 0 0 16px;">${escapeHtml(dueCount.toString())} үг таныг хүлээж байна</h2>
        <p style="color: #475569; line-height: 1.6;">
          ${escapeHtml(greeting)}! Өнөөдөр давтах хугацаа болсон үгсээ давтаж, streak-ээ бүү тасал.
        </p>
        <p style="margin: 24px 0;">
          <a href="${reviewUrl}" style="background: #9a6418; color: #fff; padding: 12px 20px; border-radius: 8px; text-decoration: none; display: inline-block;">
            Одоо давтах
          </a>
        </p>
      </div>
    `,
  };
}
