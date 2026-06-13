import Link from "next/link";
import { MainLayout } from "@/components/layout/main-layout";
import { PageTransition } from "@/components/shared/page-transition";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";
import type { Category } from "@/types";

export default async function CategoriesPage() {
  const supabase = await createClient();

  const { data: categories } = await supabase
    .from("categories")
    .select("*")
    .eq("is_active", true)
    .order("sort_order");

  const typedCategories = (categories ?? []) as Category[];

  return (
    <MainLayout>
      <PageTransition>
        <div className="section-container py-12">
          <h1 className="text-3xl font-bold">App Categories</h1>
          <p className="mt-2 text-secondary-400">
            Browse apps by category to find exactly what you need
          </p>

          <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {typedCategories.map((cat) => (
              <Link key={cat.id} href={`/marketplace?category=${cat.slug}`}>
                <Card hover className="group cursor-pointer text-center transition-all">
                  <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-3xl transition-transform group-hover:scale-110">
                    {cat.icon ?? "📱"}
                  </div>
                  <p className="font-semibold text-white">{cat.name}</p>
                  {cat.description && (
                    <p className="mt-1 text-xs text-secondary-500 line-clamp-2">
                      {cat.description}
                    </p>
                  )}
                </Card>
              </Link>
            ))}

            {typedCategories.length === 0 &&
              // Fallback static categories if DB is empty
              [
                { name: "Games", icon: "🎮", slug: "games" },
                { name: "Productivity", icon: "📋", slug: "productivity" },
                { name: "Social", icon: "💬", slug: "social" },
                { name: "Music", icon: "🎵", slug: "music" },
                { name: "Photography", icon: "📷", slug: "photography" },
                { name: "Tools", icon: "🔧", slug: "tools" },
                { name: "Education", icon: "📚", slug: "education" },
                { name: "Finance", icon: "💰", slug: "finance" },
                { name: "Health", icon: "❤️", slug: "health" },
                { name: "Shopping", icon: "🛍️", slug: "shopping" },
                { name: "Travel", icon: "✈️", slug: "travel" },
                { name: "News", icon: "📰", slug: "news" },
              ].map((cat) => (
                <Link key={cat.slug} href={`/marketplace?category=${cat.slug}`}>
                  <Card hover className="group cursor-pointer text-center">
                    <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-3xl transition-transform group-hover:scale-110">
                      {cat.icon}
                    </div>
                    <p className="font-semibold text-white">{cat.name}</p>
                  </Card>
                </Link>
              ))}
          </div>
        </div>
      </PageTransition>
    </MainLayout>
  );
}
