import { notFound } from "next/navigation";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { requireRole } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import { AppEditForm } from "@/components/forms/app-edit-form";
import type { Application, ApplicationScreenshot, ApplicationVersion, Category } from "@/types";

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

  const [{ data: app }, { data: categories }, { data: screenshots }, { data: versions }] =
    await Promise.all([
      supabase
        .from("applications")
        .select(`*, categories:category_id(*)`)
        .eq("id", id)
        .eq("developer_id", developer?.id ?? "")
        .single(),
      supabase
        .from("categories")
        .select("*")
        .eq("is_active", true)
        .order("sort_order"),
      supabase
        .from("application_screenshots")
        .select("*")
        .eq("application_id", id)
        .order("sort_order"),
      supabase
        .from("application_versions")
        .select("*")
        .eq("application_id", id)
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(1),
    ]);

  if (!app) notFound();

  return (
    <DashboardShell role={user.profile.role}>
      <div>
        <h1 className="text-3xl font-bold">Edit App</h1>
        <p className="mt-2 text-secondary-400">Update your app details, files, and assets</p>
        <div className="mt-8">
          <AppEditForm
            app={app as unknown as Application}
            categories={(categories ?? []) as Category[]}
            existingScreenshots={(screenshots ?? []) as ApplicationScreenshot[]}
            currentApkUrl={(versions?.[0] as ApplicationVersion | undefined)?.apk_path ?? ""}
            currentApkVersion={(versions?.[0] as ApplicationVersion | undefined)?.version ?? ""}
          />
        </div>
      </div>
    </DashboardShell>
  );
}
