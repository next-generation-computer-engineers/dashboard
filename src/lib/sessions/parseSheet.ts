import type { ClassEntity } from "@/types";

/** Normalized keys we accept from a pasted Google Sheet / CSV / TSV header row. */
const HEADER_MAP: Record<string, keyof ParsedClassRow> = {
  name: "name",
  class: "name",
  "class name": "name",
  subject: "subject",
  session: "sessionLabel",
  "session label": "sessionLabel",
  "session name": "sessionLabel",
  block: "sessionLabel",
  day: "dayOfWeek",
  "day of week": "dayOfWeek",
  weekday: "dayOfWeek",
  "date range": "dateRange",
  dates: "dateRange",
  "time start": "timeStart",
  start: "timeStart",
  "time end": "timeEnd",
  end: "timeEnd",
  students: "studentCountLabel",
  "student count": "studentCountLabel",
  "student count label": "studentCountLabel",
  zoom: "zoomLink",
  "zoom link": "zoomLink",
  "zoom url": "zoomLink",
  "meeting id": "zoomMeetingId",
  "zoom meeting id": "zoomMeetingId",
  "zoom id": "zoomMeetingId",
  attendance: "attendanceSheetUrl",
  "attendance sheet": "attendanceSheetUrl",
  "attendance sheet url": "attendanceSheetUrl",
  curriculum: "curriculumFolderUrl",
  "curriculum folder": "curriculumFolderUrl",
  "curriculum folder url": "curriculumFolderUrl",
  "class folder": "classFolderUrl",
  "class folder url": "classFolderUrl",
  whatsapp: "whatsappUrl",
  "whatsapp url": "whatsappUrl",
  "parent presentation": "parentPresentationUrl",
  "parent presentation url": "parentPresentationUrl",
  "parent email": "parentEmailDocUrl",
  "parent email doc": "parentEmailDocUrl",
  "parent email doc url": "parentEmailDocUrl",
  registration: "registrationFormUrl",
  "registration form": "registrationFormUrl",
  "registration form url": "registrationFormUrl",
  icebreakers: "icebreakersUrl",
  "icebreakers url": "icebreakersUrl",
  "office hours": "officeHoursUrl",
  "office hours url": "officeHoursUrl",
  description: "description",
  "lead teachers": "leadTeachers",
  "lead teacher": "leadTeachers",
  leads: "leadTeachers",
  "senior mentors": "seniorMentors",
  "senior mentor": "seniorMentors",
  supervisors: "supervisors",
  supervisor: "supervisors",
  helpers: "helpers",
  helper: "helpers",
  floaters: "floaters",
  floater: "floaters",
  beginning: "beginningStaff",
  "beginning staff": "beginningStaff",
  beg: "beginningStaff",
  intermediate: "intermediateStaff",
  "intermediate staff": "intermediateStaff",
  int: "intermediateStaff",
  advanced: "advancedStaff",
  "advanced staff": "advancedStaff",
  adv: "advancedStaff",
};

export type ParsedClassRow = {
  name?: string;
  subject?: string;
  sessionLabel?: string;
  dayOfWeek?: string;
  dateRange?: string;
  timeStart?: string;
  timeEnd?: string;
  studentCountLabel?: string;
  zoomLink?: string;
  zoomMeetingId?: string;
  attendanceSheetUrl?: string;
  curriculumFolderUrl?: string;
  classFolderUrl?: string;
  whatsappUrl?: string;
  parentPresentationUrl?: string;
  parentEmailDocUrl?: string;
  registrationFormUrl?: string;
  icebreakersUrl?: string;
  officeHoursUrl?: string;
  description?: string;
  leadTeachers?: string[];
  seniorMentors?: string[];
  supervisors?: string[];
  helpers?: string[];
  floaters?: string[];
  beginningStaff?: string[];
  intermediateStaff?: string[];
  advancedStaff?: string[];
};

const LIST_FIELDS = new Set<keyof ParsedClassRow>([
  "leadTeachers",
  "seniorMentors",
  "supervisors",
  "helpers",
  "floaters",
  "beginningStaff",
  "intermediateStaff",
  "advancedStaff",
]);

function normalizeHeader(h: string) {
  return h.trim().toLowerCase().replace(/\s+/g, " ");
}

function splitList(value: string): string[] {
  return value
    .split(/[,;/|]+|\n/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function parseLine(line: string): string[] {
  // Prefer tab (Google Sheets paste). Fall back to CSV-ish split.
  if (line.includes("\t")) return line.split("\t").map((c) => c.trim());
  const cells: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]!;
    if (ch === '"') {
      inQuotes = !inQuotes;
      continue;
    }
    if (ch === "," && !inQuotes) {
      cells.push(cur.trim());
      cur = "";
      continue;
    }
    cur += ch;
  }
  cells.push(cur.trim());
  return cells;
}

export type ParseSheetResult = {
  rows: ParsedClassRow[];
  headers: string[];
  mappedHeaders: (keyof ParsedClassRow | null)[];
  errors: string[];
};

