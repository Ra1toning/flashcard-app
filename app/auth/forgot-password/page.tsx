"use client";

import { useState } from "react";
import Link from "next/link";
import BrandLogo from "@/components/ui/BrandLogo";
import DecorativeLayer from "@/components/ui/DecorativeLayer";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Хүсэлтийг илгээж чадсангүй.");
      setMessage(data.message || "Сэргээх хүсэлтийг хүлээн авлаа.");
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Алдаа гарлаа.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthFrame eyebrow="НУУЦ ҮГ СЭРГЭЭХ" title="Нууц үгээ сэргээх" description="Бүртгэлтэй и-мэйл хаягаа оруулна уу.">
      {message ? (
        <div>
          <div className="rounded-lg border border-emerald-300/20 bg-emerald-300/8 px-4 py-3 text-sm leading-6 text-emerald-100">{message}</div>
          <Link href="/auth/signin" className="btn-secondary mt-5 w-full justify-center px-4 py-3 text-sm">
            Нэвтрэх хуудас
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
          {error && <div className="rounded-lg border border-rose-300/20 bg-rose-300/8 px-3 py-2.5 text-sm text-rose-200">{error}</div>}
          <div>
            <label className="label" htmlFor="email">И-мэйл</label>
            <input id="email" type="email" autoComplete="email" required value={email}
              onChange={(event) => setEmail(event.target.value)} className="field" placeholder="name@nudleye.com" />
          </div>
          <button disabled={loading} className="btn-primary w-full justify-center px-4 py-3 disabled:opacity-50">
            {loading ? "Илгээж байна..." : "Сэргээх холбоос илгээх"}
          </button>
          <Link href="/auth/signin" className="btn-ghost w-full justify-center px-4 py-2 text-sm">
            Буцах
          </Link>
        </form>
      )}
    </AuthFrame>
  );
}

function AuthFrame({ eyebrow, title, description, children }: {
  eyebrow: string; title: string; description: string; children: React.ReactNode;
}) {
  return (
    <div className="app-shell relative grid min-h-screen place-items-center overflow-hidden px-4 py-10">
      <div className="relative w-full max-w-md">
        <Link href="/" className="mb-8 flex items-center justify-center gap-2.5 font-semibold">
          <BrandLogo markClassName="h-9 w-9" />
        </Link>
        <div className="panel relative overflow-hidden p-6 sm:p-8">
          <DecorativeLayer variant="auth" />
          <div className="mb-7">
            <div className="eyebrow mb-3">{eyebrow}</div>
            <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
            <p className="mt-2 text-sm text-slate-500">{description}</p>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
