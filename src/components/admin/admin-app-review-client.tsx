"use client";

import { useState, useTransition, useActionState } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle, XCircle, MessageSquare, Star, Zap, Loader2, Eye,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Modal } from "@/components/ui/modal";
import {
  approveAppAction,
  rejectAppAction,
  requestChangesAction,
  featureAppAction,
  adminPublishAppAction,
} from "@/lib/actions/apps";

interface AdminAppReviewClientProps {
  app: {
    id: string;
    name: string;
    slug: string;
    status: string;
    is_featured: boolean;
    admin_notes: string | null;
  };
}

function RejectForm({ appId, appName, onClose }: { appId: string; appName: string; onClose: () => void }) {
  const [state, formAction, pending] = useActionState(rejectAppAction, {});
  if (state.success) { onClose(); return null; }
  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="app_id" value={appId} />
      {state.error && <p className="text-sm text-red-400 bg-red-500/10 rounded-xl px-4 py-2">{state.error}</p>}
      <p className="text-sm text-secondary-400">Rejecting: <strong className="text-white">{appName}</strong></p>
      <div>
        <label className="mb-2 block text-sm font-medium">Reason <span className="text-red-400">*</span></label>
        <Textarea name="reason" rows={4} required minLength={10} placeholder="Explain why this app is rejected..." />
      </div>
      <div className="flex gap-3">
        <Button type="submit" variant="danger" disabled={pending} className="flex-1">
          {pending && <Loader2 className="h-4 w-4 animate-spin" />} Reject
        </Button>
        <Button type="button" variant="secondary" onClick={onClose} className="flex-1">Cancel</Button>
      </div>
    </form>
  );
}

function ChangesForm({ appId, adminNotes, onClose }: { appId: string; adminNotes: string | null; onClose: () => void }) {
  const [state, formAction, pending] = useActionState(requestChangesAction, {});
  if (state.success) { onClose(); return null; }
  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="app_id" value={appId} />
      {state.error && <p className="text-sm text-red-400 bg-red-500/10 rounded-xl px-4 py-2">{state.error}</p>}
      <div>
        <label className="mb-2 block text-sm font-medium">Changes Needed</label>
        <Textarea name="notes" rows={4} required defaultValue={adminNotes ?? ""} placeholder="What needs to be changed..." />
      </div>
      <div className="flex gap-3">
        <Button type="submit" disabled={pending} className="flex-1">
          {pending && <Loader2 className="h-4 w-4 animate-spin" />} Send
        </Button>
        <Button type="button" variant="secondary" onClick={onClose} className="flex-1">Cancel</Button>
      </div>
    </form>
  );
}

export function AdminAppReviewClient({ app }: AdminAppReviewClientProps) {
  const router = useRouter();
  const [rejectOpen, setRejectOpen] = useState(false);
  const [changesOpen, setChangesOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [activeAction, setActiveAction] = useState("");

  const run = (label: string, fn: () => Promise<unknown>) => {
    setActiveAction(label);
    startTransition(async () => {
      await fn();
      setActiveAction("");
      router.refresh();
    });
  };

  return (
    <div className="flex flex-wrap gap-2">
      {/* Approve / Publish */}
      {(app.status === "pending_review" || app.status === "draft") && (
        <Button
          onClick={() => run("approve", () =>
            app.status === "draft"
              ? adminPublishAppAction(app.id)
              : approveAppAction(app.id)
          )}
          disabled={isPending}
          className="gap-2"
        >
          {isPending && activeAction === "approve"
            ? <Loader2 className="h-4 w-4 animate-spin" />
            : <CheckCircle className="h-4 w-4" />}
          {app.status === "draft" ? "Publish Now" : "Approve & Publish"}
        </Button>
      )}

      {/* Reject */}
      {app.status === "pending_review" && (
        <Button variant="danger" onClick={() => setRejectOpen(true)} disabled={isPending} className="gap-2">
          <XCircle className="h-4 w-4" /> Reject
        </Button>
      )}

      {/* Request Changes */}
      {app.status === "pending_review" && (
        <Button variant="secondary" onClick={() => setChangesOpen(true)} disabled={isPending} className="gap-2">
          <MessageSquare className="h-4 w-4" /> Request Changes
        </Button>
      )}

      {/* Feature / Unfeature */}
      {app.status === "approved" && (
        <Button
          variant={app.is_featured ? "primary" : "secondary"}
          onClick={() => run("feature", () => featureAppAction(app.id, !app.is_featured))}
          disabled={isPending}
          className="gap-2"
        >
          {isPending && activeAction === "feature"
            ? <Loader2 className="h-4 w-4 animate-spin" />
            : <Star className="h-4 w-4" />}
          {app.is_featured ? "Unfeature" : "Feature"}
        </Button>
      )}

      {/* View live */}
      {app.status === "approved" && (
        <a href={`/apps/${app.slug}`} target="_blank" rel="noopener noreferrer">
          <Button variant="ghost" className="gap-2">
            <Eye className="h-4 w-4" /> View Live
          </Button>
        </a>
      )}

      {/* Re-publish rejected */}
      {app.status === "rejected" && (
        <Button
          onClick={() => run("republish", () => approveAppAction(app.id))}
          disabled={isPending}
          className="gap-2"
        >
          {isPending && activeAction === "republish"
            ? <Loader2 className="h-4 w-4 animate-spin" />
            : <Zap className="h-4 w-4" />}
          Approve Anyway
        </Button>
      )}

      <Modal isOpen={rejectOpen} onClose={() => setRejectOpen(false)} title="Reject Application">
        <RejectForm appId={app.id} appName={app.name} onClose={() => setRejectOpen(false)} />
      </Modal>

      <Modal isOpen={changesOpen} onClose={() => setChangesOpen(false)} title="Request Changes">
        <ChangesForm appId={app.id} adminNotes={app.admin_notes} onClose={() => setChangesOpen(false)} />
      </Modal>
    </div>
  );
}
