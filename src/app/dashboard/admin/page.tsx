import Link from "next/link";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { requireRole } from "@/lib/auth/guards";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  Users,
  Package,
  Clock,
  IndianRupee,
  Download,
  Shield,
  ArrowRight,
  TrendingUp,
  CheckCircle,
  XCircle,
} from "lucide-react";

export default async function AdminDashboardPage() {
  const user = await requireRole("admin");
  const adminClient = createAdminClient();

  const [
    { count: totalUsers },
    { count: totalDevelopers },
    { count: totalApps },
    { count: pendingApps },
    { count: approvedApps },
    { count: rejectedApps },
    { data: recentApps },
    { data: recentPayments },
  ] = await Promise.all([
    adminClient.from("users").select("*", { count: "exact", head: true }).neq("role", "admin"),
    adminClient.from("developers").select("*", { count: "exact", head: true }),
    adminClient.from("applications").select("*", { count: "exact", head: true }),
    adminClient.from("applications").select("*", { count: "exact", head: true }).eq("status", "pending_review"),
    adminClient.from("applications").select("*", { count: "exact", head: true }).eq("status", "approved"),
    adminClient.from("applications").select("*", { count: "exact", head: true }).eq("status", "rejected"),
    adminClient
      .from("applications")
      .select(`id, name, status, created_at, developers:developer_id(display_name)`)
      .eq("status", "pending_review")
      .order("created_at", { ascending: false })
      .limit(5),
    adminClient
      .from("payments")
      .select(`id, plan, amount_paise, status, created_at, users:user_id(full_name, email)`)
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  // Revenue from paid payments
  const { data: revData } = await adminClient
    .from("payments")
    .select("amount_paise")
    .eq("status", "paid");
  const totalRevenue = (revData ?? []).reduce((sum, p) => sum + (p.amount_paise ?? 0), 0);

  const stats = [
    { label: "Total Users", value: totalUsers ?? 0, icon: Users, color: "text-accent", href: "/dashboard/admin/users" },
    { label: "Developers", value: totalDevelopers ?? 0, icon: Shield, color: "text-primary", href: "/dashboard/admin/developers" },
    { label: "Total Apps", value: totalApps ?? 0, icon: Package, color: "text-purple-400", href: "/dashboard/admin/apps" },
    { label: "Pending Review", value: pendingApps ?? 0, icon: Clock, color: "text-yellow-400", href: "/dashboard/admin/apps?status=pending_review" },
    { label: "Live Apps", value: approvedApps ?? 0, icon: CheckCircle, color: "text-green-400", href: "/dashboard/admin/apps?status=approved" },
    { label: "Rejected", value: rejectedApps ?? 0, icon: XCircle, color: "text-red-400", href: "/dashboard/admin/apps?status=rejected" },
    { label: "Downloads", value: "—", icon: Download, color: "text-secondary-300", href: "/dashboard/admin/analytics" },
    { label: "Revenue", value: `₹${(totalRevenue / 100).toFixed(0)}`, icon: IndianRupee, color: "text-emerald-400", href: "/dashboard/admin/payments" },
  ];

  const statusVariants: Record<string, "default" | "warning" | "success" | "danger" | "secondary" | "info"> = {
    approved: "success",
    pending_review: "warning",
    rejected: "danger",
    paid: "success",
    pending: "warning",
    failed: "danger",
  };

  return (
    <DashboardShell role={user.profile.role}>
      <div>
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <p className="mt-2 text-secondary-400">Platform overview and moderation controls</p>

        {/* Stats Grid */}
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <Link key={stat.label} href={stat.href}>
              <Card hover className="cursor-pointer">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-secondary-400">{stat.label}</p>
                  <stat.icon className={`h-5 w-5 ${stat.color}`} />
                </div>
                <p className="mt-3 text-2xl font-bold">{typeof stat.value === "number" ? stat.value.toLocaleString() : stat.value}</p>
              </Card>
            </Link>
          ))}
        </div>

        <div className="mt-8 grid gap-8 lg:grid-cols-2">
          {/* Pending Apps */}
          <div>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Pending Reviews</h2>
              <Link href="/dashboard/admin/apps?status=pending_review">
                <button className="flex items-center gap-1 text-sm text-primary hover:underline">
                  View All <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </Link>
            </div>
            <Card>
              {recentApps && recentApps.length > 0 ? (
                <div className="space-y-3">
                  {recentApps.map((app) => (
                    <Link
                      key={app.id}
                      href={`/dashboard/admin/apps/${app.id}`}
                      className="flex items-center gap-3 rounded-xl p-2 hover:bg-white/5 transition-colors"
                    >
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-lg">
                        📱
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{app.name}</p>
                        <p className="text-xs text-secondary-500">
                          {(app.developers as unknown as { display_name: string } | null)?.display_name}
                        </p>
                      </div>
                      <Badge variant={statusVariants[app.status] ?? "secondary"}>
                        {app.status.replace("_", " ")}
                      </Badge>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="py-6 text-center text-sm text-secondary-500">
                  No pending reviews 🎉
                </p>
              )}
            </Card>
          </div>

          {/* Recent Payments */}
          <div>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Recent Payments</h2>
              <Link href="/dashboard/admin/payments">
                <button className="flex items-center gap-1 text-sm text-primary hover:underline">
                  View All <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </Link>
            </div>
            <Card>
              {recentPayments && recentPayments.length > 0 ? (
                <div className="space-y-3">
                  {recentPayments.map((payment) => (
                    <div key={payment.id} className="flex items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400">
                        ₹
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">
                          {(payment.users as unknown as { full_name: string | null; email: string } | null)?.full_name || "User"}
                        </p>
                        <p className="text-xs text-secondary-500 capitalize">
                          {payment.plan} plan
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-emerald-400">
                          ₹{((payment.amount_paise ?? 0) / 100).toFixed(0)}
                        </p>
                        <Badge variant={statusVariants[payment.status] ?? "secondary"}>
                          {payment.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="py-6 text-center text-sm text-secondary-500">
                  No payments yet
                </p>
              )}
            </Card>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8">
          <h2 className="mb-4 text-lg font-semibold">Quick Actions</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { label: "Review Apps", href: "/dashboard/admin/apps", icon: Package, desc: "Approve or reject submissions" },
              { label: "Manage Users", href: "/dashboard/admin/users", icon: Users, desc: "View and manage all users" },
              { label: "Categories", href: "/dashboard/admin/categories", icon: TrendingUp, desc: "Manage app categories" },
              { label: "Analytics", href: "/dashboard/admin/analytics", icon: TrendingUp, desc: "Revenue and growth data" },
            ].map((action) => (
              <Link key={action.label} href={action.href}>
                <Card hover className="cursor-pointer h-full">
                  <action.icon className="h-5 w-5 text-primary" />
                  <p className="mt-3 font-semibold">{action.label}</p>
                  <p className="mt-1 text-sm text-secondary-400">{action.desc}</p>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
