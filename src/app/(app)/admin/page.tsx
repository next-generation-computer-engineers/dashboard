"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Users,
  Shield,
  UserCog,
  Calendar,
  AlertTriangle,
  Check,
} from "lucide-react";
import { useAuth } from "@/lib/auth/AuthProvider";
import { useMembers } from "@/lib/members/MembersProvider";
import { hasPermission, ALL_ROLES, displayName } from "@/lib/permissions";
import {
  CLASSES,
  CLASS_ASSIGNMENTS,
  TEAMS,
  membersForClass,
} from "@/data/seed";
import { PageHeader, SectionLabel } from "@/components/ui/PageHeader";
import { GlassCard } from "@/components/ui/GlassCard";
import { Avatar } from "@/components/ui/Avatar";
import { RoleBadge, StatusDot } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import type { Member, MemberStatus } from "@/types";

type AdminTab = "overview" | "members" | "roles" | "staffing" | "sessions";

type EditableFields = {
  fullName: string;
  preferredName: string;
  title: string;
  phone: string;
  school: string;
  grade: string;
  personalEmail: string;
  schoolEmail: string;
  cengEmail: string;
  bio: string;
  linkedIn: string;
  portfolio: string;
};

function fieldsFromMember(m: Member): EditableFields {
  return {
    fullName: m.fullName ?? "",
    preferredName: m.preferredName ?? "",
    title: m.title ?? "",
    phone: m.phone ?? "",
    school: m.school ?? "",
    grade: m.grade ?? "",
    personalEmail: m.personalEmail ?? "",
    schoolEmail: m.schoolEmail ?? "",
    cengEmail: m.cengEmail ?? "",
    bio: m.bio ?? "",
    linkedIn: m.linkedIn ?? "",
    portfolio: m.portfolio ?? "",
  };
}

