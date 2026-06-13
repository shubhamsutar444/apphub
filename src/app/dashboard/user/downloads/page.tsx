import Link from "next/link";
import Image from "next/image";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { requireRole } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";
import { Download, Package, ExternalLink } from "lucide-react";

export default async function DownloadsPage() {
  const user = await requireRole("user");
  const supabase = await createClient();

  const { data: downloads } = await supabase
    .from("downloads")
    .select(`
      id, created_at,
      applications:application_id(id, name, slug, icon_url, current_version, developers:developer_id(display_name))
    `)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(50);

  // Deduplicate by app id (show last download per app)
  const seen = new Set<string>();
  const uniqueDownloads = (downloads ?? []).filter((d) => {
    const app = d.applications as unknown as { id: string } | null;
    if (!app || seen.has(app.id)) return false;
    seen.add(app.id);
    return true;
  });

  return (
    <DashboardShell role={user.profile.role}>
      <div>
        <div className="flex items-center gap-3">
          <Download className="h-7 w-7 text-accent" />
          <div>
            <h1 className="text-3xl font-bold">Download History</h1>
            <p className="mt-1 text-secondary-400">
              {uniqueDownloads.length} app{uniqueDownloads.length !== 1 ? "s" : ""} downloaded
            </p>
          </div>
        </div>

        {uniqueDownloads.length === 0 ? (
          <Card className="mt-8 py-16 text-center">
            <Package className="mx-auto h-14 w-14 text-secondary-600" />
            <h3 className="mt-4 text-lg font-semibold">No downloads yet</h3>
            <p className="mt-2 text-secondary-400">
              Apps you download will appear here.
            </p>
            <Link href="/marketplace" className="mt-6 inline-block">
              <button className="btn-primary">Browse Apps</button>
            </Link>
          </Card>
        ) : (
          <div className="mt-8 space-y-3">
            {uniqueDownloads.map((dl) => {
              const app = dl.applications as unknown as {
                id: string;
                name: string;
                slug: string;
                icon_url: string | null;
                current_version: string | null;
                developers: { display_name: string } | null;
              } | null;
              if (!app) return null;
              return (
                <Card key={dl.id} className="group">
                  <div className="flex items-center gap-4">
                    <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 ring-1 ring-white/10">
                      {app.icon_url ? (
                        <Image src={app.icon_url} alt={app.name} fill className="object-cover" sizes="48px" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-xl">📱</div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium">{app.name}</p>
                      <p className="text-xs text-secondary-500">
                        {app.developers?.display_name} ·{" "}
                        {app.current_version ? `v${app.current_version}` : ""}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="hidden text-xs text-secondary-500 sm:block">
                        {new Date(dl.created_at).toLocaleDateString("en-IN")}
                      </span>
                      <Link href={`/apps/${app.slug}`}>
                        <button className="flex items-center gap-1.5 rounded-lg bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary transition-colors hover:bg-primary/20">
                          <ExternalLink className="h-3.5 w-3.5" />
                          View
                        </button>
                      </Link>
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
