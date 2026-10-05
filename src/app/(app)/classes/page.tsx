"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { format } from "date-fns";
import { useAuth } from "@/lib/auth/AuthProvider";
import { CLASSES } from "@/data/seed";
import { useClassAssignments } from "@/lib/classes/assignmentsStore";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { ClassListItem } from "@/components/dashboard/ClassListItem";
import { nextClassOccurrence } from "@/lib/calendar";

export default function ClassesPage() {
  const { member } = useAuth();
  const allAssignments = useClassAssignments((s) => s.assignments);
  const [query, setQuery] = useState("");

  const mine = useMemo(
    () =>
      member
        ? allAssignments.filter((a) => a.memberId === member.id)
        : [],
    [allAssignments, member]
  );

  const list = useMemo(() => {
    const myClassIds = new Set(mine.map((a) => a.classId));
    return CLASSES.filter((c) => myClassIds.has(c.id));
  }, [mine]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return list;
    return list.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.sessionLabel.toLowerCase().includes(q) ||
        c.dayOfWeek.toLowerCase().includes(q) ||
        c.subject.toLowerCase().includes(q)
    );
  }, [list, query]);

  const grouped = useMemo(() => {
    const map: Record<string, typeof filtered> = {};
    for (const c of filtered) {
      const key = `${c.sessionLabel} · ${c.dayOfWeek}`;
      (map[key] ??= []).push(c);
    }
    return map;
  }, [filtered]);

  if (!member) return null;

  return (
    <div>
      <PageHeader
        compact
        title="My Classes"
        description="Schedules, materials, attendance, and your role for each class."
      />

      {list.length > 0 && (
        <div className="relative mb-5 max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-tertiary" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search classes…"
            className="input-field pl-9"
            aria-label="Search classes"
          />
        </div>
      )}

      {list.length === 0 ? (
        <EmptyState
          title="No class assignments yet"
          description="An admin can add you from Admin → Staffing. Once assigned, Zoom, attendance, and curriculum will appear here."
          action={
            <Link
              href="/teams"
              className="text-[13px] font-medium text-[var(--accent)] hover:underline"
            >
              Browse opportunities
            </Link>
          }
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          title="No matching classes"
          description="Try a different search term."
        />
      ) : (
        Object.entries(grouped).map(([session, classes]) => (
          <div key={session} className="mb-6">
            <h2 className="mb-2.5 text-[11px] font-medium uppercase tracking-wider text-tertiary">
              {session}
            </h2>
            <div className="flex flex-col gap-2">
              {classes.map((cls) => {
                const assignment = mine.find((a) => a.classId === cls.id);
                const next = nextClassOccurrence(cls.dayOfWeek, 10, 0);
                return (
                  <ClassListItem
                    key={cls.id}
                    href={`/classes/${cls.id}`}
                    name={cls.name}
                    meta={`${cls.dateRange}${
                      cls.studentCountLabel ? ` · ${cls.studentCountLabel}` : ""
                    }`}
                    role={assignment?.classRole}
                    nextMeeting={`Next ${format(next, "EEE MMM d")}`}
                    materialsHref={cls.curriculumFolderUrl}
                  />
                );
              })}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
