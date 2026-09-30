"use client";

import { useEffect, useState } from "react";
import { Moon, Sun, Monitor, Clock, ExternalLink } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/Button";
import { useTheme, type ThemeMode } from "@/lib/theme/ThemeProvider";
import { useAuth } from "@/lib/auth/AuthProvider";
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
  const { member, updateOwnProfile } = useAuth();

  const [hoursUrl, setHoursUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!member) return;
    setHoursUrl(member.volunteerHoursUrl ?? "");
  }, [member]);

  async function saveHoursUrl() {
    setError("");
    const trimmed = hoursUrl.trim();
    if (trimmed && !isHttpUrl(trimmed)) {
      setError("Enter a full link starting with https://");
      return;
    }
    setSaving(true);
    try {
      await updateOwnProfile({
        volunteerHoursUrl: trimmed,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn’t save");
    } finally {
      setSaving(false);
    }
  }

  const dirty =
    (member?.volunteerHoursUrl ?? "").trim() !== hoursUrl.trim();

  return (
    <div className="max-w-lg space-y-6">
      <PageHeader
        title="Settings"
        description="Appearance and daily tools."
      />

      <GlassCard>
        <div className="mb-4 flex items-center gap-2">
          <Clock className="h-4 w-4 text-tertiary" />
          <h2 className="text-sm font-medium">Volunteer hours tracker</h2>
        </div>
        <p className="mb-4 text-sm text-secondary">
          Paste a Google Doc, Sheet, or form link. Home will show a one-click
          “Log hours” button.
        </p>
        <label className="block text-xs text-tertiary" htmlFor="hours-url">
          Tracker URL
        </label>
        <input
          id="hours-url"
          type="url"
          inputMode="url"
          placeholder="https://docs.google.com/…"
          value={hoursUrl}
          onChange={(e) => {
            setHoursUrl(e.target.value);
            setError("");
            setSaved(false);
          }}
          className="mt-1.5 w-full rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm outline-none focus:border-[var(--accent)]"
        />
        {error && <p className="mt-2 text-xs text-red-500">{error}</p>}
        {saved && !error && (
          <p className="mt-2 text-xs text-[var(--accent)]">Saved</p>
        )}
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <Button
            type="button"
            onClick={() => void saveHoursUrl()}
            disabled={saving || !dirty}
          >
            {saving ? "Saving…" : "Save link"}
          </Button>
          {hoursUrl.trim() && isHttpUrl(hoursUrl.trim()) && (
            <a
              href={hoursUrl.trim()}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-9 items-center gap-1.5 px-2 text-sm text-secondary hover:text-[var(--text-primary)]"
            >
              Open <ExternalLink className="h-3 w-3" />
            </a>
          )}
        </div>
      </GlassCard>

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

function isHttpUrl(value: string) {
  try {
    const u = new URL(value);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}
