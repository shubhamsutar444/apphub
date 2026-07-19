"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Smartphone, LogOut, Shield } from "lucide-react";
import { APP_NAME } from "@/lib/constants/routes";
import { logoutAction } from "@/lib/actions/auth";
import { cn } from "@/lib/utils/cn";

const ADMIN_NAV = [
  { href: "/dashboard/admin", label: "Overview", exact: true },
  { href: "/dashboard/admin/apps", label: "📱 Review Apps" },
  { href: "/dashboard/admin/users", label: "👥 Users" },
  { href: "/dashboard/admin/developers", label: "🛠 Developers" },
  { href: "/dashboard/admin/payments", label: "💰 Payments" },
  { href: "/dashboard/admin/analytics", label: "📊 Analytics" },
  { href: "/dashboard/admin/categories", label: "🗂 Categories" },
  { href: "/dashboard/admin/admins", label: "🔐 Admins" },
];

export function AdminHeader() {
  const pathname = usePathname();

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-red-500/20 bg-night-950/95 backdrop-blur-xl">
      <div className="flex h-16 items-center justify-between px-6">
        {/* Brand */}
        <Link href="/dashboard/admin" className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-500/15 ring-1 ring-red-500/30">
            <Smartphone className="h-5 w-5 text-red-400" />
          </div>
          <div>
            <span className="font-heading text-base font-bold text-white">{APP_NAME}</span>
            <span className="ml-2 rounded-full bg-red-500/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-red-400">
              Admin
            </span>
          </div>
        </Link>

        {/* Nav */}
        <nav className="hidden items-center gap-1 lg:flex">
          {ADMIN_NAV.map((item) => {
            const isActive = item.exact
              ? pathname === item.href
              : pathname.startsWith(item.href) && item.href !== "/dashboard/admin";
            const isOverview = item.exact && pathname === "/dashboard/admin";

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
                  isActive || isOverview
                    ? "bg-red-500/15 text-red-400"
                    : "text-secondary-400 hover:bg-white/5 hover:text-white"
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Right side */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/8 px-3 py-1.5">
            <Shield className="h-4 w-4 text-red-400" />
            <span className="text-xs font-semibold text-red-400">Admin Panel</span>
          </div>
          <form action={logoutAction}>
            <button
              type="submit"
              className="flex items-center gap-2 rounded-xl px-3 py-1.5 text-xs font-medium text-secondary-400 hover:bg-red-500/10 hover:text-red-400 transition-colors"
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </button>
          </form>
        </div>
      </div>

      {/* Mobile nav */}
      <div className="flex gap-1 overflow-x-auto border-t border-white/5 px-4 pb-2 pt-1 scrollbar-hide lg:hidden">
        {ADMIN_NAV.map((item) => {
          const isActive = item.exact
            ? pathname === item.href
            : pathname.startsWith(item.href) && item.href !== "/dashboard/admin";
          const isOverview = item.exact && pathname === "/dashboard/admin";
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "shrink-0 rounded-lg px-3 py-1 text-xs font-medium transition-colors",
                isActive || isOverview
                  ? "bg-red-500/15 text-red-400"
                  : "text-secondary-400 hover:bg-white/5"
              )}
            >
              {item.label}
            </Link>
          );
        })}
      </div>
    </header>
  );
}
