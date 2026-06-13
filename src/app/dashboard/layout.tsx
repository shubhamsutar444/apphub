import { MainLayout } from "@/components/layout/main-layout";
import { getCurrentUser } from "@/lib/auth/session";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  // Admin routes have their own layout (src/app/dashboard/admin/layout.tsx)
  // For user and developer, use the normal MainLayout
  return <MainLayout>{children}</MainLayout>;
}
