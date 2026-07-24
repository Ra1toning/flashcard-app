"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Star } from "lucide-react";
import { fetchJson } from "@/lib/http";
import StatTile from "@/components/admin/StatTile";
import BarChart from "@/components/admin/BarChart";
import LineChart from "@/components/admin/LineChart";
import DonutChart from "@/components/admin/DonutChart";
import Meter from "@/components/admin/Meter";
import ReportsQueue from "@/components/admin/ReportsQueue";
import UsersSection from "@/components/admin/UsersSection";
import { CATEGORICAL } from "@/components/admin/chart-tokens";

type Overview = {
  kpis: {
    totalUsers: number;
    verifiedUsers: number;
    newUsersToday: number;
    newUsers7d: number;
    dau: number;
    wau: number;
    mau: number;
    totalDecks: number;
    publicDecks: number;
    totalCards: number;
    openReports: number;
    pushSubscribers: number;
  };
  signupsByDay: { date: string; count: number }[];
  activeByDay: { date: string; count: number }[];
  sessionsByDay: { date: string; daily: number; test: number; practice: number }[];
  retention: { day1Rate: number; day7Rate: number; day1Eligible: number; day7Eligible: number };
  streakBuckets: { label: string; count: number }[];
  learningReasons: { reason: string; count: number }[];
  topDecks: { id: string; name: string; author: string; cards: number; copies: number; ratingAvg: number; ratingCount: number }[];
};

