"use client";

import { useEffect } from "react";

export default function GlobalError({
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
    <html lang="mn">
      <body style={{ fontFamily: "system-ui, sans-serif", margin: 0 }}>
        <div
          style={{
            minHeight: "100vh",
            display: "grid",
            placeItems: "center",
            padding: "1rem",
            textAlign: "center",
          }}
        >
          <div style={{ maxWidth: 420 }}>
            <h1 style={{ fontSize: "1.5rem", fontWeight: 600 }}>Ямар нэг зүйл буруу боллоо</h1>
            <p style={{ color: "#64748b", marginTop: "0.75rem" }}>
              Системд ноцтой алдаа гарлаа. Хуудсаа дахин ачаална уу.
            </p>
            <button
              onClick={() => reset()}
              style={{
                marginTop: "1.5rem",
                padding: "0.75rem 1.25rem",
                borderRadius: "0.5rem",
                border: "none",
                background: "#9a6418",
                color: "#fff",
                cursor: "pointer",
              }}
            >
              Дахин оролдох
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
