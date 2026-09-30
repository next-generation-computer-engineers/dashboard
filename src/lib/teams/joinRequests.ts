"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type JoinRequestStatus = "pending" | "approved" | "denied";

export interface TeamJoinRequest {
  id: string;
  teamId: string;
  memberId: string;
  createdAt: string;
  status: JoinRequestStatus;
  resolvedAt?: string;
  resolvedBy?: string;
}

interface JoinRequestsState {
  requests: TeamJoinRequest[];
  hydrated: boolean;
  setHydrated: (v: boolean) => void;
  requestJoin: (teamId: string, memberId: string) => TeamJoinRequest | null;
  approve: (id: string, resolvedBy: string) => TeamJoinRequest | null;
  deny: (id: string, resolvedBy: string) => TeamJoinRequest | null;
  cancel: (id: string, memberId: string) => void;
  pendingForTeams: (teamIds: string[]) => TeamJoinRequest[];
  pendingForMember: (memberId: string) => TeamJoinRequest[];
  pendingForTeamAndMember: (
    teamId: string,
    memberId: string
  ) => TeamJoinRequest | undefined;
}

export const useJoinRequests = create<JoinRequestsState>()(
  persist(
    (set, get) => ({
      requests: [],
      hydrated: false,
      setHydrated: (v) => set({ hydrated: v }),

      requestJoin: (teamId, memberId) => {
        const existing = get().requests.find(
          (r) =>
            r.teamId === teamId &&
            r.memberId === memberId &&
            r.status === "pending"
        );
        if (existing) return existing;

        const req: TeamJoinRequest = {
          id: `jr_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
          teamId,
          memberId,
          createdAt: new Date().toISOString(),
          status: "pending",
        };
        set({ requests: [req, ...get().requests] });
        return req;
      },

      approve: (id, resolvedBy) => {
        const current = get().requests.find((r) => r.id === id);
        if (!current || current.status !== "pending") return null;
        const updated: TeamJoinRequest = {
          ...current,
          status: "approved",
          resolvedAt: new Date().toISOString(),
          resolvedBy,
        };
        set({
          requests: get().requests.map((r) => (r.id === id ? updated : r)),
        });
        return updated;
      },

      deny: (id, resolvedBy) => {
        const current = get().requests.find((r) => r.id === id);
        if (!current || current.status !== "pending") return null;
        const updated: TeamJoinRequest = {
          ...current,
          status: "denied",
          resolvedAt: new Date().toISOString(),
          resolvedBy,
        };
        set({
          requests: get().requests.map((r) => (r.id === id ? updated : r)),
        });
        return updated;
      },

      cancel: (id, memberId) => {
        set({
          requests: get().requests.filter(
            (r) => !(r.id === id && r.memberId === memberId && r.status === "pending")
          ),
        });
      },

      pendingForTeams: (teamIds) => {
        const setIds = new Set(teamIds);
        return get().requests.filter(
          (r) => r.status === "pending" && setIds.has(r.teamId)
        );
      },

      pendingForMember: (memberId) =>
        get().requests.filter(
          (r) => r.status === "pending" && r.memberId === memberId
        ),

      pendingForTeamAndMember: (teamId, memberId) =>
        get().requests.find(
          (r) =>
            r.status === "pending" &&
            r.teamId === teamId &&
            r.memberId === memberId
        ),
    }),
    {
      name: "ceng_team_join_requests_v1",
      partialize: (s) => ({ requests: s.requests }),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true);
      },
    }
  )
);
