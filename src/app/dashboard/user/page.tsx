import Link from "next/link";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { requireRole } from "@/lib/auth/guards";
import { Card } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import {
  Heart, Download, Star, User, ArrowRight,
  Search, Package, Upload,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default async function UserDashboardPage() {
  const user = await requireRole("user");
  const supabase = await createClient();

  const [
    { count: favCount },
    { count: dlCount },
    { count: reviewCount },
  ] = await Promise.all([
    supabase.from("favorites").select("*", { count: "exact", head: true }).eq("user_id", user.id),
    supabase.from("downloads").select("*", { count: "exact", head: true }).eq("user_id", user.id),
    supabase.from("reviews").select("*", { count: "exact", head: true }).eq("user_id", user.id),
  ]);

  const initials = (user.profile.full_name ?? user.email)
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <DashboardShell role={user.profile.role}>
      <div>
        {/* User profile hero */}
        <div className="relative overflow-hidden rounded-3xl border border-primary/15 bg-gradient-to-br from-primary/8 via-night-900/60 to-night-950 p-8">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_0%_0%,rgba(137,233,0,0.12),transparent_60%)]" />
          <div className="relative flex items-center gap-5">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/20 font-heading text-2xl font-bold text-primary ring-2 ring-primary/30">
              {initials}
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-primary/70">User Account</p>
              <h1 className="font-heading text-2xl font-bold">
                Hey, {user.profile.full_name?.split(" ")[0] || "there"} 👋
              </h1>
              <p className="text-sm text-secondary-400">{user.email}</p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="mt-6 grid grid-cols-3 gap-4">
          {[
            { label: "Saved Apps",   count: favCount ?? 0,    icon: Heart,    color: "text-red-400",    href: "/dashboard/user/favorites" },
            { label: "Downloads",    count: dlCount ?? 0,     icon: Download, color: "text-accent",     href: "/dashboard/user/downloads" },
            { label: "Reviews",      count: reviewCount ?? 0, icon: Star,     color: "text-yellow-400", href: "/dashboard/user/reviews" },
          ].map((item) => (
            <Link key={item.label} href={item.href}>
              <Card hover className="cursor-pointer text-center py-5">
                <item.icon className={`mx-auto h-6 w-6 ${item.color}`} />
                <p className="mt-2 font-heading text-2xl font-bold">{item.count}</p>
                <p className="text-xs text-secondary-400">{item.label}</p>
              </Card>
            </Link>
          ))}
        </div>

        {/* Quick actions */}
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <Link href="/marketplace">
            <Card hover className="cursor-pointer flex items-center gap-4 py-5">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-accent/15">
                <Search className="h-6 w-6 text-accent" />
              </div>
              <div>
                <p className="font-semibold">Browse Apps</p>
                <p className="text-sm text-secondary-400">Discover & download Android apps</p>
              </div>
              <ArrowRight className="ml-auto h-4 w-4 text-secondary-500" />
            </Card>
          </Link>

          <Link href="/submit-app">
            <Card hover className="cursor-pointer flex items-center gap-4 py-5">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/15">
                <Upload className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="font-semibold">Publish an App</p>
                <p className="text-sm text-secondary-400">Become a developer — start at ₹1</p>
              </div>
              <ArrowRight className="ml-auto h-4 w-4 text-secondary-500" />
            </Card>
          </Link>

          <Link href="/dashboard/user/profile">
            <Card hover className="cursor-pointer flex items-center gap-4 py-5">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-secondary-700/40">
                <User className="h-6 w-6 text-secondary-300" />
              </div>
              <div>
                <p className="font-semibold">My Profile</p>
                <p className="text-sm text-secondary-400">Update name, theme, settings</p>
              </div>
              <ArrowRight className="ml-auto h-4 w-4 text-secondary-500" />
            </Card>
          </Link>

          <Link href="/dashboard/user/favorites">
            <Card hover className="cursor-pointer flex items-center gap-4 py-5">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-red-500/15">
                <Heart className="h-6 w-6 text-red-400" />
              </div>
              <div>
                <p className="font-semibold">Saved Apps</p>
                <p className="text-sm text-secondary-400">{favCount ?? 0} apps saved for later</p>
              </div>
              <ArrowRight className="ml-auto h-4 w-4 text-secondary-500" />
            </Card>
          </Link>
        </div>
      </div>
    </DashboardShell>
  );
}
