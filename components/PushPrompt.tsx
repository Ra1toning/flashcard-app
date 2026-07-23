"use client";

import { useEffect, useState } from "react";
import { Bell, X } from "lucide-react";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = window.atob(base64);
  return Uint8Array.from([...raw].map((char) => char.charCodeAt(0)));
}

export default function PushPrompt() {
  const [status, setStatus] = useState<"hidden" | "eligible" | "working" | "done" | "failed">("hidden");

  useEffect(() => {
    let cancelled = false;
    async function check() {
      if (!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY) return;
      if (!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) return;
      if (Notification.permission === "denied") return;
      const registration = await navigator.serviceWorker.getRegistration();
      if (!registration) return;
      const existing = await registration.pushManager.getSubscription();
      if (existing) return;
      if (!cancelled) setStatus("eligible");
    }
    void check();
    return () => { cancelled = true; };
  }, []);

  async function enable() {
    setStatus("working");
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setStatus("hidden");
        return;
      }
      const registration = await navigator.serviceWorker.getRegistration();
      if (!registration) throw new Error("no registration");
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!),
      });
      const response = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(subscription.toJSON()),
      });
      if (!response.ok) throw new Error("subscribe save failed");
      setStatus("done");
    } catch {
      setStatus("failed");
    }
  }

  if (status === "hidden") return null;

  if (status === "done") {
    return (
      <p className="mt-5 flex items-center gap-2 rounded-xl border border-[#d9ecdf] bg-[#f2faf5] px-4 py-3 text-sm text-[#2c5847]">
        <Bell className="h-4 w-4 shrink-0 text-[#238769]" />Сануулга асаалаа. Давтах цаг болоход дуудна.
      </p>
    );
  }

  if (status === "failed") {
    return (
      <p className="mt-5 rounded-xl border border-[#efcaca] bg-[#fff7f6] px-4 py-3 text-sm text-[#a84040]">
        Сануулга асааж чадсангүй. Дараа дахин оролдоорой.
      </p>
    );
  }

  return (
    <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#f0d78c] bg-[#fff6dd] px-4 py-3.5">
      <div className="flex min-w-0 items-center gap-2.5">
        <Bell className="h-4 w-4 shrink-0 text-[#9a6418]" />
        <p className="text-sm font-semibold text-[#84530f]">Давтах цаг болоход сануулъя юу?</p>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <button
          onClick={enable}
          disabled={status === "working"}
          className="btn-primary px-3.5 py-2 text-xs disabled:opacity-50"
        >
          {status === "working" ? "Асааж байна..." : "Сануулга асаах"}
        </button>
        <button onClick={() => setStatus("hidden")} aria-label="Хаах" className="grid h-8 w-8 place-items-center rounded-lg text-[#9a7a3a] transition hover:bg-[#fff0c7]">
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
