"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Compass, LayoutDashboard, User } from "lucide-react";

const items = [
  { label: "Өнөөдөр", path: "/dashboard", icon: LayoutDashboard },
  { label: "Хуваалцсан", path: "/discover", icon: Compass },
  { label: "Профайл", path: "/profile", icon: User },
];

export default function BottomNav() {
  const pathname = usePathname();
  if (pathname === "/" || pathname.startsWith("/auth/")) return null;

  return (
    <nav className="fixed inset-x-3 bottom-3 z-50 rounded-2xl border border-white/80 bg-white/85 p-1.5 shadow-[0_16px_45px_rgba(31,42,68,.16)] backdrop-blur-2xl lg:hidden">
      <div className="grid grid-cols-3 gap-1">
        {items.map(({ label, path, icon: Icon }) => {
          const active = pathname === path || pathname.startsWith(`${path}/`);
          return (
            <Link
              key={path}
              href={path}
              className={`flex min-h-12 flex-col items-center justify-center gap-1 rounded-xl px-2 py-1.5 text-center text-[10px] font-semibold transition ${
                active ? "bg-[#fff1c7] text-[#84530f] shadow-sm" : "text-[#777168] hover:bg-white"
              }`}
            >
              <Icon className="h-[18px] w-[18px]" aria-hidden="true" />
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
