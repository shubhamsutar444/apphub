import type { Metadata } from "next";
import Link from "next/link";
import { LoginForm } from "@/components/forms/login-form";
import { ROUTES } from "@/lib/constants/routes";

export const metadata: Metadata = {
  title: "Sign In",
};

interface LoginPageProps {
  searchParams: Promise<{ redirectTo?: string; message?: string; error?: string }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const message =
    params.message ??
    (params.error === "auth_callback_failed"
      ? "Authentication failed. Please try again."
      : undefined);

  return (
    <>
      <h1 className="text-2xl font-bold">Welcome back</h1>
      <p className="mt-2 text-sm text-secondary-400">
        Sign in to your AppHub account
      </p>
      <LoginForm redirectTo={params.redirectTo} message={message} />
      <p className="mt-6 text-center text-sm text-secondary-400">
        Don&apos;t have an account?{" "}
        <Link href={ROUTES.signup} className="text-primary hover:underline">
          Sign up
        </Link>
      </p>
    </>
  );
}
