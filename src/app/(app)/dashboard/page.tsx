"use client";

import Link from "next/link";
import { format } from "date-fns";
import { useMemo, useState } from "react";
import {
  Video,
  ClipboardList,
  FolderOpen,
  CalendarPlus,
  ExternalLink,
  MessageCircle,
  Clock,
  Users,
  Check,
  X,
} from "lucide-react";
import { useAuth } from "@/lib/auth/AuthProvider";
import { useMembers } from "@/lib/members/MembersProvider";
import { assignmentsForMember, getClass } from "@/data/seed";
import { displayName } from "@/lib/permissions";
import { PageHeader, SectionLabel } from "@/components/ui/PageHeader";
import { GlassCard } from "@/components/ui/GlassCard";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { TeamEventCard } from "@/components/events/TeamEventCard";
import {
  filterEventsForTeams,
  useTeamEvents,
} from "@/lib/events/store";
import { useTeamsStore } from "@/lib/teams/store";
import { useJoinRequests } from "@/lib/teams/joinRequests";
import { teamIdsForMember } from "@/lib/teams/membership";
import { leadTeamsFor } from "@/lib/teams/permissions";
import {
  googleCalendarUrlForClass,
  isTeamEventOnDay,
  nextClassOccurrence,
  todayDayName,
} from "@/lib/calendar";
import type { ClassEntity } from "@/types";

