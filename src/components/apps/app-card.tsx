"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { Star, Download, Shield, Zap, Crown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { Application } from "@/types";

interface AppCardProps {
  app: Application;
  index?: number;
}

const planIcons = {
  basic: null,
  priority: <Zap className="h-3 w-3" />,
  featured: <Crown className="h-3 w-3" />,
};

function formatDownloads(count: number): string {
  if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(1)}M`;
  if (count >= 1_000) return `${(count / 1_000).toFixed(1)}K`;
  return count.toString();
}

export function AppCard({ app, index = 0 }: AppCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.05, duration: 0.4 }}
    >
      <Link href={`/apps/${app.slug}`} className="block h-full">
        <div className="glass-card-hover group flex h-full flex-col">
          {/* Icon + Info */}
          <div className="flex items-start gap-4">
            <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 ring-1 ring-white/10">
              {app.icon_url ? (
                <Image
                  src={app.icon_url}
                  alt={app.name}
                  fill
                  className="object-cover"
                  sizes="64px"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-2xl">
                  📱
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="truncate font-semibold text-white transition-colors group-hover:text-primary">
                {app.name}
              </h3>
              <p className="truncate text-sm text-secondary-400">
                {app.developers?.display_name ?? "Unknown Developer"}
              </p>
              <div className="mt-1.5 flex items-center gap-3 text-xs text-secondary-400">
                <span className="flex items-center gap-1 text-yellow-400">
                  <Star className="h-3 w-3 fill-yellow-400" />
                  {app.rating_avg > 0 ? app.rating_avg.toFixed(1) : "New"}
                </span>
                <span className="flex items-center gap-1">
                  <Download className="h-3 w-3" />
                  {formatDownloads(app.download_count)}
                </span>
              </div>
            </div>
          </div>

          {/* Description */}
          <p className="mt-3 line-clamp-2 flex-1 text-xs text-secondary-400 leading-relaxed">
            {app.short_description}
          </p>

          {/* Badges row */}
          <div className="mt-3 flex flex-wrap items-center gap-1.5">
            {app.categories && (
              <Badge variant="secondary" className="text-xs">
                {app.categories.name}
              </Badge>
            )}
            {app.is_editors_choice && (
              <Badge variant="info" className="text-xs">
                <Shield className="h-3 w-3" />
                Editor&apos;s Choice
              </Badge>
            )}
            {app.is_featured && (
              <Badge variant="default" className="text-xs">
                <Crown className="h-3 w-3" />
                Featured
              </Badge>
            )}
            {app.publishing_plan && app.publishing_plan !== "basic" && planIcons[app.publishing_plan] && (
              <Badge variant="warning" className="text-xs">
                {planIcons[app.publishing_plan]}
                {app.publishing_plan === "priority" ? "Priority" : "Featured"}
              </Badge>
            )}
          </div>

          {/* Install Button */}
          <button
            type="button"
            className="btn-primary mt-4 w-full py-2.5 text-sm"
            onClick={(e) => {
              e.preventDefault();
              window.location.href = `/apps/${app.slug}`;
            }}
          >
            Install
          </button>
        </div>
      </Link>
    </motion.div>
  );
}

export function AppCardCompact({ app }: { app: Application }) {
  return (
    <Link href={`/apps/${app.slug}`}>
      <div className="flex items-center gap-3 rounded-xl p-3 transition-colors hover:bg-white/5">
        <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 ring-1 ring-white/10">
          {app.icon_url ? (
            <Image src={app.icon_url} alt={app.name} fill className="object-cover" sizes="48px" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-xl">📱</div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-white">{app.name}</p>
          <p className="truncate text-xs text-secondary-400">
            {app.developers?.display_name ?? "Unknown"}
          </p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <span className="flex items-center gap-1 text-xs text-yellow-400">
            <Star className="h-3 w-3 fill-yellow-400" />
            {app.rating_avg > 0 ? app.rating_avg.toFixed(1) : "New"}
          </span>
          <span className="text-xs text-secondary-500">{formatDownloads(app.download_count)}</span>
        </div>
      </div>
    </Link>
  );
}
