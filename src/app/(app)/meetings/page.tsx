"use client";

import Link from "next/link";
import { useAuth } from "@/lib/auth/AuthProvider";
import { TEAMS } from "@/data/seed";
import { PageHeader } from "@/components/ui/PageHeader";
import { GlassCard } from "@/components/ui/GlassCard";
import { TeamEventCard } from "@/components/events/TeamEventCard";
import { useTeamEvents } from "@/lib/events/store";
import { Button } from "@/components/ui/Button";
import { Plus } from "lucide-react";

export default function MeetingsPage() {
  const { member } = useAuth();
  const eventsForTeams = useTeamEvents((s) => s.eventsForTeams);

  if (!member) return null;

  const events = eventsForTeams(member.teamIds);
  const leadTeams = TEAMS.filter((t) => t.leadIds.includes(member.id));

  return (
    <div>
      <PageHeader
        title="Meetings"
        description="All upcoming team events for the teams you’re on."
        actions={
          leadTeams.length > 0 ? (
            <Link href={`/teams/${leadTeams[0].id}`}>
              <Button size="sm">
                <Plus className="h-3.5 w-3.5" />
                Create event
              </Button>
            </Link>
          ) : undefined
        }
      />

      {events.length === 0 ? (
        <GlassCard className="py-10 text-center">
          <p className="text-sm text-secondary">
            No upcoming team meetings.
          </p>
          {leadTeams.length > 0 && (
            <Link
              href={`/teams/${leadTeams[0].id}`}
              className="mt-3 inline-block text-sm underline underline-offset-2"
            >
              Create one for {leadTeams[0].name}
            </Link>
          )}
        </GlassCard>
      ) : (
        <div className="flex flex-col gap-3">
          {events.map((event) => (
            <TeamEventCard key={event.id} event={event} />
          ))}
        </div>
      )}

      <p className="mt-6 text-sm text-secondary">
        Manage teams and create events in{" "}
        <Link href="/teams" className="underline underline-offset-2 text-[var(--text-primary)]">
          Teams
        </Link>
        .
      </p>
    </div>
  );
}
