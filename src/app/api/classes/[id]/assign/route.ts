import type { ClassAssignment, ClassRoleKey } from "@/types";
import {
  ApiError,
  jsonError,
  requireAdminSession,
  saveAssignment,
} from "@/lib/sessions/server";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ id: string }> };

const ROLES: ClassRoleKey[] = [
  "lead_teacher",
  "teacher",
  "senior_mentor",
  "mentor",
  "helper",
  "floater",
  "shadow",
  "substitute",
];

export async function POST(req: Request, ctx: Ctx) {
  try {
    const { id: classId } = await ctx.params;
    const { idToken } = await requireAdminSession(req, [
      "classes:assign",
      "classes:write",
      "admin:access",
    ]);
    const body = (await req.json()) as {
      memberId?: string;
      classRole?: ClassRoleKey;
      sessionId?: string;
      status?: ClassAssignment["status"];
    };

    if (!classId) throw new ApiError(400, "class id required");
    if (!body.memberId) throw new ApiError(400, "memberId required");
    if (!body.classRole || !ROLES.includes(body.classRole)) {
      throw new ApiError(400, "valid classRole required");
    }
    if (!body.sessionId) throw new ApiError(400, "sessionId required");

    const now = new Date().toISOString();
    const assignment: ClassAssignment = {
      id: `ca_${classId}_${body.memberId}`.slice(0, 80),
      classId,
      memberId: body.memberId,
      classRole: body.classRole,
      status: body.status ?? "confirmed",
      sessionId: body.sessionId,
      createdAt: now,
      updatedAt: now,
    };

    await saveAssignment(idToken, assignment);
    return Response.json({
      ok: true,
      assignment,
      message: "Volunteer assigned.",
    });
  } catch (err) {
    return jsonError(err);
  }
}
