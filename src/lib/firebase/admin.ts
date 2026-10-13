/**
 * Firebase Admin SDK is intentionally unused.
 * Org policy blocks service-account keys; onboarding APIs authenticate with
 * the caller's Firebase ID token and talk to Firestore via REST instead.
 *
 * These stubs keep optional Admin paths (webhooks / audit fallbacks) compiling
 * without pulling in the `firebase-admin` package.
 */

export function isAdminSdkConfigured(): boolean {
  return false;
}

const SETUP_HINT =
  "Firebase Admin is not configured. Onboarding uses the signed-in user's ID token + Firestore REST.";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getAdminDb(): any {
  throw new Error(SETUP_HINT);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getAdminAuth(): any {
  throw new Error(SETUP_HINT);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getAdminStorage(): any {
  throw new Error(SETUP_HINT);
}
