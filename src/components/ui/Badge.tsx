import { cn } from "@/lib/utils";
import type { Role } from "@/types";

export function RoleBadge({
  role,
  className,
  compact,
}: {
  role: Pick<Role, "name" | "color">;
  className?: string;
  compact?: boolean;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded border border-[var(--border)] bg-transparent font-medium text-secondary",
        compact ? "px-1.5 py-0.5 text-[10px]" : "px-2 py-0.5 text-[11px]",
        className
      )}
    >
      {role.name}
    </span>
  );
}

export function StatusDot({
  status,
  label,
}: {
  status: "active" | "inactive" | "pending" | "alumni" | string;
  label?: string;
}) {
  const colors: Record<string, string> = {
    active: "bg-[var(--success)]",
    inactive: "bg-white/25",
    pending: "bg-[var(--warning)]",
    alumni: "bg-[var(--info)]",
  };
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-secondary">
      <span
        className={cn(
          "h-1.5 w-1.5 rounded-full",
          colors[status] ?? "bg-white/30"
        )}
      />
      {label ?? status}
    </span>
  );
}
