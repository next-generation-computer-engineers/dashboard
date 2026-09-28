"use client";

import Link from "next/link";
import { useAuth } from "@/lib/auth/AuthProvider";
import { TEAMS, MEMBERS } from "@/data/seed";
import { displayName } from "@/lib/permissions";
import { PageHeader } from "@/components/ui/PageHeader";
import { Avatar } from "@/components/ui/Avatar";
import { useTeamEvents } from "@/lib/events/store";

export default function TeamsPage() {
  const { member } = useAuth();
  const eventsForTeam = useTeamEvents((s) => s.eventsForTeam);

  return (
    <div>
      <PageHeader
        title="Teams"
        description="Open a team to see members and events. Leads can create events for the group."
      />

      <div className="flex flex-col gap-3">
        {TEAMS.map((team) => {
          const members = MEMBERS.filter((m) => team.memberIds.includes(m.id));
          const leads = MEMBERS.filter((m) => team.leadIds.includes(m.id));
          const isMember = member ? team.memberIds.includes(member.id) : false;
          const isLead = member ? team.leadIds.includes(member.id) : false;
          const upcoming = eventsForTeam(team.id).length;

          return (
            <Link
              key={team.id}
              href={`/teams/${team.id}`}
              className="block rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] p-4 transition-colors hover:bg-[var(--surface-hover)] md:p-5"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2.5">
                    <span
                      className="h-2.5 w-2.5 shrink-0 rounded-full"
                      style={{ background: team.color }}
                    />
                    <h3 className="text-base font-medium tracking-tight">
                      {team.name}
                    </h3>
                    {isLead && (
                      <span className="rounded border border-[var(--border)] px-1.5 py-0.5 text-[10px] text-tertiary">
                        Lead
                      </span>
                    )}
                    {isMember && !isLead && (
                      <span className="rounded border border-[var(--border)] px-1.5 py-0.5 text-[10px] text-tertiary">
                        Member
                      </span>
                    )}
                  </div>
                  <p className="mt-1.5 text-sm text-secondary">
                    {team.description}
                  </p>
                  <p className="mt-2 text-xs text-tertiary">
                    Led by {leads.map((l) => displayName(l)).join(", ")}
                    {upcoming > 0 ? ` · ${upcoming} event${upcoming === 1 ? "" : "s"}` : ""}
                  </p>
                </div>
                <div className="flex -space-x-2">
                  {members.slice(0, 5).map((m) => (
                    <Avatar
                      key={m.id}
                      name={displayName(m)}
                      src={m.pfpUrl}
                      size="sm"
                      className="ring-2 ring-[var(--surface)]"
                    />
                  ))}
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
