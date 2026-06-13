import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          // base
          "inline-flex items-center justify-center gap-2 rounded-xl font-semibold font-heading transition-all duration-200 active:scale-[0.97] disabled:pointer-events-none disabled:opacity-40 select-none",
          // variant
          variant === "primary" && [
            "bg-primary text-night-900 shadow-glow",
            "hover:bg-accent hover:shadow-glow-lg hover:-translate-y-px",
          ],
          variant === "secondary" && [
            "border border-primary/20 bg-primary/6 text-primary/80",
            "hover:border-primary/50 hover:bg-primary/12 hover:text-primary hover:-translate-y-px",
          ],
          variant === "ghost" && [
            "text-secondary-400",
            "hover:bg-primary/8 hover:text-primary",
          ],
          variant === "danger" && [
            "bg-red-500/10 text-red-400 border border-red-500/20",
            "hover:bg-red-500/20",
          ],
          // size
          size === "sm" && "px-4 py-2 text-sm",
          size === "md" && "px-6 py-3 text-sm",
          size === "lg" && "px-8 py-4 text-base",
          className
        )}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";

export { Button };
