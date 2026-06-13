import { DashboardShell } from "@/components/layout/dashboard-shell";
import { requireRole } from "@/lib/auth/guards";
import { createAdminClient } from "@/lib/supabase/admin";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { IndianRupee, TrendingUp } from "lucide-react";

export default async function AdminPaymentsPage() {
  const user = await requireRole("admin");
  const adminClient = createAdminClient();

  const { data: payments } = await adminClient
    .from("payments")
    .select(`
      *,
      users:user_id(full_name, email),
      applications:application_id(name)
    `)
    .order("created_at", { ascending: false })
    .limit(100);

  const totalRevenue = (payments ?? [])
    .filter((p) => p.status === "paid")
    .reduce((sum, p) => sum + (p.amount_paise ?? 0), 0);

  const byPlan = {
    basic: (payments ?? []).filter((p) => p.plan === "basic" && p.status === "paid").length,
    priority: (payments ?? []).filter((p) => p.plan === "priority" && p.status === "paid").length,
    featured: (payments ?? []).filter((p) => p.plan === "featured" && p.status === "paid").length,
  };

  const statusVariants: Record<string, "default" | "warning" | "success" | "danger" | "secondary" | "info"> = {
    paid: "success",
    pending: "warning",
    created: "secondary",
    failed: "danger",
    refunded: "info",
  };

  return (
    <DashboardShell role={user.profile.role}>
      <div>
        <div className="flex items-center gap-3">
          <IndianRupee className="h-7 w-7 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">Payments</h1>
            <p className="mt-1 text-secondary-400">Revenue and transaction history</p>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <div className="flex items-center justify-between">
              <p className="text-sm text-secondary-400">Total Revenue</p>
              <TrendingUp className="h-5 w-5 text-emerald-400" />
            </div>
            <p className="mt-3 text-2xl font-bold text-emerald-400">
              ₹{(totalRevenue / 100).toFixed(0)}
            </p>
          </Card>
          {Object.entries(byPlan).map(([plan, count]) => (
            <Card key={plan}>
              <p className="text-sm capitalize text-secondary-400">{plan} Plan</p>
              <p className="mt-3 text-2xl font-bold">{count}</p>
              <p className="mt-1 text-xs text-secondary-500">paid transactions</p>
            </Card>
          ))}
        </div>

        {/* Payments Table */}
        <Card className="mt-8 overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10 bg-white/3">
                  {["User", "App", "Plan", "Amount", "Status", "Date"].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-secondary-400">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {payments && payments.length > 0 ? (
                  payments.map((p) => (
                    <tr key={p.id} className="border-b border-white/5 text-sm hover:bg-white/3">
                      <td className="px-4 py-4">
                        <p className="font-medium">
                          {(p.users as { full_name: string | null } | null)?.full_name || "Unknown"}
                        </p>
                        <p className="text-xs text-secondary-500">
                          {(p.users as { email: string } | null)?.email}
                        </p>
                      </td>
                      <td className="px-4 py-4 text-secondary-400">
                        {(p.applications as { name: string } | null)?.name ?? "—"}
                      </td>
                      <td className="px-4 py-4 capitalize text-secondary-300">
                        {p.plan}
                      </td>
                      <td className="px-4 py-4 font-semibold text-emerald-400">
                        ₹{((p.amount_paise ?? 0) / 100).toFixed(0)}
                      </td>
                      <td className="px-4 py-4">
                        <Badge variant={statusVariants[p.status] ?? "secondary"}>
                          {p.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-4 text-secondary-400 text-xs">
                        {new Date(p.created_at).toLocaleDateString("en-IN")}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-secondary-500">
                      No payments found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </DashboardShell>
  );
}
