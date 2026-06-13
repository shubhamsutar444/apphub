import { redirect } from "next/navigation";
import { MainLayout } from "@/components/layout/main-layout";
import { PageTransition } from "@/components/shared/page-transition";
import { getCurrentUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Upload, LogIn, UserPlus, CheckCircle } from "lucide-react";

// This is the PUBLIC landing page for app submission.
// - Not logged in → show login/signup prompt
// - Logged in, not developer → go to /publish (payment)
// - Logged in, developer/admin → go directly to submit form

export default async function SubmitAppLandingPage() {
  const user = await getCurrentUser();

  if (user) {
    const supabase = await createClient();
    const { data: dev } = await supabase
      .from("developers")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (dev || user.profile.role === "admin") {
      redirect("/dashboard/developer/apps/new");
    }
    redirect("/publish");
  }

  return (
    <MainLayout>
      <PageTransition>
        <div className="section-container py-20">
          <div className="mx-auto max-w-2xl text-center">
            <div className="mb-6 flex justify-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-primary/15 ring-2 ring-primary/30">
                <Upload className="h-10 w-10 text-primary" />
              </div>
            </div>
            <span className="badge-kiwi">📱 Publish on AppHub</span>
            <h1 className="mt-5 font-heading text-4xl font-bold">
              Publish Your Android App
            </h1>
            <p className="mt-4 text-lg text-secondary-400">
              Reach thousands of users on India&apos;s trusted Android marketplace.
              Submit your APK, screenshots, and app details — we&apos;ll review and publish it.
            </p>

            {/* Steps */}
            <div className="mt-10 grid gap-4 sm:grid-cols-3 text-left">
              {[
                { step: "01", title: "Create Account", desc: "Sign up with email OTP verification" },
                { step: "02", title: "Choose Plan", desc: "Starting from just ₹1 for new publishers" },
                { step: "03", title: "Submit & Go Live", desc: "Upload APK, screenshots, and details" },
              ].map((item) => (
                <div key={item.step} className="rounded-2xl border border-primary/15 bg-primary/5 p-5">
                  <div className="font-heading text-3xl font-bold text-primary/30">{item.step}</div>
                  <div className="mt-2 font-semibold">{item.title}</div>
                  <div className="mt-1 text-sm text-secondary-400">{item.desc}</div>
                </div>
              ))}
            </div>

            {/* Benefits */}
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              {[
                "✅ Starting at ₹1",
                "✅ Manual review by admin",
                "✅ Live within 24–72 hours",
                "✅ Real download analytics",
                "✅ User reviews & ratings",
              ].map((b) => (
                <span key={b} className="rounded-full border border-primary/20 bg-primary/8 px-4 py-1.5 text-sm text-secondary-300">
                  {b}
                </span>
              ))}
            </div>

            {/* CTAs */}
            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link href="/signup">
                <Button size="lg" className="gap-2 min-w-[180px]">
                  <UserPlus className="h-5 w-5" />
                  Create Account
                </Button>
              </Link>
              <Link href="/login">
                <Button size="lg" variant="secondary" className="gap-2 min-w-[180px]">
                  <LogIn className="h-5 w-5" />
                  Already have account
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </PageTransition>
    </MainLayout>
  );
}
