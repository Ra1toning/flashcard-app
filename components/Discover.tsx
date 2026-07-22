"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import * as Dialog from "@radix-ui/react-dialog";
import * as Tabs from "@radix-ui/react-tabs";
import { AnimatePresence, motion } from "framer-motion";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowRight, Flag, Search, Star, X } from "lucide-react";
import { MotionItem, PageMotion } from "@/components/ui/Motion";
import { DiscoverSkeleton } from "@/components/ui/Skeletons";
import { fetchJson } from "@/lib/http";
import DecorativeLayer from "@/components/ui/DecorativeLayer";
import StarRating from "@/components/StarRating";
import ReportDialog from "@/components/ReportDialog";
import type { ReportReason } from "@/lib/report";

type DeckRating = { average: number; count: number };
type PublicDeck = {
  id: string;
  name: string;
  emoji: string;
  description?: string;
  author: string;
  words: number;
  users: number;
  createdAt: string;
  rating: DeckRating;
};
type PublicDeckDetail = {
  id: string;
  wordsList: Array<{
    id: string;
    korean: string;
    mongolian: string;
  }>;
};
type Filter = "all" | "trending" | "popular" | "new";

export default function DiscoverPage() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const { status } = useSession();
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<PublicDeck | null>(null);
  const [notice, setNotice] = useState("");
  const [reportTarget, setReportTarget] = useState<string | null>(null);
  const [reportError, setReportError] = useState("");

  function showNotice(message: string) {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 3000);
  }

  const decksQuery = useQuery({
    queryKey: ["discover", filter],
    queryFn: () => fetchJson<{ decks: PublicDeck[] }>(`/api/discover?filter=${filter}&limit=30`),
  });
  const statsQuery = useQuery({
    queryKey: ["discover-stats"],
    queryFn: () => fetchJson<{ totalDecks: number; totalCards: number; totalUsers: number }>("/api/discover/stats"),
    staleTime: 2 * 60_000,
  });
  const detailQuery = useQuery({
    queryKey: ["deck", selected?.id],
    queryFn: () => fetchJson<PublicDeckDetail>(`/api/decks/${selected?.id}`),
    enabled: Boolean(selected?.id),
    staleTime: 2 * 60_000,
  });
  const addMutation = useMutation({
    mutationFn: (deckId: string) => fetchJson<{ deckId: string; success: boolean }>("/api/decks/add-to-library", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ deckId }),
    }),
    onSuccess: () => {
      setSelected(null);
      setNotice("Хадгалсан багцад нэмлээ. Энэ хуулбар зөвхөн танд харагдана.");
      queryClient.invalidateQueries({ queryKey: ["decks"] });
      window.setTimeout(() => setNotice(""), 3000);
    },
    onError: (error) => setNotice(error instanceof Error ? error.message : "Алдаа гарлаа."),
  });
  const reportMutation = useMutation({
    mutationFn: ({ deckId, category, detail }: { deckId: string; category: ReportReason; detail: string }) => fetchJson<{ success: boolean }>(`/api/decks/${deckId}/report`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ category, detail }),
    }),
    onSuccess: () => {
      setReportTarget(null);
      setReportError("");
      showNotice("Мэдэгдсэнд баярлалаа. Бид шалгаж үзье.");
    },
    onError: (error) => setReportError(error instanceof Error ? error.message : "Мэдээллийг илгээж чадсангүй."),
  });

  function saveDeck(deckId: string) {
    if (status !== "authenticated") {
      router.push("/auth/signin");
      return;
    }
    addMutation.mutate(deckId);
  }

  const decks = decksQuery.data?.decks ?? [];
  const stats = statsQuery.data ?? { totalDecks: 0, totalCards: 0, totalUsers: 0 };
  const filtered = useMemo(() => decks.filter((deck) => {
    const search = query.trim().toLowerCase();
    return !search || deck.name.toLowerCase().includes(search) || deck.author.toLowerCase().includes(search);
  }), [decks, query]);

  if (decksQuery.isPending) return <DiscoverSkeleton />;

  return (
    <div className="app-shell app-content">
      <PageMotion className="page-canvas">
        <MotionItem className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <div className="eyebrow mb-3">Бусдын бүтээсэн суралцах материал</div>
            <h1 className="text-3xl font-bold tracking-[-0.04em] sm:text-4xl">Хуваалцсан багцууд</h1>
            <p className="mt-2 text-[#74727c]">Бусдын бүтээсэн багцаас хэрэгтэй үгсээ олж, өөрийн сандаа нэмээрэй.</p>
          </div>
          <button onClick={() => Promise.all([decksQuery.refetch(), statsQuery.refetch()])} disabled={decksQuery.isFetching} className="btn-secondary w-fit px-4 py-2.5 text-sm disabled:opacity-50">
            {decksQuery.isFetching ? "Шинэчилж байна..." : "Шинэчлэх"}
          </button>
        </MotionItem>

        <MotionItem className="mb-5 flex flex-wrap items-center gap-2 text-xs text-[#777985]">
          <span className="rounded-full border border-white/80 bg-white/65 px-3.5 py-2 shadow-sm backdrop-blur-xl"><strong className="text-[#303441]">{statsQuery.isPending ? "..." : stats.totalDecks}</strong> хуваалцсан багц</span>
          <span className="rounded-full border border-white/80 bg-white/65 px-3.5 py-2 shadow-sm backdrop-blur-xl"><strong className="text-[#303441]">{statsQuery.isPending ? "..." : stats.totalCards}</strong> нийт карт</span>
          <span className="rounded-full border border-white/80 bg-white/65 px-3.5 py-2 shadow-sm backdrop-blur-xl"><strong className="text-[#303441]">{statsQuery.isPending ? "..." : stats.totalUsers}</strong> суралцагч</span>
        </MotionItem>

        <MotionItem>
          <Tabs.Root value={filter} onValueChange={(value) => setFilter(value as Filter)}>
            <div className="mb-5 flex flex-col gap-2 rounded-[20px] border border-white/80 bg-white/72 p-2 shadow-[0_12px_34px_rgba(32,43,70,.07)] backdrop-blur-xl lg:flex-row">
              <div className="relative min-w-0 flex-1">
                <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8c919d]" aria-hidden="true" />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  className="h-10 w-full rounded-xl bg-[#f7f8fa] pl-10 pr-4 text-sm outline-none transition placeholder:text-[#999da7] hover:bg-[#f3f5f8] focus:bg-white focus:ring-2 focus:ring-[#cbd8fa]"
                  placeholder="Багц эсвэл зохиогч хайх..."
                />
              </div>
              <Tabs.List className="grid grid-cols-4 rounded-xl bg-[#f0f1f4] p-1 lg:flex">
                {([
                  ["all", "Бүгд"],
                  ["trending", "Идэвхтэй"],
                  ["popular", "Алдартай"],
                  ["new", "Шинэ"],
                ] as const).map(([value, label]) => (
                  <Tabs.Trigger key={value} value={value} className="whitespace-nowrap rounded-lg px-3 py-2 text-xs font-bold text-[#777168] transition hover:text-[#302b24] data-[state=active]:bg-white data-[state=active]:text-[#84530f] data-[state=active]:shadow-sm">
                    {label}
                  </Tabs.Trigger>
                ))}
              </Tabs.List>
            </div>
          </Tabs.Root>
        </MotionItem>

        <MotionItem>
          {decksQuery.isError ? (
            <div className="study-set-card px-6 py-14 text-center text-sm text-[#c84b4b]">
              <p>{decksQuery.error.message}</p>
              <button onClick={() => decksQuery.refetch()} className="btn-secondary mt-4 px-4 py-2 text-sm">Дахин оролдох</button>
            </div>
          ) : filtered.length === 0 ? (
            <div className="learning-card px-6 py-14 text-center"><h2 className="font-extrabold">Багц олдсонгүй</h2><p className="mt-2 text-sm text-[#777681]">Хайлт эсвэл шүүлтүүрээ өөрчилнө үү.</p></div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
              {filtered.map((deck, index) => (
                <motion.article
                  key={deck.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.035 }}
                  className="group relative flex h-full min-h-[260px] flex-col overflow-hidden rounded-[20px] border border-white/80 bg-white/82 shadow-[0_8px_28px_rgba(31,42,68,.07)] backdrop-blur-xl transition duration-200 hover:-translate-y-1 hover:border-[#c8d5ee] hover:shadow-[0_22px_48px_rgba(31,42,68,.12)]"
                >
                  <DecorativeLayer variant="deck" />
                  <button onClick={() => setSelected(deck)} className="relative z-10 flex flex-1 flex-col p-5 text-left">
                    <div className="flex items-center justify-between gap-4 text-[11px] font-semibold text-[#858995]">
                      <span className="truncate">{deck.author}</span>
                      {deck.rating.count > 0 ? (
                        <span className="inline-flex shrink-0 items-center gap-1 text-[#9a6418]">
                          <Star className="h-3 w-3 fill-[#e6a52c] text-[#e6a52c]" />
                          {deck.rating.average.toFixed(1)} ({deck.rating.count})
                        </span>
                      ) : (
                        <span className="shrink-0 text-[#a9adb8]">Шинэ</span>
                      )}
                    </div>

                    <div className="mt-5">
                      <h2 className="line-clamp-2 text-xl font-bold leading-7 tracking-[-.035em] text-[#211f1a] transition group-hover:text-[#84530f]">
                        {deck.name}
                      </h2>
                      <p className="mt-2 line-clamp-3 min-h-[60px] text-sm leading-5 text-[#777c89]">
                        {deck.description || "Энэ багцад тайлбар оруулаагүй байна."}
                      </p>
                    </div>

                    <div className="mt-auto flex items-center justify-between gap-4 pt-6 text-xs text-[#777c89]">
                      <span>{deck.words} карт</span>
                      <span>{deck.users} хүн хадгалсан</span>
                    </div>
                  </button>
                  <button
                    onClick={() => saveDeck(deck.id)}
                    disabled={addMutation.isPending}
                    className="relative z-10 flex h-12 items-center justify-between border-t border-[#e7dece] px-5 text-sm font-semibold text-[#84530f] transition hover:bg-[#fff6df] disabled:opacity-50"
                  >
                    <span>{addMutation.isPending && addMutation.variables === deck.id ? "Хадгалж байна..." : "Хадгалах"}</span>
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
                  </button>
                </motion.article>
              ))}
            </div>
          )}
        </MotionItem>
      </PageMotion>

      <Dialog.Root open={Boolean(selected)} onOpenChange={(open) => !open && setSelected(null)}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-[#272331]/35 backdrop-blur-sm data-[state=open]:animate-[fadeIn_.2s_ease]" />
          {selected && (
            <Dialog.Content className="dialog-content fixed left-1/2 top-1/2 z-50 flex max-h-[88vh] w-[calc(100%-2rem)] max-w-3xl -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-[24px] border border-white/80 bg-white/92 shadow-[0_28px_80px_rgba(27,35,55,.2)] backdrop-blur-2xl outline-none">
              <div className="border-b border-[#e6e8ec] px-5 py-4 sm:px-6">
                <div className="flex items-start gap-4">
                  <div className="min-w-0 flex-1">
                    <Dialog.Title className="text-xl font-bold tracking-[-.035em] sm:text-2xl">{selected.name}</Dialog.Title>
                    <Dialog.Description className="mt-1 text-sm text-[#777c89]">
                      {selected.author} · {selected.words} карт
                    </Dialog.Description>
                  </div>
                  <Dialog.Close className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-[#777c89] transition hover:bg-[#f1f2f5] hover:text-[#202337]" aria-label="Хаах">
                    <X className="h-4 w-4" />
                  </Dialog.Close>
                </div>
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-6">
                {selected.description && (
                  <p className="mb-5 max-w-2xl text-sm leading-6 text-[#696e7b]">{selected.description}</p>
                )}
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-[#303441]">Бүх карт</h3>
                  <span className="text-xs text-[#858995]">
                    {detailQuery.data?.wordsList.length ?? selected.words}
                  </span>
                </div>

                {detailQuery.isPending ? (
                  <div className="overflow-hidden rounded-xl border border-[#e3e5e9]">
                    {Array.from({ length: 6 }).map((_, row) => (
                      <div key={row} className="grid grid-cols-[32px_1fr_1fr] gap-3 border-b border-[#eceef1] px-4 py-3 last:border-0">
                        <div className="h-4 animate-pulse rounded bg-[#eceef2]" />
                        <div className="h-4 animate-pulse rounded bg-[#eceef2]" />
                        <div className="h-4 animate-pulse rounded bg-[#eceef2]" />
                      </div>
                    ))}
                  </div>
                ) : detailQuery.isError ? (
                  <div className="rounded-xl border border-[#efcaca] bg-[#fff7f6] px-4 py-5 text-center text-sm text-[#a84040]">
                    <p>{detailQuery.error.message}</p>
                    <button onClick={() => detailQuery.refetch()} className="mt-3 font-semibold underline underline-offset-4">Дахин оролдох</button>
                  </div>
                ) : detailQuery.data?.wordsList.length ? (
                  <div className="overflow-hidden rounded-xl border border-[#e3e5e9]">
                    {detailQuery.data.wordsList.map((word, wordIndex) => (
                      <div key={word.id} className="grid grid-cols-[32px_minmax(0,1fr)_minmax(0,1fr)] gap-3 border-b border-[#eceef1] px-4 py-3 text-sm last:border-0 hover:bg-[#fafbfc]">
                        <span className="font-mono text-xs text-[#a0a4ad]">{String(wordIndex + 1).padStart(2, "0")}</span>
                        <span className="break-words font-medium text-[#303441]">{word.korean}</span>
                        <span className="break-words text-[#696e7b]">{word.mongolian}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-xl border border-[#e3e5e9] px-4 py-8 text-center text-sm text-[#858995]">Энэ багц хоосон байна.</div>
                )}
              </div>

              <div className="flex flex-col gap-3 border-t border-[#e6e8ec] bg-[#fafbfc] px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                <div className="flex items-center gap-4">
                  {selected.rating.count > 0 && (
                    <span className="inline-flex items-center gap-1.5 text-xs text-[#7e828e]">
                      <StarRating value={Math.round(selected.rating.average)} readOnly size={14} />
                      {selected.rating.average.toFixed(1)} ({selected.rating.count})
                    </span>
                  )}
                  <button onClick={() => { setReportError(""); setReportTarget(selected.id); }} className="inline-flex shrink-0 items-center gap-1.5 text-xs font-semibold text-[#858995] transition hover:text-[#a84040]">
                    <Flag className="h-3.5 w-3.5" />Мэдэгдэх
                  </button>
                </div>
                <button
                  onClick={() => saveDeck(selected.id)}
                  disabled={addMutation.isPending}
                  className="btn-primary shrink-0 px-5 py-2.5 text-sm disabled:opacity-50"
                >
                  {addMutation.isPending ? "Хадгалж байна..." : "Хадгалах"}
                </button>
              </div>
            </Dialog.Content>
          )}
        </Dialog.Portal>
      </Dialog.Root>

      <ReportDialog
        open={reportTarget !== null}
        onOpenChange={(open) => { if (!open) { setReportTarget(null); setReportError(""); } }}
        onSubmit={(payload) => reportTarget && reportMutation.mutate({ deckId: reportTarget, ...payload })}
        pending={reportMutation.isPending}
        error={reportError}
        title="Багц мэдэгдэх"
        subtitle="Энэ багцад асуудал байвал шалтгааныг сонгож бидэнд мэдэгдээрэй."
      />

      <AnimatePresence>
        {notice && (
          <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 18 }}
            role="status"
            aria-live="polite"
            className="app-toast fixed bottom-24 left-4 right-4 z-[60] rounded-2xl border px-4 py-3.5 text-sm font-semibold shadow-2xl backdrop-blur-xl sm:left-auto sm:max-w-md lg:bottom-5">
            {notice}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
