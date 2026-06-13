"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, Smartphone } from "lucide-react";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { UserNav } from "@/components/layout/user-nav";
import { NotificationsBell } from "@/components/layout/notifications-bell";
import { Button } from "@/components/ui/button";
import { APP_NAME, NAV_LINKS, ROUTES } from "@/lib/constants/routes";
import { createClient } from "@/lib/supabase/client";

export function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      setUserId(data.user?.id ?? null);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUserId(session?.user?.id ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  return (
    <header className="fixed inset-x-0 top-0 z-50">
      <div className="border-b border-primary/10 bg-night-950/85 backdrop-blur-xl">
        <div className="section-container flex h-16 items-center justify-between lg:h-20">
          <Link href={ROUTES.home} className="group flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/15 ring-1 ring-primary/30 transition-all group-hover:bg-primary/25 group-hover:shadow-glow">
              <Smartphone className="h-5 w-5 text-primary" />
            </div>
            <span className="text-xl font-heading font-bold tracking-tight">
              <span className="text-gradient">{APP_NAME}</span>
            </span>
          </Link>

          <nav className="hidden items-center gap-1 lg:flex">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-lg px-4 py-2 text-sm font-medium font-body text-secondary-300 transition-colors hover:bg-primary/8 hover:text-primary"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <ThemeToggle className="hidden sm:flex" />
            {userId && <NotificationsBell userId={userId} />}
            <UserNav />

            <button
              type="button"
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 lg:hidden"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Toggle menu"
            >
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
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className="rounded-xl px-4 py-3 text-sm font-medium font-body text-secondary-300 transition-colors hover:bg-primary/8 hover:text-primary"
                >
                  {link.label}
                </Link>
              ))}
              <div className="mt-2 flex items-center gap-2 border-t border-white/5 pt-4">
                <ThemeToggle />
                <Link href={ROUTES.login} className="flex-1" onClick={() => setMobileOpen(false)}>
                  <Button variant="secondary" size="sm" className="w-full">Sign In</Button>
                </Link>
                <Link href={ROUTES.signup} className="flex-1" onClick={() => setMobileOpen(false)}>
                  <Button size="sm" className="w-full">Get Started</Button>
                </Link>
              </div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
