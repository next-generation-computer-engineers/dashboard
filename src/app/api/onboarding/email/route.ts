import { COLLECTIONS } from "@/lib/firebase/schema";
import { getDocument } from "@/lib/firebase/userFirestore";
import {
  isResendConfigured,
  sendOnboardingInviteEmail,
} from "@/lib/onboarding/email";
import { buildSigningShareUrl } from "@/lib/onboarding/share";
import {
  ApiError,
  jsonError,
  requireCaller,
  writeOnboardingEvent,
} from "@/lib/onboarding/server";
import type { Member } from "@/types";

export const runtime = "nodejs";

/** Re-send the waiver invite email via Resend. */
export async function POST(req: Request) {
  try {
    const { memberId: actorId, idToken } = await requireCaller(
      req,
      "onboarding:invite"
    );
    const body = (await req.json()) as {
      memberId?: string;
      appOrigin?: string;
    };
    if (!body.memberId) throw new ApiError(400, "memberId is required");

    if (!isResendConfigured()) {
      throw new ApiError(503, "RESEND_API_KEY is not configured");
    }

    const member = await getDocument<Member>(
      idToken,
      COLLECTIONS.members,
      body.memberId
    );
    if (!member) throw new ApiError(404, "Member not found");

    const to =
      member.onboarding?.submitterEmail ||
      member.personalEmail ||
      member.schoolEmail;
    if (!to) throw new ApiError(400, "Member has no email");

    const signingUrl =
      member.onboarding?.signingUrl ||
      buildSigningShareUrl({ email: to, name: member.fullName });

    await sendOnboardingInviteEmail({
      to,
      fullName: member.fullName,
      signingUrl,
      appOrigin: body.appOrigin,
    });

    await writeOnboardingEvent(idToken, {
      type: "invite.email_resent",
      memberId: member.id,
      actorMemberId: actorId,
      payload: { to },
    });

    return Response.json({
      ok: true,
      emailSent: true,
      message: `Invite email sent to ${to}.`,
    });
  } catch (err) {
    return jsonError(err);
  }
}
