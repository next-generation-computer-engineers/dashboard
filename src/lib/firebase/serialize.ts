import type { Member } from "@/types";
import { memberEmails } from "@/data/roster";

/** Lowercased email index for Firestore `array-contains` lookups */
export function emailsForMember(
  m: Pick<Member, "personalEmail" | "schoolEmail" | "cengEmail" | "cengEmailAliases">
): string[] {
  return Array.from(new Set(memberEmails(m)));
}

/** Strip undefined so Firestore accepts the payload */
export function stripUndefined<T extends Record<string, unknown>>(obj: T): T {
  const out = { ...obj };
  for (const key of Object.keys(out)) {
    if (out[key] === undefined) delete out[key];
  }
  return out;
}

export function memberToFirestore(member: Member) {
  return stripUndefined({
    ...member,
    emails: emailsForMember(member),
    source: "roster" as const,
  });
}
