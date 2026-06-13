import { DashboardShell } from "@/components/layout/dashboard-shell";
import { requireRole } from "@/lib/auth/guards";
import { createAdminClient } from "@/lib/supabase/admin";
import { AdminAppsTable } from "@/components/admin/admin-apps-table";
import type { Application } from "@/types";

interface AdminAppsPageProps {
  searchParams: Promise<{ status?: string; q?: string }>;
}

export default async function AdminAppsPage({ searchParams }: AdminAppsPageProps) {
  const user = await requireRole("admin");
  const params = await searchParams;
  const adminClient = createAdminClient();

  let query = adminClient
    .from("applications")
    .select(`
      *,
      categories:category_id(name),
      developers:developer_id(display_name, user_id)
    `)
    .order("created_at", { ascending: false });

  if (params.status) {
    query = query.eq("status", params.status);
  }

  if (params.q) {
    query = query.ilike("name", `%${params.q}%`);
  }

  const { data: apps } = await query.limit(100);

  return (
    <DashboardShell role={user.profile.role}>
      <div>
        <h1 className="text-3xl font-bold">Manage Apps</h1>
        <p className="mt-2 text-secondary-400">
          Review, approve, reject, and manage all applications
        </p>
        <div className="mt-8">
          <AdminAppsTable
            apps={(apps ?? []) as unknown as Application[]}
            currentStatus={params.status}
          />
        </div>
      </div>
    </DashboardShell>
  );
}
