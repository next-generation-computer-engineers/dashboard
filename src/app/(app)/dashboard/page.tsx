"use client";

import Link from "next/link";
import { format } from "date-fns";
import { useMemo, useState } from "react";
import {
  BookOpen,
  CalendarDays,
  Clock,
  FolderOpen,
  MessageCircle,
  Users,
} from "lucide-react";
import { useAuth } from "@/lib/auth/AuthProvider";
import { useMembers } from "@/lib/members/MembersProvider";
import { ANNOUNCEMENTS, getClass } from "@/data/seed";
import { useClassAssignments } from "@/lib/classes/assignmentsStore";
import { displayName, hasPermission } from "@/lib/permissions";
import { SectionLabel } from "@/components/ui/PageHeader";
import { GlassCard } from "@/components/ui/GlassCard";
import { Avatar } from "@/components/ui/Avatar";
import { EmptyState } from "@/components/ui/EmptyState";
import { NextAssignmentCard } from "@/components/dashboard/NextAssignmentCard";
import {
  ActionRequiredList,
  type ActionItem,
} from "@/components/dashboard/ActionRequiredList";
import { ClassListItem } from "@/components/dashboard/ClassListItem";
import { OpportunityCard } from "@/components/dashboard/OpportunityCard";
import {
  AnnouncementItem,
  QuickLinkItem,
} from "@/components/dashboard/AnnouncementItem";
import {
  filterEventsForMeetingsPage,
  useTeamEvents,
} from "@/lib/events/store";
import { useTeamsStore } from "@/lib/teams/store";
import { useJoinRequests } from "@/lib/teams/joinRequests";
import { isTeamMember, teamIdsForMember } from "@/lib/teams/membership";
import { leadTeamsFor } from "@/lib/teams/permissions";
import {
  nextClassOccurrence,
  nextOccurrenceStartsAt,
} from "@/lib/calendar";
import type { ClassEntity, TeamEvent } from "@/types";

type NextItem =
  | {
      kind: "class";
      at: Date;
      end: Date;
      cls: ClassEntity;
      role: string;
    }
  | {
      kind: "meeting";
      at: Date;
      end?: Date;
      event: TeamEvent;
      teamName?: string;
    };

