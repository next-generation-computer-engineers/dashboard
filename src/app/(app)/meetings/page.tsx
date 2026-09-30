"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { useAuth } from "@/lib/auth/AuthProvider";
import { PageHeader } from "@/components/ui/PageHeader";
import { GlassCard } from "@/components/ui/GlassCard";
import { TeamEventCard } from "@/components/events/TeamEventCard";
import { EventForm } from "@/components/events/EventForm";
import {
  filterEventsForTeams,
  useTeamEvents,
} from "@/lib/events/store";
import { useTeamsStore } from "@/lib/teams/store";
import { teamIdsForMember } from "@/lib/teams/membership";
import { Button } from "@/components/ui/Button";
import type { Member, Team, TeamEvent } from "@/types";

function leadTeamsFor(member: Member, teams: Team[]) {
  if (member.roleIds.includes("role_admin")) return teams;
  return teams.filter((t) => t.leadIds.includes(member.id));
}

function canManageEvent(member: Member, event: TeamEvent, teams: Team[]) {
  if (member.roleIds.includes("role_admin")) return true;
  const team = teams.find((t) => t.id === event.teamId);
  if (team?.leadIds.includes(member.id)) return true;
  return event.createdBy === member.id;
}

export default function MeetingsPage() {
  const { member } = useAuth();
  const allEvents = useTeamEvents((s) => s.events);
  const createEvent = useTeamEvents((s) => s.createEvent);
  const updateEvent = useTeamEvents((s) => s.updateEvent);
  const deleteEvent = useTeamEvents((s) => s.deleteEvent);
  const teams = useTeamsStore((s) => s.teams);

  const [creating, setCreating] = useState(false);
  const [createTeamId, setCreateTeamId] = useState<string>("");
  const [editing, setEditing] = useState<TeamEvent | null>(null);

  const leadTeams = useMemo(
    () => (member ? leadTeamsFor(member, teams) : []),
    [member, teams]
  );

  const myTeamIds = useMemo(
    () => (member ? teamIdsForMember(teams, member.id) : []),
    [member, teams]
  );

  const events = useMemo(
    () => filterEventsForTeams(allEvents, myTeamIds),
    [allEvents, myTeamIds]
  );

  if (!member) return null;

  const defaultTeamId = createTeamId || leadTeams[0]?.id || "";

  return (
    <div className="max-w-2xl">
      <PageHeader
        title="Meetings"
        description="Team events for groups you’re on. Leads can create, edit, and delete."
        actions={
          leadTeams.length > 0 ? (
            <Button
              size="sm"
              onClick={() => {
                setEditing(null);
                setCreateTeamId(leadTeams[0].id);
                setCreating(true);
              }}
            >
              <Plus className="h-3.5 w-3.5" />
              Create event
            </Button>
          ) : undefined
        }
      />

      {creating && defaultTeamId && (
        <div className="mb-6">
          {leadTeams.length > 1 && (
            <label className="mb-3 block">
              <span className="mb-1 block text-xs text-tertiary">Team</span>
              <select
                value={defaultTeamId}
                onChange={(e) => setCreateTeamId(e.target.value)}
                className="input-field appearance-none"
              >
                {leadTeams.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </label>
          )}
          <EventForm
            mode="create"
            teamId={defaultTeamId}
            createdBy={member.id}
            onCancel={() => setCreating(false)}
            onSubmit={(input) => {
              createEvent({ ...input, teamId: defaultTeamId });
              setCreating(false);
            }}
          />
        </div>
      )}

      {editing && (
        <EventForm
          key={editing.id}
          mode="edit"
          teamId={editing.teamId}
          createdBy={member.id}
          initial={editing}
          onCancel={() => setEditing(null)}
          onSubmit={(input) => {
            updateEvent(editing.id, input);
            setEditing(null);
          }}
        />
      )}

      {events.length === 0 && !creating ? (
        <GlassCard className="py-10 text-center">
          <p className="text-sm text-secondary">No upcoming team meetings.</p>
          {leadTeams.length > 0 && (
            <button
              type="button"
              onClick={() => {
                setCreateTeamId(leadTeams[0].id);
                setCreating(true);
              }}
              className="mt-3 text-sm underline underline-offset-2"
            >
              Create one for {leadTeams[0].name}
            </button>
          )}
        </GlassCard>
      ) : (
        <div className="flex flex-col gap-3">
          {events.map((event) => (
            <TeamEventCard
              key={event.id}
              event={event}
              onEdit={
                canManageEvent(member, event, teams)
                  ? () => {
                      setCreating(false);
                      setEditing(event);
                    }
                  : undefined
              }
              onDelete={
                canManageEvent(member, event, teams)
                  ? () => {
                      if (
                        confirm(
                          `Delete “${event.title}”? This can’t be undone.`
                        )
                      ) {
                        deleteEvent(event.id);
                        if (editing?.id === event.id) setEditing(null);
                      }
                    }
                  : undefined
              }
            />
          ))}
        </div>
      )}

      <p className="mt-6 text-sm text-secondary">
        You can also manage events from{" "}
        <Link
          href="/teams"
          className="text-[var(--text-primary)] underline underline-offset-2"
        >
          Teams
        </Link>
        .
      </p>
    </div>
  );
}
