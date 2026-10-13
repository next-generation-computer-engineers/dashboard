import type { MemberOnboarding } from "@/types";
import {
  createDocusealSubmission,
  getDocusealConfig,
  isDocusealApiConfigured,
} from "@/lib/onboarding/docuseal";
import {
  isResendConfigured,
  sendOnboardingInviteEmail,
} from "@/lib/onboarding/email";
import { buildSigningShareUrl } from "@/lib/onboarding/share";
import {
  ApiError,
  buildInviteMember,
  findMemberByEmail,
  jsonError,
  requireCaller,
  saveNewMember,
  writeOnboardingEvent,
} from "@/lib/onboarding/server";

export const runtime = "nodejs";

type InviteBody = {
  fullName?: string;
  personalEmail?: string;
  schoolEmail?: string;
  signingEmail?: "personal" | "school";
  phone?: string;
  school?: string;
  grade?: string;
  title?: string;
  roleIds?: string[];
  teamIds?: string[];
  notes?: string;
  sendEmail?: boolean;
  appOrigin?: string;
};

export async function POST(req: Request) {
  try {
    const { memberId: actorId, idToken } = await requireCaller(
      req,
      "onboarding:invite"
    );
    const body = (await req.json()) as InviteBody;

    const fullName = body.fullName?.trim();
    const personalEmail = body.personalEmail?.trim().toLowerCase();
    if (!fullName || !personalEmail) {
      throw new ApiError(400, "fullName and personalEmail are required");
    }

    const schoolEmail = body.schoolEmail?.trim().toLowerCase() || undefined;
    const signingPref = body.signingEmail ?? "personal";
    const submitterEmail =
      signingPref === "school" && schoolEmail ? schoolEmail : personalEmail;

    const existingPersonal = await findMemberByEmail(idToken, personalEmail);
    if (existingPersonal) {
      throw new ApiError(
        409,
        `A member already exists for ${personalEmail} (${existingPersonal.fullName})`
      );
    }
    if (schoolEmail) {
      const existingSchool = await findMemberByEmail(idToken, schoolEmail);
      if (existingSchool) {
        throw new ApiError(
          409,
          `A member already exists for ${schoolEmail} (${existingSchool.fullName})`
        );
      }
    }

    const { templateId, formSrc } = getDocusealConfig();
    const sharedSigningUrl = buildSigningShareUrl({
      email: submitterEmail,
      name: fullName,
      baseUrl: formSrc,
    });
    const now = new Date().toISOString();
    let onboarding: MemberOnboarding = {
      docusealTemplateId: String(templateId),
      submitterEmail,
      sentAt: now,
      status: "sent",
      signingUrl: sharedSigningUrl,
      invitedByMemberId: actorId,
    };

    let emailSentViaDocuseal = false;

    if (isDocusealApiConfigured()) {
      try {
        const { submission, signingUrl } = await createDocusealSubmission({
          email: submitterEmail,
          name: fullName,
          sendEmail: false, // Resend owns outbound email on free DocuSeal
          externalId: personalEmail,
        });
        onboarding = {
          ...onboarding,
          docusealSubmissionId: submission.id,
          signingUrl: signingUrl || sharedSigningUrl,
          status: "sent",
        };
        emailSentViaDocuseal = false;
      } catch (err) {
        console.warn("[onboarding/invite] DocuSeal create failed", err);
        onboarding = {
          ...onboarding,
          signingUrl: sharedSigningUrl,
        };
      }
    }

    const member = buildInviteMember({
      fullName,
      personalEmail,
      schoolEmail,
      phone: body.phone,
      school: body.school,
      grade: body.grade,
      title: body.title,
      roleIds: body.roleIds ?? ["role_volunteer"],
      teamIds: body.teamIds ?? [],
      onboarding,
    });

    if (body.notes?.trim()) {
      member.bio = body.notes.trim();
    }

    await saveNewMember(idToken, member);

    let emailSentViaResend = false;
    let emailError: string | undefined;
    const shouldEmail = body.sendEmail !== false;
    const signingUrl = onboarding.signingUrl || sharedSigningUrl;

    if (shouldEmail && isResendConfigured()) {
      try {
        await sendOnboardingInviteEmail({
          to: submitterEmail,
          fullName,
          signingUrl,
          appOrigin: body.appOrigin,
        });
        emailSentViaResend = true;
      } catch (err) {
        console.warn("[onboarding/invite] Resend failed", err);
        emailError =
          err instanceof Error ? err.message : "Failed to send invite email";
      }
    }

    await writeOnboardingEvent(idToken, {
      type: "invite.created",
      memberId: member.id,
      actorMemberId: actorId,
      payload: {
        submitterEmail,
        emailSentViaResend,
        emailSentViaDocuseal,
        emailError: emailError ?? null,
        docusealSubmissionId: onboarding.docusealSubmissionId ?? null,
        notes: body.notes?.trim() || null,
      },
    });

    if (shouldEmail && !emailSentViaResend && !isResendConfigured()) {
      return Response.json({
        ok: true,
        member,
        emailSent: false,
        needsMailtoFallback: true,
        signingUrl,
        submitterEmail,
        message: `Invite created. RESEND_API_KEY missing — open email manually.`,
      });
    }

    if (emailError) {
      return Response.json({
        ok: true,
        member,
        emailSent: false,
        needsMailtoFallback: true,
        signingUrl,
        submitterEmail,
        message: `Invite created, but email failed: ${emailError}. Opening your mail app as a backup.`,
      });
    }

    return Response.json({
      ok: true,
      member,
      emailSent: emailSentViaResend || emailSentViaDocuseal,
      needsMailtoFallback: false,
      signingUrl,
      submitterEmail,
      message: emailSentViaResend
        ? `Invite created and emailed to ${submitterEmail}.`
        : `Invite created for ${fullName}.`,
    });
  } catch (err) {
    return jsonError(err);
  }
}
