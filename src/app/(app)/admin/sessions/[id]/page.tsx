"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  ClipboardPaste,
  ExternalLink,
  Trash2,
} from "lucide-react";
import { useSessions } from "@/lib/sessions/SessionsProvider";
import {
  parseClassSheet,
  SHEET_TEMPLATE_HEADERS,
} from "@/lib/sessions/parseSheet";
import { PageHeader, SectionLabel } from "@/components/ui/PageHeader";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/Button";

export default function AdminSessionDetailPage() {
  const params = useParams<{ id: string }>();
  const {
    sessions,
    classesForSession,
    importClasses,
    deleteClass,
    updateSession,
  } = useSessions();
  const session = sessions.find((s) => s.id === params.id);
  const classes = classesForSession(params.id);

  const [paste, setPaste] = useState("");
  const [dateRange, setDateRange] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  const preview = useMemo(() => {
    if (!paste.trim()) return null;
    return parseClassSheet(paste);
  }, [paste]);

  if (!session) {
    return (
      <div className="py-12 text-center">
        <p className="text-sm text-secondary">Session not found.</p>
        <Link
          href="/admin/sessions"
          className="mt-3 inline-flex text-[13px] text-[var(--accent)]"
        >
          Back to sessions
        </Link>
      </div>
    );
  }

  async function onImport() {
    setBusy(true);
    setErr("");
    setMsg("");
    try {
      const res = await importClasses(session!.id, paste, {
        dateRange: dateRange || undefined,
      });
      setMsg(res.message);
      setPaste("");
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Import failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <Link
        href="/admin/sessions"
        className="inline-flex items-center gap-1.5 text-sm text-secondary"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Sessions
      </Link>

      <PageHeader
        eyebrow={session.isActive ? "Active session" : "Session"}
        title={session.name}
        description={`${session.startDate} → ${session.endDate} · ${classes.length} classes`}
      />

      <div className="flex flex-wrap gap-2">
        {!session.isActive && (
          <Button
            size="sm"
            variant="secondary"
            onClick={() => void updateSession(session.id, { isActive: true })}
          >
            Set as active session
          </Button>
        )}
        <Link href="/admin/classes">
          <Button size="sm" variant="ghost">
            Classes overview
          </Button>
        </Link>
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

      <div>
        <SectionLabel>Paste classes from sheet</SectionLabel>
        <GlassCard className="space-y-3">
          <p className="text-[13px] text-secondary">
            Copy rows from your master Google Sheet (include the header row) and
            paste below. We map common columns like Class, Day, Zoom, Attendance
            Sheet, Lead Teachers, Beginning/Intermediate/Advanced Staff, etc.
          </p>
          <button
            type="button"
            className="text-[12px] text-[var(--accent)] hover:underline"
            onClick={() => {
              void navigator.clipboard.writeText(
                `${SHEET_TEMPLATE_HEADERS}\nScratch\tFall 1\tWednesday\tSep 2 – Oct 7\t36 students\thttps://zoom.us/j/…\t…`
              );
              setMsg("Template headers copied — paste into Sheets or here.");
            }}
          >
            Copy header template
          </button>
          <label className="block">
            <span className="mb-1 block text-[12px] text-tertiary">
              Default date range (optional)
            </span>
            <input
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              placeholder="Sep 2 – Oct 7, 2026"
              className="h-9 w-full max-w-md rounded-[var(--radius-sm)] border border-[var(--border)] bg-transparent px-3 text-sm outline-none focus:border-[var(--accent)]"
            />
          </label>
          <textarea
            value={paste}
            onChange={(e) => setPaste(e.target.value)}
            rows={8}
            placeholder="Paste spreadsheet rows here…"
            className="w-full rounded-[var(--radius-sm)] border border-[var(--border)] bg-transparent px-3 py-2 font-mono text-[12px] outline-none focus:border-[var(--accent)]"
          />
          {preview && (
            <p className="text-[12px] text-secondary">
              Preview: {preview.rows.length} class
              {preview.rows.length === 1 ? "" : "es"}
              {preview.errors.length > 0
                ? ` · ${preview.errors.length} warning(s)`
                : ""}
              {preview.rows[0] ? ` · e.g. ${preview.rows[0].name}` : ""}
            </p>
          )}
          <Button
            size="md"
            loading={busy}
            disabled={!paste.trim()}
            onClick={() => void onImport()}
          >
            <ClipboardPaste className="h-3.5 w-3.5" />
            Import classes
          </Button>
        </GlassCard>
      </div>

      <div>
        <SectionLabel>Classes in this session</SectionLabel>
        <GlassCard padding={false} className="overflow-hidden">
          {classes.length === 0 ? (
            <p className="px-5 py-10 text-center text-sm text-secondary">
              No classes yet — paste from your sheet above.
            </p>
          ) : (
            <ul className="divide-y divide-[var(--border)]">
              {[...classes]
                .sort(
                  (a, b) =>
                    a.sessionLabel.localeCompare(b.sessionLabel) ||
                    a.dayOfWeek.localeCompare(b.dayOfWeek) ||
                    a.name.localeCompare(b.name)
                )
                .map((c) => (
                  <li
                    key={c.id}
                    className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium">{c.name}</p>
                      <p className="text-[12px] text-tertiary">
                        {c.sessionLabel} · {c.dayOfWeek} · {c.dateRange}
                      </p>
                      {(c.leadTeachers.length > 0 ||
                        c.beginningStaff.length > 0) && (
                        <p className="mt-1 text-[11px] text-secondary">
                          {[
                            c.leadTeachers[0] && `Lead: ${c.leadTeachers[0]}`,
                            c.beginningStaff.length > 0 &&
                              `Beg: ${c.beginningStaff.length}`,
                            c.intermediateStaff.length > 0 &&
                              `Int: ${c.intermediateStaff.length}`,
                            c.advancedStaff.length > 0 &&
                              `Adv: ${c.advancedStaff.length}`,
                          ]
                            .filter(Boolean)
                            .join(" · ")}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      <Link href={`/admin/classes?class=${c.id}`}>
                        <Button size="sm" variant="secondary">
                          Staff &amp; edit
                        </Button>
                      </Link>
                      {c.zoomLink && (
                        <a
                          href={c.zoomLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex h-8 items-center gap-1 rounded-[var(--radius-sm)] px-2.5 text-xs text-secondary hover:bg-[var(--surface-hover)]"
                        >
                          <ExternalLink className="h-3 w-3" />
                          Zoom
                        </a>
                      )}
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={() => {
                          if (!confirm(`Delete ${c.name}?`)) return;
                          void deleteClass(c.id);
                        }}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </li>
                ))}
            </ul>
          )}
        </GlassCard>
      </div>
    </div>
  );
}
