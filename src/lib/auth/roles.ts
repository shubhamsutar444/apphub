import type { UserRole } from "@/types";

export const ROLE_HIERARCHY: Record<UserRole, number> = {
  user: 1,
  developer: 2,
  admin: 3,
};

export function hasMinimumRole(userRole: UserRole, requiredRole: UserRole): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole];
}

export function canAccessDeveloperDashboard(role: UserRole): boolean {
  return hasMinimumRole(role, "developer");
}

export function canAccessAdminDashboard(role: UserRole): boolean {
  return role === "admin";
}

export function getDefaultDashboardPath(role: UserRole): string {
  switch (role) {
    case "admin":
      return "/dashboard/admin";
    case "developer":
      return "/dashboard/developer";
    default:
      return "/dashboard/user";
  }
}
