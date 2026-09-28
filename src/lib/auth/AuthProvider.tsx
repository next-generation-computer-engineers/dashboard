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
import {
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut as firebaseSignOut,
  updateProfile,
  type User,
} from "firebase/auth";
import { getFirebaseAuth, isFirebaseConfigured } from "@/lib/firebase/client";
import { useMembers, DEMO_USER_ID } from "@/lib/members/MembersProvider";
import type { Member } from "@/types";

const DEMO_STORAGE_KEY = "ceng_demo_session";

interface AuthContextValue {
  user: User | null;
  member: Member | null;
  loading: boolean;
  isDemo: boolean;
  firebaseReady: boolean;
  signInEmail: (email: string, password: string) => Promise<void>;
  signUpEmail: (email: string, password: string, fullName: string) => Promise<void>;
  signInGoogle: () => Promise<void>;
  signInDemo: (memberId?: string) => void;
  resetPassword: (email: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateOwnProfile: (
    patch: Partial<
      Pick<
        Member,
        "bio" | "phone" | "preferredName" | "linkedIn" | "portfolio" | "pfpUrl"
      >
    >
  ) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const {
    loading: membersLoading,
    getById,
    findByEmail,
    linkAuthUser,
    saveProfile,
    members,
  } = useMembers();
  const [user, setUser] = useState<User | null>(null);
  const [demoId, setDemoId] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [resolvedMember, setResolvedMember] = useState<Member | null>(null);
  const firebaseReady = isFirebaseConfigured();

  useEffect(() => {
    const stored =
      typeof window !== "undefined" ? localStorage.getItem(DEMO_STORAGE_KEY) : null;
    if (stored) setDemoId(stored);

    if (!firebaseReady) {
      setAuthLoading(false);
      return;
    }

    const auth = getFirebaseAuth();
    if (!auth) {
      setAuthLoading(false);
      return;
    }

    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (u) {
        localStorage.removeItem(DEMO_STORAGE_KEY);
        setDemoId(null);
      }
      setAuthLoading(false);
    });
    return () => unsub();
  }, [firebaseReady]);

  // Resolve / link member whenever auth or roster changes
  useEffect(() => {
    let cancelled = false;

    async function resolve() {
      if (demoId) {
        setResolvedMember(getById(demoId) ?? members[0] ?? null);
        return;
      }
      if (!user) {
        setResolvedMember(null);
        return;
      }
      if (membersLoading) return;

      const linked = await linkAuthUser({
        uid: user.uid,
        email: user.email ?? "",
        displayName: user.displayName,
        photoURL: user.photoURL,
      });

      if (cancelled) return;

      if (linked) {
        setResolvedMember(linked);
        return;
      }

      setResolvedMember({
        id: user.uid,
        authUid: user.uid,
        fullName: user.displayName ?? user.email?.split("@")[0] ?? "New Member",
        personalEmail: user.email ?? "",
        roleIds: ["role_volunteer"],
        teamIds: [],
        status: "pending",
        onboardingStatus: "not_started",
        searchKeywords: [],
        pfpUrl: user.photoURL ?? undefined,
        joinedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        title: "Volunteer",
      });
    }

    void resolve();
    return () => {
      cancelled = true;
    };
  }, [user, demoId, membersLoading, getById, linkAuthUser, members]);

  const signInEmail = useCallback(async (email: string, password: string) => {
    const auth = getFirebaseAuth();
    if (!auth) throw new Error("Firebase is not configured. Use demo sign-in.");
    await signInWithEmailAndPassword(auth, email.trim(), password);
  }, []);

  const signUpEmail = useCallback(
    async (email: string, password: string, fullName: string) => {
      const auth = getFirebaseAuth();
      if (!auth) throw new Error("Firebase is not configured. Use demo sign-in.");
      const roster = findByEmail(email);
      if (!roster) {
        throw new Error(
          "This email isn’t on the CENG volunteer list. Use your home, school, or @cengclass.org email."
        );
      }
      const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
      const name = fullName.trim() || roster.fullName;
      if (name) {
        await updateProfile(cred.user, { displayName: name });
      }
      await linkAuthUser({
        uid: cred.user.uid,
        email: cred.user.email ?? email,
        displayName: name,
        photoURL: cred.user.photoURL,
      });
    },
    [findByEmail, linkAuthUser]
  );

  const signInGoogle = useCallback(async () => {
    const auth = getFirebaseAuth();
    if (!auth) throw new Error("Firebase is not configured. Use demo sign-in.");
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: "select_account" });
    const result = await signInWithPopup(auth, provider);
    const roster = findByEmail(result.user.email);
    if (!roster) {
      await firebaseSignOut(auth);
      throw new Error(
        "That Google account isn’t on the CENG volunteer list. Sign in with your home, school, or @cengclass.org email."
      );
    }
    await linkAuthUser({
      uid: result.user.uid,
      email: result.user.email ?? "",
      displayName: result.user.displayName,
      photoURL: result.user.photoURL,
    });
  }, [findByEmail, linkAuthUser]);

  const signInDemo = useCallback((memberId: string = DEMO_USER_ID) => {
    localStorage.setItem(DEMO_STORAGE_KEY, memberId);
    setDemoId(memberId);
    setUser(null);
  }, []);

  const resetPassword = useCallback(async (email: string) => {
    const auth = getFirebaseAuth();
    if (!auth) throw new Error("Firebase is not configured.");
    await sendPasswordResetEmail(auth, email.trim());
  }, []);

  const signOut = useCallback(async () => {
    localStorage.removeItem(DEMO_STORAGE_KEY);
    setDemoId(null);
    setResolvedMember(null);
    const auth = getFirebaseAuth();
    if (auth && user) await firebaseSignOut(auth);
    setUser(null);
  }, [user]);

  const updateOwnProfile = useCallback(
    async (
      patch: Partial<
        Pick<
          Member,
          "bio" | "phone" | "preferredName" | "linkedIn" | "portfolio" | "pfpUrl"
        >
      >
    ) => {
      if (!resolvedMember) throw new Error("Not signed in");
      const updated = await saveProfile(resolvedMember.id, patch);
      setResolvedMember(updated);
    },
    [resolvedMember, saveProfile]
  );

  // Keep resolved member in sync when roster updates (e.g. after photo save)
  useEffect(() => {
    if (!resolvedMember) return;
    const fresh = getById(resolvedMember.id);
    if (fresh && fresh.updatedAt !== resolvedMember.updatedAt) {
      setResolvedMember(fresh);
    }
  }, [members, getById, resolvedMember]);

  const loading = authLoading || (Boolean(user) && membersLoading);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      member: resolvedMember,
      loading,
      isDemo: Boolean(demoId),
      firebaseReady,
      signInEmail,
      signUpEmail,
      signInGoogle,
      signInDemo,
      resetPassword,
      signOut,
      updateOwnProfile,
    }),
    [
      user,
      resolvedMember,
      loading,
      demoId,
      firebaseReady,
      signInEmail,
      signUpEmail,
      signInGoogle,
      signInDemo,
      resetPassword,
      signOut,
      updateOwnProfile,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
