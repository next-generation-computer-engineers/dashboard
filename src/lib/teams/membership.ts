import type { Member, Team } from "@/types";
import { displayName } from "@/lib/permissions";

/** Team ids a member belongs to, derived from team.memberIds */
export function teamIdsForMember(teams: Team[], memberId: string): string[] {
  return teams.filter((t) => t.memberIds.includes(memberId)).map((t) => t.id);
}

/** Live lead profiles for a team (order matches team.leadIds). */
export function resolveTeamLeads(
  team: Team,
  members: Member[]
): Member[] {
  const byId = new Map(members.map((m) => [m.id, m]));
  return team.leadIds
    .map((id) => byId.get(id))
    .filter((m): m is Member => Boolean(m));
}

/** “Led by …” label from current leadIds — updates whenever leads change. */
export function ledByLabel(team: Team, members: Member[]): string {
  const leads = resolveTeamLeads(team, members);
  if (leads.length === 0) return "No leads yet";
  return `Led by ${leads.map((l) => displayName(l)).join(", ")}`;
}

export function isTeamMember(team: Team, memberId: string): boolean {
  return team.memberIds.includes(memberId);
}
