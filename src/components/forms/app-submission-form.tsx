"use client";

import { useActionState, useState, useRef, useEffect } from "react";
import {
  Loader2, Info, Upload, X, CheckCircle, FileText, Image as ImageIcon,
} from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { submitAppAction } from "@/lib/actions/apps";
import { uploadFileDirect } from "@/lib/utils/upload-client";
import { createClient } from "@/lib/supabase/client";
import type { Category } from "@/types";

const PLANS = [
  { id: "basic" as const,    name: "Basic",    price: "₹99",  desc: "Standard listing · 24–72h review" },
  { id: "priority" as const, name: "Priority", price: "₹299", desc: "Highlighted · 12–24h review" },
  { id: "featured" as const, name: "Featured", price: "₹999", desc: "Homepage feature · 6–12h review" },
];

interface AppSubmissionFormProps {
  categories: Category[];
  defaultPlan?: "basic" | "priority" | "featured";
  isAdmin?: boolean;
}

function FileUploadZone({
  label, accept, hint, onUpload, uploading, uploadedUrl, fileName,
}: {
  label: string;
  accept: string;
  hint: string;
  onUpload: (file: File) => Promise<void>;
  uploading: boolean;
  uploadedUrl: string;
  fileName: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) await onUpload(file);
  };

  const isImage = accept.includes("image");

  return (
    <div>
      <label className="mb-2 block text-sm font-medium">{label}</label>
      <div
        onClick={() => inputRef.current?.click()}
        className={`relative cursor-pointer rounded-2xl border-2 border-dashed p-6 text-center transition-all ${
          uploadedUrl
            ? "border-primary/40 bg-primary/5"
            : "border-white/15 bg-white/3 hover:border-primary/30 hover:bg-primary/3"
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          className="hidden"
          onChange={handleChange}
        />

        {uploading ? (
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-secondary-400">Uploading...</p>
          </div>
        ) : uploadedUrl && isImage ? (
          <div className="flex flex-col items-center gap-2">
            <div className="relative h-20 w-20 overflow-hidden rounded-xl">
              <Image src={uploadedUrl} alt="Uploaded" fill className="object-cover" sizes="80px" />
            </div>
            <p className="text-xs text-primary flex items-center gap-1">
              <CheckCircle className="h-3.5 w-3.5" /> {fileName}
            </p>
            <p className="text-xs text-secondary-500">Click to change</p>
          </div>
        ) : uploadedUrl ? (
          <div className="flex flex-col items-center gap-2">
            <FileText className="h-8 w-8 text-primary" />
            <p className="text-xs text-primary flex items-center gap-1">
              <CheckCircle className="h-3.5 w-3.5" /> {fileName}
            </p>
            <p className="text-xs text-secondary-500">Click to change</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            {isImage ? (
              <ImageIcon className="h-8 w-8 text-secondary-500" />
            ) : (
              <Upload className="h-8 w-8 text-secondary-500" />
            )}
            <p className="text-sm text-secondary-400">Click to upload</p>
            <p className="text-xs text-secondary-600">{hint}</p>
          </div>
        )}
      </div>
    </div>
  );
}

function ScreenshotsUpload({
  screenshots,
  onAdd,
  onRemove,
  uploading,
}: {
  screenshots: { url: string; name: string }[];
  onAdd: (file: File) => Promise<void>;
  onRemove: (i: number) => void;
  uploading: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div>
      <label className="mb-2 block text-sm font-medium">
        Screenshots <span className="text-secondary-500 text-xs">(up to 8)</span>
      </label>
      <div className="flex flex-wrap gap-3">
        {screenshots.map((ss, i) => (
          <div key={i} className="relative">
            <div className="relative h-28 w-16 overflow-hidden rounded-xl ring-1 ring-white/10">
              <Image src={ss.url} alt={`Screenshot ${i + 1}`} fill className="object-cover" sizes="64px" />
            </div>
            <button
              type="button"
              onClick={() => onRemove(i)}
              className="absolute -right-1.5 -top-1.5 rounded-full bg-red-500 p-0.5 text-white"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ))}

        {screenshots.length < 8 && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="flex h-28 w-16 flex-col items-center justify-center rounded-xl border-2 border-dashed border-white/15 text-secondary-500 transition-all hover:border-primary/30 hover:text-primary"
          >
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={async (e) => {
                const f = e.target.files?.[0];
                if (f) await onAdd(f);
                e.target.value = "";
              }}
            />
            {uploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Upload className="h-5 w-5" />}
            <span className="mt-1 text-[10px]">Add</span>
          </button>
        )}
      </div>
      <p className="mt-1 text-xs text-secondary-500">PNG/JPG, max 5MB each</p>
    </div>
  );
}

export function AppSubmissionForm({ categories, defaultPlan = "basic" }: AppSubmissionFormProps) {
  const [selectedPlan, setSelectedPlan] = useState<"basic" | "priority" | "featured">(defaultPlan);
  const [state, formAction, pending] = useActionState(submitAppAction, {});

  // Get current user ID for upload paths
  const [userId, setUserId] = useState("");
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) setUserId(data.user.id);
    });
  }, []);

  // File upload state
  const [apkUrl, setApkUrl] = useState("");
  const [apkPath, setApkPath] = useState("");
  const [apkName, setApkName] = useState("");
  const [apkSizeBytes, setApkSizeBytes] = useState(0);
  const [apkUploading, setApkUploading] = useState(false);
  const [apkError, setApkError] = useState("");
  const [apkProgress, setApkProgress] = useState(0);

  const [iconUrl, setIconUrl] = useState("");
  const [iconUploading, setIconUploading] = useState(false);
  const [iconError, setIconError] = useState("");
  const [iconName, setIconName] = useState("");

  const [bannerUrl, setBannerUrl] = useState("");
  const [bannerUploading, setBannerUploading] = useState(false);
  const [bannerName, setBannerName] = useState("");

  const [screenshots, setScreenshots] = useState<{ url: string; name: string }[]>([]);
  const [ssUploading, setSsUploading] = useState(false);

  // Direct browser → Supabase upload (no server middleman = fast)
  const uploadApk = async (file: File) => {
    setApkUploading(true);
    setApkError("");
    setApkProgress(10);
    const result = await uploadFileDirect(file, "app-apks", userId);
    setApkProgress(100);
    setApkUploading(false);
    setApkProgress(0);
    if (result.error) { setApkError(result.error); return; }
    setApkUrl(result.url!);
    setApkPath(result.path!);
    setApkName(file.name);
    setApkSizeBytes(result.sizeBytes ?? file.size); // auto-detect size
  };

  const uploadIcon = async (file: File) => {
    setIconUploading(true);
    setIconError("");
    const result = await uploadFileDirect(file, "app-icons", userId);
    setIconUploading(false);
    if (result.error) { setIconError(result.error); return; }
    setIconUrl(result.url!);
    setIconName(file.name);
  };

  const uploadBanner = async (file: File) => {
    setBannerUploading(true);
    const result = await uploadFileDirect(file, "app-banners", userId);
    setBannerUploading(false);
    if (result.error) return;
    setBannerUrl(result.url!);
    setBannerName(file.name);
  };

  const addScreenshot = async (file: File) => {
    setSsUploading(true);
    const result = await uploadFileDirect(file, "app-screenshots", userId);
    setSsUploading(false);
    if (result.error) return;
    setScreenshots((prev) => [...prev, { url: result.url!, name: file.name }]);
  };

  const removeScreenshot = (i: number) => {
    setScreenshots((prev) => prev.filter((_, idx) => idx !== i));
  };

  return (
    <form action={formAction} className="space-y-8">
      {/* Hidden fields for uploaded files */}
      <input type="hidden" name="apk_url" value={apkUrl} />
      <input type="hidden" name="apk_path" value={apkPath} />
      <input type="hidden" name="apk_size_bytes" value={apkSizeBytes} />
      <input type="hidden" name="icon_url" value={iconUrl} />
      <input type="hidden" name="banner_url" value={bannerUrl} />
      <input type="hidden" name="screenshots" value={JSON.stringify(screenshots.map((s) => s.url))} />
      <input type="hidden" name="publishing_plan" value={selectedPlan} />

      {state.error && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {state.error}
        </div>
      )}

      {/* ── App Info ─────────────────────────────────────────────── */}
      <Card>
        <h2 className="mb-6 font-heading text-lg font-semibold">App Information</h2>
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium">
                App Name <span className="text-red-400">*</span>
              </label>
              <Input name="name" placeholder="My Awesome App" required maxLength={100} />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium">
                Category <span className="text-red-400">*</span>
              </label>
              <Select name="category_id" required>
                <option value="">Select a category</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.icon} {cat.name}</option>
                ))}
              </Select>
            </div>
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium">
              Short Description <span className="text-red-400">*</span>
            </label>
            <Input name="short_description" placeholder="One-liner tagline (max 200 chars)" required maxLength={200} />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium">
              Full Description <span className="text-red-400">*</span>
            </label>
            <Textarea name="full_description" placeholder="Detailed description of your app..." rows={5} required minLength={50} maxLength={5000} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium">
                Version <span className="text-red-400">*</span>
              </label>
              <Input name="version" placeholder="1.0.0" required maxLength={20} />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium">Tags</label>
              <Input name="tags" placeholder="utility, free, offline (comma separated)" />
            </div>
          </div>
        </div>
      </Card>

      {/* ── File Uploads ──────────────────────────────────────────── */}
      <Card>
        <h2 className="mb-6 font-heading text-lg font-semibold">App Files & Assets</h2>
        <div className="space-y-6">

          {/* APK */}
          <div>
            <FileUploadZone
              label="APK File *"
              accept=".apk"
              hint=".apk only · max 150 MB · uploads directly to storage"
              onUpload={uploadApk}
              uploading={apkUploading}
              uploadedUrl={apkUrl}
              fileName={apkName}
            />
            {apkUploading && apkProgress > 0 && (
              <div className="mt-2">
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full bg-primary transition-all duration-300 animate-pulse"
                    style={{ width: `${apkProgress}%` }}
                  />
                </div>
                <p className="mt-1 text-xs text-primary">Uploading directly to storage...</p>
              </div>
            )}
            {apkError && <p className="mt-1 text-xs text-red-400">{apkError}</p>}
            {!apkUrl && !apkUploading && (
              <p className="mt-1 text-xs text-secondary-500">APK required · uploads go directly from your browser to storage (fast)</p>
            )}
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            {/* Icon */}
            <div>
              <FileUploadZone
                label="App Icon *"
                accept="image/*"
                hint="512×512 PNG recommended · max 2 MB"
                onUpload={uploadIcon}
                uploading={iconUploading}
                uploadedUrl={iconUrl}
                fileName={iconName}
              />
              {iconError && <p className="mt-1 text-xs text-red-400">{iconError}</p>}
            </div>

            {/* Banner */}
            <FileUploadZone
              label="Banner Image (optional)"
              accept="image/*"
              hint="1024×500 PNG recommended · max 5 MB"
              onUpload={uploadBanner}
              uploading={bannerUploading}
              uploadedUrl={bannerUrl}
              fileName={bannerName}
            />
          </div>

          {/* Screenshots */}
          <ScreenshotsUpload
            screenshots={screenshots}
            onAdd={addScreenshot}
            onRemove={removeScreenshot}
            uploading={ssUploading}
          />
        </div>
      </Card>

      {/* ── Links ─────────────────────────────────────────────────── */}
      <Card>
        <h2 className="mb-6 font-heading text-lg font-semibold">Links & Contact</h2>
        <div className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-medium">Developer Website</label>
            <Input name="developer_website" type="url" placeholder="https://yourwebsite.com" />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium">Privacy Policy URL</label>
            <Input name="privacy_policy_url" type="url" placeholder="https://yourwebsite.com/privacy" />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium">Support Email</label>
            <Input name="support_email" type="email" placeholder="support@yourapp.com" />
          </div>
        </div>
      </Card>

      {/* ── Plan ──────────────────────────────────────────────────── */}
      <Card>
        <h2 className="mb-2 font-heading text-lg font-semibold">Publishing Plan</h2>
        <p className="mb-5 text-sm text-secondary-400">Select your listing tier</p>
        <div className="grid gap-4 sm:grid-cols-3">
          {PLANS.map((plan) => (
            <button
              key={plan.id}
              type="button"
              onClick={() => setSelectedPlan(plan.id)}
              className={`rounded-2xl border p-5 text-left transition-all ${
                selectedPlan === plan.id
                  ? "border-primary bg-primary/10 shadow-glow"
                  : "border-white/10 bg-white/3 hover:border-primary/25"
              }`}
            >
              <p className="font-heading font-semibold">{plan.name}</p>
              <p className="mt-1 font-heading text-2xl font-bold text-primary">{plan.price}</p>
              <p className="mt-2 text-xs text-secondary-400">{plan.desc}</p>
            </button>
          ))}
        </div>
        <div className="mt-4 flex items-start gap-2 rounded-xl border border-primary/15 bg-primary/5 px-4 py-3">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
          <p className="text-xs text-secondary-300">
            Payment was collected when you chose your publishing plan. Your app goes live after admin review.
          </p>
        </div>
      </Card>

      {/* Submit */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <p className="text-sm text-secondary-500">
          By submitting, you agree to AppHub&apos;s developer policies.
        </p>
        <Button
          type="submit"
          size="lg"
          disabled={pending || !apkUrl || !iconUrl}
          className="gap-2 shrink-0"
        >
          {pending ? (
            <><Loader2 className="h-4 w-4 animate-spin" /> Submitting...</>
          ) : (
            <>Submit for Review</>
          )}
        </Button>
      </div>
      {(!apkUrl || !iconUrl) && (
        <p className="text-xs text-yellow-400">
          ⚠ Please upload the APK file and app icon before submitting.
        </p>
      )}
    </form>
  );
}
