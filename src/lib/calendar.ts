export interface CalendarEventInput {
  title: string;
  description?: string;
  location?: string;
  url?: string;
  startsAt: string;
  endsAt?: string;
  /** Google Calendar recurrence rule, e.g. RRULE:FREQ=WEEKLY;UNTIL=20261215 */
  recurrence?: string;
}

function toGCalStamp(iso: string) {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    d.getUTCFullYear() +
    pad(d.getUTCMonth() + 1) +
    pad(d.getUTCDate()) +
    "T" +
    pad(d.getUTCHours()) +
    pad(d.getUTCMinutes()) +
    pad(d.getUTCSeconds()) +
    "Z"
  );
}

/** Open Google Calendar “create event” with prefilled fields */
export function googleCalendarUrl(event: CalendarEventInput) {
  const start = toGCalStamp(event.startsAt);
  const end = toGCalStamp(
    event.endsAt ??
      new Date(new Date(event.startsAt).getTime() + 60 * 60 * 1000).toISOString()
  );
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: event.title,
    dates: `${start}/${end}`,
    details: [event.description, event.url].filter(Boolean).join("\n"),
    location: event.location ?? event.url ?? "",
  });
  if (event.recurrence) {
    params.append("recur", event.recurrence);
  }
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

export function googleCalendarUrlForTeamEvent(input: {
  title: string;
  description?: string;
  zoomLink?: string;
  location?: string;
  startsAt: string;
  endsAt?: string;
  recurringUntil?: string;
}) {
  const recurrence = input.recurringUntil
    ? `RRULE:FREQ=WEEKLY;UNTIL=${input.recurringUntil.replace(/-/g, "")}T235959Z`
    : undefined;
  return googleCalendarUrl({
    title: input.title,
    description: input.description,
    location: input.location ?? input.zoomLink,
    url: input.zoomLink,
    startsAt: input.startsAt,
    endsAt: input.endsAt,
    recurrence,
  });
}

export function googleCalendarUrlForClass(input: {
  title: string;
  description?: string;
  zoomLink: string;
  startsAt: string;
  endsAt: string;
  recurringUntil?: string;
}) {
  return googleCalendarUrlForTeamEvent({
    title: input.title,
    description: input.description,
    zoomLink: input.zoomLink,
    location: input.zoomLink,
    startsAt: input.startsAt,
    endsAt: input.endsAt,
    recurringUntil: input.recurringUntil,
  });
}

const DAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const;

export function todayDayName(date = new Date()) {
  return DAY_NAMES[date.getDay()];
}

export function localDateKey(date: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** True if a team event falls on the given local calendar day (supports weekly recurrence). */
export function isTeamEventOnDay(
  event: {
    startsAt: string;
    endsAt?: string;
    recurringUntil?: string;
  },
  day: Date = new Date()
) {
  const dayKey = localDateKey(day);
  const start = new Date(event.startsAt);
  const startKey = localDateKey(start);

  if (!event.recurringUntil) {
    return startKey === dayKey;
  }

  // Weekly on the same weekday as original start
  if (start.getDay() !== day.getDay()) return false;
  if (dayKey < startKey) return false;
  if (dayKey > event.recurringUntil) return false;
  return true;
}

/** Next occurrence datetime for a team event (for Google Calendar links). */
export function nextOccurrenceStartsAt(
  event: { startsAt: string; recurringUntil?: string },
  from: Date = new Date()
) {
  if (!event.recurringUntil) return event.startsAt;
  const start = new Date(event.startsAt);
  const next = new Date(from);
  next.setHours(start.getHours(), start.getMinutes(), start.getSeconds(), 0);
  const delta = (start.getDay() - next.getDay() + 7) % 7;
  // If same weekday but time already passed, jump a week
  if (delta === 0 && next.getTime() < from.getTime()) {
    next.setDate(next.getDate() + 7);
  } else {
    next.setDate(next.getDate() + delta);
  }
  return next.toISOString();
}

export function nextClassOccurrence(dayOfWeek: string, hour = 10, minute = 0) {
  const target = DAY_NAMES.indexOf(
    dayOfWeek as (typeof DAY_NAMES)[number]
  );
  const now = new Date();
  const next = new Date(now);
  next.setHours(hour, minute, 0, 0);
  const delta =
    target < 0 ? 0 : (target - now.getDay() + 7) % 7 || (next > now ? 0 : 7);
  next.setDate(now.getDate() + delta);
  return next;
}
