"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  BookOpen,
  Users,
  UserRound,
  UsersRound,
  Shield,
  LogOut,
  ChevronLeft,
  Menu,
  X,
  CalendarDays,
  Settings,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth/AuthProvider";
import { hasPermission, displayName, getRolesByIds } from "@/lib/permissions";
import { Avatar } from "@/components/ui/Avatar";
import { BrandLogo } from "@/components/ui/BrandLogo";

const NAV = [
  { href: "/dashboard", label: "Home", icon: LayoutDashboard },
  { href: "/meetings", label: "Meetings", icon: CalendarDays },
  { href: "/classes", label: "My Classes", icon: BookOpen },
  { href: "/directory", label: "Directory", icon: Users },
  { href: "/teams", label: "Teams", icon: UsersRound },
  { href: "/profile", label: "Profile", icon: UserRound },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { member, signOut } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  if (!member) return null;

  const canAdmin = hasPermission(member.roleIds, "admin:access");
  const primaryRole = getRolesByIds(member.roleIds)[0];
  const name = displayName(member);

  const NavLinks = ({ onNavigate }: { onNavigate?: () => void }) => (
    <nav className="flex flex-1 flex-col gap-0.5 px-2">
      {NAV.map((item) => {
        const active =
          pathname === item.href || pathname.startsWith(item.href + "/");
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-2.5 rounded-[var(--radius-sm)] px-2.5 py-2 text-sm transition-colors",
              active
                ? "bg-[var(--accent-soft)] text-[var(--text-primary)]"
                : "text-secondary hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)]"
            )}
          >
            <Icon
              className={cn(
                "h-4 w-4 shrink-0",
                active ? "text-[var(--accent)]" : "opacity-70"
              )}
              strokeWidth={1.5}
            />
            {!collapsed && <span>{item.label}</span>}
          </Link>
        );
      })}

      {canAdmin && (
        <>
          <div className="my-2 mx-2 h-px bg-[var(--border)]" />
          <Link
            href="/admin"
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-2.5 rounded-[var(--radius-sm)] px-2.5 py-2 text-sm transition-colors",
              pathname.startsWith("/admin")
                ? "bg-[var(--accent-soft)] text-[var(--text-primary)]"
                : "text-secondary hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)]"
            )}
          >
            <Shield
              className={cn(
                "h-4 w-4 shrink-0",
                pathname.startsWith("/admin")
                  ? "text-[var(--accent)]"
                  : "opacity-70"
              )}
              strokeWidth={1.5}
            />
            {!collapsed && <span>Admin</span>}
          </Link>
        </>
      )}
    </nav>
  );

  return (
    <div className="relative flex min-h-screen bg-[var(--bg-base)]">
      <aside
        className={cn(
          "fixed left-0 top-0 z-40 hidden h-screen flex-col border-r border-[var(--border)] bg-[var(--bg-base)] transition-[width] duration-200 md:flex",
          collapsed ? "w-[72px]" : "w-[var(--sidebar-width)]"
        )}
      >
        <div className="flex h-[var(--topbar-height)] items-center justify-between gap-1 px-3">
          <BrandLogo height={collapsed ? 22 : 28} />
          <button
            onClick={() => setCollapsed((c) => !c)}
            className="shrink-0 rounded p-1 text-tertiary hover:text-secondary"
            aria-label="Toggle sidebar"
          >
            <ChevronLeft
              className={cn("h-4 w-4", collapsed && "rotate-180")}
            />
          </button>
        </div>

        <div className="flex flex-1 flex-col overflow-y-auto pb-3">
          <NavLinks />
        </div>

        <div className="border-t border-[var(--border)] p-2">
          <Link
            href="/profile"
            className={cn(
              "flex items-center gap-2.5 rounded-[var(--radius-sm)] p-2 hover:bg-[var(--surface-hover)]",
              collapsed && "justify-center"
            )}
          >
            <Avatar name={name} src={member.pfpUrl} size="sm" />
            {!collapsed && (
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm">{name}</p>
                {primaryRole && (
                  <p className="truncate text-[11px] text-tertiary">
                    {primaryRole.name}
                  </p>
                )}
              </div>
            )}
          </Link>
          <button
            onClick={() => signOut()}
            className={cn(
              "mt-0.5 flex w-full items-center gap-2.5 rounded-[var(--radius-sm)] px-2.5 py-2 text-sm text-secondary hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)]",
              collapsed && "justify-center px-0"
            )}
          >
            <LogOut className="h-4 w-4" strokeWidth={1.5} />
            {!collapsed && <span>Sign out</span>}
          </button>
        </div>
      </aside>

      <div className="fixed left-0 right-0 top-0 z-40 flex h-12 items-center justify-between border-b border-[var(--border)] bg-[var(--bg-base)] px-4 md:hidden">
        <BrandLogo height={26} />
        <button
          onClick={() => setMobileOpen(true)}
          className="p-1.5 text-secondary"
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </button>
      </div>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setMobileOpen(false)}
          />
          <div className="absolute left-0 top-0 flex h-full w-[240px] flex-col border-r border-[var(--border)] bg-[var(--bg-base)]">
            <div className="flex h-12 items-center justify-between px-3">
              <BrandLogo height={26} />
              <button
                onClick={() => setMobileOpen(false)}
                className="p-1.5 text-secondary"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <NavLinks onNavigate={() => setMobileOpen(false)} />
            <div className="border-t border-[var(--border)] p-3">
              <div className="mb-2 flex items-center gap-2.5">
                <Avatar name={name} src={member.pfpUrl} size="sm" />
                <p className="text-sm">{name}</p>
              </div>
              <button
                onClick={() => signOut()}
                className="flex items-center gap-2 text-sm text-secondary"
              >
                <LogOut className="h-4 w-4" /> Sign out
              </button>
            </div>
          </div>
        </div>
      )}

      <main
        className={cn(
          "relative flex-1 min-h-screen pt-12 md:pt-0",
          collapsed ? "md:pl-[72px]" : "md:pl-[var(--sidebar-width)]"
        )}
      >
        <div className="mx-auto w-full max-w-[1100px] px-4 py-6 md:px-6 md:py-8">
          {children}
        </div>
      </main>
    </div>
  );
}
