import type { ClassAssignment, ClassEntity, Permission, Session } from "@/types";
import { COLLECTIONS } from "@/lib/firebase/schema";
import {
  ApiError,
  jsonError,
  requireCaller,
} from "@/lib/onboarding/server";
import {
  createDocument,
  deleteDocument,
  getDocument,
  queryCollection,
  setDocument,
} from "@/lib/firebase/userFirestore";
import { stripUndefined } from "@/lib/firebase/serialize";

export { ApiError, jsonError, requireCaller };

export async function requireAdminSession(
  req: Request,
  permission: Permission | Permission[] = ["admin:sessions", "classes:write", "admin:access"]
) {
  return requireCaller(req, permission);
}

export async function listSessions(idToken: string): Promise<Session[]> {
  // REST query without a field filter isn't supported the same way — fetch via
  // a broad query on year or fall back to runQuery all documents through list.
  // userFirestore has queryCollection with field ops; for full list use documents list.
  return listCollection<Session>(idToken, COLLECTIONS.sessions);
}

export async function listClasses(
  idToken: string,
  sessionId?: string
): Promise<ClassEntity[]> {
  if (sessionId) {
    return queryCollection<ClassEntity>(
      idToken,
      COLLECTIONS.classes,
      "sessionId",
      "EQUAL",
      sessionId
    );
  }
  return listCollection<ClassEntity>(idToken, COLLECTIONS.classes);
}

async function listCollection<T extends { id: string }>(
  idToken: string,
  collection: string
): Promise<T[]> {
  const projectId =
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ||
    process.env.FIREBASE_PROJECT_ID ||
    "";
  if (!projectId) throw new ApiError(503, "Firebase project not configured");

  const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/${collection}?pageSize=500`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${idToken}` },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new ApiError(res.status, text || "Failed to list documents");
  }
  const data = (await res.json()) as {
    documents?: { name?: string; fields?: Record<string, unknown> }[];
  };
  return (data.documents ?? []).map((doc) => {
    const id = doc.name?.split("/").pop() ?? "";
    return firestoreFieldsToObject(id, doc.fields ?? {}) as T;
  });
}

function fromFsValue(value: unknown): unknown {
  if (!value || typeof value !== "object") return null;
  const v = value as Record<string, unknown>;
  if ("nullValue" in v) return null;
  if ("stringValue" in v) return v.stringValue;
  if ("booleanValue" in v) return v.booleanValue;
  if ("integerValue" in v) return Number(v.integerValue);
  if ("doubleValue" in v) return v.doubleValue;
  if ("arrayValue" in v) {
    const arr = v.arrayValue as { values?: unknown[] };
    return (arr.values ?? []).map(fromFsValue);
  }
  if ("mapValue" in v) {
    const map = v.mapValue as { fields?: Record<string, unknown> };
    const out: Record<string, unknown> = {};
    for (const [k, nested] of Object.entries(map.fields ?? {})) {
      out[k] = fromFsValue(nested);
    }
    return out;
  }
  return null;
}

function firestoreFieldsToObject(
  id: string,
  fields: Record<string, unknown>
): Record<string, unknown> {
  const out: Record<string, unknown> = { id };
  for (const [k, v] of Object.entries(fields)) {
    out[k] = fromFsValue(v);
  }
  return out;
}

export async function saveSession(idToken: string, session: Session) {
  const { id, ...rest } = session;
  await createDocument(
    idToken,
    COLLECTIONS.sessions,
    id,
    stripUndefined(rest as Record<string, unknown>)
  );
}

export async function patchSession(
  idToken: string,
  sessionId: string,
  patch: Partial<Session>
) {
  const { id: _id, ...rest } = patch;
  await setDocument(
    idToken,
    COLLECTIONS.sessions,
    sessionId,
    stripUndefined(rest as Record<string, unknown>)
  );
}

export async function saveClass(idToken: string, cls: ClassEntity) {
  const { id, ...rest } = cls;
  await createDocument(
    idToken,
    COLLECTIONS.classes,
    id,
    stripUndefined(rest as Record<string, unknown>)
  );
}

export async function patchClass(
  idToken: string,
  classId: string,
  patch: Partial<ClassEntity>
) {
  const { id: _id, ...rest } = patch;
  await setDocument(
    idToken,
    COLLECTIONS.classes,
    classId,
    stripUndefined(rest as Record<string, unknown>)
  );
}

export async function upsertClass(idToken: string, cls: ClassEntity) {
  const existing = await getDocument<ClassEntity>(
    idToken,
    COLLECTIONS.classes,
    cls.id
  );
  const { id, ...rest } = cls;
  if (existing) {
    await setDocument(
      idToken,
      COLLECTIONS.classes,
      id,
      stripUndefined(rest as Record<string, unknown>)
    );
  } else {
    await createDocument(
      idToken,
      COLLECTIONS.classes,
      id,
      stripUndefined(rest as Record<string, unknown>)
    );
  }
}

export async function saveAssignment(
  idToken: string,
  assignment: ClassAssignment
) {
  const { id, ...rest } = assignment;
  await createDocument(
    idToken,
    COLLECTIONS.classAssignments,
    id,
    stripUndefined(rest as Record<string, unknown>)
  );
}

export async function deleteAssignment(idToken: string, assignmentId: string) {
  await deleteDocument(idToken, COLLECTIONS.classAssignments, assignmentId);
}

export function slugifySessionId(name: string, year: number) {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "")
    .slice(0, 40);
  return `session_${base || year}`;
}
