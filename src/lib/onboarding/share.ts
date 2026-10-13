/**
 * Free-tier DocuSeal helpers — shared link + staff share templates.
 * No API key required when "Enable shared link" is on in DocuSeal.
 */

export const DOCUSEAL_SHARED_FORM_SRC =
  process.env.NEXT_PUBLIC_DOCUSEAL_FORM_SRC?.trim() ||
  "https://docuseal.com/d/DaJ1y4oSuAcDiM";

export const DOCUSEAL_TEMPLATE_ID =
  process.env.NEXT_PUBLIC_DOCUSEAL_TEMPLATE_ID?.trim() ||
  process.env.DOCUSEAL_TEMPLATE_ID?.trim() ||
  "6377250";

/** Public signing URL; optional email hint for DocuSeal prefill. */
export function buildSigningShareUrl(opts?: {
  email?: string;
  name?: string;
  baseUrl?: string;
}) {
  const base = opts?.baseUrl || DOCUSEAL_SHARED_FORM_SRC;
  const url = new URL(base);
  if (opts?.email?.trim()) {
    url.searchParams.set("email", opts.email.trim().toLowerCase());
  }
  if (opts?.name?.trim()) {
    url.searchParams.set("name", opts.name.trim());
  }
  return url.toString();
}

export function inviteEmailSubject(fullName: string) {
  const first = fullName.trim().split(/\s+/)[0] || "there";
  return `CENG volunteer forms — please sign, ${first}`;
}

/** Ready-to-paste message for email / iMessage / WhatsApp. */
export function inviteShareMessage(opts: {
  fullName: string;
  signingUrl: string;
  appOrigin?: string;
}) {
  const first = opts.fullName.trim().split(/\s+/)[0] || "there";
  const origin =
    opts.appOrigin ||
    (typeof window !== "undefined" ? window.location.origin : "");
  const dashboardHint = origin
    ? `\n\nAfter you sign, create your CENG account with this same email and open ${origin}/onboarding so we can finish activating you.`
    : `\n\nAfter you sign, create your CENG account with this same email and open the onboarding page in the volunteer dashboard.`;

  return `Hi ${first},

Welcome to CENG! Please sign our volunteer liability waiver here:
${opts.signingUrl}
${dashboardHint}

Thanks!
CENG Onboarding`;
}

export function mailtoInviteHref(opts: {
  to: string;
  fullName: string;
  signingUrl: string;
  appOrigin?: string;
}) {
  const subject = inviteEmailSubject(opts.fullName);
  const body = inviteShareMessage(opts);
  return `mailto:${encodeURIComponent(opts.to)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

export function smsInviteHref(opts: {
  phone?: string;
  fullName: string;
  signingUrl: string;
}) {
  const first = opts.fullName.trim().split(/\s+/)[0] || "there";
  const body = `Hi ${first}, please sign the CENG volunteer waiver: ${opts.signingUrl}`;
  const phone = (opts.phone || "").replace(/[^\d+]/g, "");
  return phone
    ? `sms:${phone}?&body=${encodeURIComponent(body)}`
    : `sms:?&body=${encodeURIComponent(body)}`;
}
