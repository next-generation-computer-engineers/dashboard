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
import {
  DEMO_USER_ID,
  MEMBERS,
  findMemberByEmail,
  getMember,
} from "@/data/roster";
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
}

const AuthContext = createContext<AuthContextValue | null>(null);

/**
 * Resolve roster profile from Firebase Auth.
 * Home OR school email both map to the same volunteer row.
 */
function resolveMember(user: User | null, demoId: string | null): Member | null {
  if (demoId) return getMember(demoId) ?? MEMBERS[0];
  if (!user) return null;

  const matched = findMemberByEmail(user.email);
  if (matched) {
    return {
      ...matched,
      authUid: user.uid,
      pfpUrl: matched.pfpUrl || user.photoURL || undefined,
    };
  }

  // Unknown email — pending volunteer until an admin links them
  return {
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
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [demoId, setDemoId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const firebaseReady = isFirebaseConfigured();

  useEffect(() => {
    const stored =
      typeof window !== "undefined" ? localStorage.getItem(DEMO_STORAGE_KEY) : null;
    if (stored) setDemoId(stored);

    if (!firebaseReady) {
      setLoading(false);
      return;
    }

    const auth = getFirebaseAuth();
    if (!auth) {
      setLoading(false);
      return;
    }

    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (u) {
        localStorage.removeItem(DEMO_STORAGE_KEY);
        setDemoId(null);
      }
      setLoading(false);
    });
    return () => unsub();
  }, [firebaseReady]);

  const signInEmail = useCallback(async (email: string, password: string) => {
    const auth = getFirebaseAuth();
    if (!auth) throw new Error("Firebase is not configured. Use demo sign-in.");
    await signInWithEmailAndPassword(auth, email.trim(), password);
  }, []);

  const signUpEmail = useCallback(
    async (email: string, password: string, fullName: string) => {
      const auth = getFirebaseAuth();
      if (!auth) throw new Error("Firebase is not configured. Use demo sign-in.");
      const roster = findMemberByEmail(email);
      if (!roster) {
        throw new Error(
          "This email isn’t on the CENG volunteer list. Use your home or school email from the contact list."
        );
      }
      const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
      const name = fullName.trim() || roster.fullName;
      if (name) {
        await updateProfile(cred.user, { displayName: name });
      }
    },
    []
  );

  const signInGoogle = useCallback(async () => {
    const auth = getFirebaseAuth();
    if (!auth) throw new Error("Firebase is not configured. Use demo sign-in.");
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: "select_account" });
    const result = await signInWithPopup(auth, provider);
    const roster = findMemberByEmail(result.user.email);
    if (!roster) {
      await firebaseSignOut(auth);
      throw new Error(
        "That Google account isn’t on the CENG volunteer list. Sign in with your home or school email from the contact list."
      );
    }
  }, []);

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
    const auth = getFirebaseAuth();
    if (auth && user) await firebaseSignOut(auth);
    setUser(null);
  }, [user]);

  const member = useMemo(() => resolveMember(user, demoId), [user, demoId]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      member,
      loading,
      isDemo: Boolean(demoId),
      firebaseReady,
      signInEmail,
      signUpEmail,
      signInGoogle,
      signInDemo,
      resetPassword,
      signOut,
    }),
    [
      user,
      member,
      loading,
      demoId,
      firebaseReady,
      signInEmail,
      signUpEmail,
      signInGoogle,
      signInDemo,
      resetPassword,
      signOut,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
