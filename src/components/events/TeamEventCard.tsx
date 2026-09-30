"use client";

import { format, parseISO } from "date-fns";
import {
  Video,
  CalendarPlus,
  ExternalLink,
  FileText,
  Pencil,
  Trash2,
} from "lucide-react";
import type { TeamEvent } from "@/types";
import { getTeam } from "@/data/seed";
import { GlassCard } from "@/components/ui/GlassCard";
import {
  googleCalendarUrlForTeamEvent,
  nextOccurrenceStartsAt,
} from "@/lib/calendar";

export function TeamEventCard({
  event,
  onEdit,
  onDelete,
}: {
  event: TeamEvent;
  onEdit?: () => void;
  onDelete?: () => void;
}) {
  const team = getTeam(event.teamId);
  const occurrenceStart = nextOccurrenceStartsAt(event);
  const start = parseISO(occurrenceStart);
  const endIso =
    event.endsAt && !event.recurringUntil
      ? event.endsAt
      : new Date(
          new Date(occurrenceStart).getTime() +
            (event.endsAt
              ? new Date(event.endsAt).getTime() -
                new Date(event.startsAt).getTime()
              : 60 * 60 * 1000)
        ).toISOString();

  const gcal = googleCalendarUrlForTeamEvent({
    title: `${team?.name ?? "Team"}: ${event.title}`,
    description: event.description,
    zoomLink: event.zoomLink,
    location: event.location,
    startsAt: occurrenceStart,
    endsAt: endIso,
    recurringUntil: event.recurringUntil,
  });

  return (
    <GlassCard>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          {team && (
            <p className="mb-1 flex items-center gap-2 text-xs text-tertiary">
              <span
                className="h-1.5 w-1.5 rounded-full"
                style={{ background: team.color }}
              />
              {team.name}
              {event.recurringUntil ? " · Weekly" : ""}
            </p>
          )}
          <h3 className="text-base font-medium tracking-tight">{event.title}</h3>
          <p className="mt-1 text-sm text-secondary">
            {format(start, "EEE, MMM d · h:mm a")}
            {event.endsAt
              ? ` – ${format(parseISO(endIso), "h:mm a")}`
              : ""}
          </p>
          {event.description && (
            <p className="mt-2 text-sm text-secondary">{event.description}</p>
          )}
        </div>
        {(onEdit || onDelete) && (
          <div className="flex shrink-0 gap-1">
            {onEdit && (
              <button
                type="button"
                onClick={onEdit}
                className="rounded p-1.5 text-tertiary hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)]"
                aria-label="Edit event"
              >
                <Pencil className="h-3.5 w-3.5" />
              </button>
            )}
            {onDelete && (
              <button
                type="button"
                onClick={onDelete}
                className="rounded p-1.5 text-tertiary hover:bg-[var(--surface-hover)] hover:text-[var(--danger)]"
                aria-label="Delete event"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        )}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {event.zoomLink && (
          <a
            href={event.zoomLink}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-9 items-center gap-1.5 rounded-[var(--radius-sm)] bg-[var(--accent)] px-3 text-sm font-medium text-[var(--text-inverse)] hover:opacity-90"
          >
            <Video className="h-3.5 w-3.5" />
            Join
          </a>
        )}
        <a
          href={gcal}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex h-9 items-center gap-1.5 rounded-[var(--radius-sm)] border border-[var(--border)] px-3 text-sm hover:bg-[var(--surface-hover)]"
        >
          <CalendarPlus className="h-3.5 w-3.5" />
          Google Calendar
        </a>
      </div>

      {event.materials.length > 0 && (
        <div className="mt-4 border-t border-[var(--border)] pt-3">
          <p className="mb-2 text-xs text-tertiary">Materials</p>
          <div className="flex flex-col gap-1">
            {event.materials.map((m) => (
              <a
                key={m.id}
                href={m.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-[var(--radius-sm)] px-1 py-1.5 text-sm text-secondary hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)]"
              >
                <FileText className="h-3.5 w-3.5 text-tertiary" />
                {m.title}
                <ExternalLink className="h-3 w-3 text-tertiary" />
              </a>
            ))}
          </div>
        </div>
      )}
    </GlassCard>
  );
}
