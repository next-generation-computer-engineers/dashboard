import type { Member, MemberOnboarding, Permission } from "@/types";
import { COLLECTIONS } from "@/lib/firebase/schema";
import { verifyFirebaseIdToken } from "@/lib/firebase/verifyIdToken";
import {
  addDocument,
  createDocument,
  deleteDocument,
  getDocument,
  queryCollection,
  setDocument,
} from "@/lib/firebase/userFirestore";
import { hasPermission } from "@/lib/permissions";
import { emailsForMember } from "@/lib/firebase/serialize";
import { buildSearchKeywords } from "@/lib/utils";
import { isAdminSdkConfigured, getAdminDb } from "@/lib/firebase/admin";

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export function jsonError(err: unknown) {
  if (err instanceof ApiError) {
    return Response.json({ error: err.message }, { status: err.status });
  }
  const message = err instanceof Error ? err.message : "Internal error";
  const status =
    message.includes("not configured") || message.includes("not set")
      ? 503
      : 500;
  return Response.json({ error: message }, { status });
}

function bearerToken(req: Request) {
  const header = req.headers.get("authorization");
  const token = header?.replace(/^Bearer\s+/i, "").trim();
  if (!token) throw new ApiError(401, "Missing Authorization bearer token");
  return token;
}

export async function requireCaller(
  req: Request,
  permission: Permission | Permission[]
): Promise<{ uid: string; memberId: string; member: Member; idToken: string }> {
  const idToken = bearerToken(req);
  const decoded = await verifyFirebaseIdToken(idToken);

  const userDoc = await getDocument<{ id: string; memberId?: string }>(
    idToken,
    COLLECTIONS.users,
    decoded.uid
  );
  const memberId = String(userDoc?.memberId ?? "");
  if (!memberId) {
    throw new ApiError(403, "Auth user is not linked to a member profile");
  }

  const member = await getDocument<Member>(
    idToken,
    COLLECTIONS.members,
    memberId
  );
  if (!member) throw new ApiError(403, "Member profile not found");

  const needed = Array.isArray(permission) ? permission : [permission];
  const ok = needed.some((p) => hasPermission(member.roleIds ?? [], p));
  if (!ok) throw new ApiError(403, "Missing onboarding permission");

  return { uid: decoded.uid, memberId, member, idToken };
}

export async function requireLinkedMember(req: Request): Promise<{
  uid: string;
  memberId: string;
  member: Member;
  idToken: string;
}> {
  const idToken = bearerToken(req);
  const decoded = await verifyFirebaseIdToken(idToken);

  const userDoc = await getDocument<{ id: string; memberId?: string }>(
    idToken,
    COLLECTIONS.users,
    decoded.uid
  );
  const memberId = String(userDoc?.memberId ?? "");
  if (!memberId) throw new ApiError(403, "Not linked to a member");

  const member = await getDocument<Member>(
    idToken,
    COLLECTIONS.members,
    memberId
  );
  if (!member) throw new ApiError(403, "Member not found");

  return { uid: decoded.uid, memberId, member, idToken };
}

export async function findMemberByEmail(
  idToken: string,
  email: string
): Promise<Member | null> {
  const normalized = email.toLowerCase().trim();
  if (!normalized) return null;
  const rows = await queryCollection<Member>(
    idToken,
    COLLECTIONS.members,
    "emails",
    "ARRAY_CONTAINS",
    normalized
  );
  return rows[0] ?? null;
}

export async function findMemberBySubmissionId(
  idToken: string,
  submissionId: number
): Promise<Member | null> {
  const rows = await queryCollection<Member>(
    idToken,
    COLLECTIONS.members,
    "onboarding.docusealSubmissionId",
    "EQUAL",
    submissionId
  );
  return rows[0] ?? null;
}

/** Webhook / optional Admin SDK path when a service account is available. */
export async function findMemberBySubmissionIdAdmin(
  submissionId: number
): Promise<Member | null> {
  if (!isAdminSdkConfigured()) return null;
  try {
    const db = getAdminDb();
    const snap = await db
      .collection(COLLECTIONS.members)
      .where("onboarding.docusealSubmissionId", "==", submissionId)
      .limit(1)
      .get();
    if (snap.empty) return null;
    const d = snap.docs[0]!;
    return { id: d.id, ...(d.data() as Omit<Member, "id">) };
  } catch {
    return null;
  }
}

