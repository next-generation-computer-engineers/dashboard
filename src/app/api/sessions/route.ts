import type { Session } from "@/types";
import {
  ApiError,
  jsonError,
  listSessions,
  patchSession,
  requireAdminSession,
  saveSession,
  slugifySessionId,
} from "@/lib/sessions/server";

export const runtime = "nodejs";

export async function GET(req: Request) {
  try {
    const { idToken } = await requireAdminSession(req, [
      "admin:sessions",
      "classes:read",
      "admin:access",
    ]);
    const sessions = await listSessions(idToken);
    return Response.json({ ok: true, sessions });
  } catch (err) {
    return jsonError(err);
  }
}

export async function POST(req: Request) {
  try {
    const { idToken } = await requireAdminSession(req);
    const body = (await req.json()) as {
      name?: string;
      season?: string;
      year?: number;
      startDate?: string;
      endDate?: string;
      isActive?: boolean;
    };

    const name = body.name?.trim();
    if (!name) throw new ApiError(400, "name is required");
    const year = body.year ?? new Date().getFullYear();
    const season = body.season?.trim() || name.split(/\s+/)[0] || "Session";

    const session: Session = {
      id: slugifySessionId(name, year),
      name,
      season,
      year,
      startDate: body.startDate || `${year}-01-01`,
      endDate: body.endDate || `${year}-12-31`,
      isActive: body.isActive !== false,
    };

    // If activating this session, deactivate others best-effort
    if (session.isActive) {
      try {
        const existing = await listSessions(idToken);
        await Promise.all(
          existing
            .filter((s) => s.isActive && s.id !== session.id)
            .map((s) =>
              patchSession(idToken, s.id, { isActive: false }).catch(() => null)
            )
        );
      } catch {
        /* seed-only / empty ok */
      }
    }

    await saveSession(idToken, session);
    return Response.json({
      ok: true,
      session,
      message: `Created session ${session.name}.`,
    });
  } catch (err) {
    return jsonError(err);
  }
}
