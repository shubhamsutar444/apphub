import { DashboardShell } from "@/components/layout/dashboard-shell";
import { requireRole } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import { AppSubmissionForm } from "@/components/forms/app-submission-form";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import type { Category } from "@/types";

export default async function SubmitAppPage() {
  const user = await requireRole("developer");
  const supabase = await createClient();

  const { data: developer } = await supabase
    .from("developers")
    .select("id")
    .eq("user_id", user.id)
    .single();

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
        <h1 className="text-3xl font-bold">Submit New App</h1>
        <p className="mt-2 text-secondary-400">
          Fill in the details below to submit your app for review
        </p>
        <div className="mt-8">
          <AppSubmissionForm categories={(categories ?? []) as Category[]} />
        </div>
      </div>
    </DashboardShell>
  );
}
