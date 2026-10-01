import type { Member, Team, TeamEvent } from "@/types";

function isAdmin(member: Member | null | undefined) {
  return Boolean(member?.roleIds.includes("role_admin"));
}

export function isTeamLead(member: Member | null | undefined, team: Team) {
  if (!member) return false;
  if (isAdmin(member)) return true;
  return team.leadIds.includes(member.id);
}

/** Teams the member can create/manage events for — admins = every team. */
export function leadTeamsFor(member: Member, teams: Team[]) {
  if (isAdmin(member)) return teams;
  return teams.filter((t) => t.leadIds.includes(member.id));
}

/** Create / edit / delete events — team leads + admins. */
export function canManageTeamEvents(
  member: Member | null | undefined,
  team: Team | undefined
) {
  if (!member || !team) return false;
  if (isAdmin(member)) return true;
  return team.leadIds.includes(member.id);
}

export function canManageEvent(
  member: Member | null | undefined,
  event: TeamEvent,
  teams: Team[]
) {
  if (!member) return false;
  if (isAdmin(member)) return true;
  const team = teams.find((t) => t.id === event.teamId);
  if (team && canManageTeamEvents(member, team)) return true;
  return event.createdBy === member.id;
}
