import { createClient } from "@/lib/supabase/server";
import type { AuthUser, UserProfile } from "@/types";

export async function getCurrentUser(): Promise<AuthUser | null> {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) return null;

  const { data: profile, error: profileError } = await supabase
    .from("users")
    .select("*")
    .eq("id", user.id)
    .single<UserProfile>();

  if (profileError || !profile) return null;

  return {
    id: user.id,
    email: user.email ?? profile.email,
    profile,
  };
}

export async function getCurrentUserRole(): Promise<UserProfile["role"] | null> {
  const user = await getCurrentUser();
  return user?.profile.role ?? null;
}
