"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { ClassEntity, Session } from "@/types";
import { CLASSES as SEED_CLASSES, CURRENT_SESSION } from "@/data/seed";
import { apiFetch } from "@/lib/api/client";
import { isFirebaseConfigured } from "@/lib/firebase/client";

const SEED_SESSIONS: Session[] = [CURRENT_SESSION];

type SessionsStore = {
  sessions: Session[];
  classes: ClassEntity[];
  hydrated: boolean;
  setHydrated: (v: boolean) => void;
  upsertSession: (session: Session) => void;
  upsertClasses: (classes: ClassEntity[]) => void;
  upsertClass: (cls: ClassEntity) => void;
  removeClass: (id: string) => void;
  replaceFromRemote: (sessions: Session[], classes: ClassEntity[]) => void;
};

function mergeById<T extends { id: string }>(base: T[], overlay: T[]): T[] {
  const map = new Map<string, T>();
  for (const item of base) map.set(item.id, item);
  for (const item of overlay) map.set(item.id, { ...(map.get(item.id) as T), ...item });
  return Array.from(map.values());
}

export const useSessionsStore = create<SessionsStore>()(
  persist(
    (set, get) => ({
      sessions: SEED_SESSIONS,
      classes: SEED_CLASSES,
      hydrated: false,
      setHydrated: (v) => set({ hydrated: v }),
      upsertSession: (session) => {
        const sessions = mergeById(get().sessions, [session]);
        // If activating, deactivate others locally
        const next = session.isActive
          ? sessions.map((s) =>
              s.id === session.id ? session : { ...s, isActive: false }
            )
          : sessions;
        set({ sessions: next });
      },
      upsertClasses: (incoming) => {
        set({ classes: mergeById(get().classes, incoming) });
      },
      upsertClass: (cls) => {
        set({ classes: mergeById(get().classes, [cls]) });
      },
      removeClass: (id) => {
        set({ classes: get().classes.filter((c) => c.id !== id) });
      },
      replaceFromRemote: (sessions, classes) => {
        set({
          sessions: mergeById(SEED_SESSIONS, sessions),
          classes: mergeById(SEED_CLASSES, classes),
        });
      },
    }),
    {
      name: "ceng_sessions_classes_v1",
      partialize: (s) => ({
        sessions: s.sessions,
        classes: s.classes,
      }),
      merge: (persisted, current) => {
        const p = persisted as
          | { sessions?: Session[]; classes?: ClassEntity[] }
          | undefined;
        return {
          ...current,
          sessions: mergeById(SEED_SESSIONS, p?.sessions ?? []),
          classes: mergeById(SEED_CLASSES, p?.classes ?? []),
        };
      },
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true);
      },
    }
  )
);

interface SessionsContextValue {
  sessions: Session[];
  classes: ClassEntity[];
  activeSession: Session | undefined;
  loading: boolean;
  refresh: () => Promise<void>;
  createSession: (input: {
    name: string;
    season?: string;
    year?: number;
    startDate?: string;
    endDate?: string;
    isActive?: boolean;
  }) => Promise<Session>;
  updateSession: (
    id: string,
    patch: Partial<Session>
  ) => Promise<void>;
  importClasses: (
    sessionId: string,
    paste: string,
    defaults?: {
      icebreakersUrl?: string;
      officeHoursUrl?: string;
      dateRange?: string;
    }
  ) => Promise<{ imported: number; classes: ClassEntity[]; message: string }>;
  saveClass: (cls: ClassEntity) => Promise<ClassEntity>;
  deleteClass: (id: string) => Promise<void>;
  getClass: (id: string) => ClassEntity | undefined;
  classesForSession: (sessionId: string) => ClassEntity[];
}

const SessionsContext = createContext<SessionsContextValue | null>(null);

