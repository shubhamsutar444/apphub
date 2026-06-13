import { DashboardShell } from "@/components/layout/dashboard-shell";
import { requireRole } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import { DeveloperProfileForm } from "@/components/forms/developer-profile-form";
import { Badge } from "@/components/ui/badge";
import { Shield } from "lucide-react";

export default async function DeveloperProfilePage() {
  const user = await requireRole("developer");
  const supabase = await createClient();

  const { data: developer } = await supabase
    .from("developers")
    .select("*")
    .eq("user_id", user.id)
    .single();

  return (
    <DashboardShell role={user.profile.role}>
      <div>
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold">Developer Profile</h1>
          {developer?.is_verified && (
            <Badge variant="info">
              <Shield className="h-3 w-3" />
              Verified
            </Badge>
          )}
        </div>
        <p className="mt-2 text-secondary-400">
          {developer ? "Manage your public developer profile" : "Set up your developer profile to start publishing apps"}
        </p>
        <div className="mt-8 max-w-2xl">
          <DeveloperProfileForm developer={developer} />
        </div>
      </div>
    </DashboardShell>
  );
}
