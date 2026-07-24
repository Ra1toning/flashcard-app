"use client";

import { useState } from "react";
import Link from "next/link";
import { MailCheck } from "lucide-react";
import BrandLogo from "@/components/ui/BrandLogo";
import DecorativeLayer from "@/components/ui/DecorativeLayer";
import GoogleButton from "@/components/ui/GoogleButton";

export default function SignUpForm() {
  const [form, setForm] = useState({ name: "", email: "", password: "", confirmPassword: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [registeredEmail, setRegisteredEmail] = useState("");

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    if (form.name.trim().length < 2) return setError("Нэр хамгийн багадаа 2 тэмдэгт байна.");
    if (form.password.length < 8) return setError("Нууц үг хамгийн багадаа 8 тэмдэгт байна.");
    if (form.password !== form.confirmPassword) return setError("Нууц үг таарахгүй байна.");

    setLoading(true);
    try {
      const normalizedEmail = form.email.trim().toLowerCase();
      const response = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: form.name.trim(), email: normalizedEmail, password: form.password }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Бүртгэл үүсгэж чадсангүй.");

      setRegisteredEmail(normalizedEmail);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Алдаа гарлаа.");
    } finally {
      setLoading(false);
    }
  }

  const fields = [
    { key: "name", label: "Нэр", type: "text", autoComplete: "name" },
    { key: "email", label: "И-мэйл", type: "email", autoComplete: "email" },
    { key: "password", label: "Нууц үг", type: "password", autoComplete: "new-password" },
    { key: "confirmPassword", label: "Нууц үг давтах", type: "password", autoComplete: "new-password" },
  ] as const;

  if (registeredEmail) {
    return (
      <div className="app-shell relative grid min-h-screen place-items-center overflow-hidden px-4 py-10">
        <div className="relative w-full max-w-md">
          <Link href="/" className="mb-8 flex items-center justify-center gap-2.5 font-semibold">
            <BrandLogo markClassName="h-9 w-9" />
          </Link>
          <div className="panel relative overflow-hidden p-6 text-center sm:p-8">
            <DecorativeLayer variant="auth" />
            <MailCheck className="mx-auto h-10 w-10 text-[#9a6418]" />
            <h1 className="mt-4 text-xl font-bold">И-мэйлээ шалгаарай</h1>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              <strong className="text-[#211f1a]">{registeredEmail}</strong> хаяг руу баталгаажуулах холбоос илгээлээ. Холбоосыг дараад бүртгэлээ идэвхжүүлээрэй.
            </p>
            <Link href="/auth/signin" className="btn-secondary mt-6 w-full justify-center px-5 py-3">Нэвтрэх хуудас руу</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app-shell relative grid min-h-screen place-items-center overflow-hidden px-4 py-10">
      <div className="relative w-full max-w-lg">
        <Link href="/" className="mb-8 flex items-center justify-center gap-2.5 font-semibold">
          <BrandLogo markClassName="h-9 w-9" />
        </Link>
        <div className="panel relative overflow-hidden p-6 sm:p-8">
          <DecorativeLayer variant="auth" />
          <div className="mb-7">
            <div className="eyebrow mb-3">ШИНЭ БҮРТГЭЛ</div>
            <h1 className="text-2xl font-semibold tracking-tight">Бүртгэл үүсгэх</h1>
            <p className="mt-2 text-sm text-slate-500">Шинэ бүртгэл үүсгэхийн тулд доорх мэдээллийг оруулна уу.</p>
          </div>
          <GoogleButton label="Google-ээр бүртгүүлэх" />
          <div className="my-5 flex items-center gap-3 text-xs text-slate-500">
            <span className="h-px flex-1 bg-slate-300/30" />
            эсвэл и-мэйлээр
            <span className="h-px flex-1 bg-slate-300/30" />
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <div className="rounded-lg border border-rose-300/20 bg-rose-300/8 px-3 py-2.5 text-sm text-rose-200">{error}</div>}
            <div className="grid gap-4 sm:grid-cols-2">
              {fields.map(({ key, label, type, autoComplete }) => (
                <div key={key} className={key === "name" || key === "email" ? "sm:col-span-2" : ""}>
                  <label className="label" htmlFor={key}>{label}</label>
                  <input id={key} type={type} autoComplete={autoComplete} required value={form[key]}
                    onChange={(event) => setForm({ ...form, [key]: event.target.value })}
                    className="field" placeholder={key.includes("password") || key === "confirmPassword" ? "Хамгийн багадаа 8 тэмдэгт" : ""} />
                </div>
              ))}
            </div>
            <button disabled={loading} className="btn-primary mt-2 w-full justify-center px-5 py-3 disabled:opacity-50">
              {loading ? "Бүртгэж байна..." : "Бүртгэл үүсгэх"}
            </button>
          </form>
          <p className="mt-6 text-center text-sm text-slate-500">
            Бүртгэлтэй юу? <Link href="/auth/signin" className="font-semibold text-[#9a6418] hover:text-[#6f460d]">Нэвтрэх</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
