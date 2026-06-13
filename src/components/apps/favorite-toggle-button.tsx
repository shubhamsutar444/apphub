"use client";

import { useState } from "react";
import { Heart } from "lucide-react";
import { toggleFavoriteAction } from "@/lib/actions/apps";

interface FavoriteToggleButtonProps {
  appId: string;
  isFavorited: boolean;
}

export function FavoriteToggleButton({ appId, isFavorited: initial }: FavoriteToggleButtonProps) {
  const [favorited, setFavorited] = useState(initial);

  const handleToggle = async () => {
    setFavorited(!favorited);
    await toggleFavoriteAction(appId);
  };

  return (
    <button
      type="button"
      onClick={handleToggle}
      className="shrink-0 rounded-lg p-1.5 transition-colors hover:bg-red-500/10"
      title={favorited ? "Remove from favorites" : "Add to favorites"}
    >
      <Heart
        className={`h-5 w-5 transition-colors ${
          favorited ? "fill-red-400 text-red-400" : "text-secondary-500"
        }`}
      />
    </button>
  );
}
