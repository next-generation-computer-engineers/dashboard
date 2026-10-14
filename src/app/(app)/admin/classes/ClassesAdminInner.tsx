"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  BookOpen,
  ExternalLink,
  Save,
  UserPlus,
} from "lucide-react";
import { useAuth } from "@/lib/auth/AuthProvider";
import { useMembers } from "@/lib/members/MembersProvider";
import { useSessions } from "@/lib/sessions/SessionsProvider";
import { useClassAssignments } from "@/lib/classes/assignmentsStore";
import { hasPermission, displayName } from "@/lib/permissions";
import { PageHeader, SectionLabel } from "@/components/ui/PageHeader";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/Button";
import { Avatar } from "@/components/ui/Avatar";
import { apiFetch } from "@/lib/api/client";
import { cn } from "@/lib/utils";
import type { ClassEntity, ClassRoleKey } from "@/types";

const CLASS_ROLES: { value: ClassRoleKey; label: string }[] = [
  { value: "lead_teacher", label: "Lead teacher" },
  { value: "teacher", label: "Teacher" },
  { value: "senior_mentor", label: "Senior mentor" },
  { value: "mentor", label: "Mentor" },
  { value: "helper", label: "Helper" },
  { value: "floater", label: "Floater" },
  { value: "shadow", label: "Shadow" },
  { value: "substitute", label: "Substitute" },
];

const LEVEL_FIELDS: {
  key: keyof Pick<
    ClassEntity,
    | "leadTeachers"
    | "seniorMentors"
    | "supervisors"
    | "helpers"
    | "floaters"
    | "beginningStaff"
    | "intermediateStaff"
    | "advancedStaff"
  >;
  label: string;
}[] = [
  { key: "leadTeachers", label: "Lead teachers" },
  { key: "seniorMentors", label: "Senior mentors" },
  { key: "supervisors", label: "Supervisors" },
  { key: "helpers", label: "Helpers" },
  { key: "floaters", label: "Floaters" },
  { key: "beginningStaff", label: "Beginning level" },
  { key: "intermediateStaff", label: "Intermediate level" },
  { key: "advancedStaff", label: "Advanced level" },
];

function listToText(arr: string[]) {
  return arr.join(", ");
}
function textToList(s: string) {
  return s
    .split(/[,;/|]+/)
    .map((x) => x.trim())
    .filter(Boolean);
}

