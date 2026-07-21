import { redirect } from "next/navigation";
import { MainLayout } from "@/components/layout/main-layout";
import { PageTransition } from "@/components/shared/page-transition";
import { getCurrentUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { UpiPaymentFlow } from "@/components/publish/upi-payment-flow";

const ADMIN_EMAIL = "shubhamsutar81981@gmail.com";

export default async function PublishPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?redirectTo=/publish");

  // Admin bypasses payment entirely
  if (user.email.toLowerCase() === ADMIN_EMAIL || user.profile.role === "admin") {
    redirect("/dashboard/developer/apps/new");
  }

  const supabase = await createClient();

  // Check if they already submitted a payment screenshot pending verification
  const { data: pendingPayment } = await supabase
    .from("payments")
    .select("id, status, metadata")
    .eq("user_id", user.id)
    .eq("status", "pending")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  // Determine if it's their first time publishing
  const { count } = await supabase
    .from("payments")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("status", "paid");

  const isFirstTime = (count ?? 0) === 0;

  return (
    <MainLayout>
      <PageTransition>
        <div className="section-container py-10 pb-24 md:pb-10">
          <UpiPaymentFlow
            userId={user.id}
            userEmail={user.email}
            userName={user.profile.full_name ?? user.email.split("@")[0]}
            hasPendingPayment={!!pendingPayment}
            isFirstTime={isFirstTime}
          />
        </div>
      </PageTransition>
    </MainLayout>
  );
}
