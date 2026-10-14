/**
 * DocuSeal API helpers (server-only).
 * Docs: https://www.docuseal.com/docs/api
 *
 * Email: DocuSeal sends the signing invite when `send_email: true`.
 * Resend welcome emails are intentionally deferred.
 */

const DOCUSEAL_API = "https://api.docuseal.com";

export function getDocusealConfig() {
  const apiKey = process.env.DOCUSEAL_API_KEY?.trim();
  // Prefer numeric template id from DocuSeal Preferences; fall back to slug URL
  const templateId =
    process.env.DOCUSEAL_TEMPLATE_ID?.trim() ||
    process.env.NEXT_PUBLIC_DOCUSEAL_TEMPLATE_ID?.trim() ||
    "6377250";
  const formSrc =
    process.env.NEXT_PUBLIC_DOCUSEAL_FORM_SRC?.trim() ||
    "https://docuseal.com/d/kn2Uj5bNhsHCyx";
  const webhookSecret = process.env.DOCUSEAL_WEBHOOK_SECRET?.trim();

  return { apiKey, templateId, formSrc, webhookSecret };
}

export function isDocusealApiConfigured() {
  return Boolean(process.env.DOCUSEAL_API_KEY?.trim());
}

type CreateSubmissionInput = {
  email: string;
  name: string;
  sendEmail?: boolean;
  externalId?: string;
};

export type DocusealSubmitter = {
  id?: number;
  email?: string;
  name?: string;
  slug?: string;
  embed_src?: string;
  status?: string;
};

export type DocusealSubmission = {
  id: number;
  status?: string;
  submitters?: DocusealSubmitter[];
  documents?: { name?: string; url?: string }[];
  combined_document_url?: string;
  audit_log_url?: string;
};

async function docusealFetch<T>(
  path: string,
  init?: RequestInit
): Promise<T> {
  const { apiKey } = getDocusealConfig();
  if (!apiKey) {
    throw new Error("DOCUSEAL_API_KEY is not configured");
  }

  const res = await fetch(`${DOCUSEAL_API}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      "X-Auth-Token": apiKey,
      ...(init?.headers ?? {}),
    },
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`DocuSeal API ${res.status}: ${text || res.statusText}`);
  }

  return (await res.json()) as T;
}

/** Create a submission; DocuSeal emails the submitter when sendEmail is true. */
export async function createDocusealSubmission(
  input: CreateSubmissionInput
): Promise<{
  submission: DocusealSubmission;
  signingUrl?: string;
  submitterId?: number;
}> {
  const { templateId } = getDocusealConfig();
  const numericId = Number(templateId);
  const templateField = Number.isFinite(numericId) && String(numericId) === templateId
    ? { template_id: numericId }
    : { template_id: templateId };

  const body = {
    ...templateField,
    send_email: input.sendEmail !== false,
    submitters: [
      {
        role: "First Party",
        email: input.email.toLowerCase().trim(),
        name: input.name.trim(),
        external_id: input.externalId,
      },
    ],
  };

  // API returns an array of submitters for multi-submitter; single template often returns submission object or array
  const raw = await docusealFetch<DocusealSubmission | DocusealSubmitter[]>(
    "/submissions",
    { method: "POST", body: JSON.stringify(body) }
  );

  if (Array.isArray(raw)) {
    const submitter = raw[0] as DocusealSubmitter & {
      submission_id?: number;
    };
    const submissionId = submitter?.submission_id ?? submitter?.id ?? 0;
    const signingUrl =
      submitter?.embed_src ||
      (submitter?.slug ? `https://docuseal.com/s/${submitter.slug}` : undefined);
    return {
      submission: {
        id: submissionId,
        submitters: raw,
      },
      signingUrl,
      submitterId: submitter?.id,
    };
  }

  const submitter = raw.submitters?.[0];
  const signingUrl =
    submitter?.embed_src ||
    (submitter?.slug ? `https://docuseal.com/s/${submitter.slug}` : undefined);

  return {
    submission: raw,
    signingUrl,
    submitterId: submitter?.id,
  };
}

export async function getDocusealSubmission(
  submissionId: number
): Promise<DocusealSubmission> {
  return docusealFetch<DocusealSubmission>(`/submissions/${submissionId}`);
}

export async function listDocusealSubmissions(params?: {
  templateId?: string;
  q?: string;
}): Promise<DocusealSubmission[]> {
  const { templateId } = getDocusealConfig();
  const tid = params?.templateId || templateId;
  const search = new URLSearchParams();
  if (tid) search.set("template_id", tid);
  if (params?.q) search.set("q", params.q);
  const qs = search.toString();
  const data = await docusealFetch<
    DocusealSubmission[] | { data: DocusealSubmission[] }
  >(`/submissions${qs ? `?${qs}` : ""}`);
  return Array.isArray(data) ? data : data.data ?? [];
}

export function extractSignedDocumentUrl(
  submission: DocusealSubmission
): string | undefined {
  return (
    submission.combined_document_url ||
    submission.documents?.find((d) => d.url)?.url ||
    undefined
  );
}

/** Soft verify webhook (DocuSeal may send secret header or query). */
export function verifyDocusealWebhook(req: Request): boolean {
  const { webhookSecret } = getDocusealConfig();
  if (!webhookSecret) return true; // allow if secret not configured (dev)

  const header =
    req.headers.get("x-docuseal-signature") ||
    req.headers.get("x-webhook-secret") ||
    req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");

  const url = new URL(req.url);
  const querySecret = url.searchParams.get("secret");

  const provided = header || querySecret;
  if (!provided) return false;
  return provided === webhookSecret;
}