export async function findMemberByEmailAdmin(
  email: string
): Promise<Member | null> {
  if (!isAdminSdkConfigured()) return null;
  try {
    const normalized = email.toLowerCase().trim();
    const db = getAdminDb();
    const snap = await db
      .collection(COLLECTIONS.members)
      .where("emails", "array-contains", normalized)
      .limit(1)
      .get();
    if (snap.empty) return null;
    const d = snap.docs[0]!;
    return { id: d.id, ...(d.data() as Omit<Member, "id">) };
  } catch {
    return null;
  }
}

export function slugifyName(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "")
    .slice(0, 40);
}

export function buildInviteMember(input: {
  fullName: string;
  personalEmail: string;
  schoolEmail?: string;
  phone?: string;
  school?: string;
  grade?: string;
  title?: string;
  roleIds: string[];
  teamIds: string[];
  onboarding: MemberOnboarding;
}): Member {
  const now = new Date().toISOString();
  const id = `v_${slugifyName(input.fullName) || "volunteer"}_${Date.now().toString(36)}`;
  const member: Member = {
    id,
    authUid: "",
    fullName: input.fullName.trim(),
    personalEmail: input.personalEmail.toLowerCase().trim(),
    schoolEmail: input.schoolEmail?.toLowerCase().trim() || undefined,
    phone: input.phone?.trim() || undefined,
    school: input.school?.trim() || undefined,
    grade: input.grade?.trim() || undefined,
    title: input.title?.trim() || "Volunteer",
    roleIds: input.roleIds.length ? input.roleIds : ["role_volunteer"],
    teamIds: input.teamIds,
    status: "pending",
    onboardingStatus: "in_progress",
    onboarding: input.onboarding,
    searchKeywords: [],
    joinedAt: now,
    createdAt: now,
    updatedAt: now,
  };
  member.searchKeywords = buildSearchKeywords([
    member.fullName,
    member.title,
    member.personalEmail,
    member.schoolEmail,
    member.phone,
    member.school,
    member.grade,
    ...member.roleIds,
    ...member.teamIds,
  ]);
  return member;
}

export function memberToFirestoreDoc(member: Member) {
  const { id: _id, ...rest } = member;
  return {
    ...rest,
    emails: emailsForMember(member),
    source: "onboarding",
  };
}

export async function saveNewMember(idToken: string, member: Member) {
  await createDocument(
    idToken,
    COLLECTIONS.members,
    member.id,
    memberToFirestoreDoc(member)
  );
}

export async function patchMember(
  idToken: string,
  memberId: string,
  patch: Record<string, unknown>
) {
  await setDocument(idToken, COLLECTIONS.members, memberId, {
    ...patch,
    updatedAt: new Date().toISOString(),
  });
}

export async function writeOnboardingEvent(
  idToken: string | null,
  event: {
    type: string;
    memberId: string;
    actorMemberId?: string;
    payload?: Record<string, unknown>;
  }
) {
  const payload = { ...event, createdAt: new Date().toISOString() };
  try {
    if (idToken) {
      await addDocument(idToken, COLLECTIONS.onboardingEvents, payload);
      return;
    }
    if (isAdminSdkConfigured()) {
      await getAdminDb().collection(COLLECTIONS.onboardingEvents).add(payload);
    }
  } catch (err) {
    console.warn("[onboarding] audit log skipped", err);
  }
}

/** Delete roster member (and best-effort user link if authUid set). */
export async function deleteMemberRecord(
  idToken: string,
  member: Member
) {
  if (member.authUid) {
    try {
      await deleteDocument(idToken, COLLECTIONS.users, member.authUid);
    } catch (err) {
      console.warn("[onboarding] user link delete skipped", err);
    }
  }
  await deleteDocument(idToken, COLLECTIONS.members, member.id);
}
