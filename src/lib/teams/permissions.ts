import type { Member, Team, TeamEvent } from "@/types";

export function isTeamLead(member: Member | null | undefined, team: Team) {
  if (!member) return false;
  return team.leadIds.includes(member.id);
}

export function leadTeamsFor(member: Member, teams: Team[]) {
  return teams.filter((t) => t.leadIds.includes(member.id));
}

/** Create / edit / delete events — actual leads only (admins are not implicit leads). */
export function canManageTeamEvents(
  member: Member | null | undefined,
  team: Team | undefined
) {
  if (!member || !team) return false;
  return team.leadIds.includes(member.id);
}

export function canManageEvent(
  member: Member | null | undefined,
  event: TeamEvent,
  teams: Team[]
) {
  if (!member) return false;
  const team = teams.find((t) => t.id === event.teamId);
  if (team && canManageTeamEvents(member, team)) return true;
  return event.createdBy === member.id;
}
