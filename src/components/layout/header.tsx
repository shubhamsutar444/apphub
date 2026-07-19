"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import { Menu, X, Upload, LayoutDashboard } from "lucide-react";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { UserNav } from "@/components/layout/user-nav";
import { NotificationsBell } from "@/components/layout/notifications-bell";
import { Button } from "@/components/ui/button";
import { APP_NAME, ROUTES } from "@/lib/constants/routes";
import { createClient, getCachedProfile } from "@/lib/supabase/client";

const PUBLIC_NAV = [
  { href: ROUTES.marketplace, label: "Browse Apps" },
  { href: "/categories", label: "Categories" },
  { href: "/developers", label: "Developers" },
  { href: "/about", label: "About" },
];

const USER_NAV = [
  { href: ROUTES.marketplace, label: "Browse Apps" },
  { href: "/categories", label: "Categories" },
  { href: "/dashboard/user/favorites", label: "My Favorites" },
  { href: "/dashboard/user/downloads", label: "Downloads" },
];

const DEVELOPER_NAV = [
  { href: ROUTES.marketplace, label: "Browse Apps" },
  { href: "/dashboard/developer/apps", label: "My Apps" },
  { href: "/dashboard/developer/apps/new", label: "Submit App" },
  { href: "/dashboard/developer/analytics", label: "Analytics" },
];

export function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Single shared call — no duplicate DB queries
    getCachedProfile().then((profile) => {
      if (profile) {
        setUserId(profile.id);
        setUserRole(profile.role);
      }
      setReady(true);
    });

    const supabase = createClient();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT") {
        setUserId(null);
        setUserRole(null);
      } else if (event === "SIGNED_IN" && session?.user) {
        setUserId(session.user.id);
        // Role will be loaded by getCachedProfile on next call
        getCachedProfile().then((p) => setUserRole(p?.role ?? null));
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Admin has dedicated header — skip rendering this one
  if (ready && userRole === "admin") return null;

  const navLinks = userRole === "developer"
    ? DEVELOPER_NAV
    : userRole === "user"
    ? USER_NAV
    : PUBLIC_NAV;

  return (
    <header className="fixed inset-x-0 top-0 z-50">
      <div className="border-b border-primary/10 bg-night-950/85 backdrop-blur-xl">
        <div className="section-container flex h-16 items-center justify-between lg:h-20">

          <Link href={ROUTES.home} className="group flex items-center gap-2.5">
            <div className="relative h-9 w-9 overflow-hidden rounded-xl ring-1 ring-primary/30 transition-all group-hover:shadow-glow">
              <Image
                src="/apphub-logo.png"
                alt="AppHub Logo"
                fill
                className="object-cover object-left"
                sizes="36px"
                priority
              />
            </div>
            <span className="font-heading text-xl font-bold tracking-tight text-gradient">
              {APP_NAME}
            </span>
          </Link>

          <nav className="hidden items-center gap-1 lg:flex">
            {navLinks.map((link) => (
              <Link key={link.href} href={link.href}
                className="rounded-lg px-4 py-2 text-sm font-medium text-secondary-300 transition-colors hover:bg-primary/8 hover:text-primary">
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <ThemeToggle className="hidden sm:flex" />
            {userId && <NotificationsBell userId={userId} />}

            {userRole === "developer" && (
              <Link href="/dashboard/developer" className="hidden sm:block">
                <Button size="sm" variant="secondary" className="gap-1.5">
                  <LayoutDashboard className="h-3.5 w-3.5" />
                  Dashboard
                </Button>
              </Link>
            )}
            {userRole === "user" && (
              <Link href="/submit-app" className="hidden sm:block">
                <Button size="sm" className="gap-1.5">
                  <Upload className="h-3.5 w-3.5" />
                  Publish App
                </Button>
              </Link>
            )}

            <UserNav />

            <button type="button"
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 lg:hidden"
              onClick={() => setMobileOpen(!mobileOpen)} aria-label="Toggle menu">
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden border-b border-primary/10 bg-night-950/95 backdrop-blur-xl lg:hidden"
          >
            <nav className="section-container flex flex-col gap-1 py-4">
              {navLinks.map((link) => (
                <Link key={link.href} href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className="rounded-xl px-4 py-3 text-sm font-medium text-secondary-300 transition-colors hover:bg-primary/8 hover:text-primary">
                  {link.label}
                </Link>
              ))}
              {!userId && (
                <div className="mt-2 flex items-center gap-2 border-t border-white/5 pt-4">
                  <ThemeToggle />
                  <Link href={ROUTES.login} className="flex-1" onClick={() => setMobileOpen(false)}>
                    <Button variant="secondary" size="sm" className="w-full">Sign In</Button>
                  </Link>
                  <Link href={ROUTES.signup} className="flex-1" onClick={() => setMobileOpen(false)}>
                    <Button size="sm" className="w-full">Get Started</Button>
                  </Link>
                </div>
              )}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
