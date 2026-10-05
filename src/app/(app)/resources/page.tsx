"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  BookOpen,
  CalendarDays,
  ExternalLink,
  FileText,
  FolderOpen,
  MessageCircle,
  Search,
  Users,
} from "lucide-react";
import { useAuth } from "@/lib/auth/AuthProvider";
import { getClass } from "@/data/seed";
import { useClassAssignments } from "@/lib/classes/assignmentsStore";
import { PageHeader, SectionLabel } from "@/components/ui/PageHeader";
import { GlassCard } from "@/components/ui/GlassCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { StatusBadge } from "@/components/ui/StatusBadge";
import type { ClassEntity } from "@/types";

type ResourceItem = {
  id: string;
  title: string;
  description: string;
  href: string;
  category: string;
  external?: boolean;
  icon: React.ReactNode;
};

const STATIC_RESOURCES: ResourceItem[] = [
  {
    id: "handbook",
    title: "Volunteer handbook",
    description: "Expectations, communication norms, and how CENG runs classes.",
    href: "https://drive.google.com",
    category: "Getting started",
    external: true,
    icon: <FileText className="h-4 w-4" />,
  },
  {
    id: "calendar",
    title: "Org calendar",
    description: "Meetings, trainings, and team events you’re invited to.",
    href: "/meetings",
    category: "Operations",
    icon: <CalendarDays className="h-4 w-4" />,
  },
  {
    id: "directory",
    title: "Member directory",
    description: "Search volunteers, roles, and team membership.",
    href: "/directory",
    category: "People",
    icon: <Users className="h-4 w-4" />,
  },
];

export default function ResourcesPage() {
  const { member } = useAuth();
  const allAssignments = useClassAssignments((s) => s.assignments);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string>("all");

  const classResources = useMemo(() => {
    if (!member) return [] as ResourceItem[];
    const mine = allAssignments.filter((a) => a.memberId === member.id);
    const items: ResourceItem[] = [];
    for (const a of mine) {
      const cls = getClass(a.classId) as ClassEntity | undefined;
      if (!cls || cls.status !== "active") continue;
      items.push({
        id: `curr-${cls.id}`,
        title: `${cls.name} — curriculum`,
        description: `${cls.sessionLabel} · lesson materials folder`,
        href: cls.curriculumFolderUrl,
        category: "Class materials",
        external: true,
        icon: <FolderOpen className="h-4 w-4" />,
      });
      items.push({
        id: `att-${cls.id}`,
        title: `${cls.name} — attendance`,
        description: "Google Sheet for session attendance",
        href: cls.attendanceSheetUrl,
        category: "Class materials",
        external: true,
        icon: <BookOpen className="h-4 w-4" />,
      });
      if (cls.whatsappUrl) {
        items.push({
          id: `wa-${cls.id}`,
          title: `${cls.name} — WhatsApp`,
          description: "Class communication channel",
          href: cls.whatsappUrl,
          category: "Communication",
          external: true,
          icon: <MessageCircle className="h-4 w-4" />,
        });
      }
    }
    return items;
  }, [member, allAssignments]);

  const all = useMemo(
    () => [...STATIC_RESOURCES, ...classResources],
    [classResources]
  );

  const categories = useMemo(() => {
    const set = new Set(all.map((r) => r.category));
    return ["all", ...Array.from(set)];
  }, [all]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return all.filter((r) => {
      if (category !== "all" && r.category !== category) return false;
      if (!q) return true;
      return (
        r.title.toLowerCase().includes(q) ||
        r.description.toLowerCase().includes(q) ||
        r.category.toLowerCase().includes(q)
      );
    });
  }, [all, query, category]);

  const grouped = useMemo(() => {
    const map: Record<string, ResourceItem[]> = {};
    for (const r of filtered) {
      (map[r.category] ??= []).push(r);
    }
    return map;
  }, [filtered]);

  if (!member) return null;

  return (
    <div>
      <PageHeader
        compact
        title="Resources"
        description="Lesson materials, channels, and useful links for volunteering."
      />

      <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-tertiary" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search resources…"
            className="input-field pl-9"
            aria-label="Search resources"
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {categories.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCategory(c)}
              className={
                category === c
                  ? "rounded-[var(--radius-sm)] bg-[var(--accent-soft)] px-2.5 py-1.5 text-[12px] font-medium text-[var(--accent)]"
                  : "rounded-[var(--radius-sm)] px-2.5 py-1.5 text-[12px] text-secondary hover:bg-[var(--surface-hover)]"
              }
            >
              {c === "all" ? "All" : c}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          title="No matching resources"
          description="Try a different search, or open My Classes for curriculum folders assigned to you."
        />
      ) : (
        Object.entries(grouped).map(([cat, items]) => (
          <section key={cat} className="mb-6">
            <SectionLabel>{cat}</SectionLabel>
            <div className="flex flex-col gap-2">
              {items.map((item) => {
                const className =
                  "flex items-center gap-3 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] px-3.5 py-3 transition-colors hover:bg-[var(--surface-hover)]";
                const body = (
                  <>
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[var(--radius-sm)] bg-[var(--bg-soft)] text-secondary">
                      {item.icon}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex flex-wrap items-center gap-1.5">
                        <span className="text-sm font-medium text-[var(--text-primary)]">
                          {item.title}
                        </span>
                        {item.external && (
                          <StatusBadge tone="neutral">External</StatusBadge>
                        )}
                      </span>
                      <span className="mt-0.5 block text-[12px] text-tertiary">
                        {item.description}
                      </span>
                    </span>
                    {item.external ? (
                      <ExternalLink className="h-3.5 w-3.5 shrink-0 text-tertiary" />
                    ) : null}
                  </>
                );
                if (item.external) {
                  return (
                    <a
                      key={item.id}
                      href={item.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={className}
                    >
                      {body}
                    </a>
                  );
                }
                return (
                  <Link key={item.id} href={item.href} className={className}>
                    {body}
                  </Link>
                );
              })}
            </div>
          </section>
        ))
      )}

      <GlassCard className="mt-2">
        <p className="text-[13px] text-secondary">
          Handbook and some org-wide links are prototype placeholders. Class
          curriculum and attendance links come from your real assignments.
        </p>
      </GlassCard>
    </div>
  );
}
