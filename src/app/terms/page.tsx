import { MainLayout } from "@/components/layout/main-layout";
import { PageTransition } from "@/components/shared/page-transition";

export const metadata = {
  title: "Terms of Service — AppHub",
  description: "Terms and conditions for using AppHub platform",
};

export default function TermsPage() {
  return (
    <MainLayout>
      <PageTransition>
        <div className="section-container py-16">
          <div className="mx-auto max-w-3xl glass-card">
            <span className="badge-kiwi">Legal</span>
            <h1 className="mt-3 font-heading text-3xl font-bold sm:text-4xl">
              Terms of Service
            </h1>
            <p className="mt-2 text-xs text-secondary-400">
              Last updated: July 21, 2026
            </p>

            <div className="mt-8 space-y-6 text-sm leading-relaxed text-secondary-300">
              <section>
                <h2 className="text-lg font-semibold text-white">1. Acceptance of Terms</h2>
                <p className="mt-2">
                  By accessing or using AppHub, you agree to comply with and be bound by these Terms of Service. If you do not agree to these terms, please do not use our services.
                </p>
              </section>

              <section>
                <h2 className="text-lg font-semibold text-white">2. Developer Guidelines</h2>
                <p className="mt-2">
                  Developers submitting applications to AppHub must ensure that their APKs do not contain malware, spyware, offensive content, or violate any third-party copyrights or intellectual property rights.
                </p>
              </section>

              <section>
                <h2 className="text-lg font-semibold text-white">3. Payments & Fees</h2>
                <p className="mt-2">
                  Publishing fees paid for developer account activation or app promotions are non-refundable once verified and activated by the platform administrators.
                </p>
              </section>

              <section>
                <h2 className="text-lg font-semibold text-white">4. User Account Security</h2>
                <p className="mt-2">
                  You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account.
                </p>
              </section>

              <section>
                <h2 className="text-lg font-semibold text-white">5. Termination & Suspension</h2>
                <p className="mt-2">
                  AppHub reserves the right to suspend or terminate any user or developer account that violates these terms or engages in fraudulent activity.
                </p>
              </section>
            </div>
          </div>
        </div>
      </PageTransition>
    </MainLayout>
  );
}
