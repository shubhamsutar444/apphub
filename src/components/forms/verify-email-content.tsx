"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Mail, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { resendVerificationAction, type AuthActionState } from "@/lib/actions/auth";
import { ROUTES } from "@/lib/constants/routes";

const initialState: AuthActionState = {};

interface VerifyEmailContentProps {
  email?: string;
}

export function VerifyEmailContent({ email }: VerifyEmailContentProps) {
  const [state, formAction, pending] = useActionState(resendVerificationAction, initialState);

  return (
    <div className="text-center">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
        <Mail className="h-8 w-8 text-primary" />
      </div>
      <h1 className="mt-6 text-2xl font-bold">Check your email</h1>
      <p className="mt-3 text-sm text-secondary-400">
        {email ? (
          <>
            We sent a verification link to{" "}
            <span className="font-medium text-white">{email}</span>
          </>
        ) : (
          "We sent a verification link to your email address"
        )}
      </p>

      {state.success && (
        <div className="mt-4 rounded-xl border border-primary/20 bg-primary/10 px-4 py-3 text-sm text-primary">
          {state.success}
        </div>
      )}

      {state.error && (
        <div className="mt-4 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {state.error}
        </div>
      )}

      <form action={formAction} className="mt-6">
        {email && <input type="hidden" name="email" value={email} />}
        <Button type="submit" variant="secondary" disabled={pending || !email}>
          {pending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Sending...
            </>
          ) : (
            "Resend verification email"
          )}
        </Button>
      </form>

      <p className="mt-6 text-sm text-secondary-400">
        Already verified?{" "}
        <Link href={ROUTES.login} className="text-primary hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
