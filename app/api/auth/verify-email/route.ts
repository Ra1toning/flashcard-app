import { NextResponse } from "next/server";
import { consumeVerificationToken } from "@/lib/verify-email";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const token = typeof body?.token === "string" ? body.token : "";
    if (!token) {
      return NextResponse.json({ error: "Токен шаардлагатай." }, { status: 400 });
    }

    const result = await consumeVerificationToken(token);
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true, email: result.email });
  } catch (error) {
    console.error("И-мэйл баталгаажуулахад алдаа:", error);
    return NextResponse.json({ error: "Баталгаажуулж чадсангүй." }, { status: 500 });
  }
}
