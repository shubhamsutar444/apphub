"use client";

import { MainLayout } from "@/components/layout/main-layout";
import { PageTransition } from "@/components/shared/page-transition";

export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <MainLayout>
      <PageTransition>
        <div className="section-container flex min-h-[60vh] flex-col items-center justify-center text-center">
          <p className="text-6xl font-bold text-red-400">Error</p>
          <h1 className="mt-4 text-2xl font-bold">Something went wrong</h1>
          <p className="mt-2 max-w-md text-secondary-400">
            An unexpected error occurred. Please try again.
          </p>
          <button onClick={reset} className="btn-primary mt-8">
            Try Again
          </button>
        </div>
      </PageTransition>
    </MainLayout>
  );
}
