import { createBrowserClient } from "@supabase/ssr";
import type { UserProfile } from "@/types";

// ── Environment variable validation ──────────────────────────────────────────
// These MUST be set in Vercel Dashboard → Settings → Environment Variables.
// They are NOT deployed from .env.local (which is gitignored).
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  // Surface a clear error instead of silently using stale/dead fallback credentials
  const missing = [
    !SUPABASE_URL && "NEXT_PUBLIC_SUPABASE_URL",
    !SUPABASE_KEY && "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  ]
    .filter(Boolean)
    .join(", ");
  throw new Error(
    `[Supabase] Missing environment variable(s): ${missing}. ` +
    `Add them to Vercel Dashboard → Settings → Environment Variables.`
  );
}

// ── Singleton browser client ──────────────────────────────────────────────────
let _client: ReturnType<typeof createBrowserClient> | null = null;

export function createClient() {
  if (!_client) {
    // TypeScript: SUPABASE_URL and SUPABASE_KEY are guaranteed non-empty after the guard above
    _client = createBrowserClient<any>(SUPABASE_URL!, SUPABASE_KEY!);
  }
  return _client;
}

// ── Cached user profile ───────────────────────────────────────────────────────
// Avoids 2 separate Supabase calls on every page load.
// Profile is fetched once and shared between Header + UserNav.

let _cachedProfile: UserProfile | null | undefined = undefined; // undefined = not loaded yet

export async function getCachedProfile(): Promise<UserProfile | null> {
  // Already loaded (even if null = logged out)
  if (_cachedProfile !== undefined) return _cachedProfile;

  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    _cachedProfile = null;
    return null;
  }

  const { data } = await supabase
    .from("users")
    .select("*")
    .eq("id", user.id)
    .single<UserProfile>();

  _cachedProfile = data ?? null;
  return _cachedProfile;
}

export function clearProfileCache() {
  _cachedProfile = undefined;
  _client = null;
}