export default function AdminClassesPage() {
  const searchParams = useSearchParams();
  const { member } = useAuth();
  const { members } = useMembers();
  const { sessions, classes, activeSession, saveClass } = useSessions();
  const assignments = useClassAssignments((s) => s.assignments);
  const addAssignment = useClassAssignments((s) => s.addAssignment);
  const removeAssignment = useClassAssignments((s) => s.removeAssignment);

  const canManage =
    member &&
    (hasPermission(member.roleIds, "admin:access") ||
      hasPermission(member.roleIds, "classes:write") ||
      hasPermission(member.roleIds, "classes:assign") ||
      hasPermission(member.roleIds, "admin:sessions"));

  const [sessionFilter, setSessionFilter] = useState(
    () => activeSession?.id ?? sessions[0]?.id ?? ""
  );
  const [selectedId, setSelectedId] = useState<string | null>(
    searchParams.get("class")
  );
  const [query, setQuery] = useState("");
  const [draft, setDraft] = useState<ClassEntity | null>(null);
  const [staffMemberId, setStaffMemberId] = useState("");
  const [staffRole, setStaffRole] = useState<ClassRoleKey>("mentor");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  useEffect(() => {
    const fromUrl = searchParams.get("class");
    if (fromUrl) setSelectedId(fromUrl);
  }, [searchParams]);

  useEffect(() => {
    if (!sessionFilter && activeSession?.id) {
      setSessionFilter(activeSession.id);
    }
  }, [activeSession, sessionFilter]);

  const filtered = useMemo(() => {
    let rows = classes;
    if (sessionFilter) {
      rows = rows.filter((c) => c.sessionId === sessionFilter);
    }
    const q = query.trim().toLowerCase();
    if (q) {
      rows = rows.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.subject.toLowerCase().includes(q) ||
          c.sessionLabel.toLowerCase().includes(q) ||
          c.dayOfWeek.toLowerCase().includes(q) ||
          c.leadTeachers.some((n) => n.toLowerCase().includes(q))
      );
    }
    return [...rows].sort(
      (a, b) =>
        a.sessionLabel.localeCompare(b.sessionLabel) ||
        a.dayOfWeek.localeCompare(b.dayOfWeek) ||
        a.name.localeCompare(b.name)
    );
  }, [classes, sessionFilter, query]);

  const selected = selectedId
    ? classes.find((c) => c.id === selectedId) ?? null
    : null;

  useEffect(() => {
    if (selected) setDraft({ ...selected });
    else setDraft(null);
  }, [selected]);

  const classAssignments = selected
    ? assignments.filter((a) => a.classId === selected.id)
    : [];

  if (member && !canManage) {
    return (
      <p className="text-sm text-secondary">
        You don’t have permission to manage classes.
      </p>
    );
  }

  async function onSave() {
    if (!draft) return;
    setBusy(true);
    setErr("");
    try {
      await saveClass(draft);
      setMsg(`Saved ${draft.name}.`);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Save failed");
    } finally {
      setBusy(false);
    }
  }

  async function onAssign() {
    if (!selected || !staffMemberId) return;
    setBusy(true);
    setErr("");
    try {
      const assignment = addAssignment({
        classId: selected.id,
        memberId: staffMemberId,
        classRole: staffRole,
        sessionId: selected.sessionId,
      });
      try {
        await apiFetch(`/api/classes/${selected.id}/assign`, {
          method: "POST",
          json: {
            memberId: staffMemberId,
            classRole: staffRole,
            sessionId: selected.sessionId,
          },
        });
      } catch {
        /* local store already updated */
      }
      setStaffMemberId("");
      setMsg(`Assigned volunteer (${assignment.classRole.replace(/_/g, " ")}).`);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Assign failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Admin"
        title="Classes overview"
        description="Browse every class, edit links and level staffing, and assign dashboard volunteers."
      />

      <div className="flex flex-wrap gap-2">
        <Link href="/admin/sessions">
          <Button size="sm" variant="secondary">
            Manage sessions
          </Button>
        </Link>
        {activeSession && (
          <Link href={`/admin/sessions/${activeSession.id}`}>
            <Button size="sm" variant="ghost">
              Import into {activeSession.name}
            </Button>
          </Link>
        )}
      </div>

      {msg && (
        <p className="rounded-[var(--radius-sm)] bg-[var(--success-soft)] px-3 py-2 text-[13px] text-[var(--success)]">
          {msg}
        </p>
      )}
      {err && (
        <p className="rounded-[var(--radius-sm)] bg-[var(--danger-soft)] px-3 py-2 text-[13px] text-[var(--danger)]">
          {err}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <select
          value={sessionFilter}
          onChange={(e) => setSessionFilter(e.target.value)}
          className="h-9 rounded-[var(--radius-sm)] border border-[var(--border)] bg-transparent px-3 text-sm"
        >
          <option value="">All sessions</option>
          {sessions.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
              {s.isActive ? " (active)" : ""}
            </option>
          ))}
        </select>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search classes…"
          className="h-9 w-full max-w-xs rounded-[var(--radius-sm)] border border-[var(--border)] bg-transparent px-3 text-sm outline-none focus:border-[var(--accent)]"
        />
        <span className="text-[12px] text-tertiary">
          {filtered.length} class{filtered.length === 1 ? "" : "es"}
        </span>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
        <GlassCard padding={false} className="max-h-[70vh] overflow-y-auto">
          {filtered.length === 0 ? (
            <p className="px-5 py-10 text-center text-sm text-secondary">
              No classes match.
            </p>
          ) : (
            <ul className="divide-y divide-[var(--border)]">
              {filtered.map((c) => {
                const staffed = assignments.filter(
                  (a) => a.classId === c.id
                ).length;
                return (
                  <li key={c.id}>
                    <button
                      type="button"
                      onClick={() => setSelectedId(c.id)}
                      className={cn(
                        "flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-[var(--surface-hover)]",
                        selectedId === c.id && "bg-[var(--accent-soft)]"
                      )}
                    >
                      <BookOpen className="mt-0.5 h-4 w-4 shrink-0 text-[var(--accent)]" />
                      <div className="min-w-0">
                        <p className="text-sm font-medium">{c.name}</p>
                        <p className="text-[11px] text-tertiary">
                          {c.sessionLabel} · {c.dayOfWeek} · {staffed} assigned
                        </p>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </GlassCard>

        <div className="space-y-4">
          {!draft ? (
            <GlassCard>
              <p className="text-sm text-secondary">
                Select a class to edit links, levels, and staffing.
              </p>
            </GlassCard>
          ) : (
            <>
              <GlassCard className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-xs text-tertiary">{draft.sessionLabel}</p>
                    <h2 className="text-lg font-medium tracking-tight">
                      {draft.name}
                    </h2>
                  </div>
                  <Link href={`/classes/${draft.id}`}>
                    <Button size="sm" variant="ghost">
                      Open
                    </Button>
                  </Link>
                </div>

                <div className="grid gap-2 sm:grid-cols-2">
                  {(
                    [
                      ["name", "Name"],
                      ["subject", "Subject"],
                      ["sessionLabel", "Block / label"],
                      ["dayOfWeek", "Day"],
                      ["dateRange", "Date range"],
                      ["studentCountLabel", "Students"],
                      ["zoomLink", "Zoom link"],
                      ["zoomMeetingId", "Zoom meeting ID"],
                      ["attendanceSheetUrl", "Attendance sheet"],
                      ["curriculumFolderUrl", "Curriculum folder"],
                      ["classFolderUrl", "Class folder"],
                      ["whatsappUrl", "WhatsApp"],
                      ["parentPresentationUrl", "Parent presentation"],
                      ["parentEmailDocUrl", "Parent email doc"],
                      ["registrationFormUrl", "Registration form"],
                    ] as const
                  ).map(([key, label]) => (
                    <label key={key} className="block sm:col-span-1">
                      <span className="mb-1 block text-[11px] text-tertiary">
                        {label}
                      </span>
                      <input
                        value={(draft[key] as string | undefined) ?? ""}
                        onChange={(e) =>
                          setDraft({ ...draft, [key]: e.target.value })
                        }
                        className="h-8 w-full rounded-[var(--radius-sm)] border border-[var(--border)] bg-transparent px-2 text-[13px] outline-none focus:border-[var(--accent)]"
                      />
                    </label>
                  ))}
                </div>

                <SectionLabel>Level staffing (names from sheet)</SectionLabel>
                <div className="grid gap-2">
                  {LEVEL_FIELDS.map(({ key, label }) => (
                    <label key={key} className="block">
                      <span className="mb-1 block text-[11px] text-tertiary">
                        {label}
                      </span>
                      <input
                        value={listToText(draft[key] ?? [])}
                        onChange={(e) =>
                          setDraft({
                            ...draft,
                            [key]: textToList(e.target.value),
                          })
                        }
                        placeholder="Comma-separated names"
                        className="h-8 w-full rounded-[var(--radius-sm)] border border-[var(--border)] bg-transparent px-2 text-[13px] outline-none focus:border-[var(--accent)]"
                      />
                    </label>
                  ))}
                </div>

                <Button size="md" loading={busy} onClick={() => void onSave()}>
                  <Save className="h-3.5 w-3.5" />
                  Save class
                </Button>
              </GlassCard>

              <GlassCard className="space-y-3">
                <SectionLabel>Dashboard assignments</SectionLabel>
                <p className="text-[12px] text-secondary">
                  Link roster volunteers to this class with a role (for Home /
                  My Classes).
                </p>
                <div className="grid gap-2 sm:grid-cols-[1fr_auto_auto]">
                  <select
                    value={staffMemberId}
                    onChange={(e) => setStaffMemberId(e.target.value)}
                    className="h-9 rounded-[var(--radius-sm)] border border-[var(--border)] bg-transparent px-2 text-sm"
                  >
                    <option value="">Select volunteer…</option>
                    {members
                      .filter(
                        (m) =>
                          m.status === "active" &&
                          !classAssignments.some((a) => a.memberId === m.id)
                      )
                      .sort((a, b) => a.fullName.localeCompare(b.fullName))
                      .map((m) => (
                        <option key={m.id} value={m.id}>
                          {displayName(m)}
                        </option>
                      ))}
                  </select>
                  <select
                    value={staffRole}
                    onChange={(e) =>
                      setStaffRole(e.target.value as ClassRoleKey)
                    }
                    className="h-9 rounded-[var(--radius-sm)] border border-[var(--border)] bg-transparent px-2 text-sm"
                  >
                    {CLASS_ROLES.map((r) => (
                      <option key={r.value} value={r.value}>
                        {r.label}
                      </option>
                    ))}
                  </select>
                  <Button
                    size="sm"
                    disabled={!staffMemberId}
                    loading={busy}
                    onClick={() => void onAssign()}
                  >
                    <UserPlus className="h-3 w-3" />
                    Add
                  </Button>
                </div>

                <div className="space-y-2">
                  {classAssignments.length === 0 ? (
                    <p className="text-[13px] text-secondary">
                      No dashboard volunteers assigned yet.
                    </p>
                  ) : (
                    classAssignments.map((a) => {
                      const m = members.find((x) => x.id === a.memberId);
                      if (!m) return null;
                      return (
                        <div
                          key={a.id}
                          className="flex items-center justify-between gap-2 rounded-[var(--radius-sm)] border border-[var(--border)] px-3 py-2"
                        >
                          <div className="flex min-w-0 items-center gap-2">
                            <Avatar
                              name={displayName(m)}
                              src={m.pfpUrl}
                              size="sm"
                            />
                            <div className="min-w-0">
                              <p className="truncate text-sm">
                                {displayName(m)}
                              </p>
                              <p className="text-[11px] capitalize text-tertiary">
                                {a.classRole.replace(/_/g, " ")}
                              </p>
                            </div>
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              removeAssignment(a.id);
                              void apiFetch(
                                `/api/classes/assignments/${a.id}`,
                                { method: "DELETE" }
                              ).catch(() => null);
                            }}
                          >
                            Remove
                          </Button>
                        </div>
                      );
                    })
                  )}
                </div>

                {draft.zoomLink && (
                  <a
                    href={draft.zoomLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[12px] text-[var(--accent)]"
                  >
                    <ExternalLink className="h-3 w-3" /> Open Zoom
                  </a>
                )}
              </GlassCard>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
