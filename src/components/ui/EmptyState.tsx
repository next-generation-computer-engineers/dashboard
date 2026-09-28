"use client";

import { cn } from "@/lib/utils";

export function EmptyState({
  title,
  description,
  action,
  className,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "glass-panel flex flex-col items-center justify-center rounded-[var(--radius-lg)] px-6 py-16 text-center",
        className
      )}
    >
      <p className="font-display text-lg text-[var(--text-primary)]">{title}</p>
      {description && (
        <p className="mt-2 max-w-sm text-sm text-secondary">{description}</p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function LoadingBlock({ className }: { className?: string }) {
  return (
    <div className={cn("space-y-3", className)}>
      <div className="skeleton h-8 w-48" />
      <div className="skeleton h-24 w-full" />
      <div className="skeleton h-24 w-full" />
    </div>
  );
}
