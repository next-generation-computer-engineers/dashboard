import {
  ApiError,
  jsonError,
  listSessions,
  patchSession,
  requireAdminSession,
} from "@/lib/sessions/server";
import type { Session } from "@/types";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, ctx: Ctx) {
  try {
    const { id } = await ctx.params;
    const { idToken } = await requireAdminSession(req);
    const body = (await req.json()) as Partial<Session>;

    if (!id) throw new ApiError(400, "session id required");

    const patch: Partial<Session> = {};
    if (typeof body.name === "string") patch.name = body.name.trim();
    if (typeof body.season === "string") patch.season = body.season.trim();
    if (typeof body.year === "number") patch.year = body.year;
    if (typeof body.startDate === "string") patch.startDate = body.startDate;
    if (typeof body.endDate === "string") patch.endDate = body.endDate;
    if (typeof body.isActive === "boolean") patch.isActive = body.isActive;

    if (patch.isActive === true) {
      try {
        const existing = await listSessions(idToken);
        await Promise.all(
          existing
            .filter((s) => s.isActive && s.id !== id)
            .map((s) =>
              patchSession(idToken, s.id, { isActive: false }).catch(() => null)
            )
        );
      } catch {
        /* ignore */
      }
    }

    await patchSession(idToken, id, patch);
    return Response.json({ ok: true, message: "Session updated." });
  } catch (err) {
    return jsonError(err);
  }
}
