import { NextRequest, NextResponse } from "next/server";
import Razorpay from "razorpay";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth/session";

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { plan, amount_paise } = await request.json();

    if (!plan || !amount_paise) {
      return NextResponse.json({ error: "Plan and amount required" }, { status: 400 });
    }

    // Create Razorpay order
    const order = await razorpay.orders.create({
      amount: amount_paise,
      currency: "INR",
      receipt: `apphub_${user.id}_${Date.now()}`,
      notes: {
        user_id: user.id,
        user_email: user.email,
        plan,
      },
    });

    // Save pending payment record
    const supabase = await createClient();
    await supabase.from("payments").insert({
      user_id: user.id,
      plan: plan === "starter" ? "basic" : plan,
      amount_paise,
      status: "created",
      razorpay_order_id: order.id,
      metadata: { razorpay_order: order, original_plan: plan },
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
