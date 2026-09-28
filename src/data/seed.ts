import type {
  Announcement,
  AttendanceRecord,
  ClassAssignment,
  ClassEntity,
  Meeting,
  Member,
  Resource,
  Session,
  Student,
  Task,
  TeamEvent,
  TrainingEvent,
} from "@/types";
import {
  MEMBERS,
  TEAMS,
  DEMO_USER_ID,
  getMember,
  buildClassAssignments,
} from "@/data/roster";

export { MEMBERS, TEAMS, DEMO_USER_ID, getMember };

export const CURRENT_SESSION: Session = {
  id: "session_fall_2026",
  name: "Fall 2026",
  season: "Fall",
  year: 2026,
  startDate: "2026-09-02",
  endDate: "2026-11-21",
  isActive: true,
};

const ICEBREAKERS =
  "https://docs.google.com/document/d/1xBeIImKQ23-SF33KbEoIP0UwxL0vpGjfVBOkwCh5fdA/edit";
const OFFICE_HOURS =
  "https://docs.google.com/spreadsheets/d/1e4akZyZ8yGuUhRb0dzQbiz59HsA51v5KcV3BlNGabsM/edit";

/** Classes from CENG Master Spreadsheet 26-27 — links out to Sheets / Drive / Zoom */
export const CLASSES: ClassEntity[] = [
  // —— Fall 1 (Wed) ——
  {
    id: "f1_scratch",
    sessionId: CURRENT_SESSION.id,
    name: "Scratch",
    subject: "Scratch",
    sessionLabel: "Fall 1",
    dayOfWeek: "Wednesday",
    dateRange: "Sep 2 – Oct 7, 2026",
    studentCountLabel: "36 students · Beg 29 · Int 4 · Adv 2",
    zoomLink: "https://us02web.zoom.us/j/81007054371",
    zoomMeetingId: "810 0705 4371",
    attendanceSheetUrl:
      "https://docs.google.com/spreadsheets/d/1UyQXzPh2ytHMiuRy_q3ADjwXAeRo2eLSLQl3v0WxFs0/edit",
    curriculumFolderUrl:
      "https://drive.google.com/drive/folders/13d7y1OAJM5Ir0yOARERUysHv7HJ68zWD",
    classFolderUrl:
      "https://drive.google.com/drive/folders/1s9ScqbgP-BnujxnzEh3o4XxURu0Zt8uj",
    whatsappUrl: "https://chat.whatsapp.com/CGAsRtDctVC00pgdFknFdv",
    parentPresentationUrl:
      "https://docs.google.com/presentation/d/1nEiGqkmZeZLSMm1Ikv9kqMV4vaNwB_V7dJDcPHIjTZk/edit",
    parentEmailDocUrl:
      "https://docs.google.com/document/d/1jJE6JjkfIwMBivkbBKy4RX2SndlfTrHYxUiVAea9GUo/edit",
    registrationFormUrl: "https://forms.gle/be9gUHwCh4fbmCZKA",
    icebreakersUrl: ICEBREAKERS,
    officeHoursUrl: OFFICE_HOURS,
    status: "active",
    leadTeachers: ["Logan"],
    seniorMentors: ["Harshit T", "Justin D"],
    supervisors: [],
    helpers: [],
    floaters: [],
    beginningStaff: ["Arisa Paryas", "Harshit T", "Logan Q", "Ashwin S (Shadow)"],
    intermediateStaff: ["Ben S"],
    advancedStaff: ["Justin D"],
  },
  {
    id: "f1_javascript",
    sessionId: CURRENT_SESSION.id,
    name: "JavaScript",
    subject: "JavaScript",
    sessionLabel: "Fall 1",
    dayOfWeek: "Wednesday",
    dateRange: "Sep 2 – Oct 7, 2026",
    studentCountLabel: "35 students · Beg 20 · Int 10 · Adv 5",
    zoomLink: "https://us02web.zoom.us/j/86830331514",
    zoomMeetingId: "868 3033 1514",
    attendanceSheetUrl:
      "https://docs.google.com/spreadsheets/d/1KrJtND-jTsFIgQhDHNOLvHaFSeKFNGbAfczvDMrynKQ/edit",
    curriculumFolderUrl:
      "https://drive.google.com/drive/folders/1uKIrEnM9N1gzIQAvFhf3zS0-7mgHFjij",
    classFolderUrl:
      "https://drive.google.com/drive/folders/1QmGgMH8pGpN_zrbyZkEQQ1EcSJyyqDPq",
    whatsappUrl: "https://chat.whatsapp.com/HW4WvFEpv2o4ZAP3vOXUex",
    parentPresentationUrl:
      "https://docs.google.com/presentation/d/1HgIlxfLpLs1vWVSAcmQc3jc1K1AYsHsfQVvQnZJfn7Q/edit",
    parentEmailDocUrl:
      "https://docs.google.com/document/d/1CNUq-pONsjxEDtOWaFc5rBcq7eVd8j_D5f7kPZtrQZo/edit",
    registrationFormUrl:
      "https://docs.google.com/forms/d/e/1FAIpQLSd472iOludHvMYrtg6zscldINM9BJMw0XX5s63hqsg6ZxHLWw/viewform",
    icebreakersUrl: ICEBREAKERS,
    officeHoursUrl: OFFICE_HOURS,
    status: "active",
    leadTeachers: ["Quinn", "Cinty (backup)"],
    seniorMentors: ["Carsten"],
    supervisors: [],
    helpers: [],
    floaters: [],
    beginningStaff: ["Carsten", "Damian SL", "Arjun Kalwane"],
    intermediateStaff: ["Cinty", "Soum"],
    advancedStaff: ["Quinn Daniel"],
  },
  {
    id: "f1_python",
    sessionId: CURRENT_SESSION.id,
    name: "Python",
    subject: "Python",
    sessionLabel: "Fall 1",
    dayOfWeek: "Wednesday",
    dateRange: "Sep 2 – Oct 7, 2026",
    studentCountLabel: "33 students · Beg 18 · Int 9 · Adv 4",
    zoomLink: "https://us02web.zoom.us/j/89217300880",
    zoomMeetingId: "892 1730 0880",
    attendanceSheetUrl:
      "https://docs.google.com/spreadsheets/d/14bjpmbT_Sjup5Aa0p9BttTcfhWOdRUiKQUzNjcTpkYE/edit",
    curriculumFolderUrl:
      "https://drive.google.com/drive/folders/16aQwos_uDLRMkeNz7jwoA8NFBiiWRekE",
    classFolderUrl:
      "https://drive.google.com/drive/folders/1T0FJziPenEhIZnbxnetnz6w6yX7XC_gA",
    whatsappUrl: "https://chat.whatsapp.com/Bjoy5FRqi0h2gnqTalUA4h",
    parentPresentationUrl:
      "https://docs.google.com/presentation/d/1XDB2mUstDwB3cRfJ-hNHm-n2Zba1gVufS5icMHgP6d4/edit",
    parentEmailDocUrl:
      "https://docs.google.com/document/d/1o-CUmpbbwFDuI0inQpreUzXYInwC4jDqdvbzd6DxL4w/edit",
    registrationFormUrl:
      "https://docs.google.com/forms/d/e/1FAIpQLSdI4DPWuktKOLms8eEc84rIKTdyob-LVgIVtJA4SxPgkACoxg/viewform",
    icebreakersUrl: ICEBREAKERS,
    officeHoursUrl: OFFICE_HOURS,
    status: "active",
    leadTeachers: ["Viba"],
    seniorMentors: ["Jinsol Kim"],
    supervisors: [],
    helpers: [],
    floaters: [],
    beginningStaff: ["Maximilian Tjiong", "Rohan Joseph"],
    intermediateStaff: ["Aadya (Shadow)", "Rohan Sharma"],
    advancedStaff: ["Viba"],
  },
  // —— Fall 2 (Sat) ——
  {
    id: "f2_scratch",
    sessionId: CURRENT_SESSION.id,
    name: "Scratch",
    subject: "Scratch",
    sessionLabel: "Fall 2",
    dayOfWeek: "Saturday",
    dateRange: "Sep 5 – Oct 10, 2026",
    studentCountLabel: "45 students · Beg 26 · Int 12 · Adv 7",
    zoomLink: "https://us02web.zoom.us/j/83224707952",
    zoomMeetingId: "832 2470 7952",
    attendanceSheetUrl:
      "https://docs.google.com/spreadsheets/d/1iwj9jlIywEk9_S5aS7sp-DCI99ni4m5ZvDuqF7XGhfI/edit",
    curriculumFolderUrl:
      "https://drive.google.com/drive/folders/13d7y1OAJM5Ir0yOARERUysHv7HJ68zWD",
    classFolderUrl:
      "https://drive.google.com/drive/folders/1YAqp_A-jI4bBUVeaVxxZfRz9fVN7hDNp",
    whatsappUrl: "https://chat.whatsapp.com/EwUfx4SpXkfH8eR0maCREc",
    parentPresentationUrl:
      "https://docs.google.com/presentation/d/154v9U0FUy8SzjJq6kEB0jbHplVOtmqHKn-YWdTjlaF4/edit",
    parentEmailDocUrl:
      "https://docs.google.com/document/d/1_XAEZGKnyKxKVF0QXpEKY6r7KT_WKZolAYeIDh_xxlQ/edit",
    icebreakersUrl: ICEBREAKERS,
    officeHoursUrl: OFFICE_HOURS,
    status: "active",
    leadTeachers: ["Elijah"],
    seniorMentors: ["Anjali"],
    supervisors: ["Alice"],
    helpers: [],
    floaters: [],
    beginningStaff: ["Anjali", "Elijah", "Carter", "Evan Chen", "Marcus"],
    intermediateStaff: ["Lior Balan", "Ben Sim"],
    advancedStaff: ["Dylan Wang"],
  },
  {
    id: "f2_javascript",
    sessionId: CURRENT_SESSION.id,
    name: "JavaScript",
    subject: "JavaScript",
    sessionLabel: "Fall 2",
    dayOfWeek: "Saturday",
    dateRange: "Sep 5 – Oct 10, 2026",
    studentCountLabel: "36 students · Beg 25 · Int 4 · Adv 7",
    zoomLink: "https://us02web.zoom.us/j/84143972362",
    zoomMeetingId: "841 4397 2362",
    attendanceSheetUrl:
      "https://docs.google.com/spreadsheets/d/1ZdTkmulIyfXz11ASQ04B86tJzKZ_yX1pQjKlWlkzyh8/edit",
    curriculumFolderUrl:
      "https://drive.google.com/drive/folders/1uKIrEnM9N1gzIQAvFhf3zS0-7mgHFjij",
    classFolderUrl:
      "https://drive.google.com/drive/folders/1WYou7dfous0K23pYjnKodQJP21QqYuGW",
    whatsappUrl: "https://chat.whatsapp.com/IaQ0PoeuaFIFDkpPcQepXx",
    parentPresentationUrl:
      "https://docs.google.com/presentation/d/1INmPsVZS4O0QnkfTvvjX8LbX46RRh4bnXC56KMSj9U4/edit",
    parentEmailDocUrl:
      "https://docs.google.com/document/d/1SQS0jfWlpLgjQEYPW9tZcGHgbSaCOpsBWgc9RZtxBwg/edit",
    icebreakersUrl: ICEBREAKERS,
    officeHoursUrl: OFFICE_HOURS,
    status: "active",
    leadTeachers: ["Lia"],
    seniorMentors: ["Evan O"],
    supervisors: ["Jay"],
    helpers: [],
    floaters: [],
    beginningStaff: ["Dhruv", "Evan Olmstead", "Arjun Kalwane", "Ewan"],
    intermediateStaff: ["Lia"],
    advancedStaff: ["Quinn Daniel"],
  },
  {
    id: "f2_python",
    sessionId: CURRENT_SESSION.id,
    name: "Python",
    subject: "Python",
    sessionLabel: "Fall 2",
    dayOfWeek: "Saturday",
    dateRange: "Sep 5 – Oct 10, 2026",
    studentCountLabel: "49 students · Beg 20 · Int 15 · Adv 14",
    zoomLink: "https://us02web.zoom.us/j/83606069625",
    zoomMeetingId: "836 0606 9625",
    attendanceSheetUrl:
      "https://docs.google.com/spreadsheets/d/1ANpUPmnZd3mmqJSdnbTrfQICjYKfkodQ7ZqfN-8RuXk/edit",
    curriculumFolderUrl:
      "https://drive.google.com/drive/folders/16aQwos_uDLRMkeNz7jwoA8NFBiiWRekE",
    classFolderUrl:
      "https://drive.google.com/drive/folders/1-a8XeLEOZaEusM_v26IopKqGOxx0lCQb",
    whatsappUrl: "https://chat.whatsapp.com/JiPRB7HQAJGLefRg81zdkX",
    parentPresentationUrl:
      "https://docs.google.com/presentation/d/1-dwmJsZPP4TRDMSs7rdlXB2obNvP0UuMVs6hX1I5Lk0/edit",
    parentEmailDocUrl:
      "https://docs.google.com/document/d/1OyLBDQAMBNAKKT3U8rw6NkxpiJY_-m9hwBB4JIyzSbY/edit",
    icebreakersUrl: ICEBREAKERS,
    officeHoursUrl: OFFICE_HOURS,
    status: "active",
    leadTeachers: ["Omri"],
    seniorMentors: ["Saranya"],
    supervisors: ["Jay"],
    helpers: [],
    floaters: [],
    beginningStaff: ["Omri M", "Lydia Chang", "Rivaan A", "Yevhen"],
    intermediateStaff: ["Ethan Tan", "Damian SL", "Saksham Srivastava"],
    advancedStaff: ["Braxton C", "Vedanth Venganti"],
  },
  {
    id: "f2_robotics",
    sessionId: CURRENT_SESSION.id,
    name: "Robotics",
    subject: "Robotics",
    sessionLabel: "Fall 2",
    dayOfWeek: "Saturday",
    dateRange: "Sep 5 – Oct 10, 2026",
    studentCountLabel: "47 students · Beg 25 · Int 22",
    zoomLink: "https://us06web.zoom.us/j/86292936296",
    zoomMeetingId: "862 9293 6296",
    attendanceSheetUrl:
      "https://docs.google.com/spreadsheets/d/1KmVRfeyKkhw4Sq4opG-TNpikKhaUj2k9N657XUBTDFs/edit",
    curriculumFolderUrl:
      "https://drive.google.com/drive/folders/1UrJdrbVHf5irf80txe0BMLM0kMetFWvl",
    classFolderUrl:
      "https://drive.google.com/drive/folders/14Ov1nezKJMU9zdzkY3kD34Sahgr766UR",
    whatsappUrl: "https://chat.whatsapp.com/Gk0hVSxm1Zu3ahb1TOGdm2",
    parentPresentationUrl:
      "https://docs.google.com/presentation/d/1NQ3DgWLunvG4vczCgefw-M9C-ueIcE3lyOEUs7XTAuY/edit",
    parentEmailDocUrl:
      "https://docs.google.com/document/d/13NlQKKi83tWs-IYNUQHEza4QIG_t_gSgyQsR_Q6Cyfs/edit",
    icebreakersUrl: ICEBREAKERS,
    officeHoursUrl: OFFICE_HOURS,
    status: "active",
    leadTeachers: ["Karthik Y"],
    seniorMentors: ["Om K"],
    supervisors: ["Om K"],
    helpers: [],
    floaters: ["Om K"],
    beginningStaff: ["Zachary W", "Evan T", "Shrihaan Z", "Ricky Z", "Andy Mujica"],
    intermediateStaff: ["Karthik", "Tommy"],
    advancedStaff: [],
  },
];

