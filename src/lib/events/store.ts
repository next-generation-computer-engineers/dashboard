"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { TeamEvent, TeamEventMaterial } from "@/types";
import { SEED_TEAM_EVENTS } from "@/data/seed";

export interface CreateTeamEventInput {
  teamId: string;
  title: string;
  description?: string;
  startsAt: string;
  endsAt?: string;
  zoomLink?: string;
  location?: string;
  materials: TeamEventMaterial[];
  recurringUntil?: string;
  createdBy: string;
}

interface TeamEventsState {
  events: TeamEvent[];
  /** Seed event ids the user removed — keep them from coming back on rehydrate */
  deletedIds: string[];
  hydrated: boolean;
  setHydrated: (v: boolean) => void;
  createEvent: (input: CreateTeamEventInput) => TeamEvent;
  updateEvent: (id: string, input: CreateTeamEventInput) => TeamEvent | null;
  deleteEvent: (id: string) => void;
}

function sortEvents(events: TeamEvent[]) {
  return [...events].sort(
    (a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime()
  );
}

/** First visit: seed. Later: trust stored list, only add new seed ids that were never deleted. */
function reconcileEvents(
  stored: TeamEvent[] | undefined,
  deletedIds: string[] | undefined
): { events: TeamEvent[]; deletedIds: string[] } {
  const deleted = new Set(deletedIds ?? []);
  const list = stored ? [...stored] : [...SEED_TEAM_EVENTS];
  const have = new Set(list.map((e) => e.id));

  for (const seed of SEED_TEAM_EVENTS) {
    if (deleted.has(seed.id) || have.has(seed.id)) continue;
    if (!stored) {
      list.push(seed);
      have.add(seed.id);
    }
  }

  return {
    events: sortEvents(list.filter((e) => !deleted.has(e.id))),
    deletedIds: [...deleted],
  };
}

export function filterEventsForTeams(
  events: TeamEvent[],
  teamIds: string[]
): TeamEvent[] {
  const setIds = new Set(teamIds);
  const now = Date.now() - 2 * 60 * 60 * 1000;
  return events
    .filter((e) => setIds.has(e.teamId))
    .filter((e) => {
      const end = e.endsAt
        ? new Date(e.endsAt).getTime()
        : new Date(e.startsAt).getTime() + 2 * 60 * 60 * 1000;
      if (e.recurringUntil) {
        return new Date(e.recurringUntil).getTime() >= now;
      }
      return end >= now;
    })
    .sort(
      (a, b) =>
        new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime()
    );
}

/** Meetings page: upcoming one-offs + active recurring, sorted by next occurrence. */
export function filterEventsForMeetingsPage(
  events: TeamEvent[],
  teamIds: string[],
  nextOccurrence: (event: TeamEvent) => string
): TeamEvent[] {
  const setIds = new Set(teamIds);
  const now = Date.now() - 12 * 60 * 60 * 1000; // keep same-day events visible
  return events
    .filter((e) => setIds.has(e.teamId))
    .filter((e) => {
      if (e.recurringUntil) {
        const until = new Date(`${e.recurringUntil}T23:59:59`).getTime();
        return !Number.isNaN(until) && until >= now;
      }
      // Prefer start time so future meetings always show even if duration looks off
      const start = new Date(e.startsAt).getTime();
      if (!Number.isNaN(start) && start >= now) return true;
      const end = e.endsAt
        ? new Date(e.endsAt).getTime()
        : start + 2 * 60 * 60 * 1000;
      return !Number.isNaN(end) && end >= now;
    })
    .sort(
      (a, b) =>
        new Date(nextOccurrence(a)).getTime() -
        new Date(nextOccurrence(b)).getTime()
    );
}

export function filterEventsForTeam(
  events: TeamEvent[],
  teamId: string
): TeamEvent[] {
  return events
    .filter((e) => e.teamId === teamId)
    .sort(
      (a, b) =>
        new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime()
    );
}

export const useTeamEvents = create<TeamEventsState>()(
  persist(
    (set, get) => ({
      events: SEED_TEAM_EVENTS,
      deletedIds: [],
      hydrated: false,
      setHydrated: (v) => set({ hydrated: v }),

      createEvent: (input) => {
        const event: TeamEvent = {
          id: `te_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
          teamId: input.teamId,
          title: input.title.trim(),
          description: input.description?.trim() || undefined,
          startsAt: input.startsAt,
          endsAt: input.endsAt,
          zoomLink: input.zoomLink?.trim() || undefined,
          location: input.location?.trim() || undefined,
          materials: input.materials,
          recurringUntil: input.recurringUntil || undefined,
          createdBy: input.createdBy,
          createdAt: new Date().toISOString(),
        };
        set({
          events: sortEvents([...get().events, event]),
          deletedIds: get().deletedIds.filter((id) => id !== event.id),
        });
        return event;
      },

      updateEvent: (id, input) => {
        const current = get().events.find((e) => e.id === id);
        if (!current) return null;
        const updated: TeamEvent = {
          ...current,
          teamId: input.teamId,
          title: input.title.trim(),
          description: input.description?.trim() || undefined,
          startsAt: input.startsAt,
          endsAt: input.endsAt,
          zoomLink: input.zoomLink?.trim() || undefined,
          location: input.location?.trim() || undefined,
          materials: input.materials,
          recurringUntil: input.recurringUntil || undefined,
        };
        set({
          events: sortEvents(
            get().events.map((e) => (e.id === id ? updated : e))
          ),
        });
        return updated;
      },

      deleteEvent: (id) => {
        const deletedIds = get().deletedIds.includes(id)
          ? get().deletedIds
          : [...get().deletedIds, id];
        set({
          events: get().events.filter((e) => e.id !== id),
          deletedIds,
        });
      },
    }),
    {
      name: "ceng_team_events_v2",
      partialize: (s) => ({ events: s.events, deletedIds: s.deletedIds }),
      merge: (persisted, current) => {
        const p = persisted as
          | { events?: TeamEvent[]; deletedIds?: string[] }
          | undefined;
        const reconciled = reconcileEvents(p?.events, p?.deletedIds);
        return {
          ...current,
          events: reconciled.events,
          deletedIds: reconciled.deletedIds,
        };
      },
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true);
      },
    }
  )
);
