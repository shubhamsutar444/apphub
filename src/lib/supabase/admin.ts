import { createClient } from "@supabase/supabase-js";

const FALLBACK_URL = "https://lsluxdheynctqkewlvmu.supabase.co";
const FALLBACK_SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxzbHV4ZGhleW5jdHFrZXdsdm11Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NzcyMTEwNSwiZXhwIjoyMDkzMjk3MTA1fQ.1VGX9LCq3fAmXVzvQCVCi7YVoyXRH_X9vjXaxymWyOs";

function cleanUrl(raw: string | undefined): string {
  if (!raw) return FALLBACK_URL;
  const match = raw.match(/https?:\/\/[a-zA-Z0-9\-]+\.supabase\.co/);
  return match ? match[0] : (raw.trim() || FALLBACK_URL);
}

export function createAdminClient() {
  const url = cleanUrl(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const serviceRoleKey = (process.env.SUPABASE_SERVICE_ROLE_KEY ?? "").trim() || FALLBACK_SERVICE_KEY;

  return createClient<any>(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
