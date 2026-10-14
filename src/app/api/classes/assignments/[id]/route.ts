import {
  ApiError,
  deleteAssignment,
  jsonError,
  requireAdminSession,
} from "@/lib/sessions/server";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ id: string }> };

export async function DELETE(req: Request, ctx: Ctx) {
  try {
    const { id } = await ctx.params;
    const { idToken } = await requireAdminSession(req, [
      "classes:assign",
      "classes:write",
      "admin:access",
    ]);
    if (!id) throw new ApiError(400, "assignment id required");
    await deleteAssignment(idToken, id);
    return Response.json({ ok: true, message: "Assignment removed." });
  } catch (err) {
    return jsonError(err);
  }
}
