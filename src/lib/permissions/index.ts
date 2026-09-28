import type { Permission, Role, RoleKey } from "@/types";

/** Default system roles — seeded into Firestore, not hardcoded in UI logic */
export const SYSTEM_ROLES: Role[] = [
  {
    id: "role_admin",
    key: "admin",
    name: "Admin",
    description: "Full platform access and member management",
    scope: "organization",
    permissions: [
      "members:read",
      "members:write",
      "members:invite",
      "members:roles",
      "classes:read",
      "classes:write",
      "classes:assign",
      "attendance:read",
      "attendance:write",
      "resources:read",
      "resources:write",
      "announcements:read",
      "announcements:write",
      "admin:access",
      "admin:analytics",
      "admin:sessions",
      "training:manage",
      "profile:edit_own",
      "profile:edit_any",
    ],
    color: "#C9A96E",
    isSystem: true,
    sortOrder: 0,
  },
  {
    id: "role_core_team",
    key: "core_team",
    name: "Core Team",
    description: "Leadership and organizational oversight",
    scope: "organization",
    permissions: [
      "members:read",
      "members:write",
      "classes:read",
      "classes:write",
      "classes:assign",
      "attendance:read",
      "attendance:write",
      "resources:read",
      "resources:write",
      "announcements:read",
      "announcements:write",
      "admin:access",
      "admin:analytics",
      "training:manage",
      "profile:edit_own",
    ],
    color: "#8BA3B8",
    isSystem: true,
    sortOrder: 1,
  },
  {
    id: "role_lead_teacher",
    key: "lead_teacher",
    name: "Lead Teacher",
    description: "Owns class curriculum and staffing for assigned classes",
    scope: "both",
    permissions: [
      "members:read",
      "classes:read",
      "classes:write",
      "classes:assign",
      "attendance:read",
      "attendance:write",
      "resources:read",
      "resources:write",
      "announcements:read",
      "profile:edit_own",
    ],
    color: "#7EB8A0",
    isSystem: true,
    sortOrder: 2,
  },
  {
    id: "role_teacher",
    key: "teacher",
    name: "Teacher",
    description: "Teaches classes and marks attendance",
    scope: "both",
    permissions: [
      "members:read",
      "classes:read",
      "attendance:read",
      "attendance:write",
      "resources:read",
      "announcements:read",
      "profile:edit_own",
    ],
    color: "#6BA3A0",
    isSystem: true,
    sortOrder: 3,
  },
  {
    id: "role_senior_mentor",
    key: "senior_mentor",
    name: "Senior Mentor",
    description: "Experienced mentor supporting teachers and students",
    scope: "both",
    permissions: [
      "members:read",
      "classes:read",
      "attendance:read",
      "attendance:write",
      "resources:read",
      "announcements:read",
      "profile:edit_own",
    ],
    color: "#9B8EC4",
    isSystem: true,
    sortOrder: 4,
  },
  {
    id: "role_mentor",
    key: "mentor",
    name: "Mentor",
    description: "Supports students during class sessions",
    scope: "both",
    permissions: [
      "members:read",
      "classes:read",
      "attendance:read",
      "resources:read",
      "announcements:read",
      "profile:edit_own",
    ],
    color: "#A89BC8",
    isSystem: true,
    sortOrder: 5,
  },
  {
    id: "role_floater",
    key: "floater",
    name: "Floater",
    description: "Flexible helper across multiple classes",
    scope: "both",
    permissions: [
      "members:read",
      "classes:read",
      "resources:read",
      "announcements:read",
      "profile:edit_own",
    ],
    color: "#B8A99A",
    isSystem: true,
    sortOrder: 6,
  },
  {
    id: "role_helper",
    key: "helper",
    name: "Helper",
    description: "Assists with class logistics and setup",
    scope: "both",
    permissions: [
      "members:read",
      "classes:read",
      "resources:read",
      "announcements:read",
      "profile:edit_own",
    ],
    color: "#A0A8B0",
    isSystem: true,
    sortOrder: 7,
  },
  {
    id: "role_volunteer",
    key: "volunteer",
    name: "Volunteer",
    description: "General organization member",
    scope: "organization",
    permissions: [
      "members:read",
      "classes:read",
      "resources:read",
      "announcements:read",
      "profile:edit_own",
    ],
    color: "#8A9098",
    isSystem: true,
    sortOrder: 8,
  },
];

/** Custom title-style roles admins can assign (org-level labels) */
export const CUSTOM_ROLE_SEEDS: Role[] = [
  {
    id: "role_vp_marketing",
    key: "custom",
    name: "VP of Marketing",
    description: "Leads marketing strategy and brand",
    scope: "organization",
    permissions: [
      "members:read",
      "classes:read",
      "resources:read",
      "resources:write",
      "announcements:read",
      "announcements:write",
      "profile:edit_own",
    ],
    color: "#D4A574",
    isSystem: false,
    sortOrder: 20,
  },
  {
    id: "role_vp_outreach",
    key: "custom",
    name: "VP of Outreach",
    description: "Leads community and school outreach",
    scope: "organization",
    permissions: [
      "members:read",
      "classes:read",
      "resources:read",
      "announcements:read",
      "announcements:write",
      "profile:edit_own",
    ],
    color: "#74A8D4",
    isSystem: false,
    sortOrder: 21,
  },
  {
    id: "role_curriculum",
    key: "custom",
    name: "Robotics Curriculum Team",
    description: "Develops robotics curriculum and materials",
    scope: "organization",
    permissions: [
      "members:read",
      "classes:read",
      "resources:read",
      "resources:write",
      "announcements:read",
      "profile:edit_own",
    ],
    color: "#74D4A8",
    isSystem: false,
    sortOrder: 22,
  },
];

export const ALL_ROLES: Role[] = [...SYSTEM_ROLES, ...CUSTOM_ROLE_SEEDS];

export function getRoleById(id: string): Role | undefined {
  return ALL_ROLES.find((r) => r.id === id);
}

export function getRolesByIds(ids: string[]): Role[] {
  return ids
    .map(getRoleById)
    .filter((r): r is Role => Boolean(r))
    .sort((a, b) => a.sortOrder - b.sortOrder);
}

export function collectPermissions(roleIds: string[]): Set<Permission> {
  const set = new Set<Permission>();
  for (const role of getRolesByIds(roleIds)) {
    for (const p of role.permissions) set.add(p);
  }
  return set;
}

export function hasPermission(
  roleIds: string[],
  permission: Permission
): boolean {
  return collectPermissions(roleIds).has(permission);
}

export function hasAnyPermission(
  roleIds: string[],
  permissions: Permission[]
): boolean {
  const set = collectPermissions(roleIds);
  return permissions.some((p) => set.has(p));
}

export function isAdmin(roleIds: string[]): boolean {
  return hasPermission(roleIds, "admin:access");
}

export function displayName(
  member: { fullName: string; preferredName?: string },
  preferPreferred = true
): string {
  if (preferPreferred && member.preferredName) return member.preferredName;
  return member.fullName;
}

export function initials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

export function roleKeyLabel(key: RoleKey | string): string {
  return key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}
