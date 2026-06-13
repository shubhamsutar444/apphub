import { DashboardShell } from "@/components/layout/dashboard-shell";
import { requireRole } from "@/lib/auth/guards";
import { createAdminClient } from "@/lib/supabase/admin";
import { AdminCategoriesClient } from "@/components/admin/admin-categories-client";
import type { Category } from "@/types";

export default async function AdminCategoriesPage() {
  const user = await requireRole("admin");
  const adminClient = createAdminClient();

  const { data: categories } = await adminClient
    .from("categories")
    .select("*")
    .order("sort_order");

  return (
    <DashboardShell role={user.profile.role}>
      <div>
        <h1 className="text-3xl font-bold">Categories</h1>
        <p className="mt-2 text-secondary-400">Manage app categories</p>
        <div className="mt-8">
          <AdminCategoriesClient categories={(categories ?? []) as Category[]} />
        </div>
      </div>
    </DashboardShell>
  );
}
