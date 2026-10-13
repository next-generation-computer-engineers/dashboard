import { createRemoteJWKSet, jwtVerify, type JWTPayload } from "jose";

const projectId = () =>
  process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ||
  process.env.FIREBASE_PROJECT_ID ||
  "";

/** Google JWKS for Firebase ID tokens — no service account required. */
const jwks = createRemoteJWKSet(
  new URL(
    "https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com"
  )
);

export type VerifiedFirebaseToken = {
  uid: string;
  email?: string;
  payload: JWTPayload;
};

export async function verifyFirebaseIdToken(
  token: string
): Promise<VerifiedFirebaseToken> {
  const pid = projectId();
  if (!pid) {
    throw new Error("NEXT_PUBLIC_FIREBASE_PROJECT_ID is not set");
  }

  const { payload } = await jwtVerify(token, jwks, {
    issuer: `https://securetoken.google.com/${pid}`,
    audience: pid,
  });

  const uid = typeof payload.sub === "string" ? payload.sub : "";
  if (!uid) throw new Error("Invalid Firebase token: missing sub");

  return {
    uid,
    email: typeof payload.email === "string" ? payload.email : undefined,
    payload,
  };
}
