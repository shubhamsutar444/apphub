import { createBrowserClient } from "@supabase/ssr";

// Fix: extract clean URL in case it got duplicated in Vercel env vars
function cleanUrl(raw: string | undefined): string {
  if (!raw) return "";
  const match = raw.match(/https?:\/\/[a-zA-Z0-9\-]+\.supabase\.co/);
  return match ? match[0] : raw.trim();
}

const SUPABASE_URL = cleanUrl(process.env.NEXT_PUBLIC_SUPABASE_URL);
const SUPABASE_KEY = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "").trim();

export function createClient() {
  return createBrowserClient<any>(SUPABASE_URL, SUPABASE_KEY);
}
