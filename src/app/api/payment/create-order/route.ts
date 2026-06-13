import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!keyId || !keySecret) {
      return NextResponse.json(
        { error: "Payment gateway not configured yet." },
        { status: 503 }
      );
    }

    const { plan, amount_paise } = await request.json();
    if (!plan || !amount_paise) {
      return NextResponse.json({ error: "Plan and amount required" }, { status: 400 });
    }

    // Dynamically import Razorpay only when keys are present
    const Razorpay = (await import("razorpay")).default;
    const razorpay = new Razorpay({ key_id: keyId, key_secret: keySecret });

    const order = await razorpay.orders.create({
      amount: amount_paise,
      currency: "INR",
      receipt: `apphub_${user.id}_${Date.now()}`,
      notes: { user_id: user.id, user_email: user.email, plan },
    });

    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();
    await supabase.from("payments").insert({
      user_id: user.id,
      plan: plan === "starter" ? "basic" : plan,
      amount_paise,
      status: "created",
      razorpay_order_id: order.id,
      metadata: { original_plan: plan },
    });

    return NextResponse.json({
      order_id: order.id,
      amount: order.amount,
      currency: order.currency,
      key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
    });
  } catch (err) {
    console.error("Razorpay create order error:", err);
    return NextResponse.json({ error: "Failed to create payment order" }, { status: 500 });
  }
}