export default function AdminPage() {
  const { member } = useAuth();
  const { members, adminPatchMember } = useMembers();
  const router = useRouter();
  const [tab, setTab] = useState<AdminTab>("overview");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [form, setForm] = useState<EditableFields | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const staffingGaps = useMemo(() => {
    return CLASSES.map((cls) => {
      const team = membersForClass(cls.id);
      const hasLead = team.some(
        (t) =>
          t.assignment.classRole === "lead_teacher" &&
          t.assignment.status === "confirmed"
      );
      const confirmed = team.filter((t) => t.assignment.status === "confirmed");
      return {
        cls,
        teamSize: team.length,
        confirmed: confirmed.length,
        hasLead,
        gap: !hasLead || confirmed.length < 2,
      };
    }).filter((g) => g.gap);
  }, []);

  const canAdmin = Boolean(
    member && hasPermission(member.roleIds, "admin:access")
  );

  const selected = members.find((m) => m.id === selectedId) ?? null;

  useEffect(() => {
    if (!selected) {
      setForm(null);
      return;
    }
    setForm(fieldsFromMember(selected));
    setError("");
    setSaved(false);
  }, [selected]);

  if (!member || !canAdmin) {
    return (
      <div className="py-20 text-center">
        <p className="font-display text-xl">Admin access required</p>
        <Button
          className="mt-4"
          variant="secondary"
          onClick={() => router.push("/dashboard")}
        >
          Back home
        </Button>
      </div>
    );
  }

  const pending = members.filter((m) => m.status === "pending");
  const active = members.filter((m) => m.status === "active");

  const filteredMembers = members.filter((m) => {
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    return (
      m.fullName.toLowerCase().includes(q) ||
      m.personalEmail.toLowerCase().includes(q) ||
      m.schoolEmail?.toLowerCase().includes(q) ||
      m.cengEmail?.toLowerCase().includes(q) ||
      m.title?.toLowerCase().includes(q)
    );
  });

  const dirty =
    selected && form
      ? JSON.stringify(form) !== JSON.stringify(fieldsFromMember(selected))
      : false;

  async function setStatus(id: string, status: MemberStatus) {
    setError("");
    try {
      await adminPatchMember(id, { status });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn’t update status");
    }
  }

  async function toggleRole(memberId: string, roleId: string) {
    const current = members.find((m) => m.id === memberId);
    if (!current) return;
    const has = current.roleIds.includes(roleId);
    const roleIds = has
      ? current.roleIds.filter((r) => r !== roleId)
      : [...current.roleIds, roleId];
    setError("");
    try {
      await adminPatchMember(memberId, { roleIds });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn’t update roles");
    }
  }

  async function saveInfo() {
    if (!selected || !form) return;
    if (!form.fullName.trim() || !form.personalEmail.trim()) {
      setError("Full name and personal email are required.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await adminPatchMember(selected.id, {
        fullName: form.fullName.trim(),
        preferredName: form.preferredName.trim() || undefined,
        title: form.title.trim() || undefined,
        phone: form.phone.trim() || undefined,
        school: form.school.trim() || undefined,
        grade: form.grade.trim() || undefined,
        personalEmail: form.personalEmail.trim().toLowerCase(),
        schoolEmail: form.schoolEmail.trim().toLowerCase() || undefined,
        cengEmail: form.cengEmail.trim().toLowerCase() || undefined,
        bio: form.bio.trim() || undefined,
        linkedIn: form.linkedIn.trim() || undefined,
        portfolio: form.portfolio.trim() || undefined,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn’t save profile");
    } finally {
      setSaving(false);
    }
  }

  const tabs: { id: AdminTab; label: string; icon: typeof Users }[] = [
    { id: "overview", label: "Overview", icon: Shield },
    { id: "members", label: "Members", icon: Users },
    { id: "roles", label: "Roles", icon: UserCog },
    { id: "staffing", label: "Staffing", icon: AlertTriangle },
    { id: "sessions", label: "Sessions", icon: Calendar },
  ];

  return (
    <div>
      <PageHeader
        eyebrow="Admin"
        title="Control center"
        description="Member management, roles, class staffing, and session setup."
      />

      <div className="mb-6 flex gap-1 overflow-x-auto rounded-2xl glass-inset p-1">
        {tabs.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                "inline-flex shrink-0 items-center gap-2 rounded-xl px-4 py-2 text-sm transition-colors",
                tab === t.id
                  ? "bg-[var(--accent-soft)] text-[var(--text-primary)]"
                  : "text-secondary hover:text-[var(--text-primary)]"
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              {t.label}
            </button>
          );
        })}
      </div>

      {tab === "overview" && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: "Active members", value: active.length },
            { label: "Pending approval", value: pending.length },
            { label: "Classes this session", value: CLASSES.length },
            { label: "Staffing gaps", value: staffingGaps.length },
          ].map((stat) => (
            <GlassCard key={stat.label} className="!p-5">
              <p className="text-[11px] uppercase tracking-wider text-tertiary">
                {stat.label}
              </p>
              <p className="mt-2 font-display text-3xl tracking-tight">
                {stat.value}
              </p>
            </GlassCard>
          ))}

          <div className="sm:col-span-2 lg:col-span-4 grid gap-4 lg:grid-cols-2">
            <div>
              <SectionLabel>Pending members</SectionLabel>
              <GlassCard padding={false} className="overflow-hidden">
                {pending.length === 0 ? (
                  <p className="px-5 py-8 text-center text-sm text-secondary">
                    No pending approvals
                  </p>
                ) : (
                  pending.map((m) => (
                    <div
                      key={m.id}
                      className="flex items-center gap-3 border-b border-[var(--border)] px-4 py-3 last:border-0"
                    >
                      <Avatar name={displayName(m)} src={m.pfpUrl} size="sm" />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium">{displayName(m)}</p>
                        <p className="text-[11px] text-tertiary">
                          {m.personalEmail}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="soft"
                        onClick={() => void setStatus(m.id, "active")}
                      >
                        Approve
                      </Button>
                    </div>
                  ))
                )}
              </GlassCard>
            </div>

            <div>
              <SectionLabel>Staffing alerts</SectionLabel>
              <GlassCard padding={false} className="overflow-hidden">
                {staffingGaps.length === 0 ? (
                  <p className="px-5 py-8 text-center text-sm text-secondary">
                    All classes adequately staffed
                  </p>
                ) : (
                  staffingGaps.map(({ cls, hasLead, confirmed }) => (
                    <Link
                      key={cls.id}
                      href={`/classes/${cls.id}`}
                      className="flex items-center justify-between border-b border-[var(--border)] px-4 py-3 last:border-0 hover:bg-[var(--surface-hover)]"
                    >
                      <div>
                        <p className="text-sm font-medium">{cls.name}</p>
                        <p className="text-[11px] text-tertiary">
                          {!hasLead ? "Missing lead teacher · " : ""}
                          {confirmed} confirmed staff
                        </p>
                      </div>
                      <AlertTriangle className="h-4 w-4 text-[var(--warning)]" />
                    </Link>
                  ))
                )}
              </GlassCard>
            </div>
          </div>
        </div>
      )}

      {tab === "members" && (
        <div className="grid gap-5 lg:grid-cols-12">
          <div className="space-y-3 lg:col-span-5">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search members…"
              className="input-field"
            />
            <GlassCard padding={false} className="max-h-[560px] overflow-y-auto">
              {filteredMembers.map((m) => (
                <button
                  key={m.id}
                  onClick={() => setSelectedId(m.id)}
                  className={cn(
                    "flex w-full items-center gap-3 border-b border-[var(--border)] px-4 py-3 text-left last:border-0 transition-colors",
                    selectedId === m.id
                      ? "bg-[var(--surface-hover)]"
                      : "hover:bg-[var(--surface-hover)]"
                  )}
                >
                  <Avatar name={displayName(m)} src={m.pfpUrl} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">
                      {displayName(m)}
                    </p>
                    <p className="truncate text-[11px] text-tertiary">
                      {m.title}
                    </p>
                  </div>
                  <StatusDot status={m.status} label="" />
                </button>
              ))}
            </GlassCard>
          </div>

          <div className="lg:col-span-7">
            {selected && form ? (
              <motion.div
                key={selected.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <GlassCard strong>
                  <div className="flex items-start gap-4">
                    <Avatar
                      name={displayName(selected)}
                      src={selected.pfpUrl}
                      size="lg"
                      className="!rounded-2xl"
                    />
                    <div className="min-w-0 flex-1">
                      <h3 className="font-display text-xl">
                        {displayName(selected)}
                      </h3>
                      <p className="text-sm text-secondary">{selected.title}</p>
                      <p className="mt-1 text-xs text-tertiary">
                        Edit any field below — changes save to the live roster.
                      </p>
                    </div>
                    <Link href={`/directory/${selected.id}`}>
                      <Button variant="ghost" size="sm">
                        Profile
                      </Button>
                    </Link>
                  </div>

                  <div className="mt-6">
                    <SectionLabel>Profile info</SectionLabel>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {(
                        [
                          ["fullName", "Full name", true],
                          ["preferredName", "Preferred name", false],
                          ["title", "Title", false],
                          ["phone", "Phone", false],
                          ["school", "School", false],
                          ["grade", "Grade", false],
                          ["personalEmail", "Personal email", true],
                          ["schoolEmail", "School email", false],
                          ["cengEmail", "CENG email", false],
                          ["linkedIn", "LinkedIn", false],
                          ["portfolio", "Portfolio", false],
                        ] as const
                      ).map(([key, label, required]) => (
                        <label key={key} className="block sm:col-span-1">
                          <span className="mb-1 block text-[11px] text-tertiary">
                            {label}
                          </span>
                          <input
                            required={required}
                            value={form[key]}
                            onChange={(e) => {
                              setForm((f) =>
                                f ? { ...f, [key]: e.target.value } : f
                              );
                              setSaved(false);
                            }}
                            className="input-field"
                          />
                        </label>
                      ))}
                      <label className="block sm:col-span-2">
                        <span className="mb-1 block text-[11px] text-tertiary">
                          Bio
                        </span>
                        <textarea
                          value={form.bio}
                          onChange={(e) => {
                            setForm((f) =>
                              f ? { ...f, bio: e.target.value } : f
                            );
                            setSaved(false);
                          }}
                          className="input-field !h-auto !py-2.5 resize-none"
                          rows={3}
                        />
                      </label>
                    </div>
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <Button
                        type="button"
                        disabled={saving || !dirty}
                        onClick={() => void saveInfo()}
                      >
                        {saving ? "Saving…" : "Save info"}
                      </Button>
                      {saved && (
                        <span className="text-xs text-[var(--accent)]">
                          Saved
                        </span>
                      )}
                      {error && (
                        <span className="text-xs text-red-500">{error}</span>
                      )}
                    </div>
                  </div>

                  <div className="mt-6">
                    <SectionLabel>Status</SectionLabel>
                    <div className="flex flex-wrap gap-2">
                      {(
                        [
                          "active",
                          "pending",
                          "inactive",
                          "alumni",
                        ] as MemberStatus[]
                      ).map((s) => (
                        <button
                          key={s}
                          onClick={() => void setStatus(selected.id, s)}
                          className={cn(
                            "rounded-full border px-3 py-1 text-xs capitalize",
                            selected.status === s
                              ? "border-[rgba(201,169,110,0.4)] bg-[var(--accent-soft)] text-[var(--accent)]"
                              : "border-white/[0.08] text-secondary"
                          )}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="mt-6">
                    <SectionLabel>Organization roles</SectionLabel>
                    <div className="flex flex-wrap gap-2">
                      {ALL_ROLES.map((role) => {
                        const on = selected.roleIds.includes(role.id);
                        return (
                          <button
                            key={role.id}
                            onClick={() => void toggleRole(selected.id, role.id)}
                            className={cn(
                              "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] transition-colors",
                              on
                                ? "border-transparent"
                                : "border-white/[0.08] text-tertiary hover:text-secondary"
                            )}
                            style={
                              on
                                ? {
                                    color: role.color,
                                    backgroundColor: `${role.color}18`,
                                    borderColor: `${role.color}40`,
                                  }
                                : undefined
                            }
                          >
                            {on && <Check className="h-3 w-3" />}
                            {role.name}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="mt-6">
                    <SectionLabel>Class assignments</SectionLabel>
                    <div className="space-y-2">
                      {CLASS_ASSIGNMENTS.filter(
                        (a) => a.memberId === selected.id
                      ).map((a) => {
                        const cls = CLASSES.find((c) => c.id === a.classId);
                        return (
                          <div
                            key={a.id}
                            className="glass-inset flex items-center justify-between rounded-xl px-3 py-2.5"
                          >
                            <div>
                              <p className="text-sm">{cls?.name}</p>
                              <p className="text-[11px] capitalize text-tertiary">
                                {a.classRole.replace(/_/g, " ")} · {a.status}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                      {CLASS_ASSIGNMENTS.filter(
                        (a) => a.memberId === selected.id
                      ).length === 0 && (
                        <p className="text-sm text-secondary">
                          No class assignments
                        </p>
                      )}
                    </div>
                  </div>
                </GlassCard>
              </motion.div>
            ) : (
              <GlassCard className="flex min-h-[320px] items-center justify-center">
                <p className="text-sm text-secondary">
                  Select a member to manage
                </p>
              </GlassCard>
            )}
          </div>
        </div>
      )}

      {tab === "roles" && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {ALL_ROLES.map((role) => {
            const count = members.filter((m) =>
              m.roleIds.includes(role.id)
            ).length;
            return (
              <GlassCard key={role.id} className="!p-5">
                <div className="flex items-start justify-between gap-2">
                  <RoleBadge role={role} />
                  <span className="text-[11px] text-tertiary">
                    {count} members
                  </span>
                </div>
                <p className="mt-3 text-sm font-medium">{role.name}</p>
                <p className="mt-1 text-xs leading-relaxed text-secondary">
                  {role.description}
                </p>
                <p className="mt-3 text-[10px] uppercase tracking-wider text-tertiary">
                  {role.scope} · {role.isSystem ? "system" : "custom"} ·{" "}
                  {role.permissions.length} permissions
                </p>
              </GlassCard>
            );
          })}
        </div>
      )}

      {tab === "staffing" && (
        <div className="space-y-3">
          {CLASSES.map((cls) => {
            const team = membersForClass(cls.id);
            return (
              <GlassCard key={cls.id}>
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h3 className="font-display text-lg">{cls.name}</h3>
                    <p className="mt-1 text-xs text-secondary">
                      {cls.dayOfWeek} · {cls.sessionLabel} · {team.length}{" "}
                      assigned
                    </p>
                  </div>
                  <Link href={`/classes/${cls.id}`}>
                    <Button variant="ghost" size="sm">
                      Open class
                    </Button>
                  </Link>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  {team.map(({ member: m, assignment }) => (
                    <div
                      key={m.id}
                      className="glass-inset inline-flex items-center gap-2 rounded-full py-1 pl-1 pr-3"
                    >
                      <Avatar name={displayName(m)} src={m.pfpUrl} size="sm" />
                      <span className="text-xs">
                        {displayName(m)} ·{" "}
                        {assignment.classRole.replace(/_/g, " ")}
                      </span>
                    </div>
                  ))}
                </div>
              </GlassCard>
            );
          })}
        </div>
      )}

      {tab === "sessions" && (
        <GlassCard>
          <p className="text-sm text-secondary">
            Jan 12 – May 30, 2026 · {CLASSES.length} classes ·{" "}
            {CLASS_ASSIGNMENTS.length} assignments · {TEAMS.length} teams
          </p>
        </GlassCard>
      )}
    </div>
  );
}
