"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Mail,
  Phone,
  School,
  ExternalLink,
  Copy,
  Check,
} from "lucide-react";
import { useState } from "react";
import { CLASSES, assignmentsForMember } from "@/data/seed";
import { useMembers } from "@/lib/members/MembersProvider";
import { useTeamsStore } from "@/lib/teams/store";
import { displayName, getRolesByIds } from "@/lib/permissions";
import { formatPhone } from "@/lib/utils";
import { Avatar } from "@/components/ui/Avatar";
import { RoleBadge, StatusDot } from "@/components/ui/Badge";
import { GlassCard } from "@/components/ui/GlassCard";
import { SectionLabel } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";

export default function MemberProfilePage() {
  const params = useParams<{ id: string }>();
  const { getById } = useMembers();
  const allTeams = useTeamsStore((s) => s.teams);
  const member = getById(params.id);
  const [copied, setCopied] = useState<string | null>(null);

  if (!member) {
    return (
      <div className="py-16 text-center">
        <p className="text-lg">Member not found</p>
        <Link
          href="/directory"
          className="mt-3 inline-block text-sm text-secondary underline"
        >
          Back to directory
        </Link>
      </div>
    );
  }

  const name = displayName(member);
  const roles = getRolesByIds(member.roleIds);
  const teams = allTeams.filter(
    (t) => t.memberIds.includes(member.id) || member.teamIds.includes(t.id)
  );
  const assignments = assignmentsForMember(member.id).map((a) => ({
    ...a,
    cls: CLASSES.find((c) => c.id === a.classId),
  }));

  async function copy(value: string, key: string) {
    await navigator.clipboard.writeText(value);
    setCopied(key);
    setTimeout(() => setCopied(null), 1500);
  }

  return (
    <div>
      <Link
        href="/directory"
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-secondary hover:text-[var(--text-primary)]"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Directory
      </Link>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      >
        <GlassCard strong className="relative overflow-hidden !p-0">
          <div
            className="h-28 sm:h-32"
            style={{
              background:
                "linear-gradient(135deg, rgba(30,86,201,0.28) 0%, rgba(240,160,30,0.18) 55%, transparent 100%)",
            }}
          />
          <div className="relative px-5 pb-6 sm:px-7 sm:pb-7">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:gap-5">
              <Avatar
                name={name}
                src={member.pfpUrl}
                size="xl"
                className="-mt-12 !h-24 !w-24 !rounded-[20px] shadow-lg ring-4 ring-[var(--surface)] sm:-mt-14 sm:!h-28 sm:!w-28"
              />
              <div className="min-w-0 flex-1 sm:pb-1">
                <div className="flex flex-wrap items-center gap-2.5">
                  <h1 className="text-2xl font-medium tracking-tight sm:text-3xl">
                    {name}
                  </h1>
                  <StatusDot status={member.status} label={member.status} />
                </div>
                {member.preferredName && (
                  <p className="mt-1 text-sm text-tertiary">{member.fullName}</p>
                )}
                <p className="mt-3 text-sm leading-relaxed text-secondary">
                  {member.title}
                  {member.school ? ` · ${member.school}` : ""}
                </p>
                <div className="mt-3.5 flex flex-wrap gap-1.5">
                  {roles.map((r) => (
                    <RoleBadge key={r.id} role={r} />
                  ))}
                </div>
              </div>
            </div>

            {member.bio && (
              <p className="mt-6 max-w-2xl text-[15px] leading-relaxed text-secondary">
                {member.bio}
              </p>
            )}
          </div>
        </GlassCard>

        <div className="mt-6 grid gap-5 lg:grid-cols-12">
          <div className="space-y-5 lg:col-span-5">
            <div>
              <SectionLabel>Contact</SectionLabel>
              <GlassCard className="!p-0 overflow-hidden">
                <ContactRow
                  icon={<Mail className="h-4 w-4" />}
                  label="Home email"
                  value={member.personalEmail}
                  onCopy={() => copy(member.personalEmail, "personal")}
                  copied={copied === "personal"}
                />
                {member.schoolEmail && (
                  <ContactRow
                    icon={<Mail className="h-4 w-4" />}
                    label="School email"
                    value={member.schoolEmail}
                    onCopy={() =>
                      member.schoolEmail && copy(member.schoolEmail, "school")
                    }
                    copied={copied === "school"}
                  />
                )}
                {member.cengEmail && (
                  <ContactRow
                    icon={<Mail className="h-4 w-4" />}
                    label="CENG email"
                    value={member.cengEmail}
                    onCopy={() =>
                      member.cengEmail && copy(member.cengEmail, "ceng")
                    }
                    copied={copied === "ceng"}
                  />
                )}
                <ContactRow
                  icon={<Phone className="h-4 w-4" />}
                  label="Phone"
                  value={formatPhone(member.phone)}
                  onCopy={() => member.phone && copy(member.phone, "phone")}
                  copied={copied === "phone"}
                />
                {member.school && (
                  <ContactRow
                    icon={<School className="h-4 w-4" />}
                    label="School"
                    value={member.school}
                  />
                )}
              </GlassCard>
            </div>

            {(member.linkedIn || member.portfolio) && (
              <div>
                <SectionLabel>Links</SectionLabel>
                <div className="flex flex-wrap gap-2">
                  {member.linkedIn && (
                    <a href={member.linkedIn} target="_blank" rel="noreferrer">
                      <Button variant="secondary" size="sm">
                        <ExternalLink className="h-3.5 w-3.5" /> LinkedIn
                      </Button>
                    </a>
                  )}
                  {member.portfolio && (
                    <a href={member.portfolio} target="_blank" rel="noreferrer">
                      <Button variant="secondary" size="sm">
                        <ExternalLink className="h-3.5 w-3.5" /> Portfolio
                      </Button>
                    </a>
                  )}
                </div>
              </div>
            )}

            <div>
              <SectionLabel>Status</SectionLabel>
              <GlassCard className="!p-4 space-y-3">
                <Row label="Member status" value={member.status} />
                <Row
                  label="Onboarding"
                  value={member.onboardingStatus.replace(/_/g, " ")}
                />
              </GlassCard>
            </div>
          </div>

          <div className="space-y-5 lg:col-span-7">
            <div>
              <SectionLabel>Class assignments</SectionLabel>
              {assignments.length === 0 ? (
                <GlassCard>
                  <p className="text-sm text-secondary">No class assignments.</p>
                </GlassCard>
              ) : (
                <div className="flex flex-col gap-2">
                  {assignments.map((a) =>
                    a.cls ? (
                      <Link key={a.id} href={`/classes/${a.cls.id}`}>
                        <div className="flex items-center justify-between rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] px-4 py-3.5 transition-colors hover:bg-[var(--surface-hover)]">
                          <div>
                            <p className="text-sm font-medium">{a.cls.name}</p>
                            <p className="mt-1 text-[11px] capitalize text-secondary">
                              {a.classRole.replace(/_/g, " ")} · {a.status} ·{" "}
                              {a.cls.sessionLabel} · {a.cls.dayOfWeek}
                            </p>
                          </div>
                          <span className="text-xs text-tertiary">→</span>
                        </div>
                      </Link>
                    ) : null
                  )}
                </div>
              )}
            </div>

            <div>
              <SectionLabel>Teams</SectionLabel>
              {teams.length === 0 ? (
                <GlassCard>
                  <p className="text-sm text-secondary">No team memberships.</p>
                </GlassCard>
              ) : (
                <div className="grid gap-2 sm:grid-cols-2">
                  {teams.map((t) => (
                    <Link key={t.id} href={`/teams/${t.id}`}>
                      <div className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] p-4 transition-colors hover:bg-[var(--surface-hover)]">
                        <div className="flex items-center gap-2">
                          <span
                            className="h-2 w-2 rounded-full"
                            style={{ background: t.color }}
                          />
                          <p className="text-sm font-medium">{t.name}</p>
                        </div>
                        <p className="mt-1.5 line-clamp-2 text-[11px] text-tertiary">
                          {t.description}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function ContactRow({
  icon,
  label,
  value,
  onCopy,
  copied,
}: {
  icon: React.ReactNode;
  label: string;
  value?: string;
  onCopy?: () => void;
  copied?: boolean;
}) {
  if (!value) return null;
  return (
    <div className="flex items-center gap-3 border-b border-[var(--border)] px-4 py-3.5 last:border-0">
      <span className="text-tertiary">{icon}</span>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] uppercase tracking-wider text-tertiary">
          {label}
        </p>
        <p className="truncate text-sm">{value}</p>
      </div>
      {onCopy && (
        <button
          onClick={onCopy}
          className="rounded-lg p-1.5 text-tertiary hover:bg-[var(--surface-hover)] hover:text-secondary"
          aria-label={`Copy ${label}`}
        >
          {copied ? (
            <Check className="h-3.5 w-3.5 text-[var(--success)]" />
          ) : (
            <Copy className="h-3.5 w-3.5" />
          )}
        </button>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 text-sm">
      <span className="text-tertiary">{label}</span>
      <span className="capitalize text-secondary">{value}</span>
    </div>
  );
}
