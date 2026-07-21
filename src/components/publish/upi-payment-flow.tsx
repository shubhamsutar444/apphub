"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle, Upload, Loader2, Copy, Check,
  Smartphone, ArrowRight, Clock, Shield, Gift, Star, Zap, Crown
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { uploadFileDirect } from "@/lib/utils/upload-client";
import { submitPaymentScreenshotAction } from "@/lib/actions/payment-manual";

interface UpiPaymentFlowProps {
  userId: string;
  userEmail: string;
  userName: string;
  hasPendingPayment: boolean;
  isFirstTime: boolean;
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

const UPI_ID = "shubhamsutar81981-3@okhdfcbank"; // Updated from user image

function Steps({ current }: { current: number }) {
  const steps = ["Select Plan", "Pay via UPI", "Upload Proof", "Get Verified"];
  return (
    <div className="mb-8 flex items-center justify-center">
      {steps.map((label, i) => (
        <div key={label} className="flex items-center">
          <div className="flex flex-col items-center">
            <div className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold transition-all ${
              i < current ? "bg-primary text-night-900"
              : i === current ? "border-2 border-primary bg-primary/15 text-primary"
              : "border-2 border-white/15 bg-white/5 text-secondary-500"
            }`}>
              {i < current ? <CheckCircle className="h-4 w-4" /> : i + 1}
            </div>
            <span className={`mt-1.5 whitespace-nowrap text-[11px] font-medium ${i === current ? "text-primary" : "text-secondary-500"}`}>
              {label}
            </span>
          </div>
          {i < steps.length - 1 && (
            <div className={`mx-2 mb-5 h-px w-8 sm:w-12 transition-all ${i < current ? "bg-primary" : "bg-white/10"}`} />
          )}
        </div>
      ))}
    </div>
  );
}

export function UpiPaymentFlow({
  userId,
  userEmail,
  userName,
  hasPendingPayment,
  isFirstTime,
}: UpiPaymentFlowProps) {
  const [step, setStep] = useState<"select" | "pay" | "upload" | "done">(
    hasPendingPayment ? "done" : "select"
  );
  const [selectedPlanId, setSelectedPlanId] = useState<Plan["id"]>(
    isFirstTime ? "starter" : "basic"
  );
  const [copied, setCopied] = useState(false);
  const [screenshotUrl, setScreenshotUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const plans: Plan[] = [
    ...(isFirstTime
      ? [
          {
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
          },
        ]
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

  const selectedPlan = plans.find((p) => p.id === selectedPlanId)!;

  const copyUpi = async () => {
    await navigator.clipboard.writeText(UPI_ID).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleFileUpload = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      setUploadError("Please upload an image file");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setUploadError("File too large. Max 10MB.");
      return;
    }
    setUploadError("");
    setUploading(true);
    const result = await uploadFileDirect(file, "app-screenshots", userId);
    setUploading(false);
    if (result.error) {
      setUploadError(result.error);
      return;
    }
    setScreenshotUrl(result.url!);
  };

  const handleSubmit = async () => {
    if (!screenshotUrl) return;
    setSubmitting(true);
    setSubmitError("");
    const result = await submitPaymentScreenshotAction({
      userId,
      userEmail,
      userName,
      screenshotUrl,
      plan: selectedPlan.id,
      amountPaise: selectedPlan.price,
    });
    setSubmitting(false);
    if (result.error) {
      setSubmitError(result.error);
      return;
    }
    setStep("done");
  };

  const stepIndex =
    step === "select" ? 0 : step === "pay" ? 1 : step === "upload" ? 2 : 3;

  return (
    <div className="mx-auto max-w-4xl">
      {/* Header */}
      <div className="mb-6 text-center">
        <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/15 ring-2 ring-primary/25">
          <Smartphone className="h-7 w-7 text-primary" />
        </div>
        <span className="badge-kiwi">🚀 Become a Developer</span>
        <h1 className="mt-3 font-heading text-2xl font-bold sm:text-3xl">Publish Your App</h1>
        <p className="mt-2 text-sm text-secondary-400">
          Activate developer profile and start listing apps
        </p>
      </div>

      <Steps current={stepIndex} />

      <AnimatePresence mode="wait">
        {/* ── Step 1: Select Plan ────────────────────────────── */}
        {step === "select" && (
          <motion.div
            key="select"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.2 }}
          >
            {isFirstTime && (
              <div className="mb-8 rounded-2xl border border-primary/30 bg-primary/8 p-5 text-center">
                <p className="font-semibold text-primary">
                  🎉 Welcome! First-time publishers get their first app listed for just ₹1.
                </p>
              </div>
            )}

            {/* Plans Grid */}
            <div className={`grid gap-5 ${isFirstTime ? "sm:grid-cols-2 lg:grid-cols-4" : "sm:grid-cols-3"}`}>
              {plans.map((plan) => (
                <button
                  key={plan.id}
                  type="button"
                  onClick={() => setSelectedPlanId(plan.id)}
                  className={`relative rounded-2xl border p-5 text-left transition-all ${
                    selectedPlanId === plan.id
                      ? "border-primary bg-primary/10 shadow-glow ring-1 ring-primary/30"
                      : plan.highlight
                      ? "border-primary/30 bg-primary/5 hover:border-primary/50"
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
                  {selectedPlanId === plan.id && (
                    <div className="absolute right-3 top-3">
                      <CheckCircle className="h-5 w-5 text-primary" />
                    </div>
                  )}
                </button>
              ))}
            </div>

            {/* Summary + Next Button */}
            <div className="mt-8 rounded-2xl border border-primary/20 bg-primary/5 p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <p className="font-semibold text-lg">
                  {selectedPlan.name} Plan —{" "}
                  <span className="text-primary">{selectedPlan.displayPrice}</span>
                </p>
                <p className="mt-1 text-sm text-secondary-400">
                  Secure manual UPI payment. Verify and get activated manually by admin.
                </p>
              </div>
              <Button size="lg" onClick={() => setStep("pay")} className="shrink-0 gap-2">
                Proceed to Payment
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </motion.div>
        )}

        {/* ── Step 2: UPI QR Payment ─────────────────────────── */}
        {step === "pay" && (
          <motion.div
            key="pay"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.2 }}
            className="mx-auto max-w-md"
          >
            <div className="rounded-3xl border border-primary/20 bg-night-900/80 p-6 shadow-glow">
              {/* Plan Header */}
              <div className="mb-5 text-center">
                <span className="text-xs uppercase tracking-wider text-secondary-400">Selected Plan</span>
                <h3 className="text-lg font-bold text-white">{selectedPlan.name}</h3>
                <div className="mt-2.5 inline-flex items-baseline gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-6 py-2">
                  <span className="font-heading text-3xl font-bold text-primary">{selectedPlan.displayPrice}</span>
                  <span className="text-xs text-secondary-400">one-time</span>
                </div>
              </div>

              {/* QR Code */}
              <div className="mx-auto mb-5 h-64 w-64 overflow-hidden rounded-2xl border-4 border-primary/30 bg-white p-2 shadow-lg">
                <div className="relative h-full w-full">
                  <Image
                    src="/upi-qr.png"
                    alt="UPI QR Code"
                    fill
                    className="object-contain"
                    sizes="256px"
                    priority
                  />
                </div>
              </div>

              <p className="mb-2 text-center text-xs text-secondary-400">or send to UPI ID</p>

              {/* UPI ID copy */}
              <div className="mx-auto mb-6 flex max-w-xs items-center justify-between gap-2 rounded-xl border border-primary/20 bg-primary/5 px-3 py-2">
                <span className="min-w-0 truncate font-mono text-sm font-semibold text-primary">{UPI_ID}</span>
                <button
                  type="button"
                  onClick={copyUpi}
                  className="flex shrink-0 items-center gap-1 rounded-lg bg-primary/15 px-2.5 py-1 text-xs font-bold text-primary transition-colors hover:bg-primary/25"
                >
                  {copied ? <><Check className="h-3 w-3" />Copied</> : <><Copy className="h-3 w-3" />Copy</>}
                </button>
              </div>

              {/* Step Directions */}
              <ol className="mb-6 space-y-3">
                {[
                  "Scan QR using GPay, PhonePe, Paytm, or any UPI app.",
                  `Send exactly ${selectedPlan.displayPrice} to Shubham Sutar.`,
                  "Save or screenshot the successful transaction receipt.",
                  "Click proceed to upload the screenshot for review.",
                ].map((s, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/20 text-xs font-bold text-primary mt-0.5">
                      {i + 1}
                    </span>
                    <p className="text-sm text-secondary-300">{s}</p>
                  </li>
                ))}
              </ol>

              <div className="flex gap-3">
                <Button variant="secondary" onClick={() => setStep("select")} className="flex-1">
                  ← Change Plan
                </Button>
                <Button className="flex-1 gap-2" onClick={() => setStep("upload")}>
                  I&apos;ve Paid
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </motion.div>
        )}

        {/* ── Step 3: Upload Screenshot ──────────────────────── */}
        {step === "upload" && (
          <motion.div
            key="upload"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.2 }}
            className="mx-auto max-w-md"
          >
            <div className="rounded-3xl border border-primary/20 bg-night-900/80 p-6">
              <h2 className="mb-1 text-center font-heading text-xl font-bold">Upload Payment Screenshot</h2>
              <p className="mb-5 text-center text-sm text-secondary-400">
                Upload proof of sending {selectedPlan.displayPrice} to {UPI_ID}
              </p>

              {/* Upload zone */}
              <div
                onClick={() => inputRef.current?.click()}
                className={`cursor-pointer rounded-2xl border-2 border-dashed p-6 text-center transition-all ${
                  screenshotUrl
                    ? "border-primary/40 bg-primary/5"
                    : "border-white/15 bg-white/3 hover:border-primary/30 hover:bg-primary/3"
                }`}
              >
                <input
                  ref={inputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleFileUpload(f);
                  }}
                />

                {uploading ? (
                  <div className="flex flex-col items-center gap-2">
                    <Loader2 className="h-10 w-10 animate-spin text-primary" />
                    <p className="text-sm text-secondary-400">Uploading...</p>
                  </div>
                ) : screenshotUrl ? (
                  <div className="flex flex-col items-center gap-3">
                    <div className="relative h-44 w-32 overflow-hidden rounded-xl border-2 border-primary/30 shadow-lg">
                      <Image src={screenshotUrl} alt="Payment proof" fill className="object-cover" sizes="128px" />
                    </div>
                    <p className="flex items-center gap-1.5 text-sm font-medium text-primary">
                      <CheckCircle className="h-4 w-4" /> Screenshot ready
                    </p>
                    <p className="text-xs text-secondary-500">Tap to change</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-3">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
                      <Upload className="h-7 w-7 text-primary" />
                    </div>
                    <p className="font-medium">Tap to upload screenshot</p>
                    <p className="text-xs text-secondary-500">PNG, JPG · Max 10 MB</p>
                  </div>
                )}
              </div>

              {uploadError && <p className="mt-2 text-sm text-red-400">{uploadError}</p>}
              {submitError && (
                <div className="mt-3 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
                  {submitError}
                </div>
              )}

              <div className="mt-5 flex gap-3">
                <Button variant="secondary" onClick={() => setStep("pay")} className="flex-1">
                  ← Back
                </Button>
                <Button className="flex-1 gap-2" disabled={!screenshotUrl || submitting} onClick={handleSubmit}>
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Shield className="h-4 w-4" />
                      Submit Proof
                    </>
                  )}
                </Button>
              </div>
              <p className="mt-3 text-center text-xs text-secondary-500">
                Admin will verify payment and activate developer profile.
              </p>
            </div>
          </motion.div>
        )}

        {/* ── Step 4: Pending Verification ───────────────────── */}
        {step === "done" && (
          <motion.div
            key="done"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.25 }}
            className="mx-auto max-w-md"
          >
            <div className="rounded-3xl border border-primary/25 bg-night-900/80 p-6 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-yellow-500/15 ring-2 ring-yellow-500/25">
                <Clock className="h-8 w-8 text-yellow-400" />
              </div>
              <h2 className="font-heading text-2xl font-bold">Under Review</h2>
              <p className="mt-2 text-secondary-400">
                Your payment screenshot has been submitted. Admin will verify and activate your developer profile shortly.
              </p>

              <div className="mt-6 space-y-2.5 text-left">
                {[
                  { icon: CheckCircle, label: "Screenshot submitted", color: "text-primary" },
                  { icon: Clock, label: "Admin verification pending (within 12h)", color: "text-yellow-400" },
                  { icon: Smartphone, label: "Developer dashboard activated on success", color: "text-secondary-400" },
                ].map(({ icon: Icon, label, color }) => (
                  <div key={label} className="flex items-center gap-3 rounded-xl border border-white/5 bg-white/3 p-3">
                    <Icon className={`h-5 w-5 shrink-0 ${color}`} />
                    <span className="text-sm">{label}</span>
                  </div>
                ))}
              </div>

              <a href="/dashboard/user">
                <Button variant="secondary" className="mt-6 w-full">
                  Go to Dashboard
                </Button>
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
