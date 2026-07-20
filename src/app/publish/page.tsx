import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

// ── Dummy payment gateway ─────────────────────────────────────────────────────
// Payment is automatically marked as paid — no Razorpay, no UI, no questions.
// Anyone who clicks "Publish App" becomes a developer instantly.
// ─────────────────────────────────────────────────────────────────────────────

const ADMIN_EMAIL = "shubhamsutar81981@gmail.com";

export default async function PublishPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?redirectTo=/publish");

  const supabase = await createClient();
  const adminClient = createAdminClient();

  // Check if developer profile already exists
  const { data: existing } = await supabase
    .from("developers")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (existing) {
    // Already a developer → go straight to submit app
    redirect("/dashboard/developer/apps/new");
  }

  // ── Create developer profile automatically ────────────────────────────
  const slug =
    (user.profile.full_name ?? user.email.split("@")[0])
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") +
    "-" + Date.now().toString(36);

  await adminClient.from("developers").insert({
    user_id: user.id,
    display_name: user.profile.full_name ?? user.email.split("@")[0],
    slug,
    support_email: user.email,
  });

  // ── Set role to developer (admin keeps admin role) ────────────────────
  const isAdmin = user.email.toLowerCase() === ADMIN_EMAIL || user.profile.role === "admin";
  if (!isAdmin) {
    await adminClient
      .from("users")
      .update({ role: "developer" })
      .eq("id", user.id);
  }

  // ── Record ₹1 trial payment as paid (dummy) ───────────────────────────
  await supabase.from("payments").insert({
    user_id: user.id,
    plan: "basic",
    amount_paise: 100, // ₹1 trial plan
    status: "paid",
    metadata: { demo: true, plan_name: "₹1 Trial", auto_approved: true },
  });

  // ── Redirect directly to app submission ───────────────────────────────
  redirect("/dashboard/developer/apps/new");
}
