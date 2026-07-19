import Link from "next/link";
import Image from "next/image";
import { APP_NAME } from "@/lib/constants/routes";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="gradient-bg flex min-h-screen flex-col">
      <div className="section-container flex flex-1 flex-col items-center justify-center py-12">
        <Link href="/" className="group mb-8 flex items-center gap-2.5">
          <div className="relative h-10 w-10 overflow-hidden rounded-xl ring-1 ring-primary/20 transition-all group-hover:ring-primary/40">
            <Image
              src="/apphub-logo.png"
              alt="AppHub Logo"
              fill
              className="object-cover object-left"
              sizes="40px"
              priority
            />
          </div>
          <span className="text-2xl font-bold text-gradient">{APP_NAME}</span>
        </Link>
        <div className="glass-card w-full max-w-md">{children}</div>
      </div>
    </div>
  );
}
