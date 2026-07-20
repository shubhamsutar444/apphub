"use client";

import { useEffect } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import { PageTransition } from "@/components/shared/page-transition";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // ChunkLoadError = stale browser cache after a new deployment.
    // Auto hard-reload once so the user gets the fresh chunks silently.
    if (error?.name === "ChunkLoadError" || error?.message?.includes("Loading chunk")) {
      window.location.reload();
    }
  }, [error]);

  // Don't render anything if it's a chunk error — the reload will happen
  if (error?.name === "ChunkLoadError" || error?.message?.includes("Loading chunk")) {
    return null;
  }

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

