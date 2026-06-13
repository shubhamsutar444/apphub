import { DashboardShell } from "@/components/layout/dashboard-shell";
import { requireRole } from "@/lib/auth/guards";
import { createAdminClient } from "@/lib/supabase/admin";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AdminUserActions } from "@/components/admin/admin-user-actions";
import { Users } from "lucide-react";

export default async function AdminUsersPage() {
  const user = await requireRole("admin");
  const adminClient = createAdminClient();

  const { data: users } = await adminClient
    .from("users")
    .select("*")
    .neq("role", "admin")
    .order("created_at", { ascending: false })
    .limit(100);

  return (
    <DashboardShell role={user.profile.role}>
      <div>
        <div className="flex items-center gap-3">
          <Users className="h-7 w-7 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">Users</h1>
            <p className="mt-1 text-secondary-400">
              {users?.length ?? 0} registered users
            </p>
          </div>
        </div>

        <Card className="mt-8 overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10 bg-white/3">
                  {["User", "Email", "Role", "Verified", "Joined", "Actions"].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-secondary-400">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {users && users.length > 0 ? (
                  users.map((u) => (
                    <tr key={u.id} className="border-b border-white/5 text-sm hover:bg-white/3">
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                            {(u.full_name || u.email).charAt(0).toUpperCase()}
                          </div>
                          <span className="font-medium">{u.full_name || "—"}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-secondary-400">{u.email}</td>
                      <td className="px-4 py-4">
                        <Badge
                          variant={u.role === "developer" ? "info" : "secondary"}
                        >
                          {u.role}
                        </Badge>
                      </td>
                      <td className="px-4 py-4">
                        <span className={u.is_verified ? "text-primary" : "text-secondary-500"}>
                          {u.is_verified ? "✓ Yes" : "No"}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-secondary-400 text-xs">
                        {new Date(u.created_at).toLocaleDateString("en-IN")}
                      </td>
                      <td className="px-4 py-4">
                        <AdminUserActions userId={u.id} currentRole={u.role} />
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-secondary-500">
                      No users found
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
