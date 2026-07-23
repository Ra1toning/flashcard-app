"use client";

import { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Flag, X } from "lucide-react";
import { REPORT_REASONS, type ReportReason } from "@/lib/report";

export default function ReportDialog({
  open,
  onOpenChange,
  onSubmit,
  pending = false,
  error = "",
  title = "Мэдэгдэх",
  subtitle,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (payload: { category: ReportReason; detail: string }) => void;
  pending?: boolean;
  error?: string;
  title?: string;
  subtitle?: string;
}) {
  const [category, setCategory] = useState<ReportReason | "">("");
  const [detail, setDetail] = useState("");

  function handleOpenChange(next: boolean) {
    if (!next) {
      setCategory("");
      setDetail("");
    }
    onOpenChange(next);
  }

  return (
    <Dialog.Root open={open} onOpenChange={handleOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[70] bg-[#272331]/35 backdrop-blur-sm" />
        <Dialog.Content className="dialog-content fixed left-1/2 top-1/2 z-[70] w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-3xl border border-white/80 bg-white p-6 shadow-[0_28px_80px_rgba(27,35,55,.2)] outline-none">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-2 text-[#a84040]">
              <Flag className="h-4 w-4" />
              <Dialog.Title className="text-lg font-bold">{title}</Dialog.Title>
            </div>
            <Dialog.Close className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-[#777c89] transition hover:bg-[#f1f2f5]" aria-label="Хаах">
              <X className="h-4 w-4" />
            </Dialog.Close>
          </div>
          <Dialog.Description className="mt-2 text-sm leading-6 text-[#696e7b]">
            {subtitle ?? "Асуудлын төрлийг сонгож, шаардлагатай бол дэлгэрэнгүй бичнэ үү."}
          </Dialog.Description>

          <div className="mt-4 space-y-2">
            {REPORT_REASONS.map((reason) => {
              const active = category === reason.value;
              return (
                <button
                  key={reason.value}
                  type="button"
                  onClick={() => setCategory(reason.value)}
                  className={`flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left text-sm transition ${active ? "border-[#d4a451] bg-[#fff3d2]" : "border-[#e2e3e7] bg-white hover:border-[#c8baa3]"}`}
                >
                  <span className={`grid h-4 w-4 shrink-0 place-items-center rounded-full border ${active ? "border-[#b7791f]" : "border-[#c3c6cf]"}`}>
                    {active && <span className="h-2 w-2 rounded-full bg-[#b7791f]" />}
                  </span>
                  {reason.label}
                </button>
              );
            })}
          </div>

          <textarea
            value={detail}
            onChange={(event) => setDetail(event.target.value)}
            maxLength={500}
            className="field mt-3 min-h-20 resize-y text-sm"
            placeholder="Нэмэлт тайлбар (заавал биш)"
          />

          {error && <p className="mt-2 text-sm text-[#a84040]">{error}</p>}

          <div className="mt-5 flex justify-end gap-2">
            <Dialog.Close className="btn-ghost px-4 py-2.5 text-sm">Болих</Dialog.Close>
            <button
              onClick={() => category && onSubmit({ category, detail })}
              disabled={!category || pending}
              className="btn-primary bg-[#a84040] px-4 py-2.5 text-sm hover:bg-[#933636] disabled:opacity-40"
            >
              {pending ? "Илгээж байна..." : "Мэдэгдэх"}
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