export default function DashboardPage() {
  const { member } = useAuth();
  const { getById, adminPatchMember } = useMembers();
  const allEvents = useTeamEvents((s) => s.events);
  const teams = useTeamsStore((s) => s.teams);
  const addMember = useTeamsStore((s) => s.addMember);
  const allRequests = useJoinRequests((s) => s.requests);
  const approveRequest = useJoinRequests((s) => s.approve);
  const denyRequest = useJoinRequests((s) => s.deny);
  const [resolvingId, setResolvingId] = useState<string | null>(null);

  const myTeamIds = useMemo(
    () => (member ? teamIdsForMember(teams, member.id) : []),
    [member, teams]
  );

  const myTeams = useMemo(
    () => teams.filter((t) => myTeamIds.includes(t.id)),
    [teams, myTeamIds]
  );

  const leadTeamIds = useMemo(
    () => (member ? leadTeamsFor(member, teams).map((t) => t.id) : []),
    [member, teams]
  );

  const pendingJoinRequests = useMemo(() => {
    return allRequests.filter(
      (r) => r.status === "pending" && leadTeamIds.includes(r.teamId)
    );
  }, [allRequests, leadTeamIds]);

  const todaysMeetings = useMemo(() => {
    if (!member) return [];
    const today = new Date();
    return filterEventsForTeams(allEvents, myTeamIds).filter((e) =>
      isTeamEventOnDay(e, today)
    );
  }, [allEvents, myTeamIds, member]);

  async function syncMemberTeams(memberId: string) {
    const ids = teamIdsForMember(useTeamsStore.getState().teams, memberId);
    await adminPatchMember(memberId, { teamIds: ids });
  }

  async function onApprove(requestId: string, teamId: string, memberId: string) {
    if (!member) return;
    setResolvingId(requestId);
    try {
      approveRequest(requestId, member.id);
      addMember(teamId, memberId);
      await syncMemberTeams(memberId);
    } finally {
      setResolvingId(null);
    }
  }

  async function onDeny(requestId: string) {
    if (!member) return;
    setResolvingId(requestId);
    try {
      denyRequest(requestId, member.id);
    } finally {
      setResolvingId(null);
    }
  }

  if (!member) return null;

  const firstName =
    member.preferredName?.trim() ||
    displayName(member).split(" ")[0] ||
    "there";
  const today = new Date();
  const dayName = todayDayName(today);

  const myAssignments = assignmentsForMember(member.id);
  const todaysClasses = myAssignments
    .map((a) => ({ assignment: a, cls: getClass(a.classId) }))
    .filter(
      (x): x is { assignment: (typeof myAssignments)[number]; cls: ClassEntity } =>
        Boolean(x.cls && x.cls.dayOfWeek === dayName && x.cls.status === "active")
    );

  const hasSchedule = todaysClasses.length > 0 || todaysMeetings.length > 0;
  const hoursUrl = member.volunteerHoursUrl?.trim();

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader
        title={`Welcome, ${firstName}`}
        description={format(today, "EEEE, MMMM d")}
      />

      <div className="space-y-8">
        {pendingJoinRequests.length > 0 && (
          <section>
            <SectionLabel>Join requests</SectionLabel>
            <div className="flex flex-col gap-2">
              {pendingJoinRequests.map((req) => {
                const requester = getById(req.memberId);
                const team = teams.find((t) => t.id === req.teamId);
                const name = requester
                  ? displayName(requester)
                  : "Someone";
                const teamName = team?.name ?? "a team";
                return (
                  <GlassCard key={req.id}>
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <Avatar
                          name={name}
                          src={requester?.pfpUrl}
                          size="sm"
                        />
                        <p className="text-sm text-secondary">
                          <span className="font-medium text-[var(--text-primary)]">
                            {name}
                          </span>{" "}
                          wants to join{" "}
                          <span className="font-medium text-[var(--text-primary)]">
                            {teamName}
                          </span>
                          . Approve?
                        </p>
                      </div>
                      <div className="flex shrink-0 gap-2">
                        <Button
                          size="sm"
                          disabled={resolvingId === req.id}
                          onClick={() =>
                            void onApprove(req.id, req.teamId, req.memberId)
                          }
                        >
                          <Check className="h-3.5 w-3.5" />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          disabled={resolvingId === req.id}
                          onClick={() => void onDeny(req.id)}
                        >
                          <X className="h-3.5 w-3.5" />
                          Deny
                        </Button>
                      </div>
                    </div>
                  </GlassCard>
                );
              })}
            </div>
          </section>
        )}

        <section>
          <SectionLabel>Your classes and meetings today</SectionLabel>
          {!hasSchedule ? (
            <GlassCard className="py-8 text-center">
              <p className="text-sm text-secondary">
                Nothing scheduled today.
              </p>
              <div className="mt-3 flex flex-wrap justify-center gap-3 text-sm">
                <Link
                  href="/meetings"
                  className="text-[var(--text-primary)] underline underline-offset-2"
                >
                  All meetings
                </Link>
                <Link
                  href="/classes"
                  className="text-secondary underline underline-offset-2"
                >
                  My classes
                </Link>
              </div>
            </GlassCard>
          ) : (
            <div className="flex flex-col gap-3">
              {todaysClasses.map(({ cls, assignment }) => (
                <TodayClassCard
                  key={cls.id}
                  cls={cls}
                  role={assignment.classRole}
                />
              ))}
              {todaysMeetings.map((event) => (
                <TeamEventCard key={event.id} event={event} />
              ))}
            </div>
          )}
        </section>

        <section>
          <SectionLabel>Log volunteer hours</SectionLabel>
          <GlassCard>
            {hoursUrl ? (
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm text-secondary">
                    Open your hours tracker to log today’s time.
                  </p>
                </div>
                <a
                  href={hoursUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-[var(--radius-sm)] bg-[var(--accent)] px-3 text-sm font-medium text-[var(--text-inverse)] hover:opacity-90"
                >
                  <Clock className="h-3.5 w-3.5" />
                  Log hours
                </a>
              </div>
            ) : (
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm text-secondary">
                  Add a Google Doc or Sheet link in Settings so you can log hours
                  from Home.
                </p>
                <Link
                  href="/settings"
                  className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-[var(--radius-sm)] border border-[var(--border)] px-3 text-sm hover:bg-[var(--surface-hover)]"
                >
                  Add tracker
                </Link>
              </div>
            )}
          </GlassCard>
        </section>

        <section>
          <div className="mb-2 flex items-baseline justify-between gap-3">
            <SectionLabel className="mb-0">Your teams</SectionLabel>
            <Link
              href="/teams"
              className="text-xs text-tertiary hover:text-[var(--text-primary)]"
            >
              My teams
            </Link>
          </div>
          {myTeams.length === 0 ? (
            <GlassCard className="py-6 text-center">
              <p className="text-sm text-secondary">
                You’re not on a team yet. Browse teams to see what’s available.
              </p>
              <Link
                href="/teams"
                className="mt-3 inline-flex items-center gap-1.5 text-sm text-[var(--text-primary)] underline underline-offset-2"
              >
                <Users className="h-3.5 w-3.5" />
                View teams
              </Link>
            </GlassCard>
          ) : (
            <div className="flex flex-col gap-2">
              {myTeams.map((team) => {
                const isLead = team.leadIds.includes(member.id);
                return (
                  <Link
                    key={team.id}
                    href={`/teams/${team.id}`}
                    className="flex items-center justify-between gap-3 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] px-4 py-3 transition-colors hover:bg-[var(--surface-hover)]"
                  >
                    <div className="flex min-w-0 items-center gap-2.5">
                      <span
                        className="h-2 w-2 shrink-0 rounded-full"
                        style={{ background: team.color }}
                      />
                      <span className="truncate text-sm font-medium">
                        {team.name}
                      </span>
                      {isLead && (
                        <span className="shrink-0 text-[10px] text-tertiary">
                          Lead
                        </span>
                      )}
                    </div>
                    <ExternalLink className="h-3.5 w-3.5 shrink-0 text-tertiary" />
                  </Link>
                );
              })}
            </div>
          )}
        </section>
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
        {cls.whatsappUrl && (
          <a
            href={cls.whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-9 items-center gap-1.5 rounded-[var(--radius-sm)] border border-[var(--border)] px-3 text-sm hover:bg-[var(--surface-hover)]"
          >
            <MessageCircle className="h-3.5 w-3.5" />
            WhatsApp
          </a>
        )}
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
