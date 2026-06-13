import { DashboardShell } from "@/components/layout/dashboard-shell";
import { requireRole } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BarChart3, Download, Star, TrendingUp, Package } from "lucide-react";

export default async function DeveloperAnalyticsPage() {
  const user = await requireRole("developer");
  const supabase = await createClient();

  const { data: developer } = await supabase
    .from("developers")
    .select("id, display_name, total_downloads, total_apps")
    .eq("user_id", user.id)
    .single();

  const { data: apps } = await supabase
    .from("applications")
    .select("id, name, status, download_count, rating_avg, rating_count, created_at")
    .eq("developer_id", developer?.id ?? "")
    .order("download_count", { ascending: false });

  const totalDownloads = apps?.reduce((s, a) => s + (a.download_count ?? 0), 0) ?? 0;
  const liveApps = apps?.filter((a) => a.status === "approved").length ?? 0;
  const avgRating =
    apps && apps.filter((a) => a.rating_count > 0).length > 0
      ? apps
          .filter((a) => a.rating_count > 0)
          .reduce((s, a) => s + a.rating_avg, 0) /
        apps.filter((a) => a.rating_count > 0).length
      : 0;

  const stats = [
    { label: "Total Downloads", value: totalDownloads.toLocaleString(), icon: Download, color: "text-accent" },
    { label: "Live Apps", value: liveApps, icon: Package, color: "text-primary" },
    { label: "Avg Rating", value: avgRating > 0 ? avgRating.toFixed(2) : "—", icon: Star, color: "text-yellow-400" },
    { label: "Total Apps", value: apps?.length ?? 0, icon: TrendingUp, color: "text-orange-400" },
  ];

  return (
    <DashboardShell role={user.profile.role}>
      <div>
        <div className="flex items-center gap-3">
          <BarChart3 className="h-7 w-7 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">Analytics</h1>
            <p className="mt-1 text-secondary-400">Performance overview for your apps</p>
          </div>
        </div>

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

        {/* Per-app breakdown */}
        {apps && apps.length > 0 && (
          <div className="mt-8">
            <h2 className="mb-4 text-lg font-semibold">App Performance</h2>
            <Card>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/5 text-xs text-secondary-500 uppercase tracking-wider">
                      <th className="pb-3 text-left">App</th>
                      <th className="pb-3 text-right">Status</th>
                      <th className="pb-3 text-right">Downloads</th>
                      <th className="pb-3 text-right">Rating</th>
                      <th className="pb-3 text-right">Reviews</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {apps.map((app) => (
                      <tr key={app.id} className="text-sm">
                        <td className="py-4 font-medium">{app.name}</td>
                        <td className="py-4 text-right">
                          <Badge
                            variant={
                              app.status === "approved"
                                ? "success"
                                : app.status === "pending_review"
                                ? "warning"
                                : app.status === "rejected"
                                ? "danger"
                                : "secondary"
                            }
                          >
                            {app.status.replace("_", " ")}
                          </Badge>
                        </td>
                        <td className="py-4 text-right text-secondary-300">
                          {app.download_count?.toLocaleString()}
                        </td>
                        <td className="py-4 text-right text-yellow-400">
                          {app.rating_avg > 0 ? `★ ${app.rating_avg.toFixed(1)}` : "—"}
                        </td>
                        <td className="py-4 text-right text-secondary-400">
                          {app.rating_count}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        )}

        {!apps || apps.length === 0 ? (
          <Card className="mt-8 py-12 text-center">
            <BarChart3 className="mx-auto h-12 w-12 text-secondary-600" />
            <h3 className="mt-4 text-lg font-semibold">No data yet</h3>
            <p className="mt-2 text-secondary-400">
              Submit and publish apps to see analytics.
            </p>
          </Card>
        ) : null}
      </div>
    </DashboardShell>
  );
}
