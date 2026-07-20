"use client";

import { useActionState } from "react";
import { Loader2, AlertTriangle, CheckCircle, Clock, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { updateAppAction } from "@/lib/actions/apps";
import type { Application, Category } from "@/types";

interface AppEditFormProps {
  app: Application;
  categories: Category[];
}

function StatusBanner({ app }: { app: Application }) {
  if (app.status === "changes_requested") {
    return (
      <div className="rounded-2xl border border-yellow-500/30 bg-yellow-500/10 p-5">
        <div className="flex items-start gap-3">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-yellow-400" />
          <div>
            <p className="font-semibold text-yellow-400">Changes Requested by Admin</p>
            {app.admin_notes && (
              <p className="mt-1 text-sm text-yellow-300/80">{app.admin_notes}</p>
            )}
            <p className="mt-2 text-xs text-yellow-400/60">
              Make the requested changes below and click <strong>&quot;Save &amp; Re-submit&quot;</strong>. Admin will be notified automatically.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (app.status === "pending_review") {
    return (
      <div className="rounded-2xl border border-blue-500/20 bg-blue-500/8 p-4">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-blue-400" />
          <p className="text-sm text-blue-300">
            Your app is currently <strong>under review</strong>. Admin will respond soon.
          </p>
        </div>
      </div>
    );
  }

  if (app.status === "rejected") {
    return (
      <div className="rounded-2xl border border-red-500/20 bg-red-500/8 p-4">
        <div className="flex items-start gap-3">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-400" />
          <div>
            <p className="text-sm font-medium text-red-400">App Rejected</p>
            {app.rejection_reason && (
              <p className="mt-1 text-xs text-red-300/80">{app.rejection_reason}</p>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (app.status === "approved") {
    return (
      <div className="rounded-2xl border border-primary/20 bg-primary/8 p-4">
        <div className="flex items-center gap-2">
          <CheckCircle className="h-4 w-4 text-primary" />
          <p className="text-sm text-primary">
            App is <strong>Live</strong>. Changes you save will update the listing.
          </p>
        </div>
      </div>
    );
  }

  return null;
}

export function AppEditForm({ app, categories }: AppEditFormProps) {
  const [state, formAction, pending] = useActionState(updateAppAction, {});
  const isChangesRequested = app.status === "changes_requested";

  return (
    <form action={formAction} className="space-y-6">
      <input type="hidden" name="app_id" value={app.id} />

      {/* Status banner */}
      <StatusBanner app={app} />

      {state.error && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {state.error}
        </div>
      )}
      {state.success && (
        <div className="rounded-xl border border-primary/20 bg-primary/10 px-4 py-3 text-sm text-primary flex items-center gap-2">
          <CheckCircle className="h-4 w-4" />
          {state.success}
        </div>
      )}

      <Card>
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-lg font-semibold">App Information</h2>
          <Badge
            variant={
              app.status === "approved" ? "success"
              : app.status === "pending_review" ? "info"
              : app.status === "changes_requested" ? "warning"
              : app.status === "rejected" ? "danger"
              : "secondary"
            }
          >
            {app.status.replace("_", " ")}
          </Badge>
        </div>

        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium">App Name</label>
              <Input name="name" defaultValue={app.name} required maxLength={100} />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium">Category</label>
              <Select name="category_id" defaultValue={app.category_id ?? ""}>
                <option value="">Select a category</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </Select>
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">Short Description</label>
            <Input name="short_description" defaultValue={app.short_description} required maxLength={200} />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">Full Description</label>
            <Textarea name="full_description" defaultValue={app.full_description} rows={6} required />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium">Version</label>
              <Input name="version" defaultValue={app.current_version ?? ""} required />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium">Tags</label>
              <Input name="tags" defaultValue={app.tags?.join(", ") ?? ""} placeholder="utility, productivity, free" />
            </div>
          </div>
        </div>
      </Card>

      <Card>
        <h2 className="mb-6 text-lg font-semibold">Links & Contact</h2>
        <div className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-medium">Developer Website</label>
            <Input name="developer_website" type="url" defaultValue={app.developer_website ?? ""} placeholder="https://yourwebsite.com" />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium">Privacy Policy URL</label>
            <Input name="privacy_policy_url" type="url" defaultValue={app.privacy_policy_url ?? ""} />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium">Support Email</label>
            <Input name="support_email" type="email" defaultValue={app.support_email ?? ""} />
          </div>
        </div>
      </Card>

      <div className="flex items-center justify-between gap-4">
        {isChangesRequested && (
          <p className="text-sm text-yellow-400/80">
            Saving will automatically re-submit for admin review.
          </p>
        )}
        <div className="ml-auto">
          <Button type="submit" size="lg" disabled={pending} className="gap-2">
            {pending ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> Saving...</>
            ) : isChangesRequested ? (
              <><Send className="h-4 w-4" /> Save & Re-submit for Review</>
            ) : (
              "Save Changes"
            )}
          </Button>
        </div>
      </div>
    </form>
  );
}
