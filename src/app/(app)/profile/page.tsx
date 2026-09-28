"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/lib/auth/AuthProvider";
import {
  TEAMS,
  CLASSES,
  assignmentsForMember,
} from "@/data/seed";
import { displayName, getRolesByIds } from "@/lib/permissions";
import { formatPhone } from "@/lib/utils";
import { PageHeader, SectionLabel } from "@/components/ui/PageHeader";
import { GlassCard } from "@/components/ui/GlassCard";
import { Avatar } from "@/components/ui/Avatar";
import { RoleBadge, StatusDot } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import Link from "next/link";

export default function ProfilePage() {
  const { member, isDemo } = useAuth();
  const [editing, setEditing] = useState(false);
  const [bio, setBio] = useState(member?.bio ?? "");
  const [phone, setPhone] = useState(member?.phone ?? "");
  const [saved, setSaved] = useState(false);

  if (!member) return null;

  const name = displayName(member);
  const roles = getRolesByIds(member.roleIds);
  const teams = TEAMS.filter((t) => member.teamIds.includes(t.id));
  const assignments = assignmentsForMember(member.id);

  function save() {
    // Demo: local-only feedback; Firestore write when configured
    setEditing(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div>
      <PageHeader
        eyebrow="You"
        title="Your profile"
        description="How you appear in the CENG directory. Admins manage roles and assignments."
        actions={
          editing ? (
            <div className="flex gap-2">
              <Button variant="ghost" onClick={() => setEditing(false)}>
                Cancel
              </Button>
              <Button onClick={save}>Save</Button>
            </div>
          ) : (
            <Button variant="secondary" onClick={() => setEditing(true)}>
              Edit profile
            </Button>
          )
        }
      />

      {saved && (
        <motion.p
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 text-sm text-[var(--success)]"
        >
          Profile updated{isDemo ? " (demo)" : ""}.
        </motion.p>
      )}

      <div className="grid gap-6 lg:grid-cols-12">
        <div className="lg:col-span-4">
          <GlassCard strong className="text-center">
            <Avatar
              name={name}
              src={member.pfpUrl}
              size="xl"
              className="mx-auto !rounded-[22px] !h-28 !w-28"
            />
            <h2 className="mt-5 font-display text-2xl tracking-tight">{name}</h2>
            <p className="mt-1 text-sm text-secondary">{member.title}</p>
            <div className="mt-3 flex justify-center">
              <StatusDot status={member.status} />
            </div>
            <div className="mt-4 flex flex-wrap justify-center gap-1.5">
              {roles.map((r) => (
                <RoleBadge key={r.id} role={r} compact />
              ))}
            </div>
            <Link href={`/directory/${member.id}`}>
              <Button variant="soft" size="sm" className="mt-6">
                View public profile
              </Button>
            </Link>
          </GlassCard>
        </div>

        <div className="lg:col-span-8 space-y-5">
          <div>
            <SectionLabel>About</SectionLabel>
            <GlassCard>
              {editing ? (
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={4}
                  className="input-field !h-auto !py-3 resize-none"
                  placeholder="Short bio…"
                />
              ) : (
                <p className="text-sm leading-relaxed text-secondary">
                  {bio || member.bio || "No bio yet."}
                </p>
              )}
            </GlassCard>
          </div>

          <div>
            <SectionLabel>Contact details</SectionLabel>
            <GlassCard className="space-y-4">
              <Field label="Full name" value={member.fullName} />
              <Field label="Preferred name" value={member.preferredName ?? "—"} />
              <Field label="Home email" value={member.personalEmail} />
              <Field label="School email" value={member.schoolEmail ?? "—"} />
              {member.cengEmail && (
                <Field label="CENG email" value={member.cengEmail} />
              )}
              {editing ? (
                <label className="block">
                  <span className="mb-1.5 block text-[10px] uppercase tracking-wider text-tertiary">
                    Phone
                  </span>
                  <input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="input-field"
                  />
                </label>
              ) : (
                <Field label="Phone" value={formatPhone(phone || member.phone)} />
              )}
              <Field label="School" value={member.school ?? "—"} />
              {member.grade && <Field label="Grade" value={member.grade} />}
            </GlassCard>
          </div>

          <div>
            <SectionLabel>Classes & teams</SectionLabel>
            <div className="grid gap-3 sm:grid-cols-2">
              {assignments.map((a) => {
                const cls = CLASSES.find((c) => c.id === a.classId);
                if (!cls) return null;
                return (
                  <Link key={a.id} href={`/classes/${cls.id}`}>
                    <GlassCard hover className="!p-4 h-full">
                      <p className="text-sm font-medium">{cls.name}</p>
                      <p className="mt-1 text-[11px] capitalize text-secondary">
                        {a.classRole.replace(/_/g, " ")} · {a.status}
                      </p>
                    </GlassCard>
                  </Link>
                );
              })}
              {teams.map((t) => (
                <GlassCard key={t.id} className="!p-4">
                  <div className="flex items-center gap-2">
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{ background: t.color }}
                    />
                    <p className="text-sm font-medium">{t.name}</p>
                  </div>
                </GlassCard>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4">
      <span className="text-[10px] uppercase tracking-wider text-tertiary sm:w-36 shrink-0">
        {label}
      </span>
      <span className="text-sm text-secondary sm:text-right">{value}</span>
    </div>
  );
}
