import { redirect } from "next/navigation";
import { MainLayout } from "@/components/layout/main-layout";
import { PageTransition } from "@/components/shared/page-transition";
import { getCurrentUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { PublishPlansClient } from "@/components/publish/publish-plans-client";

export default async function PublishPage() {
  const user = await getCurrentUser();

  if (!user) redirect("/login?redirectTo=/publish");

  const supabase = await createClient();

  // Check if user already has a developer profile (already paid before)
  const { data: developer } = await supabase
    .from("developers")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  // Check if this is a first-time publisher (no prior paid payments)
  const { count: priorPayments } = await supabase
    .from("payments")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("status", "paid");

  const isFirstTime = !developer && (priorPayments ?? 0) === 0;

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
              hasDeveloperProfile={!!developer}
            />
          </div>
        </div>
      </PageTransition>
    </MainLayout>
  );
}
