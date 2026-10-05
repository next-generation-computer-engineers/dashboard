import Link from "next/link";
import { FolderOpen, ChevronRight } from "lucide-react";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { cn } from "@/lib/utils";

export function ClassListItem({
  href,
  name,
  meta,
  role,
  nextMeeting,
  materialsHref,
  className,
}: {
  href: string;
  name: string;
  meta?: string;
  role?: string;
  nextMeeting?: string;
  materialsHref?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "group flex items-center gap-3 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] px-3.5 py-3 transition-colors hover:bg-[var(--surface-hover)]",
        className
      )}
    >
      <Link href={href} className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-1.5">
          <p className="truncate text-sm font-medium text-[var(--text-primary)]">
            {name}
          </p>
          {role && (
            <StatusBadge tone="neutral" className="capitalize">
              {role.replace(/_/g, " ")}
            </StatusBadge>
          )}
        </div>
        {(meta || nextMeeting) && (
          <p className="mt-0.5 truncate text-[12px] text-tertiary">
            {[meta, nextMeeting].filter(Boolean).join(" · ")}
          </p>
        )}
      </Link>
      <div className="flex shrink-0 items-center gap-1">
        {materialsHref && (
          <a
            href={materialsHref}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-[var(--radius-sm)] p-1.5 text-tertiary hover:bg-[var(--bg-soft)] hover:text-[var(--text-primary)]"
            title="Open materials"
            aria-label="Open materials"
          >
            <FolderOpen className="h-3.5 w-3.5" />
          </a>
        )}
        <Link
          href={href}
          className="rounded-[var(--radius-sm)] p-1.5 text-tertiary group-hover:text-[var(--text-primary)]"
          aria-label={`Open ${name}`}
        >
          <ChevronRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}
