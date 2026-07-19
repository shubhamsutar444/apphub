import { createBrowserClient } from "@supabase/ssr";
import type { UserProfile } from "@/types";

const FALLBACK_URL = "https://lsluxdheynctqkewlvmu.supabase.co";
const FALLBACK_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxzbHV4ZGhleW5jdHFrZXdsdm11Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc3MjExMDUsImV4cCI6MjA5MzI5NzEwNX0.Z-zXIbRE3NpNiEe9dfMt_xaNG2KYImi63E5QrWnGr0Q";

function cleanUrl(raw: string | undefined): string {
  if (!raw) return FALLBACK_URL;
  const match = raw.match(/https?:\/\/[a-zA-Z0-9\-]+\.supabase\.co/);
  return match ? match[0] : (raw.trim() || FALLBACK_URL);
}

const SUPABASE_URL = cleanUrl(process.env.NEXT_PUBLIC_SUPABASE_URL);
const SUPABASE_KEY = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "").trim() || FALLBACK_KEY;

// ── Singleton browser client ──────────────────────────────────────────────────
let _client: ReturnType<typeof createBrowserClient> | null = null;

export function createClient() {
  if (!_client) {
    _client = createBrowserClient<any>(SUPABASE_URL, SUPABASE_KEY);
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
