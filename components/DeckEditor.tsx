"use client";

import { useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Check, ClipboardPaste, Globe2, Loader2, Lock, Pencil, Plus, Trash2, X } from "lucide-react";
import { fetchJson } from "@/lib/http";

type WordPair = { id: string; korean: string; mongolian: string };
type FormData = { name: string; description: string; emoji: string; isPublic: boolean };

export default function DeckEditor({ deckId }: { deckId?: string }) {
  const { status } = useSession();
  const router = useRouter();
  const queryClient = useQueryClient();
  const frontRef = useRef<HTMLInputElement>(null);
  const backRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState<FormData>({ name: "", description: "", emoji: "📚", isPublic: false });
  const [words, setWords] = useState<WordPair[]>([]);
  const [draft, setDraft] = useState({ korean: "", mongolian: "" });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(Boolean(deckId));
  const [error, setError] = useState("");
  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkText, setBulkText] = useState("");
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/auth/signin");
  }, [status, router]);

  useEffect(() => {
    if (!dirty) return;
    function handleBeforeUnload(event: BeforeUnloadEvent) {
      event.preventDefault();
    }
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [dirty]);

  function goBack() {
    if (dirty && !window.confirm("Хадгалаагүй өөрчлөлт байна. Гарах уу?")) return;
    router.back();
  }

  useEffect(() => {
    if (!deckId || status !== "authenticated") return;
    fetch(`/api/decks/${deckId}`)
      .then(async (response) => {
        if (!response.ok) throw new Error("Багцыг ачаалж чадсангүй.");
        return response.json();
      })
      .then((data) => {
        if (!data.isOwner) throw new Error("Энэ багцыг засах эрхгүй байна.");
        setForm({
          name: data.name ?? "",
          description: data.description ?? "",
          emoji: data.emoji || "📚",
          isPublic: Boolean(data.isPublic),
        });
        setWords((data.wordsList ?? []).map((word: { id: string; korean: string; mongolian: string }) => ({
          id: word.id,
          korean: word.korean,
          mongolian: word.mongolian,
        })));
      })
      .catch((loadError) => setError(loadError instanceof Error ? loadError.message : "Алдаа гарлаа."))
      .finally(() => setLoading(false));
  }, [deckId, status]);

  const saveMutation = useMutation({
    mutationFn: () => fetchJson<{ id?: string }>(deckId ? `/api/decks/${deckId}` : "/api/decks", {
      method: deckId ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(deckId ? { ...form, cards: words } : { ...form, words }),
    }),
    onSuccess: async (data) => {
      setDirty(false);
      await queryClient.invalidateQueries({ queryKey: ["decks"] });
      if (deckId) await queryClient.invalidateQueries({ queryKey: ["deck", deckId] });
      router.push(`/deck/${deckId || data.id}`);
      router.refresh();
    },
    onError: (saveError) => setError(saveError instanceof Error ? saveError.message : "Алдаа гарлаа."),
  });

  function upsertWord() {
    const korean = draft.korean.trim();
    const mongolian = draft.mongolian.trim();
    if (!korean || !mongolian) return;

    setWords((current) => editingId
      ? current.map((word) => word.id === editingId ? { ...word, korean, mongolian } : word)
      : [...current, { id: crypto.randomUUID(), korean, mongolian }]
    );
    setDraft({ korean: "", mongolian: "" });
    setEditingId(null);
    setDirty(true);
    requestAnimationFrame(() => frontRef.current?.focus());
  }

  function editWord(word: WordPair) {
    setEditingId(word.id);
    setDraft({ korean: word.korean, mongolian: word.mongolian });
    frontRef.current?.focus();
  }

  function cancelEdit() {
    setEditingId(null);
    setDraft({ korean: "", mongolian: "" });
    frontRef.current?.focus();
  }

  function parseBulkWords() {
    const pairs = bulkText
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const parts = line.includes("\t")
          ? line.split("\t")
          : line.includes(" - ")
            ? line.split(" - ")
            : line.split(",");
        const front = parts.shift()?.trim() || "";
        const back = parts.join(line.includes("\t") ? "\t" : line.includes(" - ") ? " - " : ",").trim();
        return { front, back };
      })
      .filter((pair) => pair.front && pair.back);

    if (!pairs.length) {
      setError("Оруулах мөр бүр front - back, front, back эсвэл tab-аар тусгаарлагдсан байна.");
      return;
    }

    setWords((current) => [
      ...current,
      ...pairs.map((pair) => ({ id: crypto.randomUUID(), korean: pair.front, mongolian: pair.back })),
    ]);
    setBulkText("");
    setBulkOpen(false);
    setDirty(true);
    setError("");
    requestAnimationFrame(() => frontRef.current?.focus());
  }

  function saveDeck() {
    setError("");
    if (!form.name.trim()) return setError("Багцын нэр оруулна уу.");
    if (words.length === 0) return setError("Дор хаяж нэг үг нэмнэ үү.");
    saveMutation.mutate();
  }

  if (status === "loading" || loading) {
    return <div className="app-shell app-content grid min-h-screen place-items-center"><Loader2 className="h-6 w-6 animate-spin text-[#b7791f]" /></div>;
  }

  return (
    <div className="app-shell app-content min-h-screen">
      <main className="page-canvas max-w-6xl">
        <header className="sticky top-0 z-20 -mx-2 mb-6 flex items-center justify-between gap-4 rounded-b-2xl border-b border-white/80 bg-[#f7f9fd]/80 px-2 py-3 backdrop-blur-2xl lg:top-0">
          <div className="flex min-w-0 items-center gap-3">
            <button onClick={goBack} className="btn-ghost h-9 w-9 shrink-0 p-0" aria-label="Буцах">
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div className="min-w-0">
              <h1 className="truncate text-xl font-bold tracking-[-0.025em]">{deckId ? "Багц засах" : "Шинэ багц"}</h1>
              <p className="text-xs text-[#777985]">{words.length} үг нэмсэн</p>
            </div>
          </div>
          <button onClick={saveDeck} disabled={saveMutation.isPending} className="btn-primary px-4 py-2.5 text-sm disabled:opacity-50">
            {saveMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
            {saveMutation.isPending ? "Хадгалж байна..." : dirty ? "Өөрчлөлт хадгалах" : "Хадгалах"}
          </button>
        </header>

        {error && <div className="mb-4 rounded-lg border border-[#efcaca] bg-[#fff2f0] px-4 py-3 text-sm text-[#a84040]">{error}</div>}

        <section className="panel mb-6 grid gap-4 p-4 sm:p-5 lg:grid-cols-[1fr_1.25fr_220px]">
          <div>
            <label className="label" htmlFor="deck-name">Багцын нэр</label>
            <input
              id="deck-name"
              value={form.name}
              onChange={(event) => { setForm({ ...form, name: event.target.value }); setDirty(true); }}
              className="field"
              maxLength={80}
              placeholder="Жишээ: IELTS Academic"
            />
          </div>
          <div>
            <label className="label" htmlFor="deck-description">Тайлбар</label>
            <input
              id="deck-description"
              value={form.description}
              onChange={(event) => { setForm({ ...form, description: event.target.value }); setDirty(true); }}
              className="field"
              maxLength={300}
              placeholder="Энэ багцын талаар товч бичээрэй"
            />
          </div>
          <div>
            <span className="label">Харагдах байдал</span>
            <button
              type="button"
              onClick={() => { setForm({ ...form, isPublic: !form.isPublic }); setDirty(true); }}
              className="flex h-[44px] w-full items-center justify-between rounded-xl border border-[#d5dce7] bg-white/85 px-3 text-left text-sm shadow-sm transition hover:border-[#b9c5d8]"
            >
              <span className="flex items-center gap-2 font-medium">
                {form.isPublic ? <Globe2 className="h-4 w-4 text-[#b7791f]" /> : <Lock className="h-4 w-4 text-[#777168]" />}
                {form.isPublic ? "Бусдад нээлттэй" : "Зөвхөн надад"}
              </span>
              <span className={`h-5 w-9 rounded-full p-1 transition ${form.isPublic ? "bg-[#b7791f]" : "bg-[#d8d1c5]"}`}>
                <span className={`block h-3 w-3 rounded-full bg-white transition ${form.isPublic ? "translate-x-4" : ""}`} />
              </span>
            </button>
          </div>
        </section>

        <section>
          <div className="mb-3 flex items-end justify-between gap-4">
            <div>
              <h2 className="font-bold">Үгийн жагсаалт</h2>
              <p className="mt-0.5 text-xs text-[#777985]">Enter дарж дараагийн үгээ нэмээрэй.</p>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={() => setBulkOpen((value) => !value)} className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#84530f]">
                <ClipboardPaste className="h-4 w-4" /> Олон мөрөөр нэмэх
              </button>
              {editingId && <button onClick={cancelEdit} className="text-xs font-semibold text-[#777985] hover:text-[#353747]">Засварыг цуцлах</button>}
            </div>
          </div>

          {bulkOpen && (
            <div className="mb-3 rounded-2xl border border-[#cfdaf3] bg-[#f3f6ff]/90 p-4 shadow-sm">
              <div className="mb-2 flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-sm font-bold">Олон үгийг нэг дор оруулах</h3>
                  <p className="mt-0.5 text-xs text-[#737a8c]">Мөр бүрийг “үг - утга” хэлбэрээр оруулна.</p>
                </div>
                <button onClick={() => setBulkOpen(false)} className="btn-ghost h-8 w-8 p-0" aria-label="Олон мөрийн хэсгийг хаах"><X className="h-4 w-4" /></button>
              </div>
              <textarea
                value={bulkText}
                onChange={(event) => setBulkText(event.target.value)}
                className="field min-h-28 resize-y font-mono text-sm"
                placeholder={"photosynthesis - гэрэл нийлэгжил\ncell, эс\nvariable\tхувьсагч"}
              />
              <div className="mt-2 flex justify-end">
                <button onClick={parseBulkWords} disabled={!bulkText.trim()} className="btn-primary px-4 py-2 text-xs disabled:opacity-40">Жагсаалтад нэмэх</button>
              </div>
            </div>
          )}

          <div className="grid gap-3 rounded-[20px] border border-white/80 bg-white/78 p-4 shadow-[0_14px_36px_rgba(31,42,68,.07)] backdrop-blur-xl md:grid-cols-[1fr_1fr_auto]">
            <div>
              <label className="label" htmlFor="front-side">Асуух тал</label>
              <input
                id="front-side"
                ref={frontRef}
                value={draft.korean}
                onChange={(event) => setDraft({ ...draft, korean: event.target.value })}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    backRef.current?.focus();
                  }
                }}
                className="field"
                maxLength={200}
                placeholder="Үг, нэр томьёо эсвэл асуулт"
              />
            </div>
            <div>
              <label className="label" htmlFor="back-side">Хариу тал</label>
              <input
                id="back-side"
                ref={backRef}
                value={draft.mongolian}
                onChange={(event) => setDraft({ ...draft, mongolian: event.target.value })}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    upsertWord();
                  }
                }}
                className="field"
                maxLength={200}
                placeholder="Утга, орчуулга эсвэл хариулт"
              />
            </div>
            <button
              onClick={upsertWord}
              disabled={!draft.korean.trim() || !draft.mongolian.trim()}
              className="btn-secondary mt-auto h-[42px] px-4 text-sm disabled:opacity-40"
            >
              {editingId ? <Check className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
              {editingId ? "Шинэчлэх" : "Нэмэх"}
            </button>
          </div>

          <div className="mt-4 overflow-hidden rounded-[20px] border border-white/80 bg-white/82 shadow-[0_12px_34px_rgba(31,42,68,.06)] backdrop-blur-xl">
            <div className="hidden grid-cols-[48px_1fr_1fr_84px] border-b border-[#e2e3e7] bg-[#fafafa] px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-[#858792] sm:grid">
              <span>#</span><span>Асуух тал</span><span>Хариу тал</span><span className="text-right">Үйлдэл</span>
            </div>
            {words.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-[#777985]">
                Дээрх мөрөөс эхний үгээ нэмнэ үү.
              </div>
            ) : (
              words.map((word, index) => (
                <div
                  key={word.id}
                  className={`grid gap-2 border-b border-[#ece6dc] px-3 py-3.5 transition last:border-0 hover:bg-[#fffaf0] sm:grid-cols-[48px_1fr_1fr_84px] sm:items-center ${editingId === word.id ? "bg-[#fff1c7]" : ""}`}
                >
                  <span className="hidden font-mono text-xs text-[#999aa3] sm:block">{String(index + 1).padStart(2, "0")}</span>
                  <div className="min-w-0">
                    <span className="mb-0.5 block text-[10px] uppercase text-[#999aa3] sm:hidden">Асуух тал</span>
                    <span className="block truncate text-sm font-medium">{word.korean}</span>
                  </div>
                  <div className="min-w-0">
                    <span className="mb-0.5 block text-[10px] uppercase text-[#999aa3] sm:hidden">Хариу тал</span>
                    <span className="block truncate text-sm text-[#656773]">{word.mongolian}</span>
                  </div>
                  <div className="flex justify-end gap-1">
                    <button onClick={() => editWord(word)} className="btn-ghost h-8 w-8 p-0" aria-label={`${word.korean} үгийг засах`}>
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => { setWords((current) => current.filter((item) => item.id !== word.id)); setDirty(true); }}
                      className="btn-ghost h-8 w-8 p-0 hover:text-[#c84b4b]"
                      aria-label={`${word.korean} үгийг устгах`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
