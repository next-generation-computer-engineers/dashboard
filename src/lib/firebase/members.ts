import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  setDoc,
  updateDoc,
  where,
  type Firestore,
} from "firebase/firestore";
import type { Member } from "@/types";
import { COLLECTIONS } from "@/lib/firebase/schema";
import { emailsForMember, memberToFirestore, stripUndefined } from "@/lib/firebase/serialize";
import { getFirestoreDb } from "@/lib/firebase/client";

function dbOrThrow(): Firestore {
  const db = getFirestoreDb();
  if (!db) throw new Error("Firestore is not available");
  return db;
}

export function memberFromFirestore(id: string, data: Record<string, unknown>): Member {
  const { emails: _emails, source: _source, ...rest } = data;
  return { id, ...(rest as Omit<Member, "id">) };
}

export async function fetchAllMembers(): Promise<Member[]> {
  const db = dbOrThrow();
  const snap = await getDocs(collection(db, COLLECTIONS.members));
  return snap.docs.map((d) => memberFromFirestore(d.id, d.data()));
}

export async function fetchMemberById(id: string): Promise<Member | null> {
  const db = dbOrThrow();
  const snap = await getDoc(doc(db, COLLECTIONS.members, id));
  if (!snap.exists()) return null;
  return memberFromFirestore(snap.id, snap.data());
}

export async function fetchMemberByEmail(email: string): Promise<Member | null> {
  const db = dbOrThrow();
  const normalized = email.toLowerCase().trim();
  if (!normalized) return null;

  const q = query(
    collection(db, COLLECTIONS.members),
    where("emails", "array-contains", normalized)
  );
  const snap = await getDocs(q);
  if (snap.empty) return null;
  const d = snap.docs[0];
  return memberFromFirestore(d.id, d.data());
}

export async function fetchMemberByAuthUid(uid: string): Promise<Member | null> {
  const db = dbOrThrow();
  const q = query(
    collection(db, COLLECTIONS.members),
    where("authUid", "==", uid)
  );
  const snap = await getDocs(q);
  if (snap.empty) return null;
  const d = snap.docs[0];
  return memberFromFirestore(d.id, d.data());
}

/** Upsert roster row (used by seed + admin edits) */
export async function upsertMember(member: Member): Promise<void> {
  const db = dbOrThrow();
  await setDoc(
    doc(db, COLLECTIONS.members, member.id),
    memberToFirestore(member),
    { merge: true }
  );
}

/**
 * Link Auth uid → member. Only patches auth fields — never overwrites bio/photo/etc.
 */
export async function linkAuthUserToMember(opts: {
  uid: string;
  email: string;
  displayName?: string | null;
  photoURL?: string | null;
  member: Member;
}): Promise<Member> {
  const db = dbOrThrow();
  const now = new Date().toISOString();

  // Prefer existing Firestore profile so we don't wipe edits with stale seed data
  const existing = await fetchMemberById(opts.member.id);
  const base = existing ?? opts.member;

  const linked: Member = {
    ...base,
    authUid: opts.uid,
    pfpUrl: base.pfpUrl || opts.photoURL || undefined,
    updatedAt: now,
  };

  await setDoc(
    doc(db, COLLECTIONS.members, linked.id),
    stripUndefined({
      authUid: opts.uid,
      updatedAt: now,
      emails: emailsForMember(linked),
      ...(base.pfpUrl ? {} : opts.photoURL ? { pfpUrl: opts.photoURL } : {}),
    }),
    { merge: true }
  );

  await setDoc(
    doc(db, COLLECTIONS.users, opts.uid),
    stripUndefined({
      memberId: linked.id,
      email: opts.email.toLowerCase().trim(),
      displayName: opts.displayName ?? linked.fullName,
      linkedAt: now,
      updatedAt: now,
    }),
    { merge: true }
  );

  return linked;
}

export async function updateMemberProfile(
  memberId: string,
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
): Promise<void> {
  const db = dbOrThrow();
  await updateDoc(
    doc(db, COLLECTIONS.members, memberId),
    stripUndefined({
      ...patch,
      updatedAt: new Date().toISOString(),
    })
  );
}
