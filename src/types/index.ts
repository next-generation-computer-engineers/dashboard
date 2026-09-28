/** CENG Volunteer Platform — core domain types */

export type MemberStatus = "active" | "inactive" | "pending" | "alumni";
export type OnboardingStatus =
  | "not_started"
  | "in_progress"
  | "complete"
  | "needs_review";

export type ClassAssignmentStatus =
  | "confirmed"
  | "substitute"
  | "absent"
  | "shadow"
  | "pending";

export type AttendanceStatus =
  | "present"
  | "absent"
  | "late"
  | "excused"
  | "unmarked";

export type TaskStatus = "todo" | "in_progress" | "done" | "blocked";
export type TaskPriority = "low" | "medium" | "high";

/** Organization-level role keys — stored in Firestore `roles` collection */
export type RoleKey =
  | "admin"
  | "core_team"
  | "volunteer"
  | "teacher"
  | "lead_teacher"
  | "mentor"
  | "senior_mentor"
  | "floater"
  | "helper"
  | "custom";

export type ClassRoleKey =
  | "lead_teacher"
  | "teacher"
  | "mentor"
  | "senior_mentor"
  | "helper"
  | "floater"
  | "shadow"
  | "substitute";

export interface Role {
  id: string;
  key: RoleKey;
  name: string;
  description: string;
  scope: "organization" | "class" | "both";
  permissions: Permission[];
  color: string;
  isSystem: boolean;
  sortOrder: number;
}

export type Permission =
  | "members:read"
  | "members:write"
  | "members:invite"
  | "members:roles"
  | "classes:read"
  | "classes:write"
  | "classes:assign"
  | "attendance:read"
  | "attendance:write"
  | "resources:read"
  | "resources:write"
  | "announcements:read"
  | "announcements:write"
  | "admin:access"
  | "admin:analytics"
  | "admin:sessions"
  | "training:manage"
  | "profile:edit_own"
  | "profile:edit_any";

export interface Member {
  id: string;
  authUid: string;
  fullName: string;
  preferredName?: string;
  bio?: string;
  pfpUrl?: string;
  /** Home / personal email — either this or schoolEmail works at sign-in */
  personalEmail: string;
  /** School email — either this or personalEmail works at sign-in */
  schoolEmail?: string;
  /** Optional CENG org email (@cengclass.org) if assigned */
  cengEmail?: string;
  /** Extra org emails that should also resolve to this profile (e.g. contact@) */
  cengEmailAliases?: string[];
  phone?: string;
  school?: string;
  grade?: string;
  affiliation?: string;
  linkedIn?: string;
  portfolio?: string;
  /** Global org role IDs */
  roleIds: string[];
  /** Team IDs */
  teamIds: string[];
  status: MemberStatus;
  onboardingStatus: OnboardingStatus;
  /** Denormalized for directory search */
  searchKeywords: string[];
  title?: string;
  joinedAt: string;
  updatedAt: string;
  createdAt: string;
}

export interface Team {
  id: string;
  name: string;
  slug: string;
  description: string;
  leadIds: string[];
  memberIds: string[];
  color: string;
  icon?: string;
}

export interface TeamEventMaterial {
  id: string;
  title: string;
  url: string;
  type?: "doc" | "slide" | "sheet" | "drive" | "link" | "file";
}

export interface TeamEvent {
  id: string;
  teamId: string;
  title: string;
  description?: string;
  /** ISO datetime */
  startsAt: string;
  /** ISO datetime */
  endsAt?: string;
  zoomLink?: string;
  location?: string;
  materials: TeamEventMaterial[];
  /** If set, weekly recurrence until this date (YYYY-MM-DD) */
  recurringUntil?: string;
  createdBy: string;
  createdAt: string;
}

export interface Session {
  id: string;
  name: string;
  season: string;
  year: number;
  startDate: string;
  endDate: string;
  isActive: boolean;
}

export interface ClassEntity {
  id: string;
  sessionId: string;
  name: string;
  subject: string;
  /** e.g. Fall 1, Fall 2 */
  sessionLabel: string;
  dayOfWeek: string;
  timeStart?: string;
  timeEnd?: string;
  dateRange: string;
  studentCountLabel?: string;
  zoomLink: string;
  zoomMeetingId?: string;
  /** Google Sheet — attendance */
  attendanceSheetUrl: string;
  /** Google Drive — lesson / curriculum folder */
  curriculumFolderUrl: string;
  /** Google Drive — session class folder */
  classFolderUrl?: string;
  whatsappUrl?: string;
  parentPresentationUrl?: string;
  parentEmailDocUrl?: string;
  registrationFormUrl?: string;
  icebreakersUrl?: string;
  officeHoursUrl?: string;
  description?: string;
  status: "active" | "draft" | "archived";
  /** Display names from staffing sheet (not always app users yet) */
  leadTeachers: string[];
  seniorMentors: string[];
  supervisors: string[];
  helpers: string[];
  floaters: string[];
  beginningStaff: string[];
  intermediateStaff: string[];
  advancedStaff: string[];
}


export interface ClassAssignment {
  id: string;
  classId: string;
  memberId: string;
  classRole: ClassRoleKey;
  status: ClassAssignmentStatus;
  notes?: string;
  sessionId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Student {
  id: string;
  fullName: string;
  preferredName?: string;
  grade?: string;
  school?: string;
  guardianEmail?: string;
  guardianPhone?: string;
  notes?: string;
  classIds: string[];
}

export interface Enrollment {
  id: string;
  studentId: string;
  classId: string;
  sessionId: string;
  status: "enrolled" | "waitlist" | "dropped";
}

export interface AttendanceRecord {
  id: string;
  classId: string;
  date: string;
  /** memberId or studentId */
  subjectId: string;
  subjectType: "member" | "student";
  status: AttendanceStatus;
  markedBy: string;
  notes?: string;
  markedAt: string;
}

export interface Resource {
  id: string;
  title: string;
  description?: string;
  type: "doc" | "slide" | "video" | "link" | "file";
  url: string;
  classIds?: string[];
  teamIds?: string[];
  tags: string[];
  createdBy: string;
  createdAt: string;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  assigneeIds: string[];
  dueDate?: string;
  status: TaskStatus;
  priority: TaskPriority;
  classId?: string;
  teamId?: string;
  createdBy: string;
  createdAt: string;
}

export interface Announcement {
  id: string;
  title: string;
  body: string;
  authorId: string;
  audience: "all" | "admins" | "teachers" | "team" | "class";
  audienceId?: string;
  pinned: boolean;
  createdAt: string;
  expiresAt?: string;
}

export interface TrainingEvent {
  id: string;
  title: string;
  description: string;
  type: "orientation" | "workshop" | "office_hours" | "certification";
  date: string;
  location?: string;
  zoomLink?: string;
  required: boolean;
  completedBy: string[];
}

export interface Meeting {
  id: string;
  title: string;
  date: string;
  time: string;
  location?: string;
  zoomLink?: string;
  teamId?: string;
}

/** Resolved member with role objects for UI */
export interface MemberWithRoles extends Member {
  roles: Role[];
  teams: Team[];
  classAssignments: (ClassAssignment & { classEntity?: ClassEntity })[];
}

export interface DirectoryFilters {
  query: string;
  roleId?: string;
  teamId?: string;
  classId?: string;
  status?: MemberStatus | "all";
}
