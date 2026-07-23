"use client";

import { useQuery } from "@tanstack/react-query";
import { Flame, GraduationCap } from "lucide-react";
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
    return <div className="space-y-2">{Array.from({ length: 2 }).map((_, index) => <Skeleton key={index} className="h-16" />)}</div>;
  }

  const stats = statsQuery.data ?? { totalWords: 0, mastered: 0, streak: 0, accuracy: 0 };
  const items = [
    { label: "Өдөр дараалсан", value: stats.streak, icon: Flame, chip: "bg-[#fde8d0] text-[#c2560a]" },
    { label: "Сурсан үг", value: stats.mastered, icon: GraduationCap, chip: "bg-[#e7f5ef] text-[#238769]" },
  ];

  return (
    <div className="space-y-2">
      {items.map(({ label, value, icon: Icon, chip }) => (
        <div key={label} className="flex items-center gap-3 rounded-2xl border border-[#e2e7ef] bg-gradient-to-br from-white to-[#f7f9fd] p-3 transition hover:-translate-y-0.5 hover:shadow-md">
          <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${chip}`}>
            <Icon className="h-5 w-5" />
          </span>
          <div>
            <div className="text-xl font-bold tracking-tight">{value}</div>
            <div className="mt-0.5 text-[11px] text-[#777b87]">{label}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
