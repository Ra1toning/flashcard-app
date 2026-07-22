"use client";

import { useState } from "react";
import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import { useMutation, useQuery } from "@tanstack/react-query";
import * as Dialog from "@radix-ui/react-dialog";
import { AlertTriangle, ArrowLeft, Layers3, LogOut, Plus, X } from "lucide-react";
import { Skeleton } from "@/components/ui/Skeletons";
import { fetchJson } from "@/lib/http";
import DecorativeLayer from "@/components/ui/DecorativeLayer";

type Stats = { totalWords: number; mastered: number; streak: number; accuracy: number };
const DELETE_CONFIRM_WORD = "УСТГАХ";

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const statsQuery = useQuery({
    queryKey: ["user-stats"],
    queryFn: () => fetchJson<Stats>("/api/stats/user"),
    enabled: status === "authenticated",
  });
  const deleteMutation = useMutation({
    mutationFn: () => fetchJson<{ success: boolean }>("/api/account", { method: "DELETE" }),
    onSuccess: () => signOut({ callbackUrl: "/" }),
  });

  if (status === "loading" || !session) {
    return <div className="app-shell app-content"><main className="page-canvas max-w-5xl"><Skeleton className="h-72 w-full" /></main></div>;
  }

  const stats = statsQuery.data ?? { totalWords: 0, mastered: 0, streak: 0, accuracy: 0 };
  const items = [
    { label: "Нийт үг", value: stats.totalWords },
    { label: "Сурсан үг", value: stats.mastered },
    { label: "Өдөр дараалсан", value: stats.streak },
    { label: "Зөв хариулт", value: `${stats.accuracy}%` },
  ];

  return (
    <div className="app-shell app-content min-h-screen">
      <main className="page-canvas max-w-5xl">
        <Link href="/dashboard" className="btn-ghost mb-6 px-2 py-2 text-sm"><ArrowLeft className="h-4 w-4" />Суралцах нүүр</Link>
        <header className="mb-7">
          <p className="eyebrow mb-2">Бүртгэлийн тойм</p>
          <h1 className="text-3xl font-bold tracking-[-.04em]">Профайл</h1>
        </header>
        <div className="grid gap-5 lg:grid-cols-[.8fr_1.2fr]">
          <section className="study-set-card relative overflow-hidden p-6 shadow-[0_18px_45px_rgba(31,42,68,.08)]">
            <DecorativeLayer variant="auth" />
            <div className="deck-mark relative h-14 w-14 rounded-2xl text-base shadow-sm">{(session.user?.name || "NU").slice(0, 2).toUpperCase()}</div>
            <h2 className="mt-5 text-xl font-bold">{session.user?.name || "Нэр тохируулаагүй"}</h2>
            <p className="mt-1 text-sm text-[#737580]">{session.user?.email}</p>
            <div className="mt-6 grid grid-cols-2 gap-2 border-t border-[#e5e6eb] pt-5">
              <Link href="/library" className="btn-secondary px-3 py-2.5 text-xs"><Layers3 className="h-4 w-4" />Миний сан</Link>
              <Link href="/deck/create" className="btn-secondary px-3 py-2.5 text-xs"><Plus className="h-4 w-4" />Шинэ багц</Link>
            </div>
            <button onClick={() => signOut({ callbackUrl: "/" })} className="btn-ghost mt-3 w-full px-4 py-2.5 text-sm"><LogOut className="h-4 w-4" />Гарах</button>
          </section>

          <section className="study-set-card p-6 shadow-[0_18px_45px_rgba(31,42,68,.08)]">
            <h2 className="font-bold">Таны ахиц</h2>
            {statsQuery.isPending ? (
              <div className="mt-5 grid grid-cols-2 gap-3">{Array.from({ length: 4 }).map((_, index) => <Skeleton key={index} className="h-20" />)}</div>
            ) : (
              <div className="mt-5 grid grid-cols-2 gap-3">
                {items.map(({ label, value }) => (
                  <div key={label} className="rounded-2xl border border-[#e1e6ef] bg-gradient-to-br from-white to-[#f7f9fd] p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
                    <div className="text-2xl font-bold">{value}</div>
                    <div className="mt-1 text-xs text-[#737580]">{label}</div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        <section className="mt-5 rounded-2xl border border-[#efcaca] bg-[#fff7f6] p-6">
          <h2 className="font-bold text-[#a84040]">Аюултай бүс</h2>
          <p className="mt-1 text-sm text-[#8a5555]">Бүртгэл устгавал таны бүх багц, карт, ахиц бүрмөсөн устана. Энэ үйлдлийг буцаах боломжгүй.</p>
          <button onClick={() => setDeleteOpen(true)} className="btn-secondary mt-4 border-[#e0aaaa] px-4 py-2.5 text-sm text-[#a84040] hover:bg-[#fff2f0]">
            Бүртгэл устгах
          </button>
        </section>
      </main>

      <Dialog.Root open={deleteOpen} onOpenChange={(open) => { setDeleteOpen(open); if (!open) setConfirmText(""); }}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-[#272331]/35 backdrop-blur-sm" />
          <Dialog.Content className="dialog-content fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-[24px] border border-white/80 bg-white p-6 shadow-[0_28px_80px_rgba(27,35,55,.2)] outline-none">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-2 text-[#a84040]">
                <AlertTriangle className="h-5 w-5" />
                <Dialog.Title className="text-lg font-bold">Бүртгэл устгах уу?</Dialog.Title>
              </div>
              <Dialog.Close className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-[#777c89] transition hover:bg-[#f1f2f5]" aria-label="Хаах">
                <X className="h-4 w-4" />
              </Dialog.Close>
            </div>
            <Dialog.Description className="mt-3 text-sm leading-6 text-[#696e7b]">
              Энэ үйлдэл таны бүх багц, карт, суралцах ахицыг бүрмөсөн устгана. Буцаах боломжгүй. Үргэлжлүүлэхийн тулд доор <strong>{DELETE_CONFIRM_WORD}</strong> гэж бичнэ үү.
            </Dialog.Description>
            <input
              value={confirmText}
              onChange={(event) => setConfirmText(event.target.value)}
              className="field mt-4"
              placeholder={DELETE_CONFIRM_WORD}
              autoFocus
            />
            {deleteMutation.isError && (
              <p className="mt-2 text-sm text-[#a84040]">{deleteMutation.error instanceof Error ? deleteMutation.error.message : "Алдаа гарлаа."}</p>
            )}
            <div className="mt-5 flex justify-end gap-2">
              <Dialog.Close className="btn-ghost px-4 py-2.5 text-sm">Цуцлах</Dialog.Close>
              <button
                onClick={() => deleteMutation.mutate()}
                disabled={confirmText !== DELETE_CONFIRM_WORD || deleteMutation.isPending}
                className="btn-primary bg-[#a84040] px-4 py-2.5 text-sm hover:bg-[#933636] disabled:opacity-40"
              >
                {deleteMutation.isPending ? "Устгаж байна..." : "Бүрмөсөн устгах"}
              </button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
