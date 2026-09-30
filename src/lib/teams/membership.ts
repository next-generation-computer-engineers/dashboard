import type { Team } from "@/types";

/** Team ids a member belongs to, derived from team.memberIds */
export function teamIdsForMember(teams: Team[], memberId: string): string[] {
  return teams.filter((t) => t.memberIds.includes(memberId)).map((t) => t.id);
}
