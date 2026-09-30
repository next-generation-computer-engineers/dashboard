"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Team } from "@/types";
import { TEAMS as SEED_TEAMS } from "@/data/roster";

export interface CreateTeamInput {
  name: string;
  description: string;
  color?: string;
  leadIds?: string[];
  memberIds?: string[];
}

interface TeamsState {
  teams: Team[];
  deletedIds: string[];
  hydrated: boolean;
  setHydrated: (v: boolean) => void;
  createTeam: (input: CreateTeamInput) => Team;
  updateTeam: (
    id: string,
    patch: Partial<Pick<Team, "name" | "description" | "color" | "leadIds" | "memberIds">>
  ) => Team | null;
  deleteTeam: (id: string) => void;
  addMember: (teamId: string, memberId: string) => void;
  removeMember: (teamId: string, memberId: string) => void;
  setLead: (teamId: string, memberId: string, isLead: boolean) => void;
  getTeam: (id: string) => Team | undefined;
}

const TEAM_COLORS = [
  "#7EB8A0",
  "#6BA3A0",
  "#D4A574",
  "#74A8D4",
  "#A89BC8",
  "#C9A96E",
  "#C47A7C",
  "#8B9DC3",
];

function slugify(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48);
}

function reconcileTeams(
  stored: Team[] | undefined,
  deletedIds: string[] | undefined
): { teams: Team[]; deletedIds: string[] } {
  const deleted = new Set(deletedIds ?? []);
  const list = stored ? [...stored] : [...SEED_TEAMS];
  const have = new Set(list.map((t) => t.id));

  for (const seed of SEED_TEAMS) {
    if (deleted.has(seed.id) || have.has(seed.id)) continue;
    if (!stored) {
      list.push(seed);
      have.add(seed.id);
    }
  }

  return {
    teams: list.filter((t) => !deleted.has(t.id)),
    deletedIds: [...deleted],
  };
}

export const useTeamsStore = create<TeamsState>()(
  persist(
    (set, get) => ({
      teams: SEED_TEAMS,
      deletedIds: [],
      hydrated: false,
      setHydrated: (v) => set({ hydrated: v }),

      getTeam: (id) => get().teams.find((t) => t.id === id),

      createTeam: (input) => {
        const baseSlug = slugify(input.name) || "team";
        let slug = baseSlug;
        let n = 2;
        while (get().teams.some((t) => t.slug === slug)) {
          slug = `${baseSlug}-${n++}`;
        }
        const leadIds = input.leadIds ?? [];
        const memberIds = Array.from(
          new Set([...(input.memberIds ?? []), ...leadIds])
        );
        const team: Team = {
          id: `team_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          name: input.name.trim(),
          slug,
          description: input.description.trim(),
          color:
            input.color ||
            TEAM_COLORS[get().teams.length % TEAM_COLORS.length],
          leadIds,
          memberIds,
        };
        set({
          teams: [...get().teams, team],
          deletedIds: get().deletedIds.filter((id) => id !== team.id),
        });
        return team;
      },

      updateTeam: (id, patch) => {
        const current = get().teams.find((t) => t.id === id);
        if (!current) return null;
        const updated: Team = {
          ...current,
          ...patch,
          name: patch.name !== undefined ? patch.name.trim() : current.name,
          description:
            patch.description !== undefined
              ? patch.description.trim()
              : current.description,
          leadIds: patch.leadIds ?? current.leadIds,
          memberIds: patch.memberIds
            ? Array.from(
                new Set([
                  ...patch.memberIds,
                  ...(patch.leadIds ?? current.leadIds),
                ])
              )
            : current.memberIds,
        };
        if (patch.leadIds && !patch.memberIds) {
          updated.memberIds = Array.from(
            new Set([...current.memberIds, ...patch.leadIds])
          );
        }
        set({
          teams: get().teams.map((t) => (t.id === id ? updated : t)),
        });
        return updated;
      },

      deleteTeam: (id) => {
        const deletedIds = get().deletedIds.includes(id)
          ? get().deletedIds
          : [...get().deletedIds, id];
        set({
          teams: get().teams.filter((t) => t.id !== id),
          deletedIds,
        });
      },

      addMember: (teamId, memberId) => {
        set({
          teams: get().teams.map((t) => {
            if (t.id !== teamId) return t;
            if (t.memberIds.includes(memberId)) return t;
            return { ...t, memberIds: [...t.memberIds, memberId] };
          }),
        });
      },

      removeMember: (teamId, memberId) => {
        set({
          teams: get().teams.map((t) => {
            if (t.id !== teamId) return t;
            return {
              ...t,
              memberIds: t.memberIds.filter((id) => id !== memberId),
              leadIds: t.leadIds.filter((id) => id !== memberId),
            };
          }),
        });
      },

      setLead: (teamId, memberId, isLead) => {
        set({
          teams: get().teams.map((t) => {
            if (t.id !== teamId) return t;
            const memberIds = t.memberIds.includes(memberId)
              ? t.memberIds
              : [...t.memberIds, memberId];
            const leadIds = isLead
              ? t.leadIds.includes(memberId)
                ? t.leadIds
                : [...t.leadIds, memberId]
              : t.leadIds.filter((id) => id !== memberId);
            return { ...t, memberIds, leadIds };
          }),
        });
      },
    }),
    {
      name: "ceng_teams_v1",
      partialize: (s) => ({ teams: s.teams, deletedIds: s.deletedIds }),
      merge: (persisted, current) => {
        const p = persisted as
          | { teams?: Team[]; deletedIds?: string[] }
          | undefined;
        const reconciled = reconcileTeams(p?.teams, p?.deletedIds);
        return {
          ...current,
          teams: reconciled.teams,
          deletedIds: reconciled.deletedIds,
        };
      },
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true);
      },
    }
  )
);
