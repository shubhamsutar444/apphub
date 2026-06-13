"use client";

import { useState } from "react";
import Link from "next/link";
import { Loader2, Mail, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";
import { ROUTES } from "@/lib/constants/routes";

type Step = "form" | "otp";

export function SignupForm() {
  const [step, setStep] = useState<Step>("form");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  // ── Step 1: Submit signup form ────────────────────────────────────────
  const handleSignup = async (e: React.FormEvent) => {
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
      // Sign up — Supabase will send OTP email automatically
      const { error: authError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: { full_name: fullName.trim() },
          // Use OTP flow, not magic link
          emailRedirectTo: undefined,
        },
      });

      if (authError) {
        setError(authError.message);
        setLoading(false);
        return;
      }

      setStep("otp");
      startResendCooldown();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Signup failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // ── Step 2: Verify OTP ────────────────────────────────────────────────
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (otp.length !== 6) { setError("Please enter the 6-digit code"); return; }

    setLoading(true);
    try {
      const supabase = createClient();
      const { error: verifyError } = await supabase.auth.verifyOtp({
        email: email.trim(),
        token: otp.trim(),
        type: "signup",
      });

      if (verifyError) {
        setError(verifyError.message);
        setLoading(false);
        return;
      }

      // Success — redirect to user dashboard
      window.location.href = "/dashboard/user";
    } catch (err) {
      setError(err instanceof Error ? err.message : "Verification failed. Please try again.");
      setLoading(false);
    }
  };

  // ── Resend OTP ────────────────────────────────────────────────────────
  const handleResend = async () => {
    if (resendCooldown > 0) return;
    setError("");
    setLoading(true);
    try {
      const supabase = createClient();
      await supabase.auth.resend({ type: "signup", email: email.trim() });
      startResendCooldown();
    } catch {
      setError("Failed to resend. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const startResendCooldown = () => {
    setResendCooldown(60);
    const interval = setInterval(() => {
      setResendCooldown((prev) => {
        if (prev <= 1) { clearInterval(interval); return 0; }
        return prev - 1;
      });
    }, 1000);
  };

  // ── OTP step UI ───────────────────────────────────────────────────────
  if (step === "otp") {
    return (
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/15 ring-2 ring-primary/30">
            <Mail className="h-8 w-8 text-primary" />
          </div>
          <h2 className="mt-4 text-xl font-bold font-heading">Check your email</h2>
          <p className="mt-2 text-sm text-secondary-400">
            We sent a 6-digit verification code to
          </p>
          <p className="mt-1 font-semibold text-primary">{email}</p>
        </div>

        {error && (
          <div className="mb-4 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
            {error}
          </div>
        )}

        <form onSubmit={handleVerifyOtp} className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-center">
              Enter 6-digit OTP
            </label>
            <Input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              placeholder="123456"
              maxLength={6}
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
              className="text-center text-2xl font-bold tracking-[0.5em] py-4"
              autoFocus
              required
            />
          </div>

          <Button type="submit" className="w-full" disabled={loading || otp.length !== 6}>
            {loading ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> Verifying...</>
            ) : (
              <><ArrowRight className="h-4 w-4" /> Verify & Continue</>
            )}
          </Button>
        </form>

        <div className="mt-4 text-center">
          <p className="text-sm text-secondary-400">
            Didn&apos;t receive the code?{" "}
            <button
              type="button"
              onClick={handleResend}
              disabled={resendCooldown > 0 || loading}
              className="text-primary hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend OTP"}
            </button>
          </p>
          <button
            type="button"
            onClick={() => { setStep("form"); setError(""); setOtp(""); }}
            className="mt-2 text-xs text-secondary-500 hover:text-secondary-300"
          >
            ← Back to signup
          </button>
        </div>
      </motion.div>
    );
  }

  // ── Signup form UI ────────────────────────────────────────────────────
  return (
    <form onSubmit={handleSignup} className="mt-4 space-y-4">
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400"
          >
            {error}
          </motion.div>
        )}
      </AnimatePresence>

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
        {loading ? (
          <><Loader2 className="h-4 w-4 animate-spin" /> Sending OTP...</>
        ) : (
          "Create Account & Get OTP"
        )}
      </Button>

      <p className="text-center text-xs text-secondary-500">
        By signing up, you agree to our Terms of Service and Privacy Policy.
      </p>
      <p className="text-center text-sm text-secondary-400">
        Already have an account?{" "}
        <Link href={ROUTES.login} className="text-primary hover:underline">Sign in</Link>
      </p>
    </form>
  );
}