function formatDay(date: string) {
  const d = new Date(date);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

function Section({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <section className="study-set-card p-5 shadow-[0_18px_45px_rgba(31,42,68,.06)] sm:p-6">
      <h2 className="font-bold text-[#211f1a]">{title}</h2>
      {subtitle && <p className="mt-0.5 text-xs text-[#858995]">{subtitle}</p>}
      <div className="mt-5">{children}</div>
    </section>
  );
}

export default function AdminPage() {
  const { data: session, status } = useSession();
  const overviewQuery = useQuery({
    queryKey: ["admin-overview"],
    queryFn: () => fetchJson<Overview>("/api/admin/overview"),
    enabled: status === "authenticated" && session?.user?.role === "ADMIN",
    staleTime: 30_000,
  });

  if (status === "loading") {
    return <div className="app-shell app-content grid min-h-screen place-items-center"><div className="skeleton-pulse h-10 w-10 rounded-full" /></div>;
  }

  if (status !== "authenticated" || session?.user?.role !== "ADMIN") {
    return (
      <div className="app-shell app-content grid min-h-screen place-items-center px-4">
        <div className="study-set-card w-full max-w-md px-6 py-10 text-center">
          <h1 className="text-lg font-bold">Хандах эрхгүй</h1>
          <p className="mt-2 text-sm text-[#737580]">Энэ хуудас зөвхөн админд зориулагдсан.</p>
          <Link href="/dashboard" className="btn-primary mt-5 inline-flex px-4 py-2.5 text-sm">Нүүр хуудас руу</Link>
        </div>
      </div>
    );
  }

  const data = overviewQuery.data;

  return (
    <div className="app-shell app-content min-h-screen">
      <main className="page-canvas max-w-6xl">
        <Link href="/profile" className="btn-ghost mb-6 px-2 py-2 text-sm"><ArrowLeft className="h-4 w-4" />Профайл</Link>
        <header className="mb-7">
          <p className="eyebrow mb-2">Админ</p>
          <h1 className="text-3xl font-bold tracking-[-.04em]">Хяналтын самбар</h1>
        </header>

        {overviewQuery.isPending || !data ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => <div key={i} className="skeleton-pulse h-24 rounded-2xl" />)}
          </div>
        ) : (
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <StatTile label="Нийт хэрэглэгч" value={data.kpis.totalUsers} sub={`${data.kpis.verifiedUsers} баталгаажсан`} accent />
              <StatTile label="Идэвхтэй өнөөдөр" value={data.kpis.dau} sub={`7х: ${data.kpis.wau} · 30х: ${data.kpis.mau}`} />
              <StatTile label="Шинэ бүртгэл" value={data.kpis.newUsersToday} sub={`7 хоногт ${data.kpis.newUsers7d}`} />
              <StatTile label="Шийдвэрлээгүй мэдэгдэл" value={data.kpis.openReports} accent={data.kpis.openReports > 0} />
              <StatTile label="Нийт багц" value={data.kpis.totalDecks} sub={`${data.kpis.publicDecks} нээлттэй`} />
              <StatTile label="Нийт карт" value={data.kpis.totalCards} />
              <StatTile label="Push асаасан" value={data.kpis.pushSubscribers} />
              <StatTile label="MAU / нийт" value={`${data.kpis.totalUsers > 0 ? Math.round((data.kpis.mau / data.kpis.totalUsers) * 100) : 0}%`} sub="сарын идэвх" />
            </div>

            <div className="grid gap-5 lg:grid-cols-2">
              <Section title="Шинэ бүртгэл" subtitle="Сүүлийн 30 хоног">
                <BarChart
                  data={data.signupsByDay.map((d) => ({ x: d.date, count: d.count }))}
                  series={[{ key: "count", label: "Бүртгэл", color: CATEGORICAL[0].hex }]}
                  formatX={formatDay}
                />
              </Section>
              <Section title="Идэвхтэй хэрэглэгч (DAU)" subtitle="Сүүлийн 30 хоног">
                <LineChart
                  data={data.activeByDay.map((d) => ({ x: d.date, count: d.count }))}
                  series={[{ key: "count", label: "Идэвхтэй", color: CATEGORICAL[0].hex }]}
                  formatX={formatDay}
                />
              </Section>
            </div>

            <Section title="Давталтын төрөл" subtitle="Өдөр тутам, сүүлийн 30 хоног">
              <BarChart
                data={data.sessionsByDay.map((d) => ({ x: d.date, daily: d.daily, test: d.test, practice: d.practice }))}
                series={[
                  { key: "daily", label: "Өдрийн давталт", color: CATEGORICAL[0].hex },
                  { key: "test", label: "Тест", color: CATEGORICAL[1].hex },
                  { key: "practice", label: "Дадлага", color: CATEGORICAL[2].hex },
                ]}
                formatX={formatDay}
              />
            </Section>

            <div className="grid gap-5 lg:grid-cols-2">
              <Section title="Тогтвортой байдал" subtitle="Бүртгүүлснээс хойшхи буцах хувь">
                <div className="space-y-5">
                  <Meter label="1 дэх өдөр буцсан" value={data.retention.day1Rate} sublabel={`${data.retention.day1Eligible} хэрэглэгч тохирсон`} />
                  <Meter label="7 дах өдөр буцсан" value={data.retention.day7Rate} sublabel={`${data.retention.day7Eligible} хэрэглэгч тохирсон`} />
                </div>
              </Section>
              <Section title="Streak тархалт" subtitle="Хэдэн хэрэглэгч хэдэн өдөр дараалж байгаа">
                <BarChart
                  data={data.streakBuckets.map((b) => ({ x: b.label, count: b.count }))}
                  series={[{ key: "count", label: "Хэрэглэгч", color: CATEGORICAL[2].hex }]}
                  formatX={(x) => `${x} өдөр`}
                />
              </Section>
            </div>

            <div className="grid gap-5 lg:grid-cols-[1fr_1.3fr]">
              <Section title="Сурах шалтгаан" subtitle="Бүртгэл дээр сонгосон">
                <DonutChart
                  data={data.learningReasons.map((r, i) => ({ label: r.reason, value: r.count, color: CATEGORICAL[i % CATEGORICAL.length].hex }))}
                />
              </Section>
              <Section title="Шилдэг нээлттэй багцууд" subtitle="Хамгийн олон удаа хадгалагдсанаар">
                {data.topDecks.length === 0 ? (
                  <p className="text-sm text-[#858995]">Нээлттэй багц алга.</p>
                ) : (
                  <div className="overflow-hidden rounded-xl border border-[#e6e3da]">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-[#faf7f0] text-left text-[10px] font-bold uppercase tracking-wide text-[#9a9184]">
                          <th className="px-3 py-2">Багц</th>
                          <th className="px-3 py-2 text-right">Карт</th>
                          <th className="px-3 py-2 text-right">Хадгалалт</th>
                          <th className="px-3 py-2 text-right">Үнэлгээ</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.topDecks.map((deck) => (
                          <tr key={deck.id} className="border-t border-[#eee9dc]">
                            <td className="px-3 py-2">
                              <Link href={`/deck/${deck.id}`} target="_blank" className="font-medium text-[#211f1a] hover:text-[#84530f]">{deck.name}</Link>
                              <div className="text-[11px] text-[#9a9184]">{deck.author}</div>
                            </td>
                            <td className="px-3 py-2 text-right text-[#6b6255]">{deck.cards}</td>
                            <td className="px-3 py-2 text-right text-[#6b6255]">{deck.copies}</td>
                            <td className="px-3 py-2 text-right">
                              {deck.ratingCount > 0 ? (
                                <span className="inline-flex items-center gap-1 font-semibold text-[#9a6418]">
                                  <Star className="h-3 w-3 fill-[#e6a52c] text-[#e6a52c]" />{deck.ratingAvg.toFixed(1)}
                                </span>
                              ) : (
                                <span className="text-[#c3c6cf]">—</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </Section>
            </div>

            <Section title="Хэрэглэгчид" subtitle="Хайх, и-мэйл баталгаажуулах, эрх өөрчлөх">
              <UsersSection />
            </Section>

            <Section title="Модерацийн жагсаалт" subtitle="Мэдэгдсэн багц, картуудыг шалгах">
              <ReportsQueue />
            </Section>
          </div>
        )}
      </main>
    </div>
  );
}
