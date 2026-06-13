import { Suspense } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import { Hero } from "@/components/marketing/hero";
import {
  StatsSection,
  FeaturedSection,
  TrendingAppsSection,
  CategoriesSection,
  PublishingPlansSection,
  TestimonialsSection,
  FAQSection,
  CTASection,
} from "@/components/marketing/sections";
import { createClient } from "@/lib/supabase/server";
import type { Application, Category } from "@/types";

// No page transition wrapper on homepage — faster first paint
async function getHomeData() {
  const supabase = await createClient();
  const [{ data: featuredApps }, { data: trendingApps }, { data: categories }] =
    await Promise.all([
      supabase
        .from("applications")
        .select("id,name,slug,short_description,icon_url,rating_avg,download_count,is_featured,is_editors_choice,categories:category_id(name),developers:developer_id(display_name,slug)")
        .eq("status", "approved")
        .eq("is_featured", true)
        .order("published_at", { ascending: false })
        .limit(8),
      supabase
        .from("applications")
        .select("id,name,slug,short_description,icon_url,rating_avg,download_count,categories:category_id(name),developers:developer_id(display_name,slug)")
        .eq("status", "approved")
        .order("download_count", { ascending: false })
        .limit(6),
      supabase
        .from("categories")
        .select("*")
        .eq("is_active", true)
        .order("sort_order")
        .limit(12),
    ]);

  return {
    featuredApps: (featuredApps ?? []) as unknown as Application[],
    trendingApps: (trendingApps ?? []) as unknown as Application[],
    categories: (categories ?? []) as unknown as Category[],
  };
}

export default async function HomePage() {
  const { featuredApps, trendingApps, categories } = await getHomeData();

  return (
    <MainLayout>
      <Hero />

      <Suspense fallback={null}>
        <StatsSection />
      </Suspense>

      {/* Only show sections if there is real data */}
      {featuredApps.length > 0 && (
        <FeaturedSection apps={featuredApps} />
      )}

      {trendingApps.length > 0 && (
        <TrendingAppsSection apps={trendingApps} />
      )}

      <CategoriesSection categories={categories.length > 0 ? categories : undefined} />
      <PublishingPlansSection />
      <TestimonialsSection />
      <FAQSection />
      <CTASection />
    </MainLayout>
  );
}
