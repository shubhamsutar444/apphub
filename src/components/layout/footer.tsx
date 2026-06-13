import Link from "next/link";
import { Github, Twitter, Mail, Smartphone } from "lucide-react";
import { APP_NAME, APP_DESCRIPTION, ROUTES } from "@/lib/constants/routes";

const FOOTER_LINKS = {
  Product: [
    { href: ROUTES.marketplace, label: "Browse Apps" },
    { href: ROUTES.dashboard.developer, label: "Publish App" },
    { href: "/categories", label: "Categories" },
    { href: "/about", label: "About" },
  ],
  Company: [
    { href: "/about", label: "About Us" },
    { href: "/privacy", label: "Privacy Policy" },
    { href: "/terms", label: "Terms of Service" },
  ],
  Developers: [
    { href: ROUTES.dashboard.developer, label: "Developer Dashboard" },
    { href: ROUTES.dashboard.developer + "/profile", label: "Create Profile" },
    { href: ROUTES.dashboard.developer + "/apps/new", label: "Submit App" },
  ],
} as const;

const SOCIAL_LINKS = [
  { Icon: Twitter, href: "#", label: "Twitter" },
  { Icon: Github,  href: "#", label: "GitHub"  },
  { Icon: Mail,    href: "#", label: "Email"   },
];

export function Footer() {
  return (
    <footer className="border-t border-primary/10 bg-night-950/60">
      <div className="section-container py-16">
        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-5">

          {/* Brand col */}
          <div className="lg:col-span-2">
            <Link href={ROUTES.home} className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 ring-1 ring-primary/20">
                <Smartphone className="h-5 w-5 text-primary" />
              </div>
              <span className="font-heading text-xl font-bold text-gradient">{APP_NAME}</span>
            </Link>

            <p className="mt-4 max-w-sm text-sm leading-relaxed text-secondary-400">
              {APP_DESCRIPTION}
            </p>

            <div className="mt-6 flex gap-3">
              {SOCIAL_LINKS.map(({ Icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  className="flex h-10 w-10 items-center justify-center rounded-xl border border-primary/15 bg-primary/5 text-secondary-400 transition-all hover:border-primary/40 hover:text-primary hover:shadow-glow"
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Link cols */}
          {Object.entries(FOOTER_LINKS).map(([title, links]) => (
            <div key={title}>
              <h3 className="mb-4 font-heading text-sm font-semibold text-white">
                {title}
              </h3>
              <ul className="space-y-3">
                {links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-secondary-400 transition-colors hover:text-primary"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-primary/8 pt-8 sm:flex-row">
          <p className="text-sm text-secondary-500">
            © {new Date().getFullYear()} {APP_NAME}. All rights reserved.
          </p>
          <p className="text-sm text-secondary-500">
            Built with Next.js · Supabase · Vercel
          </p>
        </div>
      </div>
    </footer>
  );
}
