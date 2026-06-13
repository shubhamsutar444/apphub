import { Suspense } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import { PageTransition } from "@/components/shared/page-transition";
import { AppCard } from "@/components/apps/app-card";
import { AppFilters } from "@/components/apps/app-filters";
import { SkeletonCard } from "@/components/ui/skeleton";
import { createClient } from "@/lib/supabase/server";
import type { Application, Category } from "@/types";
import { Package } from "lucide-react";

interface MarketplacePageProps {
  searchParams: Promise<{
    q?: string;
    category?: string;
    sort?: string;
    rating?: string;
    page?: string;
  }>;
}

async function getApps(params: {
  q?: string;
  category?: string;
  sort?: string;
  rating?: string;
  page?: string;
}) {
  const supabase = await createClient();
  const pageNum = parseInt(params.page ?? "1");
  const perPage = 24;
  const from = (pageNum - 1) * perPage;
  const to = from + perPage - 1;

  let query = supabase
    .from("applications")
    .select(`
      *,
      categories:category_id (*),
      developers:developer_id (display_name, slug, is_verified)
    `, { count: "exact" })
    .eq("status", "approved")
    .range(from, to);

  if (params.q) {
    query = query.or(`name.ilike.%${params.q}%,short_description.ilike.%${params.q}%`);
  }

  if (params.category) {
    const { data: cat } = await supabase
      .from("categories")
      .select("id")
      .eq("slug", params.category)
      .single();
    if (cat) query = query.eq("category_id", cat.id);
  }

  if (params.rating) {
    query = query.gte("rating_avg", parseInt(params.rating));
  }

  switch (params.sort) {
    case "downloads":
      query = query.order("download_count", { ascending: false });
      break;
    case "rating":
      query = query.order("rating_avg", { ascending: false });
      break;
    case "name":
      query = query.order("name", { ascending: true });
      break;
    default:
      query = query.order("published_at", { ascending: false, nullsFirst: false });
  }

  const { data, count, error } = await query;
  return { apps: (data ?? []) as Application[], total: count ?? 0, error };
}

async function getCategories() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("categories")
    .select("*")
    .eq("is_active", true)
    .order("sort_order");
  return (data ?? []) as Category[];
}

async function MarketplaceContent({
  searchParams,
}: {
  searchParams: {
    q?: string;
    category?: string;
    sort?: string;
    rating?: string;
    page?: string;
  };
}) {
  const [{ apps, total }, categories] = await Promise.all([
    getApps(searchParams),
    getCategories(),
  ]);

  return (
    <>
      <AppFilters categories={categories} />

      <div className="mt-4 flex items-center justify-between">
        <p className="text-sm text-secondary-400">
          {total > 0
            ? `Showing ${apps.length} of ${total.toLocaleString()} apps`
            : "No apps found"}
        </p>
      </div>

      {apps.length === 0 ? (
        <div className="mt-20 flex flex-col items-center justify-center text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-primary/10">
            <Package className="h-10 w-10 text-primary/60" />
          </div>
          <h3 className="mt-4 text-lg font-semibold">No apps found</h3>
          <p className="mt-2 text-secondary-400">
            Try adjusting your search or filters
          </p>
        </div>
      ) : (
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {apps.map((app, i) => (
            <AppCard key={app.id} app={app} index={i} />
          ))}
        </div>
      )}
    </>
  );
}

export default async function MarketplacePage({ searchParams }: MarketplacePageProps) {
  const params = await searchParams;

  return (
    <MainLayout>
      <PageTransition>
        <div className="section-container py-12">
          <div className="mb-8">
            <h1 className="text-3xl font-bold">Browse Apps</h1>
            <p className="mt-2 text-secondary-400">
              Discover and download trusted Android applications
            </p>
          </div>

          <Suspense
            fallback={
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {Array.from({ length: 12 }).map((_, i) => (
                  <SkeletonCard key={i} />
                ))}
              </div>
            }
          >
            <MarketplaceContent searchParams={params} />
          </Suspense>
        </div>
      </PageTransition>
    </MainLayout>
  );
}
