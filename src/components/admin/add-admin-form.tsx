"use client";

import { useActionState } from "react";
import { Loader2, UserCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { addAdminByEmailAction } from "@/lib/actions/admin";

export function AddAdminForm() {
  const [state, formAction, pending] = useActionState(addAdminByEmailAction, {});

  return (
    <form action={formAction} className="space-y-4">
      {state.error && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {state.error}
        </div>
      )}
      {state.success && (
        <div className="rounded-xl border border-primary/20 bg-primary/10 px-4 py-3 text-sm text-primary">
          {state.success}
        </div>
      )}
      <div>
        <label className="mb-2 block text-sm font-medium">
          User Email <span className="text-red-400">*</span>
        </label>
        <Input
          name="email"
          type="email"
          placeholder="user@example.com"
          required
        />
        <p className="mt-1 text-xs text-secondary-500">
          The user must already have an AppHub account.
        </p>
      </div>
      <Button type="submit" disabled={pending} className="gap-2">
        {pending
          ? <Loader2 className="h-4 w-4 animate-spin" />
          : <UserCheck className="h-4 w-4" />}
        Promote to Admin
      </Button>
    </form>
  );
}
