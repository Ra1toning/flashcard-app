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
