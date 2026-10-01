"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { ClassAssignment, ClassAssignmentStatus, ClassRoleKey } from "@/types";
import { CLASS_ASSIGNMENTS, CURRENT_SESSION } from "@/data/seed";

export interface CreateAssignmentInput {
  classId: string;
  memberId: string;
  classRole: ClassRoleKey;
  status?: ClassAssignmentStatus;
  sessionId?: string;
}

interface ClassAssignmentsState {
  assignments: ClassAssignment[];
  deletedIds: string[];
  hydrated: boolean;
  setHydrated: (v: boolean) => void;
  addAssignment: (input: CreateAssignmentInput) => ClassAssignment;
  removeAssignment: (id: string) => void;
  updateAssignment: (
    id: string,
    patch: Partial<Pick<ClassAssignment, "classRole" | "status" | "notes">>
  ) => ClassAssignment | null;
  forMember: (memberId: string) => ClassAssignment[];
  forClass: (classId: string) => ClassAssignment[];
}

function reconcile(
  stored: ClassAssignment[] | undefined,
  deletedIds: string[] | undefined
): { assignments: ClassAssignment[]; deletedIds: string[] } {
  const deleted = new Set(deletedIds ?? []);
  const list = stored ? [...stored] : [...CLASS_ASSIGNMENTS];
  const have = new Set(list.map((a) => a.id));

  for (const seed of CLASS_ASSIGNMENTS) {
    if (deleted.has(seed.id) || have.has(seed.id)) continue;
    if (!stored) {
      list.push(seed);
      have.add(seed.id);
    }
  }

  return {
    assignments: list.filter((a) => !deleted.has(a.id)),
    deletedIds: [...deleted],
  };
}

export const useClassAssignments = create<ClassAssignmentsState>()(
  persist(
    (set, get) => ({
      assignments: CLASS_ASSIGNMENTS,
      deletedIds: [],
      hydrated: false,
      setHydrated: (v) => set({ hydrated: v }),

      forMember: (memberId) =>
        get().assignments.filter((a) => a.memberId === memberId),

      forClass: (classId) =>
        get().assignments.filter((a) => a.classId === classId),

      addAssignment: (input) => {
        const existing = get().assignments.find(
          (a) =>
            a.classId === input.classId &&
            a.memberId === input.memberId &&
            a.sessionId === (input.sessionId ?? CURRENT_SESSION.id)
        );
        if (existing) {
          const updated: ClassAssignment = {
            ...existing,
            classRole: input.classRole,
            status: input.status ?? existing.status,
            updatedAt: new Date().toISOString(),
          };
          set({
            assignments: get().assignments.map((a) =>
              a.id === existing.id ? updated : a
            ),
          });
          return updated;
        }

        const assignment: ClassAssignment = {
          id: `ca_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          classId: input.classId,
          memberId: input.memberId,
          classRole: input.classRole,
          status: input.status ?? "confirmed",
          sessionId: input.sessionId ?? CURRENT_SESSION.id,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        set({
          assignments: [...get().assignments, assignment],
          deletedIds: get().deletedIds.filter((id) => id !== assignment.id),
        });
        return assignment;
      },

      removeAssignment: (id) => {
        const deletedIds = get().deletedIds.includes(id)
          ? get().deletedIds
          : [...get().deletedIds, id];
        set({
          assignments: get().assignments.filter((a) => a.id !== id),
          deletedIds,
        });
      },

      updateAssignment: (id, patch) => {
        const current = get().assignments.find((a) => a.id === id);
        if (!current) return null;
        const updated: ClassAssignment = {
          ...current,
          ...patch,
          updatedAt: new Date().toISOString(),
        };
        set({
          assignments: get().assignments.map((a) =>
            a.id === id ? updated : a
          ),
        });
        return updated;
      },
    }),
    {
      name: "ceng_class_assignments_v1",
      partialize: (s) => ({
        assignments: s.assignments,
        deletedIds: s.deletedIds,
      }),
      merge: (persisted, current) => {
        const p = persisted as
          | { assignments?: ClassAssignment[]; deletedIds?: string[] }
          | undefined;
        const reconciled = reconcile(p?.assignments, p?.deletedIds);
        return {
          ...current,
          assignments: reconciled.assignments,
          deletedIds: reconciled.deletedIds,
        };
      },
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true);
      },
    }
  )
);
