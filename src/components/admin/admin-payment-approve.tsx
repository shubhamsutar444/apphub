"use client";

import { useState, useTransition } from "react";
import { CheckCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { approveManualPaymentAction } from "@/lib/actions/payment-manual";

interface AdminPaymentApproveProps {
  paymentId: string;
  targetUserId: string;
  userName: string;
}

export function AdminPaymentApprove({ paymentId, targetUserId, userName }: AdminPaymentApproveProps) {
  const [isPending, startTransition] = useTransition();
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  const handleApprove = () => {
    startTransition(async () => {
      const result = await approveManualPaymentAction(paymentId, targetUserId);
      if (result.error) {
        setError(result.error);
      } else {
        setDone(true);
      }
    });
  };

  if (done) {
    return (
      <div className="flex items-center gap-2 rounded-xl bg-primary/10 px-4 py-2 text-sm font-semibold text-primary">
        <CheckCircle className="h-4 w-4" />
        Activated
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {error && <p className="text-xs text-red-400">{error}</p>}
      <Button
        onClick={handleApprove}
        disabled={isPending}
        className="gap-2 whitespace-nowrap"
      >
        {isPending ? (
          <><Loader2 className="h-4 w-4 animate-spin" /> Approving...</>
        ) : (
          <><CheckCircle className="h-4 w-4" /> Approve & Activate</>
        )}
      </Button>
      <p className="text-center text-xs text-secondary-500">Activate {userName}</p>
    </div>
  );
}
