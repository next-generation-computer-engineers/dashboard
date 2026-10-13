import { COLLECTIONS } from "@/lib/firebase/schema";
import { getDocument } from "@/lib/firebase/userFirestore";
import {
  ApiError,
  deleteMemberRecord,
  jsonError,
  requireCaller,
  writeOnboardingEvent,
} from "@/lib/onboarding/server";
import type { Member } from "@/types";

export const runtime = "nodejs";

/** Permanently delete a roster volunteer (for test resets + mistaken invites). */
export async function POST(req: Request) {
  try {
    const { memberId: actorId, idToken, member: actor } = await requireCaller(
      req,
      ["onboarding:invite", "admin:access"]
    );
    const body = (await req.json()) as { memberId?: string };
    if (!body.memberId) throw new ApiError(400, "memberId is required");

    if (body.memberId === actorId) {
      throw new ApiError(400, "You cannot delete your own account here");
    }

    const member = await getDocument<Member>(
      idToken,
      COLLECTIONS.members,
      body.memberId
    );
    if (!member) throw new ApiError(404, "Member not found");

    // Extra safety: only delete pending/inactive onboarding test accounts unless admin
    const isAdmin = actor.roleIds.includes("role_admin");
    const isTestish =
      member.status === "pending" ||
      member.status === "inactive" ||
      member.onboardingStatus !== "complete";
    if (!isAdmin && !isTestish) {
      throw new ApiError(
        403,
        "Only admins can delete fully active volunteers"
      );
    }

    await writeOnboardingEvent(idToken, {
      type: "member.deleted",
      memberId: member.id,
      actorMemberId: actorId,
      payload: {
        fullName: member.fullName,
        email: member.personalEmail,
      },
    });

    await deleteMemberRecord(idToken, member);

    return Response.json({
      ok: true,
      message: `Deleted ${member.fullName} from the roster.`,
    });
  } catch (err) {
    return jsonError(err);
  }
}
