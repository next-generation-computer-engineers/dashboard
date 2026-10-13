/**
 * Firestore access using the caller's Firebase ID token (security rules apply).
 * Avoids needing a service-account private key when org policy blocks key creation.
 */

type FirestoreValue =
  | { nullValue: null }
  | { stringValue: string }
  | { booleanValue: boolean }
  | { integerValue: string }
  | { doubleValue: number }
  | { arrayValue: { values?: FirestoreValue[] } }
  | { mapValue: { fields?: Record<string, FirestoreValue> } };

function projectId() {
  return (
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ||
    process.env.FIREBASE_PROJECT_ID ||
    ""
  );
}

function docsBase() {
  const pid = projectId();
  if (!pid) throw new Error("NEXT_PUBLIC_FIREBASE_PROJECT_ID is not set");
  return `https://firestore.googleapis.com/v1/projects/${pid}/databases/(default)/documents`;
}

function toFirestoreValue(value: unknown): FirestoreValue {
  if (value === null || value === undefined) return { nullValue: null };
  if (typeof value === "string") return { stringValue: value };
  if (typeof value === "boolean") return { booleanValue: value };
  if (typeof value === "number") {
    return Number.isInteger(value)
      ? { integerValue: String(value) }
      : { doubleValue: value };
  }
  if (Array.isArray(value)) {
    return {
      arrayValue: {
        values: value.filter((v) => v !== undefined).map(toFirestoreValue),
      },
    };
  }
  if (typeof value === "object") {
    const fields: Record<string, FirestoreValue> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      if (v === undefined) continue;
      fields[k] = toFirestoreValue(v);
    }
    return { mapValue: { fields } };
  }
  return { stringValue: String(value) };
}

function fromFirestoreValue(value: FirestoreValue): unknown {
  if ("nullValue" in value) return null;
  if ("stringValue" in value) return value.stringValue;
  if ("booleanValue" in value) return value.booleanValue;
  if ("integerValue" in value) return Number(value.integerValue);
  if ("doubleValue" in value) return value.doubleValue;
  if ("arrayValue" in value) {
    return (value.arrayValue.values ?? []).map(fromFirestoreValue);
  }
  if ("mapValue" in value) {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value.mapValue.fields ?? {})) {
      out[k] = fromFirestoreValue(v);
    }
    return out;
  }
  return null;
}

function docToObject(
  doc: { name?: string; fields?: Record<string, FirestoreValue> } | undefined
): Record<string, unknown> | null {
  if (!doc?.fields) return null;
  const id = doc.name?.split("/").pop() ?? "";
  const data = fromFirestoreValue({ mapValue: { fields: doc.fields } }) as Record<
    string,
    unknown
  >;
  return { id, ...data };
}

function objectToFields(data: Record<string, unknown>) {
  const fields: Record<string, FirestoreValue> = {};
  for (const [k, v] of Object.entries(data)) {
    if (v === undefined || k === "id") continue;
    fields[k] = toFirestoreValue(v);
  }
  return fields;
}

async function firestoreFetch(
  idToken: string,
  path: string,
  init?: RequestInit
) {
  const res = await fetch(`${docsBase()}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${idToken}`,
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Firestore ${res.status}: ${text || res.statusText}`);
  }
  if (res.status === 204) return null;
  return res.json();
}

export async function getDocument<T extends { id: string }>(
  idToken: string,
  collection: string,
  docId: string
): Promise<T | null> {
  try {
    const doc = (await firestoreFetch(
      idToken,
      `/${collection}/${encodeURIComponent(docId)}`
    )) as { name?: string; fields?: Record<string, FirestoreValue> };
    return docToObject(doc) as T | null;
  } catch (err) {
    if (err instanceof Error && err.message.includes("404")) return null;
    throw err;
  }
}

export async function setDocument(
  idToken: string,
  collection: string,
  docId: string,
  data: Record<string, unknown>,
  merge = true
) {
  const fields = objectToFields(data);
  const keys = Object.keys(fields);
  const mask = merge
    ? `?${keys.map((k) => `updateMask.fieldPaths=${encodeURIComponent(k)}`).join("&")}`
    : "";

  // PATCH creates if missing when using updateMask / document path
  await firestoreFetch(
    idToken,
    `/${collection}/${encodeURIComponent(docId)}${mask}`,
    {
      method: "PATCH",
      body: JSON.stringify({ fields }),
    }
  );
}

export async function createDocument(
  idToken: string,
  collection: string,
  docId: string,
  data: Record<string, unknown>
) {
  await firestoreFetch(
    idToken,
    `/${collection}?documentId=${encodeURIComponent(docId)}`,
    {
      method: "POST",
      body: JSON.stringify({ fields: objectToFields(data) }),
    }
  );
}

export async function queryCollection<T extends { id: string }>(
  idToken: string,
  collectionId: string,
  fieldPath: string,
  op:
    | "EQUAL"
    | "ARRAY_CONTAINS"
    | "GREATER_THAN_OR_EQUAL"
    | "LESS_THAN_OR_EQUAL",
  value: string | number
): Promise<T[]> {
  const structuredQuery = {
    from: [{ collectionId }],
    where: {
      fieldFilter: {
        field: { fieldPath },
        op,
        value: toFirestoreValue(value),
      },
    },
    limit: 25,
  };

  const rows = (await firestoreFetch(idToken, ":runQuery", {
    method: "POST",
    body: JSON.stringify({ structuredQuery }),
  })) as Array<{ document?: { name?: string; fields?: Record<string, FirestoreValue> } }>;

  return (rows ?? [])
    .map((r) => docToObject(r.document) as T | null)
    .filter((m): m is T => Boolean(m));
}

export async function addDocument(
  idToken: string,
  collection: string,
  data: Record<string, unknown>
) {
  await firestoreFetch(idToken, `/${collection}`, {
    method: "POST",
    body: JSON.stringify({ fields: objectToFields(data) }),
  });
}

export async function deleteDocument(
  idToken: string,
  collection: string,
  docId: string
) {
  await firestoreFetch(
    idToken,
    `/${collection}/${encodeURIComponent(docId)}`,
    { method: "DELETE" }
  );
}
