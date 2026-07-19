import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";

// ── Environment variable validation ──────────────────────────────────────────
// These MUST be set in Vercel Dashboard → Settings → Environment Variables.
// They are NOT deployed from .env.local (which is gitignored).
function getSupabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    const missing = [!url && "NEXT_PUBLIC_SUPABASE_URL", !key && "NEXT_PUBLIC_SUPABASE_ANON_KEY"]
      .filter(Boolean)
      .join(", ");
    throw new Error(
      `[Supabase] Missing environment variable(s): ${missing}. ` +
      `Add them to Vercel Dashboard → Settings → Environment Variables.`
    );
  }
  return { url, key };
}

export async function createClient() {
  const { url: supabaseUrl, key: supabaseKey } = getSupabaseConfig();
  const cookieStore = await cookies();

  return createServerClient<any>(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // Called from Server Component — middleware handles refresh
        }
      },
    },
  });
}
