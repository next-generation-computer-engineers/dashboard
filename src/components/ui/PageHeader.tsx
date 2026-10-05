import { cn } from "@/lib/utils";

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  className,
  compact,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: React.ReactNode;
  className?: string;
  /** Hide title when TopBar already shows it (desktop). */
  compact?: boolean;
}) {
  return (
    <div
      className={cn(
        "mb-5 flex flex-col gap-2.5 sm:flex-row sm:items-end sm:justify-between",
        compact && "md:mb-4 md:[&>div:first-child>h1]:sr-only md:[&>div:first-child>p:first-child]:sr-only",
        className
      )}
    >
      <div className="min-w-0">
        {eyebrow && (
          <p className="mb-0.5 text-[11px] font-medium uppercase tracking-wider text-tertiary">
            {eyebrow}
          </p>
        )}
        <h1 className="text-lg font-medium tracking-tight text-[var(--text-primary)] md:text-xl">
          {title}
        </h1>
        {description && (
          <p className="mt-0.5 max-w-xl text-[13px] text-secondary">
            {description}
          </p>
        )}
      </div>
      {actions && (
        <div className="flex shrink-0 items-center gap-2">{actions}</div>
      )}
    </div>
  );
}

export function SectionLabel({
  children,
  className,
  action,
}: {
  children: React.ReactNode;
  className?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className={cn("mb-2.5 flex items-baseline justify-between gap-3", className)}>
      <h2 className="text-[11px] font-medium uppercase tracking-wider text-tertiary">
        {children}
      </h2>
      {action}
    </div>
  );
}
