import { cn } from "@/lib/utils";

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  className,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between",
        className
      )}
    >
      <div className="min-w-0">
        {eyebrow && (
          <p className="mb-1 text-xs text-tertiary">{eyebrow}</p>
        )}
        <h1 className="text-xl font-medium tracking-tight text-[var(--text-primary)] md:text-2xl">
          {title}
        </h1>
        {description && (
          <p className="mt-1 max-w-xl text-sm text-secondary">{description}</p>
        )}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </div>
  );
}

export function SectionLabel({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <h2 className={cn("mb-2 text-xs text-tertiary", className)}>
      {children}
    </h2>
  );
}
