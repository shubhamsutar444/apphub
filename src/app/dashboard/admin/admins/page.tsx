import { DashboardShell } from "@/components/layout/dashboard-shell";
import { requireRole } from "@/lib/auth/guards";
import { createAdminClient } from "@/lib/supabase/admin";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AddAdminForm } from "@/components/admin/add-admin-form";
import { Shield } from "lucide-react";

export default async function AdminManagePage() {
  const user = await requireRole("admin");
  const adminClient = createAdminClient();

  const { data: admins } = await adminClient
    .from("users")
    .select("id, email, full_name, created_at")
    .eq("role", "admin")
    .order("created_at");

  return (
    <DashboardShell role={user.profile.role}>
      <div>
        <div className="flex items-center gap-3">
          <Shield className="h-7 w-7 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">Manage Admins</h1>
            <p className="mt-1 text-secondary-400">Add or view platform administrators</p>
          </div>
        </div>

        {/* Add Admin */}
        <Card className="mt-8 max-w-lg">
          <h2 className="mb-5 font-semibold">Promote User to Admin</h2>
          <AddAdminForm />
        </Card>

        {/* Current Admins */}
        <div className="mt-8">
          <h2 className="mb-4 font-semibold">Current Admins ({admins?.length ?? 0})</h2>
          <Card className="overflow-hidden p-0">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10 bg-white/3">
                  {["Name", "Email", "Since"].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-secondary-400">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {admins?.map((a) => (
                  <tr key={a.id} className="border-b border-white/5 text-sm">
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/15 text-xs font-bold text-primary">
                          {(a.full_name || a.email).charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium">{a.full_name || "—"}</p>
                          <Badge variant="default" className="mt-0.5">Admin</Badge>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-secondary-400">{a.email}</td>
                    <td className="px-4 py-4 text-secondary-500 text-xs">
                      {new Date(a.created_at).toLocaleDateString("en-IN")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </div>
      </div>
    </DashboardShell>
  );
}
