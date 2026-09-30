"use client";

import { useMemo, useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { GlassCard } from "@/components/ui/GlassCard";
import type { TeamEvent, TeamEventMaterial } from "@/types";
import type { CreateTeamEventInput } from "@/lib/events/store";

function toLocalDateValue(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function toLocalTimeValue(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "18:00";
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function durationMinutes(startsAt?: string, endsAt?: string) {
  if (!startsAt || !endsAt) return "60";
  const mins = Math.round(
    (new Date(endsAt).getTime() - new Date(startsAt).getTime()) / 60000
  );
  if ([30, 45, 60, 90, 120].includes(mins)) return String(mins);
  return "60";
}

export function EventForm({
  mode,
  teamId,
  createdBy,
  initial,
  onCancel,
  onSubmit,
}: {
  mode: "create" | "edit";
  teamId: string;
  createdBy: string;
  initial?: TeamEvent;
  onCancel: () => void;
  onSubmit: (input: CreateTeamEventInput) => void;
}) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [date, setDate] = useState(
    initial ? toLocalDateValue(initial.startsAt) : ""
  );
  const [time, setTime] = useState(
    initial ? toLocalTimeValue(initial.startsAt) : "18:00"
  );
  const [duration, setDuration] = useState(
    durationMinutes(initial?.startsAt, initial?.endsAt)
  );
  const [zoomLink, setZoomLink] = useState(initial?.zoomLink ?? "");
  const [recurring, setRecurring] = useState(Boolean(initial?.recurringUntil));
  const [recurringUntil, setRecurringUntil] = useState(
    initial?.recurringUntil ?? ""
  );
  const [materials, setMaterials] = useState<{ title: string; url: string }[]>(
    initial?.materials?.length
      ? initial.materials.map((m) => ({ title: m.title, url: m.url }))
      : [{ title: "", url: "" }]
  );

  const canSubmit = useMemo(
    () => Boolean(title.trim() && date && time),
    [title, date, time]
  );

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    const startsAt = new Date(`${date}T${time}:00`);
    if (Number.isNaN(startsAt.getTime())) return;
    const endsAt = new Date(
      startsAt.getTime() + Number(duration) * 60 * 1000
    );

    const mats: TeamEventMaterial[] = materials
      .filter((m) => m.title.trim() && m.url.trim())
      .map((m, i) => ({
        id: initial?.materials[i]?.id ?? `mat_${Date.now()}_${i}`,
        title: m.title.trim(),
        url: m.url.trim(),
        type: "link" as const,
      }));

    onSubmit({
      teamId,
      title,
      description,
      startsAt: startsAt.toISOString(),
      endsAt: endsAt.toISOString(),
      zoomLink,
      materials: mats,
      recurringUntil: recurring && recurringUntil ? recurringUntil : undefined,
      createdBy: initial?.createdBy ?? createdBy,
    });
  }

  return (
    <GlassCard className="relative mb-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-medium">
          {mode === "edit" ? "Edit event" : "New team event"}
        </h2>
        <button
          type="button"
          onClick={onCancel}
          className="rounded p-1 text-tertiary hover:text-secondary"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <form onSubmit={submit} className="space-y-3">
        <div>
          <label className="mb-1 block text-xs text-tertiary">Title</label>
          <input
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="input-field"
            placeholder="Weekly curriculum sync"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-tertiary">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="input-field !h-auto !py-2.5 resize-none"
            rows={2}
            placeholder="What should people prepare?"
          />
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <div>
            <label className="mb-1 block text-xs text-tertiary">Date</label>
            <input
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="input-field"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-tertiary">Time</label>
            <input
              type="time"
              required
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="input-field"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-tertiary">Duration</label>
            <select
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              className="input-field appearance-none"
            >
              <option value="30">30 min</option>
              <option value="45">45 min</option>
              <option value="60">1 hour</option>
              <option value="90">1.5 hours</option>
              <option value="120">2 hours</option>
            </select>
          </div>
        </div>
        <div>
          <label className="mb-1 block text-xs text-tertiary">Zoom link</label>
          <input
            value={zoomLink}
            onChange={(e) => setZoomLink(e.target.value)}
            className="input-field"
            placeholder="https://zoom.us/j/…"
          />
        </div>

        <label className="flex items-center gap-2 text-sm text-secondary">
          <input
            type="checkbox"
            checked={recurring}
            onChange={(e) => setRecurring(e.target.checked)}
            className="rounded border-[var(--border)]"
          />
          Weekly recurring
        </label>
        {recurring && (
          <div>
            <label className="mb-1 block text-xs text-tertiary">
              Repeat until
            </label>
            <input
              type="date"
              value={recurringUntil}
              onChange={(e) => setRecurringUntil(e.target.value)}
              className="input-field"
            />
          </div>
        )}

        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <label className="text-xs text-tertiary">Materials</label>
            <button
              type="button"
              onClick={() =>
                setMaterials((m) => [...m, { title: "", url: "" }])
              }
              className="text-xs text-secondary hover:text-[var(--text-primary)]"
            >
              + Add link
            </button>
          </div>
          <div className="space-y-2">
            {materials.map((mat, i) => (
              <div key={i} className="grid gap-2 sm:grid-cols-2">
                <input
                  value={mat.title}
                  onChange={(e) =>
                    setMaterials((list) =>
                      list.map((item, idx) =>
                        idx === i ? { ...item, title: e.target.value } : item
                      )
                    )
                  }
                  className="input-field"
                  placeholder="Doc title"
                />
                <input
                  value={mat.url}
                  onChange={(e) =>
                    setMaterials((list) =>
                      list.map((item, idx) =>
                        idx === i ? { ...item, url: e.target.value } : item
                      )
                    )
                  }
                  className="input-field"
                  placeholder="https://…"
                />
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-2 pt-1">
          <Button type="submit" disabled={!canSubmit}>
            {mode === "edit" ? "Save changes" : "Publish to team"}
          </Button>
          <Button type="button" variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
        </div>
        <p className="text-[11px] text-tertiary">
          Teammates will see this on Home and Meetings with Join + materials.
        </p>
      </form>
    </GlassCard>
  );
}
