import Link from "next/link";
import Image from "next/image";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { requireRole } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Heart, Download, Star } from "lucide-react";
import type { Favorite } from "@/types";
import { FavoriteToggleButton } from "@/components/apps/favorite-toggle-button";

export default async function FavoritesPage() {
  const user = await requireRole("user");
  const supabase = await createClient();

  const { data: favorites } = await supabase
    .from("favorites")
    .select(`
      *,
      applications:application_id(
        id, name, slug, short_description, icon_url,
        rating_avg, download_count, status,
        categories:category_id(name),
        developers:developer_id(display_name)
      )
    `)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <DashboardShell role={user.profile.role}>
      <div>
        <div className="flex items-center gap-3">
          <Heart className="h-7 w-7 text-red-400" />
          <div>
            <h1 className="text-3xl font-bold">Favorites</h1>
            <p className="mt-1 text-secondary-400">
              {favorites?.length ?? 0} saved app{favorites?.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>

        {!favorites || favorites.length === 0 ? (
          <Card className="mt-8 py-16 text-center">
            <Heart className="mx-auto h-14 w-14 text-secondary-600" />
            <h3 className="mt-4 text-lg font-semibold">No favorites yet</h3>
            <p className="mt-2 text-secondary-400">
              Tap the heart on any app to save it here.
            </p>
            <Link href="/marketplace" className="mt-6 inline-block">
              <button className="btn-primary">Browse Apps</button>
            </Link>
          </Card>
        ) : (
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {(favorites as Favorite[]).map((fav) => {
              const app = fav.applications as NonNullable<Favorite["applications"]>;
              if (!app) return null;
              return (
                <Card key={fav.id} className="group">
                  <div className="flex items-start gap-3">
                    <Link href={`/apps/${app.slug}`} className="flex items-start gap-3 flex-1 min-w-0">
                      <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 ring-1 ring-white/10">
                        {app.icon_url ? (
                          <Image src={app.icon_url} alt={app.name} fill className="object-cover" sizes="56px" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-2xl">📱</div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-semibold group-hover:text-primary transition-colors">
                          {app.name}
                        </p>
                        <p className="truncate text-xs text-secondary-400">
                          {(app.developers as { display_name: string } | null)?.display_name}
                        </p>
                        <div className="mt-1 flex items-center gap-3 text-xs text-secondary-500">
                          <span className="flex items-center gap-1 text-yellow-400">
                            <Star className="h-3 w-3 fill-yellow-400" />
                            {app.rating_avg > 0 ? app.rating_avg.toFixed(1) : "New"}
                          </span>
                          <span className="flex items-center gap-1">
                            <Download className="h-3 w-3" />
                            {((app.download_count ?? 0) / 1000).toFixed(0)}K
                          </span>
                        </div>
                      </div>
                    </Link>
                    <FavoriteToggleButton appId={app.id} isFavorited={true} />
                  </div>
                  {(app.categories as { name: string } | null) && (
                    <div className="mt-3">
                      <Badge variant="secondary">
                        {(app.categories as { name: string }).name}
                      </Badge>
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
