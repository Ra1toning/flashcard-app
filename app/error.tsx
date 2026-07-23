"use client";

import { useEffect } from "react";
import Link from "next/link";
import BrandLogo from "@/components/ui/BrandLogo";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="app-shell app-content relative grid min-h-screen place-items-center overflow-hidden px-4 py-10">
      <div className="relative w-full max-w-md text-center">
        <Link href="/" className="mb-8 flex items-center justify-center gap-2.5 font-semibold">
          <BrandLogo markClassName="h-9 w-9" />
        </Link>
        <div className="panel relative overflow-hidden p-8">
          <div className="eyebrow mb-3">АЛДАА ГАРЛАА</div>
          <h1 className="text-2xl font-semibold tracking-tight">Ямар нэг зүйл буруу боллоо</h1>
          <p className="mt-3 text-sm text-slate-500">
            Түр зуурын алдаа гарсан байж магадгүй. Дахин оролдоно уу.
          </p>
          {error.digest && (
            <p className="mt-2 text-xs text-slate-400">Алдааны код: {error.digest}</p>
          )}
          <div className="mt-6 flex items-center justify-center gap-3">
            <button onClick={() => reset()} className="btn-primary px-5 py-3">
              Дахин оролдох
            </button>
            <Link href="/" className="btn-secondary px-5 py-3">
              Нүүр хуудас
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
