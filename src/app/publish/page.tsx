import { redirect } from "next/navigation";
import { MainLayout } from "@/components/layout/main-layout";
import { PageTransition } from "@/components/shared/page-transition";
import { getCurrentUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { PublishPlansClient } from "@/components/publish/publish-plans-client";

const ADMIN_EMAIL = "shubhamsutar81981@gmail.com";

export default async function PublishPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?redirectTo=/publish");

  const supabase = await createClient();

  // ── Admin bypass: no payment, instant developer access ───────────────
  if (user.email.toLowerCase() === ADMIN_EMAIL || user.profile.role === "admin") {
    // Ensure developer profile exists for admin
    const { data: existing } = await supabase
      .from("developers")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!existing) {
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

      await adminClient
        .from("users")
        .update({ role: "admin" })
        .eq("id", user.id);
    }

    // Redirect directly to app submission — no payment needed
    redirect("/dashboard/developer/apps/new");
  }

  // ── Regular users: check developer profile and payment ───────────────
  const { data: developer } = await supabase
    .from("developers")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  // Already a developer → go straight to submit
  if (developer) {
    redirect("/dashboard/developer/apps/new");
  }

  const { count: priorPayments } = await supabase
    .from("payments")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("status", "paid");

  const isFirstTime = (priorPayments ?? 0) === 0;

  return (
    <MainLayout>
      <PageTransition>
        <div className="section-container py-16">
          <div className="mx-auto max-w-4xl">
            <div className="mb-10 text-center">
              <span className="badge-kiwi">🚀 Publish Your App</span>
              <h1 className="mt-5 font-heading text-4xl font-bold">
                Choose Your Publishing Plan
              </h1>
              <p className="mt-3 text-secondary-400">
                Get your Android app in front of thousands of users
              </p>
            </div>
            <PublishPlansClient
              userId={user.id}
              userEmail={user.email}
              userName={user.profile.full_name ?? user.email.split("@")[0]}
              isFirstTime={isFirstTime}
              hasDeveloperProfile={false}
            />
          </div>
        </div>
      </PageTransition>
    </MainLayout>
  );
}
