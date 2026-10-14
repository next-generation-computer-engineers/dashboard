import type { ClassEntity } from "@/types";
import {
  ApiError,
  jsonError,
  listClasses,
  requireAdminSession,
  upsertClass,
} from "@/lib/sessions/server";
import { slugifyClassId } from "@/lib/sessions/parseSheet";

export const runtime = "nodejs";

export async function GET(req: Request) {
  try {
    const { idToken } = await requireAdminSession(req, [
      "admin:sessions",
      "classes:read",
      "admin:access",
    ]);
    const url = new URL(req.url);
    const sessionId = url.searchParams.get("sessionId") || undefined;
    const classes = await listClasses(idToken, sessionId);
    return Response.json({ ok: true, classes });
  } catch (err) {
    return jsonError(err);
  }
}

export async function POST(req: Request) {
  try {
    const { idToken } = await requireAdminSession(req);
    const body = (await req.json()) as Partial<ClassEntity> & {
      sessionId?: string;
      name?: string;
    };

    if (!body.sessionId?.trim()) throw new ApiError(400, "sessionId required");
    if (!body.name?.trim()) throw new ApiError(400, "name required");

    const emptyStaff = {
      leadTeachers: [] as string[],
      seniorMentors: [] as string[],
      supervisors: [] as string[],
      helpers: [] as string[],
      floaters: [] as string[],
      beginningStaff: [] as string[],
      intermediateStaff: [] as string[],
      advancedStaff: [] as string[],
    };

    const cls: ClassEntity = {
      id: body.id || `${slugifyClassId(body.name, body.sessionLabel)}_new`,
      sessionId: body.sessionId.trim(),
      name: body.name.trim(),
      subject: (body.subject || body.name).trim(),
      sessionLabel: (body.sessionLabel || "Session").trim(),
      dayOfWeek: (body.dayOfWeek || "TBD").trim(),
      timeStart: body.timeStart,
      timeEnd: body.timeEnd,
      dateRange: body.dateRange || "TBD",
      studentCountLabel: body.studentCountLabel,
      zoomLink: body.zoomLink || "",
      zoomMeetingId: body.zoomMeetingId,
      attendanceSheetUrl: body.attendanceSheetUrl || "",
      curriculumFolderUrl: body.curriculumFolderUrl || "",
      classFolderUrl: body.classFolderUrl,
      whatsappUrl: body.whatsappUrl,
      parentPresentationUrl: body.parentPresentationUrl,
      parentEmailDocUrl: body.parentEmailDocUrl,
      registrationFormUrl: body.registrationFormUrl,
      icebreakersUrl: body.icebreakersUrl,
      officeHoursUrl: body.officeHoursUrl,
      description: body.description,
      status: body.status ?? "active",
      leadTeachers: body.leadTeachers ?? emptyStaff.leadTeachers,
      seniorMentors: body.seniorMentors ?? emptyStaff.seniorMentors,
      supervisors: body.supervisors ?? emptyStaff.supervisors,
      helpers: body.helpers ?? emptyStaff.helpers,
      floaters: body.floaters ?? emptyStaff.floaters,
      beginningStaff: body.beginningStaff ?? emptyStaff.beginningStaff,
      intermediateStaff: body.intermediateStaff ?? emptyStaff.intermediateStaff,
      advancedStaff: body.advancedStaff ?? emptyStaff.advancedStaff,
    };

    await upsertClass(idToken, cls);
    return Response.json({
      ok: true,
      class: cls,
      message: `Saved ${cls.name}.`,
    });
  } catch (err) {
    return jsonError(err);
  }
}
