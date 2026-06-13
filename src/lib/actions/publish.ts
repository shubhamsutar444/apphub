"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentUser } from "@/lib/auth/session";

export interface ActivateDeveloperInput {
  userId: string;
  plan: "starter" | "basic" | "priority" | "featured";
  amountPaise: number;
}

export interface PublishActionResult {
  error?: string;
  success?: boolean;
}

/**
 * After "payment" (demo mode — Razorpay to be wired later):
 * 1. Record payment as paid
 * 2. Create developer profile if not exists
 * 3. Upgrade user role to developer
 */
export async function activateDeveloperAction(
  input: ActivateDeveloperInput
): Promise<PublishActionResult> {
  const user = await getCurrentUser();
  if (!user || user.id !== input.userId) return { error: "Not authenticated" };

  const supabase = await createClient();
  const adminClient = createAdminClient();

  // Check if developer profile already exists
  const { data: existing } = await supabase
    .from("developers")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!existing) {
    const slug =
      (user.profile.full_name ?? user.email.split("@")[0])
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "") +
      "-" +
      Date.now().toString(36);

    const { error: devErr } = await adminClient.from("developers").insert({
      user_id: user.id,
      display_name: user.profile.full_name ?? user.email.split("@")[0],
      slug,
      support_email: user.email,
    });

    if (devErr) return { error: devErr.message };

    const { error: roleErr } = await adminClient
      .from("users")
      .update({ role: "developer" })
      .eq("id", user.id);

    if (roleErr) return { error: roleErr.message };
  }

  // Record the payment (demo: mark paid immediately)
  // Map plan name
  const planName =
    input.plan === "starter" ? "basic" : input.plan;

  await supabase.from("payments").insert({
    user_id: user.id,
    plan: planName,
    amount_paise: input.amountPaise,
    status: "paid",
    metadata: { demo: true, original_plan: input.plan },
  });

  revalidatePath("/dashboard/developer");
  revalidatePath("/publish");
  return { success: true };
}
