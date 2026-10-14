"use client";

import { getFirebaseAuth } from "@/lib/firebase/client";

export async function getIdTokenOrThrow(): Promise<string> {
  const auth = getFirebaseAuth();
  const user = auth?.currentUser;
  if (!user) throw new Error("You must be signed in");
  return user.getIdToken();
}

/** Authenticated JSON fetch for admin / onboarding APIs. */
export async function apiFetch<T>(
  path: string,
  init?: RequestInit & { json?: unknown }
): Promise<T> {
  const token = await getIdTokenOrThrow();
  const { json, headers, ...rest } = init ?? {};
  const res = await fetch(path, {
    ...rest,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(json !== undefined ? { "Content-Type": "application/json" } : {}),
      ...(headers ?? {}),
    },
    body: json !== undefined ? JSON.stringify(json) : rest.body,
  });

  const data = (await res.json().catch(() => ({}))) as T & { error?: string };
  if (!res.ok) {
    throw new Error(data.error || `Request failed (${res.status})`);
  }
  return data;
}
