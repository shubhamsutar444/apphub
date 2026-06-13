export const APP_NAME = "AppHub";
export const APP_DESCRIPTION =
  "Discover, publish, and grow amazing Android apps. Install trusted applications and publish your own affordably.";

export const ROUTES = {
  home: "/",
  marketplace: "/marketplace",
  login: "/login",
  signup: "/signup",
  forgotPassword: "/forgot-password",
  resetPassword: "/reset-password",
  verifyEmail: "/verify-email",
  dashboard: {
    user: "/dashboard/user",
    developer: "/dashboard/developer",
    admin: "/dashboard/admin",
  },
} as const;

export const NAV_LINKS = [
  { href: ROUTES.marketplace, label: "Browse Apps" },
  { href: "/categories", label: "Categories" },
  { href: "/developers", label: "Developers" },
  { href: "/about", label: "About" },
] as const;

export const MOBILE_NAV_LINKS = [
  { href: ROUTES.home, label: "Home", icon: "home" as const },
  { href: ROUTES.marketplace, label: "Apps", icon: "grid" as const },
  { href: "/publish", label: "Publish", icon: "upload" as const },
  { href: ROUTES.login, label: "Account", icon: "user" as const },
] as const;
