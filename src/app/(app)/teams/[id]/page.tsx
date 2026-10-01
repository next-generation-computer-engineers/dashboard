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
  Pencil,
  Star,
  UserMinus,
  UserPlus,
} from "lucide-react";
import { useAuth } from "@/lib/auth/AuthProvider";
import { useMembers } from "@/lib/members/MembersProvider";
import { displayName, hasPermission } from "@/lib/permissions";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { GlassCard } from "@/components/ui/GlassCard";
import { SectionLabel } from "@/components/ui/PageHeader";
import { EventForm } from "@/components/events/EventForm";
import {
  filterEventsForTeam,
  useTeamEvents,
} from "@/lib/events/store";
import { useTeamsStore } from "@/lib/teams/store";
import { useJoinRequests } from "@/lib/teams/joinRequests";
import {
  isTeamMember,
  teamIdsForMember,
} from "@/lib/teams/membership";
import {
  canManageEvent,
  canManageTeamEvents,
} from "@/lib/teams/permissions";
import {
  googleCalendarUrlForTeamEvent,
  nextOccurrenceStartsAt,
} from "@/lib/calendar";
import type { Member } from "@/types";

export default function TeamDetailPage() {
  const params = useParams<{ id: string }>();
  const { member } = useAuth();
  const { members, adminPatchMember, getById } = useMembers();
  const teams = useTeamsStore((s) => s.teams);
  const updateTeam = useTeamsStore((s) => s.updateTeam);
  const deleteTeam = useTeamsStore((s) => s.deleteTeam);
  const addMember = useTeamsStore((s) => s.addMember);
  const removeMember = useTeamsStore((s) => s.removeMember);
  const setLead = useTeamsStore((s) => s.setLead);

  const allEvents = useTeamEvents((s) => s.events);
  const createEvent = useTeamEvents((s) => s.createEvent);
  const updateEvent = useTeamEvents((s) => s.updateEvent);
  const deleteEvent = useTeamEvents((s) => s.deleteEvent);

  const allRequests = useJoinRequests((s) => s.requests);
  const requestJoin = useJoinRequests((s) => s.requestJoin);
  const cancelRequest = useJoinRequests((s) => s.cancel);

  const [showCreate, setShowCreate] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [addQuery, setAddQuery] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [joinBusy, setJoinBusy] = useState(false);

  const team = teams.find((t) => t.id === params.id);
  const events = useMemo(
    () => (team ? filterEventsForTeam(allEvents, team.id) : []),
    [allEvents, team]
  );

  const isAdmin = Boolean(
    member && hasPermission(member.roleIds, "admin:access")
  );

  const addCandidates = useMemo(() => {
    if (!team) return [];
    const q = addQuery.trim().toLowerCase();
    return members
      .filter((m) => !team.memberIds.includes(m.id))
      .filter((m) => {
        if (!q) return true;
        return (
          m.fullName.toLowerCase().includes(q) ||
          m.personalEmail.toLowerCase().includes(q) ||
          (m.schoolEmail?.toLowerCase().includes(q) ?? false)
        );
      })
      .sort((a, b) => a.fullName.localeCompare(b.fullName))
      .slice(0, 8);
  }, [members, team, addQuery]);

  const myPendingRequest = useMemo(() => {
    if (!member || !team) return undefined;
    return allRequests.find(
      (r) =>
        r.status === "pending" &&
        r.teamId === team.id &&
        r.memberId === member.id
    );
  }, [allRequests, member, team]);

  async function syncMemberTeams(memberId: string) {
    const ids = teamIdsForMember(useTeamsStore.getState().teams, memberId);
    await adminPatchMember(memberId, { teamIds: ids });
  }

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

  const currentTeam = team;
  const teamMembers = members.filter((m) =>
    currentTeam.memberIds.includes(m.id)
  );
  const canCreate = canManageTeamEvents(member, currentTeam);
  const editing = events.find((e) => e.id === editingId) ?? null;
  const isMember = Boolean(
    member && isTeamMember(currentTeam, member.id)
  );
  const canView = isAdmin || isMember;

  async function onRequestJoin() {
    if (!member) return;
    setJoinBusy(true);
    try {
      requestJoin(currentTeam.id, member.id);
    } finally {
      setJoinBusy(false);
    }
  }

  async function onCancelJoin() {
    if (!member || !myPendingRequest) return;
    setJoinBusy(true);
    try {
      cancelRequest(myPendingRequest.id, member.id);
    } finally {
      setJoinBusy(false);
    }
  }

  async function onAddMember(m: Member) {
    setBusyId(m.id);
    try {
      addMember(currentTeam.id, m.id);
      await syncMemberTeams(m.id);
      setAddQuery("");
    } finally {
      setBusyId(null);
    }
  }

  async function onRemoveMember(m: Member) {
    if (!confirm(`Remove ${displayName(m)} from ${currentTeam.name}?`)) return;
    setBusyId(m.id);
    try {
      removeMember(currentTeam.id, m.id);
      await syncMemberTeams(m.id);
    } finally {
      setBusyId(null);
    }
  }

  async function onToggleLead(m: Member) {
    const makingLead = !currentTeam.leadIds.includes(m.id);
    setBusyId(m.id);
    try {
      setLead(currentTeam.id, m.id, makingLead);
      await syncMemberTeams(m.id);
    } finally {
      setBusyId(null);
    }
  }

  async function onDeleteTeam() {
    if (
      !confirm(
        `Delete team “${currentTeam.name}”? Members stay in the directory; this only removes the team.`
      )
    ) {
      return;
    }
    const affected = [...currentTeam.memberIds];
    deleteTeam(currentTeam.id);
    for (const id of affected) {
      await syncMemberTeams(id);
    }
    window.location.href = "/teams";
  }

  if (!canView) {
    return (
      <div className="max-w-lg py-10">
        <Link
          href="/teams"
          className="mb-6 inline-flex items-center gap-1.5 text-sm text-secondary hover:text-[var(--text-primary)]"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Teams
        </Link>
        <GlassCard className="text-center">
          <h1 className="text-lg font-medium">{currentTeam.name}</h1>
          <p className="mt-2 text-sm text-secondary">
            You’re not on this team, so its members and events are private.
          </p>
          {member && (
            <div className="mt-4">
              {myPendingRequest ? (
                <Button
                  size="sm"
                  variant="secondary"
                  disabled={joinBusy}
                  onClick={() => void onCancelJoin()}
                >
                  Cancel join request
                </Button>
              ) : (
                <Button
                  size="sm"
                  disabled={joinBusy}
                  onClick={() => void onRequestJoin()}
                >
                  Request to join
                </Button>
              )}
            </div>
          )}
        </GlassCard>
      </div>
    );
  }

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
        </div>
        <div className="flex flex-wrap gap-2">
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
          {isAdmin && (
            <Button size="sm" variant="danger" onClick={() => void onDeleteTeam()}>
              Delete team
            </Button>
          )}
        </div>
      </div>

      {isAdmin && (
        <GlassCard className="mb-8">
          <h2 className="mb-1 text-sm font-medium">Team details</h2>
          <p className="mb-3 text-xs text-tertiary">
            Admins can rename the team and update its description.
          </p>
          <AdminTeamMeta
            key={`${team.id}-${team.name}-${team.description}`}
            name={team.name}
            description={team.description}
            onSave={(name, description) => {
              updateTeam(team.id, { name, description });
            }}
          />
        </GlassCard>
      )}

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
              const creator = getById(event.createdBy);
              const manage = canManageEvent(member, event, teams);
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

        {isAdmin && (
          <GlassCard className="mb-3">
            <label className="mb-1 block text-xs text-tertiary">
              Add member
            </label>
            <input
              value={addQuery}
              onChange={(e) => setAddQuery(e.target.value)}
              placeholder="Search name or email…"
              className="input-field"
            />
            {addQuery.trim() && (
              <div className="mt-2 divide-y divide-[var(--border)] rounded-[var(--radius-sm)] border border-[var(--border)]">
                {addCandidates.length === 0 ? (
                  <p className="px-3 py-2 text-xs text-tertiary">No matches</p>
                ) : (
                  addCandidates.map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      disabled={busyId === m.id}
                      onClick={() => void onAddMember(m)}
                      className="flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-[var(--surface-hover)]"
                    >
                      <Avatar name={displayName(m)} src={m.pfpUrl} size="sm" />
                      <span className="min-w-0 flex-1 truncate text-sm">
                        {displayName(m)}
                      </span>
                      <UserPlus className="h-3.5 w-3.5 text-tertiary" />
                    </button>
                  ))
                )}
              </div>
            )}
          </GlassCard>
        )}

        <div className="divide-y divide-[var(--border)] overflow-hidden rounded-[var(--radius-md)] border border-[var(--border)]">
          {teamMembers.length === 0 ? (
            <p className="px-3 py-6 text-center text-sm text-secondary">
              No members yet.
            </p>
          ) : (
            teamMembers.map((m) => {
              const isLead = team.leadIds.includes(m.id);
              return (
                <div
                  key={m.id}
                  className="flex items-center gap-3 px-3 py-2.5"
                >
                  <Link
                    href={`/directory/${m.id}`}
                    className="flex min-w-0 flex-1 items-center gap-3 hover:opacity-90"
                  >
                    <Avatar name={displayName(m)} src={m.pfpUrl} size="sm" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm">{displayName(m)}</p>
                      <p className="text-xs text-tertiary">
                        {isLead ? "Lead" : "Member"}
                        {m.title ? ` · ${m.title}` : ""}
                      </p>
                    </div>
                  </Link>
                  {isAdmin && (
                    <div className="flex shrink-0 gap-1">
                      <button
                        type="button"
                        disabled={busyId === m.id}
                        onClick={() => void onToggleLead(m)}
                        className="rounded p-1.5 text-tertiary hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)]"
                        title={isLead ? "Remove lead" : "Make lead"}
                        aria-label={isLead ? "Remove lead" : "Make lead"}
                      >
                        <Star
                          className={`h-3.5 w-3.5 ${isLead ? "fill-current text-[var(--accent)]" : ""}`}
                        />
                      </button>
                      <button
                        type="button"
                        disabled={busyId === m.id}
                        onClick={() => void onRemoveMember(m)}
                        className="rounded p-1.5 text-tertiary hover:bg-[var(--surface-hover)] hover:text-[var(--danger)]"
                        aria-label="Remove member"
                      >
                        <UserMinus className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </section>
    </div>
  );
}

function AdminTeamMeta({
  name: initialName,
  description: initialDescription,
  onSave,
}: {
  name: string;
  description: string;
  onSave: (name: string, description: string) => void;
}) {
  const [name, setName] = useState(initialName);
  const [description, setDescription] = useState(initialDescription);
  const dirty =
    name.trim() !== initialName || description.trim() !== initialDescription;

  return (
    <form
      className="space-y-3"
      onSubmit={(e) => {
        e.preventDefault();
        if (!name.trim()) return;
        onSave(name.trim(), description.trim());
      }}
    >
      <div>
        <label className="mb-1 block text-xs text-tertiary">Name</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="input-field"
          required
        />
      </div>
      <div>
        <label className="mb-1 block text-xs text-tertiary">Description</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="input-field !h-auto !py-2.5 resize-none"
          rows={2}
        />
      </div>
      <Button type="submit" size="sm" disabled={!dirty || !name.trim()}>
        Save details
      </Button>
    </form>
  );
}
