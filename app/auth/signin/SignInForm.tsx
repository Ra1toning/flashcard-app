"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import BrandLogo from "@/components/ui/BrandLogo";
import DecorativeLayer from "@/components/ui/DecorativeLayer";
import GoogleButton from "@/components/ui/GoogleButton";

const ERROR_MESSAGES: Record<string, string> = {
  OAuthAccountNotLinked: "Энэ и-мэйл хаяг өөр аргаар аль хэдийн бүртгэлтэй байна. Тусламж хэрэгтэй бол бидэнтэй холбогдоно уу.",
  AccessDenied: "Google дээр зөвшөөрөл олгоогүй тул нэвтэрч чадсангүй.",
  OAuthSignin: "Google-руу шилжихэд алдаа гарлаа. Дахин оролдоно уу.",
  OAuthCallback: "Google-ээс хариу авахад алдаа гарлаа. Дахин оролдоно уу.",
  OAuthCreateAccount: "Бүртгэл үүсгэхэд алдаа гарлаа. Дахин оролдоно уу.",
  Callback: "Нэвтрэх процесст алдаа гарлаа. Дахин оролдоно уу.",
  Configuration: "Системийн тохиргооны алдаа гарлаа. Түр хүлээгээд дахин оролдоно уу.",
  SessionRequired: "Энэ хуудсыг үзэхийн тулд эхлээд нэвтэрнэ үү.",
  Default: "Нэвтрэхэд алдаа гарлаа. Дахин оролдоно уу.",
};

export default function SignInForm() {
  return (
    <AuthLayout title="Тавтай морил" description="Google бүртгэлээрээ үргэлжлүүлнэ үү.">
      <Suspense fallback={null}>
        <SignInError />
      </Suspense>
      <GoogleButton label="Google-ээр нэвтрэх" />
    </AuthLayout>
  );
}

function SignInError() {
  const searchParams = useSearchParams();
  const code = searchParams.get("error");
  if (!code) return null;

  return (
    <div className="mb-5">
      <Notice tone="error">{ERROR_MESSAGES[code] ?? ERROR_MESSAGES.Default}</Notice>
    </div>
  );
}

function AuthLayout({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return (
    <div className="app-shell relative grid min-h-screen place-items-center overflow-hidden px-4 py-10">
      <div className="relative w-full max-w-md">
        <Link href="/" className="mb-8 flex items-center justify-center gap-2.5 font-semibold">
          <BrandLogo markClassName="h-9 w-9" />
        </Link>
        <div className="panel relative overflow-hidden p-6 sm:p-8">
          <DecorativeLayer variant="auth" />
          <div className="mb-7">
            <div className="eyebrow mb-3">БҮРТГЭЛД НЭВТРЭХ</div>
            <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
            <p className="mt-2 text-sm text-slate-500">{description}</p>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}

function Notice({ children, tone = "error" }: { children: React.ReactNode; tone?: "error" | "success" }) {
  return (
    <div className={`rounded-lg border px-3 py-2.5 text-sm ${
      tone === "error" ? "border-rose-300/20 bg-rose-300/8 text-rose-200" : "border-emerald-300/20 bg-emerald-300/8 text-emerald-200"
    }`}>{children}</div>
  );
}