export const CLASS_ASSIGNMENTS = buildClassAssignments(CLASSES, CURRENT_SESSION.id);

export const STUDENTS: Student[] = [];

function atLocal(daysFromNow: number, hour: number, minute = 0) {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
}

function daysUntilWeekday(weekday: number) {
  const now = new Date();
  return (weekday - now.getDay() + 7) % 7;
}

export const SEED_TEAM_EVENTS: TeamEvent[] = [
  {
    id: "te_robotics_sync",
    teamId: "team_robotics_curriculum",
    title: "Robotics curriculum weekly sync",
    description:
      "Review next week's labs, assign slide owners, and flag hardware gaps.",
    // Anchor on today's weekday at 6pm so Home can demo "today" when weekday matches;
    // with recurrence it also shows every week on this weekday.
    startsAt: atLocal(0, 18, 0),
    endsAt: atLocal(0, 19, 0),
    zoomLink: "https://us02web.zoom.us/j/86292936296",
    materials: [
      {
        id: "mat1",
        title: "Robotics Curriculum 2026",
        url: "https://drive.google.com/drive/folders/1UrJdrbVHf5irf80txe0BMLM0kMetFWvl",
        type: "drive",
      },
      {
        id: "mat2",
        title: "Week plan doc",
        url: "https://docs.google.com/document/d/1xBeIImKQ23-SF33KbEoIP0UwxL0vpGjfVBOkwCh5fdA/edit",
        type: "doc",
      },
    ],
    recurringUntil: "2026-12-15",
    createdBy: "v_om_anand_khaunte",
    createdAt: new Date().toISOString(),
  },
  {
    id: "te_robotics_build",
    teamId: "team_robotics_curriculum",
    title: "Sensor unit build night",
    description: "Pair programming on the ultrasonic sensor lesson kit.",
    startsAt: atLocal(Math.max(daysUntilWeekday(4), 1) || 4, 19, 0),
    endsAt: atLocal(Math.max(daysUntilWeekday(4), 1) || 4, 20, 30),
    zoomLink: "https://us02web.zoom.us/j/86292936296",
    materials: [
      {
        id: "mat3",
        title: "Build checklist",
        url: "https://docs.google.com/spreadsheets/d/1e4akZyZ8yGuUhRb0dzQbiz59HsA51v5KcV3BlNGabsM/edit",
        type: "sheet",
      },
    ],
    createdBy: "v_karthik_yarakaraju",
    createdAt: new Date().toISOString(),
  },
];

