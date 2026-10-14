import type { ClassEntity } from "@/types";
import {
  ApiError,
  jsonError,
  patchClass,
  requireAdminSession,
} from "@/lib/sessions/server";
import { COLLECTIONS } from "@/lib/firebase/schema";
import { deleteDocument, getDocument } from "@/lib/firebase/userFirestore";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(req: Request, ctx: Ctx) {
  try {
    const { id } = await ctx.params;
    const { idToken } = await requireAdminSession(req, [
      "classes:read",
      "admin:access",
      "admin:sessions",
    ]);
    const cls = await getDocument<ClassEntity>(
      idToken,
      COLLECTIONS.classes,
      id
    );
    if (!cls) throw new ApiError(404, "Class not found");
    return Response.json({ ok: true, class: cls });
  } catch (err) {
    return jsonError(err);
  }
}

export async function PATCH(req: Request, ctx: Ctx) {
  try {
    const { id } = await ctx.params;
    const { idToken } = await requireAdminSession(req);
    const body = (await req.json()) as Partial<ClassEntity>;
    if (!id) throw new ApiError(400, "class id required");

    const { id: _drop, ...patch } = body;
    await patchClass(idToken, id, patch);
    return Response.json({ ok: true, message: "Class updated." });
  } catch (err) {
    return jsonError(err);
  }
}

export async function DELETE(req: Request, ctx: Ctx) {
  try {
    const { id } = await ctx.params;
    const { idToken } = await requireAdminSession(req);
    if (!id) throw new ApiError(400, "class id required");
    await deleteDocument(idToken, COLLECTIONS.classes, id);
    return Response.json({ ok: true, message: "Class deleted." });
  } catch (err) {
    return jsonError(err);
  }
}
