/**
 * Seed Firestore with roster + org data for deploy.
 *
 * Prerequisites:
 * 1. Firebase Console → Firestore Database → Create database (test mode OK for first seed)
 * 2. Auth Email/Password + Google enabled
 * 3. `.env.local` filled with web app config
 *
 * Usage: npm run seed:firestore
 */
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { initializeApp } from "firebase/app";
import {
  getFirestore,
  doc,
  setDoc,
  writeBatch,
  collection,
  getDocs,
} from "firebase/firestore";

function loadEnvLocal() {
  const path = resolve(process.cwd(), ".env.local");
  if (!existsSync(path)) {
    throw new Error("Missing .env.local — copy Firebase web config first.");
  }
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim();
    if (!process.env[key]) process.env[key] = value;
  }
}

loadEnvLocal();

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
  throw new Error("Firebase env vars missing in .env.local");
}

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function commitInChunks<T>(
  items: T[],
  chunkSize: number,
  write: (batch: ReturnType<typeof writeBatch>, item: T) => void
) {
  for (let i = 0; i < items.length; i += chunkSize) {
    const batch = writeBatch(db);
    const slice = items.slice(i, i + chunkSize);
    for (const item of slice) write(batch, item);
    await batch.commit();
    console.log(`  committed ${Math.min(i + chunkSize, items.length)}/${items.length}`);
  }
}

function emailsOf(m: {
  personalEmail?: string;
  schoolEmail?: string | null;
  cengEmail?: string | null;
  cengEmailAliases?: string[] | null;
}) {
  return Array.from(
    new Set(
      [m.personalEmail, m.schoolEmail, m.cengEmail, ...(m.cengEmailAliases ?? [])]
        .filter((e): e is string => Boolean(e))
        .map((e) => e.toLowerCase().trim())
    )
  );
}

async function main() {
  console.log(`Seeding project ${firebaseConfig.projectId}…`);

  const { MEMBERS, TEAMS } = await import("../src/data/roster");
  const { CLASSES, CURRENT_SESSION, CLASS_ASSIGNMENTS } = await import(
    "../src/data/seed"
  );
  const { SYSTEM_ROLES } = await import("../src/lib/permissions/index");

  // roles
  console.log("roles…");
  await commitInChunks(SYSTEM_ROLES, 400, (batch, role) => {
    batch.set(doc(db, "roles", role.id), role, { merge: true });
  });

  // session
  console.log("session…");
  await setDoc(doc(db, "sessions", CURRENT_SESSION.id), CURRENT_SESSION, {
    merge: true,
  });

  // teams
  console.log("teams…");
  await commitInChunks(TEAMS, 400, (batch, team) => {
    batch.set(doc(db, "teams", team.id), team, { merge: true });
  });

  // classes
  console.log("classes…");
  await commitInChunks(CLASSES, 200, (batch, cls) => {
    batch.set(doc(db, "classes", cls.id), cls, { merge: true });
  });

  // class assignments
  console.log("classAssignments…");
  await commitInChunks(CLASS_ASSIGNMENTS, 400, (batch, a) => {
    batch.set(doc(db, "classAssignments", a.id), a, { merge: true });
  });

  // members (roster source of truth)
  console.log(`members (${MEMBERS.length})…`);
  await commitInChunks(MEMBERS, 400, (batch, member) => {
    const payload = {
      ...member,
      emails: emailsOf(member),
      source: "roster",
    };
    // Firestore rejects undefined
    for (const key of Object.keys(payload)) {
      if ((payload as Record<string, unknown>)[key] === undefined) {
        delete (payload as Record<string, unknown>)[key];
      }
    }
    batch.set(doc(db, "members", member.id), payload, { merge: true });
  });

  await setDoc(
    doc(db, "meta", "seed"),
    {
      lastSeededAt: new Date().toISOString(),
      memberCount: MEMBERS.length,
      classCount: CLASSES.length,
      teamCount: TEAMS.length,
      projectId: firebaseConfig.projectId,
    },
    { merge: true }
  );

  const membersSnap = await getDocs(collection(db, "members"));
  console.log(`\nDone. Firestore members: ${membersSnap.size}`);
  console.log("App will use Firestore when this collection is non-empty.");
}

main().catch((err) => {
  console.error("\nSeed failed:", err?.message || err);
  console.error(
    "\nIf you see permission-denied / not-found:\n" +
      "  1. Create Firestore in Firebase Console (Start in test mode)\n" +
      "  2. Enable Authentication → Email/Password + Google\n" +
      "  3. Re-run: npm run seed:firestore\n"
  );
  process.exit(1);
});
