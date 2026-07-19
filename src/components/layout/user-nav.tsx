"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { LogOut, LayoutDashboard, User, ChevronDown } from "lucide-react";
import { createClient, getCachedProfile, clearProfileCache } from "@/lib/supabase/client";
import { getDefaultDashboardPath } from "@/lib/auth/roles";
import { ROUTES } from "@/lib/constants/routes";
import { Button } from "@/components/ui/button";
import type { UserProfile } from "@/types";
import { cn } from "@/lib/utils/cn";

export function UserNav() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Use cached profile — no extra DB call
    getCachedProfile().then((p) => {
      setProfile(p);
      setLoading(false);
    });

    const supabase = createClient();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") {
        clearProfileCache();
        setProfile(null);
      } else if (event === "SIGNED_IN") {
        clearProfileCache();
        getCachedProfile().then(setProfile);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    const supabase = createClient();
    clearProfileCache();
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  if (loading) {
    return <div className="hidden h-10 w-24 animate-pulse rounded-xl bg-white/5 sm:block" />;
  }

  if (!profile) {
    return (
      <div className="hidden items-center gap-2 sm:flex">
        <Link href={ROUTES.login}>
          <Button variant="ghost" size="sm">Sign In</Button>
        </Link>
        <Link href={ROUTES.signup}>
          <Button size="sm">Get Started</Button>
        </Link>
      </div>
    );
  }

  const dashboardPath = getDefaultDashboardPath(profile.role);
  const displayName = profile.full_name || profile.email.split("@")[0];

  return (
    <div className="relative hidden sm:block">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm transition-colors hover:border-primary/30"
      >
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/20 text-xs font-bold text-primary">
          {displayName.charAt(0).toUpperCase()}
        </div>
        <span className="max-w-[100px] truncate font-medium">{displayName}</span>
        <ChevronDown className={cn("h-4 w-4 transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full z-50 mt-2 w-56 rounded-xl border border-white/10 bg-secondary-900/95 p-2 shadow-glass-lg backdrop-blur-xl">
            <div className="border-b border-white/5 px-3 py-2">
              <p className="truncate text-sm font-medium">{displayName}</p>
              <p className="truncate text-xs text-secondary-400">{profile.email}</p>
              <span className="mt-1 inline-block rounded-md bg-primary/10 px-2 py-0.5 text-xs capitalize text-primary">
                {profile.role}
              </span>
            </div>
            <Link href={dashboardPath} onClick={() => setOpen(false)}
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-secondary-300 hover:bg-white/5 hover:text-white">
              <LayoutDashboard className="h-4 w-4" />
              Dashboard
            </Link>
            <Link href={`${ROUTES.dashboard.user}/profile`} onClick={() => setOpen(false)}
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-secondary-300 hover:bg-white/5 hover:text-white">
              <User className="h-4 w-4" />
              Profile
            </Link>
            <button type="button" onClick={handleLogout}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-red-400 hover:bg-red-500/10">
              <LogOut className="h-4 w-4" />
              Sign Out
            </button>
          </div>
        </>
      )}
    </div>
  );
}
