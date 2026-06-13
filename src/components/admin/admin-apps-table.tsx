"use client";

import { useState, useTransition, useActionState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  CheckCircle,
  XCircle,
  MessageSquare,
  Eye,
  Star,
  Zap,
  Loader2,
  Search,
  Filter,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { Card } from "@/components/ui/card";
import {
  approveAppAction,
  rejectAppAction,
  requestChangesAction,
  featureAppAction,
  adminPublishAppAction,
} from "@/lib/actions/apps";
import type { Application } from "@/types";

interface AdminAppsTableProps {
  apps: Application[];
  currentStatus?: string;
}

const STATUS_FILTERS = [
  { label: "All", value: "" },
  { label: "Pending", value: "pending_review" },
  { label: "Approved", value: "approved" },
  { label: "Rejected", value: "rejected" },
  { label: "Changes", value: "changes_requested" },
  { label: "Draft", value: "draft" },
];

const statusVariants: Record<string, "default" | "warning" | "success" | "danger" | "secondary" | "info"> = {
  approved: "success",
  pending_review: "warning",
  rejected: "danger",
  changes_requested: "warning",
  draft: "secondary",
  archived: "secondary",
};

const statusLabels: Record<string, string> = {
  approved: "Approved",
  pending_review: "Pending",
  rejected: "Rejected",
  changes_requested: "Changes Needed",
  draft: "Draft",
  archived: "Archived",
};

function RejectModal({ app, onClose }: { app: Application; onClose: () => void }) {
  const [state, formAction, pending] = useActionState(rejectAppAction, {});

  if (state.success) {
    onClose();
    return null;
  }

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="app_id" value={app.id} />
      {state.error && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {state.error}
        </div>
      )}
      <p className="text-sm text-secondary-400">
        Rejecting: <strong className="text-white">{app.name}</strong>
      </p>
      <div>
        <label className="mb-2 block text-sm font-medium">
          Rejection Reason <span className="text-red-400">*</span>
        </label>
        <Textarea
          name="reason"
          placeholder="Explain why this app is being rejected (min 10 characters)..."
          rows={4}
          required
          minLength={10}
        />
      </div>
      <div className="flex gap-3">
        <Button type="submit" variant="danger" disabled={pending} className="flex-1">
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
          Reject App
        </Button>
        <Button variant="secondary" onClick={onClose} type="button" className="flex-1">
          Cancel
        </Button>
      </div>
    </form>
  );
}

function ChangesModal({ app, onClose }: { app: Application; onClose: () => void }) {
  const [state, formAction, pending] = useActionState(requestChangesAction, {});

  if (state.success) {
    onClose();
    return null;
  }

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="app_id" value={app.id} />
      {state.error && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {state.error}
        </div>
      )}
      <div>
        <label className="mb-2 block text-sm font-medium">
          Requested Changes
        </label>
        <Textarea
          name="notes"
          placeholder="Describe what changes are needed..."
          rows={4}
          required
          defaultValue={app.admin_notes ?? ""}
        />
      </div>
      <div className="flex gap-3">
        <Button type="submit" disabled={pending} className="flex-1">
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Send Request
        </Button>
        <Button variant="secondary" onClick={onClose} type="button" className="flex-1">
          Cancel
        </Button>
      </div>
    </form>
  );
}

