import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentUser } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      plan,
    } = await request.json();

    // Verify signature
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
      .update(body)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return NextResponse.json({ error: "Invalid payment signature" }, { status: 400 });
    }

    const supabase = await createClient();
    const adminClient = createAdminClient();

    // Update payment as paid
    await supabase
      .from("payments")
      .update({
        status: "paid",
        razorpay_payment_id,
        razorpay_signature,
      })
      .eq("razorpay_order_id", razorpay_order_id);

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

      await adminClient.from("developers").insert({
        user_id: user.id,
        display_name: user.profile.full_name ?? user.email.split("@")[0],
        slug,
        support_email: user.email,
      });

      await adminClient
        .from("users")
        .update({ role: "developer" })
        .eq("id", user.id);
    }

    // Notify admin
    const { data: admins } = await adminClient
      .from("users")
      .select("id")
      .eq("role", "admin");

    if (admins && admins.length > 0) {
      await adminClient.from("notifications").insert(
        admins.map((a: { id: string }) => ({
          user_id: a.id,
          type: "new_payment",
          title: "New Payment Received 💰",
          body: `${user.email} paid for ${plan} plan`,
          link: "/dashboard/admin/payments",
          metadata: { razorpay_payment_id, plan },
        }))
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Payment verify error:", err);
    return NextResponse.json({ error: "Verification failed" }, { status: 500 });
  }
}
