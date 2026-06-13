import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { canAccessAdminDashboard, canAccessDeveloperDashboard } from "@/lib/auth/roles";

export async function requireAuth() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return user;
}

export async function requireRole(allowed: "user" | "developer" | "admin") {
  const user = await requireAuth();

  if (allowed === "admin" && !canAccessAdminDashboard(user.profile.role)) {
    redirect("/dashboard/user");
  }

  if (allowed === "developer" && !canAccessDeveloperDashboard(user.profile.role)) {
    redirect("/dashboard/user");
  }

  // "user" pages are accessible to all authenticated users (user, developer, admin)
  return user;
}
