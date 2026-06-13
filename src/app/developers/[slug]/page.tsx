import { notFound } from "next/navigation";
import Link from "next/link";
import { MainLayout } from "@/components/layout/main-layout";
import { PageTransition } from "@/components/shared/page-transition";
import { createClient } from "@/lib/supabase/server";
import { AppCard } from "@/components/apps/app-card";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Globe, Shield, Package, Download } from "lucide-react";
import type { Application, DeveloperProfile } from "@/types";

interface DeveloperPageProps {
  params: Promise<{ slug: string }>;
}

export default async function DeveloperPage({ params }: DeveloperPageProps) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: developer } = await supabase
    .from("developers")
    .select("*")
    .eq("slug", slug)
    .single();

  if (!developer) notFound();

  const { data: apps } = await supabase
    .from("applications")
    .select(`*, categories:category_id(*), developers:developer_id(display_name, slug)`)
    .eq("developer_id", developer.id)
    .eq("status", "approved")
    .order("download_count", { ascending: false });

  const typedDev = developer as DeveloperProfile;
  const typedApps = (apps ?? []) as Application[];

  return (
    <MainLayout>
      <PageTransition>
        <div className="section-container py-10">
          <Link
            href="/marketplace"
            className="inline-flex items-center gap-2 text-sm text-secondary-400 hover:text-white transition-colors mb-8"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Marketplace
          </Link>

          {/* Developer Header */}
          <Card className="mb-8">
            <div className="flex items-start gap-5">
              <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-3xl font-bold text-primary ring-2 ring-primary/20">
                {typedDev.display_name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-2xl font-bold">{typedDev.display_name}</h1>
                  {typedDev.is_verified && (
                    <Badge variant="info">
                      <Shield className="h-3 w-3" />
                      Verified Developer
                    </Badge>
                  )}
                </div>
                {typedDev.bio && (
                  <p className="mt-2 text-secondary-400 max-w-2xl">{typedDev.bio}</p>
                )}
                <div className="mt-3 flex flex-wrap gap-4 text-sm text-secondary-400">
                  <span className="flex items-center gap-1.5">
                    <Package className="h-4 w-4" />
                    {typedApps.length} apps
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Download className="h-4 w-4" />
                    {(typedDev.total_downloads ?? 0).toLocaleString()} total downloads
                  </span>
                  {typedDev.website && (
                    <a
                      href={typedDev.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 text-primary hover:underline"
                    >
                      <Globe className="h-4 w-4" />
                      Website
                    </a>
                  )}
                </div>
              </div>
            </div>
          </Card>

          {/* Apps */}
          <h2 className="mb-6 text-xl font-semibold">
            Apps by {typedDev.display_name}
          </h2>

          {typedApps.length === 0 ? (
            <Card className="py-12 text-center">
              <Package className="mx-auto h-12 w-12 text-secondary-600" />
              <p className="mt-4 text-secondary-400">No published apps yet</p>
            </Card>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {typedApps.map((app, i) => (
                <AppCard key={app.id} app={app} index={i} />
              ))}
            </div>
          )}
        </div>
      </PageTransition>
    </MainLayout>
  );
}
