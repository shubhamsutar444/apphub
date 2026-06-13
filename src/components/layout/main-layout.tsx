import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { BottomNav } from "@/components/layout/bottom-nav";

interface MainLayoutProps {
  children: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className="gradient-bg min-h-screen">
      <Header />
      <main className="pb-20 pt-16 md:pb-0 md:pt-20">{children}</main>
      <Footer />
      <BottomNav />
    </div>
  );
}
