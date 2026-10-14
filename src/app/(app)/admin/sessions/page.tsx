"use client";

import Link from "next/link";
import { useState } from "react";
import { CalendarDays, Plus, ChevronRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/AuthProvider";
import { hasPermission } from "@/lib/permissions";
import { useSessions } from "@/lib/sessions/SessionsProvider";
import { PageHeader, SectionLabel } from "@/components/ui/PageHeader";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

export default function AdminSessionsPage() {
  const { member } = useAuth();
  const router = useRouter();
  const { sessions, classes, createSession, updateSession } = useSessions();
  const canManage =
    member &&
    (hasPermission(member.roleIds, "admin:sessions") ||
      hasPermission(member.roleIds, "admin:access") ||
      hasPermission(member.roleIds, "classes:write"));

  const [name, setName] = useState("");
  const [season, setSeason] = useState("Fall");
  const [year, setYear] = useState(new Date().getFullYear());
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  if (member && !canManage) {
    return (
      <p className="text-sm text-secondary">
        You don’t have permission to manage sessions.
      </p>
    );
  }

  async function onCreate(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr("");
    try {
      const session = await createSession({
        name: name.trim() || `${season} ${year}`,
        season,
        year,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        isActive: true,
      });
      setMsg(`Created ${session.name}.`);
      setName("");
      router.push(`/admin/sessions/${session.id}`);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Could not create session");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Admin"
        title="Sessions"
        description="Create a session, import classes from your sheet, then staff each class."
      />

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
        <SectionLabel>New session</SectionLabel>
        <GlassCard>
          <form onSubmit={(e) => void onCreate(e)} className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block sm:col-span-2">
                <span className="mb-1 block text-[12px] text-tertiary">
                  Name
                </span>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Fall 2027"
                  className="h-9 w-full rounded-[var(--radius-sm)] border border-[var(--border)] bg-transparent px-3 text-sm outline-none focus:border-[var(--accent)]"
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-[12px] text-tertiary">
                  Season
                </span>
                <select
                  value={season}
                  onChange={(e) => setSeason(e.target.value)}
                  className="h-9 w-full rounded-[var(--radius-sm)] border border-[var(--border)] bg-transparent px-3 text-sm outline-none"
                >
                  {["Fall", "Winter", "Spring", "Summer"].map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="mb-1 block text-[12px] text-tertiary">
                  Year
                </span>
                <input
                  type="number"
                  value={year}
                  onChange={(e) => setYear(Number(e.target.value))}
                  className="h-9 w-full rounded-[var(--radius-sm)] border border-[var(--border)] bg-transparent px-3 text-sm outline-none focus:border-[var(--accent)]"
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-[12px] text-tertiary">
                  Start date
                </span>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="h-9 w-full rounded-[var(--radius-sm)] border border-[var(--border)] bg-transparent px-3 text-sm outline-none focus:border-[var(--accent)]"
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-[12px] text-tertiary">
                  End date
                </span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="h-9 w-full rounded-[var(--radius-sm)] border border-[var(--border)] bg-transparent px-3 text-sm outline-none focus:border-[var(--accent)]"
                />
              </label>
            </div>
            <Button type="submit" loading={busy} size="md">
              <Plus className="h-3.5 w-3.5" />
              Create session
            </Button>
          </form>
        </GlassCard>
      </div>

      <div>
        <SectionLabel>All sessions</SectionLabel>
        <GlassCard padding={false} className="overflow-hidden">
          {sessions.length === 0 ? (
            <p className="px-5 py-10 text-center text-sm text-secondary">
              No sessions yet.
            </p>
          ) : (
            <ul className="divide-y divide-[var(--border)]">
              {[...sessions]
                .sort((a, b) => b.year - a.year || a.name.localeCompare(b.name))
                .map((s) => {
                  const count = classes.filter(
                    (c) => c.sessionId === s.id
                  ).length;
                  return (
                    <li key={s.id}>
                      <Link
                        href={`/admin/sessions/${s.id}`}
                        className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-[var(--surface-hover)]"
                      >
                        <CalendarDays className="h-4 w-4 shrink-0 text-[var(--accent)]" />
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-sm font-medium">{s.name}</p>
                            <span
                              className={cn(
                                "rounded px-1.5 py-0.5 text-[10px] uppercase tracking-wide",
                                s.isActive
                                  ? "bg-[var(--success-soft)] text-[var(--success)]"
                                  : "bg-[var(--surface-hover)] text-tertiary"
                              )}
                            >
                              {s.isActive ? "Active" : "Inactive"}
                            </span>
                          </div>
                          <p className="text-[12px] text-tertiary">
                            {s.startDate} → {s.endDate} · {count} classes
                          </p>
                        </div>
                        {!s.isActive && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => {
                              e.preventDefault();
                              void updateSession(s.id, { isActive: true });
                            }}
                          >
                            Set active
                          </Button>
                        )}
                        <ChevronRight className="h-4 w-4 text-tertiary" />
                      </Link>
                    </li>
                  );
                })}
            </ul>
          )}
        </GlassCard>
      </div>

      <Link
        href="/admin/classes"
        className="inline-flex text-[13px] font-medium text-[var(--accent)]"
      >
        Open classes overview →
      </Link>
    </div>
  );
}
