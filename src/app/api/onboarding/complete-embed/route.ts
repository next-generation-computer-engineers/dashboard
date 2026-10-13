import {
  jsonError,
  patchMember,
  requireLinkedMember,
  writeOnboardingEvent,
} from "@/lib/onboarding/server";

export const runtime = "nodejs";

/**
 * Volunteer finished DocusealForm embed — uses their ID token (no service account).
 */
export async function POST(req: Request) {
  try {
    const { memberId, member, idToken } = await requireLinkedMember(req);
    const body = (await req.json().catch(() => ({}))) as {
      submissionId?: number;
      documentUrl?: string;
    };

    if (
      member.onboardingStatus === "needs_review" ||
      member.onboardingStatus === "complete"
    ) {
      return Response.json({ ok: true, idempotent: true });
    }

    const now = new Date().toISOString();
    await patchMember(idToken, memberId, {
      onboardingStatus: "needs_review",
      onboarding: {
        ...(member.onboarding ?? {}),
        status: "completed",
        signedAt: now,
        docusealSubmissionId:
          body.submissionId ?? member.onboarding?.docusealSubmissionId,
        signedDocumentUrl:
          body.documentUrl || member.onboarding?.signedDocumentUrl,
      },
    });

    await writeOnboardingEvent(idToken, {
      type: "embed.completed",
      memberId,
      payload: {
        submissionId: body.submissionId ?? null,
        hasDocument: Boolean(body.documentUrl),
      },
    });

    return Response.json({ ok: true, onboardingStatus: "needs_review" });
  } catch (err) {
    return jsonError(err);
  }
}
