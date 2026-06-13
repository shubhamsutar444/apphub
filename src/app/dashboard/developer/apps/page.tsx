import Link from "next/link";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { requireRole } from "@/lib/auth/guards";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import { Plus, Package, Download, Star, ExternalLink } from "lucide-react";
import { AppActionsClient } from "@/components/apps/app-actions-client";

export default async function DeveloperAppsPage() {
  const user = await requireRole("developer");
  const supabase = await createClient();

  const { data: developer } = await supabase
    .from("developers")
    .select("id")
    .eq("user_id", user.id)
    .single();

  const { data: apps } = await supabase
    .from("applications")
    .select(`*, categories:category_id(name)`)
    .eq("developer_id", developer?.id ?? "")
    .order("created_at", { ascending: false });

  const statusVariants: Record<string, "default" | "warning" | "success" | "danger" | "secondary" | "info"> = {
    approved: "success",
    pending_review: "warning",
    rejected: "danger",
    changes_requested: "warning",
    draft: "secondary",
    archived: "secondary",
  };

  const statusLabels: Record<string, string> = {
    approved: "Live",
    pending_review: "Pending Review",
    rejected: "Rejected",
    changes_requested: "Changes Needed",
    draft: "Draft",
    archived: "Archived",
  };

  return (
    <DashboardShell role={user.profile.role}>
      <div>
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">My Apps</h1>
            <p className="mt-2 text-secondary-400">
              {apps?.length ?? 0} app{apps?.length !== 1 ? "s" : ""} submitted
            </p>
          </div>
          <Link href="/dashboard/developer/apps/new">
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Submit App
            </Button>
          </Link>
        </div>

        {!developer ? (
          <Card className="mt-8 py-12 text-center">
            <Package className="mx-auto h-12 w-12 text-secondary-600" />
            <h3 className="mt-4 text-lg font-semibold">No Developer Profile</h3>
            <p className="mt-2 text-secondary-400">Set up your developer profile to submit apps.</p>
            <Link href="/dashboard/developer/profile" className="mt-4 inline-block">
              <Button>Create Profile</Button>
            </Link>
          </Card>
        ) : !apps || apps.length === 0 ? (
          <Card className="mt-8 py-16 text-center">
            <Package className="mx-auto h-16 w-16 text-secondary-600" />
            <h3 className="mt-4 text-xl font-semibold">No apps yet</h3>
            <p className="mt-2 text-secondary-400 max-w-sm mx-auto">
              Submit your first Android app and reach thousands of users.
            </p>
            <Link href="/dashboard/developer/apps/new" className="mt-6 inline-block">
              <Button>Submit Your First App</Button>
            </Link>
          </Card>
        ) : (
          <div className="mt-8 space-y-4">
            {apps.map((app) => (
              <Card key={app.id} className="group">
                <div className="flex items-start gap-4">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 text-2xl ring-1 ring-white/10">
                    📱
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-semibold">{app.name}</h3>
                      <Badge variant={statusVariants[app.status] ?? "secondary"}>
                        {statusLabels[app.status] ?? app.status}
                      </Badge>
                      {(app.categories as { name: string } | null) && (
                        <Badge variant="secondary" className="text-xs">
                          {(app.categories as { name: string }).name}
                        </Badge>
                      )}
                    </div>
                    <p className="mt-1 line-clamp-1 text-sm text-secondary-400">
                      {app.short_description}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-4 text-xs text-secondary-500">
                      <span className="flex items-center gap-1">
                        <Download className="h-3.5 w-3.5" />
                        {app.download_count?.toLocaleString()} downloads
                      </span>
                      <span className="flex items-center gap-1">
                        <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                        {app.rating_avg > 0 ? app.rating_avg.toFixed(1) : "No ratings"}
                        {app.rating_count > 0 && ` (${app.rating_count})`}
                      </span>
                      {app.current_version && (
                        <span>v{app.current_version}</span>
                      )}
                    </div>

                    {/* Rejection / Changes info */}
                    {app.status === "rejected" && app.rejection_reason && (
                      <div className="mt-2 rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs text-red-400">
                        <strong>Rejection reason:</strong> {app.rejection_reason}
                      </div>
                    )}
                    {app.status === "changes_requested" && app.admin_notes && (
                      <div className="mt-2 rounded-lg border border-yellow-500/20 bg-yellow-500/10 px-3 py-2 text-xs text-yellow-400">
                        <strong>Changes requested:</strong> {app.admin_notes}
                      </div>
                    )}
                  </div>

                  <div className="flex shrink-0 items-center gap-2">
                    {app.status === "approved" && (
                      <Link
                        href={`/apps/${app.slug}`}
                        target="_blank"
                        className="hidden group-hover:flex items-center gap-1 text-xs text-secondary-400 hover:text-primary"
                      >
                        <ExternalLink className="h-4 w-4" />
                        View
                      </Link>
                    )}
                    <Link href={`/dashboard/developer/apps/${app.id}/edit`}>
                      <Button variant="secondary" size="sm">Edit</Button>
                    </Link>
                    <AppActionsClient appId={app.id} appName={app.name} />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