export default function DashboardPage() {
  const { member } = useAuth();
  const { getById, adminPatchMember } = useMembers();
  const allEvents = useTeamEvents((s) => s.events);
  const teams = useTeamsStore((s) => s.teams);
  const addMember = useTeamsStore((s) => s.addMember);
  const allAssignments = useClassAssignments((s) => s.assignments);
  const allRequests = useJoinRequests((s) => s.requests);
  const approveRequest = useJoinRequests((s) => s.approve);
  const denyRequest = useJoinRequests((s) => s.deny);
  const [resolvingId, setResolvingId] = useState<string | null>(null);

  const myTeamIds = useMemo(
    () => (member ? teamIdsForMember(teams, member.id) : []),
    [member, teams]
  );

  const leadTeamIds = useMemo(
    () => (member ? leadTeamsFor(member, teams).map((t) => t.id) : []),
    [member, teams]
  );

  /** Same visibility as Calendar: membership + teams you lead (admins → all). */
  const visibleMeetingTeamIds = useMemo(() => {
    return Array.from(new Set([...myTeamIds, ...leadTeamIds]));
  }, [myTeamIds, leadTeamIds]);

  const pendingJoinRequests = useMemo(() => {
    return allRequests.filter(
      (r) => r.status === "pending" && leadTeamIds.includes(r.teamId)
    );
  }, [allRequests, leadTeamIds]);

  const myAssignments = useMemo(() => {
    if (!member) return [];
    return allAssignments.filter((a) => a.memberId === member.id);
  }, [allAssignments, member]);

  const myClasses = useMemo(() => {
    return myAssignments
      .map((a) => ({ assignment: a, cls: getClass(a.classId) }))
      .filter(
        (x): x is { assignment: (typeof myAssignments)[number]; cls: ClassEntity } =>
          Boolean(x.cls && x.cls.status === "active")
      );
  }, [myAssignments]);

  const openTeams = useMemo(() => {
    if (!member) return [];
    return teams
      .filter((t) => !isTeamMember(t, member.id))
      .sort((a, b) => a.name.localeCompare(b.name))
      .slice(0, 4);
  }, [teams, member]);

  const nextUp = useMemo((): NextItem | null => {
    if (!member) return null;
    const now = new Date();
    const candidates: NextItem[] = [];

    for (const { cls, assignment } of myClasses) {
      const at = nextClassOccurrence(cls.dayOfWeek, 10, 0);
      const end = new Date(at.getTime() + 90 * 60 * 1000);
      if (end.getTime() < now.getTime()) continue;
      candidates.push({
        kind: "class",
        at,
        end,
        cls,
        role: assignment.classRole,
      });
    }

    // Match Calendar filters so newly created same-day meetings appear immediately
    // when the zustand store updates (membership + lead/admin teams).
    const visible = filterEventsForMeetingsPage(
      allEvents,
      visibleMeetingTeamIds,
      (event) => nextOccurrenceStartsAt(event, now)
    );

    // Also surface meetings you just created even if team membership is out of sync
    const createdByMe = allEvents.filter(
      (e) =>
        e.createdBy === member.id &&
        !visible.some((v) => v.id === e.id)
    );
    const meetingPool = [...visible, ...createdByMe];

    for (const event of meetingPool) {
      const at = new Date(nextOccurrenceStartsAt(event, now));
      const durationMs =
        event.endsAt && event.startsAt
          ? Math.max(
              0,
              new Date(event.endsAt).getTime() -
                new Date(event.startsAt).getTime()
            )
          : 60 * 60 * 1000;
      const end = new Date(at.getTime() + durationMs);
      // Keep showing until the meeting ends (not just until start)
      if (end.getTime() < now.getTime()) continue;
      const team = teams.find((t) => t.id === event.teamId);
      candidates.push({
        kind: "meeting",
        at,
        end,
        event,
        teamName: team?.name,
      });
    }

    candidates.sort((a, b) => a.at.getTime() - b.at.getTime());
    return candidates[0] ?? null;
  }, [member, myClasses, allEvents, visibleMeetingTeamIds, teams]);

  const announcements = useMemo(() => {
    if (!member) return [];
    const isAdmin = hasPermission(member.roleIds, "admin:access");
    return ANNOUNCEMENTS.filter((a) => {
      if (a.audience === "all") return true;
      if (a.audience === "admins") return isAdmin;
      if (a.audience === "team" && a.audienceId) {
        return myTeamIds.includes(a.audienceId);
      }
      return false;
    })
      .sort((a, b) => {
        if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
        return b.createdAt.localeCompare(a.createdAt);
      })
      .slice(0, 4);
  }, [member, myTeamIds]);

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

  const hoursUrl = member.volunteerHoursUrl?.trim();
  const firstClass = myClasses[0]?.cls;

  const attentionItems: ActionItem[] = [];

  for (const req of pendingJoinRequests) {
    const requester = getById(req.memberId);
    const team = teams.find((t) => t.id === req.teamId);
    const name = requester ? displayName(requester) : "Someone";
    attentionItems.push({
      id: req.id,
      title: `${name} wants to join ${team?.name ?? "a team"}`,
      description: "Approve to add them to the roster, or deny the request.",
      required: true,
      tone: "warning",
      statusLabel: "Needs response",
      avatar: (
        <Avatar name={name} src={requester?.pfpUrl} size="sm" />
      ),
      primaryLabel: "Approve",
      secondaryLabel: "Deny",
      loading: resolvingId === req.id,
      onPrimary: () => void onApprove(req.id, req.teamId, req.memberId),
      onSecondary: () => void onDeny(req.id),
    });
  }

  if (!hoursUrl) {
    attentionItems.push({
      id: "hours-tracker",
      title: "Add your volunteer hours tracker",
      description:
        "Link a Google Doc or Sheet in Settings so you can log hours from Home.",
      required: false,
      tone: "info",
      statusLabel: "Optional",
      href: "/settings",
      hrefLabel: "Open Settings",
    });
  } else {
    attentionItems.push({
      id: "log-hours",
      title: "Log today’s volunteer hours",
      description: "Open your tracker after class or meeting time.",
      required: false,
      tone: "neutral",
      statusLabel: "Reminder",
      href: hoursUrl,
      hrefLabel: "Log hours",
      external: true,
    });
  }

  if (myClasses.length === 0 && openTeams.length > 0) {
    attentionItems.push({
      id: "find-opportunity",
      title: "Find a team or class to join",
      description:
        "Browse open opportunities to get assigned and see materials.",
      required: false,
      tone: "accent",
      statusLabel: "Suggested",
      href: "/teams",
      hrefLabel: "Browse opportunities",
    });
  }

  return (
    <div className="space-y-6">
      {/* Mobile greeting — desktop uses TopBar */}
      <div className="md:hidden">
        <p className="text-[13px] text-tertiary">
          {format(new Date(), "EEEE, MMMM d")}
        </p>
      </div>

      {/* Row 1: Next up + Needs attention */}
      <div className="grid gap-4 lg:grid-cols-[1.35fr_1fr]">
        <section>
          {nextUp ? (
            nextUp.kind === "class" ? (
              <NextAssignmentCard
                kind="class"
                title={nextUp.cls.name}
                subtitle={`${nextUp.cls.sessionLabel} · ${nextUp.cls.dayOfWeek}`}
                when={nextUp.at}
                whenEnd={nextUp.end}
                location="Zoom"
                zoomLink={nextUp.cls.zoomLink}
                role={nextUp.role}
                peopleLabel={
                  nextUp.cls.leadTeachers.length
                    ? `Led by ${nextUp.cls.leadTeachers.slice(0, 2).join(", ")}`
                    : nextUp.cls.studentCountLabel
                }
                statusLabel="Upcoming"
                statusTone="accent"
                primaryHref={nextUp.cls.zoomLink}
                primaryLabel="Join Zoom"
                primaryExternal
                secondaryHref={`/classes/${nextUp.cls.id}`}
                secondaryLabel="View class details"
                materialsHref={nextUp.cls.curriculumFolderUrl}
                attendanceHref={nextUp.cls.attendanceSheetUrl}
              />
            ) : (
              <NextAssignmentCard
                kind="meeting"
                title={nextUp.event.title}
                subtitle={nextUp.teamName}
                when={nextUp.at}
                whenEnd={nextUp.end}
                location={nextUp.event.location}
                zoomLink={nextUp.event.zoomLink}
                peopleLabel={nextUp.teamName}
                statusLabel="Upcoming"
                statusTone="accent"
                primaryHref={
                  nextUp.event.zoomLink ?? `/meetings`
                }
                primaryLabel={nextUp.event.zoomLink ? "Join Zoom" : "Open calendar"}
                primaryExternal={Boolean(nextUp.event.zoomLink)}
                secondaryHref="/meetings"
                secondaryLabel="View in calendar"
                materialsHref={nextUp.event.materials[0]?.url}
              />
            )
          ) : (
            <EmptyState
              title="Nothing upcoming right now"
              description="When you’re assigned to a class or team meeting, it will show here with time, location, and quick actions."
              action={
                <Link
                  href="/meetings"
                  className="text-[13px] font-medium text-[var(--accent)] hover:underline"
                >
                  Browse calendar
                </Link>
              }
            />
          )}
        </section>

        <section>
          <SectionLabel>Needs your attention</SectionLabel>
          <ActionRequiredList items={attentionItems} />
        </section>
      </div>

      {/* Row 2: My classes + Opportunities */}
      <div className="grid gap-4 lg:grid-cols-2">
        <section>
          <SectionLabel
            action={
              <Link
                href="/classes"
                className="text-[11px] text-tertiary hover:text-[var(--text-primary)]"
              >
                View all
              </Link>
            }
          >
            My classes
          </SectionLabel>
          {myClasses.length === 0 ? (
            <EmptyState
              title="No class assignments yet"
              description="An admin can add you from Admin → Staffing. Until then, browse opportunities to join a team."
              action={
                <Link
                  href="/teams"
                  className="text-[13px] font-medium text-[var(--accent)] hover:underline"
                >
                  Browse opportunities
                </Link>
              }
            />
          ) : (
            <div className="flex flex-col gap-2">
              {myClasses.slice(0, 4).map(({ cls, assignment }) => (
                <ClassListItem
                  key={cls.id}
                  href={`/classes/${cls.id}`}
                  name={cls.name}
                  meta={`${cls.sessionLabel} · ${cls.dayOfWeek}${
                    cls.studentCountLabel ? ` · ${cls.studentCountLabel}` : ""
                  }`}
                  role={assignment.classRole}
                  nextMeeting={`Next ${cls.dayOfWeek}`}
                  materialsHref={cls.curriculumFolderUrl}
                />
              ))}
            </div>
          )}
        </section>

        <section>
          <SectionLabel
            action={
              <Link
                href="/teams"
                className="text-[11px] text-tertiary hover:text-[var(--text-primary)]"
              >
                View all
              </Link>
            }
          >
            Open opportunities
          </SectionLabel>
          {openTeams.length === 0 ? (
            <EmptyState
              title="You’re on every open team"
              description="Check Calendar for upcoming meetings, or ask a lead about new roles."
            />
          ) : (
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
              {openTeams.map((team) => (
                <OpportunityCard
                  key={team.id}
                  href={`/teams/${team.id}`}
                  name={team.name}
                  description={team.description}
                  meta={`${team.memberIds.length} members`}
                  capacityLabel="Request to join"
                  statusLabel="Open"
                  statusTone="success"
                  actionLabel="Sign up"
                  color={team.color}
                />
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Row 3: Updates + Quick links */}
      <div className="grid gap-4 lg:grid-cols-2">
        <section>
          <SectionLabel>CENG updates</SectionLabel>
          {announcements.length === 0 ? (
            <EmptyState
              title="No announcements"
              description="Team updates and deadlines will appear here."
            />
          ) : (
            <div className="flex flex-col gap-2">
              {announcements.map((a) => (
                <AnnouncementItem
                  key={a.id}
                  title={a.title}
                  body={a.body}
                  meta={
                    a.pinned
                      ? `Pinned · ${format(new Date(a.createdAt), "MMM d")}`
                      : format(new Date(a.createdAt), "MMM d, yyyy")
                  }
                />
              ))}
            </div>
          )}
        </section>

        <section>
          <SectionLabel>Quick links</SectionLabel>
          <GlassCard padding={false} className="overflow-hidden p-1.5">
            <QuickLinkItem
              href="/classes"
              label="My class materials"
              description="Zoom, attendance, and curriculum"
              icon={<BookOpen className="h-3.5 w-3.5" />}
            />
            <QuickLinkItem
              href="/meetings"
              label="Calendar"
              description="Classes, meetings, and events"
              icon={<CalendarDays className="h-3.5 w-3.5" />}
            />
            <QuickLinkItem
              href="/resources"
              label="Resource library"
              description="Handbook, channels, and tools"
              icon={<FolderOpen className="h-3.5 w-3.5" />}
            />
            <QuickLinkItem
              href="/directory"
              label="Member directory"
              description="Find teammates and leads"
              icon={<Users className="h-3.5 w-3.5" />}
            />
            {firstClass?.whatsappUrl && (
              <QuickLinkItem
                href={firstClass.whatsappUrl}
                label="Class WhatsApp"
                description={firstClass.name}
                external
                icon={<MessageCircle className="h-3.5 w-3.5" />}
              />
            )}
            {hoursUrl && (
              <QuickLinkItem
                href={hoursUrl}
                label="Volunteer hours"
                description="Log time after sessions"
                external
                icon={<Clock className="h-3.5 w-3.5" />}
              />
            )}
          </GlassCard>
        </section>
      </div>
    </div>
  );
}
