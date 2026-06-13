"use client";

import { useActionState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { signupAction, type AuthActionState } from "@/lib/actions/auth";
import { signupSchema, type SignupInput } from "@/lib/validations/auth";
import { ROUTES } from "@/lib/constants/routes";
import { cn } from "@/lib/utils/cn";

const initialState: AuthActionState = {};

export function SignupForm() {
  const [state, formAction, pending] = useActionState(signupAction, initialState);

  const {
    register,
    formState: { errors },
  } = useForm<SignupInput>({
    resolver: zodResolver(signupSchema),
  });

  return (
    <form action={formAction} className="mt-8 space-y-4">
      {(state.error ||
        errors.fullName?.message ||
        errors.email?.message ||
        errors.password?.message ||
        errors.confirmPassword?.message) && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {state.error ??
            errors.fullName?.message ??
            errors.email?.message ??
            errors.password?.message ??
            errors.confirmPassword?.message}
        </div>
      )}

      <div>
        <label htmlFor="fullName" className="mb-2 block text-sm font-medium">
          Full Name
        </label>
        <Input
          id="fullName"
          type="text"
          placeholder="John Doe"
          autoComplete="name"
          {...register("fullName")}
          className={cn(errors.fullName && "border-red-500/50")}
        />
      </div>

      <div>
        <label htmlFor="email" className="mb-2 block text-sm font-medium">
          Email
        </label>
        <Input
          id="email"
          type="email"
          placeholder="you@example.com"
          autoComplete="email"
          {...register("email")}
          className={cn(errors.email && "border-red-500/50")}
        />
      </div>

      <div>
        <label htmlFor="password" className="mb-2 block text-sm font-medium">
          Password
        </label>
        <Input
          id="password"
          type="password"
          placeholder="••••••••"
          autoComplete="new-password"
          {...register("password")}
          className={cn(errors.password && "border-red-500/50")}
        />
      </div>

      <div>
        <label htmlFor="confirmPassword" className="mb-2 block text-sm font-medium">
          Confirm Password
        </label>
        <Input
          id="confirmPassword"
          type="password"
          placeholder="••••••••"
          autoComplete="new-password"
          {...register("confirmPassword")}
          className={cn(errors.confirmPassword && "border-red-500/50")}
        />
      </div>

      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Creating account...
          </>
        ) : (
          "Create Account"
        )}
      </Button>

      <p className="text-center text-xs text-secondary-500">
        By signing up, you agree to our Terms of Service and Privacy Policy.
      </p>

      <p className="text-center text-sm text-secondary-400">
        Already have an account?{" "}
        <Link href={ROUTES.login} className="text-primary hover:underline">
          Sign in
        </Link>
      </p>
    </form>
  );
}
