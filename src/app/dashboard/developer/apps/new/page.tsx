import { DashboardShell } from "@/components/layout/dashboard-shell";
import { requireRole } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { AppSubmissionForm } from "@/components/forms/app-submission-form";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import type { Category } from "@/types";

const ADMIN_EMAIL = "shubhamsutar81981@gmail.com";

export default async function SubmitAppPage() {
  const user = await requireRole("developer");
  const supabase = await createClient();
  const isAdmin = user.profile.role === "admin" || user.email.toLowerCase() === ADMIN_EMAIL;

  // Ensure developer profile exists (auto-create for admin)
  let { data: developer } = await supabase
    .from("developers")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!developer && isAdmin) {
    const adminClient = createAdminClient();
    const slug =
      (user.profile.full_name ?? user.email.split("@")[0])
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "") +
      "-" + Date.now().toString(36);

    await adminClient.from("developers").insert({
      user_id: user.id,
      display_name: user.profile.full_name ?? "Admin",
      slug,
      support_email: user.email,
    });

    const { data: newDev } = await supabase
      .from("developers")
      .select("id")
      .eq("user_id", user.id)
      .single();
    developer = newDev;
  }

  const { data: categories } = await supabase
    .from("categories")
    .select("*")
    .eq("is_active", true)
    .order("sort_order");

  if (!developer) {
    return (
      <DashboardShell role={user.profile.role}>
        <Card className="py-12 text-center">
          <h3 className="text-lg font-semibold">Developer Profile Required</h3>
          <p className="mt-2 text-secondary-400">
            Set up your developer profile before submitting apps.
          </p>
          <Link href="/dashboard/developer/profile" className="mt-4 inline-block">
            <Button>Create Developer Profile</Button>
          </Link>
        </Card>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell role={user.profile.role}>
      <div>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">
              {isAdmin ? "Publish App (Admin)" : "Submit New App"}
            </h1>
            <p className="mt-2 text-secondary-400">
              {isAdmin
                ? "As admin, your app will be published instantly — no review needed."
                : "Fill in the details below to submit your app for review"}
            </p>
          </div>
          {isAdmin && (
            <span className="rounded-xl border border-primary/30 bg-primary/10 px-3 py-1.5 text-sm font-semibold text-primary">
              ⚡ Instant Publish
            </span>
          )}
        </div>
        <div className="mt-8">
          <AppSubmissionForm
            categories={(categories ?? []) as Category[]}
            isAdmin={isAdmin}
          />
        </div>
      </div>
    </DashboardShell>
  );
}
