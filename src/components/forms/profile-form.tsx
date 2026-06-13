"use client";

import { useActionState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { updateProfileAction, type AuthActionState } from "@/lib/actions/auth";
import { profileSchema, type ProfileInput } from "@/lib/validations/auth";
import type { UserProfile } from "@/types";
import { cn } from "@/lib/utils/cn";

const initialState: AuthActionState = {};

interface ProfileFormProps {
  profile: UserProfile;
}

export function ProfileForm({ profile }: ProfileFormProps) {
  const [state, formAction, pending] = useActionState(updateProfileAction, initialState);

  const {
    register,
    formState: { errors },
  } = useForm<ProfileInput>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      fullName: profile.full_name ?? "",
      theme: profile.theme,
    },
  });

  return (
    <form action={formAction} className="space-y-4">
      {state.success && (
        <div className="rounded-xl border border-primary/20 bg-primary/10 px-4 py-3 text-sm text-primary">
          {state.success}
        </div>
      )}

      {(state.error || errors.fullName?.message) && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {state.error ?? errors.fullName?.message}
        </div>
      )}

      <div>
        <label htmlFor="fullName" className="mb-2 block text-sm font-medium">
          Full Name
        </label>
        <Input
          id="fullName"
          type="text"
          {...register("fullName")}
          className={cn(errors.fullName && "border-red-500/50")}
        />
      </div>

      <div>
        <label htmlFor="email" className="mb-2 block text-sm font-medium">
          Email
        </label>
        <Input id="email" type="email" value={profile.email} disabled />
      </div>

      <div>
        <label htmlFor="theme" className="mb-2 block text-sm font-medium">
          Theme
        </label>
        <select
          id="theme"
          {...register("theme")}
          className="input-field"
        >
          <option value="dark">Dark</option>
          <option value="light">Light</option>
        </select>
      </div>

      <Button type="submit" disabled={pending}>
        {pending ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Saving...
          </>
        ) : (
          "Save Changes"
        )}
      </Button>
    </form>
  );
}
