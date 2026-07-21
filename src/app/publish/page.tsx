import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";

export default async function PublishPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?redirectTo=/dashboard/developer/apps/new");

  // All logged-in users go directly to app submission page
  redirect("/dashboard/developer/apps/new");
}
