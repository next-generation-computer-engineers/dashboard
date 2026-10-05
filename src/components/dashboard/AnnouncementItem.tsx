import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

export function AnnouncementItem({
  title,
  body,
  meta,
  href,
  external,
  className,
}: {
  title: string;
  body?: string;
  meta?: string;
  href?: string;
  external?: boolean;
  className?: string;
}) {
  const content = (
    <>
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-medium text-[var(--text-primary)]">{title}</p>
        {href && <ExternalLink className="mt-0.5 h-3 w-3 shrink-0 text-tertiary" />}
      </div>
      {body && (
        <p className="mt-1 text-[13px] leading-relaxed text-secondary">{body}</p>
      )}
      {meta && <p className="mt-1.5 text-[11px] text-tertiary">{meta}</p>}
    </>
  );

  const classes = cn(
    "block rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] px-3.5 py-3",
    href && "transition-colors hover:bg-[var(--surface-hover)]",
    className
  );

  if (href && external) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={classes}>
        {content}
      </a>
    );
  }
  if (href) {
    return (
      <Link href={href} className={classes}>
        {content}
      </Link>
    );
  }
  return <div className={classes}>{content}</div>;
}

export function QuickLinkItem({
  href,
  label,
  description,
  external,
  icon,
}: {
  href: string;
  label: string;
  description?: string;
  external?: boolean;
  icon?: React.ReactNode;
}) {
  const classes =
    "flex items-center gap-3 rounded-[var(--radius-sm)] px-2 py-2 transition-colors hover:bg-[var(--surface-hover)]";

  const inner = (
    <>
      {icon && (
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[var(--radius-sm)] bg-[var(--bg-soft)] text-secondary">
          {icon}
        </span>
      )}
      <span className="min-w-0 flex-1">
        <span className="block text-[13px] font-medium text-[var(--text-primary)]">
          {label}
        </span>
        {description && (
          <span className="block truncate text-[11px] text-tertiary">
            {description}
          </span>
        )}
      </span>
      {external && <ExternalLink className="h-3 w-3 shrink-0 text-tertiary" />}
    </>
  );

  if (external) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={classes}>
        {inner}
      </a>
    );
  }
  return (
    <Link href={href} className={classes}>
      {inner}
    </Link>
  );
}
