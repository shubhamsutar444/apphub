import Link from "next/link";
import { Smartphone } from "lucide-react";
import { APP_NAME } from "@/lib/constants/routes";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="gradient-bg flex min-h-screen flex-col">
      <div className="section-container flex flex-1 flex-col items-center justify-center py-12">
        <Link href="/" className="group mb-8 flex items-center gap-2.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 ring-1 ring-primary/20 transition-all group-hover:bg-primary/20">
            <Smartphone className="h-5 w-5 text-primary" />
          </div>
          <span className="text-2xl font-bold text-gradient">{APP_NAME}</span>
        </Link>
        <div className="glass-card w-full max-w-md">{children}</div>
      </div>
    </div>
  );
}
