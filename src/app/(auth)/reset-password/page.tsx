import type { Metadata } from "next";
import { ResetPasswordForm } from "@/components/forms/reset-password-form";

export const metadata: Metadata = {
  title: "Reset Password",
};

export default function ResetPasswordPage() {
  return (
    <>
      <h1 className="text-2xl font-bold">Set a new password</h1>
      <p className="mt-2 text-sm text-secondary-400">
        Choose a strong password for your account
      </p>
      <ResetPasswordForm />
    </>
  );
}
