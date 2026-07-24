"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";

export default function AuthCTA({ children, className }: { children: React.ReactNode; className: string }) {
  const [loading, setLoading] = useState(false);

  return (
    <button
      type="button"
      disabled={loading}
      onClick={() => {
        setLoading(true);
        signIn("google", { callbackUrl: "/dashboard" });
      }}
      className={`${className} disabled:opacity-60`}
    >
      {loading ? "Шилжиж байна..." : children}
    </button>
  );
}
