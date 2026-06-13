"use server";

import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth/session";

export interface UploadResult {
  url?: string;
  path?: string;
  error?: string;
}

export async function uploadFileAction(
  formData: FormData,
  bucket: "app-apks" | "app-icons" | "app-screenshots" | "app-banners"
): Promise<UploadResult> {
  const user = await getCurrentUser();
  if (!user) return { error: "Not authenticated" };

  const file = formData.get("file") as File | null;
  if (!file || file.size === 0) return { error: "No file provided" };

  // Validate file types
  if (bucket === "app-apks" && !file.name.endsWith(".apk")) {
    return { error: "Only .apk files are allowed" };
  }
  if (
    (bucket === "app-icons" || bucket === "app-screenshots" || bucket === "app-banners") &&
    !file.type.startsWith("image/")
  ) {
    return { error: "Only image files are allowed" };
  }

  // Max sizes
  const maxSizes: Record<string, number> = {
    "app-apks": 150 * 1024 * 1024,       // 150 MB
    "app-icons": 2 * 1024 * 1024,        // 2 MB
    "app-screenshots": 5 * 1024 * 1024,  // 5 MB
    "app-banners": 5 * 1024 * 1024,      // 5 MB
  };
  if (file.size > maxSizes[bucket]) {
    return { error: `File too large. Max ${maxSizes[bucket] / (1024 * 1024)}MB.` };
  }

  const ext = file.name.split(".").pop() ?? "bin";
  const path = `${user.id}/${Date.now()}.${ext}`;

  const supabase = await createClient();
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(path, file, { upsert: false, contentType: file.type });

  if (error) return { error: error.message };

  const { data: { publicUrl } } = supabase.storage
    .from(bucket)
    .getPublicUrl(data.path);

  return { url: publicUrl, path: data.path };
}
