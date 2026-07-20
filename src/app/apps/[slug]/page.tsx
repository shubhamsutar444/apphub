import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { MainLayout } from "@/components/layout/main-layout";
import { PageTransition } from "@/components/shared/page-transition";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth/session";
import { AppDetailClient } from "@/components/apps/app-detail-client";
import { RatingDisplay } from "@/components/apps/star-rating";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import type { Application, ApplicationVersion, ApplicationScreenshot, Review } from "@/types";
import {
  Download,
  Globe,
  Shield,
  ExternalLink,
  Calendar,
  Package,
  Star,
  ArrowLeft,
} from "lucide-react";

interface AppPageProps {
  params: Promise<{ slug: string }>;
}

// ── Dynamic Open Graph metadata ───────────────────────────────────────────────
// Makes sharing on WhatsApp, Telegram, Twitter show a rich preview card
export async function generateMetadata({ params }: AppPageProps): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: app } = await supabase
    .from("applications")
    .select("name, short_description, icon_url, banner_url, rating_avg, download_count")
    .eq("slug", slug)
    .eq("status", "approved")
    .single();

  if (!app) {
    return { title: "App Not Found" };
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://apphub-k384-git-main-shubhamsutar444s-projects.vercel.app";
  const pageUrl = `${appUrl}/apps/${slug}`;
  const image = app.banner_url || app.icon_url || `${appUrl}/og-default.png`;

  return {
    title: `${app.name} — AppHub`,
    description: app.short_description,
    openGraph: {
      title: `${app.name} — Download on AppHub`,
      description: `${app.short_description} · ★ ${app.rating_avg > 0 ? app.rating_avg.toFixed(1) : "New"} · ${app.download_count?.toLocaleString()} downloads`,
      url: pageUrl,
      type: "website",
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
  if (mb < 1) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${mb.toFixed(1)} MB`;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-IN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default async function AppDetailPage({ params }: AppPageProps) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: app } = await supabase
    .from("applications")
    .select(`
      *,
      categories:category_id (*),
      developers:developer_id (*)
    `)
    .eq("slug", slug)
    .eq("status", "approved")
    .single();

  if (!app) notFound();

  const typedApp = app as unknown as Application;

  const [
    { data: versions },
    { data: screenshots },
    { data: reviews },
    user,
  ] = await Promise.all([
    supabase
      .from("application_versions")
      .select("*")
      .eq("application_id", typedApp.id)
      .eq("is_active", true)
      .order("created_at", { ascending: false }),
    supabase
      .from("application_screenshots")
      .select("*")
      .eq("application_id", typedApp.id)
      .order("sort_order"),
    supabase
      .from("reviews")
      .select("*, users:user_id (full_name, avatar_url)")
      .eq("application_id", typedApp.id)
      .order("created_at", { ascending: false })
      .limit(10),
    getCurrentUser(),
  ]);

  const latestVersion = versions?.[0] as ApplicationVersion | undefined;

  // Check if user has favorited
  let isFavorited = false;
  let userReview = null;
  if (user) {
    const { data: fav } = await supabase
      .from("favorites")
      .select("id")
      .eq("user_id", user.id)
      .eq("application_id", typedApp.id)
      .single();
    isFavorited = !!fav;

    const { data: rev } = await supabase
      .from("reviews")
      .select("*")
      .eq("user_id", user.id)
      .eq("application_id", typedApp.id)
      .single();
    userReview = rev;
  }

  const typedReviews = (reviews ?? []) as Review[];
  const ratingBreakdown = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: typedReviews.filter((r) => r.rating === star).length,
    percentage: typedApp.rating_count > 0
      ? (typedReviews.filter((r) => r.rating === star).length / typedApp.rating_count) * 100
      : 0,
  }));

  return (
    <MainLayout>
      <PageTransition>
        <div className="section-container py-8">
          <Link
            href="/marketplace"
            className="inline-flex items-center gap-2 text-sm text-secondary-400 hover:text-white transition-colors mb-6"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Marketplace
          </Link>

          {/* Banner */}
          {typedApp.banner_url && (
            <div className="relative mb-6 h-48 w-full overflow-hidden rounded-2xl sm:h-64">
              <Image
                src={typedApp.banner_url}
                alt={`${typedApp.name} banner`}
                fill
                className="object-cover"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-t from-secondary-950/60 to-transparent" />
            </div>
          )}

          <div className="grid gap-8 lg:grid-cols-3">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-8">
              {/* Header */}
              <div className="flex items-start gap-5">
                <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-3xl bg-gradient-to-br from-primary/20 to-accent/20 ring-2 ring-white/10">
                  {typedApp.icon_url ? (
                    <Image
                      src={typedApp.icon_url}
                      alt={typedApp.name}
                      fill
                      className="object-cover"
                      sizes="96px"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-4xl">📱</div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h1 className="text-2xl font-bold sm:text-3xl">{typedApp.name}</h1>
                    {typedApp.is_editors_choice && (
                      <Badge variant="info">
                        <Shield className="h-3 w-3" />
                        Editor&apos;s Choice
                      </Badge>
                    )}
                    {typedApp.is_featured && (
                      <Badge variant="default">Featured</Badge>
                    )}
                  </div>
                  {typedApp.developers && (
                    <Link
                      href={`/developers/${(typedApp.developers as { slug: string }).slug}`}
                      className="mt-1 text-sm text-primary hover:underline"
                    >
                      {(typedApp.developers as { display_name: string }).display_name}
                    </Link>
                  )}
                  <div className="mt-2">
                    <RatingDisplay
                      rating={typedApp.rating_avg}
                      count={typedApp.rating_count}
                    />
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2 text-sm text-secondary-400">
                    <span className="flex items-center gap-1">
                      <Download className="h-3.5 w-3.5" />
                      {typedApp.download_count.toLocaleString()} downloads
                    </span>
                    {typedApp.categories && (
                      <span>{(typedApp.categories as { name: string }).name}</span>
                    )}
                    {typedApp.current_version && (
                      <span>v{typedApp.current_version}</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Client-side interactions (download, favorite, review) */}
              <AppDetailClient
                app={typedApp}
                latestVersion={latestVersion}
                user={user}
                isFavorited={isFavorited}
                userReview={userReview}
              />

              {/* Screenshots */}
              {screenshots && screenshots.length > 0 && (
                <Card>
                  <h2 className="mb-4 text-lg font-semibold">Screenshots</h2>
                  <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                    {(screenshots as ApplicationScreenshot[]).map((ss) => (
                      <div
                        key={ss.id}
                        className="relative h-48 w-28 shrink-0 overflow-hidden rounded-xl ring-1 ring-white/10 sm:h-56 sm:w-32"
                      >
                        <Image
                          src={ss.url}
                          alt="Screenshot"
                          fill
                          className="object-cover"
                          sizes="128px"
                        />
                      </div>
                    ))}
                  </div>
                </Card>
              )}

              {/* Description */}
              <Card>
                <h2 className="mb-4 text-lg font-semibold">About this app</h2>
                <div className="prose prose-sm prose-invert max-w-none">
                  <p className="whitespace-pre-wrap text-sm leading-relaxed text-secondary-300">
                    {typedApp.full_description}
                  </p>
                </div>
                {typedApp.tags && typedApp.tags.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {typedApp.tags.map((tag) => (
                      <Badge key={tag} variant="secondary">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}
              </Card>

              {/* Version History */}
              {versions && versions.length > 0 && (
                <Card>
                  <h2 className="mb-4 text-lg font-semibold">What&apos;s New</h2>
                  {(versions as ApplicationVersion[]).slice(0, 3).map((v) => (
                    <div key={v.id} className="mb-4 last:mb-0">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">v{v.version}</span>
                        <span className="text-xs text-secondary-500">
                          {formatDate(v.created_at)}
                        </span>
                      </div>
                      {v.changelog && (
                        <p className="mt-1 text-sm text-secondary-400 whitespace-pre-wrap">
                          {v.changelog}
                        </p>
                      )}
                    </div>
                  ))}
                </Card>
              )}

              {/* Reviews */}
              <Card>
                <div className="mb-6 flex items-center justify-between">
                  <h2 className="text-lg font-semibold">Ratings & Reviews</h2>
                  <div className="text-right">
                    <div className="text-3xl font-bold text-yellow-400">
                      {typedApp.rating_avg > 0 ? typedApp.rating_avg.toFixed(1) : "—"}
                    </div>
                    <div className="text-xs text-secondary-500">
                      {typedApp.rating_count} ratings
                    </div>
                  </div>
                </div>

                {/* Rating bars */}
                <div className="mb-6 space-y-2">
                  {ratingBreakdown.map(({ star, percentage }) => (
                    <div key={star} className="flex items-center gap-3">
                      <span className="w-3 text-xs text-secondary-400">{star}</span>
                      <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                      <div className="flex-1 h-2 rounded-full bg-white/10 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-yellow-400 transition-all"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Review list */}
                {reviews && reviews.length > 0 ? (
                  <div className="space-y-4">
                    {(reviews as (Review & { users?: { full_name: string | null; avatar_url: string | null } })[]).map((review) => (
                      <div key={review.id} className="border-t border-white/5 pt-4">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="text-sm font-medium">
                              {review.users?.full_name ?? "Anonymous"}
                            </p>
                            <RatingDisplay rating={review.rating} count={0} />
                          </div>
                          <span className="shrink-0 text-xs text-secondary-500">
                            {formatDate(review.created_at)}
                          </span>
                        </div>
                        {review.title && (
                          <p className="mt-2 text-sm font-medium">{review.title}</p>
                        )}
                        {review.body && (
                          <p className="mt-1 text-sm text-secondary-400 leading-relaxed">
                            {review.body}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-secondary-500">
                    No reviews yet. Be the first to review!
                  </p>
                )}
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-4">
              <Card>
                <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-secondary-400">
                  App Info
                </h3>
                <div className="space-y-3">
                  {[
                    { icon: Package, label: "Version", value: typedApp.current_version ?? "—" },
                    {
                      icon: Download,
                      label: "Size",
                      value: formatBytes(typedApp.apk_size_bytes),
                    },
                    {
                      icon: Calendar,
                      label: "Updated",
                      value: typedApp.updated_at ? formatDate(typedApp.updated_at) : "—",
                    },
                    {
                      icon: Star,
                      label: "Downloads",
                      value: typedApp.download_count.toLocaleString(),
                    },
                  ].map(({ icon: Icon, label, value }) => (
                    <div key={label} className="flex items-center justify-between">
                      <span className="flex items-center gap-2 text-sm text-secondary-400">
                        <Icon className="h-4 w-4" />
                        {label}
                      </span>
                      <span className="text-sm font-medium">{value}</span>
                    </div>
                  ))}
                </div>

                {/* Links */}
                <div className="mt-4 space-y-2 border-t border-white/5 pt-4">
                  {typedApp.developer_website && (
                    <a
                      href={typedApp.developer_website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm text-primary hover:underline"
                    >
                      <Globe className="h-4 w-4" />
                      Developer Website
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                  {typedApp.privacy_policy_url && (
                    <a
                      href={typedApp.privacy_policy_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm text-secondary-400 hover:text-white"
                    >
                      <Shield className="h-4 w-4" />
                      Privacy Policy
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>
              </Card>

              {typedApp.developers && (
                <Card>
                  <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-secondary-400">
                    Developer
                  </h3>
                  <Link
                    href={`/developers/${(typedApp.developers as { slug: string }).slug}`}
                    className="group flex items-center gap-3"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-sm font-bold text-primary">
                      {(typedApp.developers as { display_name: string }).display_name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium group-hover:text-primary transition-colors">
                        {(typedApp.developers as { display_name: string }).display_name}
                      </p>
                      {(typedApp.developers as { is_verified: boolean }).is_verified && (
                        <Badge variant="info" className="mt-0.5">
                          <Shield className="h-2.5 w-2.5" />
                          Verified
                        </Badge>
                      )}
                    </div>
                  </Link>
                </Card>
              )}
            </div>
          </div>
        </div>
      </PageTransition>
    </MainLayout>
  );
}
