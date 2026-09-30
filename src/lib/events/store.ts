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
  eventsForTeams: (teamIds: string[]) => TeamEvent[];
  eventsForTeam: (teamId: string) => TeamEvent[];
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
    // Only auto-add seed events on a truly empty first install
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

      eventsForTeams: (teamIds) => {
        const setIds = new Set(teamIds);
        const now = Date.now() - 2 * 60 * 60 * 1000;
        return get()
          .events.filter((e) => setIds.has(e.teamId))
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
      },

      eventsForTeam: (teamId) =>
        get()
          .events.filter((e) => e.teamId === teamId)
          .sort(
            (a, b) =>
              new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime()
          ),
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
