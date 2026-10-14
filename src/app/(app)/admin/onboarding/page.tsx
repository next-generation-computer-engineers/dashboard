"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Check,
  ExternalLink,
  Mail,
  Trash2,
  UserPlus,
  FileSignature,
  Ban,
  RotateCcw,
  Paperclip,
} from "lucide-react";
import { useAuth } from "@/lib/auth/AuthProvider";
import { useMembers } from "@/lib/members/MembersProvider";
import { hasPermission, displayName } from "@/lib/permissions";
import { PageHeader, SectionLabel } from "@/components/ui/PageHeader";
import { GlassCard } from "@/components/ui/GlassCard";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { StatusDot } from "@/components/ui/Badge";
import { onboardingFetch } from "@/lib/onboarding/client";
import { onboardingBadgeLabel } from "@/lib/onboarding/gate";
import { cn } from "@/lib/utils";
import type { Member } from "@/types";

type QueueTab = "review" | "waiting" | "active" | "all";

type InviteForm = {
  fullName: string;
  personalEmail: string;
  schoolEmail: string;
  phone: string;
  school: string;
  grade: string;
  notes: string;
  sendEmail: boolean;
};

const EMPTY_INVITE: InviteForm = {
  fullName: "",
  personalEmail: "",
  schoolEmail: "",
  phone: "",
  school: "",
  grade: "",
  notes: "",
  sendEmail: true,
};

function statusLabel(m: Member) {
  return onboardingBadgeLabel(m) ?? "Ready";
}

