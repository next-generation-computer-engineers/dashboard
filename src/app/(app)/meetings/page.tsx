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
  filterEventsForMeetingsPage,
  useTeamEvents,
} from "@/lib/events/store";
import { useTeamsStore } from "@/lib/teams/store";
import { teamIdsForMember } from "@/lib/teams/membership";
import {
  canManageEvent,
  leadTeamsFor,
} from "@/lib/teams/permissions";
import { nextOccurrenceStartsAt } from "@/lib/calendar";
import { Button } from "@/components/ui/Button";
import type { TeamEvent } from "@/types";

export default function MeetingsPage() {
  const { member } = useAuth();
  const allEvents = useTeamEvents((s) => s.events);
  const createEvent = useTeamEvents((s) => s.createEvent);
  const updateEvent = useTeamEvents((s) => s.updateEvent);
  const deleteEvent = useTeamEvents((s) => s.deleteEvent);
  const teams = useTeamsStore((s) => s.teams);

  const [creating, setCreating] = useState(false);
  const [createTeamId, setCreateTeamId] = useState<string>("");
  const [filterTeamId, setFilterTeamId] = useState<string>("all");
  const [editing, setEditing] = useState<TeamEvent | null>(null);

  const leadTeams = useMemo(
    () => (member ? leadTeamsFor(member, teams) : []),
    [member, teams]
  );

  const myTeamIds = useMemo(
    () => (member ? teamIdsForMember(teams, member.id) : []),
    [member, teams]
  );

  /** Teams shown in the filter: membership + any you lead */
  const filterableTeams = useMemo(() => {
    const ids = new Set([...myTeamIds, ...leadTeams.map((t) => t.id)]);
    return teams
      .filter((t) => ids.has(t.id))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [teams, myTeamIds, leadTeams]);

  const visibleTeamIds = useMemo(() => {
    if (filterTeamId === "all") {
      return Array.from(
        new Set([...myTeamIds, ...leadTeams.map((t) => t.id)])
      );
    }
    return [filterTeamId];
  }, [filterTeamId, myTeamIds, leadTeams]);

  const events = useMemo(
    () =>
      filterEventsForMeetingsPage(
        allEvents,
        visibleTeamIds,
        nextOccurrenceStartsAt
      ),
    [allEvents, visibleTeamIds]
  );

  if (!member) return null;

  const defaultTeamId =
    createTeamId ||
    (filterTeamId !== "all" &&
    leadTeams.some((t) => t.id === filterTeamId)
      ? filterTeamId
      : leadTeams[0]?.id) ||
    "";

  return (
    <div className="max-w-2xl">
      <PageHeader
        title="Meetings"
        description="All upcoming and recurring meetings for your teams — not just today."
        actions={
          leadTeams.length > 0 ? (
            <Button
              size="sm"
              onClick={() => {
                setEditing(null);
                setCreateTeamId(
                  filterTeamId !== "all" &&
                    leadTeams.some((t) => t.id === filterTeamId)
                    ? filterTeamId
                    : leadTeams[0].id
                );
                setCreating(true);
              }}
            >
              <Plus className="h-3.5 w-3.5" />
              Create event
            </Button>
          ) : undefined
        }
      />

      {filterableTeams.length > 0 && (
        <div className="mb-4">
          <label className="mb-1 block text-xs text-tertiary">
            Filter by team
          </label>
          <select
            value={filterTeamId}
            onChange={(e) => setFilterTeamId(e.target.value)}
            className="input-field appearance-none"
          >
            <option value="all">All my teams</option>
            {filterableTeams.map((t) => {
              const lead = leadTeams.some((l) => l.id === t.id);
              return (
                <option key={t.id} value={t.id}>
                  {t.name}
                  {lead ? " (you lead)" : ""}
                </option>
              );
            })}
          </select>
          {leadTeams.length > 0 && (
            <p className="mt-1.5 text-[11px] text-tertiary">
              You can create events for:{" "}
              {leadTeams.map((t) => t.name).join(", ")}
            </p>
          )}
        </div>
      )}

      {creating && defaultTeamId && (
        <div className="mb-6">
          {leadTeams.length > 1 && (
            <label className="mb-3 block">
              <span className="mb-1 block text-xs text-tertiary">
                Create event for
              </span>
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
          <p className="text-sm text-secondary">
            {filterTeamId === "all"
              ? "No upcoming or recurring meetings."
              : "No meetings for this team."}
          </p>
          {leadTeams.length > 0 && (
            <button
              type="button"
              onClick={() => {
                setCreateTeamId(
                  filterTeamId !== "all" &&
                    leadTeams.some((t) => t.id === filterTeamId)
                    ? filterTeamId
                    : leadTeams[0].id
                );
                setCreating(true);
              }}
              className="mt-3 text-sm underline underline-offset-2"
            >
              Create one
              {leadTeams[0] ? ` for ${leadTeams[0].name}` : ""}
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
