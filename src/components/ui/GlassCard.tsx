import { cn } from "@/lib/utils";

export function GlassCard({
  children,
  className,
  strong,
  hover,
  padding = true,
}: {
  children: React.ReactNode;
  className?: string;
  strong?: boolean;
  hover?: boolean;
  padding?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)]",
        strong && "border-[var(--border-strong)]",
        padding && "p-4 md:p-5",
        hover && "transition-colors hover:bg-[var(--surface-hover)]",
        className
      )}
    >
      {children}
    </div>
  );
}
