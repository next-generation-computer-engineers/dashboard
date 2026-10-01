"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { CLASSES } from "@/data/seed";
import { useMembers } from "@/lib/members/MembersProvider";
import { useTeamsStore } from "@/lib/teams/store";
import { useClassAssignments } from "@/lib/classes/assignmentsStore";
import { ALL_ROLES, displayName, getRolesByIds } from "@/lib/permissions";
import { PageHeader } from "@/components/ui/PageHeader";
import { Avatar } from "@/components/ui/Avatar";
import { RoleBadge, StatusDot } from "@/components/ui/Badge";
import { formatPhone, memberMatchesQuery } from "@/lib/utils";
import type { MemberStatus } from "@/types";

export default function DirectoryPage() {
  const { members, source } = useMembers();
  const teams = useTeamsStore((s) => s.teams);
  const allAssignments = useClassAssignments((s) => s.assignments);
  const [query, setQuery] = useState("");
  const [roleId, setRoleId] = useState("all");
  const [teamId, setTeamId] = useState("all");
  const [classId, setClassId] = useState("all");
  const [status, setStatus] = useState<MemberStatus | "all">("active");

  const filtered = useMemo(() => {
    return members.filter((m) => {
      if (status !== "all" && m.status !== status) return false;
      if (roleId !== "all" && !m.roleIds.includes(roleId)) return false;
      if (teamId !== "all" && !m.teamIds.includes(teamId) && !teams.find((t) => t.id === teamId)?.memberIds.includes(m.id)) return false;
      if (classId !== "all") {
        const assigned = allAssignments.some(
          (a) => a.memberId === m.id && a.classId === classId
        );
        if (!assigned) return false;
      }

      const roleNames = getRolesByIds(m.roleIds).map((r) => r.name);
      const teamNames = teams
        .filter((t) => t.memberIds.includes(m.id) || m.teamIds.includes(t.id))
        .map((t) => t.name);
      const classNames = allAssignments
        .filter((a) => a.memberId === m.id)
        .map((a) => CLASSES.find((c) => c.id === a.classId)?.name)
        .filter(Boolean) as string[];

      return memberMatchesQuery(m, query, [
        ...roleNames,
        ...teamNames,
        ...classNames,
      ]);
    }).sort((a, b) => a.fullName.localeCompare(b.fullName));
  }, [members, query, roleId, teamId, classId, status, teams, allAssignments]);

  return (
    <div>
      <PageHeader
        title="Directory"
        description={
          source === "firestore"
            ? `${members.length} volunteers · profile edits sync from Firebase.`
            : `${members.length} volunteers · search by name, email, phone, school, role, team, or class.`
        }
      />

      <div className="mb-4 space-y-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-tertiary" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Try a name, email, phone, school…"
            className="input-field !pl-9"
            autoComplete="off"
          />
        </div>

        <div className="grid gap-2 sm:grid-cols-4">
          <FilterSelect
            label="Status"
            value={status}
            onChange={(v) => setStatus(v as MemberStatus | "all")}
            options={[
              { value: "all", label: "All statuses" },
              { value: "active", label: "Active" },
              { value: "pending", label: "Pending" },
              { value: "inactive", label: "Inactive" },
              { value: "alumni", label: "Alumni" },
            ]}
          />
          <FilterSelect
            label="Role"
            value={roleId}
            onChange={setRoleId}
            options={[
              { value: "all", label: "All roles" },
              ...ALL_ROLES.map((r) => ({ value: r.id, label: r.name })),
            ]}
          />
          <FilterSelect
            label="Team"
            value={teamId}
            onChange={setTeamId}
            options={[
              { value: "all", label: "All teams" },
              ...teams.map((t) => ({ value: t.id, label: t.name })),
            ]}
          />
          <FilterSelect
            label="Class"
            value={classId}
            onChange={setClassId}
            options={[
              { value: "all", label: "All classes" },
              ...CLASSES.map((c) => ({
                value: c.id,
                label: `${c.sessionLabel} ${c.name}`,
              })),
            ]}
          />
        </div>

        <p className="text-xs text-tertiary">
          {filtered.length} member{filtered.length === 1 ? "" : "s"}
        </p>
      </div>

      <div className="flex flex-col gap-2">
        {filtered.map((m) => {
          const roles = getRolesByIds(m.roleIds).slice(0, 3);
          const memberTeams = teams.filter(
            (t) => t.memberIds.includes(m.id) || m.teamIds.includes(t.id)
          );
          return (
            <Link
              key={m.id}
              href={`/directory/${m.id}`}
              className="flex items-center gap-3 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] px-3 py-3 transition-colors hover:bg-[var(--surface-hover)] sm:px-4"
            >
              <Avatar name={displayName(m)} src={m.pfpUrl} size="md" />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-medium">{displayName(m)}</p>
                  <StatusDot status={m.status} label="" />
                </div>
                <p className="mt-0.5 truncate text-xs text-secondary">
                  {m.title ?? roles[0]?.name}
                  {m.school ? ` · ${m.school}` : ""}
                </p>
                <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-0.5 text-[11px] text-tertiary">
                  {m.personalEmail && (
                    <span className="hidden sm:inline">{m.personalEmail}</span>
                  )}
                  {m.schoolEmail && (
                    <span className="hidden md:inline">{m.schoolEmail}</span>
                  )}
                  {m.phone && <span>{formatPhone(m.phone)}</span>}
                  {memberTeams.length > 0 && (
                    <span className="hidden lg:inline">
                      {memberTeams.map((t) => t.name).join(" · ")}
                    </span>
                  )}
                </div>
                <div className="mt-1.5 flex flex-wrap gap-1">
                  {roles.map((r) => (
                    <RoleBadge key={r.id} role={r} compact />
                  ))}
                </div>
              </div>
              <span className="hidden text-xs text-tertiary sm:block">→</span>
            </Link>
          );
        })}
        {filtered.length === 0 && (
          <div className="rounded-[var(--radius-md)] border border-[var(--border)] px-4 py-12 text-center text-sm text-secondary">
            No members found
          </div>
        )}
      </div>
    </div>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-[11px] text-tertiary">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="input-field !h-9 appearance-none text-sm"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value} className="bg-[var(--surface)]">
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}
