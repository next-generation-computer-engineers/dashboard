"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { TeamEvent, TeamEventMaterial } from "@/types";
import { SEED_TEAM_EVENTS } from "@/data/seed";

interface CreateTeamEventInput {
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
  hydrated: boolean;
  setHydrated: (v: boolean) => void;
  createEvent: (input: CreateTeamEventInput) => TeamEvent;
  deleteEvent: (id: string) => void;
  eventsForTeams: (teamIds: string[]) => TeamEvent[];
  eventsForTeam: (teamId: string) => TeamEvent[];
}

function mergeSeed(stored: TeamEvent[] | undefined): TeamEvent[] {
  const seedIds = new Set(SEED_TEAM_EVENTS.map((e) => e.id));
  const custom = (stored ?? []).filter((e) => !seedIds.has(e.id));
  return [...SEED_TEAM_EVENTS, ...custom].sort(
    (a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime()
  );
}

export const useTeamEvents = create<TeamEventsState>()(
  persist(
    (set, get) => ({
      events: SEED_TEAM_EVENTS,
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
        set({ events: [...get().events, event] });
        return event;
      },
      deleteEvent: (id) =>
        set({ events: get().events.filter((e) => e.id !== id) }),
      eventsForTeams: (teamIds) => {
        const setIds = new Set(teamIds);
        const now = Date.now() - 2 * 60 * 60 * 1000;
        return get()
          .events.filter((e) => setIds.has(e.teamId))
          .filter((e) => {
            const end = e.endsAt
              ? new Date(e.endsAt).getTime()
              : new Date(e.startsAt).getTime() + 2 * 60 * 60 * 1000;
            // Keep recurring / upcoming
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
      name: "ceng_team_events",
      partialize: (s) => ({ events: s.events }),
      merge: (persisted, current) => {
        const p = persisted as { events?: TeamEvent[] } | undefined;
        return {
          ...current,
          events: mergeSeed(p?.events),
        };
      },
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true);
      },
    }
  )
);
