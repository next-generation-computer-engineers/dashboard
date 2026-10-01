"use client";

import Link from "next/link";
import { useAuth } from "@/lib/auth/AuthProvider";
import { CLASSES } from "@/data/seed";
import { useClassAssignments } from "@/lib/classes/assignmentsStore";
import { PageHeader } from "@/components/ui/PageHeader";

export default function ClassesPage() {
  const { member } = useAuth();
  const allAssignments = useClassAssignments((s) => s.assignments);
  if (!member) return null;

  const mine = allAssignments.filter((a) => a.memberId === member.id);
  const myClassIds = new Set(mine.map((a) => a.classId));
  const myClasses = CLASSES.filter((c) => myClassIds.has(c.id));
  const list = myClasses.length > 0 ? myClasses : [];
  const showingNone = list.length === 0;

  const grouped: Record<string, typeof list> = {};
  for (const c of list) {
    const key = `${c.sessionLabel} · ${c.dayOfWeek}`;
    (grouped[key] ??= []).push(c);
  }

  return (
    <div>
      <PageHeader
        title="My classes"
        description="Open a class for Zoom, attendance sheet, and curriculum."
      />

      {showingNone ? (
        <p className="rounded-[var(--radius-md)] border border-[var(--border)] px-4 py-10 text-center text-sm text-secondary">
          You’re not assigned to any classes yet. An admin can add you from
          Admin → Staffing.
        </p>
      ) : (
        Object.entries(grouped).map(([session, classes]) => (
          <div key={session} className="mb-8">
            <h2 className="mb-2 text-xs text-tertiary">{session}</h2>
            <div className="flex flex-col gap-2">
              {classes.map((cls) => {
                const assignment = mine.find((a) => a.classId === cls.id);
                return (
                  <Link
                    key={cls.id}
                    href={`/classes/${cls.id}`}
                    className="flex items-center justify-between gap-4 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] px-4 py-3.5 transition-colors hover:bg-[var(--surface-hover)]"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium">{cls.name}</p>
                      <p className="mt-0.5 text-xs text-tertiary">
                        {cls.dateRange}
                        {assignment
                          ? ` · ${assignment.classRole.replace(/_/g, " ")}`
                          : ""}
                        {cls.studentCountLabel
                          ? ` · ${cls.studentCountLabel}`
                          : ""}
                      </p>
                    </div>
                    <span className="shrink-0 text-xs text-tertiary">
                      Open →
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
