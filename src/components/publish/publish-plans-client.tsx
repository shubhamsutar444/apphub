"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { CheckCircle, Loader2, Zap, Crown, Star, Gift } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

// Load Razorpay script dynamically
function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if ((window as unknown as Record<string, unknown>).Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

interface Plan {
  id: "starter" | "basic" | "priority" | "featured";
  name: string;
  price: number;
  displayPrice: string;
  badge?: string;
  icon: React.ReactNode;
  features: string[];
  highlight?: boolean;
}

interface PublishPlansClientProps {
  userId: string;
  userEmail: string;
  userName: string;
  isFirstTime: boolean;
  hasDeveloperProfile: boolean;
}

export function PublishPlansClient({
  userEmail,
  userName,
  isFirstTime,
  hasDeveloperProfile,
}: PublishPlansClientProps) {
  const router = useRouter();
  const [selected, setSelected] = useState<Plan["id"]>(isFirstTime ? "starter" : "basic");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");

  const plans: Plan[] = [
    ...(isFirstTime
      ? [{
          id: "starter" as const,
          name: "First-Time Offer",
          price: 100,
          displayPrice: "₹1",
          badge: "🎁 New Publisher",
          icon: <Gift className="h-5 w-5" />,
          features: [
            "Valid for your first app only",
            "Standard listing",
            "24–72h review time",
            "Full analytics access",
            "Unlimited updates",
          ],
          highlight: true,
        }]
      : []),
    {
      id: "basic",
      name: "Basic",
      price: 9900,
      displayPrice: "₹99",
      icon: <Star className="h-5 w-5" />,
      features: ["Standard listing", "24–72h review", "App analytics", "Community support", "Unlimited updates"],
    },
    {
      id: "priority",
      name: "Priority",
      price: 29900,
      displayPrice: "₹299",
      badge: "Popular",
      icon: <Zap className="h-5 w-5" />,
      features: ["Highlighted listing", "12–24h review", "Advanced analytics", "Priority support", "Badge on listing"],
      highlight: !isFirstTime,
    },
    {
      id: "featured",
      name: "Featured",
      price: 99900,
      displayPrice: "₹999",
      icon: <Crown className="h-5 w-5" />,
      features: ["Homepage featured slot", "6–12h review", "Premium analytics", "Dedicated support", "Newsletter mention"],
    },
  ];

  const selectedPlan = plans.find((p) => p.id === selected)!;

  const handlePay = () => {
    setError("");
    startTransition(async () => {
      try {
        // 1. Create Razorpay order on server
        const orderRes = await fetch("/api/payment/create-order", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            plan: selected,
            amount_paise: selectedPlan.price,
          }),
        });

        const orderData = await orderRes.json();
        if (!orderRes.ok || orderData.error) {
          setError(orderData.error ?? "Failed to create payment order");
          return;
        }

        // 2. Load Razorpay SDK
        const loaded = await loadRazorpayScript();
        if (!loaded) {
          setError("Failed to load payment gateway. Please check your internet connection.");
          return;
        }

        // 3. Open Razorpay checkout
        const options = {
          key: orderData.key,
          amount: orderData.amount,
          currency: orderData.currency,
          name: "AppHub",
          description: `${selectedPlan.name} Publishing Plan`,
          order_id: orderData.order_id,
          prefill: {
            email: userEmail,
            name: userName,
          },
          theme: { color: "#89E900" },
          handler: async (response: {
            razorpay_order_id: string;
            razorpay_payment_id: string;
            razorpay_signature: string;
          }) => {
            // 4. Verify payment on server
            const verifyRes = await fetch("/api/payment/verify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                plan: selected,
              }),
            });

            const verifyData = await verifyRes.json();
            if (!verifyRes.ok || verifyData.error) {
              setError("Payment verification failed. Contact support.");
              return;
            }

            // 5. Redirect to submit app
            router.push("/dashboard/developer/apps/new?activated=true");
            router.refresh();
          },
          modal: {
            ondismiss: () => setError("Payment cancelled. Please try again."),
          },
        };

        const rzp = new (window as any).Razorpay(options);
        rzp.open();
      } catch (err) {
        setError("Something went wrong. Please try again.");
        console.error(err);
      }
    });
  };

  if (hasDeveloperProfile) {
    return (
      <Card className="py-12 text-center">
        <CheckCircle className="mx-auto h-12 w-12 text-primary" />
        <h2 className="mt-4 text-xl font-bold">You&apos;re Already a Developer!</h2>
        <p className="mt-2 text-secondary-400">Submit a new app from your developer dashboard.</p>
        <Button className="mt-6" onClick={() => router.push("/dashboard/developer/apps/new")}>
          Submit New App
        </Button>
      </Card>
    );
  }

  return (
    <div>
      {isFirstTime && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 rounded-2xl border border-primary/30 bg-primary/8 p-5 text-center"
        >
          <p className="font-semibold text-primary">
            🎉 Welcome! First-time publishers get their first app listed for just ₹1.
          </p>
        </motion.div>
      )}

      {/* Plans */}
      <div className={`grid gap-5 ${isFirstTime ? "sm:grid-cols-2 lg:grid-cols-4" : "sm:grid-cols-3"}`}>
        {plans.map((plan, i) => (
          <motion.button
            key={plan.id}
            type="button"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            onClick={() => setSelected(plan.id)}
            className={`relative rounded-2xl border p-5 text-left transition-all ${
              selected === plan.id
                ? "border-primary bg-primary/10 shadow-glow"
                : plan.highlight
                ? "border-primary/30 bg-primary/5"
                : "border-white/10 bg-white/3 hover:border-primary/25"
            }`}
          >
            {plan.badge && (
              <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-0.5 text-[11px] font-bold text-night-900 whitespace-nowrap">
                {plan.badge}
              </span>
            )}
            <div className="flex items-center gap-2 text-primary mb-3">
              {plan.icon}
              <span className="font-heading font-semibold">{plan.name}</span>
            </div>
            <div className="mb-4">
              <span className="font-heading text-3xl font-bold">{plan.displayPrice}</span>
              <span className="ml-1 text-xs text-secondary-500">per app</span>
            </div>
            <ul className="space-y-2">
              {plan.features.map((f) => (
                <li key={f} className="flex items-start gap-2 text-xs text-secondary-300">
                  <CheckCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                  {f}
                </li>
              ))}
            </ul>
            {selected === plan.id && (
              <div className="absolute right-3 top-3">
                <CheckCircle className="h-5 w-5 text-primary" />
              </div>
            )}
          </motion.button>
        ))}
      </div>

      {/* Summary + CTA */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="mt-8 rounded-2xl border border-primary/20 bg-primary/5 p-6"
      >
        {error && (
          <div className="mb-4 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
            {error}
          </div>
        )}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <p className="font-semibold">
              {selectedPlan.name} Plan —{" "}
              <span className="text-primary">{selectedPlan.displayPrice}</span>
            </p>
            <p className="mt-1 text-sm text-secondary-400">
              One-time fee · Secure payment via Razorpay · Money goes to your bank account
            </p>
          </div>
          <Button size="lg" onClick={handlePay} disabled={isPending} className="shrink-0 gap-2">
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Zap className="h-4 w-4" />
            )}
            {isPending ? "Opening payment..." : `Pay ${selectedPlan.displayPrice}`}
          </Button>
        </div>
        <p className="mt-3 text-xs text-secondary-500">
          🔒 Payments are processed securely by Razorpay. You&apos;ll receive a receipt by email.
        </p>
      </motion.div>
    </div>
  );
}
