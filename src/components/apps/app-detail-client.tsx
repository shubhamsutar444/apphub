"use client";

import { useState, useActionState } from "react";
import { Download, Heart, Flag, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { StarRating } from "@/components/apps/star-rating";
import { toggleFavoriteAction, submitReviewAction, recordDownloadAction } from "@/lib/actions/apps";
import type { Application, ApplicationVersion, AuthUser, Review } from "@/types";

interface AppDetailClientProps {
  app: Application;
  latestVersion: ApplicationVersion | undefined;
  user: AuthUser | null;
  isFavorited: boolean;
  userReview: Review | null;
}

export function AppDetailClient({
  app,
  latestVersion,
  user,
  isFavorited: initialFavorited,
  userReview,
}: AppDetailClientProps) {
  const [favorited, setFavorited] = useState(initialFavorited);
  const [downloading, setDownloading] = useState(false);
  const [reviewRating, setReviewRating] = useState(userReview?.rating ?? 0);
  const [reviewState, reviewAction, reviewPending] = useActionState(submitReviewAction, {});

  const handleDownload = async () => {
    if (!latestVersion) return;
    setDownloading(true);
    await recordDownloadAction(app.id, latestVersion.id);
    window.open(latestVersion.apk_path, "_blank");
    setDownloading(false);
  };

  const handleFavorite = async () => {
    setFavorited(!favorited);
    await toggleFavoriteAction(app.id);
  };

  return (
    <div className="space-y-6">
      {/* Action Buttons */}
      <div className="flex flex-wrap items-center gap-3">
        <Button
          onClick={handleDownload}
          disabled={!latestVersion || downloading}
          size="lg"
          className="flex-1 sm:flex-none min-w-[160px]"
        >
          {downloading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Download className="h-4 w-4" />
          )}
          {downloading ? "Downloading..." : "Download APK"}
        </Button>

        {user && (
          <Button
            variant={favorited ? "primary" : "secondary"}
            size="lg"
            onClick={handleFavorite}
            className="gap-2"
          >
            <Heart className={`h-4 w-4 ${favorited ? "fill-current" : ""}`} />
            {favorited ? "Saved" : "Save"}
          </Button>
        )}

        <Button variant="ghost" size="lg" className="gap-2 text-red-400 hover:text-red-300">
          <Flag className="h-4 w-4" />
          Report
        </Button>
      </div>

      {!latestVersion && (
        <p className="text-sm text-yellow-400/80">
          No APK available for download yet.
        </p>
      )}

      {/* Write Review */}
      {user && (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <h3 className="mb-4 font-semibold">
            {userReview ? "Update Your Review" : "Write a Review"}
          </h3>

          {reviewState.success && (
            <div className="mb-4 rounded-xl border border-primary/20 bg-primary/10 px-4 py-3 text-sm text-primary">
              {reviewState.success}
            </div>
          )}
          {reviewState.error && (
            <div className="mb-4 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
              {reviewState.error}
            </div>
          )}

          <form action={reviewAction} className="space-y-4">
            <input type="hidden" name="application_id" value={app.id} />
            <input type="hidden" name="rating" value={reviewRating} />

            <div>
              <label className="mb-2 block text-sm font-medium">Your Rating</label>
              <StarRating
                value={reviewRating}
                onChange={setReviewRating}
                size="lg"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">Title (optional)</label>
              <Input
                name="title"
                placeholder="Summarize your experience"
                defaultValue={userReview?.title ?? ""}
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">Review (optional)</label>
              <Textarea
                name="body"
                placeholder="Share your detailed experience..."
                rows={4}
                defaultValue={userReview?.body ?? ""}
              />
            </div>

            <Button type="submit" disabled={reviewPending || reviewRating === 0}>
              {reviewPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : null}
              {userReview ? "Update Review" : "Submit Review"}
            </Button>
          </form>
        </div>
      )}

      {!user && (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-5 text-center">
          <p className="text-sm text-secondary-400">
            <a href="/login" className="text-primary hover:underline">Sign in</a>{" "}
            to rate and review this app
          </p>
        </div>
      )}
    </div>
  );
}