export const ANNOUNCEMENTS: Announcement[] = [
  {
    id: "a1",
    title: "Fall session — open your class day screen before Zoom",
    body: "Use Join Zoom, Attendance sheet, and Curriculum from your class welcome screen.",
    authorId: "v_om_anand_khaunte",
    audience: "all",
    pinned: true,
    createdAt: "2026-03-20T10:00:00Z",
  },
  {
    id: "a2",
    title: "Curriculum sync — Tuesday 7pm",
    body: "Latest lesson folders are linked from each class day screen.",
    authorId: "v_justin_ding",
    audience: "team",
    audienceId: "team_curriculum",
    pinned: false,
    createdAt: "2026-03-22T15:00:00Z",
  },
  {
    id: "a3",
    title: "New volunteer approval queue",
    body: "Three pending members await admin review in Member Management.",
    authorId: "v_annie_liu",
    audience: "admins",
    pinned: false,
    createdAt: "2026-03-24T09:00:00Z",
  },
];

export const TASKS: Task[] = [
  {
    id: "t1",
    title: "Prep Python week 5 project brief",
    assigneeIds: ["v_om_anand_khaunte"],
    dueDate: "2026-03-28",
    status: "in_progress",
    priority: "high",
    classId: "f2_python",
    createdBy: "v_om_anand_khaunte",
    createdAt: "2026-03-18T00:00:00Z",
  },
  {
    id: "t2",
    title: "Confirm Saturday room booking",
    assigneeIds: ["v_marcus_tang"],
    dueDate: "2026-03-27",
    status: "todo",
    priority: "medium",
    createdBy: "v_annie_liu",
    createdAt: "2026-03-19T00:00:00Z",
  },
  {
    id: "t3",
    title: "Upload robotics BOM to resources",
    assigneeIds: ["v_justin_ding", "v_harshit_hershey_tiwari"],
    dueDate: "2026-03-30",
    status: "todo",
    priority: "medium",
    classId: "f2_robotics",
    teamId: "team_curriculum",
    createdBy: "v_justin_ding",
    createdAt: "2026-03-20T00:00:00Z",
  },
];

