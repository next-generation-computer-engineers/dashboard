import type { ClassAssignment, ClassEntity, Member, Team } from "@/types";
import { buildSearchKeywords } from "@/lib/utils";
import volunteers from "@/data/volunteers.json";

type VolunteerRow = (typeof volunteers)[number];

function avatarFor(name: string) {
  const seed = encodeURIComponent(name.replace(/\s+/g, ""));
  return `https://api.dicebear.com/9.x/notionists/svg?seed=${seed}&backgroundColor=e8eef7`;
}

export function memberEmails(m: Pick<Member, "personalEmail" | "schoolEmail" | "cengEmail">): string[] {
  return [m.personalEmail, m.schoolEmail, m.cengEmail]
    .filter((e): e is string => Boolean(e))
    .map((e) => e.toLowerCase().trim());
}

export function emailsMatch(
  member: Pick<Member, "personalEmail" | "schoolEmail" | "cengEmail">,
  email?: string | null
): boolean {
  if (!email) return false;
  const target = email.toLowerCase().trim();
  return memberEmails(member).includes(target);
}

function mkMemberFromVolunteer(v: VolunteerRow, teamIds: string[]): Member {
  const joinedYear = v.yearJoined ? `${v.yearJoined}-09-01T00:00:00Z` : "2025-09-01T00:00:00Z";
  const member: Member = {
    id: v.id,
    authUid: "",
    fullName: v.fullName,
    preferredName: v.preferredName || undefined,
    pfpUrl: avatarFor(v.fullName),
    personalEmail: v.personalEmail,
    schoolEmail: v.schoolEmail || undefined,
    phone: v.phone || undefined,
    school: v.school || undefined,
    grade: v.grade || undefined,
    roleIds: v.roleIds,
    teamIds,
    status: "active",
    onboardingStatus: "complete",
    title: v.title || v.roleRaw || "Volunteer",
    joinedAt: joinedYear,
    createdAt: joinedYear,
    updatedAt: "2026-09-01T00:00:00Z",
    searchKeywords: [],
  };
  member.searchKeywords = buildSearchKeywords([
    member.fullName,
    member.preferredName,
    member.title,
    member.personalEmail,
    member.schoolEmail,
    member.cengEmail,
    member.phone,
    member.school,
    member.grade,
    member.affiliation,
    ...member.roleIds,
    ...member.teamIds,
  ]);
  return member;
}

function roleHay(v: VolunteerRow) {
  return `${v.roleRaw} ${v.title}`.toLowerCase();
}

/** Assign org teams from contact-list titles */
function teamIdsForVolunteer(v: VolunteerRow): string[] {
  const r = roleHay(v);
  const ids: string[] = [];
  if (
    r.includes("president") ||
    r.includes("advisor") ||
    r.includes("secretary") ||
    r.includes("vp of operations")
  ) {
    ids.push("team_leadership");
  }
  if (r.includes("curriculum") || r.includes("tutorial") || r.includes("engineering")) {
    ids.push("team_curriculum");
  }
  if (r.includes("marketing")) ids.push("team_marketing");
  if (r.includes("outreach") || r.includes("recruiting") || r.includes("volunteering")) {
    ids.push("team_outreach");
  }
  if (r.includes("hackathon") || r.includes("special projects")) {
    ids.push("team_hackathon");
  }
  if (r.includes("robotics")) ids.push("team_robotics_curriculum");
  // Om + curriculum VPs often touch robotics materials
  if (v.id === "v_om_anand_khaunte" || v.id === "v_karthik_yarakaraju") {
    if (!ids.includes("team_robotics_curriculum")) ids.push("team_robotics_curriculum");
    if (!ids.includes("team_curriculum")) ids.push("team_curriculum");
  }
  return Array.from(new Set(ids));
}

export const MEMBERS: Member[] = volunteers.map((v) =>
  mkMemberFromVolunteer(v, teamIdsForVolunteer(v))
);

export function findMemberByEmail(email?: string | null): Member | undefined {
  if (!email) return undefined;
  return MEMBERS.find((m) => emailsMatch(m, email));
}

export function getMember(id: string) {
  return MEMBERS.find((m) => m.id === id);
}

function idsWhere(pred: (m: Member) => boolean, limit?: number) {
  const out = MEMBERS.filter(pred).map((m) => m.id);
  return limit ? out.slice(0, limit) : out;
}

function hasTitle(m: Member, ...needles: string[]) {
  const h = `${m.title ?? ""}`.toLowerCase();
  return needles.some((n) => h.includes(n));
}

