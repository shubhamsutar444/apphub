"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, LayoutGrid, Upload, User } from "lucide-react";
import { MOBILE_NAV_LINKS } from "@/lib/constants/routes";
import { cn } from "@/lib/utils/cn";

const ICONS = {
  home: Home,
  grid: LayoutGrid,
  upload: Upload,
  user: User,
} as const;

export function BottomNav() {
  const pathname = usePathname();

  const hiddenPaths = ["/login", "/signup", "/forgot-password", "/verify-email"];
  if (hiddenPaths.some((p) => pathname.startsWith(p))) return null;

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-primary/10 bg-night-950/92 backdrop-blur-xl md:hidden">
      <div className="flex items-center justify-around px-2 py-2">
        {MOBILE_NAV_LINKS.map((item) => {
          const Icon = ICONS[item.icon];
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-1 flex-col items-center gap-1 rounded-xl py-2 text-xs font-medium transition-colors",
                isActive ? "text-primary" : "text-secondary-400 hover:text-secondary-200"
              )}
            >
              <Icon className={cn("h-5 w-5", isActive && "drop-shadow-[0_0_8px_rgba(34,197,94,0.5)]")} />
              {item.label}
            </Link>
          );
        })}
      </div>
      <div className="h-safe-area-inset-bottom" />
    </nav>
  );
}
