"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createClient, clearProfileCache } from "@/lib/supabase/client";
import { ROUTES } from "@/lib/constants/routes";

interface LoginFormProps {
  redirectTo?: string;
  message?: string;
}

export function LoginForm({ redirectTo, message }: LoginFormProps) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [unverified, setUnverified] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setUnverified(false);
    setLoading(true);

    try {
      const supabase = createClient();
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (authError) {
        setError(authError.message);
        setLoading(false);
        return;
      }

      // ── Security: block unverified users ─────────────────────────────
      if (!data.user.email_confirmed_at) {
        await supabase.auth.signOut();
        setUnverified(true);
        setLoading(false);
        return;
      }

      // ── Auto-promote admin email ──────────────────────────────────────
      const ADMIN_EMAIL = "shubhamsutar81981@gmail.com";
      if (email.trim().toLowerCase() === ADMIN_EMAIL) {
        await supabase
          .from("users")
          .update({ role: "admin" })
          .eq("id", data.user.id)
          .eq("role", "user");
      }

      // ── Get role for redirect ─────────────────────────────────────────
      clearProfileCache();
      const { data: profile } = await supabase
        .from("users")
        .select("role")
        .eq("id", data.user.id)
        .single();

      const role = profile?.role ?? "user";
      const dest =
        redirectTo && redirectTo.startsWith("/") && !redirectTo.startsWith("//")
          ? redirectTo
          : role === "admin"
          ? "/dashboard/admin"
          : role === "developer"
          ? "/dashboard/developer"
          : "/dashboard/user";

      router.push(dest);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed. Please try again.");
      setLoading(false);
    }
  };

  // ── Unverified email screen ───────────────────────────────────────────
  if (unverified) {
    return (
      <div className="py-4 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-yellow-500/15 ring-2 ring-yellow-500/30">
          <Mail className="h-7 w-7 text-yellow-400" />
        </div>
        <h2 className="font-heading text-lg font-bold">Email not verified</h2>
        <p className="mt-2 text-sm text-secondary-400">
          Please check your inbox for the verification link we sent to
        </p>
        <p className="mt-1 font-semibold text-primary">{email}</p>
        <div className="mt-4 rounded-xl border border-yellow-500/20 bg-yellow-500/8 px-4 py-3 text-sm text-yellow-300">
          Click the verification link in your email, then come back to sign in.
        </div>
        <Button
          variant="secondary"
          className="mt-5 w-full"
          onClick={() => { setUnverified(false); setError(""); }}
        >
          Back to Sign In
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mt-8 space-y-4">
      {message && (
        <div className="rounded-xl border border-primary/20 bg-primary/10 px-4 py-3 text-sm text-primary">
          {message}
        </div>
      )}
      {error && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      <div>
        <label htmlFor="email" className="mb-2 block text-sm font-medium">Email</label>
        <Input id="email" type="email" placeholder="you@example.com" autoComplete="email"
          value={email} onChange={(e) => setEmail(e.target.value)} required />
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between">
          <label htmlFor="password" className="text-sm font-medium">Password</label>
          <Link href={ROUTES.forgotPassword} className="text-xs text-primary hover:underline">
            Forgot password?
          </Link>
        </div>
        <Input id="password" type="password" placeholder="••••••••" autoComplete="current-password"
          value={password} onChange={(e) => setPassword(e.target.value)} required />
      </div>

      <Button type="submit" className="w-full" disabled={loading}>
        {loading
          ? <><Loader2 className="h-4 w-4 animate-spin" /> Signing in...</>
          : "Sign In"}
      </Button>
    </form>
  );
}
