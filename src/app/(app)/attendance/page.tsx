"use client";

import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { useAuth } from "@/lib/auth/AuthProvider";
import { CLASSES, assignmentsForMember } from "@/data/seed";
import { PageHeader } from "@/components/ui/PageHeader";
import { GlassCard } from "@/components/ui/GlassCard";

/**
 * Attendance lives in Google Sheets per class (from the master spreadsheet).
 * This page is a quick launcher — not an in-app attendance tool.
 */
export default function AttendanceLauncherPage() {
  const { member } = useAuth();
  if (!member) return null;

  const mine = assignmentsForMember(member.id);
  const myIds = new Set(mine.map((a) => a.classId));
  const list =
    mine.length > 0
      ? CLASSES.filter((c) => myIds.has(c.id))
      : CLASSES.filter((c) => c.status === "active");

  return (
    <div>
      <PageHeader
        eyebrow="Operations"
        title="Attendance"
        description="Opens the Google Sheet for each class — same sheets linked from the master spreadsheet."
      />

      <div className="grid gap-3 sm:grid-cols-2">
        {list.map((cls) => (
          <GlassCard key={cls.id} className="!p-4">
            <p className="text-[11px] uppercase tracking-wider text-tertiary">
              {cls.sessionLabel} · {cls.dayOfWeek}
            </p>
            <p className="mt-1 font-display text-xl tracking-tight">{cls.name}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <a
                href={cls.attendanceSheetUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-xl bg-[var(--accent-soft)] px-3.5 py-2 text-sm text-[var(--accent)] ring-1 ring-[rgba(201,169,110,0.25)] transition hover:bg-[rgba(201,169,110,0.22)]"
              >
                Open attendance sheet
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
              <Link
                href={`/classes/${cls.id}`}
                className="inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-sm text-secondary glass-panel hover:text-[var(--text-primary)]"
              >
                Class day screen
              </Link>
            </div>
          </GlassCard>
        ))}
      </div>
    </div>
  );
}
