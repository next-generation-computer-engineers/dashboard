"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  Video,
  ClipboardList,
  FolderOpen,
  MessageCircle,
  Presentation,
  FileText,
  ExternalLink,
  CalendarPlus,
} from "lucide-react";
import { getClass } from "@/data/seed";
import { cn } from "@/lib/utils";
import {
  googleCalendarUrlForClass,
  nextClassOccurrence,
} from "@/lib/calendar";

export default function ClassDayPage() {
  const params = useParams<{ id: string }>();
  const cls = getClass(params.id);

  if (!cls) {
    return (
      <div className="py-16 text-center">
        <p className="text-lg">Class not found</p>
        <Link href="/classes" className="mt-3 inline-block text-sm text-secondary underline">
          Back to classes
        </Link>
      </div>
    );
  }

  const staffLines = [
    cls.supervisors.length > 0 && `Supervisor · ${cls.supervisors.join(", ")}`,
    cls.seniorMentors.length > 0 &&
      `Senior mentor · ${cls.seniorMentors.join(", ")}`,
    cls.leadTeachers.length > 0 &&
      `Lead teacher · ${cls.leadTeachers.join(", ")}`,
  ].filter(Boolean) as string[];

  return (
    <div className="mx-auto max-w-lg">
      <Link
        href="/classes"
        className="mb-8 inline-flex items-center gap-1.5 text-sm text-secondary hover:text-[var(--text-primary)]"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Classes
      </Link>

      <div className="mb-8">
        <p className="text-xs text-tertiary">
          {cls.sessionLabel} · {cls.dayOfWeek}
        </p>
        <h1 className="mt-1 text-2xl font-medium tracking-tight">
          {cls.name}
        </h1>
        <p className="mt-1 text-sm text-secondary">{cls.dateRange}</p>
        {cls.studentCountLabel && (
          <p className="mt-1 text-xs text-tertiary">{cls.studentCountLabel}</p>
        )}
      </div>

      <div className="space-y-2">
        <ActionLink
          href={cls.zoomLink}
          title="Join Zoom"
          subtitle={cls.zoomMeetingId ? `ID ${cls.zoomMeetingId}` : undefined}
          icon={<Video className="h-4 w-4" />}
          primary
        />
        <ActionLink
          href={cls.attendanceSheetUrl}
          title="Attendance sheet"
          subtitle="Google Sheet"
          icon={<ClipboardList className="h-4 w-4" />}
        />
        <ActionLink
          href={cls.curriculumFolderUrl}
          title="Curriculum"
          subtitle="Drive folder"
          icon={<FolderOpen className="h-4 w-4" />}
        />
        <a
          href={googleCalendarUrlForClass({
            title: `CENG ${cls.name} (${cls.sessionLabel})`,
            description: `Attendance: ${cls.attendanceSheetUrl}\nCurriculum: ${cls.curriculumFolderUrl}`,
            zoomLink: cls.zoomLink,
            startsAt: nextClassOccurrence(cls.dayOfWeek, 10, 0).toISOString(),
            endsAt: new Date(
              nextClassOccurrence(cls.dayOfWeek, 10, 0).getTime() +
                90 * 60 * 1000
            ).toISOString(),
            recurringUntil: "2026-11-21",
          })}
          target="_blank"
          rel="noopener noreferrer"
          className="flex w-full items-center gap-3 rounded-[var(--radius-md)] border border-[var(--border)] px-4 py-3.5 text-left transition-colors hover:bg-[var(--surface-hover)]"
        >
          <span className="text-secondary">
            <CalendarPlus className="h-4 w-4" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-medium">Google Calendar</span>
            <span className="mt-0.5 block text-xs text-tertiary">
              Add weekly class
            </span>
          </span>
          <ExternalLink className="h-3.5 w-3.5 text-tertiary" />
        </a>
      </div>

      {staffLines.length > 0 && (
        <div className="mt-8 border-t border-[var(--border)] pt-6">
          <p className="mb-2 text-xs text-tertiary">Staff</p>
          <ul className="space-y-1">
            {staffLines.map((line) => (
              <li key={line} className="text-sm text-secondary">
                {line}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-8 border-t border-[var(--border)] pt-6">
        <p className="mb-3 text-xs text-tertiary">More</p>
        <div className="space-y-1">
          {cls.classFolderUrl && (
            <SecondaryLink href={cls.classFolderUrl} label="Class folder" icon={<FolderOpen className="h-3.5 w-3.5" />} />
          )}
          {cls.whatsappUrl && (
            <SecondaryLink href={cls.whatsappUrl} label="WhatsApp" icon={<MessageCircle className="h-3.5 w-3.5" />} />
          )}
          {cls.parentPresentationUrl && (
            <SecondaryLink href={cls.parentPresentationUrl} label="Parent presentation" icon={<Presentation className="h-3.5 w-3.5" />} />
          )}
          {cls.parentEmailDocUrl && (
            <SecondaryLink href={cls.parentEmailDocUrl} label="Parent email" icon={<FileText className="h-3.5 w-3.5" />} />
          )}
          {cls.icebreakersUrl && (
            <SecondaryLink href={cls.icebreakersUrl} label="Icebreakers" icon={<FileText className="h-3.5 w-3.5" />} />
          )}
          {cls.officeHoursUrl && (
            <SecondaryLink href={cls.officeHoursUrl} label="Office hours" icon={<ClipboardList className="h-3.5 w-3.5" />} />
          )}
        </div>
      </div>

      {(cls.beginningStaff.length > 0 ||
        cls.intermediateStaff.length > 0 ||
        cls.advancedStaff.length > 0) && (
        <div className="mt-8 border-t border-[var(--border)] pt-6 space-y-3">
          <p className="text-xs text-tertiary">Level staffing</p>
          <StaffLevel label="Beginning" names={cls.beginningStaff} />
          <StaffLevel label="Intermediate" names={cls.intermediateStaff} />
          <StaffLevel label="Advanced" names={cls.advancedStaff} />
        </div>
      )}
    </div>
  );
}

function ActionLink({
  href,
  title,
  subtitle,
  icon,
  primary,
}: {
  href: string;
  title: string;
  subtitle?: string;
  icon: React.ReactNode;
  primary?: boolean;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "flex items-center gap-3 rounded-[var(--radius-md)] border px-4 py-3.5 transition-colors",
        primary
          ? "border-transparent bg-[var(--accent)] text-[var(--text-inverse)] hover:opacity-90"
          : "border-[var(--border)] bg-transparent hover:bg-[var(--surface-hover)]"
      )}
    >
      <span className={cn(!primary && "text-secondary")}>{icon}</span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-medium">{title}</span>
        {subtitle && (
          <span
            className={cn(
              "mt-0.5 block text-xs",
              primary ? "text-white/70" : "text-tertiary"
            )}
          >
            {subtitle}
          </span>
        )}
      </span>
      <ExternalLink
        className={cn("h-3.5 w-3.5", primary ? "opacity-40" : "text-tertiary")}
      />
    </a>
  );
}

function SecondaryLink({
  href,
  label,
  icon,
}: {
  href: string;
  label: string;
  icon: React.ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-2.5 rounded-[var(--radius-sm)] px-2 py-2 text-sm text-secondary hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)]"
    >
      <span className="text-tertiary">{icon}</span>
      <span className="flex-1">{label}</span>
      <ExternalLink className="h-3 w-3 text-tertiary" />
    </a>
  );
}

function StaffLevel({ label, names }: { label: string; names: string[] }) {
  if (!names.length) return null;
  return (
    <div>
      <p className="text-[11px] text-tertiary">{label}</p>
      <p className="mt-0.5 text-sm text-secondary">{names.join(" · ")}</p>
    </div>
  );
}
