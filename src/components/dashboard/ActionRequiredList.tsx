import Link from "next/link";
import { GlassCard } from "@/components/ui/GlassCard";
import { StatusBadge, type StatusTone } from "@/components/ui/StatusBadge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { cn } from "@/lib/utils";

export interface ActionItem {
  id: string;
  title: string;
  description?: string;
  required?: boolean;
  tone?: StatusTone;
  statusLabel?: string;
  href?: string;
  hrefLabel?: string;
  external?: boolean;
  onPrimary?: () => void;
  primaryLabel?: string;
  onSecondary?: () => void;
  secondaryLabel?: string;
  loading?: boolean;
  avatar?: React.ReactNode;
}

export function ActionRequiredList({
  items,
  className,
}: {
  items: ActionItem[];
  className?: string;
}) {
  if (items.length === 0) {
    return (
      <EmptyState
        className={className}
        title="You're all caught up"
        description="Nothing needs your response right now. Check back after your next class or meeting."
      />
    );
  }

  return (
    <GlassCard padding={false} className={cn("overflow-hidden", className)}>
      <ul className="divide-y divide-[var(--border)]">
        {items.map((item) => (
          <li key={item.id} className="flex flex-col gap-3 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-start gap-3">
              {item.avatar}
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-1.5">
                  <p className="text-sm font-medium text-[var(--text-primary)]">
                    {item.title}
                  </p>
                  {item.required && (
                    <StatusBadge tone="warning">Required</StatusBadge>
                  )}
                  {item.statusLabel && (
                    <StatusBadge tone={item.tone ?? "neutral"}>
                      {item.statusLabel}
                    </StatusBadge>
                  )}
                </div>
                {item.description && (
                  <p className="mt-0.5 text-[13px] text-secondary">
                    {item.description}
                  </p>
                )}
              </div>
            </div>
            <div className="flex shrink-0 flex-wrap gap-2">
              {item.onPrimary && item.primaryLabel && (
                <Button
                  size="sm"
                  loading={item.loading}
                  onClick={item.onPrimary}
                >
                  {item.primaryLabel}
                </Button>
              )}
              {item.onSecondary && item.secondaryLabel && (
                <Button
                  size="sm"
                  variant="secondary"
                  loading={item.loading}
                  onClick={item.onSecondary}
                >
                  {item.secondaryLabel}
                </Button>
              )}
              {item.href && item.hrefLabel && (
                item.external ? (
                  <a
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex h-8 items-center rounded-[var(--radius-sm)] border border-[var(--border)] px-3 text-xs font-medium hover:bg-[var(--surface-hover)]"
                  >
                    {item.hrefLabel}
                  </a>
                ) : (
                  <Link
                    href={item.href}
                    className="inline-flex h-8 items-center rounded-[var(--radius-sm)] border border-[var(--border)] px-3 text-xs font-medium hover:bg-[var(--surface-hover)]"
                  >
                    {item.hrefLabel}
                  </Link>
                )
              )}
            </div>
          </li>
        ))}
      </ul>
    </GlassCard>
  );
}
