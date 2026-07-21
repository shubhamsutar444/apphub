import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { MainLayout } from "@/components/layout/main-layout";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentUser } from "@/lib/auth/session";
import { AppDetailClient } from "@/components/apps/app-detail-client";
import { ScreenshotGallery } from "@/components/apps/screenshot-gallery";
import { RatingDisplay } from "@/components/apps/star-rating";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import type { Application, ApplicationVersion, ApplicationScreenshot, Review } from "@/types";
import {
  Download, Globe, Shield, ExternalLink,
  Calendar, Package, Star, ArrowLeft,
} from "lucide-react";

interface AppPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: AppPageProps): Promise<Metadata> {
  const { slug } = await params;
  const adminClient = createAdminClient();
  const { data: app } = await adminClient
    .from("applications")
    .select("name, short_description, icon_url, banner_url, rating_avg, download_count")
    .eq("slug", slug)
    .maybeSingle();

  if (!app) return { title: "App Not Found" };
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://apphub-k384-git-main-shubhamsutar444s-projects.vercel.app";
  const pageUrl = `${appUrl}/apps/${slug}`;
  const image = app.banner_url || app.icon_url || `${appUrl}/og-default.png`;
  return {
    title: `${app.name} — AppHub`,
    description: app.short_description,
    openGraph: {
      title: `${app.name} — Download on AppHub`,
      description: `${app.short_description} · ★ ${app.rating_avg > 0 ? app.rating_avg.toFixed(1) : "New"} · ${app.download_count?.toLocaleString()} downloads`,
      url: pageUrl, type: "website",
      images: [{ url: image, width: 1200, height: 630, alt: app.name }],
    },
    twitter: {
      card: "summary_large_image",
      title: `${app.name} — Download on AppHub`,
      description: app.short_description,
      images: [image],
    },
    alternates: { canonical: pageUrl },
  };
}

function formatBytes(bytes: number | null): string {
  if (!bytes) return "Unknown";
  const mb = bytes / (1024 * 1024);
  return mb < 1 ? `${(bytes / 1024).toFixed(0)} KB` : `${mb.toFixed(1)} MB`;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-IN", { year: "numeric", month: "short", day: "numeric" });
}

