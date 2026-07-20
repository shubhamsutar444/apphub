"use client";

import { useActionState, useState, useRef, useEffect } from "react";
import Image from "next/image";
import {
  Loader2, AlertTriangle, CheckCircle, Clock,
  Send, Upload, X, FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { updateAppAction } from "@/lib/actions/apps";
import { uploadFileDirect } from "@/lib/utils/upload-client";
import { createClient } from "@/lib/supabase/client";
import type { Application, ApplicationScreenshot, Category } from "@/types";

interface AppEditFormProps {
  app: Application;
  categories: Category[];
  existingScreenshots: ApplicationScreenshot[];
  currentApkUrl: string;
  currentApkVersion: string;
}

// ── Status Banner ──────────────────────────────────────────────────────────────
function StatusBanner({ app }: { app: Application }) {
  if (app.status === "changes_requested") {
    return (
      <div className="rounded-2xl border border-yellow-500/30 bg-yellow-500/10 p-5">
        <div className="flex items-start gap-3">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-yellow-400" />
          <div>
            <p className="font-semibold text-yellow-400">Changes Requested by Admin</p>
            {app.admin_notes && (
              <p className="mt-1 text-sm text-yellow-300/80">{app.admin_notes}</p>
            )}
            <p className="mt-2 text-xs text-yellow-400/60">
              Make the requested changes and click <strong>&quot;Save &amp; Re-submit&quot;</strong>. Admin will be notified automatically.
            </p>
          </div>
        </div>
      </div>
    );
  }
  if (app.status === "pending_review") {
    return (
      <div className="rounded-2xl border border-blue-500/20 bg-blue-500/8 p-4">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-blue-400" />
          <p className="text-sm text-blue-300">App is currently <strong>under review</strong>.</p>
        </div>
      </div>
    );
  }
  if (app.status === "rejected") {
    return (
      <div className="rounded-2xl border border-red-500/20 bg-red-500/8 p-4">
        <div className="flex items-start gap-3">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-400" />
          <div>
            <p className="text-sm font-medium text-red-400">App Rejected</p>
            {app.rejection_reason && <p className="mt-1 text-xs text-red-300/80">{app.rejection_reason}</p>}
          </div>
        </div>
      </div>
    );
  }
  if (app.status === "approved") {
    return (
      <div className="rounded-2xl border border-primary/20 bg-primary/8 p-4">
        <div className="flex items-center gap-2">
          <CheckCircle className="h-4 w-4 text-primary" />
          <p className="text-sm text-primary">App is <strong>Live</strong>. Changes saved will update the listing.</p>
        </div>
      </div>
    );
  }
  return null;
}

// ── Single file upload zone ────────────────────────────────────────────────────
function FileUploadZone({
  label, accept, hint, onUpload, uploading, uploadedUrl, fileName, currentUrl,
}: {
  label: string; accept: string; hint: string;
  onUpload: (f: File) => Promise<void>;
  uploading: boolean; uploadedUrl: string; fileName: string; currentUrl?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const displayUrl = uploadedUrl || currentUrl || "";
  const isImage = accept.includes("image");

  return (
    <div>
      <label className="mb-2 block text-sm font-medium">{label}</label>
      <div
        onClick={() => inputRef.current?.click()}
        className={`relative cursor-pointer rounded-2xl border-2 border-dashed p-5 text-center transition-all ${
          displayUrl ? "border-primary/40 bg-primary/5" : "border-white/15 bg-white/3 hover:border-primary/30"
        }`}
      >
        <input ref={inputRef} type="file" accept={accept} className="hidden"
          onChange={async (e) => { const f = e.target.files?.[0]; if (f) await onUpload(f); }} />
        {uploading ? (
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="h-7 w-7 animate-spin text-primary" />
            <p className="text-sm text-secondary-400">Uploading...</p>
          </div>
        ) : displayUrl && isImage ? (
          <div className="flex flex-col items-center gap-2">
            <div className="relative h-16 w-16 overflow-hidden rounded-xl">
              <Image src={displayUrl} alt="preview" fill className="object-cover" sizes="64px" />
            </div>
            <p className="text-xs text-primary flex items-center gap-1">
              <CheckCircle className="h-3.5 w-3.5" />
              {fileName || "Current file"}
            </p>
            <p className="text-xs text-secondary-500">Click to replace</p>
          </div>
        ) : displayUrl ? (
          <div className="flex flex-col items-center gap-2">
            <FileText className="h-7 w-7 text-primary" />
            <p className="text-xs text-primary flex items-center gap-1">
              <CheckCircle className="h-3.5 w-3.5" />
              {fileName || "Current APK uploaded"}
            </p>
            <p className="text-xs text-secondary-500">Click to replace</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <Upload className="h-7 w-7 text-secondary-500" />
            <p className="text-sm text-secondary-400">Click to upload</p>
            <p className="text-xs text-secondary-600">{hint}</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Screenshots manager ────────────────────────────────────────────────────────
function ScreenshotsManager({
  existing, added, onAdd, onRemoveExisting, onRemoveAdded, uploading,
}: {
  existing: ApplicationScreenshot[];
  added: { url: string; name: string }[];
  onAdd: (f: File) => Promise<void>;
  onRemoveExisting: (id: string) => void;
  onRemoveAdded: (i: number) => void;
  uploading: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const total = existing.length + added.length;

  return (
    <div>
      <label className="mb-2 block text-sm font-medium">
        Screenshots <span className="text-xs text-secondary-500">({total}/8)</span>
      </label>
      <div className="flex flex-wrap gap-3">
        {/* Existing */}
        {existing.map((ss) => (
          <div key={ss.id} className="relative">
            <div className="relative h-28 w-16 overflow-hidden rounded-xl ring-1 ring-white/10">
              <Image src={ss.url} alt="screenshot" fill className="object-cover" sizes="64px" />
            </div>
            <button type="button" onClick={() => onRemoveExisting(ss.id)}
              className="absolute -right-1.5 -top-1.5 rounded-full bg-red-500 p-0.5 text-white">
              <X className="h-3 w-3" />
            </button>
          </div>
        ))}
        {/* Newly added */}
        {added.map((ss, i) => (
          <div key={i} className="relative">
            <div className="relative h-28 w-16 overflow-hidden rounded-xl ring-1 ring-primary/30">
              <Image src={ss.url} alt="new screenshot" fill className="object-cover" sizes="64px" />
            </div>
            <button type="button" onClick={() => onRemoveAdded(i)}
              className="absolute -right-1.5 -top-1.5 rounded-full bg-red-500 p-0.5 text-white">
              <X className="h-3 w-3" />
            </button>
          </div>
        ))}
        {/* Add button */}
        {total < 8 && (
          <button type="button" onClick={() => inputRef.current?.click()} disabled={uploading}
            className="flex h-28 w-16 flex-col items-center justify-center rounded-xl border-2 border-dashed border-white/15 text-secondary-500 hover:border-primary/30 hover:text-primary transition-colors">
            <input ref={inputRef} type="file" accept="image/*" className="hidden"
              onChange={async (e) => { const f = e.target.files?.[0]; if (f) { await onAdd(f); e.target.value = ""; } }} />
            {uploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Upload className="h-5 w-5" />}
            <span className="mt-1 text-[10px]">Add</span>
          </button>
        )}
      </div>
      <p className="mt-1 text-xs text-secondary-500">PNG/JPG max 5MB each. Click ✕ to remove existing.</p>
    </div>
  );
}

// ── Main Edit Form ─────────────────────────────────────────────────────────────
export function AppEditForm({
  app, categories, existingScreenshots, currentApkUrl, currentApkVersion,
}: AppEditFormProps) {
  const [state, formAction, pending] = useActionState(updateAppAction, {});
  const isChangesRequested = app.status === "changes_requested";

  // Auth
  const [userId, setUserId] = useState("");
  useEffect(() => {
    createClient().auth.getUser().then(({ data }) => { if (data.user) setUserId(data.user.id); });
  }, []);

  // Icon
  const [iconUrl, setIconUrl] = useState("");
  const [iconName, setIconName] = useState("");
  const [iconUploading, setIconUploading] = useState(false);

  // Banner
  const [bannerUrl, setBannerUrl] = useState("");
  const [bannerName, setBannerName] = useState("");
  const [bannerUploading, setBannerUploading] = useState(false);

  // APK
  const [apkUrl, setApkUrl] = useState("");
  const [apkPath, setApkPath] = useState("");
  const [apkName, setApkName] = useState("");
  const [apkUploading, setApkUploading] = useState(false);
  const [apkError, setApkError] = useState("");

  // Screenshots
  const [existingSS, setExistingSS] = useState<ApplicationScreenshot[]>(existingScreenshots);
  const [addedSS, setAddedSS] = useState<{ url: string; name: string }[]>([]);
  const [ssUploading, setSsUploading] = useState(false);

  const upload = async (
    file: File,
    bucket: "app-icons" | "app-banners" | "app-apks" | "app-screenshots",
    setUrl: (u: string) => void,
    setName: (n: string) => void,
    setLoading: (b: boolean) => void,
    setError?: (e: string) => void
  ) => {
    setLoading(true);
    if (setError) setError("");
    const result = await uploadFileDirect(file, bucket, userId);
    setLoading(false);
    if (result.error) { if (setError) setError(result.error); return; }
    setUrl(result.url!);
    setName(file.name);
  };

  // Combined screenshots for submission — existing kept + new added
  const allScreenshotUrls = [
    ...existingSS.map((s) => s.url),
    ...addedSS.map((s) => s.url),
  ];

  return (
    <form action={formAction} className="space-y-6">
      {/* Hidden fields */}
      <input type="hidden" name="app_id" value={app.id} />
      <input type="hidden" name="icon_url" value={iconUrl} />
      <input type="hidden" name="banner_url" value={bannerUrl} />
      <input type="hidden" name="apk_url" value={apkUrl} />
      <input type="hidden" name="apk_path" value={apkPath} />
      <input type="hidden" name="apk_version" value={apkUrl ? (document?.querySelector<HTMLInputElement>('[name="version"]')?.value ?? "") : ""} />
      {allScreenshotUrls.length > 0 && (
        <input type="hidden" name="screenshots" value={JSON.stringify(allScreenshotUrls)} />
      )}

      <StatusBanner app={app} />

      {state.error && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">{state.error}</div>
      )}
      {state.success && (
        <div className="rounded-xl border border-primary/20 bg-primary/10 px-4 py-3 text-sm text-primary flex items-center gap-2">
          <CheckCircle className="h-4 w-4" /> {state.success}
        </div>
      )}

      {/* ── App Info ──────────────────────────────────────────────── */}
      <Card>
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-lg font-semibold">App Information</h2>
          <Badge variant={
            app.status === "approved" ? "success"
            : app.status === "pending_review" ? "info"
            : app.status === "changes_requested" ? "warning"
            : app.status === "rejected" ? "danger"
            : "secondary"
          }>{app.status.replace("_", " ")}</Badge>
        </div>
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium">App Name</label>
              <Input name="name" defaultValue={app.name} required maxLength={100} />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium">Category</label>
              <Select name="category_id" defaultValue={app.category_id ?? ""}>
                <option value="">Select a category</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </Select>
            </div>
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium">Short Description</label>
            <Input name="short_description" defaultValue={app.short_description} required maxLength={200} />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium">Full Description</label>
            <Textarea name="full_description" defaultValue={app.full_description} rows={5} required />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium">Version</label>
              <Input name="version" defaultValue={app.current_version ?? ""} required />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium">Tags</label>
              <Input name="tags" defaultValue={app.tags?.join(", ") ?? ""} placeholder="utility, free" />
            </div>
          </div>
        </div>
      </Card>

      {/* ── Files & Assets ────────────────────────────────────────── */}
      <Card>
        <h2 className="mb-6 text-lg font-semibold">Files & Assets</h2>
        <div className="space-y-6">

          {/* APK */}
          <div>
            <FileUploadZone
              label="APK File"
              accept=".apk"
              hint="Upload new version · max 150 MB"
              onUpload={(f) => upload(f, "app-apks",
                (u) => { setApkUrl(u); setApkPath(u); },
                setApkName, setApkUploading, setApkError)}
              uploading={apkUploading}
              uploadedUrl={apkUrl}
              fileName={apkName}
              currentUrl={currentApkUrl ? `Current: v${currentApkVersion}` : ""}
            />
            {apkError && <p className="mt-1 text-xs text-red-400">{apkError}</p>}
            {currentApkUrl && !apkUrl && (
              <p className="mt-1 text-xs text-secondary-500">
                Current: v{currentApkVersion} — upload a new APK only if you want to update
              </p>
            )}
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <FileUploadZone
              label="App Icon"
              accept="image/*"
              hint="512×512 PNG · max 2 MB"
              onUpload={(f) => upload(f, "app-icons", setIconUrl, setIconName, setIconUploading)}
              uploading={iconUploading}
              uploadedUrl={iconUrl}
              fileName={iconName}
              currentUrl={app.icon_url ?? ""}
            />
            <FileUploadZone
              label="Banner Image (optional)"
              accept="image/*"
              hint="1024×500 PNG · max 5 MB"
              onUpload={(f) => upload(f, "app-banners", setBannerUrl, setBannerName, setBannerUploading)}
              uploading={bannerUploading}
              uploadedUrl={bannerUrl}
              fileName={bannerName}
              currentUrl={app.banner_url ?? ""}
            />
          </div>

          {/* Screenshots */}
          <ScreenshotsManager
            existing={existingSS}
            added={addedSS}
            onAdd={async (f) => {
              setSsUploading(true);
              const result = await uploadFileDirect(f, "app-screenshots", userId);
              setSsUploading(false);
              if (!result.error) setAddedSS((prev) => [...prev, { url: result.url!, name: f.name }]);
            }}
            onRemoveExisting={(id) => setExistingSS((prev) => prev.filter((s) => s.id !== id))}
            onRemoveAdded={(i) => setAddedSS((prev) => prev.filter((_, idx) => idx !== i))}
            uploading={ssUploading}
          />
        </div>
      </Card>

      {/* ── Links ─────────────────────────────────────────────────── */}
      <Card>
        <h2 className="mb-6 text-lg font-semibold">Links & Contact</h2>
        <div className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-medium">Developer Website</label>
            <Input name="developer_website" type="url" defaultValue={app.developer_website ?? ""} />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium">Privacy Policy URL</label>
            <Input name="privacy_policy_url" type="url" defaultValue={app.privacy_policy_url ?? ""} />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium">Support Email</label>
            <Input name="support_email" type="email" defaultValue={app.support_email ?? ""} />
          </div>
        </div>
      </Card>

      <div className="flex items-center justify-between gap-4">
        {isChangesRequested && (
          <p className="text-sm text-yellow-400/80">Saving will re-submit for admin review.</p>
        )}
        <div className="ml-auto">
          <Button type="submit" size="lg" disabled={pending} className="gap-2">
            {pending
              ? <><Loader2 className="h-4 w-4 animate-spin" /> Saving...</>
              : isChangesRequested
              ? <><Send className="h-4 w-4" /> Save &amp; Re-submit for Review</>
              : "Save Changes"}
          </Button>
        </div>
      </div>
    </form>
  );
}
