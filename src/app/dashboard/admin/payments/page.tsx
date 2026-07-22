import { DashboardShell } from "@/components/layout/dashboard-shell";
import { requireRole } from "@/lib/auth/guards";
import { createAdminClient } from "@/lib/supabase/admin";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { IndianRupee, TrendingUp, ExternalLink, CheckCircle } from "lucide-react";
import { AdminPaymentApprove } from "@/components/admin/admin-payment-approve";

export default async function AdminPaymentsPage() {
  const user = await requireRole("admin");
  const adminClient = createAdminClient();

  const { data: payments } = await adminClient
    .from("payments")
    .select(`*, users:user_id(full_name, email)`)
    .order("created_at", { ascending: false })
    .limit(100);

  const paidPayments = (payments ?? []).filter((p) => p.status === "paid");
  const pendingPayments = (payments ?? []).filter((p) => p.status === "pending");
  const totalRevenue = paidPayments.reduce((s, p) => s + (p.amount_paise ?? 0), 0);

  const statusVariants: Record<string, "default" | "warning" | "success" | "danger" | "secondary"> = {
    paid: "success", pending: "warning", created: "secondary", failed: "danger", refunded: "info" as "secondary",
  };

  return (
    <DashboardShell role={user.profile.role}>
      <div>
        <div className="flex items-center gap-3">
          <IndianRupee className="h-7 w-7 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">Payments</h1>
            <p className="mt-1 text-secondary-400">Verify payment screenshots and activate developer accounts</p>
          </div>
        </div>

        {/* Summary */}
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <Card>
            <div className="flex items-center justify-between">
              <p className="text-sm text-secondary-400">Total Revenue</p>
              <TrendingUp className="h-5 w-5 text-emerald-400" />
            </div>
            <p className="mt-3 text-2xl font-bold text-emerald-400">₹{(totalRevenue / 100).toFixed(0)}</p>
          </Card>
          <Card>
            <div className="flex items-center justify-between">
              <p className="text-sm text-secondary-400">Pending Verification</p>
              <IndianRupee className="h-5 w-5 text-yellow-400" />
            </div>
            <p className="mt-3 text-2xl font-bold text-yellow-400">{pendingPayments.length}</p>
          </Card>
          <Card>
            <div className="flex items-center justify-between">
              <p className="text-sm text-secondary-400">Verified Payments</p>
              <CheckCircle className="h-5 w-5 text-primary" />
            </div>
            <p className="mt-3 text-2xl font-bold text-primary">{paidPayments.length}</p>
          </Card>
        </div>

        {/* Pending verifications — shown prominently */}
        {pendingPayments.length > 0 && (
          <div className="mt-8">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
              <span className="flex h-2.5 w-2.5 rounded-full bg-yellow-400 animate-pulse" />
              Pending Verification ({pendingPayments.length})
            </h2>
            <div className="space-y-4">
              {pendingPayments.map((p) => {
                const meta = p.metadata as Record<string, string> | null;
                const screenshotUrl = meta?.screenshot_url;
                const userName = meta?.user_name || (p.users as { full_name: string | null; email: string } | null)?.full_name || "User";
                const userEmail = meta?.user_email || (p.users as { email: string } | null)?.email || "";

                return (
                  <Card key={p.id} className="border-yellow-500/20 bg-yellow-500/5">
                    <div className="flex flex-wrap items-start gap-4">
                      {/* Screenshot preview */}
                      {screenshotUrl && (
                        <a href={screenshotUrl} target="_blank" rel="noopener noreferrer"
                          className="group relative h-32 w-24 shrink-0 overflow-hidden rounded-xl border border-white/10 transition-all hover:border-primary/40">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={screenshotUrl} alt="Payment proof" className="h-full w-full object-cover" />
                          <div className="absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition-all group-hover:bg-black/40 group-hover:opacity-100">
                            <ExternalLink className="h-5 w-5 text-white" />
                          </div>
                        </a>
                      )}

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-semibold">{userName}</p>
                          <Badge variant="warning">Pending</Badge>
                        </div>
                        <p className="text-sm text-secondary-400">{userEmail}</p>
                        <p className="mt-1 text-sm">
                          Amount: <span className="font-semibold text-emerald-400">₹{((p.amount_paise ?? 0) / 100).toFixed(0)}</span>
                        </p>
                        <p className="text-xs text-secondary-500">
                          Submitted: {new Date(p.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                        </p>
                        {screenshotUrl && (
                          <a href={screenshotUrl} target="_blank" rel="noopener noreferrer"
                            className="mt-2 inline-flex items-center gap-1 text-xs text-primary hover:underline">
                            <ExternalLink className="h-3.5 w-3.5" /> View Full Screenshot
                          </a>
                        )}
                      </div>

                      {/* Approve button */}
                      <AdminPaymentApprove
                        paymentId={p.id}
                        targetUserId={p.user_id}
                        userName={userName}
                      />
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {/* All payments table */}
        <div className="mt-8">
          <h2 className="mb-4 text-lg font-semibold">All Payments</h2>
          <Card className="overflow-hidden p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/10 bg-white/3">
                    {["User", "Plan", "Amount", "Status", "Date"].map((h) => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-secondary-400">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {payments && payments.length > 0 ? payments.map((p) => (
                    <tr key={p.id} className="border-b border-white/5 text-sm hover:bg-white/3">
                      <td className="px-4 py-4">
                        <p className="font-medium">{(p.users as { full_name: string | null } | null)?.full_name || "Unknown"}</p>
                        <p className="text-xs text-secondary-500">{(p.users as { email: string } | null)?.email}</p>
                      </td>
                      <td className="px-4 py-4 capitalize text-secondary-300">{p.plan}</td>
                      <td className="px-4 py-4 font-semibold text-emerald-400">₹{((p.amount_paise ?? 0) / 100).toFixed(0)}</td>
                      <td className="px-4 py-4">
                        <Badge variant={statusVariants[p.status] ?? "secondary"}>{p.status}</Badge>
                      </td>
                      <td className="px-4 py-4 text-xs text-secondary-400">
                        {new Date(p.created_at).toLocaleDateString("en-IN")}
                      </td>
                    </tr>
                  )) : (
                    <tr><td colSpan={5} className="py-12 text-center text-secondary-500">No payments yet</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      </div>
    </DashboardShell>
  );
}
