"use client";

import { Moon, Sun, Monitor } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { GlassCard } from "@/components/ui/GlassCard";
import { useTheme, type ThemeMode } from "@/lib/theme/ThemeProvider";
import { cn } from "@/lib/utils";

const OPTIONS: {
  id: ThemeMode;
  label: string;
  description: string;
  icon: typeof Sun;
}[] = [
  {
    id: "light",
    label: "Light",
    description: "Bright surfaces for daytime use",
    icon: Sun,
  },
  {
    id: "dark",
    label: "Dark",
    description: "Low-glare interface for evenings",
    icon: Moon,
  },
];

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="max-w-lg">
      <PageHeader
        title="Settings"
        description="Appearance and account preferences."
      />

      <GlassCard>
        <div className="mb-4 flex items-center gap-2">
          <Monitor className="h-4 w-4 text-tertiary" />
          <h2 className="text-sm font-medium">Appearance</h2>
        </div>
        <p className="mb-4 text-sm text-secondary">
          Choose light or dark mode. Your preference is saved on this device.
        </p>

        <div className="grid gap-2 sm:grid-cols-2">
          {OPTIONS.map((opt) => {
            const Icon = opt.icon;
            const active = theme === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => setTheme(opt.id)}
                className={cn(
                  "rounded-[var(--radius-md)] border px-4 py-3.5 text-left transition-colors",
                  active
                    ? "border-[var(--accent)] bg-[var(--accent-soft)]"
                    : "border-[var(--border)] hover:bg-[var(--surface-hover)]"
                )}
              >
                <div className="flex items-center gap-2">
                  <Icon
                    className={cn(
                      "h-4 w-4",
                      active ? "text-[var(--accent)]" : "text-tertiary"
                    )}
                  />
                  <span className="text-sm font-medium">{opt.label}</span>
                </div>
                <p className="mt-1.5 text-xs text-tertiary">{opt.description}</p>
              </button>
            );
          })}
        </div>
      </GlassCard>
    </div>
  );
}
