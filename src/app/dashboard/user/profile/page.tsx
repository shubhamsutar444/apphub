import { DashboardShell } from "@/components/layout/dashboard-shell";
import { ProfileForm } from "@/components/forms/profile-form";
import { requireRole } from "@/lib/auth/guards";
import { Card } from "@/components/ui/card";

export default async function ProfilePage() {
  const user = await requireRole("user");

  return (
    <DashboardShell role={user.profile.role}>
      <div>
        <h1 className="text-3xl font-bold">Profile Settings</h1>
        <p className="mt-2 text-secondary-400">Manage your account information</p>

        <Card className="mt-8 max-w-lg">
          <ProfileForm profile={user.profile} />
        </Card>
      </div>
    </DashboardShell>
  );
}
