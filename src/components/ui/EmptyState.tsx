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
        "flex flex-col items-start justify-center rounded-[var(--radius-md)] border border-dashed border-[var(--border)] bg-[var(--surface)] px-5 py-8",
        className
      )}
    >
      <p className="text-sm font-medium text-[var(--text-primary)]">{title}</p>
      {description && (
        <p className="mt-1 max-w-md text-[13px] leading-relaxed text-secondary">
          {description}
        </p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function LoadingBlock({ className }: { className?: string }) {
  return (
    <div className={cn("space-y-3", className)}>
      <div className="skeleton h-7 w-40" />
      <div className="skeleton h-28 w-full" />
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="skeleton h-24 w-full" />
        <div className="skeleton h-24 w-full" />
      </div>
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-5">
      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <div className="skeleton h-40 w-full rounded-[var(--radius-md)]" />
        <div className="skeleton h-40 w-full rounded-[var(--radius-md)]" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="skeleton h-36 w-full rounded-[var(--radius-md)]" />
        <div className="skeleton h-36 w-full rounded-[var(--radius-md)]" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="skeleton h-28 w-full rounded-[var(--radius-md)]" />
        <div className="skeleton h-28 w-full rounded-[var(--radius-md)]" />
      </div>
    </div>
  );
}
