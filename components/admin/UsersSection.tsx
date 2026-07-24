"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BadgeCheck, Search, ShieldCheck, X } from "lucide-react";
import { fetchJson } from "@/lib/http";

type UserRow = {
  id: string;
  name: string | null;
  email: string;
  role: "USER" | "ADMIN";
  verified: boolean;
  learningReason: string | null;
  createdAt: string;
  deckCount: number;
};

type UsersResponse = { users: UserRow[]; page: number; totalPages: number; total: number };

export default function UsersSection() {
  const queryClient = useQueryClient();
  const [query, setQuery] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [verifiedFilter, setVerifiedFilter] = useState<"all" | "yes" | "no">("all");
  const [roleFilter, setRoleFilter] = useState<"all" | "USER" | "ADMIN">("all");
  const [page, setPage] = useState(1);

  const usersQuery = useQuery({
    queryKey: ["admin-users", searchTerm, verifiedFilter, roleFilter, page],
    queryFn: () =>
      fetchJson<UsersResponse>(
        `/api/admin/users?q=${encodeURIComponent(searchTerm)}&verified=${verifiedFilter}&role=${roleFilter}&page=${page}`
      ),
  });

  const actionMutation = useMutation({
    mutationFn: ({ userId, body }: { userId: string; body: Record<string, string> }) =>
      fetchJson<{ success: boolean }>(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      queryClient.invalidateQueries({ queryKey: ["admin-overview"] });
    },
  });

  function submitSearch(event: React.FormEvent) {
    event.preventDefault();
    setPage(1);
    setSearchTerm(query.trim());
  }

  const data = usersQuery.data;

  return (
    <div>
      <form onSubmit={submitSearch} className="mb-4 flex flex-wrap items-center gap-2">
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9a9184]" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Нэр эсвэл и-мэйлээр хайх..."
            className="h-9 w-full rounded-lg border border-[#e6e3da] bg-white pl-9 pr-3 text-sm outline-none focus:border-[#d4a451]"
          />
        </div>
        <select
          value={verifiedFilter}
          onChange={(event) => { setVerifiedFilter(event.target.value as typeof verifiedFilter); setPage(1); }}
          className="h-9 rounded-lg border border-[#e6e3da] bg-white px-2 text-xs font-semibold text-[#6b6255]"
        >
          <option value="all">Баталгаажилт: бүгд</option>
          <option value="yes">Баталгаажсан</option>
          <option value="no">Баталгаажаагүй</option>
        </select>
        <select
          value={roleFilter}
          onChange={(event) => { setRoleFilter(event.target.value as typeof roleFilter); setPage(1); }}
          className="h-9 rounded-lg border border-[#e6e3da] bg-white px-2 text-xs font-semibold text-[#6b6255]"
        >
          <option value="all">Эрх: бүгд</option>
          <option value="USER">USER</option>
          <option value="ADMIN">ADMIN</option>
        </select>
        <button type="submit" className="h-9 rounded-lg bg-[#fff1c7] px-3 text-xs font-bold text-[#84530f]">Хайх</button>
      </form>

      {usersQuery.isPending ? (
        <div className="space-y-2">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="skeleton-pulse h-12 rounded-xl" />)}</div>
      ) : !data || data.users.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[#e2e3e7] px-4 py-10 text-center text-sm text-[#858995]">Хэрэглэгч олдсонгүй.</div>
      ) : (
        <>
          <div className="overflow-x-auto rounded-xl border border-[#e6e3da]">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="bg-[#faf7f0] text-left text-[10px] font-bold uppercase tracking-wide text-[#9a9184]">
                  <th className="px-3 py-2">Хэрэглэгч</th>
                  <th className="px-3 py-2">Баталгаажилт</th>
                  <th className="px-3 py-2">Эрх</th>
                  <th className="px-3 py-2 text-right">Багц</th>
                  <th className="px-3 py-2 text-right">Бүртгүүлсэн</th>
                  <th className="px-3 py-2 text-right">Үйлдэл</th>
                </tr>
              </thead>
              <tbody>
                {data.users.map((user) => (
                  <tr key={user.id} className="border-t border-[#eee9dc]">
                    <td className="px-3 py-2.5">
                      <div className="font-medium text-[#211f1a]">{user.name || "Нэргүй"}</div>
                      <div className="text-[11px] text-[#9a9184]">{user.email}</div>
                    </td>
                    <td className="px-3 py-2.5">
                      {user.verified ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-[#e8f5ee] px-2 py-0.5 text-[11px] font-semibold text-[#238769]">
                          <BadgeCheck className="h-3 w-3" />Баталгаажсан
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-[#fff2f0] px-2 py-0.5 text-[11px] font-semibold text-[#a84040]">
                          <X className="h-3 w-3" />Баталгаажаагүй
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2.5">
                      <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${user.role === "ADMIN" ? "bg-[#fff1c7] text-[#84530f]" : "bg-[#f1f2f5] text-[#777c89]"}`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-right text-[#6b6255]">{user.deckCount}</td>
                    <td className="px-3 py-2.5 text-right text-[#9a9184]">{new Date(user.createdAt).toLocaleDateString("mn-MN")}</td>
                    <td className="px-3 py-2.5">
                      <div className="flex justify-end gap-1.5">
                        {!user.verified ? (
                          <button
                            onClick={() => actionMutation.mutate({ userId: user.id, body: { action: "verify" } })}
                            disabled={actionMutation.isPending}
                            className="rounded-lg px-2 py-1 text-[11px] font-semibold text-[#238769] transition hover:bg-[#e8f5ee] disabled:opacity-40"
                          >
                            Баталгаажуулах
                          </button>
                        ) : (
                          <button
                            onClick={() => actionMutation.mutate({ userId: user.id, body: { action: "unverify" } })}
                            disabled={actionMutation.isPending}
                            className="rounded-lg px-2 py-1 text-[11px] font-semibold text-[#a84040] transition hover:bg-[#fff2f0] disabled:opacity-40"
                          >
                            Цуцлах
                          </button>
                        )}
                        <button
                          onClick={() => actionMutation.mutate({ userId: user.id, body: { action: "setRole", role: user.role === "ADMIN" ? "USER" : "ADMIN" } })}
                          disabled={actionMutation.isPending}
                          title={user.role === "ADMIN" ? "USER болгох" : "ADMIN болгох"}
                          className="grid h-7 w-7 place-items-center rounded-lg text-[#84530f] transition hover:bg-[#fff1c7] disabled:opacity-40"
                        >
                          <ShieldCheck className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-[#9a9184]">
            <span>Нийт {data.total} хэрэглэгч</span>
            <div className="flex items-center gap-2">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1} className="rounded-lg border border-[#e6e3da] px-2.5 py-1 font-semibold text-[#6b6255] disabled:opacity-30">Өмнөх</button>
              <span>{data.page} / {data.totalPages}</span>
              <button onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))} disabled={page >= data.totalPages} className="rounded-lg border border-[#e6e3da] px-2.5 py-1 font-semibold text-[#6b6255] disabled:opacity-30">Дараах</button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
