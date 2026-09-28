"use client";

import Link from "next/link";
import { format } from "date-fns";
import {
  Video,
  ClipboardList,
  FolderOpen,
  CalendarPlus,
  ExternalLink,
} from "lucide-react";
import { useAuth } from "@/lib/auth/AuthProvider";
import { assignmentsForMember, getClass } from "@/data/seed";
import { displayName } from "@/lib/permissions";
import { PageHeader, SectionLabel } from "@/components/ui/PageHeader";
import { GlassCard } from "@/components/ui/GlassCard";
import { TeamEventCard } from "@/components/events/TeamEventCard";
import { useTeamEvents } from "@/lib/events/store";
import {
  googleCalendarUrlForClass,
  isTeamEventOnDay,
  nextClassOccurrence,
  todayDayName,
} from "@/lib/calendar";
import type { ClassEntity } from "@/types";

export default function DashboardPage() {
  const { member } = useAuth();
  const eventsForTeams = useTeamEvents((s) => s.eventsForTeams);

  if (!member) return null;

  const name = displayName(member);
  const today = new Date();
  const dayName = todayDayName(today);

  const myAssignments = assignmentsForMember(member.id);
  const todaysClasses = myAssignments
    .map((a) => ({ assignment: a, cls: getClass(a.classId) }))
    .filter(
      (x): x is { assignment: (typeof myAssignments)[number]; cls: ClassEntity } =>
        Boolean(x.cls && x.cls.dayOfWeek === dayName && x.cls.status === "active")
    );

  const todaysMeetings = eventsForTeams(member.teamIds).filter((e) =>
    isTeamEventOnDay(e, today)
  );

  const hasAnything = todaysClasses.length > 0 || todaysMeetings.length > 0;

  return (
    <div>
      <PageHeader
        title={`Hi, ${name.split(" ")[0]}`}
        description={format(today, "EEEE, MMMM d")}
      />

      {!hasAnything ? (
        <GlassCard className="py-10 text-center">
          <p className="text-sm text-secondary">
            No classes or meetings scheduled today.
          </p>
          <div className="mt-4 flex flex-wrap justify-center gap-3 text-sm">
            <Link href="/meetings" className="text-[var(--text-primary)] underline underline-offset-2">
              View all meetings
            </Link>
            <Link href="/classes" className="text-secondary underline underline-offset-2">
              My classes
            </Link>
          </div>
        </GlassCard>
      ) : (
        <div className="space-y-8">
          {todaysClasses.length > 0 && (
            <section>
              <SectionLabel>Classes today</SectionLabel>
              <div className="flex flex-col gap-3">
                {todaysClasses.map(({ cls, assignment }) => (
                  <TodayClassCard
                    key={cls.id}
                    cls={cls}
                    role={assignment.classRole}
                  />
                ))}
              </div>
            </section>
          )}

          {todaysMeetings.length > 0 && (
            <section>
              <SectionLabel>Meetings today</SectionLabel>
              <div className="flex flex-col gap-3">
                {todaysMeetings.map((event) => (
                  <TeamEventCard key={event.id} event={event} />
                ))}
              </div>
            </section>
          )}
        </div>
      )}

      <div className="mt-8 flex flex-wrap gap-x-4 gap-y-2 text-sm text-secondary">
        <Link href="/meetings" className="hover:text-[var(--text-primary)]">
          All meetings →
        </Link>
        <Link href="/classes" className="hover:text-[var(--text-primary)]">
          My classes →
        </Link>
        <Link href="/teams" className="hover:text-[var(--text-primary)]">
          Teams →
        </Link>
      </div>
    </div>
  );
}

function TodayClassCard({
  cls,
  role,
}: {
  cls: ClassEntity;
  role: string;
}) {
  const start = nextClassOccurrence(cls.dayOfWeek, 10, 0);
  const end = new Date(start.getTime() + 90 * 60 * 1000);
  const gcal = googleCalendarUrlForClass({
    title: `CENG ${cls.name} (${cls.sessionLabel})`,
    description: `Attendance: ${cls.attendanceSheetUrl}\nCurriculum: ${cls.curriculumFolderUrl}`,
    zoomLink: cls.zoomLink,
    startsAt: start.toISOString(),
    endsAt: end.toISOString(),
    recurringUntil: "2026-11-21",
  });

  return (
    <GlassCard>
      <p className="text-xs text-tertiary">
        {cls.sessionLabel} · {cls.dayOfWeek}
      </p>
      <h2 className="mt-1 text-lg font-medium">{cls.name}</h2>
      <p className="mt-1 text-xs capitalize text-tertiary">
        Your role · {role.replace(/_/g, " ")}
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        <a
          href={cls.zoomLink}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex h-9 items-center gap-1.5 rounded-[var(--radius-sm)] bg-[var(--accent)] px-3 text-sm font-medium text-[var(--text-inverse)] hover:opacity-90"
        >
          <Video className="h-3.5 w-3.5" />
          Join Zoom
        </a>
        <a
          href={cls.attendanceSheetUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex h-9 items-center gap-1.5 rounded-[var(--radius-sm)] border border-[var(--border)] px-3 text-sm hover:bg-[var(--surface-hover)]"
        >
          <ClipboardList className="h-3.5 w-3.5" />
          Attendance
        </a>
        <a
          href={cls.curriculumFolderUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex h-9 items-center gap-1.5 rounded-[var(--radius-sm)] border border-[var(--border)] px-3 text-sm hover:bg-[var(--surface-hover)]"
        >
          <FolderOpen className="h-3.5 w-3.5" />
          Curriculum
        </a>
        <a
          href={gcal}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex h-9 items-center gap-1.5 rounded-[var(--radius-sm)] border border-[var(--border)] px-3 text-sm hover:bg-[var(--surface-hover)]"
        >
          <CalendarPlus className="h-3.5 w-3.5" />
          Google Calendar
        </a>
        <Link
          href={`/classes/${cls.id}`}
          className="inline-flex h-9 items-center gap-1 px-2 text-sm text-secondary hover:text-[var(--text-primary)]"
        >
          Class screen <ExternalLink className="h-3 w-3" />
        </Link>
      </div>
    </GlassCard>
  );
}
