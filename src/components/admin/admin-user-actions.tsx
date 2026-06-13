"use client";

import { useState, useTransition } from "react";
import { Select } from "@/components/ui/select";
import { changeUserRoleAction } from "@/lib/actions/admin";
import type { UserRole } from "@/types";
import { Loader2 } from "lucide-react";

interface AdminUserActionsProps {
  userId: string;
  currentRole: UserRole;
}

export function AdminUserActions({ userId, currentRole }: AdminUserActionsProps) {
  const [role, setRole] = useState<UserRole>(currentRole);
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState("");

  const handleChange = (newRole: UserRole) => {
    setRole(newRole);
    startTransition(async () => {
      const result = await changeUserRoleAction(userId, newRole);
      setMessage(result.success ?? result.error ?? "");
      setTimeout(() => setMessage(""), 3000);
    });
  };

  return (
    <div className="flex items-center gap-2">
      <Select
        value={role}
        onChange={(e) => handleChange(e.target.value as UserRole)}
        className="w-32 py-1.5 text-xs"
        disabled={isPending}
      >
        <option value="user">User</option>
        <option value="developer">Developer</option>
        <option value="admin">Admin</option>
      </Select>
      {isPending && <Loader2 className="h-4 w-4 animate-spin text-primary" />}
      {message && !isPending && (
        <span className="text-xs text-primary">{message}</span>
      )}
    </div>
  );
}
