import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { cn } from "@/lib/utils";

export function OpportunityCard({
  href,
  name,
  description,
  meta,
  capacityLabel,
  statusLabel = "Open",
  statusTone = "success" as const,
  actionLabel = "View",
  color,
  className,
}: {
  href: string;
  name: string;
  description?: string;
  meta?: string;
  capacityLabel?: string;
  statusLabel?: string;
  statusTone?: "success" | "warning" | "neutral" | "info" | "accent";
  actionLabel?: string;
  color?: string;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "flex flex-col rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] p-3.5 transition-colors hover:bg-[var(--surface-hover)]",
        className
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          {color && (
            <span
              className="h-2 w-2 shrink-0 rounded-full"
              style={{ background: color }}
              aria-hidden
            />
          )}
          <p className="truncate text-sm font-medium text-[var(--text-primary)]">
            {name}
          </p>
        </div>
        <StatusBadge tone={statusTone}>{statusLabel}</StatusBadge>
      </div>
      {description && (
        <p className="mt-1.5 line-clamp-2 text-[12px] leading-relaxed text-secondary">
          {description}
        </p>
      )}
      <div className="mt-auto flex items-center justify-between gap-2 pt-3">
        <p className="truncate text-[11px] text-tertiary">
          {[meta, capacityLabel].filter(Boolean).join(" · ")}
        </p>
        <span className="inline-flex items-center gap-0.5 text-[12px] font-medium text-[var(--accent)]">
          {actionLabel}
          <ChevronRight className="h-3.5 w-3.5" />
        </span>
      </div>
    </Link>
  );
}
