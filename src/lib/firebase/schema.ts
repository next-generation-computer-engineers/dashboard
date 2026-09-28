/**
 * Firestore schema for CENG Volunteer Platform
 *
 * Classes are hubs that link out to Google Workspace (Sheets / Drive / Docs / Slides / Zoom),
 * matching the Master Spreadsheet session columns — not an in-app attendance tool.
 *
 * Collections:
 *
 * users/{uid}
 *   authUid, fullName, preferredName, bio, pfpUrl,
 *   personalEmail, schoolEmail, cengEmail, phone, school, grade, affiliation,
 *   linkedIn, portfolio, roleIds[], teamIds[],
 *   status, onboardingStatus, searchKeywords[], title,
 *   joinedAt, createdAt, updatedAt
 *
 * roles/{roleId}
 *   key, name, description, scope, permissions[], color, isSystem, sortOrder
 *
 * teams/{teamId}
 *   name, slug, description, leadIds[], memberIds[], color, icon
 *
 * sessions/{sessionId}
 *   name, season, year, startDate, endDate, isActive
 *
 * classes/{classId}
 *   sessionId, name, subject, sessionLabel, dayOfWeek, dateRange,
 *   studentCountLabel, zoomLink, zoomMeetingId,
 *   attendanceSheetUrl, curriculumFolderUrl, classFolderUrl,
 *   whatsappUrl, parentPresentationUrl, parentEmailDocUrl,
 *   registrationFormUrl, icebreakersUrl, officeHoursUrl,
 *   leadTeachers[], seniorMentors[], supervisors[], helpers[], floaters[],
 *   beginningStaff[], intermediateStaff[], advancedStaff[],
 *   status
 *
 * classAssignments/{assignmentId}
 *   classId, memberId, classRole, status, notes, sessionId,
 *   createdAt, updatedAt
 *
 * announcements, tasks, trainingEvents, resources — supporting org ops
 *
 * Security notes:
 * - Auth via Firebase Auth (Google + email/password)
 * - Never store Zoom account passwords in the app — meeting links only
 * - Role permissions resolved from roles collection
 */

export const COLLECTIONS = {
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
} as const;
