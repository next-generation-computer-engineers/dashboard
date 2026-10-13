import { COLLECTIONS } from "@/lib/firebase/schema";
import { getDocument } from "@/lib/firebase/userFirestore";
import {
  ApiError,
  jsonError,
  patchMember,
  requireCaller,
  writeOnboardingEvent,
} from "@/lib/onboarding/server";
import type { Member } from "@/types";

export const runtime = "nodejs";

type Decision = "approve" | "reject" | "revoke";

export async function POST(req: Request) {
  try {
    const { memberId: actorId, idToken } = await requireCaller(
      req,
      "onboarding:review"
    );
    const body = (await req.json()) as {
      memberId?: string;
      decision?: Decision;
      notes?: string;
    };

    if (!body.memberId) throw new ApiError(400, "memberId is required");
    if (
      body.decision !== "approve" &&
      body.decision !== "reject" &&
      body.decision !== "revoke"
    ) {
      throw new ApiError(400, "decision must be approve, reject, or revoke");
    }

    const member = await getDocument<Member>(
      idToken,
      COLLECTIONS.members,
      body.memberId
    );
    if (!member) throw new ApiError(404, "Member not found");

    const now = new Date().toISOString();
    const notes = body.notes?.trim() || undefined;

    if (body.decision === "approve") {
      await patchMember(idToken, member.id, {
        status: "active",
        onboardingStatus: "complete",
        onboarding: {
          ...(member.onboarding ?? {}),
          status: member.onboarding?.status === "completed" ? "completed" : member.onboarding?.status,
          reviewedAt: now,
          reviewedByMemberId: actorId,
          reviewNotes: notes,
        },
      });
      await writeOnboardingEvent(idToken, {
        type: "review.approved",
        memberId: member.id,
        actorMemberId: actorId,
        payload: { notes: notes ?? null },
      });
      return Response.json({
        ok: true,
        decision: "approve",
        message: `${member.fullName} is approved and can use the dashboard.`,
      });
    }

    if (body.decision === "revoke") {
      await patchMember(idToken, member.id, {
        status: "inactive",
        onboardingStatus: "in_progress",
        onboarding: {
          ...(member.onboarding ?? {}),
          status: "revoked",
          reviewedAt: now,
          reviewedByMemberId: actorId,
          reviewNotes: notes,
        },
      });
      await writeOnboardingEvent(idToken, {
        type: "review.revoked",
        memberId: member.id,
        actorMemberId: actorId,
        payload: { notes: notes ?? null },
      });
      return Response.json({
        ok: true,
        decision: "revoke",
        message: `${member.fullName} access revoked.`,
      });
    }

    // reject — send back to signing
    await patchMember(idToken, member.id, {
      status: "pending",
      onboardingStatus: "in_progress",
      onboarding: {
        ...(member.onboarding ?? {}),
        status: "sent",
        reviewedAt: now,
        reviewedByMemberId: actorId,
        reviewNotes: notes,
        signedAt: null,
        signedDocumentUrl: null,
      },
    });
    await writeOnboardingEvent(idToken, {
      type: "review.rejected",
      memberId: member.id,
      actorMemberId: actorId,
      payload: { notes: notes ?? null },
    });
    return Response.json({
      ok: true,
      decision: "reject",
      message: `Rejected — ${member.fullName} must sign again.`,
    });
  } catch (err) {
    return jsonError(err);
  }
}
