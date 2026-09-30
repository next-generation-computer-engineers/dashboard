"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { onAuthStateChanged } from "firebase/auth";
import type { Member } from "@/types";
import {
  DEMO_USER_ID,
  MEMBERS as SEED_MEMBERS,
  findMemberByEmail as findSeedMemberByEmail,
  getMember as getSeedMember,
  emailsMatch,
} from "@/data/roster";
import { getFirebaseAuth, isFirebaseConfigured } from "@/lib/firebase/client";
import {
  fetchAllMembers,
  linkAuthUserToMember,
  updateMemberProfile,
} from "@/lib/firebase/members";

type ProfilePatch = Partial<
  Pick<
    Member,
    "bio" | "phone" | "preferredName" | "linkedIn" | "portfolio" | "pfpUrl"
  >
>;

interface MembersContextValue {
  members: Member[];
  loading: boolean;
  source: "firestore" | "seed";
  getById: (id: string) => Member | undefined;
  findByEmail: (email?: string | null) => Member | undefined;
  refresh: () => Promise<void>;
  linkAuthUser: (opts: {
    uid: string;
    email: string;
    displayName?: string | null;
    photoURL?: string | null;
  }) => Promise<Member | null>;
  saveProfile: (memberId: string, patch: ProfilePatch) => Promise<Member>;
}

const MembersContext = createContext<MembersContextValue | null>(null);

export function MembersProvider({ children }: { children: ReactNode }) {
  const firebaseReady = isFirebaseConfigured();
  const [members, setMembers] = useState<Member[]>(SEED_MEMBERS);
  const [source, setSource] = useState<"firestore" | "seed">("seed");
  const [loading, setLoading] = useState(firebaseReady);
  const initialLoadDone = useRef(false);
  const refreshInFlight = useRef(false);

  const refresh = useCallback(async () => {
    if (!firebaseReady) {
      setMembers(SEED_MEMBERS);
      setSource("seed");
      setLoading(false);
      initialLoadDone.current = true;
      return;
    }
    if (refreshInFlight.current) return;
    refreshInFlight.current = true;
    // Only block the UI on the first load — later refreshes must not unmount the app
    if (!initialLoadDone.current) setLoading(true);
    try {
      const remote = await fetchAllMembers();
      if (remote.length > 0) {
        setMembers(remote);
        setSource("firestore");
      } else {
        setMembers(SEED_MEMBERS);
        setSource("seed");
      }
    } catch (err) {
      console.warn("[members] Firestore load failed, using seed", err);
      if (!initialLoadDone.current) {
        setMembers(SEED_MEMBERS);
        setSource("seed");
      }
    } finally {
      refreshInFlight.current = false;
      initialLoadDone.current = true;
      setLoading(false);
    }
  }, [firebaseReady]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  // One silent refresh after sign-in (rules may require auth). Do not re-run on token refresh loops.
  useEffect(() => {
    if (!firebaseReady) return;
    const auth = getFirebaseAuth();
    if (!auth) return;
    let lastUid: string | null = null;
    return onAuthStateChanged(auth, (u) => {
      const uid = u?.uid ?? null;
      if (uid && uid !== lastUid) {
        lastUid = uid;
        void refresh();
      }
      if (!uid) lastUid = null;
    });
  }, [firebaseReady, refresh]);

  const getById = useCallback(
    (id: string) => members.find((m) => m.id === id) ?? getSeedMember(id),
    [members]
  );

  const findByEmail = useCallback(
    (email?: string | null) => {
      if (!email) return undefined;
      return (
        members.find((m) => emailsMatch(m, email)) ??
        findSeedMemberByEmail(email)
      );
    },
    [members]
  );

  const linkAuthUser = useCallback(
    async (opts: {
      uid: string;
      email: string;
      displayName?: string | null;
      photoURL?: string | null;
    }) => {
      const local = findByEmail(opts.email);
      if (!local) return null;
      if (!firebaseReady) {
        return { ...local, authUid: opts.uid };
      }
      try {
        const linked = await linkAuthUserToMember({
          ...opts,
          member: local,
        });
        setMembers((prev) =>
          prev.map((m) => (m.id === linked.id ? { ...m, ...linked } : m))
        );
        setSource("firestore");
        return linked;
      } catch (err) {
        console.warn("[members] linkAuthUser failed", err);
        return { ...local, authUid: opts.uid };
      }
    },
    [findByEmail, firebaseReady]
  );

  const saveProfile = useCallback(
    async (memberId: string, patch: ProfilePatch) => {
      const current = getById(memberId);
      if (!current) throw new Error("Member not found");
      const updated: Member = {
        ...current,
        ...patch,
        updatedAt: new Date().toISOString(),
      };

      // Optimistic local update first so the UI doesn't snap back
      setMembers((prev) => {
        const exists = prev.some((m) => m.id === memberId);
        if (!exists) return [...prev, updated];
        return prev.map((m) => (m.id === memberId ? updated : m));
      });

      if (firebaseReady) {
        try {
          await updateMemberProfile(memberId, patch);
          setSource("firestore");
        } catch (err) {
          console.warn("[members] saveProfile firestore failed", err);
        }
      }

      return updated;
    },
    [firebaseReady, getById]
  );

  const value = useMemo<MembersContextValue>(
    () => ({
      members,
      loading,
      source,
      getById,
      findByEmail,
      refresh,
      linkAuthUser,
      saveProfile,
    }),
    [
      members,
      loading,
      source,
      getById,
      findByEmail,
      refresh,
      linkAuthUser,
      saveProfile,
    ]
  );

  return (
    <MembersContext.Provider value={value}>{children}</MembersContext.Provider>
  );
}

export function useMembers() {
  const ctx = useContext(MembersContext);
  if (!ctx) throw new Error("useMembers must be used within MembersProvider");
  return ctx;
}

export { DEMO_USER_ID, SEED_MEMBERS };
