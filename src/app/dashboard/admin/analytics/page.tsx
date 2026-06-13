import { DashboardShell } from "@/components/layout/dashboard-shell";
import { requireRole } from "@/lib/auth/guards";
import { createAdminClient } from "@/lib/supabase/admin";
import { Card } from "@/components/ui/card";
import { BarChart3, TrendingUp, Users, Download, IndianRupee, Package } from "lucide-react";

export default async function AdminAnalyticsPage() {
  const user = await requireRole("admin");
  const adminClient = createAdminClient();

  const [
    { count: totalUsers },
    { count: totalApps },
    { count: totalDownloads },
    { count: totalDevelopers },
    { data: paymentData },
    { data: recentApps },
    { data: topApps },
  ] = await Promise.all([
    adminClient.from("users").select("*", { count: "exact", head: true }),
    adminClient.from("applications").select("*", { count: "exact", head: true }).eq("status", "approved"),
    adminClient.from("downloads").select("*", { count: "exact", head: true }),
    adminClient.from("developers").select("*", { count: "exact", head: true }),
    adminClient.from("payments").select("amount_paise, status, plan, created_at"),
    adminClient
      .from("applications")
      .select("id, name, status, created_at")
      .order("created_at", { ascending: false })
      .limit(30),
    adminClient
      .from("applications")
      .select("id, name, download_count, rating_avg, rating_count, developers:developer_id(display_name)")
      .eq("status", "approved")
      .order("download_count", { ascending: false })
      .limit(10),
  ]);

  const paidPayments = (paymentData ?? []).filter((p) => p.status === "paid");
  const totalRevenue = paidPayments.reduce((s, p) => s + (p.amount_paise ?? 0), 0);
  const basicRevenue = paidPayments.filter((p) => p.plan === "basic").reduce((s, p) => s + (p.amount_paise ?? 0), 0);
  const priorityRevenue = paidPayments.filter((p) => p.plan === "priority").reduce((s, p) => s + (p.amount_paise ?? 0), 0);
  const featuredRevenue = paidPayments.filter((p) => p.plan === "featured").reduce((s, p) => s + (p.amount_paise ?? 0), 0);

  // Monthly breakdown (last 6 months)
  const now = new Date();
  const months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
    return {
      label: d.toLocaleDateString("en-IN", { month: "short", year: "2-digit" }),
      year: d.getFullYear(),
      month: d.getMonth(),
    };
  });

  const monthlyRevenue = months.map(({ label, year, month }) => {
    const revenue = paidPayments
      .filter((p) => {
        const d = new Date(p.created_at);
        return d.getFullYear() === year && d.getMonth() === month;
      })
      .reduce((s, p) => s + (p.amount_paise ?? 0), 0);
    return { label, revenue: revenue / 100 };
  });

  const monthlyApps = months.map(({ label, year, month }) => {
    const count = (recentApps ?? []).filter((a) => {
      const d = new Date(a.created_at);
      return d.getFullYear() === year && d.getMonth() === month;
    }).length;
    return { label, count };
  });

  const maxRevenue = Math.max(...monthlyRevenue.map((m) => m.revenue), 1);
  const maxApps = Math.max(...monthlyApps.map((m) => m.count), 1);

  const stats = [
    { label: "Total Users", value: (totalUsers ?? 0).toLocaleString(), icon: Users, color: "text-accent" },
    { label: "Total Developers", value: (totalDevelopers ?? 0).toLocaleString(), icon: Users, color: "text-primary" },
    { label: "Live Apps", value: (totalApps ?? 0).toLocaleString(), icon: Package, color: "text-purple-400" },
    { label: "Total Downloads", value: (totalDownloads ?? 0).toLocaleString(), icon: Download, color: "text-blue-400" },
    { label: "Total Revenue", value: `₹${(totalRevenue / 100).toFixed(0)}`, icon: IndianRupee, color: "text-emerald-400" },
    { label: "Paid Transactions", value: paidPayments.length, icon: TrendingUp, color: "text-orange-400" },
  ];

  return (
    <DashboardShell role={user.profile.role}>
      <div>
        <div className="flex items-center gap-3">
          <BarChart3 className="h-7 w-7 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">Platform Analytics</h1>
            <p className="mt-1 text-secondary-400">Overview of AppHub platform performance</p>
          </div>
        </div>

        {/* Stats */}
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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

        {/* Revenue by Plan */}
        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <Card>
            <h2 className="mb-6 text-lg font-semibold">Revenue by Plan</h2>
            <div className="space-y-4">
              {[
                { label: "Basic (₹99)", revenue: basicRevenue, color: "bg-secondary-400" },
                { label: "Priority (₹299)", revenue: priorityRevenue, color: "bg-accent" },
                { label: "Featured (₹999)", revenue: featuredRevenue, color: "bg-primary" },
              ].map(({ label, revenue, color }) => (
                <div key={label}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span className="text-secondary-300">{label}</span>
                    <span className="font-medium text-emerald-400">₹{revenue.toFixed(0)}</span>
                  </div>
                  <div className="h-2.5 w-full rounded-full bg-white/10">
                    <div
                      className={`h-full rounded-full ${color} transition-all`}
                      style={{ width: `${totalRevenue > 0 ? (revenue / (totalRevenue / 100)) * 100 : 0}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Monthly Revenue Chart */}
          <Card>
            <h2 className="mb-6 text-lg font-semibold">Monthly Revenue (₹)</h2>
            <div className="flex items-end gap-2 h-40">
              {monthlyRevenue.map(({ label, revenue }) => (
                <div key={label} className="flex flex-1 flex-col items-center gap-2">
                  <span className="text-xs text-secondary-400">
                    {revenue > 0 ? `₹${revenue.toFixed(0)}` : ""}
                  </span>
                  <div
                    className="w-full rounded-t-lg bg-primary/60 transition-all hover:bg-primary"
                    style={{ height: `${(revenue / maxRevenue) * 100}px` }}
                  />
                  <span className="text-xs text-secondary-500">{label}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Monthly Submissions */}
        <Card className="mt-6">
          <h2 className="mb-6 text-lg font-semibold">Monthly App Submissions</h2>
          <div className="flex items-end gap-2 h-32">
            {monthlyApps.map(({ label, count }) => (
              <div key={label} className="flex flex-1 flex-col items-center gap-2">
                <span className="text-xs text-secondary-400">{count || ""}</span>
                <div
                  className="w-full rounded-t-lg bg-accent/60 transition-all hover:bg-accent"
                  style={{ height: `${(count / maxApps) * 80}px` }}
                />
                <span className="text-xs text-secondary-500">{label}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Top Apps */}
        {topApps && topApps.length > 0 && (
          <Card className="mt-6">
            <h2 className="mb-6 text-lg font-semibold">Top Apps by Downloads</h2>
            <div className="space-y-3">
              {topApps.map((app, i) => (
                <div key={app.id} className="flex items-center gap-4">
                  <span className="w-6 text-center text-sm font-bold text-secondary-600">
                    {i + 1}
                  </span>
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-lg">
                    📱
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="truncate font-medium">{app.name}</p>
                    <p className="text-xs text-secondary-500">
                      {(app.developers as unknown as { display_name: string } | null)?.display_name}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">{(app.download_count ?? 0).toLocaleString()}</p>
                    <p className="text-xs text-yellow-400">
                      ★ {app.rating_avg > 0 ? app.rating_avg.toFixed(1) : "—"}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    </DashboardShell>
  );
}
