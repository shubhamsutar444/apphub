import { redirect } from "next/navigation";
import { MainLayout } from "@/components/layout/main-layout";
import { PageTransition } from "@/components/shared/page-transition";
import { getCurrentUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Upload, LogIn, UserPlus } from "lucide-react";

export default async function SubmitAppLandingPage() {
  const user = await getCurrentUser();

  // If already logged in, go directly to publish flow (no payment UI)
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
    // Trigger auto-developer creation + redirect
    redirect("/publish");
  }

  // Not logged in — show simple prompt
  return (
    <MainLayout>
      <PageTransition>
        <div className="section-container py-20">
          <div className="mx-auto max-w-xl text-center">
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
              Sign up or log in to submit your app. It&apos;s free to get started —
              upload your APK, screenshots, and info, and we&apos;ll review it.
            </p>

            {/* Steps */}
            <div className="mt-10 grid gap-4 sm:grid-cols-3 text-left">
              {[
                { step: "01", title: "Sign Up / Log In", desc: "Quick OTP email verification" },
                { step: "02", title: "Submit App", desc: "Upload APK, icon & screenshots" },
                { step: "03", title: "Go Live", desc: "Admin reviews & publishes within 24h" },
              ].map((item) => (
                <div key={item.step} className="rounded-2xl border border-primary/15 bg-primary/5 p-5">
                  <div className="font-heading text-3xl font-bold text-primary/30">{item.step}</div>
                  <p className="mt-2 font-semibold">{item.title}</p>
                  <p className="mt-1 text-sm text-secondary-400">{item.desc}</p>
                </div>
              ))}
            </div>

            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link href="/signup">
                <Button size="lg" className="gap-2 min-w-[180px]">
                  <UserPlus className="h-5 w-5" />
                  Create Account
                </Button>
              </Link>
              <Link href="/login?redirectTo=/publish">
                <Button size="lg" variant="secondary" className="gap-2 min-w-[180px]">
                  <LogIn className="h-5 w-5" />
                  Already have account
                </Button>
              </Link>
            </div>

            <p className="mt-6 text-sm text-secondary-500">
              Free to join · No payment required to get started
            </p>
          </div>
        </div>
      </PageTransition>
    </MainLayout>
  );
}