function AppRow({ app }: { app: Application }) {
  const [rejectOpen, setRejectOpen] = useState(false);
  const [changesOpen, setChangesOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [actionLabel, setActionLabel] = useState("");

  const runAction = (label: string, fn: () => Promise<unknown>) => {
    setActionLabel(label);
    startTransition(async () => {
      await fn();
      setActionLabel("");
    });
  };

  return (
    <>
      <tr className="border-b border-white/5 text-sm hover:bg-white/3 transition-colors">
        <td className="py-4 pr-4">
          <Link href={`/dashboard/admin/apps/${app.id}`} className="flex items-center gap-3 group">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-lg">
              📱
            </div>
            <div>
              <p className="font-medium group-hover:text-primary transition-colors">{app.name}</p>
              <p className="text-xs text-secondary-500">
                {(app.developers as { display_name: string } | null)?.display_name}
              </p>
            </div>
          </Link>
        </td>
        <td className="py-4 pr-4">
          <Badge variant={statusVariants[app.status] ?? "secondary"}>
            {statusLabels[app.status] ?? app.status}
          </Badge>
        </td>
        <td className="py-4 pr-4 text-secondary-400">
          {(app.categories as { name: string } | null)?.name ?? "—"}
        </td>
        <td className="py-4 pr-4 text-secondary-400">
          {new Date(app.created_at).toLocaleDateString("en-IN")}
        </td>
        <td className="py-4">
          <div className="flex items-center gap-1.5 flex-wrap">
            {app.status === "pending_review" && (
              <>
                <Button
                  size="sm"
                  onClick={() => runAction("approve", () => approveAppAction(app.id))}
                  disabled={isPending}
                  className="gap-1"
                >
                  {isPending && actionLabel === "approve" ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <CheckCircle className="h-3 w-3" />
                  )}
                  Approve
                </Button>
                <Button
                  size="sm"
                  variant="danger"
                  onClick={() => setRejectOpen(true)}
                  disabled={isPending}
                  className="gap-1"
                >
                  <XCircle className="h-3 w-3" />
                  Reject
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => setChangesOpen(true)}
                  disabled={isPending}
                  className="gap-1"
                >
                  <MessageSquare className="h-3 w-3" />
                  Changes
                </Button>
              </>
            )}

            {app.status === "approved" && (
              <Button
                size="sm"
                variant={app.is_featured ? "primary" : "secondary"}
                onClick={() => runAction("feature", () => featureAppAction(app.id, !app.is_featured))}
                disabled={isPending}
                className="gap-1"
              >
                <Star className="h-3 w-3" />
                {app.is_featured ? "Unfeature" : "Feature"}
              </Button>
            )}

            {app.status === "draft" && (
              <Button
                size="sm"
                onClick={() => runAction("publish", () => adminPublishAppAction(app.id))}
                disabled={isPending}
                className="gap-1"
              >
                {isPending && actionLabel === "publish" ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <Zap className="h-3 w-3" />
                )}
                Publish Now
              </Button>
            )}

            {app.status === "approved" && (
              <Link href={`/apps/${app.slug}`} target="_blank">
                <Button size="sm" variant="ghost" className="gap-1">
                  <Eye className="h-3 w-3" />
                  View
                </Button>
              </Link>
            )}
          </div>
        </td>
      </tr>

      <Modal
        isOpen={rejectOpen}
        onClose={() => setRejectOpen(false)}
        title="Reject Application"
      >
        <RejectModal app={app} onClose={() => setRejectOpen(false)} />
      </Modal>

      <Modal
        isOpen={changesOpen}
        onClose={() => setChangesOpen(false)}
        title="Request Changes"
      >
        <ChangesModal app={app} onClose={() => setChangesOpen(false)} />
      </Modal>
    </>
  );
}

export function AdminAppsTable({ apps, currentStatus }: AdminAppsTableProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleStatusFilter = (status: string) => {
    const params = new URLSearchParams();
    if (status) params.set("status", status);
    router.push(`/dashboard/admin/apps?${params.toString()}`);
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-secondary-400" />
          <Input
            placeholder="Search apps..."
            className="pl-10 w-64"
            defaultValue={searchParams.get("q") ?? ""}
            onChange={(e) => {
              const params = new URLSearchParams(searchParams.toString());
              if (e.target.value) params.set("q", e.target.value);
              else params.delete("q");
              router.push(`/dashboard/admin/apps?${params.toString()}`);
            }}
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-secondary-400" />
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.value}
              type="button"
              onClick={() => handleStatusFilter(f.value)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                (currentStatus ?? "") === f.value
                  ? "bg-primary/20 text-primary"
                  : "bg-white/5 text-secondary-400 hover:bg-white/10"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <p className="text-sm text-secondary-500">{apps.length} app{apps.length !== 1 ? "s" : ""}</p>

      <Card className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10 bg-white/3">
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-secondary-400">
                  App
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-secondary-400">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-secondary-400">
                  Category
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-secondary-400">
                  Submitted
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-secondary-400">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {apps.length > 0 ? (
                apps.map((app) => <AppRow key={app.id} app={app} />)
              ) : (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-secondary-500">
                    No apps found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
