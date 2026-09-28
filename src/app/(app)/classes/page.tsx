"use client";

import Link from "next/link";
import { useAuth } from "@/lib/auth/AuthProvider";
import { CLASSES, assignmentsForMember } from "@/data/seed";
import { PageHeader } from "@/components/ui/PageHeader";

export default function ClassesPage() {
  const { member } = useAuth();
  if (!member) return null;

  const mine = assignmentsForMember(member.id);
  const myClassIds = new Set(mine.map((a) => a.classId));
  const myClasses = CLASSES.filter((c) => myClassIds.has(c.id));
  const list =
    myClasses.length > 0
      ? myClasses
      : CLASSES.filter((c) => c.status === "active");
  const showingAll = myClasses.length === 0;

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

      {showingAll && (
        <p className="mb-4 text-xs text-tertiary">
          Showing all Fall classes (no personal assignments in this demo account beyond what’s linked).
        </p>
      )}

      {Object.entries(grouped).map(([session, classes]) => (
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
                  <span className="shrink-0 text-xs text-tertiary">Open →</span>
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