export default async function AppDetailPage({ params }: AppPageProps) {
  const { slug } = await params;
  const adminClient = createAdminClient();
  const user = await getCurrentUser();

  const { data: app } = await adminClient
    .from("applications")
    .select("*, categories:category_id(*), developers:developer_id(*)")
    .eq("slug", slug)
    .maybeSingle();

  if (!app) notFound();

  const typedApp = app as unknown as Application;
  const dev = typedApp.developers as { id: string; user_id: string; display_name: string; slug: string; is_verified: boolean } | null;
  const cat = typedApp.categories as { name: string } | null;

  // Security check: if app is not yet approved, only developer owner or admin can view preview
  const isOwnerOrAdmin = user && (user.profile.role === "admin" || dev?.user_id === user.id);
  if (typedApp.status !== "approved" && !isOwnerOrAdmin) {
    notFound();
  }

  const supabase = await createClient();

  const [{ data: versions }, { data: screenshots }, { data: reviews }] = await Promise.all([
    adminClient.from("application_versions").select("*").eq("application_id", typedApp.id).eq("is_active", true).order("created_at", { ascending: false }),
    adminClient.from("application_screenshots").select("*").eq("application_id", typedApp.id).order("sort_order"),
    supabase.from("reviews").select("*, users:user_id(full_name, avatar_url)").eq("application_id", typedApp.id).order("created_at", { ascending: false }).limit(10),
  ]);

  const latestVersion = versions?.[0] as ApplicationVersion | undefined;
  let isFavorited = false;
  let userReview = null;
  if (user) {
    const [{ data: fav }, { data: rev }] = await Promise.all([
      supabase.from("favorites").select("id").eq("user_id", user.id).eq("application_id", typedApp.id).single(),
      supabase.from("reviews").select("*").eq("user_id", user.id).eq("application_id", typedApp.id).single(),
    ]);
    isFavorited = !!fav;
    userReview = rev;
  }

  const typedReviews = (reviews ?? []) as Review[];
  const ratingBreakdown = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: typedReviews.filter((r) => r.rating === star).length,
    percentage: typedApp.rating_count > 0 ? (typedReviews.filter((r) => r.rating === star).length / typedApp.rating_count) * 100 : 0,
  }));

  return (
    <MainLayout>
      <div className="min-h-screen overflow-x-hidden">
        {/* ── Banner ─────────────────────────────────────────────────── */}
        {typedApp.banner_url && (
          <div className="relative h-44 w-full overflow-hidden sm:h-56 lg:h-72">
            <Image src={typedApp.banner_url} alt={`${typedApp.name} banner`} fill className="object-cover" priority />
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-night-950" />
          </div>
        )}

        <div className="section-container pb-24 pt-4 sm:pb-12">
          {/* Back link */}
          <Link href="/marketplace" className="mb-4 inline-flex items-center gap-1.5 text-sm text-secondary-400 hover:text-white transition-colors">
            <ArrowLeft className="h-4 w-4" /> Back to Marketplace
          </Link>

          {/* ── App Header — mobile-first ─────────────────────────── */}
          <div className="flex items-start gap-4">
            {/* Icon */}
            <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 ring-2 ring-white/10 sm:h-24 sm:w-24">
              {typedApp.icon_url ? (
                <Image src={typedApp.icon_url} alt={typedApp.name} fill className="object-cover" sizes="96px" priority />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-4xl">📱</div>
              )}
            </div>

            {/* Title block */}
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-1.5">
                <h1 className="font-heading text-xl font-bold leading-tight sm:text-2xl lg:text-3xl">{typedApp.name}</h1>
                {typedApp.is_editors_choice && (
                  <Badge variant="info" className="shrink-0"><Shield className="h-2.5 w-2.5" />Editor&apos;s Choice</Badge>
                )}
                {typedApp.is_featured && <Badge variant="default" className="shrink-0">Featured</Badge>}
              </div>
              {dev && (
                <Link href={`/developers/${dev.slug}`} className="mt-0.5 block text-sm text-primary hover:underline">
                  {dev.display_name}
                </Link>
              )}
              <div className="mt-1.5">
                <RatingDisplay rating={typedApp.rating_avg} count={typedApp.rating_count} />
              </div>
              {/* Quick stats row */}
              <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-secondary-400">
                <span className="flex items-center gap-1">
                  <Download className="h-3 w-3" />{typedApp.download_count.toLocaleString()}
                </span>
                {cat && <span className="truncate max-w-[80px]">{cat.name}</span>}
                {typedApp.current_version && <span>v{typedApp.current_version}</span>}
                <span>{formatBytes(typedApp.apk_size_bytes)}</span>
              </div>
            </div>
          </div>

          {/* ── Main grid: single col on mobile, 3-col on desktop ─── */}
          <div className="mt-6 grid gap-6 lg:grid-cols-3">

            {/* ── Left/Main column ────────────────────────────────── */}
            <div className="space-y-5 lg:col-span-2 min-w-0">

              {/* Actions */}
              <AppDetailClient
                app={typedApp}
                latestVersion={latestVersion}
                user={user}
                isFavorited={isFavorited}
                userReview={userReview}
              />

              {/* App Info card — shown inline on mobile, sidebar on desktop */}
              <div className="lg:hidden">
                <AppInfoCard typedApp={typedApp} dev={dev} />
              </div>

              {/* Screenshots */}
              {screenshots && screenshots.length > 0 && (
                <Card>
                  <h2 className="mb-3 font-heading text-base font-semibold sm:text-lg">
                    Screenshots
                    <span className="ml-2 text-xs font-normal text-secondary-500">(tap to expand)</span>
                  </h2>
                  <ScreenshotGallery screenshots={screenshots as ApplicationScreenshot[]} />
                </Card>
              )}

              {/* Description */}
              <Card>
                <h2 className="mb-3 font-heading text-base font-semibold sm:text-lg">About this app</h2>
                <p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-secondary-300">
                  {typedApp.full_description}
                </p>
                {typedApp.tags && typedApp.tags.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {typedApp.tags.map((tag) => <Badge key={tag} variant="secondary">{tag}</Badge>)}
                  </div>
                )}
              </Card>

              {/* Changelog */}
              {versions && versions.length > 0 && (
                <Card>
                  <h2 className="mb-3 font-heading text-base font-semibold sm:text-lg">What&apos;s New</h2>
                  {(versions as ApplicationVersion[]).slice(0, 3).map((v) => (
                    <div key={v.id} className="mb-4 last:mb-0">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">v{v.version}</span>
                        <span className="text-xs text-secondary-500">{formatDate(v.created_at)}</span>
                      </div>
                      {v.changelog && <p className="mt-1 text-sm text-secondary-400">{v.changelog}</p>}
                    </div>
                  ))}
                </Card>
              )}

              {/* Ratings & Reviews */}
              <Card>
                <div className="mb-5 flex items-center justify-between">
                  <h2 className="font-heading text-base font-semibold sm:text-lg">Ratings &amp; Reviews</h2>
                  <div className="text-right">
                    <div className="font-heading text-2xl font-bold text-yellow-400">
                      {typedApp.rating_avg > 0 ? typedApp.rating_avg.toFixed(1) : "—"}
                    </div>
                    <div className="text-xs text-secondary-500">{typedApp.rating_count} ratings</div>
                  </div>
                </div>

                {/* Rating bars */}
                <div className="mb-5 space-y-2">
                  {ratingBreakdown.map(({ star, percentage }) => (
                    <div key={star} className="flex items-center gap-2">
                      <span className="w-3 shrink-0 text-xs text-secondary-400">{star}</span>
                      <Star className="h-3.5 w-3.5 shrink-0 fill-yellow-400 text-yellow-400" />
                      <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/10">
                        <div className="h-full rounded-full bg-yellow-400 transition-all" style={{ width: `${percentage}%` }} />
                      </div>
                    </div>
                  ))}
                </div>

                {typedReviews.length > 0 ? (
                  <div className="space-y-4">
                    {(typedReviews as (Review & { users?: { full_name: string | null } })[]).map((review) => (
                      <div key={review.id} className="border-t border-white/5 pt-4">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="text-sm font-medium">{review.users?.full_name ?? "Anonymous"}</p>
                            <RatingDisplay rating={review.rating} count={0} />
                          </div>
                          <span className="shrink-0 text-xs text-secondary-500">{formatDate(review.created_at)}</span>
                        </div>
                        {review.title && <p className="mt-2 text-sm font-medium">{review.title}</p>}
                        {review.body && <p className="mt-1 text-sm leading-relaxed text-secondary-400">{review.body}</p>}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-secondary-500">No reviews yet. Be the first!</p>
                )}
              </Card>
            </div>

            {/* ── Sidebar — hidden on mobile (shown inline above) ── */}
            <div className="hidden lg:block lg:space-y-4">
              <AppInfoCard typedApp={typedApp} dev={dev} />
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}

// ── App Info sidebar card (shared between mobile inline + desktop sidebar) ────
function AppInfoCard({
  typedApp,
  dev,
}: {
  typedApp: Application;
  dev: { display_name: string; slug: string; is_verified: boolean } | null;
}) {
  return (
    <>
      <Card>
        <h3 className="mb-4 text-xs font-semibold uppercase tracking-wider text-secondary-400">App Info</h3>
        <div className="space-y-3">
          {[
            { icon: Package, label: "Version", value: typedApp.current_version ?? "—" },
            { icon: Download, label: "Size", value: formatBytes(typedApp.apk_size_bytes) },
            { icon: Calendar, label: "Updated", value: typedApp.updated_at ? new Date(typedApp.updated_at).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" }) : "—" },
            { icon: Star, label: "Downloads", value: typedApp.download_count.toLocaleString() },
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-sm text-secondary-400"><Icon className="h-3.5 w-3.5" />{label}</span>
              <span className="text-sm font-medium">{value}</span>
            </div>
          ))}
        </div>
        {(typedApp.developer_website || typedApp.privacy_policy_url) && (
          <div className="mt-4 space-y-2 border-t border-white/5 pt-4">
            {typedApp.developer_website && (
              <a href={typedApp.developer_website} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-primary hover:underline">
                <Globe className="h-4 w-4 shrink-0" /><span className="truncate">Developer Website</span><ExternalLink className="h-3 w-3 shrink-0" />
              </a>
            )}
            {typedApp.privacy_policy_url && (
              <a href={typedApp.privacy_policy_url} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-secondary-400 hover:text-white">
                <Shield className="h-4 w-4 shrink-0" /><span className="truncate">Privacy Policy</span><ExternalLink className="h-3 w-3 shrink-0" />
              </a>
            )}
          </div>
        )}
      </Card>

      {dev && (
        <Card>
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-secondary-400">Developer</h3>
          <Link href={`/developers/${dev.slug}`} className="group flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-sm font-bold text-primary">
              {dev.display_name.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium group-hover:text-primary transition-colors">{dev.display_name}</p>
              {dev.is_verified && (
                <Badge variant="info" className="mt-0.5"><Shield className="h-2.5 w-2.5" />Verified</Badge>
              )}
            </div>
          </Link>
        </Card>
      )}
    </>
  );
}
