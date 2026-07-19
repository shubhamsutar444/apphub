import { createBrowserClient } from "@supabase/ssr";

// Correct Supabase project URL — used as fallback if env var is wrong/missing
const FALLBACK_URL = "https://lsluxdheynctqkewlvmu.supabase.co";
const FALLBACK_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxzbHV4ZGhleW5jdHFrZXdsdm11Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc3MjExMDUsImV4cCI6MjA5MzI5NzEwNX0.Z-zXIbRE3NpNiEe9dfMt_xaNG2KYImi63E5QrWnGr0Q";

function cleanUrl(raw: string | undefined): string {
  if (!raw) return FALLBACK_URL;
  // Extract clean URL — fixes accidentally doubled URLs like "https://x.cohttps://x.co"
  const match = raw.match(/https?:\/\/[a-zA-Z0-9\-]+\.supabase\.co/);
  if (match) return match[0];
  return raw.trim().replace(/\/$/, "") || FALLBACK_URL;
}

const SUPABASE_URL = cleanUrl(process.env.NEXT_PUBLIC_SUPABASE_URL);
const SUPABASE_KEY = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "").trim() || FALLBACK_KEY;

export function createClient() {
  return createBrowserClient<any>(SUPABASE_URL, SUPABASE_KEY);
}
