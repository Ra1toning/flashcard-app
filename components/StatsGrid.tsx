"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchJson } from "@/lib/http";
import { Skeleton } from "@/components/ui/Skeletons";

type Stats = { totalWords: number; mastered: number; streak: number; accuracy: number };

export default function StatsGrid() {
  const statsQuery = useQuery({
    queryKey: ["user-stats"],
    queryFn: () => fetchJson<Stats>("/api/stats/user"),
    staleTime: 60_000,
  });

  if (statsQuery.isPending) {
    return <div className="grid grid-cols-2 gap-2">{Array.from({ length: 4 }).map((_, index) => <Skeleton key={index} className="h-16" />)}</div>;
  }

  const stats = statsQuery.data ?? { totalWords: 0, mastered: 0, streak: 0, accuracy: 0 };
  const items = [
    { label: "Нийт үг", value: stats.totalWords },
    { label: "Сурсан үг", value: stats.mastered },
    { label: "Өдөр дараалсан", value: stats.streak },
    { label: "Зөв хариулт", value: `${stats.accuracy}%` },
  ];

  return (
    <div className="grid grid-cols-2 gap-2">
      {items.map(({ label, value }) => (
        <div key={label} className="rounded-2xl border border-[#e2e7ef] bg-gradient-to-br from-white to-[#f7f9fd] p-3 transition hover:-translate-y-0.5 hover:shadow-md">
          <div className="text-xl font-bold tracking-tight">{value}</div>
          <div className="mt-1 text-[11px] text-[#777b87]">{label}</div>
        </div>
      ))}
    </div>
  );
}
