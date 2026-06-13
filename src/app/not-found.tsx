import Link from "next/link";
import { MainLayout } from "@/components/layout/main-layout";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/lib/constants/routes";

export default function NotFound() {
  return (
    <MainLayout>
      <div className="section-container flex min-h-[60vh] flex-col items-center justify-center text-center">
        <p className="text-8xl font-bold text-gradient">404</p>
        <h1 className="mt-4 text-2xl font-bold">Page not found</h1>
        <p className="mt-2 max-w-md text-secondary-400">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <Link href={ROUTES.home} className="mt-8">
          <Button>Back to Home</Button>
        </Link>
      </div>
    </MainLayout>
  );
}
