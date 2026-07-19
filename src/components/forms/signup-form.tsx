"use client";

import { useState } from "react";
import Link from "next/link";
import { Loader2, Mail, CheckCircle } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";
import { ROUTES } from "@/lib/constants/routes";

export function SignupForm() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (fullName.trim().length < 2) { setError("Name must be at least 2 characters"); return; }
    if (password.length < 8) { setError("Password must be at least 8 characters"); return; }
    if (!/[A-Z]/.test(password)) { setError("Password must include at least one uppercase letter"); return; }
    if (!/[0-9]/.test(password)) { setError("Password must include at least one number"); return; }
    if (password !== confirmPassword) { setError("Passwords do not match"); return; }

    setLoading(true);
    try {
      const supabase = createClient();
      const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? window.location.origin;

      const { error: authError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: { full_name: fullName.trim() },
          // Send verification link — user clicks it to confirm email
          emailRedirectTo: `${appUrl}/auth/callback?next=/dashboard/user`,
        },
      });

      if (authError) {
        setError(authError.message);
        setLoading(false);
        return;
      }

      // Show "check your email" screen
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Signup failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // ── Success screen ────────────────────────────────────────────────────
  if (done) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="py-4 text-center"
      >
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/15 ring-2 ring-primary/30">
          <Mail className="h-8 w-8 text-primary" />
        </div>
        <h2 className="font-heading text-xl font-bold">Verify your email</h2>
        <p className="mt-3 text-sm text-secondary-400">
          We sent a verification link to
        </p>
        <p className="mt-1 font-semibold text-primary">{email}</p>
        <div className="mt-5 rounded-xl border border-primary/15 bg-primary/5 px-4 py-3 text-sm text-secondary-300">
          <CheckCircle className="mb-1 inline h-4 w-4 text-primary" />{" "}
          Click the link in the email to activate your account.
          Then come back and sign in.
        </div>
        <p className="mt-5 text-sm text-secondary-500">
          Didn&apos;t receive it? Check spam or{" "}
          <button
            type="button"
            className="text-primary hover:underline"
            onClick={() => setDone(false)}
          >
            try again
          </button>
        </p>
        <Link href={ROUTES.login} className="mt-5 block">
          <Button variant="secondary" className="w-full">
            Go to Sign In
          </Button>
        </Link>
      </motion.div>
    );
  }

  // ── Signup form ───────────────────────────────────────────────────────
  return (
    <form onSubmit={handleSubmit} className="mt-4 space-y-4">
      {error && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      <div>
        <label htmlFor="fullName" className="mb-2 block text-sm font-medium">Full Name</label>
        <Input id="fullName" type="text" placeholder="John Doe" autoComplete="name"
          value={fullName} onChange={(e) => setFullName(e.target.value)} required />
      </div>

      <div>
        <label htmlFor="email" className="mb-2 block text-sm font-medium">Email</label>
        <Input id="email" type="email" placeholder="you@example.com" autoComplete="email"
          value={email} onChange={(e) => setEmail(e.target.value)} required />
      </div>

      <div>
        <label htmlFor="password" className="mb-2 block text-sm font-medium">Password</label>
        <Input id="password" type="password" placeholder="Min 8 chars, 1 uppercase, 1 number"
          autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
      </div>

      <div>
        <label htmlFor="confirmPassword" className="mb-2 block text-sm font-medium">Confirm Password</label>
        <Input id="confirmPassword" type="password" placeholder="••••••••"
          autoComplete="new-password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
      </div>

      <Button type="submit" className="w-full" disabled={loading}>
        {loading
          ? <><Loader2 className="h-4 w-4 animate-spin" /> Creating account...</>
          : "Create Account"}
      </Button>

      <p className="text-center text-xs text-secondary-500">
        By signing up you agree to our Terms of Service and Privacy Policy.
      </p>
      <p className="text-center text-sm text-secondary-400">
        Already have an account?{" "}
        <Link href={ROUTES.login} className="text-primary hover:underline">Sign in</Link>
      </p>
    </form>
  );
}
