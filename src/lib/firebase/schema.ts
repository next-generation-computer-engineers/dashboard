/**
 * Firestore schema for CENG Volunteer Platform
 *
 * Deploy path: seed with `npm run seed:firestore`, then the app reads
 * members/teams/classes from Firestore when Firebase is configured.
 * Local seed JSON remains a fallback for offline / demo mode.
 *
 * Collections:
 *
 * members/{memberId}
 *   Full volunteer profile (source of truth for directory + auth matching)
 *   personalEmail, schoolEmail?, cengEmail?, cengEmailAliases?[],
 *   emails[] — lowercased union of all emails for array-contains queries
 *   authUid?, roleIds[], teamIds[], status, onboardingStatus, …
 *
 * users/{uid}  (Firebase Auth uid)
 *   Thin link: memberId, email, displayName?, linkedAt, updatedAt
 *
 * roles/{roleId} · teams/{teamId} · sessions/{sessionId}
 * classes/{classId} · classAssignments/{assignmentId}
 *
 * Security notes:
 * - Auth via Firebase Auth (Google + email/password)
 * - Never store Zoom account passwords — meeting links only
 * - Start with test-mode rules while seeding; tighten via firestore.rules
 */

export const COLLECTIONS = {
  members: "members",
  users: "users",
  roles: "roles",
  teams: "teams",
  sessions: "sessions",
  classes: "classes",
  classAssignments: "classAssignments",
  announcements: "announcements",
  tasks: "tasks",
  trainingEvents: "trainingEvents",
  resources: "resources",
  meta: "meta",
} as const;

export type CollectionName = (typeof COLLECTIONS)[keyof typeof COLLECTIONS];
