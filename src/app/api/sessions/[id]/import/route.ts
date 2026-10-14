import type { ClassEntity } from "@/types";
import {
  ApiError,
  jsonError,
  requireAdminSession,
  upsertClass,
} from "@/lib/sessions/server";
import {
  parseClassSheet,
  rowsToClassEntities,
} from "@/lib/sessions/parseSheet";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(req: Request, ctx: Ctx) {
  try {
    const { id: sessionId } = await ctx.params;
    const { idToken } = await requireAdminSession(req);
    const body = (await req.json()) as {
      paste?: string;
      classes?: ClassEntity[];
      defaults?: {
        icebreakersUrl?: string;
        officeHoursUrl?: string;
        dateRange?: string;
      };
      replaceExisting?: boolean;
    };

    if (!sessionId) throw new ApiError(400, "session id required");

    let classes: ClassEntity[] = [];
    let parseErrors: string[] = [];

    if (Array.isArray(body.classes) && body.classes.length > 0) {
      classes = body.classes.map((c) => ({
        ...c,
        sessionId,
        id: c.id || `c_${Date.now().toString(36)}`,
      }));
    } else if (body.paste?.trim()) {
      const parsed = parseClassSheet(body.paste);
      parseErrors = parsed.errors;
      classes = rowsToClassEntities(parsed.rows, sessionId, body.defaults);
    } else {
      throw new ApiError(400, "Provide paste text or classes array");
    }

    if (classes.length === 0) {
      throw new ApiError(
        400,
        parseErrors[0] || "No classes found in paste"
      );
    }

    // Ensure unique ids within batch
    const seen = new Set<string>();
    classes = classes.map((c, i) => {
      let id = c.id;
      if (seen.has(id)) id = `${id}_${i}`;
      seen.add(id);
      return { ...c, id, sessionId };
    });

    const saved: ClassEntity[] = [];
    const failures: { id: string; error: string }[] = [];

    for (const cls of classes) {
      try {
        await upsertClass(idToken, cls);
        saved.push(cls);
      } catch (err) {
        failures.push({
          id: cls.id,
          error: err instanceof Error ? err.message : "save failed",
        });
      }
    }

    return Response.json({
      ok: failures.length === 0,
      sessionId,
      imported: saved.length,
      classes: saved,
      failures,
      parseErrors,
      message:
        failures.length === 0
          ? `Imported ${saved.length} class${saved.length === 1 ? "" : "es"}.`
          : `Imported ${saved.length}, ${failures.length} failed.`,
    });
  } catch (err) {
    return jsonError(err);
  }
}
