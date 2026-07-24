"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import BrandLogo from "@/components/ui/BrandLogo";
import DecorativeLayer from "@/components/ui/DecorativeLayer";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("Баталгаажуулах холбоос дутуу байна.");
      return;
    }
    fetch("/api/auth/verify-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Баталгаажуулж чадсангүй.");
        setStatus("success");
      })
      .catch((error) => {
        setStatus("error");
        setMessage(error instanceof Error ? error.message : "Баталгаажуулж чадсангүй.");
      });
  }, [token]);

  return (
    <div className="app-shell relative grid min-h-screen place-items-center overflow-hidden px-4 py-10">
      <div className="relative w-full max-w-md">
        <Link href="/" className="mb-8 flex items-center justify-center gap-2.5 font-semibold">
          <BrandLogo markClassName="h-9 w-9" />
        </Link>
        <div className="panel relative overflow-hidden p-6 text-center sm:p-8">
          <DecorativeLayer variant="auth" />
          {status === "loading" && (
            <>
              <Loader2 className="mx-auto h-10 w-10 animate-spin text-[#9a6418]" />
              <h1 className="mt-4 text-xl font-bold">Баталгаажуулж байна...</h1>
            </>
          )}
          {status === "success" && (
            <>
              <CheckCircle2 className="mx-auto h-10 w-10 text-[#238769]" />
              <h1 className="mt-4 text-xl font-bold">И-мэйл баталгаажлаа</h1>
              <p className="mt-2 text-sm text-slate-500">Одоо нэвтэрч, суралцаж эхэлж болно.</p>
              <Link href="/auth/signin" className="btn-primary mt-6 w-full justify-center px-5 py-3">Нэвтрэх</Link>
            </>
          )}
          {status === "error" && (
            <>
              <XCircle className="mx-auto h-10 w-10 text-[#a84040]" />
              <h1 className="mt-4 text-xl font-bold">Баталгаажуулж чадсангүй</h1>
              <p className="mt-2 text-sm text-slate-500">{message}</p>
              <Link href="/auth/signin" className="btn-secondary mt-6 w-full justify-center px-5 py-3">Нэвтрэх хуудас руу</Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div className="app-shell grid min-h-screen place-items-center"><Loader2 className="h-8 w-8 animate-spin text-[#9a6418]" /></div>}>
      <VerifyEmailContent />
    </Suspense>
  );
}
