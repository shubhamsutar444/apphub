import { cn } from "@/lib/utils/cn";

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
}

export function Card({ children, className, hover = false }: CardProps) {
  return (
    <div
      className={cn(
        // base glass surface
        "rounded-2xl p-6 transition-all duration-300",
        "bg-night-900/70 border border-primary/10 shadow-glass",
        "backdrop-blur-xl",
        hover && [
          "cursor-pointer",
          "hover:border-primary/35 hover:shadow-card-hover hover:-translate-y-1",
          "hover:bg-night-800/80",
        ],
        className
      )}
    >
      {children}
    </div>
  );
}
