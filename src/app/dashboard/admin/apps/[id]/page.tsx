import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { requireRole } from "@/lib/auth/guards";
import { createAdminClient } from "@/lib/supabase/admin";
import { AdminAppReviewClient } from "@/components/admin/admin-app-review-client";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  ArrowLeft, Globe, Shield, ExternalLink,
  Calendar, Package, Download, Star, Mail,
} from "lucide-react";

interface AdminAppDetailPageProps {
  params: Promise<{ id: string }>;
}

const statusVariants: Record<string, "default" | "warning" | "success" | "danger" | "secondary"> = {
  approved: "success",
  pending_review: "warning",
  rejected: "danger",
  changes_requested: "warning",
  draft: "secondary",
};

function formatBytes(bytes: number | null) {
  if (!bytes) return "—";
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default async function AdminAppDetailPage({ params }: AdminAppDetailPageProps) {
  const { id } = await params;
  const user = await requireRole("admin");
  const adminClient = createAdminClient();

  const { data: app } = await adminClient
    .from("applications")
    .select(`
      *,
      categories:category_id(name, icon),
      developers:developer_id(display_name, slug, website, support_email, is_verified, user_id)
    `)
    .eq("id", id)
    .single();

  if (!app) notFound();

  const [{ data: screenshots }, { data: versions }, { data: payment }] = await Promise.all([
    adminClient
      .from("application_screenshots")
      .select("*")
      .eq("application_id", id)
      .order("sort_order"),
    adminClient
      .from("application_versions")
      .select("*")
      .eq("application_id", id)
      .order("created_at", { ascending: false }),
    adminClient
      .from("payments")
      .select("*")
      .eq("application_id", id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  const dev = app.developers as {
    display_name: string; slug: string; website: string | null;
    support_email: string | null; is_verified: boolean; user_id: string;
  } | null;

  const cat = app.categories as { name: string; icon: string | null } | null;

  return (
    <DashboardShell role={user.profile.role}>
      <div>
        {/* Back */}
        <Link
          href="/dashboard/admin/apps"
          className="inline-flex items-center gap-2 text-sm text-secondary-400 hover:text-primary transition-colors mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Apps
        </Link>

        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl bg-primary/10 ring-2 ring-primary/20">
              {app.icon_url ? (
                <Image src={app.icon_url} alt={app.name} fill className="object-cover" sizes="80px" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-3xl">📱</div>
              )}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-bold">{app.name}</h1>
                <Badge variant={statusVariants[app.status] ?? "secondary"}>
                  {app.status.replace("_", " ")}
                </Badge>
                {app.is_featured && <Badge variant="default">Featured</Badge>}
              </div>
              <p className="mt-1 text-secondary-400">{dev?.display_name ?? "Unknown Developer"}</p>
              <p className="mt-1 text-sm text-secondary-500">{app.short_description}</p>
            </div>
          </div>

          {/* Quick actions */}
          <AdminAppReviewClient app={app} />
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-3">
          {/* Main */}
          <div className="lg:col-span-2 space-y-6">

            {/* Description */}
            <Card>
              <h2 className="mb-3 font-semibold">Full Description</h2>
              <p className="text-sm leading-relaxed text-secondary-300 whitespace-pre-wrap">
                {app.full_description}
              </p>
              {app.tags && app.tags.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {app.tags.map((tag: string) => (
                    <Badge key={tag} variant="secondary">{tag}</Badge>
                  ))}
                </div>
              )}
            </Card>

            {/* Screenshots */}
            {screenshots && screenshots.length > 0 && (
              <Card>
                <h2 className="mb-4 font-semibold">Screenshots ({screenshots.length})</h2>
                <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                  {screenshots.map((ss: { id: string; url: string }) => (
                    <a key={ss.id} href={ss.url} target="_blank" rel="noopener noreferrer">
                      <div className="relative h-48 w-28 shrink-0 overflow-hidden rounded-xl ring-1 ring-white/10 hover:ring-primary/40 transition-all">
                        <Image src={ss.url} alt="Screenshot" fill className="object-cover" sizes="112px" />
                      </div>
                    </a>
                  ))}
                </div>
              </Card>
            )}

            {/* APK Versions */}
            {versions && versions.length > 0 && (
              <Card>
                <h2 className="mb-4 font-semibold">APK Files</h2>
                <div className="space-y-3">
                  {versions.map((v: { id: string; version: string; apk_path: string; apk_size_bytes: number; changelog: string | null; created_at: string }) => (
                    <div key={v.id} className="flex items-center gap-3 rounded-xl border border-white/5 p-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary text-xs font-bold">
                        APK
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm">v{v.version}</p>
                        <p className="text-xs text-secondary-500">
                          {formatBytes(v.apk_size_bytes)} · {new Date(v.created_at).toLocaleDateString("en-IN")}
                        </p>
                        {v.changelog && (
                          <p className="mt-1 text-xs text-secondary-400 line-clamp-2">{v.changelog}</p>
                        )}
                      </div>
                      <a
                        href={v.apk_path}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 rounded-lg bg-primary/10 px-3 py-1.5 text-xs text-primary hover:bg-primary/20 transition-colors shrink-0"
                      >
                        <Download className="h-3.5 w-3.5" />
                        Download
                      </a>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Rejection / Admin notes */}
            {app.rejection_reason && (
              <div className="rounded-2xl border border-red-500/20 bg-red-500/8 p-5">
                <p className="text-sm font-semibold text-red-400 mb-1">Rejection Reason</p>
                <p className="text-sm text-red-300">{app.rejection_reason}</p>
              </div>
            )}
            {app.admin_notes && (
              <div className="rounded-2xl border border-yellow-500/20 bg-yellow-500/8 p-5">
                <p className="text-sm font-semibold text-yellow-400 mb-1">Admin Notes</p>
                <p className="text-sm text-yellow-300">{app.admin_notes}</p>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            <Card>
              <h3 className="mb-4 text-xs font-semibold uppercase tracking-wider text-secondary-500">
                App Details
              </h3>
              <div className="space-y-3 text-sm">
                {[
                  { label: "Category", value: cat ? `${cat.icon ?? ""} ${cat.name}` : "—", icon: Package },
                  { label: "Version", value: app.current_version ?? "—", icon: Package },
                  { label: "APK Size", value: formatBytes(app.apk_size_bytes), icon: Download },
                  { label: "Downloads", value: (app.download_count ?? 0).toLocaleString(), icon: Download },
                  { label: "Rating", value: app.rating_avg > 0 ? `★ ${app.rating_avg.toFixed(1)} (${app.rating_count})` : "No ratings", icon: Star },
                  { label: "Submitted", value: new Date(app.created_at).toLocaleDateString("en-IN"), icon: Calendar },
                  { label: "Plan", value: app.publishing_plan ?? "—", icon: Package },
                ].map(({ label, value }) => (
                  <div key={label} className="flex items-center justify-between gap-2">
                    <span className="text-secondary-500">{label}</span>
                    <span className="font-medium text-right capitalize">{value}</span>
                  </div>
                ))}
              </div>
            </Card>

            {/* Developer Info */}
            {dev && (
              <Card>
                <h3 className="mb-4 text-xs font-semibold uppercase tracking-wider text-secondary-500">
                  Developer
                </h3>
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-sm font-bold text-primary">
                    {dev.display_name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-medium">{dev.display_name}</p>
                    {dev.is_verified && (
                      <Badge variant="info" className="mt-0.5">
                        <Shield className="h-2.5 w-2.5" /> Verified
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="space-y-2 text-xs text-secondary-400">
                  {dev.support_email && (
                    <div className="flex items-center gap-2">
                      <Mail className="h-3.5 w-3.5" />
                      <span>{dev.support_email}</span>
                    </div>
                  )}
                  {dev.website && (
                    <a href={dev.website} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-2 text-primary hover:underline">
                      <Globe className="h-3.5 w-3.5" />
                      {dev.website.replace(/^https?:\/\//, "")}
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>
              </Card>
            )}

            {/* Payment */}
            {payment && (
              <Card>
                <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-secondary-500">
                  Payment Details
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-secondary-500">Plan</span>
                    <span className="capitalize font-medium">{payment.plan}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-secondary-500">Amount</span>
                    <span className="font-semibold text-primary">
                      ₹{((payment.amount_paise ?? 0) / 100).toFixed(0)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-secondary-500">Status</span>
                    <Badge variant={payment.status === "paid" ? "success" : "warning"}>
                      {payment.status === "paid" ? "Verified & Paid" : "Pending Verification"}
                    </Badge>
                  </div>

                  {payment.metadata?.screenshot_url && (
                    <div className="mt-3 pt-3 border-t border-white/10">
                      <p className="text-xs font-semibold text-secondary-400 mb-2">Payment Proof Screenshot</p>
                      <a
                        href={payment.metadata.screenshot_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group relative block h-44 w-full overflow-hidden rounded-xl border border-primary/20 bg-black/40"
                      >
                        <Image
                          src={payment.metadata.screenshot_url}
                          alt="Payment Proof Screenshot"
                          fill
                          className="object-cover transition-transform duration-300 group-hover:scale-105"
                          sizes="(max-width: 768px) 100vw, 300px"
                        />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                          <span className="rounded-lg bg-primary px-3 py-1 text-xs font-bold text-night-900 flex items-center gap-1">
                            <ExternalLink className="h-3 w-3" /> View Fullscreen
                          </span>
                        </div>
                      </a>
                    </div>
                  )}
                </div>
              </Card>
            )}

            {/* Links */}
            {(app.developer_website || app.privacy_policy_url) && (
              <Card>
                <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-secondary-500">Links</h3>
                <div className="space-y-2">
                  {app.developer_website && (
                    <a href={app.developer_website} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm text-primary hover:underline">
                      <Globe className="h-4 w-4" /> Developer Website
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                  {app.privacy_policy_url && (
                    <a href={app.privacy_policy_url} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm text-secondary-400 hover:text-white">
                      <Shield className="h-4 w-4" /> Privacy Policy
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