/** Parse pasted spreadsheet text (header row + data rows). */
export function parseClassSheet(raw: string): ParseSheetResult {
  const errors: string[] = [];
  const text = raw.replace(/\r\n/g, "\n").replace(/\r/g, "\n").trim();
  if (!text) {
    return { rows: [], headers: [], mappedHeaders: [], errors: ["Paste is empty"] };
  }

  const lines = text.split("\n").filter((l) => l.trim().length > 0);
  if (lines.length < 2) {
    return {
      rows: [],
      headers: [],
      mappedHeaders: [],
      errors: ["Need a header row plus at least one class row"],
    };
  }

  const headers = parseLine(lines[0]!);
  const mappedHeaders = headers.map((h) => {
    const key = HEADER_MAP[normalizeHeader(h)];
    return key ?? null;
  });

  if (!mappedHeaders.includes("name") && !mappedHeaders.includes("subject")) {
    errors.push(
      'Could not find a "Class" / "Name" / "Subject" column. Check the header row.'
    );
  }

  const rows: ParsedClassRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cells = parseLine(lines[i]!);
    const row: ParsedClassRow = {};
    let hasAny = false;
    mappedHeaders.forEach((key, idx) => {
      if (!key) return;
      const rawCell = cells[idx]?.trim() ?? "";
      if (!rawCell) return;
      hasAny = true;
      if (LIST_FIELDS.has(key)) {
        (row as Record<string, unknown>)[key] = splitList(rawCell);
      } else {
        (row as Record<string, unknown>)[key] = rawCell;
      }
    });
    if (!hasAny) continue;
    if (!row.name && row.subject) row.name = row.subject;
    if (!row.subject && row.name) row.subject = row.name;
    if (!row.name) {
      errors.push(`Row ${i + 1}: missing class name — skipped`);
      continue;
    }
    rows.push(row);
  }

  return { rows, headers, mappedHeaders, errors };
}

export function slugifyClassId(name: string, sessionLabel?: string) {
  const base = `${sessionLabel || ""}_${name}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "")
    .slice(0, 48);
  return base || `class_${Date.now().toString(36)}`;
}

/** Turn parsed rows into ClassEntity drafts for a session. */
export function rowsToClassEntities(
  rows: ParsedClassRow[],
  sessionId: string,
  defaults?: Partial<
    Pick<
      ClassEntity,
      "icebreakersUrl" | "officeHoursUrl" | "status" | "dateRange"
    >
  >
): ClassEntity[] {
  const nowLabel = defaults?.dateRange || "";
  return rows.map((r, idx) => {
    const id = `${slugifyClassId(r.name!, r.sessionLabel)}_${idx.toString(36)}`;
    return {
      id,
      sessionId,
      name: r.name!.trim(),
      subject: (r.subject || r.name!).trim(),
      sessionLabel: (r.sessionLabel || "Session").trim(),
      dayOfWeek: (r.dayOfWeek || "TBD").trim(),
      timeStart: r.timeStart?.trim(),
      timeEnd: r.timeEnd?.trim(),
      dateRange: (r.dateRange || nowLabel || "TBD").trim(),
      studentCountLabel: r.studentCountLabel?.trim(),
      zoomLink: (r.zoomLink || "").trim(),
      zoomMeetingId: r.zoomMeetingId?.trim(),
      attendanceSheetUrl: (r.attendanceSheetUrl || "").trim(),
      curriculumFolderUrl: (r.curriculumFolderUrl || "").trim(),
      classFolderUrl: r.classFolderUrl?.trim(),
      whatsappUrl: r.whatsappUrl?.trim(),
      parentPresentationUrl: r.parentPresentationUrl?.trim(),
      parentEmailDocUrl: r.parentEmailDocUrl?.trim(),
      registrationFormUrl: r.registrationFormUrl?.trim(),
      icebreakersUrl: r.icebreakersUrl?.trim() || defaults?.icebreakersUrl,
      officeHoursUrl: r.officeHoursUrl?.trim() || defaults?.officeHoursUrl,
      description: r.description?.trim(),
      status: defaults?.status ?? "active",
      leadTeachers: r.leadTeachers ?? [],
      seniorMentors: r.seniorMentors ?? [],
      supervisors: r.supervisors ?? [],
      helpers: r.helpers ?? [],
      floaters: r.floaters ?? [],
      beginningStaff: r.beginningStaff ?? [],
      intermediateStaff: r.intermediateStaff ?? [],
      advancedStaff: r.advancedStaff ?? [],
    };
  });
}

export const SHEET_TEMPLATE_HEADERS = [
  "Class",
  "Session Label",
  "Day",
  "Date Range",
  "Students",
  "Zoom Link",
  "Zoom Meeting ID",
  "Attendance Sheet",
  "Curriculum Folder",
  "Class Folder",
  "WhatsApp",
  "Parent Presentation",
  "Parent Email",
  "Registration Form",
  "Lead Teachers",
  "Senior Mentors",
  "Supervisors",
  "Helpers",
  "Floaters",
  "Beginning Staff",
  "Intermediate Staff",
  "Advanced Staff",
].join("\t");
