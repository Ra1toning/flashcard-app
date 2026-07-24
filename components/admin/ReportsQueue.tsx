"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, ExternalLink, X } from "lucide-react";
import { fetchJson } from "@/lib/http";
import { reportReasonLabel } from "@/lib/report";
import Link from "next/link";

type ReportRow = {
  id: string;
  targetType: string;
  category: string;
  detail: string | null;
  status: string;
  createdAt: string;
  deckName: string | null;
  target: string | null;
  deckId: string | null;
  reporter: string;
};

export default function ReportsQueue() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<"open" | "all">("open");
  const reportsQuery = useQuery({
    queryKey: ["admin-reports", statusFilter],
    queryFn: () => fetchJson<{ reports: ReportRow[] }>(`/api/admin/reports?status=${statusFilter}`),
  });

  const resolveMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: "reviewed" | "dismissed" }) =>
      fetchJson<{ success: boolean }>(`/api/admin/reports/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-reports"] }),
  });

  const reports = reportsQuery.data?.reports ?? [];

  return (
    <div>
      <div className="mb-4 flex items-center gap-2">
        {(["open", "all"] as const).map((value) => (
          <button
            key={value}
            onClick={() => setStatusFilter(value)}
            className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${statusFilter === value ? "bg-[#fff1c7] text-[#84530f]" : "text-[#777168] hover:bg-[#f5f2ea]"}`}
          >
            {value === "open" ? "Нээлттэй" : "Бүгд"}
          </button>
        ))}
      </div>

      {reportsQuery.isPending ? (
        <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="skeleton-pulse h-16 rounded-xl" />)}</div>
      ) : reports.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[#e2e3e7] px-4 py-10 text-center text-sm text-[#858995]">
          {statusFilter === "open" ? "Шийдвэрлээгүй мэдэгдэл алга." : "Мэдэгдэл алга."}
        </div>
      ) : (
        <div className="space-y-2">
          {reports.map((report) => (
            <div key={report.id} className="rounded-xl border border-[#e6e3da] bg-[#fffdf8] p-3.5">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 text-xs">
                    <span className="rounded-full bg-[#fff1c7] px-2 py-0.5 font-semibold text-[#84530f]">
                      {report.targetType === "deck" ? "Багц" : "Карт"}
                    </span>
                    <span className="font-semibold text-[#a84040]">{reportReasonLabel(report.category)}</span>
                    <span className="text-[#9a9184]">{new Date(report.createdAt).toLocaleDateString("mn-MN")}</span>
                  </div>
                  <p className="mt-1.5 truncate text-sm font-medium text-[#211f1a]">{report.target ?? "Устсан агуулга"}</p>
                  {report.deckName && report.targetType === "card" && <p className="text-xs text-[#6b6255]">Багц: {report.deckName}</p>}
                  {report.detail && <p className="mt-1 text-xs text-[#6b6255]">{report.detail}</p>}
                  <p className="mt-1 text-[11px] text-[#9a9184]">Мэдэгдсэн: {report.reporter}</p>
                </div>
                <div className="flex shrink-0 items-center gap-1.5">
                  {report.deckId && (
                    <Link href={`/deck/${report.deckId}`} target="_blank" className="grid h-8 w-8 place-items-center rounded-lg text-[#777c89] transition hover:bg-[#f1f2f5]" aria-label="Багцыг харах">
                      <ExternalLink className="h-3.5 w-3.5" />
                    </Link>
                  )}
                  {report.status === "open" && (
                    <>
                      <button
                        onClick={() => resolveMutation.mutate({ id: report.id, status: "reviewed" })}
                        disabled={resolveMutation.isPending}
                        title="Шалгасан гэж тэмдэглэх"
                        className="grid h-8 w-8 place-items-center rounded-lg text-[#238769] transition hover:bg-[#e8f5ee] disabled:opacity-40"
                      >
                        <Check className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => resolveMutation.mutate({ id: report.id, status: "dismissed" })}
                        disabled={resolveMutation.isPending}
                        title="Хаах"
                        className="grid h-8 w-8 place-items-center rounded-lg text-[#a84040] transition hover:bg-[#fff2f0] disabled:opacity-40"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </>
                  )}
                  {report.status !== "open" && (
                    <span className="rounded-full bg-[#f1f2f5] px-2 py-1 text-[10px] font-semibold text-[#777c89]">
                      {report.status === "reviewed" ? "Шалгасан" : "Хаасан"}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
