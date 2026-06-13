"use client";

import { useState, useTransition } from "react";
import { Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { deleteAppAction } from "@/lib/actions/apps";

interface AppActionsClientProps {
  appId: string;
  appName: string;
}

export function AppActionsClient({ appId, appName }: AppActionsClientProps) {
  const [showDelete, setShowDelete] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleDelete = () => {
    startTransition(async () => {
      const result = await deleteAppAction(appId);
      if (result.error) {
        setError(result.error);
      } else {
        setShowDelete(false);
      }
    });
  };

  return (
    <>
      <Button
        variant="danger"
        size="sm"
        onClick={() => setShowDelete(true)}
      >
        <Trash2 className="h-4 w-4" />
      </Button>

      <Modal
        isOpen={showDelete}
        onClose={() => setShowDelete(false)}
        title="Delete App"
        size="sm"
      >
        <p className="text-secondary-400">
          Are you sure you want to delete{" "}
          <span className="font-semibold text-white">{appName}</span>?
          This action cannot be undone.
        </p>

        {error && (
          <div className="mt-4 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
            {error}
          </div>
        )}

        <div className="mt-6 flex gap-3">
          <Button
            variant="danger"
            onClick={handleDelete}
            disabled={isPending}
            className="flex-1"
          >
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Delete App
          </Button>
          <Button
            variant="secondary"
            onClick={() => setShowDelete(false)}
            className="flex-1"
          >
            Cancel
          </Button>
        </div>
      </Modal>
    </>
  );
}