export const RESOURCES: Resource[] = [
  {
    id: "res_python_slides",
    title: "Python Foundations — Week 1–4 Slides",
    type: "slide",
    url: "#",
    classIds: ["f2_python"],
    tags: ["python", "slides"],
    createdBy: "v_om_anand_khaunte",
    createdAt: "2026-01-10T00:00:00Z",
  },
  {
    id: "res_python_lab1",
    title: "Lab: Turtle Graphics",
    type: "doc",
    url: "#",
    classIds: ["f2_python"],
    tags: ["python", "lab"],
    createdBy: "v_om_anand_khaunte",
    createdAt: "2026-01-17T00:00:00Z",
  },
  {
    id: "res_web_kit",
    title: "Web Studio Starter Kit",
    type: "link",
    url: "#",
    classIds: ["f2_javascript"],
    tags: ["web"],
    createdBy: "v_mel_kirti",
    createdAt: "2026-01-12T00:00:00Z",
  },
  {
    id: "res_robotics_guide",
    title: "Robotics Lab Safety & Setup",
    type: "doc",
    url: "#",
    classIds: ["f2_robotics"],
    tags: ["robotics", "safety"],
    createdBy: "v_justin_ding",
    createdAt: "2026-01-15T00:00:00Z",
  },
];

export const MEETINGS: Meeting[] = [
  {
    id: "mt1",
    title: "All-hands standup",
    date: "2026-03-28",
    time: "18:00",
    zoomLink: "https://zoom.us/j/allhands",
  },
  {
    id: "mt2",
    title: "Curriculum office hours",
    date: "2026-03-29",
    time: "19:00",
    teamId: "team_curriculum",
    location: "Discord #curriculum",
  },
];

