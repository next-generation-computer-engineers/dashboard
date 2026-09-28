import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPhone(phone?: string): string {
  if (!phone) return "—";
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  return phone;
}

export function digitsOnly(value?: string | null): string {
  return (value ?? "").replace(/\D/g, "");
}

export function buildSearchKeywords(parts: (string | undefined | null)[]): string[] {
  const raw = parts.filter(Boolean).join(" ").toLowerCase();
  const tokens = raw
    .split(/[\s,;/|@.+\-_()]+/)
    .map((t) => t.trim())
    .filter((t) => t.length > 1);
  const phone = digitsOnly(parts.filter(Boolean).join(" "));
  if (phone.length >= 7) tokens.push(phone, phone.slice(-4));
  return Array.from(new Set(tokens));
}

/** Flexible directory match: every query token must hit name/email/phone/school/etc. */
export function memberMatchesQuery(
  member: {
    fullName: string;
    preferredName?: string;
    title?: string;
    personalEmail: string;
    schoolEmail?: string;
    cengEmail?: string;
    phone?: string;
    school?: string;
    grade?: string;
    affiliation?: string;
    bio?: string;
    searchKeywords: string[];
  },
  query: string,
  extra: string[] = []
): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;

  const phoneDigits = digitsOnly(member.phone);
  const hay = [
    member.fullName,
    member.preferredName,
    member.title,
    member.personalEmail,
    member.schoolEmail,
    member.cengEmail,
    member.phone,
    phoneDigits,
    formatPhone(member.phone),
    member.school,
    member.grade,
    member.affiliation,
    member.bio,
    ...member.searchKeywords,
    ...extra,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  const hayDigits = digitsOnly(hay);
  const tokens = q.split(/\s+/).filter(Boolean);

  return tokens.every((token) => {
    if (hay.includes(token)) return true;
    const tokenDigits = digitsOnly(token);
    if (tokenDigits.length >= 3 && hayDigits.includes(tokenDigits)) return true;
    return false;
  });
}
