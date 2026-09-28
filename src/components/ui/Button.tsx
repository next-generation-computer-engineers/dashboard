"use client";

import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "soft";
type Size = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
}

const variants: Record<Variant, string> = {
  primary:
    "bg-[var(--accent)] text-[var(--text-inverse)] hover:brightness-110",
  secondary:
    "border border-[var(--border)] bg-transparent text-[var(--text-primary)] hover:bg-[var(--surface-hover)]",
  ghost:
    "bg-transparent text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)]",
  danger:
    "border border-[rgba(196,122,124,0.35)] text-[var(--danger)] hover:bg-[rgba(196,122,124,0.08)]",
  soft:
    "bg-[var(--accent-soft)] text-[var(--accent)] hover:brightness-95",
};

const sizes: Record<Size, string> = {
  sm: "h-8 px-3 text-xs gap-1.5 rounded-[var(--radius-sm)]",
  md: "h-9 px-3.5 text-sm gap-2 rounded-[var(--radius-sm)]",
  lg: "h-10 px-4 text-sm gap-2 rounded-[var(--radius-sm)]",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      loading,
      disabled,
      children,
      ...props
    },
    ref
  ) => (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={cn(
        "inline-flex items-center justify-center font-medium transition-colors duration-150",
        "disabled:opacity-40 disabled:pointer-events-none",
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {loading && (
        <span className="h-3.5 w-3.5 rounded-full border border-current border-t-transparent animate-spin" />
      )}
      {children}
    </button>
  )
);
Button.displayName = "Button";
