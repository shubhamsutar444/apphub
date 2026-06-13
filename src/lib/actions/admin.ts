"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentUser } from "@/lib/auth/session";
import type { UserRole } from "@/types";

export type AdminActionState = {
  error?: string;
  success?: string;
};

// ── Change user role ──────────────────────────────────────────────────────────
export async function changeUserRoleAction(
  userId: string,
  newRole: UserRole
): Promise<AdminActionState> {
  const user = await getCurrentUser();
  if (!user || user.profile.role !== "admin") return { error: "Unauthorized" };

  const adminClient = createAdminClient();
  const { error } = await adminClient
    .from("users")
    .update({ role: newRole })
    .eq("id", userId);

  if (error) return { error: error.message };

  revalidatePath("/dashboard/admin/users");
  return { success: `Role updated to ${newRole}` };
}

// ── Add admin by email ────────────────────────────────────────────────────────
export async function addAdminByEmailAction(
  _prevState: AdminActionState,
  formData: FormData
): Promise<AdminActionState> {
  const user = await getCurrentUser();
  if (!user || user.profile.role !== "admin") return { error: "Unauthorized" };

  const email = formData.get("email")?.toString()?.trim().toLowerCase();
  if (!email) return { error: "Email is required" };

  const adminClient = createAdminClient();

  const { data: target, error: findErr } = await adminClient
    .from("users")
    .select("id, email, role")
    .eq("email", email)
    .maybeSingle();

  if (findErr) return { error: findErr.message };
  if (!target) return { error: `No user found with email: ${email}. They must sign up first.` };
  if (target.role === "admin") return { error: `${email} is already an admin.` };

  const { error } = await adminClient
    .from("users")
    .update({ role: "admin" })
    .eq("id", target.id);

  if (error) return { error: error.message };

  revalidatePath("/dashboard/admin/admins");
  return { success: `✅ ${email} has been promoted to admin.` };
}

// ── Update / create category ──────────────────────────────────────────────────
export async function updateCategoryAction(
  _prevState: AdminActionState,
  formData: FormData
): Promise<AdminActionState> {
  const user = await getCurrentUser();
  if (!user || user.profile.role !== "admin") return { error: "Unauthorized" };

  const id = formData.get("id")?.toString();
  const name = formData.get("name")?.toString()?.trim();
  const icon = formData.get("icon")?.toString()?.trim();
  const description = formData.get("description")?.toString()?.trim();
  const is_active = formData.get("is_active") === "true";

  if (!name) return { error: "Name is required" };

  const adminClient = createAdminClient();

  if (id) {
    const { error } = await adminClient
      .from("categories")
      .update({ name, icon: icon || null, description: description || null, is_active })
      .eq("id", id);
    if (error) return { error: error.message };
    revalidatePath("/dashboard/admin/categories");
    return { success: "Category updated" };
  }

  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  const { error } = await adminClient
    .from("categories")
    .insert({ name, slug, icon: icon || null, description: description || null, is_active });

  if (error) return { error: error.message };

  revalidatePath("/dashboard/admin/categories");
  revalidatePath("/");
  return { success: "Category created" };
}

// ── Delete category ───────────────────────────────────────────────────────────
export async function deleteCategoryAction(categoryId: string): Promise<AdminActionState> {
  const user = await getCurrentUser();
  if (!user || user.profile.role !== "admin") return { error: "Unauthorized" };

  const adminClient = createAdminClient();
  const { error } = await adminClient.from("categories").delete().eq("id", categoryId);

  if (error) return { error: error.message };

  revalidatePath("/dashboard/admin/categories");
  return { success: "Category deleted" };
}
