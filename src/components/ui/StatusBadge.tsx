import { cn } from "@/lib/utils";

export type StatusTone =
  | "neutral"
  | "accent"
  | "success"
  | "warning"
  | "danger"
  | "info";

const toneStyles: Record<StatusTone, string> = {
  neutral:
    "border-[var(--border)] bg-[var(--bg-soft)] text-secondary",
  accent:
    "border-transparent bg-[var(--accent-soft)] text-[var(--accent)]",
  success:
    "border-transparent bg-[var(--success-soft)] text-[var(--success)]",
  warning:
    "border-transparent bg-[var(--warning-soft)] text-[var(--warning)]",
  danger:
    "border-transparent bg-[var(--danger-soft)] text-[var(--danger)]",
  info: "border-transparent bg-[var(--info-soft)] text-[var(--info)]",
};

export function StatusBadge({
  children,
  tone = "neutral",
  className,
}: {
  children: React.ReactNode;
  tone?: StatusTone;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded border px-1.5 py-0.5 text-[11px] font-medium leading-none",
        toneStyles[tone],
        className
      )}
    >
      {children}
    </span>
  );
}