export default function AdminOnboardingPage() {
  const { member } = useAuth();
  const { members, refresh } = useMembers();
  const router = useRouter();

  const [tab, setTab] = useState<QueueTab>("review");
  const [query, setQuery] = useState("");
  const [invite, setInvite] = useState<InviteForm>(EMPTY_INVITE);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [inviting, setInviting] = useState(false);
  const [flash, setFlash] = useState("");
  const [error, setError] = useState("");

  const canInvite = member
    ? hasPermission(member.roleIds, "onboarding:invite")
    : false;
  const canReview = member
    ? hasPermission(member.roleIds, "onboarding:review")
    : false;
  const canRead = member
    ? hasPermission(member.roleIds, "onboarding:read") || canInvite || canReview
    : false;
  const isAdmin = member?.roleIds.includes("role_admin") ?? false;

  useEffect(() => {
    if (
      member &&
      !canRead &&
      !hasPermission(member.roleIds, "admin:access")
    ) {
      router.replace("/dashboard");
    }
  }, [member, canRead, router]);

  const reviewQueue = useMemo(
    () =>
      members.filter((m) => m.onboardingStatus === "needs_review").sort(byName),
    [members]
  );
  const waitingQueue = useMemo(
    () =>
      members
        .filter(
          (m) =>
            m.onboardingStatus === "in_progress" ||
            m.onboardingStatus === "not_started"
        )
        .sort(byName),
    [members]
  );
  const activeOnboarded = useMemo(
    () =>
      members
        .filter(
          (m) => m.onboardingStatus === "complete" && m.status === "active"
        )
        .sort(byName),
    [members]
  );

  const list = useMemo(() => {
    let rows: Member[] =
      tab === "review"
        ? reviewQueue
        : tab === "waiting"
          ? waitingQueue
          : tab === "active"
            ? activeOnboarded
            : [...members].sort(byName);

    const q = query.trim().toLowerCase();
    if (q) {
      rows = rows.filter(
        (m) =>
          m.fullName.toLowerCase().includes(q) ||
          m.personalEmail.toLowerCase().includes(q) ||
          (m.schoolEmail ?? "").toLowerCase().includes(q) ||
          (m.onboarding?.submitterEmail ?? "").toLowerCase().includes(q)
      );
    }
    return rows;
  }, [tab, reviewQueue, waitingQueue, activeOnboarded, members, query]);

  function setMsg(ok: string) {
    setFlash(ok);
    setError("");
    setTimeout(() => setFlash(""), 4000);
  }

  async function runAction(
    id: string,
    fn: () => Promise<{ message?: string }>
  ) {
    setBusyId(id);
    setError("");
    try {
      const res = await fn();
      await refresh();
      setMsg(res.message || "Done.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Action failed");
    } finally {
      setBusyId(null);
    }
  }

  async function submitInvite(e: React.FormEvent) {
    e.preventDefault();
    if (!canInvite) return;
    setInviting(true);
    setError("");
    try {
      const res = await onboardingFetch<{
        message?: string;
        emailSent?: boolean;
        needsMailtoFallback?: boolean;
        signingUrl?: string;
        submitterEmail?: string;
      }>("/api/onboarding/invite", {
        method: "POST",
        json: {
          fullName: invite.fullName,
          personalEmail: invite.personalEmail,
          schoolEmail: invite.schoolEmail || undefined,
          phone: invite.phone || undefined,
          school: invite.school || undefined,
          grade: invite.grade || undefined,
          notes: invite.notes || undefined,
          sendEmail: invite.sendEmail,
          appOrigin: window.location.origin,
        },
      });
      await refresh();
      setInvite(EMPTY_INVITE);
      setMsg(res.message || "Invite created.");
      if (res.needsMailtoFallback && res.signingUrl && res.submitterEmail) {
        const subject = encodeURIComponent("CENG volunteer waiver");
        const body = encodeURIComponent(
          `Hi,\n\nPlease sign our volunteer liability waiver:\n${res.signingUrl}\n\nThen create your account with this email and open ${window.location.origin}/onboarding.\n`
        );
        window.open(
          `mailto:${res.submitterEmail}?subject=${subject}&body=${body}`,
          "_blank"
        );
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invite failed");
    } finally {
      setInviting(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Admin"
        title="Volunteer onboarding"
        description="Invite volunteers, send the waiver, review signed forms, approve access — or revoke / delete test accounts."
      />

      {flash && (
        <p className="rounded-[var(--radius-sm)] border border-[var(--success-soft)] bg-[var(--success-soft)] px-3 py-2 text-[13px] text-[var(--success)]">
          {flash}
        </p>
      )}
      {error && (
        <p className="rounded-[var(--radius-sm)] border border-[var(--danger-soft)] bg-[var(--danger-soft)] px-3 py-2 text-[13px] text-[var(--danger)]">
          {error}
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: "Needs review", value: reviewQueue.length },
          { label: "Waiting on signature", value: waitingQueue.length },
          { label: "Active volunteers", value: activeOnboarded.length },
        ].map((s) => (
          <GlassCard key={s.label} className="!p-4">
            <p className="text-[11px] uppercase tracking-wider text-tertiary">
              {s.label}
            </p>
            <p className="mt-1 font-display text-2xl tracking-tight">
              {s.value}
            </p>
          </GlassCard>
        ))}
      </div>

      {canInvite && (
        <div>
          <SectionLabel>Invite volunteer</SectionLabel>
          <GlassCard>
            <form onSubmit={(e) => void submitInvite(e)} className="space-y-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <Field
                  label="Full name"
                  required
                  value={invite.fullName}
                  onChange={(v) => setInvite((f) => ({ ...f, fullName: v }))}
                />
                <Field
                  label="Personal email"
                  type="email"
                  required
                  value={invite.personalEmail}
                  onChange={(v) =>
                    setInvite((f) => ({ ...f, personalEmail: v }))
                  }
                />
                <Field
                  label="School email (optional)"
                  type="email"
                  value={invite.schoolEmail}
                  onChange={(v) => setInvite((f) => ({ ...f, schoolEmail: v }))}
                />
                <Field
                  label="Phone"
                  value={invite.phone}
                  onChange={(v) => setInvite((f) => ({ ...f, phone: v }))}
                />
                <Field
                  label="School"
                  value={invite.school}
                  onChange={(v) => setInvite((f) => ({ ...f, school: v }))}
                />
                <Field
                  label="Grade"
                  value={invite.grade}
                  onChange={(v) => setInvite((f) => ({ ...f, grade: v }))}
                />
              </div>
              <label className="block">
                <span className="mb-1 block text-[12px] text-tertiary">
                  Notes
                </span>
                <textarea
                  value={invite.notes}
                  onChange={(e) =>
                    setInvite((f) => ({ ...f, notes: e.target.value }))
                  }
                  rows={2}
                  className="w-full rounded-[var(--radius-sm)] border border-[var(--border)] bg-transparent px-3 py-2 text-sm outline-none focus:border-[var(--accent)]"
                />
              </label>
              <label className="flex items-center gap-2 text-[13px] text-secondary">
                <input
                  type="checkbox"
                  checked={invite.sendEmail}
                  onChange={(e) =>
                    setInvite((f) => ({ ...f, sendEmail: e.target.checked }))
                  }
                  className="rounded border-[var(--border)]"
                />
                Send waiver email now (Resend)
              </label>
              <Button type="submit" loading={inviting} size="md">
                <UserPlus className="h-3.5 w-3.5" />
                Create &amp; invite
              </Button>
            </form>
          </GlassCard>
        </div>
      )}

      <div>
        <SectionLabel>Queue</SectionLabel>
        <div className="mb-3 flex flex-wrap items-center gap-2">
          {(
            [
              ["review", `Review (${reviewQueue.length})`],
              ["waiting", `Waiting (${waitingQueue.length})`],
              ["active", "Active"],
              ["all", "All"],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={cn(
                "rounded-[var(--radius-sm)] px-3 py-1.5 text-[13px] transition-colors",
                tab === id
                  ? "bg-[var(--accent-soft)] text-[var(--text-primary)]"
                  : "text-secondary hover:bg-[var(--surface-hover)]"
              )}
            >
              {label}
            </button>
          ))}
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search name or email…"
            className="ml-auto h-9 w-full max-w-xs rounded-[var(--radius-sm)] border border-[var(--border)] bg-transparent px-3 text-sm outline-none focus:border-[var(--accent)] sm:w-56"
          />
        </div>

        <GlassCard padding={false} className="overflow-hidden">
          {list.length === 0 ? (
            <p className="px-5 py-10 text-center text-sm text-secondary">
              Nothing in this queue.
            </p>
          ) : (
            <ul className="divide-y divide-[var(--border)]">
              {list.map((m) => {
                const busy = busyId === m.id;
                const docUrl = m.onboarding?.signedDocumentUrl;
                const signingUrl = m.onboarding?.signingUrl;
                return (
                  <li
                    key={m.id}
                    className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center"
                  >
                    <div className="flex min-w-0 flex-1 items-start gap-3">
                      <Avatar
                        name={displayName(m)}
                        src={m.pfpUrl}
                        size="sm"
                      />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">
                          {displayName(m)}
                        </p>
                        <p className="truncate text-[12px] text-tertiary">
                          {m.onboarding?.submitterEmail ||
                            m.personalEmail ||
                            m.schoolEmail}
                        </p>
                        <div className="mt-1 flex flex-wrap items-center gap-2">
                          <StatusDot
                            status={
                              m.onboardingStatus === "complete"
                                ? "active"
                                : m.onboardingStatus === "needs_review"
                                  ? "pending"
                                  : "inactive"
                            }
                            label={statusLabel(m)}
                          />
                          {m.onboarding?.signedAt && (
                            <span className="text-[11px] text-tertiary">
                              Signed{" "}
                              {new Date(m.onboarding.signedAt).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5 sm:justify-end">
                      {docUrl && (
                        <a
                          href={docUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex h-8 items-center gap-1 rounded-[var(--radius-sm)] px-2.5 text-xs text-secondary hover:bg-[var(--surface-hover)]"
                        >
                          <ExternalLink className="h-3 w-3" />
                          Document
                        </a>
                      )}
                      {signingUrl && m.onboardingStatus !== "complete" && (
                        <a
                          href={signingUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex h-8 items-center gap-1 rounded-[var(--radius-sm)] px-2.5 text-xs text-secondary hover:bg-[var(--surface-hover)]"
                        >
                          <FileSignature className="h-3 w-3" />
                          Form link
                        </a>
                      )}

                      {canInvite &&
                        (m.onboardingStatus === "in_progress" ||
                          m.onboardingStatus === "not_started") && (
                          <Button
                            size="sm"
                            variant="ghost"
                            loading={busy}
                            onClick={() =>
                              void runAction(m.id, () =>
                                onboardingFetch("/api/onboarding/email", {
                                  method: "POST",
                                  json: {
                                    memberId: m.id,
                                    appOrigin: window.location.origin,
                                  },
                                })
                              )
                            }
                          >
                            <Mail className="h-3 w-3" />
                            Resend
                          </Button>
                        )}

                      {canReview &&
                        m.onboardingStatus === "in_progress" && (
                          <Button
                            size="sm"
                            variant="secondary"
                            loading={busy}
                            onClick={() => {
                              const docInput = window.prompt(
                                "Optional: Paste the signed document PDF URL (or leave blank to mark signed):"
                              );
                              if (docInput === null) return;
                              void runAction(m.id, () =>
                                onboardingFetch("/api/onboarding/mark-signed", {
                                  method: "POST",
                                  json: {
                                    memberId: m.id,
                                    documentUrl: docInput.trim() || undefined,
                                  },
                                })
                              );
                            }}
                          >
                            <Check className="h-3 w-3" />
                            Mark signed
                          </Button>
                        )}

                      {canReview && !docUrl && (
                        <Button
                          size="sm"
                          variant="ghost"
                          loading={busy}
                          title="Attach signed document PDF URL"
                          onClick={() => {
                            const docInput = window.prompt(
                              "Paste the signed document PDF URL:"
                            );
                            if (!docInput?.trim()) return;
                            void runAction(m.id, () =>
                              onboardingFetch("/api/onboarding/mark-signed", {
                                method: "POST",
                                json: {
                                  memberId: m.id,
                                  documentUrl: docInput.trim(),
                                },
                              })
                            );
                          }}
                        >
                          <Paperclip className="h-3 w-3" />
                          Attach doc
                        </Button>
                      )}

                      {canReview && m.onboardingStatus === "needs_review" && (
                        <>
                          <Button
                            size="sm"
                            variant="primary"
                            loading={busy}
                            onClick={() =>
                              void runAction(m.id, () =>
                                onboardingFetch("/api/onboarding/review", {
                                  method: "POST",
                                  json: {
                                    memberId: m.id,
                                    decision: "approve",
                                  },
                                })
                              )
                            }
                          >
                            <Check className="h-3 w-3" />
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            loading={busy}
                            onClick={() =>
                              void runAction(m.id, () =>
                                onboardingFetch("/api/onboarding/review", {
                                  method: "POST",
                                  json: {
                                    memberId: m.id,
                                    decision: "reject",
                                  },
                                })
                              )
                            }
                          >
                            <RotateCcw className="h-3 w-3" />
                            Reject
                          </Button>
                        </>
                      )}

                      {canReview &&
                        m.onboardingStatus === "complete" &&
                        m.status === "active" && (
                          <Button
                            size="sm"
                            variant="danger"
                            loading={busy}
                            onClick={() => {
                              if (
                                !confirm(
                                  `Revoke dashboard access for ${displayName(m)}?`
                                )
                              )
                                return;
                              void runAction(m.id, () =>
                                onboardingFetch("/api/onboarding/review", {
                                  method: "POST",
                                  json: {
                                    memberId: m.id,
                                    decision: "revoke",
                                  },
                                })
                              );
                            }}
                          >
                            <Ban className="h-3 w-3" />
                            Revoke
                          </Button>
                        )}

                      {(canInvite || isAdmin) &&
                        m.id !== member?.id &&
                        (isAdmin ||
                          m.status === "pending" ||
                          m.status === "inactive" ||
                          m.onboardingStatus !== "complete") && (
                          <Button
                            size="sm"
                            variant="danger"
                            loading={busy}
                            onClick={() => {
                              if (
                                !confirm(
                                  `Permanently delete ${displayName(m)} from the roster? This cannot be undone.`
                                )
                              )
                                return;
                              void runAction(m.id, () =>
                                onboardingFetch("/api/onboarding/delete", {
                                  method: "POST",
                                  json: { memberId: m.id },
                                })
                              );
                            }}
                          >
                            <Trash2 className="h-3 w-3" />
                            Delete
                          </Button>
                        )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </GlassCard>
      </div>
    </div>
  );
}

function byName(a: Member, b: Member) {
  return a.fullName.localeCompare(b.fullName);
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  required,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-[12px] text-tertiary">{label}</span>
      <input
        type={type}
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-9 w-full rounded-[var(--radius-sm)] border border-[var(--border)] bg-transparent px-3 text-sm outline-none focus:border-[var(--accent)]"
      />
    </label>
  );
}
