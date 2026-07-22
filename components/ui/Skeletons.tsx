import { cn } from "@/lib/cn";

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("skeleton-pulse rounded-lg bg-[#e9eaf0]", className)} aria-hidden="true" />;
}

export function DeckCardSkeleton() {
  return (
    <div className="flex min-h-[252px] flex-col overflow-hidden rounded-[18px] border border-[#dfe2e8] bg-white">
      <div className="flex flex-1 flex-col p-5">
        <div className="flex justify-between">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-3 w-14" />
        </div>
        <Skeleton className="mt-6 h-6 w-2/3" />
        <Skeleton className="mt-3 h-4 w-full" />
        <Skeleton className="mt-2 h-4 w-4/5" />
        <div className="mt-auto pt-6">
          <div className="flex justify-between">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-3 w-8" />
          </div>
          <Skeleton className="mt-2 h-1 w-full rounded-full" />
        </div>
      </div>
      <div className="border-t border-[#e8e9ed] px-5 py-4">
        <Skeleton className="h-4 w-20" />
      </div>
    </div>
  );
}

function DiscoverCardSkeleton() {
  return (
    <div className="flex h-full min-h-[260px] flex-col overflow-hidden rounded-[20px] border border-white/80 bg-white/82">
      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-center justify-between gap-4">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-3 w-24" />
        </div>
        <Skeleton className="mt-5 h-6 w-3/4" />
        <Skeleton className="mt-3 h-4 w-full" />
        <Skeleton className="mt-2 h-4 w-2/3" />
        <div className="mt-auto flex items-center justify-between gap-4 pt-6">
          <Skeleton className="h-3 w-14" />
          <Skeleton className="h-3 w-24" />
        </div>
      </div>
      <div className="border-t border-[#e7dece] px-5 py-4">
        <Skeleton className="h-4 w-24" />
      </div>
    </div>
  );
}

export function DiscoverSkeleton() {
  return (
    <div className="app-shell app-content">
      <main className="page-canvas">
        <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <Skeleton className="h-3 w-44" />
            <Skeleton className="mt-3 h-9 w-72 max-w-full" />
            <Skeleton className="mt-3 h-4 w-96 max-w-full" />
          </div>
          <Skeleton className="h-10 w-28 shrink-0" />
        </div>
        <div className="mb-5 flex flex-wrap gap-2">
          <Skeleton className="h-8 w-36 rounded-full" />
          <Skeleton className="h-8 w-28 rounded-full" />
          <Skeleton className="h-8 w-32 rounded-full" />
        </div>
        <div className="mb-5 flex flex-col gap-2 rounded-[20px] border border-white/80 bg-white/72 p-2 lg:flex-row">
          <Skeleton className="h-10 flex-1" />
          <Skeleton className="h-10 w-full lg:w-72" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => <DiscoverCardSkeleton key={index} />)}
        </div>
      </main>
    </div>
  );
}

function LibraryDeckSkeleton() {
  return (
    <div className="flex h-full min-h-[260px] flex-col overflow-hidden rounded-[20px] border border-white/80 bg-white/82">
      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-center justify-between gap-4">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-3 w-12" />
        </div>
        <Skeleton className="mt-5 h-6 w-2/3" />
        <Skeleton className="mt-3 h-4 w-full" />
        <Skeleton className="mt-2 h-4 w-3/5" />
        <div className="mt-auto pt-6">
          <div className="mb-2 flex items-center justify-between">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-3 w-8" />
          </div>
          <Skeleton className="h-1 w-full rounded-full" />
        </div>
      </div>
      <div className="border-t border-[#e7dece] px-5 py-4">
        <Skeleton className="h-4 w-20" />
      </div>
    </div>
  );
}

export function LibrarySkeleton() {
  return (
    <div className="app-shell app-content">
      <main className="page-canvas">
        <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <Skeleton className="h-3 w-40" />
            <Skeleton className="mt-3 h-9 w-56 max-w-full" />
            <Skeleton className="mt-3 h-4 w-96 max-w-full" />
          </div>
          <Skeleton className="h-10 w-28 shrink-0" />
        </div>
        <div className="mb-5 flex flex-wrap gap-2">
          <Skeleton className="h-9 w-24 rounded-full" />
          <Skeleton className="h-9 w-28 rounded-full" />
          <Skeleton className="h-9 w-28 rounded-full" />
        </div>
        <div className="mb-5 flex flex-col gap-2 rounded-[20px] border border-white/80 bg-white/72 p-2 sm:flex-row sm:items-center">
          <Skeleton className="h-10 flex-1" />
          <Skeleton className="h-10 w-full sm:w-64" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => <LibraryDeckSkeleton key={index} />)}
        </div>
      </main>
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="app-shell app-content">
      <main className="page-canvas">
        <Skeleton className="h-4 w-36" />
        <Skeleton className="mt-3 h-10 w-72" />
        <div className="mt-8 grid gap-4 lg:grid-cols-[1.4fr_.6fr]">
          <Skeleton className="h-64 rounded-2xl" />
          <Skeleton className="h-64 rounded-2xl" />
        </div>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => <DeckCardSkeleton key={index} />)}
        </div>
      </main>
    </div>
  );
}

export function StudySkeleton() {
  return (
    <div className="app-shell app-content">
      <main className="page-canvas max-w-4xl">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="mt-6 h-8 w-64" />
        <Skeleton className="mt-3 h-4 w-80 max-w-full" />
        <Skeleton className="mt-8 h-[380px] w-full rounded-2xl" />
      </main>
    </div>
  );
}