export function SessionsProvider({ children }: { children: ReactNode }) {
  const sessions = useSessionsStore((s) => s.sessions);
  const classes = useSessionsStore((s) => s.classes);
  const hydrated = useSessionsStore((s) => s.hydrated);
  const upsertSession = useSessionsStore((s) => s.upsertSession);
  const upsertClasses = useSessionsStore((s) => s.upsertClasses);
  const upsertClass = useSessionsStore((s) => s.upsertClass);
  const removeClass = useSessionsStore((s) => s.removeClass);
  const replaceFromRemote = useSessionsStore((s) => s.replaceFromRemote);
  const [loading, setLoading] = useState(true);
  const firebaseReady = isFirebaseConfigured();

  const refresh = useCallback(async () => {
    if (!firebaseReady) {
      setLoading(false);
      return;
    }
    try {
      const [sessRes, classRes] = await Promise.all([
        apiFetch<{ sessions: Session[] }>("/api/sessions").catch(() => null),
        apiFetch<{ classes: ClassEntity[] }>("/api/classes").catch(() => null),
      ]);
      if (sessRes?.sessions || classRes?.classes) {
        replaceFromRemote(sessRes?.sessions ?? [], classRes?.classes ?? []);
      }
    } catch {
      /* keep local/seed */
    } finally {
      setLoading(false);
    }
  }, [firebaseReady, replaceFromRemote]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const createSession = useCallback(
    async (input: {
      name: string;
      season?: string;
      year?: number;
      startDate?: string;
      endDate?: string;
      isActive?: boolean;
    }) => {
      try {
        const res = await apiFetch<{ session: Session }>("/api/sessions", {
          method: "POST",
          json: input,
        });
        upsertSession(res.session);
        return res.session;
      } catch {
        const year = input.year ?? new Date().getFullYear();
        const session: Session = {
          id: `session_${input.name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "_")
            .slice(0, 40)}_${year}`,
          name: input.name.trim(),
          season:
            input.season?.trim() || input.name.split(/\s+/)[0] || "Session",
          year,
          startDate: input.startDate || `${year}-01-01`,
          endDate: input.endDate || `${year}-12-31`,
          isActive: input.isActive !== false,
        };
        upsertSession(session);
        return session;
      }
    },
    [upsertSession]
  );

  const updateSession = useCallback(
    async (id: string, patch: Partial<Session>) => {
      const current = useSessionsStore.getState().sessions.find((s) => s.id === id);
      if (!current) throw new Error("Session not found");
      upsertSession({ ...current, ...patch, id });
      try {
        await apiFetch(`/api/sessions/${id}`, { method: "PATCH", json: patch });
      } catch {
        /* local already updated */
      }
    },
    [upsertSession]
  );

  const importClassesFn = useCallback(
    async (
      sessionId: string,
      paste: string,
      defaults?: {
        icebreakersUrl?: string;
        officeHoursUrl?: string;
        dateRange?: string;
      }
    ) => {
      try {
        const res = await apiFetch<{
          imported: number;
          classes: ClassEntity[];
          message: string;
        }>(`/api/sessions/${sessionId}/import`, {
          method: "POST",
          json: { paste, defaults },
        });
        upsertClasses(res.classes);
        return res;
      } catch {
        const { parseClassSheet, rowsToClassEntities } = await import(
          "@/lib/sessions/parseSheet"
        );
        const parsed = parseClassSheet(paste);
        const next = rowsToClassEntities(parsed.rows, sessionId, defaults);
        if (next.length === 0) {
          throw new Error(parsed.errors[0] || "No classes found in paste");
        }
        upsertClasses(next);
        return {
          imported: next.length,
          classes: next,
          message: `Imported ${next.length} classes (saved locally).`,
        };
      }
    },
    [upsertClasses]
  );

  const saveClass = useCallback(
    async (cls: ClassEntity) => {
      upsertClass(cls);
      try {
        const res = await apiFetch<{ class: ClassEntity }>("/api/classes", {
          method: "POST",
          json: cls,
        });
        upsertClass(res.class);
        return res.class;
      } catch {
        return cls;
      }
    },
    [upsertClass]
  );

  const deleteClass = useCallback(
    async (id: string) => {
      removeClass(id);
      try {
        await apiFetch(`/api/classes/${id}`, { method: "DELETE" });
      } catch {
        /* local already removed */
      }
    },
    [removeClass]
  );

  const getClass = useCallback(
    (id: string) => classes.find((c) => c.id === id),
    [classes]
  );

  const classesForSession = useCallback(
    (sessionId: string) => classes.filter((c) => c.sessionId === sessionId),
    [classes]
  );

  const activeSession = useMemo(
    () => sessions.find((s) => s.isActive) ?? sessions[0] ?? CURRENT_SESSION,
    [sessions]
  );

  const value = useMemo<SessionsContextValue>(
    () => ({
      sessions,
      classes,
      activeSession,
      loading: loading || !hydrated,
      refresh,
      createSession,
      updateSession,
      importClasses: importClassesFn,
      saveClass,
      deleteClass,
      getClass,
      classesForSession,
    }),
    [
      sessions,
      classes,
      hydrated,
      activeSession,
      loading,
      refresh,
      createSession,
      updateSession,
      importClassesFn,
      saveClass,
      deleteClass,
      getClass,
      classesForSession,
    ]
  );

  return (
    <SessionsContext.Provider value={value}>{children}</SessionsContext.Provider>
  );
}

export function useSessions() {
  const ctx = useContext(SessionsContext);
  if (!ctx) throw new Error("useSessions must be used within SessionsProvider");
  return ctx;
}
