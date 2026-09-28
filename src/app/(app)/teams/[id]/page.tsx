"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useMemo, useState } from "react";
import { format, parseISO } from "date-fns";
import {
  ArrowLeft,
  Video,
  CalendarPlus,
  FileText,
  ExternalLink,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { useAuth } from "@/lib/auth/AuthProvider";
import { getTeam, MEMBERS, getMember } from "@/data/seed";
import { displayName } from "@/lib/permissions";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { GlassCard } from "@/components/ui/GlassCard";
import { SectionLabel } from "@/components/ui/PageHeader";
import { useTeamEvents } from "@/lib/events/store";
import {
  googleCalendarUrlForTeamEvent,
  nextOccurrenceStartsAt,
} from "@/lib/calendar";
import type { TeamEventMaterial } from "@/types";
import { cn } from "@/lib/utils";

export default function TeamDetailPage() {
  const params = useParams<{ id: string }>();
  const { member } = useAuth();
  const team = getTeam(params.id);
  const eventsForTeam = useTeamEvents((s) => s.eventsForTeam);
  const createEvent = useTeamEvents((s) => s.createEvent);
  const deleteEvent = useTeamEvents((s) => s.deleteEvent);
  const [showCreate, setShowCreate] = useState(false);

  const events = eventsForTeam(params.id);

  if (!team) {
    return (
      <div className="py-16 text-center">
        <p className="text-lg">Team not found</p>
        <Link href="/teams" className="mt-3 inline-block text-sm underline text-secondary">
          Back to teams
        </Link>
      </div>
    );
  }

  const members = MEMBERS.filter((m) => team.memberIds.includes(m.id));
  const leads = MEMBERS.filter((m) => team.leadIds.includes(m.id));
  const isLead = Boolean(member && team.leadIds.includes(member.id));

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
          <p className="mt-2 max-w-lg text-sm text-secondary">{team.description}</p>
          <p className="mt-2 text-xs text-tertiary">
            Led by {leads.map((l) => displayName(l)).join(", ")}
          </p>
        </div>
        {isLead && (
          <Button onClick={() => setShowCreate(true)} size="sm">
            <Plus className="h-3.5 w-3.5" />
            Create event
          </Button>
        )}
      </div>

      {showCreate && member && (
        <CreateEventForm
          teamId={team.id}
          createdBy={member.id}
          onCancel={() => setShowCreate(false)}
          onCreate={(input) => {
            createEvent(input);
            setShowCreate(false);
          }}
        />
      )}

      <section className="mb-8">
        <SectionLabel>Upcoming events</SectionLabel>
        {events.length === 0 ? (
          <GlassCard>
            <p className="text-sm text-secondary">
              No events yet.
              {isLead ? " Create one so teammates see it on their home dashboard." : ""}
            </p>
          </GlassCard>
        ) : (
          <div className="flex flex-col gap-3">
            {events.map((event) => {
              const creator = getMember(event.createdBy);
              return (
                <GlassCard key={event.id}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-sm font-medium">{event.title}</h3>
                      <p className="mt-1 text-xs text-tertiary">
                        {format(parseISO(event.startsAt), "EEE, MMM d · h:mm a")}
                        {event.recurringUntil ? " · Weekly" : ""}
                        {creator ? ` · by ${displayName(creator)}` : ""}
                      </p>
                      {event.description && (
                        <p className="mt-2 text-sm text-secondary">
                          {event.description}
                        </p>
                      )}
                    </div>
                    {isLead && (
                      <button
                        type="button"
                        onClick={() => deleteEvent(event.id)}
                        className="rounded p-1.5 text-tertiary hover:bg-[var(--surface-hover)] hover:text-[var(--danger)]"
                        aria-label="Delete event"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
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

function CreateEventForm({
  teamId,
  createdBy,
  onCancel,
  onCreate,
}: {
  teamId: string;
  createdBy: string;
  onCancel: () => void;
  onCreate: (input: {
    teamId: string;
    title: string;
    description?: string;
    startsAt: string;
    endsAt?: string;
    zoomLink?: string;
    materials: TeamEventMaterial[];
    recurringUntil?: string;
    createdBy: string;
  }) => void;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("18:00");
  const [duration, setDuration] = useState("60");
  const [zoomLink, setZoomLink] = useState("");
  const [recurring, setRecurring] = useState(false);
  const [recurringUntil, setRecurringUntil] = useState("");
  const [materials, setMaterials] = useState<{ title: string; url: string }[]>([
    { title: "", url: "" },
  ]);

  const canSubmit = useMemo(
    () => title.trim() && date && time,
    [title, date, time]
  );

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    const startsAt = new Date(`${date}T${time}:00`);
    const endsAt = new Date(
      startsAt.getTime() + Number(duration) * 60 * 1000
    );
    onCreate({
      teamId,
      title,
      description,
      startsAt: startsAt.toISOString(),
      endsAt: endsAt.toISOString(),
      zoomLink,
      materials: materials
        .filter((m) => m.title.trim() && m.url.trim())
        .map((m, i) => ({
          id: `mat_${Date.now()}_${i}`,
          title: m.title.trim(),
          url: m.url.trim(),
          type: "link" as const,
        })),
      recurringUntil: recurring && recurringUntil ? recurringUntil : undefined,
      createdBy,
    });
  }

  return (
    <GlassCard className="mb-8 relative">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-medium">New team event</h2>
        <button
          type="button"
          onClick={onCancel}
          className="rounded p-1 text-tertiary hover:text-secondary"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <form onSubmit={submit} className="space-y-3">
        <div>
          <label className="mb-1 block text-xs text-tertiary">Title</label>
          <input
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="input-field"
            placeholder="Weekly curriculum sync"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-tertiary">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="input-field !h-auto !py-2.5 resize-none"
            rows={2}
            placeholder="What should people prepare?"
          />
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <div>
            <label className="mb-1 block text-xs text-tertiary">Date</label>
            <input
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="input-field"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-tertiary">Time</label>
            <input
              type="time"
              required
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="input-field"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-tertiary">Duration</label>
            <select
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              className="input-field appearance-none"
            >
              <option value="30">30 min</option>
              <option value="45">45 min</option>
              <option value="60">1 hour</option>
              <option value="90">1.5 hours</option>
              <option value="120">2 hours</option>
            </select>
          </div>
        </div>
        <div>
          <label className="mb-1 block text-xs text-tertiary">Zoom link</label>
          <input
            value={zoomLink}
            onChange={(e) => setZoomLink(e.target.value)}
            className="input-field"
            placeholder="https://zoom.us/j/…"
          />
        </div>

        <label className="flex items-center gap-2 text-sm text-secondary">
          <input
            type="checkbox"
            checked={recurring}
            onChange={(e) => setRecurring(e.target.checked)}
            className="rounded border-[var(--border)]"
          />
          Weekly recurring
        </label>
        {recurring && (
          <div>
            <label className="mb-1 block text-xs text-tertiary">
              Repeat until
            </label>
            <input
              type="date"
              value={recurringUntil}
              onChange={(e) => setRecurringUntil(e.target.value)}
              className="input-field"
            />
          </div>
        )}

        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <label className="text-xs text-tertiary">Materials</label>
            <button
              type="button"
              onClick={() =>
                setMaterials((m) => [...m, { title: "", url: "" }])
              }
              className="text-xs text-secondary hover:text-[var(--text-primary)]"
            >
              + Add link
            </button>
          </div>
          <div className="space-y-2">
            {materials.map((mat, i) => (
              <div key={i} className="grid gap-2 sm:grid-cols-2">
                <input
                  value={mat.title}
                  onChange={(e) =>
                    setMaterials((list) =>
                      list.map((item, idx) =>
                        idx === i ? { ...item, title: e.target.value } : item
                      )
                    )
                  }
                  className="input-field"
                  placeholder="Doc title"
                />
                <input
                  value={mat.url}
                  onChange={(e) =>
                    setMaterials((list) =>
                      list.map((item, idx) =>
                        idx === i ? { ...item, url: e.target.value } : item
                      )
                    )
                  }
                  className="input-field"
                  placeholder="https://…"
                />
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-2 pt-1">
          <Button type="submit" disabled={!canSubmit}>
            Publish to team
          </Button>
          <Button type="button" variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
        </div>
        <p className={cn("text-[11px] text-tertiary")}>
          Teammates will see this on their home dashboard with Join + materials.
        </p>
      </form>
    </GlassCard>
  );
}
