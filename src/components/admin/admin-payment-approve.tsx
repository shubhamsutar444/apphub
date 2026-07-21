"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { approveManualPaymentAction } from "@/lib/actions/payment-manual";

interface AdminPaymentApproveProps {
  paymentId: string;
  targetUserId: string;
}

export function AdminPaymentApprove({
  paymentId,
  targetUserId,
}: AdminPaymentApproveProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleApprove = () => {
    setError("");
    setSuccess(false);
    startTransition(async () => {
      try {
        const result = await approveManualPaymentAction(paymentId, targetUserId);
        if (result.error) {
          setError(result.error);
        } else {
          setSuccess(true);
          router.refresh();
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Approval failed");
      }
    });
  };

  if (success) {
    return (
      <div className="flex items-center gap-1.5 rounded-lg bg-emerald-500/10 px-3 py-1.5 text-sm font-semibold text-emerald-400">
        <Check className="h-4 w-4" />
        Approved
      </div>
    );
  }

  return (
    <div className="flex flex-col items-end gap-2">
      {error && (
        <div className="flex items-center gap-1 text-xs text-red-400">
          <AlertCircle className="h-3 w-3" />
          <span>{error}</span>
        </div>
      )}
      <Button
        size="sm"
        onClick={handleApprove}
        disabled={isPending}
        className="gap-1.5"
      >
        {isPending ? (
          <>
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            Approving...
          </>
        ) : (
          <>
            <Check className="h-3.5 w-3.5" />
            Approve & Activate
          </>
        )}
      </Button>
    </div>
  );
}
