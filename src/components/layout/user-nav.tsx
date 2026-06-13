"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { LogOut, LayoutDashboard, User, ChevronDown } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { logoutAction } from "@/lib/actions/auth";
import { getDefaultDashboardPath } from "@/lib/auth/roles";
import { ROUTES } from "@/lib/constants/routes";
import { Button } from "@/components/ui/button";
import type { UserProfile } from "@/types";
import { cn } from "@/lib/utils/cn";

export function UserNav() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();

    async function loadProfile() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setProfile(null);
        setLoading(false);
        return;
      }

      const { data } = await supabase
        .from("users")
        .select("*")
        .eq("id", user.id)
        .single<UserProfile>();

      setProfile(data);
      setLoading(false);
    }

    loadProfile();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      loadProfile();
      router.refresh();
    });

    return () => subscription.unsubscribe();
  }, [router]);

  if (loading) {
    return <div className="hidden h-10 w-24 animate-pulse rounded-xl bg-white/5 sm:block" />;
  }

  if (!profile) {
    return (
      <div className="hidden items-center gap-2 sm:flex">
        <Link href={ROUTES.login}>
          <Button variant="ghost" size="sm">
            Sign In
          </Button>
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
            <Link
              href={dashboardPath}
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-secondary-300 hover:bg-white/5 hover:text-white"
            >
              <LayoutDashboard className="h-4 w-4" />
              Dashboard
            </Link>
            <Link
              href={`${ROUTES.dashboard.user}/profile`}
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-secondary-300 hover:bg-white/5 hover:text-white"
            >
              <User className="h-4 w-4" />
              Profile
            </Link>
            <form action={logoutAction}>
              <button
                type="submit"
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-red-400 hover:bg-red-500/10"
              >
                <LogOut className="h-4 w-4" />
                Sign Out
              </button>
            </form>
          </div>
        </>
      )}
    </div>
  );
}
