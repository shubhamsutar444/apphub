import Link from "next/link";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { requireRole } from "@/lib/auth/guards";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/server";
import { Package, BarChart3, Download, Star, TrendingUp, Plus, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export default async function DeveloperDashboardPage() {
  const user = await requireRole("developer");
  const supabase = await createClient();

  // Get developer profile
  const { data: developer } = await supabase
    .from("developers")
    .select("*")
    .eq("user_id", user.id)
    .single();

  // Get apps with stats
  const { data: apps, count: totalApps } = await supabase
    .from("applications")
    .select("id, name, status, rating_avg, rating_count, download_count, icon_url, created_at", { count: "exact" })
    .eq("developer_id", developer?.id ?? "")
    .order("created_at", { ascending: false })
    .limit(5);

  // Compute totals
  const totalDownloads = apps?.reduce((sum, a) => sum + (a.download_count ?? 0), 0) ?? 0;
  const avgRating =
    apps && apps.length > 0
      ? apps.reduce((sum, a) => sum + (a.rating_avg ?? 0), 0) / apps.length
      : 0;
  const pendingApps = apps?.filter((a) => a.status === "pending_review").length ?? 0;

  const stats = [
    { label: "Total Apps", value: totalApps ?? 0, icon: Package, color: "text-primary" },
    { label: "Total Downloads", value: totalDownloads.toLocaleString(), icon: Download, color: "text-accent" },
    { label: "Avg Rating", value: avgRating > 0 ? avgRating.toFixed(1) : "—", icon: Star, color: "text-yellow-400" },
    { label: "Pending Review", value: pendingApps, icon: TrendingUp, color: "text-orange-400" },
  ];

  const statusVariants: Record<string, "default" | "warning" | "success" | "danger" | "secondary" | "info"> = {
    approved: "success",
    pending_review: "warning",
    rejected: "danger",
    changes_requested: "warning",
    draft: "secondary",
    archived: "secondary",
  };

  return (
    <DashboardShell role={user.profile.role}>
      <div>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">
              Developer Dashboard
            </h1>
            <p className="mt-2 text-secondary-400">
              Hello, {developer?.display_name ?? user.profile.full_name}
            </p>
          </div>
          <Link href="/dashboard/developer/apps/new">
            <Button className="gap-2 shrink-0">
              <Plus className="h-4 w-4" />
              Submit App
            </Button>
          </Link>
        </div>

        {/* Stats */}
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <Card key={stat.label}>
              <div className="flex items-center justify-between">
                <p className="text-sm text-secondary-400">{stat.label}</p>
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
              </div>
              <p className="mt-3 text-2xl font-bold">{stat.value}</p>
            </Card>
          ))}
        </div>

        {/* No developer profile */}
        {!developer && (
          <Card className="mt-8 text-center py-12">
            <Package className="mx-auto h-12 w-12 text-secondary-600" />
            <h3 className="mt-4 text-lg font-semibold">Set Up Your Developer Profile</h3>
            <p className="mt-2 text-secondary-400">
              You need a developer profile before you can submit apps.
            </p>
            <Link href="/dashboard/developer/profile" className="mt-4 inline-block">
              <Button>Create Developer Profile</Button>
            </Link>
          </Card>
        )}

        {/* Recent Apps */}
        {apps && apps.length > 0 && (
          <div className="mt-8">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Your Apps</h2>
              <Link href="/dashboard/developer/apps">
                <Button variant="ghost" size="sm" className="gap-1">
                  View All
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
            <Card>
              <div className="space-y-4">
                {apps.map((app) => (
                  <Link
                    key={app.id}
                    href={`/dashboard/developer/apps/${app.id}/edit`}
                    className="flex items-center gap-4 rounded-xl p-3 transition-colors hover:bg-white/5"
                  >
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 text-xl ring-1 ring-white/10">
                      📱
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{app.name}</p>
                      <p className="text-xs text-secondary-400">
                        {app.download_count?.toLocaleString()} downloads ·{" "}
                        ★ {app.rating_avg > 0 ? app.rating_avg.toFixed(1) : "No ratings"}
                      </p>
                    </div>
                    <Badge variant={statusVariants[app.status] ?? "secondary"}>
                      {app.status.replace("_", " ")}
                    </Badge>
                  </Link>
                ))}
              </div>
            </Card>
          </div>
        )}

        {/* Quick Links */}
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          {[
            {
              label: "Submit New App",
              icon: Plus,
              href: "/dashboard/developer/apps/new",
              desc: "Upload and submit your app for review",
            },
            {
              label: "View Analytics",
              icon: BarChart3,
              href: "/dashboard/developer/analytics",
              desc: "Downloads, ratings, and growth metrics",
            },
            {
              label: "My Apps",
              icon: Package,
              href: "/dashboard/developer/apps",
              desc: "Manage all your submitted applications",
            },
          ].map((item) => (
            <Link key={item.label} href={item.href}>
              <Card hover className="cursor-pointer h-full">
                <item.icon className="h-5 w-5 text-primary" />
                <p className="mt-3 font-semibold">{item.label}</p>
                <p className="mt-1 text-sm text-secondary-400">{item.desc}</p>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </DashboardShell>
  );
}
