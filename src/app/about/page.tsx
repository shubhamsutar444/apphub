import { MainLayout } from "@/components/layout/main-layout";
import { PageTransition } from "@/components/shared/page-transition";
import Link from "next/link";
import { Smartphone, Shield, Zap, Users } from "lucide-react";

export default function AboutPage() {
  return (
    <MainLayout>
      <PageTransition>
        <div className="section-container py-16">
          {/* Hero */}
          <div className="mx-auto max-w-3xl text-center">
            <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 ring-2 ring-primary/20">
              <Smartphone className="h-8 w-8 text-primary" />
            </div>
            <h1 className="mt-6 text-4xl font-bold">About AppHub</h1>
            <p className="mt-4 text-lg leading-relaxed text-secondary-400">
              AppHub is India&apos;s trusted Android app marketplace — built to help developers
              reach users affordably and help users discover quality Android applications.
            </p>
          </div>

          {/* Values */}
          <div className="mt-20 grid gap-8 sm:grid-cols-3">
            {[
              {
                icon: Shield,
                title: "Safe & Trusted",
                desc: "Every app is manually reviewed by our team before it reaches users. We check for malware, privacy issues, and policy violations.",
              },
              {
                icon: Zap,
                title: "Affordable Publishing",
                desc: "We believe every developer deserves a fair chance. Publish your app starting at just ₹99 — a fraction of what other platforms charge.",
              },
              {
                icon: Users,
                title: "Community First",
                desc: "Built for Indian developers and users. Our platform is designed around the needs of the Indian mobile ecosystem.",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="rounded-2xl border border-white/10 bg-white/3 p-6 text-center"
              >
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                  <item.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold">{item.title}</h3>
                <p className="mt-2 text-sm text-secondary-400 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>

          {/* Mission */}
          <div className="mt-20 mx-auto max-w-3xl rounded-3xl border border-primary/20 bg-primary/5 p-10 text-center">
            <h2 className="text-2xl font-bold">Our Mission</h2>
            <p className="mt-4 text-secondary-400 leading-relaxed">
              To democratize app distribution in India — making it easy for any developer to
              publish their work and any user to discover great apps they can trust. We&apos;re
              building the ecosystem that Indian developers deserve.
            </p>
            <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <Link href="/marketplace">
                <button className="btn-primary">Explore Apps</button>
              </Link>
              <Link href="/signup">
                <button className="btn-secondary">Start Publishing</button>
              </Link>
            </div>
          </div>
        </div>
      </PageTransition>
    </MainLayout>
  );
}
