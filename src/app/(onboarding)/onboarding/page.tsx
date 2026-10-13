"use client";

import Link from "next/link";
import { useState } from "react";
import { CheckCircle2, Clock, FileSignature, Mail } from "lucide-react";
import { useAuth } from "@/lib/auth/AuthProvider";
import { useMembers } from "@/lib/members/MembersProvider";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/Button";
import { displayName } from "@/lib/permissions";
import { onboardingFetch } from "@/lib/onboarding/client";
import { buildSigningShareUrl } from "@/lib/onboarding/share";

export default function OnboardingStatusPage() {
  const { member } = useAuth();
  const { refresh } = useMembers();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  if (!member) return null;

  const status = member.onboardingStatus;
  const signingUrl =
    member.onboarding?.signingUrl ||
    buildSigningShareUrl({
      email: member.onboarding?.submitterEmail || member.personalEmail,
      name: member.fullName,
    });
  const submitterEmail =
    member.onboarding?.submitterEmail || member.personalEmail;

  async function markSigned() {
    setBusy(true);
    setErr("");
    try {
      const res = await onboardingFetch<{ message?: string }>(
        "/api/onboarding/mark-signed",
        { method: "POST", json: { self: true } }
      );
      setMsg(res.message || "Marked as signed.");
      await refresh();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Could not update");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <p className="text-[11px] uppercase tracking-wider text-tertiary">
          Volunteer onboarding
        </p>
        <h1 className="mt-1 text-xl font-medium tracking-tight">
          Welcome, {displayName(member).split(" ")[0]}
        </h1>
        <p className="mt-1 text-[13px] text-secondary">
          Complete your liability waiver, then wait for staff approval before
          using the full dashboard.
        </p>
      </div>

      {msg && (
        <p className="rounded-[var(--radius-sm)] border border-[var(--success-soft)] bg-[var(--success-soft)] px-3 py-2 text-[13px] text-[var(--success)]">
          {msg}
        </p>
      )}
      {err && (
        <p className="rounded-[var(--radius-sm)] border border-[var(--danger-soft)] bg-[var(--danger-soft)] px-3 py-2 text-[13px] text-[var(--danger)]">
          {err}
        </p>
      )}

      <GlassCard>
        <ol className="space-y-4">
          <li className="flex gap-3">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[var(--success)]" />
            <div>
              <p className="text-sm font-medium">Roster invite</p>
              <p className="text-[13px] text-secondary">
                You’re on the CENG volunteer list.
              </p>
            </div>
          </li>

          <li className="flex gap-3">
            {status === "needs_review" || status === "complete" ? (
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[var(--success)]" />
            ) : (
              <FileSignature className="mt-0.5 h-4 w-4 shrink-0 text-[var(--accent)]" />
            )}
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium">Sign liability waiver</p>
              <p className="text-[13px] text-secondary">
                {status === "needs_review" || status === "complete"
                  ? "Signed — waiting for staff review."
                  : "Sign with the link emailed to you, or open the form below."}
              </p>
              {submitterEmail && status === "in_progress" && (
                <p className="mt-2 flex items-center gap-1.5 text-[12px] text-tertiary">
                  <Mail className="h-3.5 w-3.5" />
                  Check {submitterEmail}
                </p>
              )}
              {status === "in_progress" && (
                <div className="mt-3 flex flex-wrap gap-2">
                  <a
                    href={signingUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex h-9 items-center rounded-[var(--radius-sm)] bg-[var(--accent)] px-3.5 text-sm font-medium text-[var(--text-inverse)]"
                  >
                    Open signing link
                  </a>
                  <Link href="/onboarding/forms">
                    <Button variant="secondary" size="md">
                      Sign in this browser
                    </Button>
                  </Link>
                  <Button
                    size="md"
                    variant="ghost"
                    loading={busy}
                    onClick={() => void markSigned()}
                  >
                    I’ve already signed
                  </Button>
                </div>
              )}
            </div>
          </li>

          <li className="flex gap-3">
            {status === "complete" ? (
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[var(--success)]" />
            ) : (
              <Clock className="mt-0.5 h-4 w-4 shrink-0 text-tertiary" />
            )}
            <div>
              <p className="text-sm font-medium">Staff approval</p>
              <p className="text-[13px] text-secondary">
                {status === "needs_review"
                  ? "A staff member will review your signed form and activate your account."
                  : status === "complete"
                    ? "Approved — you have full access."
                    : "Unlocks after your forms are signed and reviewed."}
              </p>
              {status === "needs_review" && (
                <Button
                  className="mt-3"
                  size="md"
                  variant="secondary"
                  loading={busy}
                  onClick={() => {
                    setBusy(true);
                    void refresh()
                      .then(() => setMsg("Status refreshed."))
                      .catch(() => setErr("Could not refresh"))
                      .finally(() => setBusy(false));
                  }}
                >
                  Check approval status
                </Button>
              )}
            </div>
          </li>
        </ol>
      </GlassCard>
    </div>
  );
}
