import { COLLECTIONS } from "@/lib/firebase/schema";
import { getDocument } from "@/lib/firebase/userFirestore";
import {
  ApiError,
  jsonError,
  patchMember,
  requireCaller,
  requireLinkedMember,
  writeOnboardingEvent,
} from "@/lib/onboarding/server";
import type { Member } from "@/types";

export const runtime = "nodejs";

/**
 * Mark forms as signed → needs_review.
 * - Staff (onboarding:review) can mark any member (e.g. after verifying DocuSeal).
 * - Volunteer can mark themselves after signing the shared link.
 */
export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      memberId?: string;
      documentUrl?: string;
      self?: boolean;
    };

    let idToken: string;
    let actorId: string;
    let target: Member;

    if (body.self || !body.memberId) {
      const linked = await requireLinkedMember(req);
      idToken = linked.idToken;
      actorId = linked.memberId;
      target = linked.member;
    } else {
      const caller = await requireCaller(req, "onboarding:review");
      idToken = caller.idToken;
      actorId = caller.memberId;
      const member = await getDocument<Member>(
        idToken,
        COLLECTIONS.members,
        body.memberId
      );
      if (!member) throw new ApiError(404, "Member not found");
      target = member;
    }

    if (
      target.onboardingStatus === "needs_review" ||
      target.onboardingStatus === "complete"
    ) {
      return Response.json({ ok: true, idempotent: true });
    }

    const now = new Date().toISOString();
    await patchMember(idToken, target.id, {
      onboardingStatus: "needs_review",
      onboarding: {
        ...(target.onboarding ?? {}),
        status: "completed",
        signedAt: now,
        signedDocumentUrl:
          body.documentUrl || target.onboarding?.signedDocumentUrl,
      },
    });

    await writeOnboardingEvent(idToken, {
      type: "forms.marked_signed",
      memberId: target.id,
      actorMemberId: actorId,
      payload: { self: Boolean(body.self || !body.memberId) },
    });

    return Response.json({
      ok: true,
      onboardingStatus: "needs_review",
      message: "Marked as signed — waiting for staff review.",
    });
  } catch (err) {
    return jsonError(err);
  }
}
