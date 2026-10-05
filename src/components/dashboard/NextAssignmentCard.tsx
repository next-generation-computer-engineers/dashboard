import Link from "next/link";
import { format } from "date-fns";
import {
  Video,
  MapPin,
  Users,
  ExternalLink,
  FolderOpen,
  ClipboardList,
} from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

export type NextAssignmentKind = "class" | "meeting";

export interface NextAssignmentCardProps {
  kind: NextAssignmentKind;
  title: string;
  subtitle?: string;
  when: Date;
  whenEnd?: Date;
  location?: string;
  zoomLink?: string;
  role?: string;
  peopleLabel?: string;
  statusLabel?: string;
  statusTone?: "success" | "warning" | "neutral" | "accent" | "info";
  primaryHref?: string;
  primaryLabel?: string;
  primaryExternal?: boolean;
  secondaryHref?: string;
  secondaryLabel?: string;
  materialsHref?: string;
  attendanceHref?: string;
  className?: string;
}

export function NextAssignmentCard({
  kind,
  title,
  subtitle,
  when,
  whenEnd,
  location,
  zoomLink,
  role,
  peopleLabel,
  statusLabel = "Upcoming",
  statusTone = "accent",
  primaryHref,
  primaryLabel,
  primaryExternal,
  secondaryHref,
  secondaryLabel,
  materialsHref,
  attendanceHref,
  className,
}: NextAssignmentCardProps) {
  const timeLabel = whenEnd
    ? `${format(when, "EEE, MMM d · h:mm a")} – ${format(whenEnd, "h:mm a")}`
    : format(when, "EEE, MMM d · h:mm a");

  const resolvedPrimary =
    primaryHref ??
    zoomLink ??
    secondaryHref;
  const resolvedPrimaryLabel =
    primaryLabel ??
    (zoomLink ? "Join Zoom" : secondaryLabel ?? "View details");
  const resolvedExternal = primaryExternal ?? Boolean(zoomLink && !primaryHref);

  return (
    <GlassCard
      strong
      className={cn("relative overflow-hidden", className)}
      padding
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-wider text-tertiary">
            Next up
          </p>
          <h2 className="mt-1 text-lg font-medium tracking-tight text-[var(--text-primary)]">
            {title}
          </h2>
          {subtitle && (
            <p className="mt-0.5 text-[13px] text-secondary">{subtitle}</p>
          )}
        </div>
        <StatusBadge tone={statusTone}>{statusLabel}</StatusBadge>
      </div>

      <dl className="mt-4 grid gap-2 text-[13px] sm:grid-cols-2">
        <div>
          <dt className="text-[11px] text-tertiary">When</dt>
          <dd className="mt-0.5 text-[var(--text-primary)]">{timeLabel}</dd>
        </div>
        {(location || zoomLink) && (
          <div>
            <dt className="text-[11px] text-tertiary">Where</dt>
            <dd className="mt-0.5 flex items-center gap-1.5 text-[var(--text-primary)]">
              {zoomLink ? (
                <Video className="h-3.5 w-3.5 shrink-0 text-tertiary" />
              ) : (
                <MapPin className="h-3.5 w-3.5 shrink-0 text-tertiary" />
              )}
              <span className="truncate">
                {location ?? (zoomLink ? "Zoom" : "—")}
              </span>
            </dd>
          </div>
        )}
        {role && (
          <div>
            <dt className="text-[11px] text-tertiary">Your role</dt>
            <dd className="mt-0.5 capitalize text-[var(--text-primary)]">
              {role.replace(/_/g, " ")}
            </dd>
          </div>
        )}
        {peopleLabel && (
          <div>
            <dt className="text-[11px] text-tertiary">
              {kind === "class" ? "Team" : "With"}
            </dt>
            <dd className="mt-0.5 flex items-center gap-1.5 text-[var(--text-primary)]">
              <Users className="h-3.5 w-3.5 shrink-0 text-tertiary" />
              <span className="truncate">{peopleLabel}</span>
            </dd>
          </div>
        )}
      </dl>

      <div className="mt-5 flex flex-wrap items-center gap-2">
        {resolvedPrimary && (
          resolvedExternal ? (
            <a
              href={resolvedPrimary}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-9 items-center gap-1.5 rounded-[var(--radius-sm)] bg-[var(--accent)] px-3.5 text-sm font-medium text-[var(--text-inverse)] hover:brightness-110"
            >
              {zoomLink && !primaryHref ? (
                <Video className="h-3.5 w-3.5" />
              ) : null}
              {resolvedPrimaryLabel}
            </a>
          ) : (
            <Link href={resolvedPrimary}>
              <Button size="md">{resolvedPrimaryLabel}</Button>
            </Link>
          )
        )}
        {secondaryHref && secondaryLabel && secondaryHref !== resolvedPrimary && (
          <Link
            href={secondaryHref}
            className="inline-flex h-9 items-center gap-1 rounded-[var(--radius-sm)] border border-[var(--border)] px-3 text-sm text-[var(--text-primary)] hover:bg-[var(--surface-hover)]"
          >
            {secondaryLabel}
            <ExternalLink className="h-3 w-3 text-tertiary" />
          </Link>
        )}
        {materialsHref && (
          <a
            href={materialsHref}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-9 items-center gap-1.5 rounded-[var(--radius-sm)] border border-[var(--border)] px-3 text-sm hover:bg-[var(--surface-hover)]"
          >
            <FolderOpen className="h-3.5 w-3.5" />
            Open materials
          </a>
        )}
        {attendanceHref && (
          <a
            href={attendanceHref}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-9 items-center gap-1.5 rounded-[var(--radius-sm)] border border-[var(--border)] px-3 text-sm hover:bg-[var(--surface-hover)]"
          >
            <ClipboardList className="h-3.5 w-3.5" />
            Attendance
          </a>
        )}
      </div>
    </GlassCard>
  );
}
