import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import {
  canAccessAdminDashboard,
  canAccessDeveloperDashboard,
  getDefaultDashboardPath,
} from "@/lib/auth/roles";
import type { UserRole } from "@/types";

const AUTH_ROUTES = ["/login", "/signup", "/forgot-password"];
const PROTECTED_PREFIX = "/dashboard";

function isAuthRoute(pathname: string): boolean {
  return AUTH_ROUTES.some((route) => pathname === route || pathname.startsWith(`${route}/`));
}

function isProtectedRoute(pathname: string): boolean {
  return pathname === PROTECTED_PREFIX || pathname.startsWith(`${PROTECTED_PREFIX}/`);
}

export async function updateSession(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.next({ request });
  }

  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        );
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  // Redirect authenticated users away from auth pages
  if (user && isAuthRoute(pathname)) {
    const { data: profile } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single<{ role: UserRole }>();

    const url = request.nextUrl.clone();
    url.pathname = getDefaultDashboardPath(profile?.role ?? "user");
    return NextResponse.redirect(url);
  }

  // Protect dashboard routes
  if (isProtectedRoute(pathname)) {
    if (!user) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("redirectTo", pathname);
      return NextResponse.redirect(url);
    }

    const { data: profile } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single<{ role: UserRole }>();

    const role = profile?.role ?? "user";

    if (pathname.startsWith("/dashboard/admin") && !canAccessAdminDashboard(role)) {
      const url = request.nextUrl.clone();
      url.pathname = getDefaultDashboardPath(role);
      return NextResponse.redirect(url);
    }

    if (
      pathname.startsWith("/dashboard/developer") &&
      !canAccessDeveloperDashboard(role)
    ) {
      const url = request.nextUrl.clone();
      url.pathname = "/dashboard/user";
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}
