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
import { useMembers } from "@/lib/members/MembersProvider";
import type { Member } from "@/types";

interface AuthContextValue {
  user: User | null;
  member: Member | null;
  loading: boolean;
  firebaseReady: boolean;
  signInEmail: (email: string, password: string) => Promise<void>;
  signUpEmail: (email: string, password: string, fullName: string) => Promise<void>;
  signInGoogle: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateOwnProfile: (
    patch: Partial<
      Pick<
        Member,
        | "bio"
        | "phone"
        | "preferredName"
        | "linkedIn"
        | "portfolio"
        | "pfpUrl"
        | "volunteerHoursUrl"
      >
    >
  ) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function authErrorMessage(err: unknown): string {
  const code =
    err && typeof err === "object" && "code" in err
      ? String((err as { code: string }).code)
      : "";
  switch (code) {
    case "auth/invalid-email":
      return "That email doesn’t look valid.";
    case "auth/invalid-credential":
    case "auth/wrong-password":
    case "auth/user-not-found":
      return "Incorrect email or password.";
    case "auth/email-already-in-use":
      return "An account already exists with this email. Sign in instead.";
    case "auth/weak-password":
      return "Password must be at least 6 characters.";
    case "auth/popup-closed-by-user":
    case "auth/cancelled-popup-request":
      return "Sign-in was cancelled.";
    case "auth/unauthorized-domain":
      return "This domain isn’t authorized in Firebase. Add it under Authentication → Settings → Authorized domains.";
    case "auth/operation-not-allowed":
      return "This sign-in method isn’t enabled yet in Firebase Authentication.";
    case "auth/too-many-requests":
      return "Too many attempts. Try again in a few minutes.";
    case "auth/network-request-failed":
      return "Network error. Check your connection and try again.";
    default:
      return err instanceof Error ? err.message : "Something went wrong.";
  }
}

function requireFirebase() {
  const auth = getFirebaseAuth();
  if (!auth || !isFirebaseConfigured()) {
    throw new Error(
      "Firebase isn’t configured. Add NEXT_PUBLIC_FIREBASE_* env vars on Vercel and redeploy."
    );
  }
  return auth;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const {
    loading: membersLoading,
    getById,
    findByEmail,
    linkAuthUser,
    saveProfile,
  } = useMembers();
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [resolvedMember, setResolvedMember] = useState<Member | null>(null);
  const linkedUidRef = useRef<string | null>(null);
  const firebaseReady = isFirebaseConfigured();

  useEffect(() => {
    try {
      localStorage.removeItem("ceng_demo_session");
    } catch {
      /* ignore */
    }

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
      setAuthLoading(false);
      if (!u) {
        linkedUidRef.current = null;
        setResolvedMember(null);
      }
    });
    return () => unsub();
  }, [firebaseReady]);

  // Link once per signed-in user after members are ready — not on every members refresh
  useEffect(() => {
    let cancelled = false;

    async function resolve() {
      if (!user) {
        setResolvedMember(null);
        return;
      }
      if (membersLoading) return;
      if (linkedUidRef.current === user.uid && resolvedMember) return;

      const linked = await linkAuthUser({
        uid: user.uid,
        email: user.email ?? "",
        displayName: user.displayName,
        photoURL: user.photoURL,
      });

      if (cancelled) return;
      linkedUidRef.current = user.uid;

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
    // intentionally omit resolvedMember / members — link once per uid
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, membersLoading, linkAuthUser]);

  // Soft-sync roster updates into the signed-in member without wiping newer local edits
  useEffect(() => {
    setResolvedMember((prev) => {
      if (!prev) return prev;
      const fresh = getById(prev.id);
      if (!fresh || fresh.updatedAt === prev.updatedAt) return prev;
      return { ...fresh, ...pickNewerLocal(prev, fresh) };
    });
  }, [getById]);

  const signInEmail = useCallback(async (email: string, password: string) => {
    const auth = requireFirebase();
    linkedUidRef.current = null;
    await signInWithEmailAndPassword(auth, email.trim(), password);
  }, []);

  const signUpEmail = useCallback(
    async (email: string, password: string, fullName: string) => {
      const auth = requireFirebase();
      const roster = findByEmail(email);
      if (!roster) {
        throw new Error(
          "This email isn’t on the CENG volunteer list. Use your home, school, or @cengclass.org email."
        );
      }
      linkedUidRef.current = null;
      const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
      const name = fullName.trim() || roster.fullName;
      if (name) {
        await updateProfile(cred.user, { displayName: name });
      }
      const linked = await linkAuthUser({
        uid: cred.user.uid,
        email: cred.user.email ?? email,
        displayName: name,
        photoURL: cred.user.photoURL,
      });
      if (linked) {
        linkedUidRef.current = cred.user.uid;
        setResolvedMember(linked);
      }
    },
    [findByEmail, linkAuthUser]
  );

  const signInGoogle = useCallback(async () => {
    const auth = requireFirebase();
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: "select_account" });
    linkedUidRef.current = null;
    const result = await signInWithPopup(auth, provider);
    const roster = findByEmail(result.user.email);
    if (!roster) {
      await firebaseSignOut(auth);
      throw new Error(
        "That Google account isn’t on the CENG volunteer list. Use your home, school, or @cengclass.org email."
      );
    }
    const linked = await linkAuthUser({
      uid: result.user.uid,
      email: result.user.email ?? "",
      displayName: result.user.displayName,
      photoURL: result.user.photoURL,
    });
    if (linked) {
      linkedUidRef.current = result.user.uid;
      setResolvedMember(linked);
    }
  }, [findByEmail, linkAuthUser]);

  const resetPassword = useCallback(async (email: string) => {
    const auth = requireFirebase();
    await sendPasswordResetEmail(auth, email.trim());
  }, []);

  const signOut = useCallback(async () => {
    linkedUidRef.current = null;
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
          | "bio"
          | "phone"
          | "preferredName"
          | "linkedIn"
          | "portfolio"
          | "pfpUrl"
          | "volunteerHoursUrl"
        >
      >
    ) => {
      if (!resolvedMember) throw new Error("Not signed in");
      const updated = await saveProfile(resolvedMember.id, patch);
      setResolvedMember(updated);
    },
    [resolvedMember, saveProfile]
  );

  const loading = authLoading || (Boolean(user) && membersLoading && !resolvedMember);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      member: resolvedMember,
      loading,
      firebaseReady,
      signInEmail,
      signUpEmail,
      signInGoogle,
      resetPassword,
      signOut,
      updateOwnProfile,
    }),
    [
      user,
      resolvedMember,
      loading,
      firebaseReady,
      signInEmail,
      signUpEmail,
      signInGoogle,
      resetPassword,
      signOut,
      updateOwnProfile,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

function pickNewerLocal(prev: Member, fresh: Member): Partial<Member> {
  // If local update is newer, keep editable fields from prev
  if (prev.updatedAt > fresh.updatedAt) {
    return {
      bio: prev.bio,
      phone: prev.phone,
      preferredName: prev.preferredName,
      linkedIn: prev.linkedIn,
      portfolio: prev.portfolio,
      pfpUrl: prev.pfpUrl,
      volunteerHoursUrl: prev.volunteerHoursUrl,
      updatedAt: prev.updatedAt,
    };
  }
  return {};
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
