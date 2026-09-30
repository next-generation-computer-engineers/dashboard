"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { format, parseISO } from "date-fns";
import {
  ArrowLeft,
  Video,
  CalendarPlus,
  FileText,
  ExternalLink,
  Plus,
  Trash2,
  Pencil,
} from "lucide-react";
import { useAuth } from "@/lib/auth/AuthProvider";
import { getTeam, MEMBERS, getMember, TEAMS } from "@/data/seed";
import { displayName } from "@/lib/permissions";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { GlassCard } from "@/components/ui/GlassCard";
import { SectionLabel } from "@/components/ui/PageHeader";
import { EventForm } from "@/components/events/EventForm";
import { useTeamEvents } from "@/lib/events/store";
import {
  googleCalendarUrlForTeamEvent,
  nextOccurrenceStartsAt,
} from "@/lib/calendar";
import type { Member, TeamEvent } from "@/types";

function canManageTeamEvents(member: Member | null, teamId: string) {
  if (!member) return false;
  if (member.roleIds.includes("role_admin")) return true;
  const team = TEAMS.find((t) => t.id === teamId);
  return Boolean(team?.leadIds.includes(member.id));
}

function canManageEvent(member: Member | null, event: TeamEvent) {
  if (!member) return false;
  if (canManageTeamEvents(member, event.teamId)) return true;
  return event.createdBy === member.id;
}

