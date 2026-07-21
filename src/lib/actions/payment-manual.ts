"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

interface SubmitPaymentInput {
  userId: string;
  userEmail: string;
  userName: string;
  screenshotUrl: string;
  plan: "starter" | "basic" | "priority" | "featured";
  amountPaise: number;
}

export interface PaymentActionResult {
  error?: string;
  success?: boolean;
}

export async function submitPaymentScreenshotAction(
  input: SubmitPaymentInput
): Promise<PaymentActionResult> {
  const { userId, userEmail, userName, screenshotUrl, plan, amountPaise } = input;

  try {
    const supabase = await createClient();
    const adminClient = createAdminClient();

    const planName = plan === "starter" ? "basic" : plan;
    const amountDisplay = `₹${(amountPaise / 100).toFixed(0)}`;

    // Record payment as pending (not paid yet — admin must verify)
    const { error: payErr } = await supabase.from("payments").insert({
      user_id: userId,
      plan: planName,
      amount_paise: amountPaise,
      status: "pending",
      metadata: {
        manual_payment: true,
        screenshot_url: screenshotUrl,
        amount_display: amountDisplay,
        user_name: userName,
        user_email: userEmail,
        submitted_at: new Date().toISOString(),
        original_plan: plan,
      },
    });

    if (payErr) return { error: payErr.message };

    // Notify all admins with the screenshot
    const { data: admins } = await adminClient
      .from("users")
      .select("id")
      .eq("role", "admin");

    if (admins && admins.length > 0) {
      await adminClient.from("notifications").insert(
        admins.map((a: { id: string }) => ({
          user_id: a.id,
          type: "new_payment" as const,
          title: "💰 New Payment Screenshot",
          body: `${userName} (${userEmail}) submitted payment proof of ${amountDisplay}. Verify and activate their developer account.`,
          link: `/dashboard/admin/payments`,
          metadata: {
            screenshot_url: screenshotUrl,
            user_id: userId,
            user_email: userEmail,
            amount: amountDisplay,
          },
        }))
      );
    }

    return { success: true };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to submit payment" };
  }
}

// Called by admin to approve the payment and activate developer account
export async function approveManualPaymentAction(
  paymentId: string,
  targetUserId: string
): Promise<PaymentActionResult> {
  try {
    const adminClient = createAdminClient();

    // Mark payment as paid
    const { error: payErr } = await adminClient
      .from("payments")
      .update({ status: "paid" })
      .eq("id", paymentId);

    if (payErr) return { error: payErr.message };

    // Get user info
    const { data: targetUser } = await adminClient
      .from("users")
      .select("email, full_name, role")
      .eq("id", targetUserId)
      .single();

    if (!targetUser) return { error: "User not found" };

    // Create developer profile if doesn't exist
    const { data: existingDev } = await adminClient
      .from("developers")
      .select("id")
      .eq("user_id", targetUserId)
      .maybeSingle();

    if (!existingDev) {
      const displayName = targetUser.full_name || targetUser.email.split("@")[0];
      const slug = displayName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "")
        + "-" + Date.now().toString(36);

      const { error: devErr } = await adminClient.from("developers").insert({
        user_id: targetUserId,
        display_name: displayName,
        slug,
        support_email: targetUser.email,
      });

      if (devErr) return { error: devErr.message };
    }

    // Upgrade user role to developer
    if (targetUser.role === "user") {
      await adminClient.from("users").update({ role: "developer" }).eq("id", targetUserId);
    }

    // Notify the developer
    await adminClient.from("notifications").insert({
      user_id: targetUserId,
      type: "app_approved" as const,
      title: "🎉 Developer Account Activated!",
      body: "Your payment has been verified. You can now submit your apps on AppHub!",
      link: "/dashboard/developer/apps/new",
      metadata: { payment_id: paymentId },
    });

    return { success: true };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to approve payment" };
  }
}
