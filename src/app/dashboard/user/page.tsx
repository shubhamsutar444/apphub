import Link from "next/link";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { requireRole } from "@/lib/auth/guards";
import { Card } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { Heart, Download, Star, User, ArrowRight } from "lucide-react";

export default async function UserDashboardPage() {
  const user = await requireRole("user");
  const supabase = await createClient();

  const [
    { count: favCount },
    { count: dlCount },
    { count: reviewCount },
  ] = await Promise.all([
    supabase
      .from("favorites")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id),
    supabase
      .from("downloads")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id),
    supabase
      .from("reviews")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id),
  ]);

  const quickLinks = [
    {
      label: "Favorites",
      icon: Heart,
      href: "/dashboard/user/favorites",
      count: favCount ?? 0,
      desc: "Apps you saved",
      color: "text-red-400",
    },
    {
      label: "Downloads",
      icon: Download,
      href: "/dashboard/user/downloads",
      count: dlCount ?? 0,
      desc: "Apps you've installed",
      color: "text-accent",
    },
    {
      label: "My Reviews",
      icon: Star,
      href: "/dashboard/user/reviews",
      count: reviewCount ?? 0,
      desc: "Reviews you've written",
      color: "text-yellow-400",
    },
    {
      label: "Profile",
      icon: User,
      href: "/dashboard/user/profile",
      count: null,
      desc: "Account settings",
      color: "text-primary",
    },
  ];

  return (
    <DashboardShell role={user.profile.role}>
      <div>
        <h1 className="text-3xl font-bold">
          Welcome back, {user.profile.full_name?.split(" ")[0] || "there"}! 👋
        </h1>
        <p className="mt-2 text-secondary-400">
          Manage your profile, favorites, downloads, and reviews
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {quickLinks.map((item) => (
            <Link key={item.label} href={item.href}>
              <Card hover className="cursor-pointer h-full">
                <div className="flex items-center justify-between">
                  <item.icon className={`h-5 w-5 ${item.color}`} />
                  {item.count !== null && (
                    <span className="text-2xl font-bold">{item.count}</span>
                  )}
                </div>
                <p className="mt-3 font-semibold">{item.label}</p>
                <p className="mt-1 text-sm text-secondary-400">{item.desc}</p>
              </Card>
            </Link>
          ))}
        </div>

        {/* Explore CTA */}
        <Card className="mt-8">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="font-semibold">Explore the Marketplace</h2>
              <p className="mt-1 text-sm text-secondary-400">
                Discover thousands of Android apps
              </p>
            </div>
            <Link href="/marketplace">
              <button className="flex items-center gap-2 text-sm text-primary hover:underline">
                Browse Apps <ArrowRight className="h-4 w-4" />
              </button>
            </Link>
          </div>
        </Card>
      </div>
    </DashboardShell>
  );
}