export const TRAINING_EVENTS: TrainingEvent[] = [
  {
    id: "tr1",
    title: "New Volunteer Orientation",
    description: "Mission, culture, classroom norms, and tools walkthrough.",
    type: "orientation",
    date: "2026-03-30T17:00:00Z",
    zoomLink: "https://zoom.us/j/orientation",
    required: true,
    completedBy: ["v_om_anand_khaunte", "v_annie_liu", "v_justin_ding", "v_anjali_vashisht", "v_mel_kirti", "v_zoe_allanic", "v_alice_lee"],
  },
  {
    id: "tr2",
    title: "Classroom Safety Certification",
    description: "Required before leading or floating in-person sessions.",
    type: "certification",
    date: "2026-04-02T18:00:00Z",
    required: true,
    completedBy: ["v_om_anand_khaunte", "v_mel_kirti", "v_justin_ding", "v_zoe_allanic"],
  },
  {
    id: "tr3",
    title: "Teaching Office Hours",
    description: "Drop-in coaching for lead teachers and mentors.",
    type: "office_hours",
    date: "2026-04-05T19:00:00Z",
    location: "Zoom",
    required: false,
    completedBy: [],
  },
];

export const ATTENDANCE_SEED: AttendanceRecord[] = [
  {
    id: "att1",
    classId: "f2_python",
    date: "2026-03-21",
    subjectId: "s1",
    subjectType: "student",
    status: "present",
    markedBy: "v_om_anand_khaunte",
    markedAt: "2026-03-21T10:05:00Z",
  },
  {
    id: "att2",
    classId: "f2_python",
    date: "2026-03-21",
    subjectId: "s2",
    subjectType: "student",
    status: "late",
    markedBy: "v_om_anand_khaunte",
    markedAt: "2026-03-21T10:12:00Z",
  },
  {
    id: "att3",
    classId: "f2_python",
    date: "2026-03-21",
    subjectId: "s3",
    subjectType: "student",
    status: "absent",
    markedBy: "v_om_anand_khaunte",
    markedAt: "2026-03-21T10:20:00Z",
  },
];

export function getClass(id: string) {
  return CLASSES.find((c) => c.id === id);
}

export function getTeam(id: string) {
  return TEAMS.find((t) => t.id === id);
}

export function assignmentsForMember(memberId: string) {
  return CLASS_ASSIGNMENTS.filter((a) => a.memberId === memberId);
}

export function assignmentsForClass(classId: string) {
  return CLASS_ASSIGNMENTS.filter((a) => a.classId === classId);
}

export function membersForClass(classId: string) {
  return assignmentsForClass(classId)
    .map((a) => ({ assignment: a, member: getMember(a.memberId) }))
    .filter((x): x is { assignment: ClassAssignment; member: Member } =>
      Boolean(x.member)
    );
}
