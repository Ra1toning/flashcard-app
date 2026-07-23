"use client";

import { useState } from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import BrandLogo from "@/components/ui/BrandLogo";
import DecorativeLayer from "@/components/ui/DecorativeLayer";
import GoogleButton from "@/components/ui/GoogleButton";

export default function SignInForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");
    const result = await signIn("credentials", {
      email: email.trim().toLowerCase(),
      password,
      redirect: false,
    });

    if (result?.error) {
      setError("И-мэйл эсвэл нууц үг буруу байна.");
      setLoading(false);
      return;
    }

    router.replace("/dashboard");
    router.refresh();
  }

  return (
    <AuthLayout title="Тавтай морил" description="Үргэлжлүүлэхийн тулд нэвтэрнэ үү.">
      <GoogleButton label="Google-ээр нэвтрэх" />
      <div className="my-5 flex items-center gap-3 text-xs text-slate-500">
        <span className="h-px flex-1 bg-slate-300/30" />
        эсвэл и-мэйлээр
        <span className="h-px flex-1 bg-slate-300/30" />
      </div>
      <form onSubmit={handleSubmit} className="space-y-5">
        {error && <Notice tone="error">{error}</Notice>}
        <div>
          <label className="label" htmlFor="email">И-мэйл</label>
          <div>
            <input id="email" type="email" autoComplete="email" required value={email}
              onChange={(event) => setEmail(event.target.value)} className="field" placeholder="name@nudleye.com" />
          </div>
        </div>
        <div>
          <label className="label" htmlFor="password">Нууц үг</label>
          <div className="relative">
            <input id="password" type={showPassword ? "text" : "password"} autoComplete="current-password"
              required value={password} onChange={(event) => setPassword(event.target.value)}
              className="field pr-20" placeholder="Нууц үгээ оруулна уу" />
            <button type="button" onClick={() => setShowPassword((value) => !value)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-500 hover:text-slate-300"
              aria-label={showPassword ? "Нууц үг нуух" : "Нууц үг харах"}>
              {showPassword ? "Нуух" : "Харах"}
            </button>
          </div>
        </div>
        <button disabled={loading} className="btn-primary w-full justify-center px-5 py-3 disabled:opacity-50">
          {loading ? "Нэвтэрч байна..." : "Нэвтрэх"}
        </button>
      </form>
      <p className="mt-6 text-center text-sm text-slate-500">
        Бүртгэлгүй юу? <Link href="/auth/signup" className="font-semibold text-[#9a6418] hover:text-[#6f460d]">Бүртгүүлэх</Link>
      </p>
    </AuthLayout>
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
