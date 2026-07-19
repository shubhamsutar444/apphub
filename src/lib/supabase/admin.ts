import { createClient } from "@supabase/supabase-js";

// ── Environment variable validation ──────────────────────────────────────────
// SUPABASE_SERVICE_ROLE_KEY must NEVER be exposed to the browser.
// Add it as a server-only env var in Vercel Dashboard (no NEXT_PUBLIC_ prefix).
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    const missing = [
      !url && "NEXT_PUBLIC_SUPABASE_URL",
      !serviceRoleKey && "SUPABASE_SERVICE_ROLE_KEY",
    ]
      .filter(Boolean)
      .join(", ");
    throw new Error(
      `[Supabase Admin] Missing environment variable(s): ${missing}. ` +
      `Add them to Vercel Dashboard → Settings → Environment Variables.`
    );
  }

  return createClient<any>(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
