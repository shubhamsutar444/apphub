// Direct browser → Supabase Storage upload (bypasses Next.js server)
// This is much faster — no double transfer through your server.

import { createClient } from "@/lib/supabase/client";

export interface UploadResult {
  url?: string;
  path?: string;
  sizeBytes?: number;
  error?: string;
}

type Bucket = "app-apks" | "app-icons" | "app-screenshots" | "app-banners";

const MAX_SIZES: Record<Bucket, number> = {
  "app-apks":        150 * 1024 * 1024, // 150 MB
  "app-icons":         2 * 1024 * 1024, //   2 MB
  "app-screenshots":   5 * 1024 * 1024, //   5 MB
  "app-banners":       5 * 1024 * 1024, //   5 MB
};

export async function uploadFileDirect(
  file: File,
  bucket: Bucket,
  userId: string
): Promise<UploadResult> {
  // ── Validation ──────────────────────────────────────────────────────
  if (!file || file.size === 0) return { error: "No file selected" };

  if (bucket === "app-apks" && !file.name.toLowerCase().endsWith(".apk")) {
    return { error: "Only .apk files are allowed" };
  }

  if (bucket !== "app-apks" && !file.type.startsWith("image/")) {
    return { error: "Only image files are allowed" };
  }

  if (file.size > MAX_SIZES[bucket]) {
    const maxMB = MAX_SIZES[bucket] / (1024 * 1024);
    return { error: `File too large. Max size is ${maxMB}MB` };
  }

  // ── Upload directly to Supabase from browser ────────────────────────
  const ext = file.name.split(".").pop() ?? "bin";
  const path = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

  const supabase = createClient();

  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(path, file, {
      cacheControl: "3600",
      upsert: false,
      contentType: file.type || "application/octet-stream",
    });

  if (error) {
    // Friendly error messages
    if (error.message.includes("Bucket not found")) {
      return { error: `Storage bucket "${bucket}" not found. Ask admin to create it in Supabase.` };
    }
    if (error.message.includes("not authorized") || error.message.includes("policy")) {
      return { error: "Upload not authorized. Check Supabase storage policies." };
    }
    return { error: error.message };
  }

  const { data: { publicUrl } } = supabase.storage
    .from(bucket)
    .getPublicUrl(data.path);

  return { url: publicUrl, path: data.path, sizeBytes: file.size };
}