export default function TeamDetailPage() {
  const params = useParams<{ id: string }>();
  const { member } = useAuth();
  const team = getTeam(params.id);
  const eventsForTeam = useTeamEvents((s) => s.eventsForTeam);
  const createEvent = useTeamEvents((s) => s.createEvent);
  const updateEvent = useTeamEvents((s) => s.updateEvent);
  const deleteEvent = useTeamEvents((s) => s.deleteEvent);
  const [showCreate, setShowCreate] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const events = eventsForTeam(params.id);

  if (!team) {
    return (
      <div className="py-16 text-center">
        <p className="text-lg">Team not found</p>
        <Link
          href="/teams"
          className="mt-3 inline-block text-sm text-secondary underline"
        >
          Back to teams
        </Link>
      </div>
    );
  }

  const members = MEMBERS.filter((m) => team.memberIds.includes(m.id));
  const leads = MEMBERS.filter((m) => team.leadIds.includes(m.id));
  const canCreate = canManageTeamEvents(member, team.id);
  const editing = events.find((e) => e.id === editingId) ?? null;

  return (
    <div className="max-w-2xl">
      <Link
        href="/teams"
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-secondary hover:text-[var(--text-primary)]"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Teams
      </Link>

      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <span
              className="h-2.5 w-2.5 rounded-full"
              style={{ background: team.color }}
            />
            <h1 className="text-2xl font-medium tracking-tight">{team.name}</h1>
          </div>
          <p className="mt-2 max-w-lg text-sm text-secondary">
            {team.description}
          </p>
          <p className="mt-2 text-xs text-tertiary">
            Led by {leads.map((l) => displayName(l)).join(", ") || "—"}
          </p>
        </div>
        {canCreate && (
          <Button
            onClick={() => {
              setEditingId(null);
              setShowCreate(true);
            }}
            size="sm"
          >
            <Plus className="h-3.5 w-3.5" />
            Create event
          </Button>
        )}
      </div>

      {showCreate && member && (
        <EventForm
          mode="create"
          teamId={team.id}
          createdBy={member.id}
          onCancel={() => setShowCreate(false)}
          onSubmit={(input) => {
            createEvent(input);
            setShowCreate(false);
          }}
        />
      )}

      {editing && member && (
        <EventForm
          key={editing.id}
          mode="edit"
          teamId={team.id}
          createdBy={member.id}
          initial={editing}
          onCancel={() => setEditingId(null)}
          onSubmit={(input) => {
            updateEvent(editing.id, input);
            setEditingId(null);
          }}
        />
      )}

      <section className="mb-8">
        <SectionLabel>Upcoming events</SectionLabel>
        {events.length === 0 ? (
          <GlassCard>
            <p className="text-sm text-secondary">
              No events yet.
              {canCreate
                ? " Create one so teammates see it on Home and Meetings."
                : ""}
            </p>
          </GlassCard>
        ) : (
          <div className="flex flex-col gap-3">
            {events.map((event) => {
              const creator = getMember(event.createdBy);
              const manage = canManageEvent(member, event);
              return (
                <GlassCard key={event.id}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="text-sm font-medium">{event.title}</h3>
                      <p className="mt-1 text-xs text-tertiary">
                        {format(
                          parseISO(event.startsAt),
                          "EEE, MMM d · h:mm a"
                        )}
                        {event.recurringUntil ? " · Weekly" : ""}
                        {creator ? ` · by ${displayName(creator)}` : ""}
                      </p>
                      {event.description && (
                        <p className="mt-2 text-sm text-secondary">
                          {event.description}
                        </p>
                      )}
                    </div>
                    {manage && (
                      <div className="flex shrink-0 gap-1">
                        <button
                          type="button"
                          onClick={() => {
                            setShowCreate(false);
                            setEditingId(event.id);
                          }}
                          className="rounded p-1.5 text-tertiary hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)]"
                          aria-label="Edit event"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (
                              confirm(
                                `Delete “${event.title}”? This can’t be undone.`
                              )
                            ) {
                              deleteEvent(event.id);
                              if (editingId === event.id) setEditingId(null);
                            }
                          }}
                          className="rounded p-1.5 text-tertiary hover:bg-[var(--surface-hover)] hover:text-[var(--danger)]"
                          aria-label="Delete event"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    {event.zoomLink && (
                      <a
                        href={event.zoomLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex h-8 items-center gap-1.5 rounded-[var(--radius-sm)] bg-[var(--accent)] px-2.5 text-xs font-medium text-[var(--text-inverse)]"
                      >
                        <Video className="h-3.5 w-3.5" />
                        Join
                      </a>
                    )}
                    <a
                      href={googleCalendarUrlForTeamEvent({
                        title: `${team.name}: ${event.title}`,
                        description: event.description,
                        zoomLink: event.zoomLink,
                        location: event.location,
                        startsAt: nextOccurrenceStartsAt(event),
                        endsAt: event.endsAt,
                        recurringUntil: event.recurringUntil,
                      })}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex h-8 items-center gap-1.5 rounded-[var(--radius-sm)] border border-[var(--border)] px-2.5 text-xs hover:bg-[var(--surface-hover)]"
                    >
                      <CalendarPlus className="h-3.5 w-3.5" />
                      Google Calendar
                    </a>
                  </div>

                  {event.materials.length > 0 && (
                    <div className="mt-3 space-y-1 border-t border-[var(--border)] pt-3">
                      {event.materials.map((m) => (
                        <a
                          key={m.id}
                          href={m.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-sm text-secondary hover:text-[var(--text-primary)]"
                        >
                          <FileText className="h-3.5 w-3.5 text-tertiary" />
                          {m.title}
                          <ExternalLink className="h-3 w-3 text-tertiary" />
                        </a>
                      ))}
                    </div>
                  )}
                </GlassCard>
              );
            })}
          </div>
        )}
      </section>

      <section>
        <SectionLabel>Members</SectionLabel>
        <div className="divide-y divide-[var(--border)] overflow-hidden rounded-[var(--radius-md)] border border-[var(--border)]">
          {members.map((m) => (
            <Link
              key={m.id}
              href={`/directory/${m.id}`}
              className="flex items-center gap-3 px-3 py-2.5 hover:bg-[var(--surface-hover)]"
            >
              <Avatar name={displayName(m)} src={m.pfpUrl} size="sm" />
              <div className="min-w-0 flex-1">
                <p className="text-sm">{displayName(m)}</p>
                <p className="text-xs text-tertiary">
                  {team.leadIds.includes(m.id) ? "Lead · " : ""}
                  {m.title}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
