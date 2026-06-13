import Link from "next/link";
import { MainLayout } from "@/components/layout/main-layout";
import { PageTransition } from "@/components/shared/page-transition";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";
import { Shield, Package, Download, Globe, ArrowRight } from "lucide-react";
import type { DeveloperProfile } from "@/types";

export default async function DevelopersPage() {
  const supabase = await createClient();

  const { data: developers } = await supabase
    .from("developers")
    .select("*")
    .order("total_downloads", { ascending: false })
    .limit(50);

  const typedDevs = (developers ?? []) as DeveloperProfile[];

  return (
    <MainLayout>
      <PageTransition>
        <div className="section-container py-12">
          <div className="mb-10 text-center">
            <h1 className="text-3xl font-bold">App Developers</h1>
            <p className="mt-2 text-secondary-400">
              Meet the talented developers building for AppHub
            </p>
          </div>

          {typedDevs.length === 0 ? (
            <Card className="py-16 text-center">
              <Shield className="mx-auto h-12 w-12 text-secondary-600" />
              <h3 className="mt-4 text-lg font-semibold">No developers yet</h3>
              <p className="mt-2 text-secondary-400">Be the first to publish on AppHub!</p>
              <Link href="/signup" className="mt-6 inline-block">
                <button className="btn-primary">Become a Developer</button>
              </Link>
            </Card>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {typedDevs.map((dev) => (
                <Link key={dev.id} href={`/developers/${dev.slug}`}>
                  <Card hover className="group cursor-pointer h-full">
                    <div className="flex items-start gap-4">
                      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-xl font-bold text-primary ring-1 ring-primary/20">
                        {dev.display_name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="truncate font-semibold group-hover:text-primary transition-colors">
                            {dev.display_name}
                          </h3>
                          {dev.is_verified && (
                            <Shield className="h-4 w-4 shrink-0 text-accent" />
                          )}
                        </div>
                        {dev.bio && (
                          <p className="mt-1 text-xs text-secondary-400 line-clamp-2">
                            {dev.bio}
                          </p>
                        )}
                        <div className="mt-2 flex flex-wrap gap-3 text-xs text-secondary-500">
                          <span className="flex items-center gap-1">
                            <Package className="h-3 w-3" />
                            {dev.total_apps} apps
                          </span>
                          <span className="flex items-center gap-1">
                            <Download className="h-3 w-3" />
                            {(dev.total_downloads ?? 0).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                    {dev.website && (
                      <div className="mt-3 flex items-center gap-1 text-xs text-primary">
                        <Globe className="h-3 w-3" />
                        <span className="truncate">{dev.website.replace(/^https?:\/\//, "")}</span>
                      </div>
                    )}
                    <div className="mt-3 flex items-center justify-end text-xs text-primary opacity-0 transition-opacity group-hover:opacity-100">
                      View Apps <ArrowRight className="ml-1 h-3 w-3" />
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      </PageTransition>
    </MainLayout>
  );
}
