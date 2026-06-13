"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  User,
  Heart,
  Download,
  Star,
  Package,
  BarChart3,
  Shield,
  Users,
  FolderOpen,
  CreditCard,
  LogOut,
} from "lucide-react";
import { logoutAction } from "@/lib/actions/auth";
import { ROUTES } from "@/lib/constants/routes";
import type { UserRole } from "@/types";
import { cn } from "@/lib/utils/cn";

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const USER_NAV: NavItem[] = [
  { href: ROUTES.dashboard.user, label: "Overview", icon: LayoutDashboard },
  { href: `${ROUTES.dashboard.user}/profile`, label: "Profile", icon: User },
  { href: `${ROUTES.dashboard.user}/favorites`, label: "Favorites", icon: Heart },
  { href: `${ROUTES.dashboard.user}/downloads`, label: "Downloads", icon: Download },
  { href: `${ROUTES.dashboard.user}/reviews`, label: "Reviews", icon: Star },
];

const DEVELOPER_NAV: NavItem[] = [
  { href: ROUTES.dashboard.developer, label: "Overview", icon: LayoutDashboard },
  { href: `${ROUTES.dashboard.developer}/apps`, label: "My Apps", icon: Package },
  { href: `${ROUTES.dashboard.developer}/analytics`, label: "Analytics", icon: BarChart3 },
];

const ADMIN_NAV: NavItem[] = [
  { href: ROUTES.dashboard.admin, label: "Overview", icon: LayoutDashboard },
  { href: `${ROUTES.dashboard.admin}/apps`, label: "Apps", icon: Package },
  { href: `${ROUTES.dashboard.admin}/users`, label: "Users", icon: Users },
  { href: `${ROUTES.dashboard.admin}/developers`, label: "Developers", icon: User },
  { href: `${ROUTES.dashboard.admin}/categories`, label: "Categories", icon: FolderOpen },
  { href: `${ROUTES.dashboard.admin}/payments`, label: "Payments", icon: CreditCard },
  { href: `${ROUTES.dashboard.admin}/analytics`, label: "Analytics", icon: BarChart3 },
  { href: `${ROUTES.dashboard.admin}/admins`, label: "Admins", icon: Shield },
];

function getNavItems(role: UserRole): NavItem[] {
  switch (role) {
    case "admin":
      return ADMIN_NAV;
    case "developer":
      return DEVELOPER_NAV;
    default:
      return USER_NAV;
  }
}

function getTitle(role: UserRole): string {
  switch (role) {
    case "admin":
      return "Admin Dashboard";
    case "developer":
      return "Developer Dashboard";
    default:
      return "My Dashboard";
  }
}

interface DashboardShellProps {
  role: UserRole;
  children: React.ReactNode;
}

export function DashboardShell({ role, children }: DashboardShellProps) {
  const pathname = usePathname();
  const navItems = getNavItems(role);

  return (
    <div className="section-container py-8">
      <div className="flex flex-col gap-8 lg:flex-row">
        <aside className="lg:w-64 lg:shrink-0">
          <div className="glass-card sticky top-24">
            <div className="mb-4 flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              <h2 className="font-semibold">{getTitle(role)}</h2>
            </div>
            <nav className="space-y-1">
              {navItems.map((item) => {
                const isActive =
                  pathname === item.href ||
                  (item.href !== ROUTES.dashboard.user &&
                    item.href !== ROUTES.dashboard.developer &&
                    item.href !== ROUTES.dashboard.admin &&
                    pathname.startsWith(item.href));

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                      isActive
                        ? "bg-primary/10 text-primary"
                        : "text-secondary-400 hover:bg-white/5 hover:text-white"
                    )}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
            <form action={logoutAction} className="mt-4 border-t border-white/5 pt-4">
              <button
                type="submit"
                className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-red-400 transition-colors hover:bg-red-500/10"
              >
                <LogOut className="h-4 w-4" />
                Sign Out
              </button>
            </form>
          </div>
        </aside>
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </div>
  );
}