export const TEAMS: Team[] = [
  {
    id: "team_robotics_curriculum",
    name: "Robotics Curriculum",
    slug: "robotics-curriculum",
    description: "Builds and maintains robotics lesson materials for teaching teams.",
    leadIds: idsWhere(
      (m) =>
        m.id === "v_om_anand_khaunte" ||
        m.id === "v_karthik_yarakaraju" ||
        hasTitle(m, "vp of curriculum", "senior vp of curriculum"),
      4
    ),
    memberIds: idsWhere((m) => m.teamIds.includes("team_robotics_curriculum")),
    color: "#7EB8A0",
  },
  {
    id: "team_curriculum",
    name: "Curriculum",
    slug: "curriculum",
    description: "Lesson design, materials, and instructional quality",
    leadIds: idsWhere(
      (m) => hasTitle(m, "vp of curriculum", "senior vp of curriculum", "secretary"),
      5
    ),
    memberIds: idsWhere((m) => m.teamIds.includes("team_curriculum")),
    color: "#6BA3A0",
  },
  {
    id: "team_marketing",
    name: "Marketing",
    slug: "marketing",
    description: "Brand, social, and storytelling",
    leadIds: idsWhere((m) => hasTitle(m, "marketing"), 3),
    memberIds: idsWhere((m) => m.teamIds.includes("team_marketing")),
    color: "#D4A574",
  },
  {
    id: "team_outreach",
    name: "Outreach",
    slug: "outreach",
    description: "Schools, partners, and community growth",
    leadIds: idsWhere((m) => hasTitle(m, "outreach", "recruiting", "volunteering"), 3),
    memberIds: idsWhere((m) => m.teamIds.includes("team_outreach")),
    color: "#74A8D4",
  },
  {
    id: "team_hackathon",
    name: "Hackathon",
    slug: "hackathon",
    description: "Event logistics and competition programs",
    leadIds: idsWhere((m) => hasTitle(m, "special projects", "hackathon"), 3),
    memberIds: idsWhere((m) => m.teamIds.includes("team_hackathon")),
    color: "#A89BC8",
  },
  {
    id: "team_leadership",
    name: "Leadership",
    slug: "leadership",
    description: "Core team and organizational direction",
    leadIds: idsWhere(
      (m) =>
        hasTitle(m, "president", "co-president", "advisor") ||
        m.id === "v_om_anand_khaunte",
      6
    ),
    memberIds: idsWhere((m) => m.teamIds.includes("team_leadership")),
    color: "#C9A96E",
  },
];

/** Normalize staff labels from the master sheet for name matching */
function normalizeStaffLabel(label: string): string {
  return label
    .replace(/\(.*?\)/g, " ")
    .replace(/\b(backup|shadow)\b/gi, " ")
    .replace(/[^a-zA-Z\s'-]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

export function findMemberByStaffName(label: string): Member | undefined {
  const needle = normalizeStaffLabel(label);
  if (!needle) return undefined;

  const exact = MEMBERS.find((m) => m.fullName.toLowerCase() === needle);
  if (exact) return exact;

  const preferred = MEMBERS.find(
    (m) => (m.preferredName ?? "").toLowerCase() === needle
  );
  if (preferred && needle.length > 2) return preferred;

  // "First L" / "First Last" / partial first token match against full name
  const tokens = needle.split(" ").filter(Boolean);
  const first = tokens[0];
  for (const m of MEMBERS) {
    const full = m.fullName.toLowerCase();
    const parts = full.split(/\s+/);
    if (tokens.length === 1) {
      if (parts[0] === first && parts.length === 1) return m;
      continue;
    }
    if (parts[0] !== first) continue;
    const lastNeedle = tokens[tokens.length - 1];
    const lastPart = parts[parts.length - 1];
    if (lastPart.startsWith(lastNeedle) || lastNeedle.startsWith(lastPart[0] ?? "")) {
      // Prefer last-initial matches like "Harshit T"
      if (lastNeedle.length === 1 && lastPart.startsWith(lastNeedle)) return m;
      if (lastNeedle.length > 1 && (lastPart.startsWith(lastNeedle) || lastNeedle.startsWith(lastPart)))
        return m;
    }
  }

  // First name unique match
  const firstMatches = MEMBERS.filter((m) => m.fullName.toLowerCase().startsWith(first + " "));
  if (firstMatches.length === 1 && tokens.length >= 1) return firstMatches[0];

  return undefined;
}

export function buildClassAssignments(
  classes: ClassEntity[],
  sessionId: string
): ClassAssignment[] {
  const out: ClassAssignment[] = [];
  let n = 0;

  const roleBuckets: {
    role: ClassAssignment["classRole"];
    keys: (keyof ClassEntity)[];
  }[] = [
    { role: "lead_teacher", keys: ["leadTeachers"] },
    { role: "senior_mentor", keys: ["seniorMentors", "supervisors"] },
    { role: "helper", keys: ["helpers"] },
    { role: "floater", keys: ["floaters"] },
    { role: "mentor", keys: ["beginningStaff", "intermediateStaff", "advancedStaff"] },
  ];

  for (const cls of classes) {
    const seen = new Set<string>();
    for (const bucket of roleBuckets) {
      for (const key of bucket.keys) {
        const names = (cls[key] as string[] | undefined) ?? [];
        for (const label of names) {
          const member = findMemberByStaffName(label);
          if (!member || seen.has(member.id)) continue;
          seen.add(member.id);
          n += 1;
          out.push({
            id: `ca_${n}`,
            classId: cls.id,
            memberId: member.id,
            classRole: bucket.role,
            status: "confirmed",
            sessionId,
            createdAt: "2026-08-01T00:00:00Z",
            updatedAt: "2026-08-01T00:00:00Z",
          });
        }
      }
    }
  }
  return out;
}

/** Default demo identity — Om (roster owner / builder) */
export const DEMO_USER_ID = "v_om_anand_khaunte";
