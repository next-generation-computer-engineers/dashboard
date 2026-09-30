"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Camera } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/lib/auth/AuthProvider";
import { TEAMS, CLASSES, assignmentsForMember } from "@/data/seed";
import { uploadProfilePhoto } from "@/lib/firebase/storage";
import { displayName, getRolesByIds } from "@/lib/permissions";
import { formatPhone } from "@/lib/utils";
import { PageHeader, SectionLabel } from "@/components/ui/PageHeader";
import { GlassCard } from "@/components/ui/GlassCard";
import { Avatar } from "@/components/ui/Avatar";
import { RoleBadge, StatusDot } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

export default function ProfilePage() {
  const { member, user, firebaseReady, updateOwnProfile } = useAuth();
  const fileRef = useRef<HTMLInputElement>(null);

  const [editing, setEditing] = useState(false);
  const [preferredName, setPreferredName] = useState("");
  const [bio, setBio] = useState("");
  const [phone, setPhone] = useState("");
  const [linkedIn, setLinkedIn] = useState("");
  const [portfolio, setPortfolio] = useState("");
  const [previewUrl, setPreviewUrl] = useState<string | undefined>();
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  // Hydrate form only when not editing — prevents roster refreshes from wiping keystrokes
  useEffect(() => {
    if (!member || editing) return;
    setPreferredName(member.preferredName ?? "");
    setBio(member.bio ?? "");
    setPhone(member.phone ?? "");
    setLinkedIn(member.linkedIn ?? "");
    setPortfolio(member.portfolio ?? "");
    setPreviewUrl(member.pfpUrl);
  }, [member, editing]);

  if (!member) return null;

  const profile = member;
  const name = displayName(profile);
  const roles = getRolesByIds(profile.roleIds);
  const teams = TEAMS.filter((t) => profile.teamIds.includes(t.id));
  const assignments = assignmentsForMember(profile.id);
  const photoSrc = previewUrl || profile.pfpUrl;

  function startEditing() {
    setPreferredName(profile.preferredName ?? "");
    setBio(profile.bio ?? "");
    setPhone(profile.phone ?? "");
    setLinkedIn(profile.linkedIn ?? "");
    setPortfolio(profile.portfolio ?? "");
    setPreviewUrl(profile.pfpUrl);
    setError("");
    setEditing(true);
  }

  function cancel() {
    setEditing(false);
    setError("");
    setPreferredName(profile.preferredName ?? "");
    setBio(profile.bio ?? "");
    setPhone(profile.phone ?? "");
    setLinkedIn(profile.linkedIn ?? "");
    setPortfolio(profile.portfolio ?? "");
    setPreviewUrl(profile.pfpUrl);
  }

  async function onPickPhoto(file: File | undefined) {
    if (!file) return;
    setError("");
    setUploading(true);
    try {
      let url: string;
      if (firebaseReady && user) {
        url = await uploadProfilePhoto(user.uid, file);
      } else {
        url = await fileToDataUrl(file);
      }
      setPreviewUrl(url);
      await updateOwnProfile({ pfpUrl: url });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Photo upload failed");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function save() {
    setError("");
    setSaving(true);
    try {
      await updateOwnProfile({
        preferredName: preferredName.trim() || undefined,
        bio: bio.trim() || undefined,
        phone: phone.trim() || undefined,
        linkedIn: linkedIn.trim() || undefined,
        portfolio: portfolio.trim() || undefined,
        ...(previewUrl ? { pfpUrl: previewUrl } : {}),
      });
      setEditing(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn’t save profile");
    } finally {
      setSaving(false);
    }
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
              <Button variant="ghost" onClick={cancel} disabled={saving}>
                Cancel
              </Button>
              <Button onClick={save} loading={saving}>
                Save
              </Button>
            </div>
          ) : (
            <Button variant="secondary" onClick={startEditing}>
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
          Profile updated.
        </motion.p>
      )}
      {error && <p className="mb-4 text-sm text-[var(--danger)]">{error}</p>}

      <div className="grid gap-6 lg:grid-cols-12">
        <div className="lg:col-span-4">
          <GlassCard strong className="text-center">
            <div className="relative mx-auto inline-block">
              <Avatar
                name={name}
                src={photoSrc}
                size="xl"
                className="mx-auto !h-28 !w-28 !rounded-[22px]"
              />
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                className="absolute -bottom-1 -right-1 flex h-9 w-9 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface)] text-secondary shadow-sm transition-colors hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)] disabled:opacity-60"
                aria-label="Upload profile photo"
              >
                <Camera className="h-4 w-4" />
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="hidden"
                onChange={(e) => void onPickPhoto(e.target.files?.[0])}
              />
            </div>
            <p className="mt-3 text-[11px] text-tertiary">
              {uploading ? "Uploading…" : "Click the camera to change photo"}
            </p>
            <h2 className="mt-4 font-display text-2xl tracking-tight">{name}</h2>
            <p className="mt-1 text-sm text-secondary">{profile.title}</p>
            <div className="mt-3 flex justify-center">
              <StatusDot status={profile.status} />
            </div>
            <div className="mt-4 flex flex-wrap justify-center gap-1.5">
              {roles.map((r) => (
                <RoleBadge key={r.id} role={r} compact />
              ))}
            </div>
            <Link href={`/directory/${profile.id}`}>
              <Button variant="soft" size="sm" className="mt-6">
                View public profile
              </Button>
            </Link>
          </GlassCard>
        </div>

        <div className="space-y-5 lg:col-span-8">
          <div>
            <SectionLabel>About</SectionLabel>
            <GlassCard>
              {editing ? (
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={4}
                  className="input-field !h-auto !py-3 resize-none"
                  placeholder="Short bio — what you teach, interests, fun fact…"
                />
              ) : (
                <p className="text-sm leading-relaxed text-secondary">
                  {profile.bio || "No bio yet. Hit Edit profile to add one."}
                </p>
              )}
            </GlassCard>
          </div>

          <div>
            <SectionLabel>Contact details</SectionLabel>
            <GlassCard className="space-y-4">
              <Field label="Full name" value={profile.fullName} />
              {editing ? (
                <label className="block">
                  <span className="mb-1.5 block text-[10px] uppercase tracking-wider text-tertiary">
                    Preferred name
                  </span>
                  <input
                    value={preferredName}
                    onChange={(e) => setPreferredName(e.target.value)}
                    className="input-field"
                    placeholder="What people call you"
                  />
                </label>
              ) : (
                <Field
                  label="Preferred name"
                  value={profile.preferredName ?? "—"}
                />
              )}
              <Field label="Home email" value={profile.personalEmail} />
              <Field label="School email" value={profile.schoolEmail ?? "—"} />
              {profile.cengEmail && (
                <Field label="CENG email" value={profile.cengEmail} />
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
                    placeholder="(555) 555-5555"
                  />
                </label>
              ) : (
                <Field label="Phone" value={formatPhone(profile.phone)} />
              )}
              <Field label="School" value={profile.school ?? "—"} />
              {profile.grade && <Field label="Grade" value={profile.grade} />}
            </GlassCard>
          </div>

          <div>
            <SectionLabel>Links</SectionLabel>
            <GlassCard className="space-y-4">
              {editing ? (
                <>
                  <label className="block">
                    <span className="mb-1.5 block text-[10px] uppercase tracking-wider text-tertiary">
                      LinkedIn
                    </span>
                    <input
                      value={linkedIn}
                      onChange={(e) => setLinkedIn(e.target.value)}
                      className="input-field"
                      placeholder="https://linkedin.com/in/…"
                    />
                  </label>
                  <label className="block">
                    <span className="mb-1.5 block text-[10px] uppercase tracking-wider text-tertiary">
                      Portfolio / website
                    </span>
                    <input
                      value={portfolio}
                      onChange={(e) => setPortfolio(e.target.value)}
                      className="input-field"
                      placeholder="https://…"
                    />
                  </label>
                </>
              ) : (
                <>
                  <Field label="LinkedIn" value={profile.linkedIn ?? "—"} />
                  <Field label="Portfolio" value={profile.portfolio ?? "—"} />
                </>
              )}
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
                    <GlassCard hover className="h-full !p-4">
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
      <span className="shrink-0 text-[10px] uppercase tracking-wider text-tertiary sm:w-36">
        {label}
      </span>
      <span className="break-all text-sm text-secondary sm:text-right">
        {value}
      </span>
    </div>
  );
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Couldn’t read image file"));
    reader.readAsDataURL(file);
  });
}
