"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as Dialog from "@radix-ui/react-dialog";
import { fetchJson } from "@/lib/http";

const REASONS = [
  { value: "topik", label: "TOPIK шалгалт" },
  { value: "work", label: "Ажил" },
  { value: "kcontent", label: "K-контент" },
  { value: "travel", label: "Аялал" },
] as const;

export default function LearningReasonPrompt() {
  const { status } = useSession();
  const queryClient = useQueryClient();
  const [dismissed, setDismissed] = useState(false);

  const accountQuery = useQuery({
    queryKey: ["account-learning-reason"],
    queryFn: () => fetchJson<{ learningReason: string | null }>("/api/account"),
    enabled: status === "authenticated",
    staleTime: 60_000,
  });

  const mutation = useMutation({
    mutationFn: (learningReason: string) => fetchJson<{ success: boolean }>("/api/account", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ learningReason }),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["account-learning-reason"] });
      setDismissed(true);
    },
  });

  const open = status === "authenticated" && !dismissed && accountQuery.data?.learningReason == null && !accountQuery.isPending;

  return (
    <Dialog.Root open={open} onOpenChange={(next) => { if (!next) setDismissed(true); }}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[80] bg-[#272331]/35 backdrop-blur-sm" />
        <Dialog.Content className="dialog-content fixed left-1/2 top-1/2 z-[80] w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-3xl border border-white/80 bg-white p-6 shadow-[0_28px_80px_rgba(27,35,55,.2)] outline-none">
          <Dialog.Title className="text-lg font-bold text-[#211f1a]">Юуны төлөө сурч байна вэ?</Dialog.Title>
          <Dialog.Description className="mt-1.5 text-sm text-[#696e7b]">Танд тохирсон агуулга санал болгоход тусална.</Dialog.Description>
          <div className="mt-5 grid grid-cols-2 gap-2">
            {REASONS.map(({ value, label }) => (
              <button
                key={value}
                type="button"
                disabled={mutation.isPending}
                onClick={() => mutation.mutate(value)}
                className="rounded-xl border border-[#ded7ca] bg-white px-3 py-3 text-sm font-medium text-[#4a4d58] transition hover:border-[#d4a451] hover:bg-[#fff1c7] hover:text-[#84530f] disabled:opacity-50"
              >
                {label}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setDismissed(true)}
            disabled={mutation.isPending}
            className="mt-4 w-full text-center text-xs font-semibold text-[#9a9184] hover:text-[#6b6255]"
          >
            Дараа
          </button>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
