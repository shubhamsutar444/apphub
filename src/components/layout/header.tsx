"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, Smartphone, Upload, LayoutDashboard } from "lucide-react";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { UserNav } from "@/components/layout/user-nav";
import { NotificationsBell } from "@/components/layout/notifications-bell";
import { Button } from "@/components/ui/button";
import { APP_NAME, ROUTES } from "@/lib/constants/routes";
import { createClient } from "@/lib/supabase/client";

// Nav links per role
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

function getNavLinks(role: string | null) {
  if (role === "developer") return DEVELOPER_NAV;
  if (role === "user") return USER_NAV;
  return PUBLIC_NAV;
}

export function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();

    const loadUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setUserId(null); setUserRole(null); return; }
      setUserId(user.id);
      const { data } = await supabase.from("users").select("role").eq("id", user.id).single();
      setUserRole(data?.role ?? null);
    };

    loadUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      loadUser();
    });
    return () => subscription.unsubscribe();
  }, []);

  // Admin has its own header — don't render this one
  if (userRole === "admin") return null;

  const navLinks = getNavLinks(userRole);

  return (
    <header className="fixed inset-x-0 top-0 z-50">
      <div className="border-b border-primary/10 bg-night-950/85 backdrop-blur-xl">
        <div className="section-container flex h-16 items-center justify-between lg:h-20">

          {/* Logo */}
          <Link href={ROUTES.home} className="group flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/15 ring-1 ring-primary/30 transition-all group-hover:bg-primary/25 group-hover:shadow-glow">
              <Smartphone className="h-5 w-5 text-primary" />
            </div>
            <span className="font-heading text-xl font-bold tracking-tight text-gradient">
              {APP_NAME}
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden items-center gap-1 lg:flex">
            {navLinks.map((link) => (
              <Link key={link.href} href={link.href}
                className="rounded-lg px-4 py-2 text-sm font-medium text-secondary-300 transition-colors hover:bg-primary/8 hover:text-primary">
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-2">
            <ThemeToggle className="hidden sm:flex" />
            {userId && <NotificationsBell userId={userId} />}

            {/* Role-specific CTA */}
            {userRole === "developer" && (
              <Link href="/dashboard/developer" className="hidden sm:block">
                <Button size="sm" variant="secondary" className="gap-1.5">
                  <LayoutDashboard className="h-3.5 w-3.5" />
                  Dashboard
                </Button>
              </Link>
            )}
            {userRole === "user" && (
              <Link href="/publish" className="hidden sm:block">
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

      {/* Mobile Menu */}
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
              {userRole === "user" && (
                <Link href="/publish" onClick={() => setMobileOpen(false)}>
                  <Button className="mt-2 w-full gap-2">
                    <Upload className="h-4 w-4" /> Publish App
                  </Button>
                </Link>
              )}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
