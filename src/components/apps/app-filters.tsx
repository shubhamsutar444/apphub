"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useTransition } from "react";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import type { Category } from "@/types";

interface AppFiltersProps {
  categories: Category[];
}

export function AppFilters({ categories }: AppFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const updateParams = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      params.delete("page");
      startTransition(() => {
        router.push(`/marketplace?${params.toString()}`);
      });
    },
    [router, searchParams]
  );

  const clearAll = () => {
    startTransition(() => {
      router.push("/marketplace");
    });
  };

  const hasFilters =
    searchParams.has("q") ||
    searchParams.has("category") ||
    searchParams.has("sort") ||
    searchParams.has("rating");

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-secondary-400" />
        <Input
          type="search"
          placeholder="Search apps..."
          className="pl-11"
          defaultValue={searchParams.get("q") ?? ""}
          onChange={(e) => updateParams("q", e.target.value)}
        />
      </div>

      {/* Filters row */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 text-sm text-secondary-400">
          <SlidersHorizontal className="h-4 w-4" />
          Filters:
        </div>

        <Select
          className="w-auto min-w-[140px]"
          value={searchParams.get("category") ?? ""}
          onChange={(e) => updateParams("category", e.target.value)}
        >
          <option value="">All Categories</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.slug}>
              {cat.name}
            </option>
          ))}
        </Select>

        <Select
          className="w-auto min-w-[140px]"
          value={searchParams.get("sort") ?? ""}
          onChange={(e) => updateParams("sort", e.target.value)}
        >
          <option value="">Sort: Newest</option>
          <option value="downloads">Most Downloaded</option>
          <option value="rating">Highest Rated</option>
          <option value="name">A-Z</option>
        </Select>

        <Select
          className="w-auto min-w-[130px]"
          value={searchParams.get("rating") ?? ""}
          onChange={(e) => updateParams("rating", e.target.value)}
        >
          <option value="">Any Rating</option>
          <option value="4">4+ Stars</option>
          <option value="3">3+ Stars</option>
        </Select>

        {hasFilters && (
          <Button variant="ghost" size="sm" onClick={clearAll} className="gap-1">
            <X className="h-3 w-3" />
            Clear
          </Button>
        )}

        {isPending && (
          <span className="text-xs text-secondary-500 animate-pulse">Searching...</span>
        )}
      </div>
    </div>
  );
}
