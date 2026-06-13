"use client";

import { useActionState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { createDeveloperProfileAction } from "@/lib/actions/apps";
import type { DeveloperProfile } from "@/types";

interface DeveloperProfileFormProps {
  developer: DeveloperProfile | null;
}

export function DeveloperProfileForm({ developer }: DeveloperProfileFormProps) {
  const [state, formAction, pending] = useActionState(createDeveloperProfileAction, {});

  return (
    <form action={formAction} className="space-y-6">
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

      <Card>
        <div className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-medium">
              Display Name <span className="text-red-400">*</span>
            </label>
            <Input
              name="display_name"
              defaultValue={developer?.display_name ?? ""}
              placeholder="Your developer name or company"
              required
              minLength={2}
              maxLength={100}
            />
            <p className="mt-1 text-xs text-secondary-500">
              This appears on all your app listings
            </p>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">Bio</label>
            <Textarea
              name="bio"
              defaultValue={developer?.bio ?? ""}
              placeholder="Tell users about yourself or your company..."
              rows={3}
              maxLength={500}
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">Website</label>
            <Input
              name="website"
              type="url"
              defaultValue={developer?.website ?? ""}
              placeholder="https://yourwebsite.com"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">Support Email</label>
            <Input
              name="support_email"
              type="email"
              defaultValue={developer?.support_email ?? ""}
              placeholder="support@yourcompany.com"
            />
          </div>
        </div>
      </Card>

      <Button type="submit" size="lg" disabled={pending}>
        {pending ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Saving...
          </>
        ) : developer ? (
          "Update Profile"
        ) : (
          "Create Developer Profile"
        )}
      </Button>
    </form>
  );
}
