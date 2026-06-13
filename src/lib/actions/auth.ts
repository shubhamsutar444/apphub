"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  forgotPasswordSchema,
  loginSchema,
  profileSchema,
  resetPasswordSchema,
  signupSchema,
} from "@/lib/validations/auth";
import { getDefaultDashboardPath } from "@/lib/auth/roles";
import type { UserProfile } from "@/types";

export type AuthActionState = {
  error?: string;
  success?: string;
};

const ADMIN_EMAIL = "shubhamsutar81981@gmail.com";

// Helper — converts any error to a user-friendly string
function toErrorMessage(err: unknown): string {
  if (err instanceof Error) {
    // "fetch failed" → clearer message
    if (err.message.includes("fetch failed") || err.message.includes("ENOTFOUND")) {
      return "Cannot connect to the server. Please check your internet connection and try again.";
    }
    if (err.message.includes("Missing Supabase")) {
      return "Server configuration error. Please contact support.";
    }
    return err.message;
  }
  return "An unexpected error occurred. Please try again.";
}

export async function loginAction(
  _prevState: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message ?? "Invalid input" };
  }

  try {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.signInWithPassword(parsed.data);

    if (error) {
      return { error: error.message };
    }

    // Auto-promote admin email
    if (parsed.data.email.toLowerCase() === ADMIN_EMAIL) {
      try {
        const adminClient = createAdminClient();
        await adminClient
          .from("users")
          .update({ role: "admin" })
          .eq("id", data.user.id)
          .neq("role", "admin");
      } catch {
        // Non-critical — continue login even if promotion fails
      }
    }

    const redirectTo = formData.get("redirectTo")?.toString();
    if (redirectTo && redirectTo.startsWith("/") && !redirectTo.startsWith("//")) {
      redirect(redirectTo);
    }

    const { data: profile } = await supabase
      .from("users")
      .select("role")
      .eq("id", data.user.id)
      .single<Pick<UserProfile, "role">>();

    redirect(getDefaultDashboardPath(profile?.role ?? "user"));
  } catch (err) {
    // redirect() throws — re-throw it
    if ((err as { digest?: string }).digest?.startsWith("NEXT_REDIRECT")) throw err;
    return { error: toErrorMessage(err) };
  }
}

export async function signupAction(
  _prevState: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const parsed = signupSchema.safeParse({
    fullName: formData.get("fullName"),
    email: formData.get("email"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message ?? "Invalid input" };
  }

  try {
    const supabase = await createClient();
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3001";

    const { error } = await supabase.auth.signUp({
      email: parsed.data.email,
      password: parsed.data.password,
      options: {
        data: { full_name: parsed.data.fullName },
        emailRedirectTo: `${appUrl}/auth/callback?next=/dashboard/user`,
      },
    });

    if (error) {
      return { error: error.message };
    }

    redirect("/verify-email?email=" + encodeURIComponent(parsed.data.email));
  } catch (err) {
    if ((err as { digest?: string }).digest?.startsWith("NEXT_REDIRECT")) throw err;
    return { error: toErrorMessage(err) };
  }
}

export async function forgotPasswordAction(
  _prevState: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const parsed = forgotPasswordSchema.safeParse({
    email: formData.get("email"),
  });

  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message ?? "Invalid input" };
  }

  try {
    const supabase = await createClient();
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3001";

    const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
      redirectTo: `${appUrl}/auth/callback?next=/reset-password`,
    });

    if (error) return { error: error.message };

    return { success: "Check your email for a password reset link." };
  } catch (err) {
    return { error: toErrorMessage(err) };
  }
}

export async function resetPasswordAction(
  _prevState: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const parsed = resetPasswordSchema.safeParse({
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message ?? "Invalid input" };
  }

  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
    if (error) return { error: error.message };
    redirect("/login?message=Password updated successfully");
  } catch (err) {
    if ((err as { digest?: string }).digest?.startsWith("NEXT_REDIRECT")) throw err;
    return { error: toErrorMessage(err) };
  }
}

export async function logoutAction(): Promise<void> {
  try {
    const supabase = await createClient();
    await supabase.auth.signOut();
  } catch {
    // Ignore errors on logout
  }
  redirect("/login");
}

export async function updateProfileAction(
  _prevState: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const parsed = profileSchema.safeParse({
    fullName: formData.get("fullName"),
    theme: formData.get("theme"),
  });

  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message ?? "Invalid input" };
  }

  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "You must be signed in" };

    const { error } = await supabase
      .from("users")
      .update({ full_name: parsed.data.fullName, theme: parsed.data.theme })
      .eq("id", user.id);

    if (error) return { error: error.message };
    return { success: "Profile updated successfully" };
  } catch (err) {
    return { error: toErrorMessage(err) };
  }
}

export async function resendVerificationAction(
  _prevState: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const email = formData.get("email")?.toString();
  if (!email) return { error: "Email is required" };

  try {
    const supabase = await createClient();
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3001";

    const { error } = await supabase.auth.resend({
      type: "signup",
      email,
      options: {
        emailRedirectTo: `${appUrl}/auth/callback?next=/dashboard/user`,
      },
    });

    if (error) return { error: error.message };
    return { success: "Verification email sent." };
  } catch (err) {
    return { error: toErrorMessage(err) };
  }
}
