"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  BookOpen,
  Users,
  UsersRound,
  Shield,
  LogOut,
  ChevronLeft,
  Menu,
  X,
  CalendarDays,
  Settings,
  FolderOpen,
  Bell,
  Moon,
  Sun,
} from "lucide-react";
import { useMemo, useState } from "react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth/AuthProvider";
import { hasPermission, displayName, getRolesByIds } from "@/lib/permissions";
import { Avatar } from "@/components/ui/Avatar";
import { BrandLogo } from "@/components/ui/BrandLogo";
import { useTheme } from "@/lib/theme/ThemeProvider";

const PRIMARY_NAV = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/classes", label: "My Classes", icon: BookOpen },
  { href: "/teams", label: "Opportunities", icon: UsersRound },
  { href: "/meetings", label: "Calendar", icon: CalendarDays },
  { href: "/resources", label: "Resources", icon: FolderOpen },
  { href: "/directory", label: "Directory", icon: Users },
];

function greetingForHour(hour: number) {
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function pageTitle(pathname: string) {
  if (pathname.startsWith("/classes")) return "My Classes";
  if (pathname.startsWith("/teams")) return "Opportunities";
  if (pathname.startsWith("/meetings")) return "Calendar";
  if (pathname.startsWith("/resources")) return "Resources";
  if (pathname.startsWith("/directory")) return "Directory";
  if (pathname.startsWith("/profile")) return "Profile";
  if (pathname.startsWith("/settings")) return "Settings";
  if (pathname.startsWith("/admin")) return "Admin";
  if (pathname.startsWith("/attendance")) return "Attendance";
  return null;
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { member, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const now = useMemo(() => new Date(), []);

  if (!member) return null;

  const canAdmin = hasPermission(member.roleIds, "admin:access");
  const primaryRole = getRolesByIds(member.roleIds)[0];
  const name = displayName(member);
  const firstName =
    member.preferredName?.trim() || name.split(" ")[0] || "there";
  const isHome = pathname === "/dashboard" || pathname === "/dashboard/";
  const headerTitle = isHome
    ? `${greetingForHour(now.getHours())}, ${firstName}`
    : pageTitle(pathname) ?? "CENG";

  const NavLinks = ({ onNavigate }: { onNavigate?: () => void }) => (
    <nav className="flex flex-1 flex-col gap-0.5 px-2">
      {PRIMARY_NAV.map((item) => {
        const active =
          pathname === item.href || pathname.startsWith(item.href + "/");
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "group relative flex items-center gap-2.5 rounded-[var(--radius-sm)] px-2.5 py-1.5 text-[13px] transition-colors",
              active
                ? "bg-[var(--accent-soft)] font-medium text-[var(--accent)]"
                : "text-secondary hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)]"
            )}
          >
            {active && (
              <span
                className="absolute left-0 top-1/2 h-4 w-[2px] -translate-y-1/2 rounded-full bg-[var(--accent)]"
                aria-hidden
              />
            )}
            <Icon
              className={cn(
                "h-[15px] w-[15px] shrink-0",
                active ? "text-[var(--accent)]" : "opacity-65"
              )}
              strokeWidth={1.75}
            />
            {!collapsed && <span>{item.label}</span>}
          </Link>
        );
      })}

      {canAdmin && (
        <>
          <div className="mx-2 my-2.5 h-px bg-[var(--border)]" />
          <p
            className={cn(
              "mb-1 px-2.5 text-[10px] font-medium uppercase tracking-wider text-tertiary",
              collapsed && "sr-only"
            )}
          >
            Admin
          </p>
          <Link
            href="/admin"
            onClick={onNavigate}
            className={cn(
              "relative flex items-center gap-2.5 rounded-[var(--radius-sm)] px-2.5 py-1.5 text-[13px] transition-colors",
              pathname.startsWith("/admin")
                ? "bg-[var(--accent-soft)] font-medium text-[var(--accent)]"
                : "text-secondary hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)]"
            )}
          >
            {pathname.startsWith("/admin") && (
              <span
                className="absolute left-0 top-1/2 h-4 w-[2px] -translate-y-1/2 rounded-full bg-[var(--accent)]"
                aria-hidden
              />
            )}
            <Shield
              className={cn(
                "h-[15px] w-[15px] shrink-0",
                pathname.startsWith("/admin")
                  ? "text-[var(--accent)]"
                  : "opacity-65"
              )}
              strokeWidth={1.75}
            />
            {!collapsed && <span>Admin tools</span>}
          </Link>
        </>
      )}
    </nav>
  );

  return (
    <div className="relative flex min-h-screen bg-[var(--bg-base)]">
      {/* Desktop sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-0 z-40 hidden h-screen flex-col border-r border-[var(--border)] bg-[var(--bg-base)] transition-[width] duration-200 md:flex",
          collapsed ? "w-[64px]" : "w-[var(--sidebar-width)]"
        )}
      >
        <div className="flex h-[var(--topbar-height)] items-center justify-between gap-1 overflow-visible px-3">
          <BrandLogo height={collapsed ? 22 : 28} />
          <button
            onClick={() => setCollapsed((c) => !c)}
            className="shrink-0 rounded-[var(--radius-sm)] p-1 text-tertiary hover:bg-[var(--surface-hover)] hover:text-secondary"
            aria-label="Toggle sidebar"
          >
            <ChevronLeft
              className={cn("h-3.5 w-3.5", collapsed && "rotate-180")}
            />
          </button>
        </div>

        <div className="flex flex-1 flex-col overflow-y-auto pb-3 pt-1">
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
                <p className="truncate text-[13px] font-medium">{name}</p>
                {primaryRole && (
                  <p className="truncate text-[11px] text-tertiary">
                    {primaryRole.name}
                  </p>
                )}
              </div>
            )}
          </Link>
        </div>
      </aside>

      {/* Mobile top strip */}
      <div className="fixed left-0 right-0 top-0 z-40 flex h-12 items-center justify-between overflow-visible border-b border-[var(--border)] bg-[var(--nav-glass)] px-4 backdrop-blur-md md:hidden">
        <BrandLogo height={26} />
        <button
          onClick={() => setMobileOpen(true)}
          className="rounded-[var(--radius-sm)] p-1.5 text-secondary hover:bg-[var(--surface-hover)]"
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </button>
      </div>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setMobileOpen(false)}
          />
          <div className="absolute left-0 top-0 flex h-full w-[240px] flex-col border-r border-[var(--border)] bg-[var(--bg-elevated)]">
            <div className="flex h-12 items-center justify-between overflow-visible px-3">
              <BrandLogo height={26} />
              <button
                onClick={() => setMobileOpen(false)}
                className="rounded p-1.5 text-secondary"
                aria-label="Close menu"
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

      <div
        className={cn(
          "relative flex min-h-screen flex-1 flex-col pt-12 md:pt-0",
          collapsed ? "md:pl-[64px]" : "md:pl-[var(--sidebar-width)]"
        )}
      >
        {/* Desktop / shared top bar */}
        <header className="nav-glass sticky top-0 z-30 hidden h-[var(--topbar-height)] items-center justify-between gap-4 px-5 md:flex md:px-6">
          <div className="min-w-0">
            <h1 className="truncate text-[15px] font-medium tracking-tight text-[var(--text-primary)]">
              {headerTitle}
            </h1>
          </div>

          <div className="flex shrink-0 items-center gap-1.5">
            <time
              dateTime={now.toISOString()}
              className="mr-2 hidden text-[12px] text-tertiary lg:block"
            >
              {format(now, "EEE, MMM d")}
            </time>

            <button
              type="button"
              className="rounded-[var(--radius-sm)] p-2 text-tertiary hover:bg-[var(--surface-hover)] hover:text-secondary"
              aria-label="Notifications"
              title="No new notifications"
            >
              <Bell className="h-4 w-4" strokeWidth={1.75} />
            </button>

            <button
              type="button"
              onClick={toggleTheme}
              className="rounded-[var(--radius-sm)] p-2 text-tertiary hover:bg-[var(--surface-hover)] hover:text-secondary"
              aria-label="Toggle theme"
            >
              {theme === "dark" ? (
                <Sun className="h-4 w-4" strokeWidth={1.75} />
              ) : (
                <Moon className="h-4 w-4" strokeWidth={1.75} />
              )}
            </button>

            <div className="relative ml-1">
              <button
                type="button"
                onClick={() => setMenuOpen((o) => !o)}
                className="flex items-center gap-2 rounded-[var(--radius-sm)] p-1 pr-2 hover:bg-[var(--surface-hover)]"
                aria-expanded={menuOpen}
                aria-haspopup="menu"
              >
                <Avatar name={name} src={member.pfpUrl} size="sm" />
                <span className="hidden max-w-[120px] truncate text-[12px] text-secondary xl:block">
                  {firstName}
                </span>
              </button>

              {menuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setMenuOpen(false)}
                  />
                  <div
                    role="menu"
                    className="absolute right-0 z-50 mt-1 w-48 overflow-hidden rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] py-1 shadow-[var(--shadow-md)]"
                  >
                    <Link
                      href="/profile"
                      role="menuitem"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-2 px-3 py-2 text-[13px] text-secondary hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)]"
                    >
                      Profile
                    </Link>
                    <Link
                      href="/settings"
                      role="menuitem"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-2 px-3 py-2 text-[13px] text-secondary hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)]"
                    >
                      <Settings className="h-3.5 w-3.5" />
                      Settings
                    </Link>
                    <div className="my-1 h-px bg-[var(--border)]" />
                    <button
                      role="menuitem"
                      onClick={() => {
                        setMenuOpen(false);
                        void signOut();
                      }}
                      className="flex w-full items-center gap-2 px-3 py-2 text-left text-[13px] text-secondary hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)]"
                    >
                      <LogOut className="h-3.5 w-3.5" />
                      Sign out
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        <main className="relative flex-1">
          <div className="mx-auto w-full max-w-[1080px] px-4 py-5 md:px-6 md:py-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
