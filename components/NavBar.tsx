"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import { usePathname } from "next/navigation";
import { Compass, LayoutDashboard, Library, LogOut, PanelLeftClose, PanelLeftOpen, Plus, UserRound } from "lucide-react";
import BrandLogo from "@/components/ui/BrandLogo";
import BrandMark from "@/components/ui/BrandMark";

const navigation = [
  { href: "/dashboard", label: "Өнөөдөр", icon: LayoutDashboard },
  { href: "/library", label: "Миний сан", icon: Library },
  { href: "/discover", label: "Хуваалцсан", icon: Compass },
];

const SIDEBAR_STORAGE_KEY = "nudleye-sidebar-collapsed";

export default function PersistentNavBar() {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setCollapsed(window.localStorage.getItem(SIDEBAR_STORAGE_KEY) === "1");
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    document.documentElement.setAttribute("data-sidebar", collapsed ? "collapsed" : "expanded");
    window.localStorage.setItem(SIDEBAR_STORAGE_KEY, collapsed ? "1" : "0");
  }, [collapsed, mounted]);

  const hidden = pathname === "/" || pathname.startsWith("/auth/");
  if (hidden) return null;

  const initials = (session?.user?.name || session?.user?.email || "NU")
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <>
      <aside className="app-sidebar" data-collapsed={collapsed}>
        <div className={`flex items-center gap-2 ${collapsed ? "flex-col" : "justify-between"}`}>
          <Link href="/dashboard" aria-label="Nudleye" className="min-w-0">
            {collapsed ? <BrandMark className="h-9 w-9" /> : <BrandLogo markClassName="h-10 w-10 shrink-0" />}
          </Link>
          <button
            onClick={() => setCollapsed((value) => !value)}
            className="btn-ghost h-8 w-8 shrink-0 p-0"
            aria-label={collapsed ? "Цэсийг дэлгэх" : "Цэсийг хумих"}
            title={collapsed ? "Цэсийг дэлгэх" : "Цэсийг хумих"}
          >
            {collapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
          </button>
        </div>

        <nav className="mt-8 space-y-1.5">
          {!collapsed && <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[.15em] text-[var(--text-muted)]">Workspace</p>}
          {navigation.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(`${href}/`);
            return (
              <Link
                key={href}
                href={href}
                title={collapsed ? label : undefined}
                className={`${active ? "nav-link nav-link-active" : "nav-link"} ${collapsed ? "justify-center px-0" : ""}`}
              >
                <Icon className="h-[18px] w-[18px] shrink-0" strokeWidth={1.8} aria-hidden="true" />
                {!collapsed && <span>{label}</span>}
                {active && !collapsed && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-current" />}
              </Link>
            );
          })}
        </nav>

        <Link
          href="/deck/create"
          title={collapsed ? "Шинэ багц" : undefined}
          className={`btn-primary mt-7 w-full px-4 py-3 text-sm ${collapsed ? "justify-center px-0" : ""}`}
        >
          <Plus className="h-4 w-4 shrink-0" aria-hidden="true" />
          {!collapsed && "Шинэ багц"}
        </Link>

        <div className={`mt-auto rounded-2xl border border-white/70 bg-white/65 shadow-[0_12px_32px_rgba(39,53,82,.07)] backdrop-blur-xl ${collapsed ? "p-1.5" : "p-2"}`}>
          {status === "loading" ? (
            <div className="flex items-center gap-3 p-2">
              <span className="skeleton-pulse h-9 w-9 shrink-0 rounded-xl bg-[#e9eaf0]" />
              {!collapsed && <span className="skeleton-pulse h-3 flex-1 rounded bg-[#e9eaf0]" />}
            </div>
          ) : session ? (
            <>
              <Link
                href="/profile"
                title={collapsed ? (session.user?.name || "Профайл") : undefined}
                className={`flex items-center gap-3 rounded-xl p-2 transition hover:bg-white ${collapsed ? "justify-center" : ""}`}
              >
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#fff1c7] text-xs font-bold text-[#84530f]">{initials}</span>
                {!collapsed && (
                  <>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-xs font-bold">{session?.user?.name || "Профайл"}</span>
                      <span className="block truncate text-[10px] text-[var(--text-muted)]">{session?.user?.email}</span>
                    </span>
                    <UserRound className="h-4 w-4 shrink-0 text-[var(--text-muted)]" />
                  </>
                )}
              </Link>
              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                title={collapsed ? "Гарах" : undefined}
                className={`nav-utility ${collapsed ? "justify-center" : ""}`}
              >
                <LogOut className="h-4 w-4 shrink-0" />
                {!collapsed && "Гарах"}
              </button>
            </>
          ) : (
            <Link
              href="/auth/signin"
              title={collapsed ? "Нэвтрэх" : undefined}
              className={`flex items-center gap-3 rounded-xl p-2.5 transition hover:bg-white ${collapsed ? "justify-center" : ""}`}
            >
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#fff1c7] text-[#84530f]"><UserRound className="h-4 w-4" /></span>
              {!collapsed && <span className="text-xs font-bold">Нэвтрэх</span>}
            </Link>
          )}
        </div>
      </aside>

      <header className="mobile-topbar">
        <Link href="/dashboard">
          <BrandLogo markClassName="h-8 w-8" />
        </Link>
        <Link href="/deck/create" className="btn-primary px-3 py-2 text-xs">
          <Plus className="h-4 w-4" aria-hidden="true" /> Шинэ багц
        </Link>
      </header>
    </>
  );
}
