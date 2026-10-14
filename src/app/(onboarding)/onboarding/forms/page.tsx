"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { DocusealForm } from "@docuseal/react";
import { useAuth } from "@/lib/auth/AuthProvider";
import { useMembers } from "@/lib/members/MembersProvider";
import { GlassCard } from "@/components/ui/GlassCard";
import { onboardingFetch } from "@/lib/onboarding/client";

const FORM_SRC =
  process.env.NEXT_PUBLIC_DOCUSEAL_FORM_SRC ||
  "https://docuseal.com/d/kn2Uj5bNhsHCyx";

export default function OnboardingFormsPage() {
  const { member } = useAuth();
  const { refresh } = useMembers();
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const email =
    member?.onboarding?.submitterEmail ||
    member?.personalEmail ||
    member?.schoolEmail ||
    "";

  const src =
    member?.onboarding?.signingUrl?.includes("docuseal.com/d/") ||
    member?.onboarding?.signingUrl?.includes("docuseal.com/s/")
      ? member.onboarding.signingUrl.split("?")[0]
      : FORM_SRC;

  const onComplete = useCallback(
    async (data: {
      submission_id?: number;
      id?: number;
      submission?: {
        id?: number;
        combined_document_url?: string | null;
        url?: string | null;
      };
      documents?: { url?: string }[];
      submission_url?: string;
    }) => {
      setSaving(true);
      setError("");
      try {
        const docUrl =
          data.submission?.combined_document_url ||
          data.documents?.[0]?.url ||
          data.submission?.url ||
          data.submission_url;

        await onboardingFetch("/api/onboarding/complete-embed", {
          method: "POST",
          json: {
            submissionId:
              data.submission?.id ?? data.submission_id ?? data.id,
            documentUrl: docUrl || undefined,
          },
        });
        await refresh();
        setDone(true);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Could not save completion"
        );
      } finally {
        setSaving(false);
      }
    },
    [refresh]
  );

  if (!member) return null;

  if (
    member.onboardingStatus === "needs_review" ||
    member.onboardingStatus === "complete" ||
    done
  ) {
    return (
      <div className="space-y-4">
        <Link
          href="/onboarding"
          className="inline-flex items-center gap-1.5 text-sm text-secondary"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back
        </Link>
        <GlassCard>
          <p className="text-sm font-medium">Forms submitted</p>
          <p className="mt-1 text-[13px] text-secondary">
            Thanks — staff will review your signed waiver shortly.
          </p>
          <Link
            href="/onboarding"
            className="mt-4 inline-flex text-[13px] font-medium text-[var(--accent)]"
          >
            View status
          </Link>
        </GlassCard>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Link
        href="/onboarding"
        className="inline-flex items-center gap-1.5 text-sm text-secondary"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Back
      </Link>
      <div>
        <h1 className="text-lg font-medium tracking-tight">Sign your forms</h1>
        <p className="mt-1 text-[13px] text-secondary">
          Complete the waiver below{email ? ` as ${email}` : ""}.
        </p>
      </div>
      {error && (
        <p className="rounded-[var(--radius-sm)] bg-[var(--danger-soft)] px-3 py-2 text-[13px] text-[var(--danger)]">
          {error}
        </p>
      )}
      {saving && <p className="text-[13px] text-secondary">Saving…</p>}
      <GlassCard padding={false} className="overflow-hidden p-2">
        <DocusealForm src={src} email={email} onComplete={onComplete} />
      </GlassCard>
    </div>
  );
}
