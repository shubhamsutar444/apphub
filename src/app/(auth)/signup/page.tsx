import type { Metadata } from "next";
import { SignupForm } from "@/components/forms/signup-form";

export const metadata: Metadata = {
  title: "Sign Up",
};

export default function SignupPage() {
  return (
    <>
      <h1 className="text-2xl font-bold">Create your account</h1>
      <p className="mt-2 text-sm text-secondary-400">
        Join AppHub to discover and publish Android apps
      </p>
      <SignupForm />
    </>
  );
}
