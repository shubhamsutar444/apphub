import { DashboardShell } from "@/components/layout/dashboard-shell";
import { requireRole } from "@/lib/auth/guards";
import { createAdminClient } from "@/lib/supabase/admin";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, Globe, Download, Package } from "lucide-react";

export default async function AdminDevelopersPage() {
  const user = await requireRole("admin");
  const adminClient = createAdminClient();

  const { data: developers } = await adminClient
    .from("developers")
    .select(`
      *,
      users:user_id(email, full_name, is_verified)
    `)
    .order("created_at", { ascending: false })
    .limit(100);

  return (
    <DashboardShell role={user.profile.role}>
      <div>
        <div className="flex items-center gap-3">
          <Shield className="h-7 w-7 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">Developers</h1>
            <p className="mt-1 text-secondary-400">
              {developers?.length ?? 0} registered developers
            </p>
          </div>
        </div>

        <Card className="mt-8 overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10 bg-white/3">
                  {["Developer", "Email", "Apps", "Downloads", "Verified", "Joined"].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-secondary-400">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {developers && developers.length > 0 ? (
                  developers.map((dev) => (
                    <tr key={dev.id} className="border-b border-white/5 text-sm hover:bg-white/3">
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-sm font-bold text-primary">
                            {dev.display_name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-medium">{dev.display_name}</span>
                              {dev.is_verified && (
                                <Shield className="h-3.5 w-3.5 text-accent" />
                              )}
                            </div>
                            {dev.website && (
                              <a
                                href={dev.website}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1 text-xs text-primary hover:underline"
                              >
                                <Globe className="h-3 w-3" />
                                {dev.website.replace(/^https?:\/\//, "")}
                              </a>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-secondary-400 text-xs">
                        {(dev.users as { email: string } | null)?.email}
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-1 text-secondary-300">
                          <Package className="h-3.5 w-3.5" />
                          {dev.total_apps}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-1 text-secondary-300">
                          <Download className="h-3.5 w-3.5" />
                          {(dev.total_downloads ?? 0).toLocaleString()}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <Badge variant={dev.is_verified ? "info" : "secondary"}>
                          {dev.is_verified ? "Verified" : "Unverified"}
                        </Badge>
                      </td>
                      <td className="px-4 py-4 text-secondary-400 text-xs">
                        {new Date(dev.created_at).toLocaleDateString("en-IN")}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-secondary-500">
                      No developers found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </DashboardShell>
  );
}
