import { MainLayout } from "@/components/layout/main-layout";
import { PageTransition } from "@/components/shared/page-transition";

export const metadata = {
  title: "Privacy Policy — AppHub",
  description: "Privacy policy and data usage guidelines for AppHub",
};

export default function PrivacyPage() {
  return (
    <MainLayout>
      <PageTransition>
        <div className="section-container py-16">
          <div className="mx-auto max-w-3xl glass-card">
            <span className="badge-kiwi">Privacy</span>
            <h1 className="mt-3 font-heading text-3xl font-bold sm:text-4xl">
              Privacy Policy
            </h1>
            <p className="mt-2 text-xs text-secondary-400">
              Last updated: July 21, 2026
            </p>

            <div className="mt-8 space-y-6 text-sm leading-relaxed text-secondary-300">
              <section>
                <h2 className="text-lg font-semibold text-white">1. Information We Collect</h2>
                <p className="mt-2">
                  We collect information you provide directly to us when creating an account, publishing an application, submitting reviews, or uploading payment verification screenshots (such as email address, name, profile image, and payment proof).
                </p>
              </section>

              <section>
                <h2 className="text-lg font-semibold text-white">2. How We Use Your Information</h2>
                <p className="mt-2">
                  We use your information to operate and improve AppHub, authenticate users, process developer activation requests, and notify you regarding app reviews or account status updates.
                </p>
              </section>

              <section>
                <h2 className="text-lg font-semibold text-white">3. Data Security</h2>
                <p className="mt-2">
                  We take reasonable measures to protect your personal information against unauthorized access, loss, misuse, or alteration. All database access and authentication are handled securely via Supabase.
                </p>
              </section>

              <section>
                <h2 className="text-lg font-semibold text-white">4. Cookies & Storage</h2>
                <p className="mt-2">
                  AppHub uses essential browser cookies and local storage tokens strictly required for authenticating session state and maintaining security.
                </p>
              </section>

              <section>
                <h2 className="text-lg font-semibold text-white">5. Contact Us</h2>
                <p className="mt-2">
                  If you have any questions about this Privacy Policy, please contact us via the developer support options or email.
                </p>
              </section>
            </div>
          </div>
        </div>
      </PageTransition>
    </MainLayout>
  );
}
