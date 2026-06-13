import Link from "next/link";
import Image from "next/image";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { requireRole } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";
import { Star, MessageSquare } from "lucide-react";
import { StarRating } from "@/components/apps/star-rating";

export default async function ReviewsPage() {
  const user = await requireRole("user");
  const supabase = await createClient();

  const { data: reviews } = await supabase
    .from("reviews")
    .select(`
      *,
      applications:application_id(id, name, slug, icon_url, developers:developer_id(display_name))
    `)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <DashboardShell role={user.profile.role}>
      <div>
        <div className="flex items-center gap-3">
          <Star className="h-7 w-7 text-yellow-400" />
          <div>
            <h1 className="text-3xl font-bold">My Reviews</h1>
            <p className="mt-1 text-secondary-400">
              {reviews?.length ?? 0} review{reviews?.length !== 1 ? "s" : ""} written
            </p>
          </div>
        </div>

        {!reviews || reviews.length === 0 ? (
          <Card className="mt-8 py-16 text-center">
            <MessageSquare className="mx-auto h-14 w-14 text-secondary-600" />
            <h3 className="mt-4 text-lg font-semibold">No reviews yet</h3>
            <p className="mt-2 text-secondary-400">
              Download and review apps to share your experience.
            </p>
            <Link href="/marketplace" className="mt-6 inline-block">
              <button className="btn-primary">Browse Apps</button>
            </Link>
          </Card>
        ) : (
          <div className="mt-8 space-y-4">
            {reviews.map((review) => {
              const app = review.applications as {
                name: string;
                slug: string;
                icon_url: string | null;
                developers: { display_name: string } | null;
              } | null;
              return (
                <Card key={review.id}>
                  <div className="flex items-start gap-4">
                    {app && (
                      <Link href={`/apps/${app.slug}`}>
                        <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 ring-1 ring-white/10">
                          {app.icon_url ? (
                            <Image src={app.icon_url} alt={app.name} fill className="object-cover" sizes="48px" />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-xl">📱</div>
                          )}
                        </div>
                      </Link>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          {app && (
                            <Link href={`/apps/${app.slug}`}>
                              <p className="font-semibold hover:text-primary transition-colors">
                                {app.name}
                              </p>
                              <p className="text-xs text-secondary-500">
                                {app.developers?.display_name}
                              </p>
                            </Link>
                          )}
                          <div className="mt-2">
                            <StarRating value={review.rating} readonly size="sm" />
                          </div>
                        </div>
                        <span className="shrink-0 text-xs text-secondary-500">
                          {new Date(review.created_at).toLocaleDateString("en-IN")}
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
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
