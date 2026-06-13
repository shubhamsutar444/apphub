import { cn } from "@/lib/utils/cn";

interface BadgeProps {
  children: React.ReactNode;
  variant?: "default" | "success" | "warning" | "danger" | "info" | "secondary";
  className?: string;
}

const variantStyles = {
  default:   "bg-primary/12 text-primary border-primary/25",
  success:   "bg-green-500/10 text-green-400 border-green-500/20",
  warning:   "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  danger:    "bg-red-500/10 text-red-400 border-red-500/20",
  info:      "bg-accent/10 text-accent-300 border-accent/20",
  secondary: "bg-white/5 text-secondary-400 border-white/10",
};

export function Badge({ children, variant = "default", className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold font-heading",
        variantStyles[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
