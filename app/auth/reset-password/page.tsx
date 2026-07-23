"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import BrandLogo from "@/components/ui/BrandLogo";
import DecorativeLayer from "@/components/ui/DecorativeLayer";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(token ? "" : "Сэргээх холбоос хүчинтэй биш байна.");
  const [success, setSuccess] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!token) return;
    setError("");
    if (password.length < 8) return setError("Нууц үг хамгийн багадаа 8 тэмдэгт байна.");
    if (password !== confirmPassword) return setError("Нууц үг таарахгүй байна.");
    setLoading(true);
    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Нууц үгийг шинэчилж чадсангүй.");
      setSuccess(true);
      setTimeout(() => router.replace("/auth/signin"), 1800);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Алдаа гарлаа.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthFrame>
      {success ? (
        <div className="py-4 text-center">
          <h1 className="mt-4 text-xl font-semibold">Нууц үг шинэчлэгдлээ</h1>
          <p className="mt-2 text-sm text-slate-500">Нэвтрэх хуудас руу шилжүүлж байна.</p>
        </div>
      ) : (
        <>
          <div className="mb-7">
            <div className="eyebrow mb-3">ШИНЭ НУУЦ ҮГ</div>
            <h1 className="text-2xl font-semibold">Шинэ нууц үг</h1>
            <p className="mt-2 text-sm text-slate-500">Хамгийн багадаа 8 тэмдэгт ашиглана уу.</p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <div className="rounded-lg border border-rose-300/20 bg-rose-300/8 px-3 py-2.5 text-sm text-rose-200">{error}</div>}
            {[
              ["password", "Шинэ нууц үг", password, setPassword],
              ["confirm", "Нууц үг давтах", confirmPassword, setConfirmPassword],
            ].map(([id, label, value, setter]) => (
              <div key={id as string}>
                <label className="label" htmlFor={id as string}>{label as string}</label>
                <input id={id as string} type="password" autoComplete="new-password" required
                  value={value as string} onChange={(event) => (setter as React.Dispatch<React.SetStateAction<string>>)(event.target.value)}
                  className="field" />
              </div>
            ))}
            <button disabled={loading || !token} className="btn-primary w-full justify-center px-4 py-3 disabled:opacity-50">
              {loading ? "Шинэчилж байна..." : "Нууц үг шинэчлэх"}
            </button>
          </form>
        </>
      )}
    </AuthFrame>
  );
}

function AuthFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="app-shell relative grid min-h-screen place-items-center overflow-hidden px-4 py-10">
      <div className="relative w-full max-w-md">
        <Link href="/" className="mb-8 flex items-center justify-center gap-2.5 font-semibold">
          <BrandLogo markClassName="h-9 w-9" />
        </Link>
        <div className="panel relative overflow-hidden p-6 sm:p-8"><DecorativeLayer variant="auth" />{children}</div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return <Suspense fallback={<div className="app-shell min-h-screen" />}><ResetPasswordForm /></Suspense>;
}
