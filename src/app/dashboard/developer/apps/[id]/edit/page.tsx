import { notFound } from "next/navigation";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { requireRole } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import { AppEditForm } from "@/components/forms/app-edit-form";
import type { Application, Category } from "@/types";

interface EditAppPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditAppPage({ params }: EditAppPageProps) {
  const { id } = await params;
  const user = await requireRole("developer");
  const supabase = await createClient();

  const { data: developer } = await supabase
    .from("developers")
    .select("id")
    .eq("user_id", user.id)
    .single();

  const { data: app } = await supabase
    .from("applications")
    .select(`*, categories:category_id(*)`)
    .eq("id", id)
    .eq("developer_id", developer?.id ?? "")
    .single();

  if (!app) notFound();

  const { data: categories } = await supabase
    .from("categories")
    .select("*")
    .eq("is_active", true)
    .order("sort_order");

  return (
    <DashboardShell role={user.profile.role}>
      <div>
        <h1 className="text-3xl font-bold">Edit App</h1>
        <p className="mt-2 text-secondary-400">Update your app details</p>
        <div className="mt-8">
          <AppEditForm
            app={app as unknown as Application}
            categories={(categories ?? []) as Category[]}
          />
        </div>
      </div>
    </DashboardShell>
  );
}
