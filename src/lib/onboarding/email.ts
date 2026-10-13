import { Resend } from "resend";
import {
  inviteEmailSubject,
  inviteShareMessage,
} from "@/lib/onboarding/share";

export function isResendConfigured() {
  return Boolean(process.env.RESEND_API_KEY?.trim());
}

function fromAddress() {
  const raw =
    process.env.ONBOARDING_FROM_EMAIL?.trim() ||
    "CENG Onboarding <beth.t@example.com>";
  // Allow either "Name <email>" or bare email
  if (raw.includes("<")) return raw;
  if (raw.includes("@")) return `CENG Onboarding <${raw}>`;
  return "CENG Onboarding <beth.t@example.com>";
}

export async function sendOnboardingInviteEmail(opts: {
  to: string;
  fullName: string;
  signingUrl: string;
  appOrigin?: string;
}): Promise<{ id?: string }> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("RESEND_API_KEY is not configured");
  }

  const resend = new Resend(apiKey);
  const subject = inviteEmailSubject(opts.fullName);
  const text = inviteShareMessage({
    fullName: opts.fullName,
    signingUrl: opts.signingUrl,
    appOrigin: opts.appOrigin,
  });
  const first = opts.fullName.trim().split(/\s+/)[0] || "there";

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.5; color: #1c1917;">
      <p>Hi ${escapeHtml(first)},</p>
      <p>Welcome to CENG! Please sign our volunteer liability waiver:</p>
      <p style="margin: 24px 0;">
        <a href="${escapeAttr(opts.signingUrl)}"
           style="display:inline-block;background:#1e4fd6;color:#fff;padding:10px 16px;border-radius:8px;text-decoration:none;font-weight:600;">
          Sign waiver
        </a>
      </p>
      <p style="font-size: 14px; color: #57534e;">
        Or open this link:<br/>
        <a href="${escapeAttr(opts.signingUrl)}">${escapeHtml(opts.signingUrl)}</a>
      </p>
      ${
        opts.appOrigin
          ? `<p style="font-size: 14px; color: #57534e;">After you sign, create your CENG account with this same email and open <a href="${escapeAttr(opts.appOrigin + "/onboarding")}">${escapeHtml(opts.appOrigin)}/onboarding</a>.</p>`
          : `<p style="font-size: 14px; color: #57534e;">After you sign, create your CENG account with this same email and open the onboarding page in the volunteer dashboard.</p>`
      }
      <p>Thanks!<br/>CENG Onboarding</p>
    </div>
  `;

  const { data, error } = await resend.emails.send({
    from: fromAddress(),
    to: opts.to,
    subject,
    text,
    html,
  });

  if (error) {
    throw new Error(error.message || "Resend failed to send email");
  }
  return { id: data?.id };
}

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function escapeAttr(s: string) {
  return escapeHtml(s).replace(/'/g, "&#39;");
}
