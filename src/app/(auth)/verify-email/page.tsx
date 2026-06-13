import type { Metadata } from "next";
import { VerifyEmailContent } from "@/components/forms/verify-email-content";

export const metadata: Metadata = {
  title: "Verify Email",
};

interface VerifyEmailPageProps {
  searchParams: Promise<{ email?: string }>;
}

export default async function VerifyEmailPage({ searchParams }: VerifyEmailPageProps) {
  const params = await searchParams;

  return <VerifyEmailContent email={params.email} />;
}
