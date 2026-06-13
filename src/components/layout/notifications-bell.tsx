"use client";

import { useState, useEffect } from "react";
import { Bell, Check, CheckCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { markNotificationReadAction, markAllNotificationsReadAction } from "@/lib/actions/apps";
import type { Notification } from "@/types";
import Link from "next/link";
import { cn } from "@/lib/utils/cn";

const typeIcons: Record<string, string> = {
  app_approved: "✅",
  app_rejected: "❌",
  app_updated: "🔄",
  changes_requested: "📝",
  favorite_updated: "❤️",
  new_version: "🆕",
  new_submission: "📤",
  new_payment: "💰",
};

export function NotificationsBell({ userId }: { userId: string }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  useEffect(() => {
    const supabase = createClient();

    const loadNotifications = async () => {
      const { data } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(20);
      setNotifications((data ?? []) as Notification[]);
      setLoading(false);
    };

    loadNotifications();

    // Realtime subscription
    const channel = supabase
      .channel(`notifications:${userId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          setNotifications((prev) => [payload.new as Notification, ...prev]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  const handleMarkRead = async (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
    );
    await markNotificationReadAction(id);
  };

  const handleMarkAllRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    await markAllNotificationsReadAction();
  };

  const formatTime = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-secondary-300 transition-colors hover:border-primary/30 hover:text-primary"
        aria-label="Notifications"
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full z-50 mt-2 w-80 rounded-2xl border border-white/10 bg-secondary-900/95 shadow-glass-lg backdrop-blur-xl overflow-hidden">
            <div className="flex items-center justify-between border-b border-white/5 px-4 py-3">
              <h3 className="font-semibold">Notifications</h3>
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={handleMarkAllRead}
                  className="flex items-center gap-1 text-xs text-primary hover:underline"
                >
                  <CheckCheck className="h-3.5 w-3.5" />
                  Mark all read
                </button>
              )}
            </div>

            <div className="max-h-[420px] overflow-y-auto">
              {loading ? (
                <div className="py-8 text-center text-sm text-secondary-500">Loading...</div>
              ) : notifications.length === 0 ? (
                <div className="py-8 text-center">
                  <Bell className="mx-auto h-8 w-8 text-secondary-600" />
                  <p className="mt-2 text-sm text-secondary-500">No notifications yet</p>
                </div>
              ) : (
                <div>
                  {notifications.map((n) => (
                    <div
                      key={n.id}
                      className={cn(
                        "flex items-start gap-3 border-b border-white/5 px-4 py-3 transition-colors last:border-0",
                        !n.is_read && "bg-primary/5"
                      )}
                    >
                      <span className="shrink-0 text-lg">{typeIcons[n.type] ?? "🔔"}</span>
                      <div className="flex-1 min-w-0">
                        {n.link ? (
                          <Link
                            href={n.link}
                            onClick={() => {
                              handleMarkRead(n.id);
                              setOpen(false);
                            }}
                            className="text-sm font-medium hover:text-primary transition-colors"
                          >
                            {n.title}
                          </Link>
                        ) : (
                          <p className="text-sm font-medium">{n.title}</p>
                        )}
                        {n.body && (
                          <p className="mt-0.5 text-xs text-secondary-400 line-clamp-2">
                            {n.body}
                          </p>
                        )}
                        <p className="mt-1 text-xs text-secondary-600">
                          {formatTime(n.created_at)}
                        </p>
                      </div>
                      {!n.is_read && (
                        <button
                          type="button"
                          onClick={() => handleMarkRead(n.id)}
                          className="shrink-0 rounded-lg p-1 text-secondary-400 hover:bg-white/10 hover:text-primary"
                          title="Mark as read"
                        >
                          <Check className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
