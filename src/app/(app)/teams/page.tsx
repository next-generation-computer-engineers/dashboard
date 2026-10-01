"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { useAuth } from "@/lib/auth/AuthProvider";
import { useMembers } from "@/lib/members/MembersProvider";
import { displayName, hasPermission } from "@/lib/permissions";
import { PageHeader } from "@/components/ui/PageHeader";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { GlassCard } from "@/components/ui/GlassCard";
import {
  filterEventsForTeam,
  useTeamEvents,
} from "@/lib/events/store";
import { useTeamsStore } from "@/lib/teams/store";
import {
  isTeamMember,
  teamIdsForMember,
} from "@/lib/teams/membership";

export default function TeamsPage() {
  const { member } = useAuth();
  const { members, adminPatchMember } = useMembers();
  const allEvents = useTeamEvents((s) => s.events);
  const teams = useTeamsStore((s) => s.teams);
  const createTeam = useTeamsStore((s) => s.createTeam);
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);

  const canAdmin = Boolean(
    member && hasPermission(member.roleIds, "admin:access")
  );

  /** Everyone only sees teams they belong to; admins additionally see all for management. */
  const visibleTeams = useMemo(() => {
    const sorted = [...teams].sort((a, b) => a.name.localeCompare(b.name));
    if (canAdmin) return sorted;
    if (!member) return [];
    return sorted.filter((t) => isTeamMember(t, member.id));
  }, [teams, member, canAdmin]);

  async function onCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !member) return;
    setSaving(true);
    try {
      createTeam({
        name,
        description,
        leadIds: [member.id],
        memberIds: [member.id],
      });
      const ids = teamIdsForMember(
        useTeamsStore.getState().teams,
        member.id
      );
      await adminPatchMember(member.id, { teamIds: ids });
      setName("");
      setDescription("");
      setShowCreate(false);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="Teams"
        description={
          canAdmin
            ? "Your org teams. Admins see every team to create, assign leads, and manage members."
            : "Teams you’re on. Open one for members, events, and lead tools."
        }
        actions={
          canAdmin ? (
            <Button size="sm" onClick={() => setShowCreate((v) => !v)}>
              <Plus className="h-3.5 w-3.5" />
              New team
            </Button>
          ) : undefined
        }
      />

      {showCreate && canAdmin && (
        <GlassCard className="mb-6 max-w-lg">
          <h2 className="mb-3 text-sm font-medium">Create team</h2>
          <form onSubmit={(e) => void onCreate(e)} className="space-y-3">
            <div>
              <label className="mb-1 block text-xs text-tertiary">Name</label>
              <input
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="input-field"
                placeholder="Curriculum"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-tertiary">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="input-field !h-auto !py-2.5 resize-none"
                rows={2}
                placeholder="What does this team do?"
              />
            </div>
            <div className="flex gap-2">
              <Button type="submit" disabled={saving || !name.trim()}>
                {saving ? "Creating…" : "Create"}
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => setShowCreate(false)}
              >
                Cancel
              </Button>
            </div>
          </form>
        </GlassCard>
      )}

      {visibleTeams.length === 0 ? (
        <GlassCard className="py-10 text-center">
          <p className="text-sm text-secondary">
            You’re not on any teams yet.
            {canAdmin
              ? " Create one above, or add yourself from a team’s member list."
              : " Ask a lead or admin to add you."}
          </p>
        </GlassCard>
      ) : (
        <div className="flex flex-col gap-3">
          {visibleTeams.map((team) => {
            const teamMembers = members.filter((m) =>
              team.memberIds.includes(m.id)
            );
            const isMember = member
              ? isTeamMember(team, member.id)
              : false;
            const isLead = member
              ? team.leadIds.includes(member.id)
              : false;
            const upcoming = filterEventsForTeam(allEvents, team.id).length;

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
                      {canAdmin && !isMember && (
                        <span className="rounded border border-[var(--border)] px-1.5 py-0.5 text-[10px] text-tertiary">
                          Admin view
                        </span>
                      )}
                    </div>
                    <p className="mt-1.5 text-sm text-secondary">
                      {team.description}
                    </p>
                    <p className="mt-2 text-xs text-tertiary">
                      {upcoming > 0
                        ? `${upcoming} event${upcoming === 1 ? "" : "s"} · `
                        : ""}
                      {`${teamMembers.length} member${teamMembers.length === 1 ? "" : "s"}`}
                    </p>
                  </div>
                  <div className="flex -space-x-2">
                    {teamMembers.slice(0, 5).map((m) => (
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
      )}
    </div>
  );
}
