"use client";

// This file is automatically used by Next.js App Router when an
// unhandled error is thrown in a route segment.
// Must be a client component.

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Route error:", error);
  }, [error]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-8">
      <div className="max-w-md w-full text-center space-y-6">
        {/* RooVibe-flavored error state — consistent with the app aesthetic */}
        <div className="space-y-2">
          <p className="text-5xl font-bold tracking-tight">✦</p>
          <h1 className="text-2xl font-bold tracking-tight">
            Something broke the vibe
          </h1>
          <p className="text-muted-foreground text-sm">
            {error.message || "An unexpected error occurred. We're on it."}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button onClick={reset} variant="outline">
            Try again
          </Button>
          <Button >
            <a href="/feed">Back to feed</a>
          </Button>
        </div>

        {/* Show digest in development for debugging */}
        {process.env.NODE_ENV === "development" && error.digest && (
          <p className="text-xs text-muted-foreground font-mono">
            Error ID: {error.digest}
          </p>
        )}
      </div>
    </div>
  );
}