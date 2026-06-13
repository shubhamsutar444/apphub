"use client";

import { useState } from "react";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface StarRatingProps {
  value?: number;
  onChange?: (rating: number) => void;
  readonly?: boolean;
  size?: "sm" | "md" | "lg";
}

const sizeClasses = {
  sm: "h-3.5 w-3.5",
  md: "h-5 w-5",
  lg: "h-6 w-6",
};

export function StarRating({ value = 0, onChange, readonly = false, size = "md" }: StarRatingProps) {
  const [hovered, setHovered] = useState(0);
  const displayValue = hovered || value;

  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={readonly}
          onClick={() => onChange?.(star)}
          onMouseEnter={() => !readonly && setHovered(star)}
          onMouseLeave={() => !readonly && setHovered(0)}
          className={cn(
            "transition-transform",
            !readonly && "cursor-pointer hover:scale-110 active:scale-95",
            readonly && "cursor-default"
          )}
        >
          <Star
            className={cn(
              sizeClasses[size],
              "transition-colors",
              star <= displayValue ? "fill-yellow-400 text-yellow-400" : "fill-none text-secondary-600"
            )}
          />
        </button>
      ))}
    </div>
  );
}

export function RatingDisplay({ rating, count }: { rating: number; count: number }) {
  return (
    <div className="flex items-center gap-2">
      <StarRating value={Math.round(rating)} readonly size="sm" />
      <span className="text-sm font-medium text-yellow-400">
        {rating > 0 ? rating.toFixed(1) : "No ratings"}
      </span>
      {count > 0 && (
        <span className="text-sm text-secondary-400">({count.toLocaleString()})</span>
      )}
    </div>
  );
}
